'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Target, Trophy, X, Copy, Check } from 'lucide-react'
import { TopNav } from '@/components/top-nav'
import { Footer } from '@/components/footer'
import { CountryFlag } from '@/components/country-flag'
import { ToastProvider, useToast } from '@/components/toast'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

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
} as const

const TZ = 'America/Argentina/Buenos_Aires'

type Equipo = { id: string; nombre_pais: string; codigo_iso: string; bandera_url: string | null }
type Partido = {
  id: string; fecha_hora: string; estadio: string; ciudad: string
  fase: string; grupo_fase: string; estado: string
  goles_local: number | null; goles_visitante: number | null
  equipo_local: Equipo; equipo_visitante: Equipo
}
type Torneo = { id: string; nombre: string; invite_code: string; creado_por: string }
type UserProfile = { nombre: string | null; apellido: string | null; nombre_usuario: string | null; oficina: string | null; tenure: string | null }
type PredMap = Record<string, { home: number; away: number }>

function toArgDateStr(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ })
}
function formatHour(iso: string) {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ }).replace(':', '.')
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TZ })
}
function grupoLabel(grupo_fase: string | null) {
  if (!grupo_fase) return ''
  const upper = grupo_fase.toUpperCase()
  return upper.startsWith('GRUPO') ? upper : `Grupo ${upper}`
}

// Chip pequeño que muestra el marcador predicho
function PredChip({ home, away }: { home: number; away: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
      style={{ backgroundColor: `${BAIN.success}15`, color: BAIN.success, border: `1px solid ${BAIN.success}30` }}
    >
      <Check size={9} strokeWidth={3} />
      {home}–{away}
    </span>
  )
}

function MatchRow({ match, showScore, prediction }: {
  match: Partido; showScore?: boolean; prediction?: { home: number; away: number } | null
}) {
  const now = new Date()
  const matchTime = new Date(match.fecha_hora)
  const cutoffTime = new Date(matchTime.getTime() - 60 * 60 * 1000)
  const isPast = matchTime < now
  const isClosed = !isPast && now >= cutoffTime
  const isToday = toArgDateStr(match.fecha_hora) === now.toLocaleDateString('en-CA', { timeZone: TZ })
  const hasScore = match.goles_local !== null && match.goles_visitante !== null

  let rightContent: React.ReactNode
  if (isPast) {
    rightContent = prediction ? (
      <div className="flex flex-col items-end gap-0.5">
        <span className="text-[10px] font-bold" style={{ color: BAIN.success }}>Pred: {prediction.home}–{prediction.away}</span>
        {hasScore && <span className="text-[10px]" style={{ color: BAIN.graySecondary }}>Real: {match.goles_local}–{match.goles_visitante}</span>}
      </div>
    ) : (
      <span className="text-[10px] font-bold" style={{ color: BAIN.red }}>Sin predicción</span>
    )
  } else if (isClosed) {
    rightContent = (
      <div className="flex flex-col items-end gap-0.5">
        {prediction ? <PredChip home={prediction.home} away={prediction.away} /> : <span className="text-[10px] font-bold" style={{ color: BAIN.red }}>Sin predicción</span>}
        <span className="text-[10px]" style={{ color: BAIN.graySecondary }}>Predicción cerrada</span>
      </div>
    )
  } else if (isToday) {
    rightContent = (
      <div className="flex flex-col items-end gap-0.5">
        {prediction ? <PredChip home={prediction.home} away={prediction.away} /> : <span className="text-[10px] font-bold" style={{ color: BAIN.red }}>Sin predicción</span>}
        <span className="text-[10px]" style={{ color: BAIN.graySecondary }}>Cierra {formatHour(cutoffTime.toISOString())} ARG</span>
      </div>
    )
  } else {
    rightContent = prediction
      ? <PredChip home={prediction.home} away={prediction.away} />
      : <span className="text-[10px] font-bold" style={{ color: BAIN.red }}>Sin predicción</span>
  }

  return (
    <div className="flex items-center justify-between py-2.5 -mx-2 px-2 rounded hover:bg-gray-50 transition-colors"
      style={{ borderBottom: `1px solid ${BAIN.grayBorder}` }}>
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold w-12 flex-shrink-0" style={{ color: BAIN.graySecondary }}>
          {formatHour(match.fecha_hora)}
        </span>
        <div className="flex items-center gap-1.5">
          <CountryFlag code={match.equipo_local.codigo_iso} url={match.equipo_local.bandera_url ?? undefined} size="sm" />
          <span className="text-xs font-medium hidden sm:inline" style={{ color: BAIN.black }}>
            {match.equipo_local.codigo_iso}
          </span>
        </div>
        {showScore && hasScore ? (
          <span className="text-sm font-bold px-1" style={{ color: BAIN.black }}>
            {match.goles_local} - {match.goles_visitante}
          </span>
        ) : (
          <span className="text-xs" style={{ color: BAIN.graySecondary }}>vs</span>
        )}
        <div className="flex items-center gap-1.5">
          <CountryFlag code={match.equipo_visitante.codigo_iso} url={match.equipo_visitante.bandera_url ?? undefined} size="sm" />
          <span className="text-xs font-medium hidden sm:inline" style={{ color: BAIN.black }}>
            {match.equipo_visitante.codigo_iso}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        {rightContent}
      </div>
    </div>
  )
}

