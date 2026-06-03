'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { ChevronDown, Check, Calendar, Grid3x3, Save, Trophy } from 'lucide-react'
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

type ViewMode = 'fecha' | 'grupo' | 'fase'
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
  dateSort: string; dateLabel: string; shortDate: string; time: string; venue: string; estado: string
}
type StandingRow = {
  id: string; name: string; code: string; url: string | null
  pj: number; gf: number; gc: number; dg: number; pts: number
}

// ── Cuadro de eliminatorias del Mundial 2026 (plantillas). ──
// Fuente: bracket oficial FIFA / sorteo dic-2025. Equipos aún no definidos,
// por eso se muestran como "1° Grupo X" / "2° Grupo Y" / "3° mejor (...)".
type BracketMatch = { num: number; home: string; away: string; date: string; time: string; venue: string }
type BracketPhase = { key: string; label: string; matches: BracketMatch[] }

const BRACKET: BracketPhase[] = [
  {
    key: '16vos',
    label: '16VOS DE FINAL',
    matches: [
      { num: 73, home: '2° Grupo A', away: '2° Grupo B', date: '28 JUN', time: '16.00', venue: 'Los Ángeles' },
      { num: 74, home: '1° Grupo E', away: '3° mejor (A/B/C/D/F)', date: '28 JUN', time: '20.00', venue: 'Boston' },
      { num: 75, home: '1° Grupo F', away: '2° Grupo C', date: '29 JUN', time: '13.00', venue: 'Guadalajara' },
      { num: 76, home: '1° Grupo C', away: '2° Grupo F', date: '29 JUN', time: '17.00', venue: 'Houston' },
      { num: 77, home: '1° Grupo I', away: '3° mejor (C/D/F/G/H)', date: '29 JUN', time: '21.00', venue: 'Nueva York/NJ' },
      { num: 78, home: '2° Grupo E', away: '2° Grupo I', date: '30 JUN', time: '16.00', venue: 'Dallas' },
      { num: 79, home: '1° Grupo A', away: '3° mejor (C/E/F/H/I)', date: '30 JUN', time: '20.00', venue: 'Ciudad de México' },
      { num: 80, home: '1° Grupo L', away: '3° mejor (E/H/I/J/K)', date: '1 JUL', time: '16.00', venue: 'Atlanta' },
      { num: 81, home: '1° Grupo D', away: '3° mejor (B/E/F/I/J)', date: '1 JUL', time: '20.00', venue: 'San Francisco' },
      { num: 82, home: '1° Grupo G', away: '3° mejor (A/E/H/I/J)', date: '2 JUL', time: '16.00', venue: 'Seattle' },
      { num: 83, home: '2° Grupo K', away: '2° Grupo L', date: '2 JUL', time: '20.00', venue: 'Toronto' },
      { num: 84, home: '1° Grupo H', away: '2° Grupo J', date: '2 JUL', time: '22.00', venue: 'Los Ángeles' },
      { num: 85, home: '1° Grupo B', away: '3° mejor (E/F/G/I/J)', date: '3 JUL', time: '16.00', venue: 'Vancouver' },
      { num: 86, home: '1° Grupo J', away: '2° Grupo H', date: '3 JUL', time: '18.00', venue: 'Miami' },
      { num: 87, home: '1° Grupo K', away: '3° mejor (D/E/I/J/L)', date: '3 JUL', time: '20.00', venue: 'Kansas City' },
      { num: 88, home: '2° Grupo D', away: '2° Grupo G', date: '3 JUL', time: '22.00', venue: 'Dallas' },
    ],
  },
  {
    key: '8vos',
    label: '8VOS DE FINAL',
    matches: [
      { num: 89, home: 'Ganador P74', away: 'Ganador P77', date: '4 JUL', time: '13.00', venue: 'Filadelfia' },
      { num: 90, home: 'Ganador P73', away: 'Ganador P75', date: '4 JUL', time: '17.00', venue: 'Houston' },
      { num: 91, home: 'Ganador P76', away: 'Ganador P78', date: '5 JUL', time: '13.00', venue: 'Nueva York/NJ' },
      { num: 92, home: 'Ganador P79', away: 'Ganador P80', date: '5 JUL', time: '17.00', venue: 'Ciudad de México' },
      { num: 93, home: 'Ganador P83', away: 'Ganador P84', date: '6 JUL', time: '13.00', venue: 'Dallas' },
      { num: 94, home: 'Ganador P81', away: 'Ganador P82', date: '6 JUL', time: '17.00', venue: 'Seattle' },
      { num: 95, home: 'Ganador P86', away: 'Ganador P88', date: '7 JUL', time: '13.00', venue: 'Atlanta' },
      { num: 96, home: 'Ganador P85', away: 'Ganador P87', date: '7 JUL', time: '17.00', venue: 'Vancouver' },
    ],
  },
  {
    key: '4tos',
    label: 'CUARTOS DE FINAL',
    matches: [
      { num: 97, home: 'Ganador P89', away: 'Ganador P90', date: '9 JUL', time: '16.00', venue: 'Boston' },
      { num: 98, home: 'Ganador P93', away: 'Ganador P94', date: '10 JUL', time: '16.00', venue: 'Los Ángeles' },
      { num: 99, home: 'Ganador P91', away: 'Ganador P92', date: '11 JUL', time: '13.00', venue: 'Miami' },
      { num: 100, home: 'Ganador P95', away: 'Ganador P96', date: '11 JUL', time: '17.00', venue: 'Kansas City' },
    ],
  },
  {
    key: 'semis',
    label: 'SEMIFINALES',
    matches: [
      { num: 101, home: 'Ganador P97', away: 'Ganador P98', date: '14 JUL', time: '16.00', venue: 'Dallas' },
      { num: 102, home: 'Ganador P99', away: 'Ganador P100', date: '15 JUL', time: '16.00', venue: 'Atlanta' },
    ],
  },
  {
    key: '3er_puesto',
    label: 'TERCER PUESTO',
    matches: [
      { num: 103, home: 'Perdedor P101', away: 'Perdedor P102', date: '18 JUL', time: '16.00', venue: 'Miami' },
    ],
  },
  {
    key: 'final',
    label: 'FINAL',
    matches: [
      { num: 104, home: 'Ganador P101', away: 'Ganador P102', date: '19 JUL', time: '16.00', venue: 'MetLife, Nueva Jersey' },
    ],
  },
]

