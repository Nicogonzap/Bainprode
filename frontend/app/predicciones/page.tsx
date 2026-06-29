'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { ChevronDown, Check, Calendar, Grid3x3, Save, CloudOff, Lock, BarChart2, AlertTriangle, Trophy } from 'lucide-react'
import { TopNav } from '@/components/top-nav'
import { Footer } from '@/components/footer'
import { CountryFlag } from '@/components/country-flag'
import { ToastProvider, useToast } from '@/components/toast'
import { useAuth } from '@/lib/auth-context'

const BAIN = {
  red: '#CC0000',
  black: '#000000',
  white: '#FFFFFF',
  grayBg: '#F5F5F5',
  grayBorder: '#E5E5E5',
  graySecondary: '#666666',
  grayTertiary: '#999999',
  success: '#0F7B3E',
} as const

const TZ = 'America/Argentina/Buenos_Aires'
const DAYS_ES = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO']
const MONTHS_ES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE']
const MONTHS_SHORT = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

// Fases de playoff: nombre tal cual viene de la base -> título lindo para mostrar.
// El orden del array define en qué orden aparecen las secciones.
const PLAYOFF_FASES: { key: string; label: string }[] = [
  { key: '16vos', label: 'Dieciseisavos de final' },
  { key: 'octavos', label: 'Octavos de final' },
  { key: 'cuartos', label: 'Cuartos de final' },
  { key: 'semifinal', label: 'Semifinales' },
  { key: 'tercer_puesto', label: 'Tercer puesto' },
  { key: 'final', label: 'Final' },
]

type ViewMode = 'fecha' | 'grupo' | 'resultados' | 'playoffs'
type Predictions = Record<string, { home: number | ''; away: number | '' }>
type PredPoints = Record<string, number | null>

type ApiEquipo = { id: string; nombre_pais: string; codigo_iso: string; bandera_url: string | null }
type ApiPartido = {
  id: string; fecha_hora: string; estadio: string | null; ciudad: string | null
  fase: string; grupo_fase: string | null; estado: string
  goles_local: number | null; goles_visitante: number | null
  equipo_local: ApiEquipo | null; equipo_visitante: ApiEquipo | null
}
type DisplayMatch = {
  id: string; group: string; fase: string
  home: string; homeUrl: string | null; homeName: string; homeId: string
  away: string; awayUrl: string | null; awayName: string; awayId: string
  dateSort: string; dateLabel: string; shortDate: string; time: string; venue: string; estado: string; fecha_hora: string; golesLocal: number | null; golesVisitante: number | null
  teamsConfirmed: boolean
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
  const shortDate = `${inTz.getDate()} ${MONTHS_SHORT[inTz.getMonth()]}`
  const time = `${String(inTz.getHours()).padStart(2, '0')}.${String(inTz.getMinutes()).padStart(2, '0')}`
  const teamsConfirmed = p.equipo_local !== null && p.equipo_visitante !== null
  return {
    id: p.id,
    group: p.grupo_fase ?? '',
    fase: p.fase,
    home: p.equipo_local?.codigo_iso ?? '',
    homeUrl: p.equipo_local?.bandera_url ?? null,
    homeName: p.equipo_local?.nombre_pais ?? 'Por definir',
    homeId: p.equipo_local?.id ?? '',
    away: p.equipo_visitante?.codigo_iso ?? '',
    awayUrl: p.equipo_visitante?.bandera_url ?? null,
    awayName: p.equipo_visitante?.nombre_pais ?? 'Por definir',
    awayId: p.equipo_visitante?.id ?? '',
    dateSort, dateLabel, shortDate, time,
    venue: [p.estadio, p.ciudad].filter(Boolean).join(', '),
    estado: p.estado,
    fecha_hora: p.fecha_hora,
    golesLocal: p.goles_local,
    golesVisitante: p.goles_visitante,
    teamsConfirmed,
  }
}

