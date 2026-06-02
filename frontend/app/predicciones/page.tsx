'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { ChevronDown, Check, Calendar, Grid3x3 } from 'lucide-react'
import { TopNav } from '@/components/top-nav'
import { Footer } from '@/components/footer'
import { CountryFlag } from '@/components/country-flag'
import { ToastProvider, useToast } from '@/components/toast'
import { useAuth } from '@/lib/auth-context'

const BAIN = {
  red: '#CC0000',
  redHover: '#990000',
  black: '#000000',
  white: '#FFFFFF',
  grayBg: '#F5F5F5',
  grayBorder: '#E5E5E5',
  graySecondary: '#666666',
  grayTertiary: '#999999',
  success: '#0F7B3E',
  classified: '#1A7A3E',
} as const

const TZ = 'America/Argentina/Buenos_Aires'
const DAYS_ES = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO']
const MONTHS_ES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE']

type ViewMode = 'fecha' | 'grupo'
type Predictions = Record<string, { home: number | ''; away: number | '' }>

type ApiEquipo = { id: string; nombre_pais: string; codigo_iso: string; bandera_url: string | null }
type ApiPartido = {
  id: string; fecha_hora: string; estadio: string | null; ciudad: string | null
  fase: string; grupo_fase: string | null; estado: string
  goles_local: number | null; goles_visitante: number | null
  equipo_local: ApiEquipo; equipo_visitante: ApiEquipo
}
type DisplayMatch = {
  id: string; group: string
  home: string; homeUrl: string | null; homeName: string; homeId: string
  away: string; awayUrl: string | null; awayName: string; awayId: string
  dateSort: string; dateLabel: string; time: string; venue: string; estado: string
}
type StandingRow = {
  id: string; name: string; code: string; url: string | null
  pj: number; gf: number; gc: number; dg: number; pts: number
}

function toDisplayMatch(p: ApiPartido): DisplayMatch {
  const d = new Date(p.fecha_hora)
  const inTz = new Date(d.toLocaleString('en-US', { timeZone: TZ }))
  const dateSort = `${inTz.getFullYear()}-${String(inTz.getMonth() + 1).padStart(2, '0')}-${String(inTz.getDate()).padStart(2, '0')}`
  const dateLabel = `${DAYS_ES[inTz.getDay()]} ${inTz.getDate()} DE ${MONTHS_ES[inTz.getMonth()]}`
  const time = `${String(inTz.getHours()).padStart(2, '0')}.${String(inTz.getMinutes()).padStart(2, '0')}`
  return {
    id: p.id,
    group: p.grupo_fase ?? '',
    home: p.equipo_local.codigo_iso,
    homeUrl: p.equipo_local.bandera_url,
    homeName: p.equipo_local.nombre_pais,
    homeId: p.equipo_local.id,
    away: p.equipo_visitante.codigo_iso,
    awayUrl: p.equipo_visitante.bandera_url,
    awayName: p.equipo_visitante.nombre_pais,
    awayId: p.equipo_visitante.id,
    dateSort,
    dateLabel,
    time,
    venue: [p.estadio, p.ciudad].filter(Boolean).join(', '),
    estado: p.estado,
  }
}

function calcGroupStandings(groupMatches: DisplayMatch[], predictions: Predictions): StandingRow[] {
  const table: Record<string, StandingRow> = {}
  for (const m of groupMatches) {
    if (!table[m.homeId]) table[m.homeId] = { id: m.homeId, name: m.homeName, code: m.home, url: m.homeUrl, pj: 0, gf: 0, gc: 0, dg: 0, pts: 0 }
    if (!table[m.awayId]) table[m.awayId] = { id: m.awayId, name: m.awayName, code: m.away, url: m.awayUrl, pj: 0, gf: 0, gc: 0, dg: 0, pts: 0 }
  }
  for (const m of groupMatches) {
    const pred = predictions[m.id]
    if (!pred || pred.home === '' || pred.away === '') continue
    const hg = Number(pred.home), ag = Number(pred.away)
    table[m.homeId].pj++; table[m.homeId].gf += hg; table[m.homeId].gc += ag
    table[m.awayId].pj++; table[m.awayId].gf += ag; table[m.awayId].gc += hg
    if (hg > ag) table[m.homeId].pts += 3
    else if (hg < ag) table[m.awayId].pts += 3
    else { table[m.homeId].pts += 1; table[m.awayId].pts += 1 }
  }
  return Object.values(table)
    .map(t => ({ ...t, dg: t.gf - t.gc }))
    .sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf)
}

