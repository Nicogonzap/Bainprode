'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Target, Trophy, X, Copy, Check } from 'lucide-react'
import { TopNav } from '@/components/top-nav'
import { Footer } from '@/components/footer'
import { CountryFlag } from '@/components/country-flag'
import { ToastProvider, useToast } from '@/components/toast'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

const BAIN = {
  red: '#CC0000',
  redHover: '#990000',
  black: '#000000',
  white: '#FFFFFF',
  grayBg: '#F5F5F5',
  grayBorder: '#E5E5E5',
  graySecondary: '#666666',
  grayTertiary: '#999999',
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
type UserProfile = { nombre: string | null; apellido: string | null; nombre_usuario: string | null }

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

function MatchRow({ match, showScore }: { match: Partido; showScore?: boolean }) {
  const hasScore = match.goles_local !== null && match.goles_visitante !== null
  const lugar = match.ciudad || match.estadio || ''
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
      {lugar && (
        <span className="text-xs flex-shrink-0 ml-2" style={{ color: BAIN.graySecondary }}>{lugar}</span>
      )}
    </div>
  )
}

function DateGroup({ label, matches, showScore }: { label: string; matches: Partido[]; showScore?: boolean }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase mb-3 tracking-widest" style={{ color: BAIN.graySecondary }}>
        {label}
      </h3>
      {matches.length === 0 ? (
        <p className="text-sm py-2" style={{ color: BAIN.grayTertiary }}>Sin partidos.</p>
      ) : (
        matches.map(m => <MatchRow key={m.id} match={m} showScore={showScore} />)
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
  const [prediccionesCount, setPrediccionesCount] = useState(0)
  const [puntosTotales, setPuntosTotales] = useState<number | null>(null)
  const [partidos, setPartidos] = useState<Partido[]>([])
  const [loadingPartidos, setLoadingPartidos] = useState(true)
  const [torneos, setTorneos] = useState<Torneo[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('usuarios').select('nombre, apellido, nombre_usuario')
      .eq('id', user.id).maybeSingle()
      .then(({ data }) => { if (data) setProfile(data) })
    supabase.from('predicciones').select('id', { count: 'exact', head: true })
      .eq('usuario_id', user.id)
      .then(({ count }) => setPrediccionesCount(count ?? 0))
    supabase.from('historial_puntos').select('puntos')
      .eq('usuario_id', user.id)
      .then(({ data }) => {
        if (data) setPuntosTotales(data.reduce((s: number, r: any) => s + (r.puntos ?? 0), 0))
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
  }, [user])

  const now = new Date()
  const todayStr = now.toLocaleDateString('en-CA', { timeZone: TZ })

  const upcomingMatches = partidos.filter(m => new Date(m.fecha_hora) > now).slice(0, 3)
  const nextMatch = upcomingMatches[0] ?? null

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

  const kpis = [
    { label: 'PUNTOS TOTALES', value: String(puntosTotales ?? 0), caption: '0 partidos jugados' },
    { label: 'POSICIÓN EN TU TORNEO', value: '—', caption: torneos[0]?.nombre ?? 'Sin torneo' },
    { label: 'PREDICCIONES CARGADAS', value: `${prediccionesCount} / 104`, caption: `Faltan ${104 - prediccionesCount} partidos` },
    { label: '% DE ACIERTOS', value: '—', caption: 'Disponible cuando empiece el Mundial' },
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

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-10">
        <section className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2" style={{ color: BAIN.black }}>
            Hola, {nombreDisplay}
          </h1>
          <p className="text-sm" style={{ color: BAIN.graySecondary }}>Mundial 2026 · Prode Bain Buenos Aires</p>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                  <p className="text-xs mb-6" style={{ color: BAIN.graySecondary }}>
                    {nextMatch.estadio}{nextMatch.ciudad ? `, ${nextMatch.ciudad}` : ''}
                  </p>
                  <div className="flex items-center justify-around mb-6">
                    <div className="flex flex-col items-center gap-2">
                      <CountryFlag code={nextMatch.equipo_local.codigo_iso} url={nextMatch.equipo_local.bandera_url ?? undefined} size="lg" />
                      <span className="text-sm font-bold" style={{ color: BAIN.black }}>{nextMatch.equipo_local.nombre_pais}</span>
                    </div>
                    <span className="text-sm" style={{ color: BAIN.graySecondary }}>vs</span>
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
                Cargar predicción
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
                  {upcomingMatches.map((m, i) => (
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
                        <span className="text-xs flex-shrink-0" style={{ color: BAIN.graySecondary }}>vs</span>
                        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                          <span className="text-sm font-medium truncate" style={{ color: BAIN.black }}>{m.equipo_visitante.nombre_pais}</span>
                          <CountryFlag code={m.equipo_visitante.codigo_iso} url={m.equipo_visitante.bandera_url ?? undefined} size="sm" />
                        </div>
                      </div>
                    </li>
                  ))}
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
              <DateGroup label="Partidos recientes" matches={recentMatches} showScore />
              <DateGroup label="Partidos de hoy" matches={todayMatches} showScore />
              <DateGroup label="Próximos partidos" matches={proximosMatches} />
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default function HomePage() {
  return <ToastProvider><HomePageContent /></ToastProvider>
}