function toDisplayMatch(p: ApiPartido): DisplayMatch {
  const d = new Date(p.fecha_hora)
  const inTz = new Date(d.toLocaleString('en-US', { timeZone: TZ }))
  const dateSort = `${inTz.getFullYear()}-${String(inTz.getMonth() + 1).padStart(2, '0')}-${String(inTz.getDate()).padStart(2, '0')}`
  const dateLabel = `${DAYS_ES[inTz.getDay()]} ${inTz.getDate()} DE ${MONTHS_ES[inTz.getMonth()]}`
  const shortDate = `${inTz.getDate()} ${MONTHS_SHORT[inTz.getMonth()]}`
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
    dateSort, dateLabel, shortDate, time,
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
  const [viewMode, setViewMode] = useState<ViewMode>('grupo')
  const [matches, setMatches] = useState<DisplayMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [predictions, setPredictions] = useState<Predictions>({})
  const [savingGroup, setSavingGroup] = useState<string | null>(null)

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

  const saveGroup = useCallback(async (groupMatchIds: string[]) => {
    if (!user) return
    const toSave = groupMatchIds
      .map(id => ({ id, pred: predictions[id] }))
      .filter(({ pred }) => pred && pred.home !== '' && pred.away !== '')

    if (toSave.length === 0) {
      toast({ message: 'Completá al menos un resultado antes de guardar', type: 'info', duration: 2500 })
      return
    }

    const groupKey = matches.find(m => m.id === groupMatchIds[0])?.group ?? ''
    setSavingGroup(groupKey)
    try {
      await Promise.all(toSave.map(({ id, pred }) =>
        fetch('/api/predicciones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario_id: user.id, partido_id: id, goles_local: pred!.home, goles_visitante: pred!.away }),
        })
      ))
      toast({
        message: `${toSave.length} predicción${toSave.length > 1 ? 'es' : ''} guardada${toSave.length > 1 ? 's' : ''} — Grupo ${groupKey}`,
        type: 'success',
        duration: 3000,
      })
    } catch {
      toast({ message: 'Error al guardar predicciones', type: 'error', duration: 2000 })
    } finally {
      setSavingGroup(null)
    }
  }, [user, predictions, matches, toast])

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
            <ViewTab icon={<Grid3x3 size={14} strokeWidth={2} />} label="Por grupo" active={viewMode === 'grupo'} onClick={() => setViewMode('grupo')} />
            <ViewTab icon={<Calendar size={14} strokeWidth={2} />} label="Por fecha" active={viewMode === 'fecha'} onClick={() => setViewMode('fecha')} />
            <ViewTab icon={<Trophy size={14} strokeWidth={2} />} label="Por fase" active={viewMode === 'fase'} onClick={() => setViewMode('fase')} />
          </nav>
        </div>
      </div>
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-10">
        <section className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2" style={{ color: BAIN.black }}>Predicciones</h1>
            <p className="text-sm" style={{ color: BAIN.graySecondary }}>
              {viewMode === 'grupo'
                ? 'Completá los resultados y guardá las predicciones de cada grupo.'
                : viewMode === 'fecha'
                ? 'Partidos ordenados por fecha.'
                : 'Cuadro de eliminatorias. Los cruces se definen al terminar la fase de grupos.'}
            </p>
          </div>
          {viewMode !== 'fase' && (
            <div className="rounded-md px-4 py-3" style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}` }}>
              <p className="text-xs font-medium mb-1" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>CARGADAS</p>
              <p className="text-xl font-bold tracking-tight" style={{ color: BAIN.black }}>
                <span style={{ color: BAIN.red }}>{loadedCount}</span>
                <span style={{ color: BAIN.grayTertiary }}> / {matches.length}</span>
              </p>
            </div>
          )}
        </section>
        {loading && viewMode !== 'fase' ? (
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
                onSave={() => saveGroup(g.matches.map(m => m.id))}
                saving={savingGroup === g.group}
                delay={gIdx * 50}
              />
            ))}
          </>
        ) : viewMode === 'fecha' ? (
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
        ) : (
          <>
            <div className="rounded-md p-4 mb-6 flex items-start gap-2" style={{ backgroundColor: '#FFF8E5', border: `1px solid #E0C97A` }}>
              <span aria-hidden="true">ℹ️</span>
              <p className="text-sm" style={{ color: '#7A5C00' }}>
                Estos cruces son una vista previa del cuadro. Los equipos se confirman cuando termine la fase de grupos, así que por ahora no se pueden predecir.
              </p>
            </div>
            {BRACKET.map((phase, pIdx) => (
              <section key={phase.key} className="mb-8 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${pIdx * 50}ms`, animationFillMode: 'backwards', animationDuration: '400ms' }}>
                <h2 className="text-xs font-bold uppercase mb-3" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>{phase.label}</h2>
                <div className="flex flex-col gap-3">
                  {phase.matches.map(bm => (
                    <BracketCard key={bm.num} match={bm} />
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

function GroupSection({ groupKey, matches, predictions, onUpdate, onClear, onSave, saving, delay }: {
  groupKey: string; matches: DisplayMatch[]
  predictions: Predictions
  onUpdate: (id: string, side: 'home' | 'away', v: string) => void
  onClear: (id: string) => void
  onSave: () => void
  saving: boolean
  delay: number
}) {
  const [expanded, setExpanded] = useState(groupKey === 'J')
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
      <button type="button" onClick={() => setExpanded(s => !s)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-md flex items-center justify-center font-bold text-base" style={{ backgroundColor: BAIN.black, color: BAIN.white }}>{groupKey}</div>
          <div className="text-left">
            <p className="text-base font-bold tracking-tight" style={{ color: BAIN.black }}>Grupo {groupKey}</p>
            <p className="text-xs truncate max-w-xs" style={{ color: BAIN.graySecondary }}>{teamNames}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold" style={{ color: filledCount === 6 ? BAIN.success : BAIN.graySecondary }}>{filledCount}/6</span>
          <ChevronDown size={18} strokeWidth={2} style={{ color: BAIN.graySecondary, transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
        </div>
      </button>
      {expanded && (
        <div className="px-6 pb-6 grid grid-cols-1 lg:grid-cols-5 gap-6" style={{ borderTop: `1px solid ${BAIN.grayBorder}` }}>
          <div className="lg:col-span-3 pt-6 flex flex-col gap-4">
            <p className="text-xs font-bold uppercase" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>PARTIDOS DEL GRUPO</p>
            <div className="flex flex-col gap-3">
              {matches.map(m => (
                <MatchCard key={m.id} match={m} prediction={predictions[m.id] ?? { home: '', away: '' }} onUpdate={onUpdate} onClear={onClear} compact />
              ))}
            </div>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-md text-sm font-bold transition-all"
              style={{ backgroundColor: saving ? BAIN.grayBorder : BAIN.red, color: saving ? BAIN.graySecondary : BAIN.white, cursor: saving ? 'not-allowed' : 'pointer' }}
            >
              <Save size={15} strokeWidth={2.5} />
              {saving ? 'Guardando…' : 'Guardar predicciones del grupo'}
            </button>
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

// Tarjeta de cruce de eliminatorias (plantilla, sin equipos definidos aún).
function BracketCard({ match }: { match: BracketMatch }) {
  return (
    <div className="rounded-md" style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}`, padding: '20px' }}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <span className="text-xs font-medium uppercase" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>
          PARTIDO {match.num} · {match.date} · {match.time}
        </span>
        <span className="text-xs" style={{ color: BAIN.graySecondary }}>{match.venue}</span>
      </div>
      <div className="grid grid-cols-3 items-center gap-3">
        <div className="flex items-center gap-2 justify-end">
          <div className="text-right hidden sm:block min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: BAIN.graySecondary }}>{match.home}</p>
          </div>
          <div className="rounded-full flex-shrink-0" style={{ width: '32px', height: '32px', backgroundColor: BAIN.grayBg, border: `1px solid ${BAIN.grayBorder}` }} />
          <input type="text" disabled placeholder="—" className="w-12 h-10 text-center text-lg font-bold rounded-md" style={{ border: `1px solid ${BAIN.grayBorder}`, backgroundColor: BAIN.grayBg, color: BAIN.grayTertiary, cursor: 'not-allowed' }} aria-label="Predicción no disponible aún" />
        </div>
        <div className="text-center"><span className="text-sm" style={{ color: BAIN.graySecondary }}>vs</span></div>
        <div className="flex items-center gap-2 justify-start">
          <input type="text" disabled placeholder="—" className="w-12 h-10 text-center text-lg font-bold rounded-md" style={{ border: `1px solid ${BAIN.grayBorder}`, backgroundColor: BAIN.grayBg, color: BAIN.grayTertiary, cursor: 'not-allowed' }} aria-label="Predicción no disponible aún" />
          <div className="rounded-full flex-shrink-0" style={{ width: '32px', height: '32px', backgroundColor: BAIN.grayBg, border: `1px solid ${BAIN.grayBorder}` }} />
          <div className="hidden sm:block min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: BAIN.graySecondary }}>{match.away}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function MatchCard({ match, prediction, onUpdate, onClear, showGroup = false, compact = false }: {
  match: DisplayMatch; prediction: { home: number | ''; away: number | '' }
  onUpdate: (id: string, side: 'home' | 'away', v: string) => void
  onClear: (id: string) => void
  showGroup?: boolean; compact?: boolean
}) {
  const hasPrediction = prediction.home !== '' && prediction.away !== ''
  return (
    <div className="rounded-md transition-all" style={{ backgroundColor: BAIN.white, border: `1px solid ${hasPrediction ? BAIN.success + '50' : BAIN.grayBorder}`, padding: compact ? '12px 14px' : '20px' }}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>
            {showGroup && `GRUPO ${match.group} · `}{match.shortDate} · {match.time}
          </span>
          {hasPrediction && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full" style={{ backgroundColor: BAIN.success }}>
              <Check size={9} strokeWidth={3} color="white" />
            </span>
          )}
        </div>
        {!compact && <span className="text-xs" style={{ color: BAIN.graySecondary }}>{match.venue}</span>}
      </div>
      <div className="grid grid-cols-3 items-center gap-3">
        <div className="flex items-center gap-2 justify-end">
          <div className="text-right hidden sm:block min-w-0"><p className="text-sm font-bold truncate" style={{ color: BAIN.black }}>{match.homeName}</p></div>
          <CountryFlag code={match.home} url={match.homeUrl ?? undefined} size={compact ? 'sm' : 'md'} />
          <input type="number" min="0" max="20" placeholder="—" value={prediction.home} onChange={e => onUpdate(match.id, 'home', e.target.value)} className="w-12 h-10 text-center text-lg font-bold rounded-md focus:outline-none transition-colors" style={{ border: `1px solid ${prediction.home !== '' ? BAIN.black : BAIN.grayBorder}`, backgroundColor: BAIN.white, color: BAIN.black }} aria-label={`Goles de ${match.homeName}`} />
        </div>
        <div className="text-center"><span className="text-sm" style={{ color: BAIN.graySecondary }}>vs</span></div>
        <div className="flex items-center gap-2 justify-start">
          <input type="number" min="0" max="20" placeholder="—" value={prediction.away} onChange={e => onUpdate(match.id, 'away', e.target.value)} className="w-12 h-10 text-center text-lg font-bold rounded-md focus:outline-none transition-colors" style={{ border: `1px solid ${prediction.away !== '' ? BAIN.black : BAIN.grayBorder}`, backgroundColor: BAIN.white, color: BAIN.black }} aria-label={`Goles de ${match.awayName}`} />
          <CountryFlag code={match.away} url={match.awayUrl ?? undefined} size={compact ? 'sm' : 'md'} />
          <div className="hidden sm:block min-w-0"><p className="text-sm font-bold truncate" style={{ color: BAIN.black }}>{match.awayName}</p></div>
        </div>
      </div>
      {!compact && hasPrediction && (
        <div className="flex justify-end mt-3 pt-3" style={{ borderTop: `1px solid ${BAIN.grayBorder}` }}>
          <button type="button" onClick={() => onClear(match.id)} className="text-xs font-medium hover:underline" style={{ color: BAIN.graySecondary }}>Limpiar</button>
        </div>
      )}
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