function calcGroupStandings(groupMatches: DisplayMatch[], predictions: Predictions): StandingRow[] {
  const table: Record<string, StandingRow> = {}
  for (const m of groupMatches) {
    if (!table[m.homeId]) table[m.homeId] = { id: m.homeId, name: m.homeName, code: m.home, url: m.homeUrl, pj: 0, gf: 0, gc: 0, dg: 0, pts: 0 }
    if (!table[m.awayId]) table[m.awayId] = { id: m.awayId, name: m.awayName, code: m.away, url: m.awayUrl, pj: 0, gf: 0, gc: 0, dg: 0, pts: 0 }
  }
  for (const m of groupMatches) {
    let hg: number, ag: number
    if (m.estado === 'finalizado' && m.golesLocal !== null && m.golesVisitante !== null) {
      hg = m.golesLocal; ag = m.golesVisitante
    } else {
      const pred = predictions[m.id]
      if (!pred || pred.home === '' || pred.away === '') continue
      hg = Number(pred.home); ag = Number(pred.away)
    }
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
  const [viewMode, setViewMode] = useState<ViewMode>('grupo')
  const [matches, setMatches] = useState<DisplayMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [predictions, setPredictions] = useState<Predictions>({})
  const [saving, setSaving] = useState(false)
  const [allMatches, setAllMatches] = useState<DisplayMatch[]>([])
  const [allMatchesLoading, setAllMatchesLoading] = useState(false)
  const [predPoints, setPredPoints] = useState<PredPoints>({})

  useEffect(() => {
    fetch('/api/partidos')
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
        const pts: PredPoints = {}
        for (const p of data) {
          mapped[p.partido_id] = { home: p.goles_local, away: p.goles_visitante }
          pts[p.partido_id] = p.puntos_obtenidos ?? null
        }
        setPredictions(mapped)
        setPredPoints(pts)
      })
      .catch(() => {})
  }, [user])

  const loadedCount = useMemo(
    () => Object.values(predictions).filter(p => p.home !== '' && p.away !== '').length,
    [predictions]
  )

  const updatePrediction = useCallback((matchId: string, side: 'home' | 'away', value: string) => {
    const parsed = value === '' ? '' : Math.max(0, Math.min(20, Number(value) || 0))
    setPredictions(prev => ({
      ...prev,
      [matchId]: { ...prev[matchId], home: prev[matchId]?.home ?? '', away: prev[matchId]?.away ?? '', [side]: parsed },
    }))
  }, [])

  const clearPrediction = useCallback((matchId: string) => {
    setPredictions(prev => { const next = { ...prev }; delete next[matchId]; return next })
  }, [])

  // Guarda TODAS las predicciones con scores completos en un solo request
  const saveAll = useCallback(async () => {
    if (!user) return
    const toSave = Object.entries(predictions)
      .filter(([, p]) => p.home !== '' && p.away !== '')
      .map(([partido_id, p]) => ({
        usuario_id: user.id,
        partido_id,
        goles_local: Number(p.home),
        goles_visitante: Number(p.away),
      }))

    if (toSave.length === 0) {
      toast({ message: 'Completá al menos un resultado antes de guardar', type: 'info', duration: 2500 })
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/predicciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSave),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al guardar')
      toast({
        message: `${toSave.length} predicción${toSave.length !== 1 ? 'es' : ''} guardada${toSave.length !== 1 ? 's' : ''}`,
        type: 'success',
        duration: 3000,
      })
    } catch (e: any) {
      toast({ message: e.message || 'Error al guardar predicciones', type: 'error', duration: 3000 })
    } finally {
      setSaving(false)
    }
  }, [user, predictions, toast])

  useEffect(() => {
    if (viewMode !== 'resultados' || allMatches.length > 0) return
    setAllMatchesLoading(true)
    fetch('/api/partidos')
      .then(r => r.json())
      .then(({ data }) => { if (data) setAllMatches((data as ApiPartido[]).map(toDisplayMatch)) })
      .catch(() => {})
      .finally(() => setAllMatchesLoading(false))
  }, [viewMode, allMatches.length])

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
      if (m.fase !== 'grupos') continue
      if (!map.has(m.group)) map.set(m.group, [])
      map.get(m.group)!.push(m)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([group, ms]) => ({ group, matches: ms }))
  }, [matches])

  // Secciones de playoff (16vos en adelante), agrupadas por fase y en orden.
  const playoffSections = useMemo(() => {
    const byFase = new Map<string, DisplayMatch[]>()
    for (const m of matches) {
      if (m.fase === 'grupos') continue
      if (!byFase.has(m.fase)) byFase.set(m.fase, [])
      byFase.get(m.fase)!.push(m)
    }
    // Ordenar las fases según PLAYOFF_FASES; las desconocidas van al final.
    return Array.from(byFase.entries())
      .map(([fase, ms]) => {
        const def = PLAYOFF_FASES.find(f => f.key === fase)
        return {
          fase,
          label: def?.label ?? fase,
          order: def ? PLAYOFF_FASES.indexOf(def) : 999,
          matches: ms.sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora)),
        }
      })
      .sort((a, b) => a.order - b.order)
  }, [matches])

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: BAIN.grayBg }}>
      <TopNav activePage="predicciones" />

      {/* Toolbar sticky con guardado global */}
      <div className="sticky top-16 z-40" style={{ backgroundColor: BAIN.white, borderBottom: `1px solid ${BAIN.grayBorder}` }}>
        <div className="max-w-[1200px] mx-auto px-3 sm:px-6 flex items-center justify-between gap-2 h-14">
          <nav className="flex items-center gap-1" role="tablist">
            <ViewTab icon={<Grid3x3 size={14} strokeWidth={2} />} label="Por grupo" active={viewMode === 'grupo'} onClick={() => setViewMode('grupo')} />
            <ViewTab icon={<Calendar size={14} strokeWidth={2} />} label="Por fecha" active={viewMode === 'fecha'} onClick={() => setViewMode('fecha')} />
            <ViewTab icon={<Trophy size={14} strokeWidth={2} />} label="Playoffs" active={viewMode === 'playoffs'} onClick={() => setViewMode('playoffs')} />
            <ViewTab icon={<BarChart2 size={14} strokeWidth={2} />} label="Mis resultados" active={viewMode === 'resultados'} onClick={() => setViewMode('resultados')} />
          </nav>
          <button
            type="button"
            onClick={saveAll}
            disabled={saving || !user}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-md text-sm font-bold flex-shrink-0 transition-all"
            style={{
              backgroundColor: saving ? BAIN.grayBorder : BAIN.red,
              color: saving ? BAIN.graySecondary : BAIN.white,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: !user ? 0.5 : 1,
            }}
          >
            {saving
              ? <><div className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${BAIN.graySecondary} transparent transparent transparent` }} /><span className="hidden sm:inline">Guardando…</span></>
              : <><Save size={14} strokeWidth={2.5} /><span className="hidden sm:inline">Guardar</span> ({loadedCount})</>
            }
          </button>
        </div>
      </div>

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <section className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2" style={{ color: BAIN.black }}>Predicciones</h1>
            <p className="text-sm" style={{ color: BAIN.graySecondary }}>
              Cargá los resultados y guardá con el botón <strong>Guardar</strong> en la barra superior.
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
        ) : viewMode === 'grupo' ? (
          <>
            {groupSections.map((g, gIdx) => (
              <GroupSection
                key={g.group}
                groupKey={g.group}
                matches={g.matches}
                predictions={predictions}
                onUpdate={updatePrediction}
                onClear={clearPrediction}
                delay={gIdx * 50}
              />
            ))}
          </>
        ) : viewMode === 'playoffs' ? (
          <>
            {playoffSections.length > 0 ? (
              playoffSections.map((p, pIdx) => (
                <PlayoffSection
                  key={p.fase}
                  label={p.label}
                  matches={p.matches}
                  predictions={predictions}
                  onUpdate={updatePrediction}
                  onClear={clearPrediction}
                  delay={pIdx * 50}
                />
              ))
            ) : (
              <div className="rounded-md p-10 text-center" style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}` }}>
                <p className="text-sm" style={{ color: BAIN.graySecondary }}>Todavía no hay partidos de playoffs cargados.</p>
              </div>
            )}
          </>
        ) : viewMode === 'resultados' ? (
          <ResultsView
            allMatches={allMatches}
            loading={allMatchesLoading}
            predictions={predictions}
            predPoints={predPoints}
          />
        ) : (
          <>
            {dayGroups.map((day, dayIdx) => (
              <section key={day.dateSort} className="mb-8 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${dayIdx * 50}ms`, animationFillMode: 'backwards', animationDuration: '400ms' }}>
                <h2 className="text-xs font-bold uppercase mb-3" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>{day.dateLabel}</h2>
                <div className="flex flex-col gap-3">
                  {day.matches.map(m => (
                    <MatchCard key={m.id} match={m} prediction={predictions[m.id] ?? { home: '', away: '' }} onUpdate={updatePrediction} onClear={clearPrediction} showGroup />
                  ))}
                </div>
              </section>
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
  predictions: Predictions
  onUpdate: (id: string, side: 'home' | 'away', v: string) => void
  onClear: (id: string) => void
  delay: number
}) {
  const [expanded, setExpanded] = useState(false)
  const standings = useMemo(() => calcGroupStandings(matches, predictions), [matches, predictions])
  const filledCount = matches.filter(m => { const p = predictions[m.id]; return p && p.home !== '' && p.away !== '' }).length

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
      <button type="button" onClick={() => setExpanded(s => !s)} className="w-full px-4 sm:px-6 py-4 flex items-center justify-between gap-2 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-md flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ backgroundColor: BAIN.black, color: BAIN.white }}>{groupKey}</div>
          <div className="text-left">
            <p className="text-base font-bold tracking-tight" style={{ color: BAIN.black }}>Grupo {groupKey}</p>
            <p className="text-xs truncate" style={{ color: BAIN.graySecondary }}>{teamNames}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold" style={{ color: filledCount === 6 ? BAIN.success : filledCount > 0 ? BAIN.red : BAIN.graySecondary }}>
            {filledCount === 6 ? <span className="flex items-center gap-1"><Check size={12} strokeWidth={3} />6/6</span> : `${filledCount}/6`}
          </span>
          <ChevronDown size={18} strokeWidth={2} style={{ color: BAIN.graySecondary, transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
        </div>
      </button>
      {expanded && (
        <div className="px-3 sm:px-6 pb-4 sm:pb-6 grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6" style={{ borderTop: `1px solid ${BAIN.grayBorder}` }}>
          <div className="lg:col-span-3 pt-6 flex flex-col gap-4">
            <p className="text-xs font-bold uppercase" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>PARTIDOS DEL GRUPO</p>
            <div className="flex flex-col gap-3">
              {matches.map(m => (
                <MatchCard key={m.id} match={m} prediction={predictions[m.id] ?? { home: '', away: '' }} onUpdate={onUpdate} onClear={onClear} compact teamsConfirmed={m.teamsConfirmed} />
              ))}
            </div>
            <p className="text-xs text-center" style={{ color: BAIN.graySecondary }}>
              Usá el botón <strong>Guardar</strong> en la barra superior para guardar todas las predicciones.
            </p>
          </div>
          <div className="lg:col-span-2 pt-6">
            <p className="text-xs font-bold uppercase mb-3" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>
              {matches.some(m => m.estado === 'finalizado')
                ? 'RESULTADOS REALES + TUS PREDICCIONES'
                : 'SI TUS PREDICCIONES SE CUMPLEN'}
            </p>
            <StandingsTable standings={standings} />
            <p className="text-xs mt-3" style={{ color: BAIN.graySecondary }}>Los 2 primeros pasan a 16vos.<br /><span style={{ color: BAIN.grayTertiary }}>+ 8 mejores terceros de los 12 grupos.</span></p>
          </div>
        </div>
      )}
    </section>
  )
}

function PlayoffSection({ label, matches, predictions, onUpdate, onClear, delay }: {
  label: string; matches: DisplayMatch[]
  predictions: Predictions
  onUpdate: (id: string, side: 'home' | 'away', v: string) => void
  onClear: (id: string) => void
  delay: number
}) {
  const [expanded, setExpanded] = useState(true)
  const filledCount = matches.filter(m => { const p = predictions[m.id]; return p && p.home !== '' && p.away !== '' }).length
  const total = matches.length

  return (
    <section className="mb-6 rounded-md overflow-hidden animate-in fade-in slide-in-from-bottom-2" style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}`, animationDelay: `${delay}ms`, animationFillMode: 'backwards', animationDuration: '400ms' }}>
      <button type="button" onClick={() => setExpanded(s => !s)} className="w-full px-4 sm:px-6 py-4 flex items-center justify-between gap-2 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-md flex items-center justify-center font-bold text-xs flex-shrink-0" style={{ backgroundColor: BAIN.red, color: BAIN.white }}>PO</div>
          <div className="text-left">
            <p className="text-base font-bold tracking-tight" style={{ color: BAIN.black }}>{label}</p>
            <p className="text-xs" style={{ color: BAIN.graySecondary }}>{total} partido{total !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold" style={{ color: filledCount === total ? BAIN.success : filledCount > 0 ? BAIN.red : BAIN.graySecondary }}>
            {filledCount === total ? <span className="flex items-center gap-1"><Check size={12} strokeWidth={3} />{filledCount}/{total}</span> : `${filledCount}/${total}`}
          </span>
          <ChevronDown size={18} strokeWidth={2} style={{ color: BAIN.graySecondary, transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
        </div>
      </button>
      {expanded && (
        <div className="px-3 sm:px-6 pb-4 sm:pb-6 pt-6 flex flex-col gap-3" style={{ borderTop: `1px solid ${BAIN.grayBorder}` }}>
          {matches.map(m => (
            <MatchCard key={m.id} match={m} prediction={predictions[m.id] ?? { home: '', away: '' }} onUpdate={onUpdate} onClear={onClear} compact teamsConfirmed={m.teamsConfirmed} />
          ))}
          <p className="text-xs text-center mt-1" style={{ color: BAIN.graySecondary }}>
            Usá el botón <strong>Guardar</strong> en la barra superior para guardar todas las predicciones.
          </p>
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
    <button type="button" role="tab" aria-selected={active} onClick={onClick} className="text-sm font-medium px-2 sm:px-4 py-3 transition-colors whitespace-nowrap flex items-center gap-1.5 h-14" style={{ color: active ? BAIN.black : BAIN.graySecondary, borderBottom: `2px solid ${active ? BAIN.red : 'transparent'}` }}>
      <span style={{ color: active ? BAIN.red : BAIN.graySecondary }}>{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

function MatchCard({ match, prediction, onUpdate, onClear, showGroup = false, compact = false, teamsConfirmed = true }: {
  match: DisplayMatch; prediction: { home: number | ''; away: number | '' }
  onUpdate: (id: string, side: 'home' | 'away', v: string) => void
  onClear: (id: string) => void
  showGroup?: boolean; compact?: boolean; teamsConfirmed?: boolean
}) {
  const hasPrediction = prediction.home !== '' && prediction.away !== ''
  const now = new Date()
  const cutoffTime = new Date(new Date(match.fecha_hora).getTime() - 60 * 60 * 1000)
  const isMatchLocked = !teamsConfirmed || now >= cutoffTime || match.estado === 'finalizado' || match.estado === 'en_curso'
  const minutesUntilCutoff = Math.round((cutoffTime.getTime() - now.getTime()) / 1000 / 60)
  const isClosingSoon = !isMatchLocked && minutesUntilCutoff >= 0 && minutesUntilCutoff <= 60
  return (
    <div className="rounded-md transition-all" style={{ backgroundColor: BAIN.white, border: `1px solid ${hasPrediction ? BAIN.success + '50' : BAIN.grayBorder}`, padding: compact ? '12px 14px' : '20px' }}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>
            {showGroup && `GRUPO ${match.group} · `}{match.shortDate} · {match.time}
          </span>
          {!teamsConfirmed ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${BAIN.graySecondary}15`, color: BAIN.graySecondary }}>
              <Lock size={9} strokeWidth={2.5} />Sin definir
            </span>
          ) : isMatchLocked ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${BAIN.graySecondary}15`, color: BAIN.graySecondary }}>
              <Lock size={9} strokeWidth={2.5} />Cerrado
            </span>
          ) : isClosingSoon ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#FFF8E1', color: '#B7791F', border: '1px solid #F6E05E' }}>
              <AlertTriangle size={9} strokeWidth={2.5} />Cierra en {minutesUntilCutoff}min
            </span>
          ) : hasPrediction ? (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full" style={{ backgroundColor: BAIN.success }}>
              <Check size={9} strokeWidth={3} color="white" />
            </span>
          ) : null}
        </div>
        {!compact && <span className="text-xs" style={{ color: BAIN.graySecondary }}>{match.venue}</span>}
      </div>
      <div className="grid grid-cols-3 items-center gap-3">
        <div className="flex items-center gap-2 justify-end">
          <div className="min-w-0 flex flex-col items-end"><p className="text-xs font-bold truncate hidden sm:block" style={{ color: BAIN.black }}>{match.homeName}</p><p className="text-[10px] font-bold sm:hidden" style={{ color: BAIN.graySecondary }}>{match.home}</p></div>
          {teamsConfirmed && <CountryFlag code={match.home} url={match.homeUrl ?? undefined} size={compact ? 'sm' : 'md'} />}
          <input type="number" min="0" max="20" placeholder="—" value={prediction.home} onChange={e => !isMatchLocked && onUpdate(match.id, 'home', e.target.value)} disabled={isMatchLocked} className="w-10 sm:w-12 h-10 text-center text-base sm:text-lg font-bold rounded-md focus:outline-none transition-colors" style={{ border: `1px solid ${isMatchLocked ? BAIN.grayBorder : prediction.home !== '' ? BAIN.black : BAIN.grayBorder}`, backgroundColor: isMatchLocked ? BAIN.grayBg : BAIN.white, color: isMatchLocked ? BAIN.graySecondary : BAIN.black, cursor: isMatchLocked ? 'not-allowed' : 'auto' }} aria-label={`Goles de ${match.homeName}`} />
        </div>
        <div className="text-center">
          {match.estado === 'finalizado' && match.golesLocal !== null && match.golesVisitante !== null ? (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-base font-bold tabular-nums" style={{ color: BAIN.black }}>
                {match.golesLocal} – {match.golesVisitante}
              </span>
              {prediction.home !== '' && prediction.away !== '' && (
                <span className="text-[10px] font-medium tabular-nums" style={{ color:
                  Number(prediction.home) === match.golesLocal && Number(prediction.away) === match.golesVisitante
                    ? BAIN.success
                    : BAIN.grayTertiary
                }}>
                  pred {prediction.home}–{prediction.away}
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm" style={{ color: BAIN.graySecondary }}>vs</span>
          )}
        </div>
        <div className="flex items-center gap-2 justify-start">
          <input type="number" min="0" max="20" placeholder="—" value={prediction.away} onChange={e => !isMatchLocked && onUpdate(match.id, 'away', e.target.value)} disabled={isMatchLocked} className="w-10 sm:w-12 h-10 text-center text-base sm:text-lg font-bold rounded-md focus:outline-none transition-colors" style={{ border: `1px solid ${isMatchLocked ? BAIN.grayBorder : prediction.away !== '' ? BAIN.black : BAIN.grayBorder}`, backgroundColor: isMatchLocked ? BAIN.grayBg : BAIN.white, color: isMatchLocked ? BAIN.graySecondary : BAIN.black, cursor: isMatchLocked ? 'not-allowed' : 'auto' }} aria-label={`Goles de ${match.awayName}`} />
          {teamsConfirmed && <CountryFlag code={match.away} url={match.awayUrl ?? undefined} size={compact ? 'sm' : 'md'} />}
          <div className="min-w-0 flex flex-col items-start"><p className="text-xs font-bold truncate hidden sm:block" style={{ color: BAIN.black }}>{match.awayName}</p><p className="text-[10px] font-bold sm:hidden" style={{ color: BAIN.graySecondary }}>{match.away}</p></div>
        </div>
      </div>
      {!compact && hasPrediction && !isMatchLocked && (
        <div className="flex justify-end mt-3 pt-3" style={{ borderTop: `1px solid ${BAIN.grayBorder}` }}>
          <button type="button" onClick={() => onClear(match.id)} className="text-xs font-medium hover:underline" style={{ color: BAIN.graySecondary }}>Limpiar</button>
        </div>
      )}
    </div>
  )
}


function ResultCard({ match, prediction, points }: {
  match: DisplayMatch
  prediction: { home: number | ''; away: number | '' } | undefined
  points: number | null | undefined
}) {
  const hasScore = match.golesLocal !== null && match.golesVisitante !== null
  const hasPred = prediction && prediction.home !== '' && prediction.away !== ''
  const isExact = hasPred && hasScore &&
    Number(prediction.home) === match.golesLocal &&
    Number(prediction.away) === match.golesVisitante

  return (
    <div className="rounded-md px-5 py-4 flex items-center justify-between gap-4"
      style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}` }}>
      {/* Teams + real score */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <CountryFlag code={match.home} url={match.homeUrl ?? undefined} size="sm" />
        <span className="text-sm font-bold hidden sm:inline" style={{ color: BAIN.black }}>{match.homeName}</span>
        <span className="text-sm font-bold px-2" style={{ color: BAIN.black }}>
          {hasScore ? `${match.golesLocal} – ${match.golesVisitante}` : '– vs –'}
        </span>
        <span className="text-sm font-bold hidden sm:inline" style={{ color: BAIN.black }}>{match.awayName}</span>
        <CountryFlag code={match.away} url={match.awayUrl ?? undefined} size="sm" />
      </div>

      {/* Prediction */}
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0 text-right">
        {hasPred ? (
          <span className="text-xs font-bold" style={{ color: isExact ? '#0F7B3E' : BAIN.graySecondary }}>
            Pred: {prediction.home}–{prediction.away}
          </span>
        ) : (
          <span className="text-xs font-bold" style={{ color: BAIN.red }}>Sin predicción</span>
        )}
        {points !== null && points !== undefined ? (
          <span className="text-xs font-bold" style={{ color: points > 0 ? '#0F7B3E' : BAIN.graySecondary }}>
            {points > 0 ? `+${points} pts` : '0 pts'}
          </span>
        ) : hasPred ? (
          <span className="text-xs" style={{ color: BAIN.grayTertiary }}>Pendiente</span>
        ) : null}
      </div>
    </div>
  )
}