function PrediccionesContent() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState<ViewMode>('fecha')
  const [matches, setMatches] = useState<DisplayMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [predictions, setPredictions] = useState<Predictions>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/partidos?fase=grupos')
      .then(r => r.json())
      .then(({ data }) => { if (data) setMatches((data as ApiPartido[]).map(toDisplayMatch)) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!user) return
    fetch(`/api/predicciones?usuario_id=${user.id}`)
      .then(r => r.json())
      .then(({ data }) => {
        if (!data) return
        const mapped: Predictions = {}
        for (const p of data) mapped[p.partido_id] = { home: p.goles_local, away: p.goles_visitante }
        setPredictions(mapped)
      })
      .catch(() => {})
  }, [user])

  const loadedCount = useMemo(
    () => Object.values(predictions).filter(p => p.home !== '' && p.away !== '').length,
    [predictions]
  )

  const updatePrediction = useCallback(
    async (matchId: string, side: 'home' | 'away', value: string) => {
      const parsed = value === '' ? '' : Math.max(0, Math.min(20, Number(value) || 0))
      const prev = predictions
      const next: Predictions = {
        ...prev,
        [matchId]: { ...prev[matchId], home: prev[matchId]?.home ?? '', away: prev[matchId]?.away ?? '', [side]: parsed },
      }
      setPredictions(next)
      const current = next[matchId]
      if (current.home !== '' && current.away !== '' && user) {
        setSavingId(matchId)
        try {
          await fetch('/api/predicciones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario_id: user.id, partido_id: matchId, goles_local: current.home, goles_visitante: current.away }),
          })
          const match = matches.find(m => m.id === matchId)
          if (match && (!prev[matchId] || prev[matchId].home === '')) {
            toast({ message: `Guardado: ${match.homeName} ${current.home}–${current.away} ${match.awayName}`, type: 'success', duration: 2000 })
          }
        } catch {
          toast({ message: 'Error al guardar predicción', type: 'error', duration: 2000 })
        } finally {
          setSavingId(null)
        }
      }
    },
    [predictions, user, toast, matches]
  )

  const clearPrediction = useCallback((matchId: string) => {
    setPredictions(prev => { const next = { ...prev }; delete next[matchId]; return next })
    toast({ message: 'Predicción borrada', type: 'info', duration: 1500 })
  }, [toast])

  const dayGroups = useMemo(() => {
    const map = new Map<string, DisplayMatch[]>()
    for (const m of matches) {
      if (!map.has(m.dateSort)) map.set(m.dateSort, [])
      map.get(m.dateSort)!.push(m)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateSort, ms]) => ({ dateSort, dateLabel: ms[0].dateLabel, matches: ms }))
  }, [matches])

  const groupSections = useMemo(() => {
    const map = new Map<string, DisplayMatch[]>()
    for (const m of matches) {
      if (!map.has(m.group)) map.set(m.group, [])
      map.get(m.group)!.push(m)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([group, ms]) => ({ group, matches: ms }))
  }, [matches])

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: BAIN.grayBg }}>
      <TopNav activePage="predicciones" />
      <div className="sticky top-16 z-40" style={{ backgroundColor: BAIN.white, borderBottom: `1px solid ${BAIN.grayBorder}` }}>
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between gap-4">
          <nav className="flex items-center gap-1" role="tablist">
            <ViewTab icon={<Calendar size={14} strokeWidth={2} />} label="Por fecha" active={viewMode === 'fecha'} onClick={() => setViewMode('fecha')} />
            <ViewTab icon={<Grid3x3 size={14} strokeWidth={2} />} label="Por grupo" active={viewMode === 'grupo'} onClick={() => setViewMode('grupo')} />
          </nav>
          <button type="button" className="hidden sm:flex items-center gap-2 text-sm py-2 px-3 rounded-md flex-shrink-0" style={{ border: `1px solid ${BAIN.grayBorder}`, color: BAIN.black, backgroundColor: BAIN.white }}>
            Fase: Grupos <ChevronDown size={14} />
          </button>
        </div>
      </div>
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-10">
        <section className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2" style={{ color: BAIN.black }}>Predicciones</h1>
            <p className="text-sm" style={{ color: BAIN.graySecondary }}>
              {viewMode === 'fecha' ? 'Cargá tus pronósticos partido por partido, ordenados por fecha.' : 'Mirá cómo quedarían los grupos según tus predicciones.'}
            </p>
          </div>
          <div className="rounded-md px-4 py-3" style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}` }}>
            <p className="text-xs font-medium mb-1" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>CARGADAS</p>
            <p className="text-xl font-bold tracking-tight" style={{ color: BAIN.black }}>
              <span style={{ color: BAIN.red }}>{loadedCount}</span>
              <span style={{ color: BAIN.grayTertiary }}> / {matches.length}</span>
            </p>
          </div>
        </section>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: `${BAIN.red} transparent transparent transparent` }} />
          </div>
        ) : viewMode === 'fecha' ? (
          <>
            {dayGroups.map((day, dayIdx) => (
              <section key={day.dateSort} className="mb-8 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${dayIdx * 50}ms`, animationFillMode: 'backwards', animationDuration: '400ms' }}>
                <h2 className="text-xs font-bold uppercase mb-3" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>{day.dateLabel}</h2>
                <div className="flex flex-col gap-3">
                  {day.matches.map(m => (
                    <MatchCard key={m.id} match={m} prediction={predictions[m.id] ?? { home: '', away: '' }} onUpdate={updatePrediction} onClear={clearPrediction} showGroup saving={savingId === m.id} />
                  ))}
                </div>
              </section>
            ))}
          </>
        ) : (
          <>
            {groupSections.map((g, gIdx) => (
              <GroupSection key={g.group} groupKey={g.group} matches={g.matches} predictions={predictions} onUpdate={updatePrediction} onClear={clearPrediction} delay={gIdx * 50} />
            ))}
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}

