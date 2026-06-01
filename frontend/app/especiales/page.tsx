'use client'

import { useState, useMemo, useEffect } from 'react'
import { Lock, Trophy, Target, Sparkles, Clock, Check } from 'lucide-react'
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

type Specials = {
  champion: string
  topScorer: { player: string; team: string }
  topAssister: { player: string; team: string }
  darkHorse: string
}

const INITIAL: Specials = {
  champion: '',
  topScorer: { player: '', team: '' },
  topAssister: { player: '', team: '' },
  darkHorse: '',
}

const ALL_TEAMS = (Object.keys(GROUPS) as GroupKey[])
  .flatMap((g) => GROUPS[g].map((t) => ({ ...t, group: g })))
  .sort((a, b) => a.name.localeCompare(b.name))

function EspecialesContent() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [specials, setSpecials] = useState<Specials>(INITIAL)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Cargar predicciones especiales al montar
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
            darkHorse: data.sorpresa ?? '',
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
    if (specials.champion) n += 1
    if (specials.topScorer.player && specials.topScorer.team) n += 1
    if (specials.topAssister.player && specials.topAssister.team) n += 1
    if (specials.darkHorse) n += 1
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
          sorpresa: specials.darkHorse || null,
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
              <p className="text-lg font-bold" style={{ color: BAIN.black }}><span style={{ color: BAIN.red }}>{completedCount}</span><span style={{ color: BAIN.grayTertiary }}> / 4</span></p>
            </div>
          </section>
        )}

        {loading ? (
          <div className="py-10 text-center"><p className="text-sm" style={{ color: BAIN.graySecondary }}>Cargando tus predicciones…</p></div>
        ) : (
          <div className="flex flex-col gap-4">
            <PredictionCard icon={<Trophy size={20} strokeWidth={1.75} />} title="Campeón del Mundial" subtitle="¿Quién levanta la copa el 19 de julio?" points={50} isLocked={isLocked} isFilled={!!specials.champion}>
              <TeamSelect value={specials.champion} onChange={(code) => setSpecials((s) => ({ ...s, champion: code }))} disabled={isLocked} />
            </PredictionCard>
            <PredictionCard icon={<Target size={20} strokeWidth={1.75} />} title="Goleador del torneo" subtitle="Jugador con más goles convertidos" points={30} isLocked={isLocked} isFilled={!!specials.topScorer.player && !!specials.topScorer.team}>
              <PlayerTeamInput player={specials.topScorer.player} team={specials.topScorer.team} onPlayerChange={(player) => setSpecials((s) => ({ ...s, topScorer: { ...s.topScorer, player } }))} onTeamChange={(team) => setSpecials((s) => ({ ...s, topScorer: { ...s.topScorer, team } }))} disabled={isLocked} playerPlaceholder="Ej: Lionel Messi" />
            </PredictionCard>
            <PredictionCard icon={<Sparkles size={20} strokeWidth={1.75} />} title="Máximo asistente" subtitle="Jugador con más asistencias" points={20} isLocked={isLocked} isFilled={!!specials.topAssister.player && !!specials.topAssister.team}>
              <PlayerTeamInput player={specials.topAssister.player} team={specials.topAssister.team} onPlayerChange={(player) => setSpecials((s) => ({ ...s, topAssister: { ...s.topAssister, player } }))} onTeamChange={(team) => setSpecials((s) => ({ ...s, topAssister: { ...s.topAssister, team } }))} disabled={isLocked} playerPlaceholder="Ej: Kevin De Bruyne" />
            </PredictionCard>
            <PredictionCard icon={<Sparkles size={20} strokeWidth={1.75} />} title="Sorpresa del torneo" subtitle="País que llega más lejos de lo esperado" points={15} isLocked={isLocked} isFilled={!!specials.darkHorse} accent="amber">
              <TeamSelect value={specials.darkHorse} onChange={(code) => setSpecials((s) => ({ ...s, darkHorse: code }))} disabled={isLocked} />
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
            <li className="flex items-center gap-3 text-sm" style={{ color: BAIN.black }}><Sparkles size={14} strokeWidth={2} style={{ color: BAIN.amber }} /><span className="flex-1">Sorpresa del torneo (semis o más)</span><span className="font-bold">15 pts</span></li>
          </ul>
        </section>
      </main>

      <Footer />
    </div>
  )
}

