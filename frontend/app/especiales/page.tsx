'use client'

import { useState, useMemo, useEffect } from 'react'
import { Lock, Trophy, Target, Sparkles, Star, Shield, Clock, Check } from 'lucide-react'
import { TopNav } from '@/components/top-nav'
import { Footer } from '@/components/footer'
import { CountryFlag } from '@/components/country-flag'
import { ToastProvider, useToast } from '@/components/toast'
import { GROUPS, type GroupKey } from '@/lib/groups'
import { useAuth } from '@/lib/auth-context'

const BAIN = {
  red: '#CC0000',
  redHover: '#990000',
  redLight: '#FFF0F0',
  black: '#000000',
  white: '#FFFFFF',
  grayBg: '#F5F5F5',
  grayBorder: '#E5E5E5',
  graySecondary: '#666666',
  grayTertiary: '#999999',
  success: '#0F7B3E',
  amber: '#B7791F',
} as const

const TOURNAMENT_START = new Date('2026-06-11T00:00:00')

type PlayerTeam = { player: string; team: string }

type Specials = {
  champion: string
  topScorer: PlayerTeam
  topAssister: PlayerTeam
  ballonDOr: PlayerTeam
  goldenGlove: PlayerTeam
}

const EMPTY_PT: PlayerTeam = { player: '', team: '' }
const INITIAL: Specials = {
  champion: '',
  topScorer: { ...EMPTY_PT },
  topAssister: { ...EMPTY_PT },
  ballonDOr: { ...EMPTY_PT },
  goldenGlove: { ...EMPTY_PT },
}

const ALL_TEAMS = (Object.keys(GROUPS) as GroupKey[])
  .flatMap((g) => GROUPS[g].map((t) => ({ ...t, group: g })))
  .sort((a, b) => a.name.localeCompare(b.name))

// Hook para cargar jugadores desde la API según selección y posición
function useJugadores(codigo_iso: string, posicion?: string) {
  const [jugadores, setJugadores] = useState<{ id: string; nombre: string }[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!codigo_iso) { setJugadores([]); return }
    setLoading(true)
    const url = posicion
      ? `/api/jugadores?codigo_iso=${codigo_iso}&posicion=${posicion}`
      : `/api/jugadores?codigo_iso=${codigo_iso}`
    fetch(url)
      .then((r) => r.json())
      .then(({ data }) => setJugadores(data ?? []))
      .catch(() => setJugadores([]))
      .finally(() => setLoading(false))
  }, [codigo_iso, posicion])

  return { jugadores, loading }
}