function GroupSection({ groupKey, matches, predictions, onUpdate, onClear, delay }: {
  groupKey: string; matches: DisplayMatch[]
  predictions: Predictions; onUpdate: (id: string, side: 'home' | 'away', v: string) => void
  onClear: (id: string) => void; delay: number
}) {
  const [expanded, setExpanded] = useState(groupKey === 'J')
  const standings = useMemo(() => calcGroupStandings(matches, predictions), [matches, predictions])
  const completedMatches = matches.filter(m => { const p = predictions[m.id]; return p && p.home !== '' && p.away !== '' }).length
  const teamNames = useMemo(() => {
    const seen = new Set<string>(); const names: string[] = []
    for (const m of matches) {
      if (!seen.has(m.homeId)) { seen.add(m.homeId); names.push(m.homeName) }
      if (!seen.has(m.awayId)) { seen.add(m.awayId); names.push(m.awayName) }
    }
    return names.join(' · ')
  }, [matches])

  return (
    <section className="mb-6 rounded-md overflow-hidden animate-in fade-in slide-in-from-bottom-2" style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}`, animationDelay: `${delay}ms`, animationFillMode: 'backwards', animationDuration: '400ms' }}>
      <button type="button" onClick={() => setExpanded(s => !s)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-md flex items-center justify-center font-bold text-base" style={{ backgroundColor: BAIN.black, color: BAIN.white }}>{groupKey}</div>
          <div className="text-left">
            <p className="text-base font-bold tracking-tight" style={{ color: BAIN.black }}>Grupo {groupKey}</p>
            <p className="text-xs truncate max-w-xs" style={{ color: BAIN.graySecondary }}>{teamNames}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold" style={{ color: completedMatches === 6 ? BAIN.success : BAIN.graySecondary }}>{completedMatches}/6 cargados</span>
          <ChevronDown size={18} strokeWidth={2} style={{ color: BAIN.graySecondary, transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
        </div>
      </button>
      {expanded && (
        <div className="px-6 pb-6 grid grid-cols-1 lg:grid-cols-5 gap-6" style={{ borderTop: `1px solid ${BAIN.grayBorder}` }}>
          <div className="lg:col-span-3 pt-6">
            <p className="text-xs font-bold uppercase mb-3" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>PARTIDOS DEL GRUPO</p>
            <div className="flex flex-col gap-3">
              {matches.map(m => <MatchCard key={m.id} match={m} prediction={predictions[m.id] ?? { home: '', away: '' }} onUpdate={onUpdate} onClear={onClear} compact />)}
            </div>
          </div>
          <div className="lg:col-span-2 pt-6">
            <p className="text-xs font-bold uppercase mb-3" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>SI TUS PREDICCIONES SE CUMPLEN</p>
            <StandingsTable standings={standings} />
            <p className="text-xs mt-3" style={{ color: BAIN.graySecondary }}>Los 2 primeros pasan a 16vos.<br /><span style={{ color: BAIN.grayTertiary }}>+ 8 mejores terceros de los 12 grupos.</span></p>
          </div>
        </div>
      )}
    </section>
  )
}

function StandingsTable({ standings }: { standings: StandingRow[] }) {
  const allEmpty = standings.every(r => r.pj === 0)
  return (
    <div className="rounded-md overflow-hidden" style={{ border: `1px solid ${BAIN.grayBorder}` }}>
      <table className="w-full text-xs">
        <thead>
          <tr style={{ backgroundColor: BAIN.grayBg }}>
            <th className="text-left px-2 py-2 font-bold uppercase w-6" style={{ color: BAIN.graySecondary, letterSpacing: '0.06em' }}></th>
            <th className="text-left px-2 py-2 font-bold uppercase" style={{ color: BAIN.graySecondary, letterSpacing: '0.06em' }}>EQUIPO</th>
            <th className="text-center px-1 py-2 font-bold uppercase" title="Partidos jugados" style={{ color: BAIN.graySecondary, letterSpacing: '0.06em' }}>PJ</th>
            <th className="text-center px-1 py-2 font-bold uppercase" title="Diferencia de goles" style={{ color: BAIN.graySecondary, letterSpacing: '0.06em' }}>DG</th>
            <th className="text-center px-1 py-2 font-bold uppercase" title="Puntos" style={{ color: BAIN.graySecondary, letterSpacing: '0.06em' }}>PTS</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, idx) => {
            const isClassified = idx < 2 && !allEmpty
            const isThird = idx === 2 && !allEmpty
            return (
              <tr key={row.id} style={{ backgroundColor: isClassified ? '#1A7A3E10' : isThird ? '#1A7A3E05' : BAIN.white, borderTop: `1px solid ${BAIN.grayBorder}` }}>
                <td className="px-2 py-2.5"><span className="inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold" style={{ backgroundColor: isClassified ? '#1A7A3E' : BAIN.grayBg, color: isClassified ? BAIN.white : BAIN.graySecondary }}>{idx + 1}</span></td>
                <td className="px-2 py-2.5"><div className="flex items-center gap-2"><CountryFlag code={row.code} url={row.url ?? undefined} size="sm" /><span className="font-medium truncate" style={{ color: BAIN.black, fontSize: '12px' }}>{row.name}</span></div></td>
                <td className="px-1 py-2.5 text-center" style={{ color: BAIN.graySecondary }}>{row.pj}</td>
                <td className="px-1 py-2.5 text-center font-medium" style={{ color: row.dg > 0 ? BAIN.success : row.dg < 0 ? BAIN.red : BAIN.black }}>{row.pj === 0 ? '—' : row.dg > 0 ? `+${row.dg}` : row.dg}</td>
                <td className="px-1 py-2.5 text-center font-bold" style={{ color: BAIN.black }}>{row.pts}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ViewTab({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" role="tab" aria-selected={active} onClick={onClick} className="text-sm font-medium px-4 py-3 transition-colors whitespace-nowrap flex items-center gap-2" style={{ color: active ? BAIN.black : BAIN.graySecondary, borderBottom: `2px solid ${active ? BAIN.red : 'transparent'}` }}>
      <span style={{ color: active ? BAIN.red : BAIN.graySecondary }}>{icon}</span>
      {label}
    </button>
  )
}

function MatchCard({ match, prediction, onUpdate, onClear, showGroup = false, compact = false, saving = false }: {
  match: DisplayMatch; prediction: { home: number | ''; away: number | '' }
  onUpdate: (id: string, side: 'home' | 'away', v: string) => void; onClear: (id: string) => void
  showGroup?: boolean; compact?: boolean; saving?: boolean
}) {
  const isComplete = prediction.home !== '' && prediction.away !== ''
  return (
    <div className="rounded-md transition-all" style={{ backgroundColor: BAIN.white, border: `1px solid ${isComplete ? BAIN.success + '40' : BAIN.grayBorder}`, padding: compact ? '14px 16px' : '20px' }}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>{showGroup && `GRUPO ${match.group} · `}{match.time}</span>
          {saving && <span className="text-[10px] text-gray-400 uppercase">guardando…</span>}
          {isComplete && !saving && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ backgroundColor: `${BAIN.success}15`, color: BAIN.success, letterSpacing: '0.06em' }}>
              <Check size={10} strokeWidth={3} />GUARDADA
            </span>
          )}
        </div>
        {!compact && <span className="text-xs" style={{ color: BAIN.graySecondary }}>{match.venue}</span>}
      </div>
      <div className="grid grid-cols-3 items-center gap-3">
        <div className="flex items-center gap-2 justify-end">
          <div className="text-right hidden sm:block min-w-0"><p className="text-sm font-bold truncate" style={{ color: BAIN.black }}>{match.homeName}</p></div>
          <CountryFlag code={match.home} url={match.homeUrl ?? undefined} size={compact ? 'sm' : 'md'} />
          <input type="number" min="0" max="20" placeholder="0" value={prediction.home} onChange={e => onUpdate(match.id, 'home', e.target.value)} className="w-14 h-11 text-center text-lg font-bold rounded-md focus:outline-none transition-colors" style={{ border: `1px solid ${prediction.home !== '' ? BAIN.black : BAIN.grayBorder}`, backgroundColor: BAIN.white, color: BAIN.black }} aria-label={`Goles de ${match.homeName}`} />
        </div>
        <div className="text-center"><span className="text-sm" style={{ color: BAIN.graySecondary }}>vs</span></div>
        <div className="flex items-center gap-2 justify-start">
          <input type="number" min="0" max="20" placeholder="0" value={prediction.away} onChange={e => onUpdate(match.id, 'away', e.target.value)} className="w-14 h-11 text-center text-lg font-bold rounded-md focus:outline-none transition-colors" style={{ border: `1px solid ${prediction.away !== '' ? BAIN.black : BAIN.grayBorder}`, backgroundColor: BAIN.white, color: BAIN.black }} aria-label={`Goles de ${match.awayName}`} />
          <CountryFlag code={match.away} url={match.awayUrl ?? undefined} size={compact ? 'sm' : 'md'} />
          <div className="hidden sm:block min-w-0"><p className="text-sm font-bold truncate" style={{ color: BAIN.black }}>{match.awayName}</p></div>
        </div>
      </div>
      {!compact && (
        <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: `1px solid ${BAIN.grayBorder}` }}>
          <p className="text-xs" style={{ color: BAIN.graySecondary }}>Tu predicción se guarda automáticamente</p>
          {isComplete && <button type="button" onClick={() => onClear(match.id)} className="text-xs font-medium hover:underline" style={{ color: BAIN.graySecondary }}>Limpiar</button>}
        </div>
      )}
      {compact && isComplete && <div className="flex justify-end mt-2"><button type="button" onClick={() => onClear(match.id)} className="text-xs font-medium hover:underline" style={{ color: BAIN.graySecondary }}>Limpiar</button></div>}
    </div>
  )
}

export default function PrediccionesPage() {
  return (
    <ToastProvider>
      <PrediccionesContent />
    </ToastProvider>
  )
}