function PredictionCard({ icon, title, subtitle, points, isLocked, isFilled, accent = 'red', children }: {
  icon: React.ReactNode; title: string; subtitle: string; points: number; isLocked: boolean; isFilled: boolean; accent?: 'red' | 'amber'; children: React.ReactNode
}) {
  const accentColor = accent === 'amber' ? BAIN.amber : BAIN.red
  return (
    <div className="rounded-md p-5 transition-all animate-in fade-in slide-in-from-bottom-2" style={{ backgroundColor: BAIN.white, border: `1px solid ${isFilled ? BAIN.success + '40' : BAIN.grayBorder}`, opacity: isLocked ? 0.85 : 1 }}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>{icon}</div>
          <div>
            <p className="text-base font-bold tracking-tight" style={{ color: BAIN.black }}>{title}</p>
            <p className="text-xs mt-0.5" style={{ color: BAIN.graySecondary }}>{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isFilled && <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ backgroundColor: `${BAIN.success}15`, color: BAIN.success, letterSpacing: '0.06em' }}><Check size={10} strokeWidth={3} />CARGADA</span>}
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ backgroundColor: `${accentColor}15`, color: accentColor, letterSpacing: '0.06em' }}>+{points} PTS</span>
        </div>
      </div>
      {children}
    </div>
  )
}

function TeamSelect({ value, onChange, disabled }: { value: string; onChange: (code: string) => void; disabled: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {value && <div className="flex-shrink-0"><CountryFlag code={value} size="md" /></div>}
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="flex-1 px-3 py-2 rounded-md text-sm transition-colors focus:outline-none" style={{ border: `1px solid ${value ? BAIN.black : BAIN.grayBorder}`, backgroundColor: disabled ? BAIN.grayBg : BAIN.white, color: value ? BAIN.black : BAIN.graySecondary, cursor: disabled ? 'not-allowed' : 'pointer' }}>
        <option value="">— Elegí un país —</option>
        {ALL_TEAMS.map((t) => <option key={`${t.code}-${t.group}`} value={t.code}>{t.name} (Grupo {t.group})</option>)}
      </select>
    </div>
  )
}

function PlayerTeamInput({ player, team, onPlayerChange, onTeamChange, disabled, playerPlaceholder }: {
  player: string; team: string; onPlayerChange: (v: string) => void; onTeamChange: (v: string) => void; disabled: boolean; playerPlaceholder: string
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <input type="text" placeholder={playerPlaceholder} value={player} onChange={(e) => onPlayerChange(e.target.value)} disabled={disabled} className="px-3 py-2 rounded-md text-sm focus:outline-none transition-colors" style={{ border: `1px solid ${player ? BAIN.black : BAIN.grayBorder}`, backgroundColor: disabled ? BAIN.grayBg : BAIN.white, color: BAIN.black }} />
      <select value={team} onChange={(e) => onTeamChange(e.target.value)} disabled={disabled} className="px-3 py-2 rounded-md text-sm focus:outline-none transition-colors" style={{ border: `1px solid ${team ? BAIN.black : BAIN.grayBorder}`, backgroundColor: disabled ? BAIN.grayBg : BAIN.white, color: team ? BAIN.black : BAIN.graySecondary, cursor: disabled ? 'not-allowed' : 'pointer' }}>
        <option value="">— Selección —</option>
        {ALL_TEAMS.map((t) => <option key={`${t.code}-${t.group}`} value={t.code}>{t.name}</option>)}
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