function ResultsView({ allMatches, loading, predictions, predPoints }: {
  allMatches: DisplayMatch[]
  loading: boolean
  predictions: Predictions
  predPoints: PredPoints
}) {
  const finishedMatches = allMatches
    .filter(m => m.estado === 'finalizado')
    .sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime())

  const totalPoints = Object.values(predPoints).reduce((s: number, v) => s + (v ?? 0), 0)
  const acertados = Object.values(predPoints).filter(v => (v ?? 0) > 0).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: `${BAIN.red} transparent transparent transparent` }} />
      </div>
    )
  }

  if (finishedMatches.length === 0) {
    return (
      <div className="rounded-md p-10 text-center" style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}` }}>
        <p className="text-sm" style={{ color: BAIN.graySecondary }}>Aún no hay partidos finalizados.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-md px-5 py-4" style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}` }}>
          <p className="text-xs font-medium uppercase mb-1" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>PUNTOS TOTALES</p>
          <p className="text-2xl font-bold tracking-tight" style={{ color: BAIN.black }}>{totalPoints}</p>
        </div>
        <div className="rounded-md px-5 py-4" style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}` }}>
          <p className="text-xs font-medium uppercase mb-1" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>PARTIDOS ACERTADOS</p>
          <p className="text-2xl font-bold tracking-tight" style={{ color: BAIN.black }}>{acertados} <span className="text-sm font-normal" style={{ color: BAIN.graySecondary }}>/ {finishedMatches.length}</span></p>
        </div>
      </div>
      {finishedMatches.map(m => (
        <ResultCard
          key={m.id}
          match={m}
          prediction={predictions[m.id]}
          points={predPoints[m.id]}
        />
      ))}
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