function EspecialesContent() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [specials, setSpecials] = useState<Specials>(INITIAL)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    fetch(`/api/especiales?usuario_id=${user.id}`)
      .then((r) => r.json())
      .then(({ data }) => {
        if (data) {
          setSpecials({
            champion: data.campeon ?? '',
            topScorer: { player: data.goleador_nombre ?? '', team: data.goleador_equipo ?? '' },
            topAssister: { player: data.asistente_nombre ?? '', team: data.asistente_equipo ?? '' },
            ballonDOr: { player: data.balon_de_oro_nombre ?? '', team: data.balon_de_oro_equipo ?? '' },
            goldenGlove: { player: data.guante_de_oro_nombre ?? '', team: data.guante_de_oro_equipo ?? '' },
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const timeRemaining = useMemo(() => {
    const now = new Date()
    const diff = TOURNAMENT_START.getTime() - now.getTime()
    if (diff <= 0) return null
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
    return { days, hours }
  }, [])

  const isLocked = timeRemaining === null

  const completedCount = useMemo(() => {
    let n = 0
    if (specials.champion) n++
    if (specials.topScorer.player && specials.topScorer.team) n++
    if (specials.topAssister.player && specials.topAssister.team) n++
    if (specials.ballonDOr.player && specials.ballonDOr.team) n++
    if (specials.goldenGlove.player && specials.goldenGlove.team) n++
    return n
  }, [specials])

  const handleSave = async () => {
    if (isLocked || !user) return
    setSaving(true)
    try {
      const res = await fetch('/api/especiales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: user.id,
          campeon: specials.champion || null,
          goleador_nombre: specials.topScorer.player || null,
          goleador_equipo: specials.topScorer.team || null,
          asistente_nombre: specials.topAssister.player || null,
          asistente_equipo: specials.topAssister.team || null,
          balon_de_oro_nombre: specials.ballonDOr.player || null,
          balon_de_oro_equipo: specials.ballonDOr.team || null,
          guante_de_oro_nombre: specials.goldenGlove.player || null,
          guante_de_oro_equipo: specials.goldenGlove.team || null,
        }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      setSavedAt(new Date())
      toast({ message: 'Predicciones especiales guardadas', type: 'success', duration: 2500 })
    } catch {
      toast({ message: 'Error al guardar predicciones', type: 'error', duration: 2500 })
    } finally {
      setSaving(false)
    }
  }

  const setTeamPlayer = (key: keyof Specials, field: 'player' | 'team', value: string) => {
    setSpecials((s) => {
      const current = s[key] as PlayerTeam
      if (field === 'team') return { ...s, [key]: { player: '', team: value } }
      return { ...s, [key]: { ...current, [field]: value } }
    })
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: BAIN.grayBg }}>
      <TopNav activePage="especiales" />

      <main className="flex-1 max-w-[900px] w-full mx-auto px-6 py-10">
        <section className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={20} style={{ color: BAIN.red }} strokeWidth={2} />
            <p className="text-xs font-bold uppercase" style={{ color: BAIN.red, letterSpacing: '0.1em' }}>PREDICCIONES ESPECIALES</p>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3" style={{ color: BAIN.black }}>Predicciones del torneo</h1>
          <p className="text-sm leading-relaxed" style={{ color: BAIN.graySecondary }}>Acertar estas predicciones suma puntos extra al ranking general. Solo se pueden cargar o modificar <strong>antes del comienzo del Mundial</strong>.</p>
        </section>

        {isLocked ? (
          <section className="mb-8 rounded-md p-5 flex items-start gap-3" style={{ backgroundColor: BAIN.grayBg, border: `1px solid ${BAIN.grayBorder}` }}>
            <Lock size={18} strokeWidth={2} style={{ color: BAIN.graySecondary, marginTop: '2px' }} />
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: BAIN.black }}>Predicciones bloqueadas</p>
              <p className="text-sm" style={{ color: BAIN.graySecondary }}>El Mundial ya empezó. Tus predicciones quedaron fijadas.</p>
            </div>
          </section>
        ) : (
          <section className="mb-8 rounded-md p-5 flex items-center justify-between gap-4" style={{ backgroundColor: BAIN.redLight, border: `1px solid ${BAIN.red}30` }}>
            <div className="flex items-center gap-3">
              <Clock size={18} strokeWidth={2} style={{ color: BAIN.red }} />
              <div>
                <p className="text-sm font-bold" style={{ color: BAIN.black }}>Faltan {timeRemaining.days} días y {timeRemaining.hours} horas</p>
                <p className="text-xs" style={{ color: BAIN.graySecondary }}>para que se cierren estas predicciones (11 jun · 00:00 ARG)</p>
              </div>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium uppercase mb-1" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>COMPLETADAS</p>
              <p className="text-lg font-bold" style={{ color: BAIN.black }}><span style={{ color: BAIN.red }}>{completedCount}</span><span style={{ color: BAIN.grayTertiary }}> / 5</span></p>
            </div>
          </section>
        )}

        {loading ? (
          <div className="py-10 text-center"><p className="text-sm" style={{ color: BAIN.graySecondary }}>Cargando tus predicciones…</p></div>
        ) : (
          <div className="flex flex-col gap-4">

            {/* Campeon */}
            <PredictionCard icon={<Trophy size={20} strokeWidth={1.75} />} title="Campeón del Mundial" subtitle="¿Quién levanta la copa el 19 de julio?" points={50} isLocked={isLocked} isFilled={!!specials.champion}>
              <TeamSelect value={specials.champion} onChange={(v) => setSpecials((s) => ({ ...s, champion: v }))} disabled={isLocked} />
            </PredictionCard>

            {/* Goleador */}
            <PredictionCard icon={<Target size={20} strokeWidth={1.75} />} title="Goleador del torneo" subtitle="Jugador con más goles convertidos" points={30} isLocked={isLocked} isFilled={!!specials.topScorer.player && !!specials.topScorer.team}>
              <PlayerTeamSelect
                team={specials.topScorer.team}
                player={specials.topScorer.player}
                onTeamChange={(v) => setTeamPlayer('topScorer', 'team', v)}
                onPlayerChange={(v) => setTeamPlayer('topScorer', 'player', v)}
                disabled={isLocked}
              />
            </PredictionCard>

            {/* Asistente */}
            <PredictionCard icon={<Sparkles size={20} strokeWidth={1.75} />} title="Máximo asistente" subtitle="Jugador con más asistencias" points={20} isLocked={isLocked} isFilled={!!specials.topAssister.player && !!specials.topAssister.team}>
              <PlayerTeamSelect
                team={specials.topAssister.team}
                player={specials.topAssister.player}
                onTeamChange={(v) => setTeamPlayer('topAssister', 'team', v)}
                onPlayerChange={(v) => setTeamPlayer('topAssister', 'player', v)}
                disabled={isLocked}
              />
            </PredictionCard>

            {/* Balon de Oro */}
            <PredictionCard icon={<Star size={20} strokeWidth={1.75} />} title="Balón de Oro" subtitle="Mejor jugador del torneo" points={25} isLocked={isLocked} isFilled={!!specials.ballonDOr.player && !!specials.ballonDOr.team}>
              <PlayerTeamSelect
                team={specials.ballonDOr.team}
                player={specials.ballonDOr.player}
                onTeamChange={(v) => setTeamPlayer('ballonDOr', 'team', v)}
                onPlayerChange={(v) => setTeamPlayer('ballonDOr', 'player', v)}
                disabled={isLocked}
              />
            </PredictionCard>

            {/* Guante de Oro */}
            <PredictionCard icon={<Shield size={20} strokeWidth={1.75} />} title="Guante de Oro" subtitle="Mejor arquero del torneo" points={20} isLocked={isLocked} isFilled={!!specials.goldenGlove.player && !!specials.goldenGlove.team}>
              <PlayerTeamSelect
                team={specials.goldenGlove.team}
                player={specials.goldenGlove.player}
                onTeamChange={(v) => setTeamPlayer('goldenGlove', 'team', v)}
                onPlayerChange={(v) => setTeamPlayer('goldenGlove', 'player', v)}
                disabled={isLocked}
                posicion="ARQ"
              />
            </PredictionCard>

          </div>
        )}

        {!isLocked && (
          <div className="mt-8 flex flex-col items-center gap-3">
            <button type="button" onClick={handleSave} disabled={saving} className="px-8 py-3 rounded-md text-sm font-bold transition-colors flex items-center gap-2" style={{ backgroundColor: BAIN.red, color: BAIN.white, opacity: saving ? 0.7 : 1 }}>
              {savedAt ? <><Check size={16} strokeWidth={2.5} />Guardar cambios</> : saving ? 'Guardando…' : 'Guardar predicciones'}
            </button>
            {savedAt && <p className="text-xs" style={{ color: BAIN.graySecondary }}>Última actualización: {savedAt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p>}
          </div>
        )}

        <section className="mt-10 rounded-md p-6" style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}` }}>
          <h2 className="text-base font-bold tracking-tight mb-4" style={{ color: BAIN.black }}>Cómo suman puntos</h2>
          <ul className="space-y-2">
            <li className="flex items-center gap-3 text-sm" style={{ color: BAIN.black }}><Trophy size={14} strokeWidth={2} style={{ color: BAIN.red }} /><span className="flex-1">Campeón del Mundial</span><span className="font-bold">50 pts</span></li>
            <li className="flex items-center gap-3 text-sm" style={{ color: BAIN.black }}><Target size={14} strokeWidth={2} style={{ color: BAIN.red }} /><span className="flex-1">Goleador del torneo</span><span className="font-bold">30 pts</span></li>
            <li className="flex items-center gap-3 text-sm" style={{ color: BAIN.black }}><Sparkles size={14} strokeWidth={2} style={{ color: BAIN.red }} /><span className="flex-1">Máximo asistente</span><span className="font-bold">20 pts</span></li>
            <li className="flex items-center gap-3 text-sm" style={{ color: BAIN.black }}><Star size={14} strokeWidth={2} style={{ color: BAIN.red }} /><span className="flex-1">Balón de Oro</span><span className="font-bold">25 pts</span></li>
            <li className="flex items-center gap-3 text-sm" style={{ color: BAIN.black }}><Shield size={14} strokeWidth={2} style={{ color: BAIN.red }} /><span className="flex-1">Guante de Oro</span><span className="font-bold">20 pts</span></li>
          </ul>
        </section>
      </main>

      <Footer />
    </div>
  )
}

function PredictionCard({ icon, title, subtitle, points, isLocked, isFilled, children }: {
  icon: React.ReactNode; title: string; subtitle: string; points: number; isLocked: boolean; isFilled: boolean; children: React.ReactNode
}) {
  return (
    <div className="rounded-md p-5 transition-all animate-in fade-in slide-in-from-bottom-2"
      style={{ backgroundColor: BAIN.white, border: `1px solid ${isFilled ? BAIN.success + '40' : BAIN.grayBorder}`, opacity: isLocked ? 0.85 : 1 }}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${BAIN.red}15`, color: BAIN.red }}>{icon}</div>
          <div>
            <p className="text-base font-bold tracking-tight" style={{ color: BAIN.black }}>{title}</p>
            <p className="text-xs mt-0.5" style={{ color: BAIN.graySecondary }}>{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isFilled && <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded"
            style={{ backgroundColor: `${BAIN.success}15`, color: BAIN.success, letterSpacing: '0.06em' }}>
            <Check size={10} strokeWidth={3} />CARGADA</span>}
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
            style={{ backgroundColor: `${BAIN.red}15`, color: BAIN.red, letterSpacing: '0.06em' }}>+{points} PTS</span>
        </div>
      </div>
      {children}
    </div>
  )
}