function DateGroup({ label, matches, showScore, predictions }: {
  label: string; matches: Partido[]; showScore?: boolean; predictions?: PredMap
}) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase mb-3 tracking-widest" style={{ color: BAIN.graySecondary }}>
        {label}
      </h3>
      {matches.length === 0 ? (
        <p className="text-sm py-2" style={{ color: BAIN.grayTertiary }}>Sin partidos.</p>
      ) : (
        matches.map(m => (
          <MatchRow key={m.id} match={m} showScore={showScore} prediction={predictions?.[m.id] ?? null} />
        ))
      )}
    </div>
  )
}

function CreateTorneoModal({ userId, onClose, onCreated }: {
  userId: string; onClose: () => void; onCreated: (t: Torneo) => void
}) {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<Torneo | null>(null)
  const [copied, setCopied] = useState(false)

  const inviteUrl = created && typeof window !== 'undefined'
    ? `${window.location.origin}/torneo/join/${created.invite_code}`
    : ''

  const handleCreate = async () => {
    if (!name.trim()) { setError('Ingresá un nombre para el torneo'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/torneos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: name.trim(), creado_por: userId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al crear torneo')
      setCreated(json.torneo)
      onCreated(json.torneo)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      toast({ message: 'Link copiado', type: 'success', duration: 2000 })
      setTimeout(() => setCopied(false), 2000)
    } catch { toast({ message: 'No se pudo copiar', type: 'error' }) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-md rounded-md shadow-lg p-6" style={{ backgroundColor: BAIN.white }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ color: BAIN.black }}>
            {created ? 'Torneo creado' : 'Crear nuevo torneo'}
          </h2>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X size={18} style={{ color: BAIN.graySecondary }} />
          </button>
        </div>
        {!created ? (
          <>
            <label className="block text-sm font-medium mb-2" style={{ color: BAIN.black }}>Nombre del torneo</label>
            <input type="text" value={name} autoFocus
              onChange={e => { setName(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Ej: Torneo Marketing 2026"
              className="w-full px-3 py-2 rounded-md text-sm focus:outline-none mb-4"
              style={{ border: `1px solid ${error ? BAIN.red : BAIN.grayBorder}` }}
            />
            {error && <p className="text-xs mb-3" style={{ color: BAIN.red }}>{error}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="flex-1 py-2 rounded-md text-sm font-medium"
                style={{ border: `1px solid ${BAIN.grayBorder}`, color: BAIN.black }}>Cancelar</button>
              <button type="button" onClick={handleCreate} disabled={loading}
                className="flex-1 py-2 rounded-md text-sm font-bold transition-opacity"
                style={{ backgroundColor: BAIN.red, color: BAIN.white, opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Creando...' : 'Crear torneo'}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm mb-4" style={{ color: BAIN.graySecondary }}>
              <span className="font-bold" style={{ color: BAIN.black }}>{created.nombre}</span> fue creado. Compartí este link:
            </p>
            <div className="rounded-md px-3 py-2.5 mb-3 break-all"
              style={{ backgroundColor: BAIN.grayBg, border: `1px solid ${BAIN.grayBorder}` }}>
              <p className="text-xs font-mono" style={{ color: BAIN.black }}>{inviteUrl}</p>
            </div>
            <button type="button" onClick={handleCopy}
              className="w-full py-2.5 px-4 rounded-md text-sm font-bold flex items-center justify-center gap-2 mb-3"
              style={{ backgroundColor: copied ? BAIN.black : BAIN.red, color: BAIN.white }}>
              {copied ? <><Check size={16} />Copiado</> : <><Copy size={16} />Copiar link</>}
            </button>
            <Link href={`/torneo/${created.id}`} onClick={onClose}
              className="block w-full py-2 text-center rounded-md text-sm font-medium"
              style={{ border: `1px solid ${BAIN.grayBorder}`, color: BAIN.black }}>Ver torneo</Link>
          </>
        )}
      </div>
    </div>
  )
}

function HomePageContent() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [predicciones, setPredicciones] = useState<PredMap>({})
  const [puntosTotales, setPuntosTotales] = useState<number | null>(null)
  const [posicion, setPosicion] = useState<number | null>(null)
  const [pctAciertos, setPctAciertos] = useState<number | null>(null)
  const [pctExacto, setPctExacto] = useState<number | null>(null)
  const [evolucion, setEvolucion] = useState<{ fecha: string; puntos: number; acumulado: number }[]>([])
  const [partidos, setPartidos] = useState<Partido[]>([])
  const [loadingPartidos, setLoadingPartidos] = useState(true)
  const [torneos, setTorneos] = useState<Torneo[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('usuarios').select('nombre, apellido, nombre_usuario, oficina, tenure')
      .eq('id', user.id).maybeSingle()
      .then(({ data }) => { if (data) setProfile(data) })
    // Cargar predicciones via API route (usa service role, no depende de RLS)
    fetch(`/api/predicciones?usuario_id=${user.id}`)
      .then(r => r.json())
      .then(({ data }) => {
        if (!data) return
        const map: PredMap = {}
        for (const p of data) map[p.partido_id] = { home: p.goles_local, away: p.goles_visitante }
        setPredicciones(map)
      })
      .catch(() => {})
    supabase.from('historial_puntos').select('puntos, es_exacto, calculado_en')
      .eq('usuario_id', user.id)
      .order('calculado_en', { ascending: true })
      .then(({ data }) => {
        if (!data) return
        const total = data.reduce((s: number, r: any) => s + (r.puntos ?? 0), 0)
        setPuntosTotales(total)
        const jugados = data.filter((r: any) => r.puntos !== null).length
        const aciertos = data.filter((r: any) => (r.puntos ?? 0) > 0).length
        const exactos = data.filter((r: any) => r.es_exacto === true).length
        if (jugados > 0) {
          setPctAciertos(Math.round((aciertos / jugados) * 100))
          setPctExacto(Math.round((exactos / jugados) * 100))
        }
        // Build cumulative evolution data
        let acum = 0
        const evo = data.map((r: any) => {
          acum += r.puntos ?? 0
          const d = new Date(r.calculado_en)
          return {
            fecha: `${d.getDate()}/${d.getMonth() + 1}`,
            puntos: r.puntos ?? 0,
            acumulado: acum,
          }
        })
        setEvolucion(evo)
      })
    fetch('/api/partidos')
      .then(r => r.json())
      .then(({ data }) => { if (data) setPartidos(data) })
      .catch(() => {})
      .finally(() => setLoadingPartidos(false))
    fetch(`/api/torneos?usuario_id=${user.id}`)
      .then(r => r.json())
      .then(({ data }) => { if (data) setTorneos(data) })
      .catch(() => {})
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(({ data }: { data: any[] }) => {
        if (!data || !user) return
        const entry = data.find((r: any) => r.usuario_id === user.id)
        if (entry?.posicion) setPosicion(entry.posicion)
      })
      .catch(() => {})
  }, [user])

  const prediccionesCount = useMemo(() => Object.keys(predicciones).length, [predicciones])

  const now = new Date()
  const todayStr = now.toLocaleDateString('en-CA', { timeZone: TZ })

  const upcomingMatches = partidos.filter(m => new Date(m.fecha_hora) > now).slice(0, 3)
  const nextMatch = upcomingMatches[0] ?? null
  const nextMatchPred = nextMatch ? predicciones[nextMatch.id] ?? null : null

  const pastMatches = partidos
    .filter(m => new Date(m.fecha_hora) < now)
    .sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime())
  const lastPlayedDate = pastMatches.length > 0 ? toArgDateStr(pastMatches[0].fecha_hora) : null
  const lastDayMatches = lastPlayedDate ? pastMatches.filter(m => toArgDateStr(m.fecha_hora) === lastPlayedDate) : []
  const recentMatches = lastDayMatches.length > 3 ? lastDayMatches : pastMatches.slice(0, 3)

  const todayMatches = partidos.filter(m => toArgDateStr(m.fecha_hora) === todayStr)

  const futureMatches = partidos
    .filter(m => new Date(m.fecha_hora) > now)
    .sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime())
  const nextDate = futureMatches.length > 0 ? toArgDateStr(futureMatches[0].fecha_hora) : null
  const nextDayMatches = nextDate ? futureMatches.filter(m => toArgDateStr(m.fecha_hora) === nextDate) : []
  const proximosMatches = nextDayMatches.length > 3 ? nextDayMatches : futureMatches.slice(0, 3)

  const nombreDisplay = profile?.nombre ?? profile?.nombre_usuario?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Usuario'

  const totalPartidos = partidos.length || 104

  const kpis = [
    { label: 'PUNTOS TOTALES', value: String(puntosTotales ?? 0), caption: puntosTotales === null || puntosTotales === 0 ? 'Sin partidos puntuados' : 'Acumulados' },
    { label: 'POSICIÓN GENERAL', value: posicion !== null ? `${posicion}°` : '—', caption: posicion !== null ? 'Ranking general' : 'Sin partidos puntuados' },
    { label: 'PREDICCIONES CARGADAS', value: `${prediccionesCount} / ${totalPartidos}`, caption: prediccionesCount === 0 ? 'Aún sin predicciones' : `Faltan ${totalPartidos - prediccionesCount} partidos` },
    { label: 'RESULTADO ACERTADO', value: pctAciertos !== null ? `${pctAciertos}%` : '—', caption: pctAciertos !== null ? 'Ganador / empate correcto' : 'Disponible cuando empiece' },
    { label: 'RESULTADO EXACTO', value: pctExacto !== null ? `${pctExacto}%` : '—', caption: pctExacto !== null ? 'Score exacto correcto' : 'Disponible cuando empiece' },
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: BAIN.grayBg }}>
      <TopNav activePage="home" />

      {showCreateModal && user && (
        <CreateTorneoModal
          userId={user.id}
          onClose={() => setShowCreateModal(false)}
          onCreated={t => setTorneos(prev => [t, ...prev])}
        />
      )}

      <main className="flex-1">
        {/* Hero — black */}
        <div style={{ backgroundColor: '#000000' }} className="relative overflow-hidden">
          <div className="max-w-[1200px] mx-auto px-6 py-10 relative">
            {/* 26 watermark */}
            <span
              className="absolute right-4 top-1/2 -translate-y-1/2 font-black select-none pointer-events-none hidden sm:block"
              style={{ fontSize: '140px', lineHeight: 1, color: '#111111', letterSpacing: '-0.04em' }}
              aria-hidden="true"
            >26</span>
            <div className="relative z-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <p className="text-xs font-bold uppercase mb-2" style={{ color: '#CC0000', letterSpacing: '0.12em' }}>PRODE BAIN · MUNDIAL 2026</p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-1" style={{ color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                Hola, {nombreDisplay}
              </h1>
              {profile?.oficina && (
                <p className="text-sm mt-1" style={{ color: '#888888' }}>{profile.oficina}{profile.tenure ? ` · ${profile.tenure}` : ''}</p>
              )}
              <p className="text-xs mt-3" style={{ color: '#555555' }}>
                USA · MEX · CAN · 11 jun – 19 jul 2026
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-[1200px] w-full mx-auto px-6 py-10">

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {kpis.map((k, i) => (
            <div key={k.label} className="rounded-md p-5 transition-all hover:shadow-sm animate-in fade-in slide-in-from-bottom-2"
              style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}`, animationDelay: `${i * 80}ms`, animationFillMode: 'backwards', animationDuration: '500ms' }}>
              <p className="text-xs font-medium mb-3" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>{k.label}</p>
              <p className="text-3xl font-bold tracking-tight mb-1" style={{ color: BAIN.black }}>{k.value}</p>
              <p className="text-xs" style={{ color: BAIN.graySecondary }}>{k.caption}</p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Próximo partido */}
            <div className="rounded-md p-6 transition-shadow hover:shadow-sm animate-in fade-in duration-500"
              style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}`, animationDelay: '300ms', animationFillMode: 'backwards' }}>
              <div className="flex items-center gap-2 mb-5">
                <Target size={18} style={{ color: BAIN.black }} strokeWidth={1.75} />
                <h2 className="text-base font-bold tracking-tight" style={{ color: BAIN.black }}>Próximo partido a predecir</h2>
              </div>
              {nextMatch ? (
                <>
                  <p className="text-xs font-medium mb-2" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>
                    {grupoLabel(nextMatch.grupo_fase)} · {nextMatch.fase === 'grupos' ? 'Fase de Grupos' : nextMatch.fase?.toUpperCase()}
                  </p>
                  <p className="text-sm font-medium mb-1" style={{ color: BAIN.black }}>
                    {formatDate(nextMatch.fecha_hora)} · {formatHour(nextMatch.fecha_hora)} ARG
                  </p>
                  <div className="mb-6 flex items-center gap-2 flex-wrap">
                    {nextMatchPred
                      ? <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: `${BAIN.success}15`, color: BAIN.success, border: `1px solid ${BAIN.success}30` }}>Predicción cargada</span>
                      : <span className="text-xs font-bold" style={{ color: BAIN.red }}>Sin predicción</span>
                    }
                    {(nextMatch.estadio || nextMatch.ciudad) && (
                      <span className="text-xs" style={{ color: BAIN.grayTertiary }}>· {nextMatch.estadio}{nextMatch.ciudad ? `, ${nextMatch.ciudad}` : ''}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-around mb-4">
                    <div className="flex flex-col items-center gap-2">
                      <CountryFlag code={nextMatch.equipo_local.codigo_iso} url={nextMatch.equipo_local.bandera_url ?? undefined} size="lg" />
                      <span className="text-sm font-bold" style={{ color: BAIN.black }}>{nextMatch.equipo_local.nombre_pais}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      {nextMatchPred ? (
                        <span className="text-2xl font-bold tracking-tight" style={{ color: BAIN.black }}>
                          {nextMatchPred.home} – {nextMatchPred.away}
                        </span>
                      ) : (
                        <span className="text-sm" style={{ color: BAIN.graySecondary }}>vs</span>
                      )}
                      {nextMatchPred && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
                          style={{ backgroundColor: `${BAIN.success}15`, color: BAIN.success, letterSpacing: '0.06em' }}>
                          Tu predicción
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <CountryFlag code={nextMatch.equipo_visitante.codigo_iso} url={nextMatch.equipo_visitante.bandera_url ?? undefined} size="lg" />
                      <span className="text-sm font-bold" style={{ color: BAIN.black }}>{nextMatch.equipo_visitante.nombre_pais}</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm mb-6 py-4" style={{ color: BAIN.graySecondary }}>
                  {loadingPartidos ? 'Cargando...' : 'No hay próximos partidos disponibles.'}
                </p>
              )}
              <Link href="/predicciones" className="block w-full text-center font-bold py-2.5 px-4 rounded-md text-sm"
                style={{ backgroundColor: BAIN.red, color: BAIN.white }}>
                {nextMatchPred ? 'Ver / modificar predicciones' : 'Cargar predicciones'}
              </Link>
            </div>

            {/* Próximos partidos card */}
            <div className="rounded-md p-6 transition-shadow hover:shadow-sm animate-in fade-in duration-500"
              style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}`, animationDelay: '400ms', animationFillMode: 'backwards' }}>
              <h2 className="text-base font-bold tracking-tight mb-4" style={{ color: BAIN.black }}>Próximos partidos</h2>
              {loadingPartidos ? (
                <p className="text-sm py-4" style={{ color: BAIN.graySecondary }}>Cargando...</p>
              ) : upcomingMatches.length === 0 ? (
                <p className="text-sm py-4" style={{ color: BAIN.graySecondary }}>No hay próximos partidos.</p>
              ) : (
                <ul className="space-y-1">
                  {upcomingMatches.map((m, i) => {
                    const pred = predicciones[m.id] ?? null
                    return (
                      <li key={m.id} className="py-3 -mx-2 px-2 rounded hover:bg-gray-50 transition-colors"
                        style={{ borderBottom: i < upcomingMatches.length - 1 ? `1px solid ${BAIN.grayBorder}` : 'none' }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs" style={{ color: BAIN.graySecondary }}>{formatDate(m.fecha_hora)}</span>
                          <span className="text-xs uppercase" style={{ color: BAIN.graySecondary, letterSpacing: '0.06em' }}>{grupoLabel(m.grupo_fase)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <CountryFlag code={m.equipo_local.codigo_iso} url={m.equipo_local.bandera_url ?? undefined} size="sm" />
                            <span className="text-sm font-medium truncate" style={{ color: BAIN.black }}>{m.equipo_local.nombre_pais}</span>
                          </div>
                          {pred ? (
                            <span className="text-sm font-bold flex-shrink-0 px-2" style={{ color: BAIN.black }}>
                              {pred.home}–{pred.away}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold flex-shrink-0 px-1" style={{ color: BAIN.red }}>Sin pred.</span>
                          )}
                          <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                            <span className="text-sm font-medium truncate" style={{ color: BAIN.black }}>{m.equipo_visitante.nombre_pais}</span>
                            <CountryFlag code={m.equipo_visitante.codigo_iso} url={m.equipo_visitante.bandera_url ?? undefined} size="sm" />
                          </div>
                        </div>
                        {pred && (
                          <p className="text-[10px] font-bold uppercase mt-1.5 text-right" style={{ color: BAIN.success, letterSpacing: '0.06em' }}>
                            ✓ predicción cargada
                          </p>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Tus torneos */}
          <div className="lg:col-span-2">
            <div className="rounded-md p-6 transition-shadow hover:shadow-sm animate-in fade-in duration-500"
              style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}`, animationDelay: '500ms', animationFillMode: 'backwards' }}>
              <div className="flex items-center gap-2 mb-5">
                <Trophy size={18} style={{ color: BAIN.black }} strokeWidth={1.75} />
                <h2 className="text-base font-bold tracking-tight" style={{ color: BAIN.black }}>Tus torneos</h2>
              </div>
              {torneos.length === 0 ? (
                <p className="text-sm py-2 mb-3" style={{ color: BAIN.graySecondary }}>Aún no participás en ningún torneo.</p>
              ) : (
                <div className="mb-4 space-y-1">
                  {torneos.map(t => (
                    <div key={t.id} className="py-2" style={{ borderBottom: `1px solid ${BAIN.grayBorder}` }}>
                      <p className="text-sm font-bold mb-0.5" style={{ color: BAIN.black }}>{t.nombre}</p>
                      <Link href={`/torneo/${t.id}`} className="text-xs font-medium hover:underline" style={{ color: BAIN.red }}>Ver ranking →</Link>
                    </div>
                  ))}
                </div>
              )}
              <button type="button" onClick={() => setShowCreateModal(true)}
                className="w-full py-2.5 px-4 rounded-md text-sm font-medium"
                style={{ backgroundColor: BAIN.white, color: BAIN.black, border: `1px solid ${BAIN.black}` }}>
                + Crear nuevo torneo
              </button>
            </div>
          </div>
        </section>

        {/* Resultados y Próximos Partidos */}
        <section className="rounded-md p-6 animate-in fade-in duration-500"
          style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}`, animationDelay: '600ms', animationFillMode: 'backwards' }}>
          <h2 className="text-base font-bold tracking-tight mb-6" style={{ color: BAIN.black }}>
            Resultados y Próximos Partidos
          </h2>
          {loadingPartidos ? (
            <p className="text-sm py-6 text-center" style={{ color: BAIN.graySecondary }}>Cargando partidos...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <DateGroup label="Partidos recientes" matches={recentMatches} showScore predictions={predicciones} />
              <DateGroup label="Partidos de hoy" matches={todayMatches} showScore predictions={predicciones} />
              <DateGroup label="Próximos partidos" matches={proximosMatches} predictions={predicciones} />
            </div>
          )}
        </section>
          {/* Evolución de puntos */}
          {evolucion.length > 1 && (
            <section className="rounded-md p-6 mt-6 animate-in fade-in duration-500"
              style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}`, animationDelay: '700ms', animationFillMode: 'backwards' }}>
              <h2 className="text-base font-bold tracking-tight mb-4" style={{ color: BAIN.black }}>Evolución de puntos</h2>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolucion} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={BAIN.grayBorder} />
                    <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: BAIN.graySecondary }} />
                    <YAxis tick={{ fontSize: 10, fill: BAIN.graySecondary }} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, border: `1px solid ${BAIN.grayBorder}`, borderRadius: 6 }}
                      formatter={(v: number) => [`${v} pts`, 'Acumulado']}
                    />
                    <Line
                      type="monotone"
                      dataKey="acumulado"
                      stroke={BAIN.red}
                      strokeWidth={2}
                      dot={{ r: 3, fill: BAIN.red }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}
        </div>{/* end inner content */}
      </main>

      <Footer />
    </div>
  )
}

export default function HomePage() {
  return <ToastProvider><HomePageContent /></ToastProvider>
}