function TeamSelect({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {value && <div className="flex-shrink-0"><CountryFlag code={value} size="md" /></div>}
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
        className="flex-1 px-3 py-2 rounded-md text-sm transition-colors focus:outline-none"
        style={{ border: `1px solid ${value ? BAIN.black : BAIN.grayBorder}`, backgroundColor: disabled ? BAIN.grayBg : BAIN.white, color: value ? BAIN.black : BAIN.graySecondary, cursor: disabled ? 'not-allowed' : 'pointer' }}>
        <option value="">— Elegí un país —</option>
        {ALL_TEAMS.map((t) => <option key={`${t.code}-${t.group}`} value={t.code}>{t.name} (Grupo {t.group})</option>)}
      </select>
    </div>
  )
}

function PlayerTeamSelect({ team, player, onTeamChange, onPlayerChange, disabled, posicion }: {
  team: string; player: string
  onTeamChange: (v: string) => void; onPlayerChange: (v: string) => void
  disabled: boolean; posicion?: string
}) {
  const { jugadores, loading: loadingJugadores } = useJugadores(team, posicion)

  const playerInList = jugadores.some((j) => j.nombre === player)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Primer desplegable: seleccion */}
      <div className="flex items-center gap-2">
        {team && <CountryFlag code={team} size="sm" />}
        <select
          value={team}
          onChange={(e) => onTeamChange(e.target.value)}
          disabled={disabled}
          className="flex-1 px-3 py-2 rounded-md text-sm focus:outline-none transition-colors"
          style={{ border: `1px solid ${team ? BAIN.black : BAIN.grayBorder}`, backgroundColor: disabled ? BAIN.grayBg : BAIN.white, color: team ? BAIN.black : BAIN.graySecondary, cursor: disabled ? 'not-allowed' : 'pointer' }}>
          <option value="">— Elegí una selección —</option>
          {ALL_TEAMS.map((t) => <option key={`${t.code}-${t.group}`} value={t.code}>{t.name}</option>)}
        </select>
      </div>

      {/* Segundo desplegable: jugador (habilitado solo si hay seleccion) */}
      <select
        value={player}
        onChange={(e) => onPlayerChange(e.target.value)}
        disabled={disabled || !team || loadingJugadores}
        className="px-3 py-2 rounded-md text-sm focus:outline-none transition-colors"
        style={{
          border: `1px solid ${player ? BAIN.black : BAIN.grayBorder}`,
          backgroundColor: disabled || !team ? BAIN.grayBg : BAIN.white,
          color: player ? BAIN.black : BAIN.graySecondary,
          cursor: disabled || !team ? 'not-allowed' : 'pointer',
        }}>
        <option value="">
          {!team ? '— Primero elegí selección —' : loadingJugadores ? 'Cargando jugadores...' : jugadores.length === 0 ? '— Sin jugadores cargados —' : '— Elegí un jugador —'}
        </option>
        {/* Si el jugador guardado no está en la lista, lo mostramos igual */}
        {player && !playerInList && <option value={player}>{player}</option>}
        {jugadores.map((j) => <option key={j.id} value={j.nombre}>{j.nombre}</option>)}
      </select>
    </div>
  )
}

export default function EspecialesPage() {
  return (
    <ToastProvider>
      <EspecialesContent />
    </ToastProvider>
  )
}