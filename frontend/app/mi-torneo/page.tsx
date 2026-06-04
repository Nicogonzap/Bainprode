'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus, X, Copy, Check, LogOut, Trash2, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { TopNav } from '@/components/top-nav'
import { Footer } from '@/components/footer'
import { ToastProvider, useToast } from '@/components/toast'

const BAIN = {
  red: '#CC0000',
  black: '#000000',
  white: '#FFFFFF',
  grayBg: '#F5F5F5',
  grayBorder: '#E5E5E5',
  graySecondary: '#666666',
  grayTertiary: '#999999',
} as const

interface TorneoCard {
  id: string | null
  nombre: string
  descripcion?: string | null
  estado?: 'activo' | 'pendiente'
  participantes: number
  posicion: number | null
  puntosPrimero: number
  puntosPropios: number
  invite_code?: string
  creado_por?: string
}

// La accion se guarda directamente en el estado para evitar problemas de closure
type ConfirmState = {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  action: () => Promise<void>
}

const CONFIRM_CLOSED: ConfirmState = {
  open: false, title: '', message: '', confirmLabel: '', action: async () => {},
}

// ─── Modal de confirmacion ───────────────────────────────────────────────────

function ConfirmModal({ title, message, confirmLabel, onConfirm, onClose }: {
  title: string; message: string; confirmLabel: string
  onConfirm: () => Promise<void>; onClose: () => void
}) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try { await onConfirm() } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="w-full max-w-sm rounded-md p-6 shadow-lg"
        style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}` }}>
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle size={20} style={{ color: BAIN.red, flexShrink: 0, marginTop: 2 }} />
          <div>
            <h2 className="text-base font-bold mb-1" style={{ color: BAIN.black }}>{title}</h2>
            <p className="text-sm" style={{ color: BAIN.graySecondary }}>{message}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button type="button" onClick={onClose} disabled={loading}
            className="flex-1 py-2.5 rounded-md text-sm font-medium"
            style={{ backgroundColor: BAIN.grayBg, border: `1px solid ${BAIN.grayBorder}`, color: BAIN.black }}>
            Cancelar
          </button>
          <button type="button" onClick={handleConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-md text-sm font-bold"
            style={{ backgroundColor: BAIN.red, color: BAIN.white, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Card pendiente ──────────────────────────────────────────────────────────

function PendingTorneoCard({ card, onAccept, onReject }: {
  card: TorneoCard; onAccept: () => Promise<void>; onReject: () => Promise<void>
}) {
  const [accepting, setAccepting] = useState(false)
  const [rejecting, setRejecting] = useState(false)

  return (
    <div className="rounded-md p-6" style={{ backgroundColor: BAIN.white, border: '1px solid #FFD54F' }}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-bold uppercase" style={{ color: BAIN.red, letterSpacing: '0.1em' }}>TORNEO</p>
            <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#FFF8E1', color: '#B8860B', border: '1px solid #FFD54F' }}>
              PENDIENTE
            </span>
          </div>
          <h2 className="text-lg font-bold tracking-tight" style={{ color: BAIN.black }}>{card.nombre}</h2>
          {card.descripcion && <p className="text-sm mt-1" style={{ color: BAIN.graySecondary }}>{card.descripcion}</p>}
        </div>
      </div>
      <p className="text-sm mb-4" style={{ color: BAIN.graySecondary }}>Fuiste invitado/a a este torneo. ¿Querés unirte?</p>
      <div className="flex gap-3">
        <button type="button" disabled={accepting || rejecting}
          onClick={async () => { setAccepting(true); try { await onAccept() } finally { setAccepting(false) } }}
          className="flex-1 py-2 rounded-md text-sm font-bold"
          style={{ backgroundColor: BAIN.red, color: BAIN.white, opacity: accepting ? 0.7 : 1 }}>
          {accepting ? 'Aceptando...' : 'Aceptar'}
        </button>
        <button type="button" disabled={accepting || rejecting}
          onClick={async () => { setRejecting(true); try { await onReject() } finally { setRejecting(false) } }}
          className="flex-1 py-2 rounded-md text-sm font-bold"
          style={{ backgroundColor: BAIN.grayBg, border: `1px solid ${BAIN.grayBorder}`, color: BAIN.black, opacity: rejecting ? 0.7 : 1 }}>
          {rejecting ? 'Cancelando...' : 'Rechazar'}
        </button>
      </div>
    </div>
  )
}

// ─── Card activa ─────────────────────────────────────────────────────────────

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase mb-1" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>{label}</p>
      <p className="text-2xl font-bold tracking-tight" style={{ color: BAIN.black }}>{value}</p>
    </div>
  )
}

function TorneoCardView({ card, userId, onLeave, onDelete }: {
  card: TorneoCard; userId: string
  onLeave: (id: string, nombre: string) => void
  onDelete: (id: string, nombre: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const host = typeof window !== 'undefined' ? window.location.origin : ''
  const inviteUrl = card.invite_code ? `${host}/torneo/join/${card.invite_code}` : null
  const isGeneral = card.id === null
  const isCreator = !isGeneral && card.creado_por === userId

  return (
    <div className="rounded-md p-6" style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}` }}>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase mb-1" style={{ color: BAIN.red, letterSpacing: '0.1em' }}>
            {isGeneral ? 'RANKING GENERAL' : 'TORNEO'}
          </p>
          <h2 className="text-lg font-bold tracking-tight" style={{ color: BAIN.black }}>{card.nombre}</h2>
          {card.descripcion && <p className="text-sm mt-1" style={{ color: BAIN.graySecondary }}>{card.descripcion}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isGeneral ? (
            <Link href="/tabla" className="text-xs font-medium underline" style={{ color: BAIN.red }}>
              Ver ranking
            </Link>
          ) : (
            <Link href={`/torneo/${card.id}`} className="text-xs font-medium underline" style={{ color: BAIN.red }}>
              Ver ranking
            </Link>
          )}
          {!isGeneral && isCreator && (
            <button type="button" onClick={() => onDelete(card.id!, card.nombre)}
              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md"
              style={{ color: BAIN.red, backgroundColor: '#FFF0F0', border: `1px solid ${BAIN.red}30` }}>
              <Trash2 size={12} /> Eliminar
            </button>
          )}
          {!isGeneral && !isCreator && (
            <button type="button" onClick={() => onLeave(card.id!, card.nombre)}
              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md"
              style={{ color: BAIN.graySecondary, backgroundColor: BAIN.grayBg, border: `1px solid ${BAIN.grayBorder}` }}>
              <LogOut size={12} /> Salir
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-5" style={{ borderTop: `1px solid ${BAIN.grayBorder}` }}>
        <StatBox label="PARTICIPANTES" value={card.participantes} />
        <StatBox label="TU POSICIÓN" value={card.posicion !== null ? `${card.posicion}°` : '—'} />
        <StatBox label="PUNTOS 1°" value={card.puntosPrimero} />
        <StatBox label="TUS PUNTOS" value={card.puntosPropios} />
      </div>

      {inviteUrl && (
        <div className="mt-5 pt-5 flex items-center gap-3" style={{ borderTop: `1px solid ${BAIN.grayBorder}` }}>
          <span className="text-xs font-mono truncate flex-1" style={{ color: BAIN.graySecondary }}>{inviteUrl}</span>
          <button type="button"
            onClick={async () => { await navigator.clipboard.writeText(inviteUrl).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            className="text-xs font-medium flex-shrink-0 px-3 py-1.5 rounded-md flex items-center gap-1.5"
            style={{ backgroundColor: copied ? BAIN.black : BAIN.grayBg, border: `1px solid ${BAIN.grayBorder}`, color: copied ? BAIN.white : BAIN.black }}>
            {copied ? <><Check size={12} />Copiado</> : <><Copy size={12} />Copiar link</>}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Modal crear torneo ──────────────────────────────────────────────────────

function CrearTorneoModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim() || !user) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/torneos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), descripcion: descripcion.trim() || null, creado_por: user.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al crear el torneo')
      toast({ message: '¡Torneo creado! Compartí el link para invitar.', type: 'success' })
      onCreated()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="w-full max-w-md rounded-md p-6 shadow-lg"
        style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}` }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ color: BAIN.black }}>Crear torneo</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-md hover:opacity-60" style={{ color: BAIN.graySecondary }}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium uppercase mb-1.5" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>Nombre *</label>
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Prode Bain Chile" maxLength={80} required
              className="w-full px-3 py-2.5 rounded-md text-sm outline-none"
              style={{ border: `1px solid ${BAIN.grayBorder}`, color: BAIN.black, backgroundColor: BAIN.white }} />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase mb-1.5" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>Descripción (opcional)</label>
            <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
              placeholder="Descripción del torneo..." rows={3} maxLength={300}
              className="w-full px-3 py-2.5 rounded-md text-sm outline-none resize-none"
              style={{ border: `1px solid ${BAIN.grayBorder}`, color: BAIN.black, backgroundColor: BAIN.white }} />
          </div>
          {error && <p className="text-sm" style={{ color: BAIN.red }}>{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-md text-sm font-medium"
              style={{ backgroundColor: BAIN.grayBg, border: `1px solid ${BAIN.grayBorder}`, color: BAIN.black }}>Cancelar</button>
            <button type="submit" disabled={loading || !nombre.trim()}
              className="flex-1 py-2.5 rounded-md text-sm font-bold"
              style={{ backgroundColor: BAIN.red, color: BAIN.white, opacity: loading || !nombre.trim() ? 0.6 : 1 }}>
              {loading ? 'Creando...' : 'Crear torneo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Pagina principal ────────────────────────────────────────────────────────

function MisTorneosContent() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [cards, setCards] = useState<TorneoCard[]>([])
  const [pendingCards, setPendingCards] = useState<TorneoCard[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [confirm, setConfirm] = useState<ConfirmState>(CONFIRM_CLOSED)

  const load = useCallback(async () => {
    if (!user) return
    const userId = user.id
    try {
      const [lbRes, torneosRes] = await Promise.all([
        fetch('/api/leaderboard'),
        fetch(`/api/torneos?usuario_id=${userId}`),
      ])
      const lbJson = await lbRes.json()
      const torneosJson = await torneosRes.json()

      const lb: any[] = lbJson.data ?? []
      const userEntry = lb.find((r: any) => r.usuario_id === userId)
      const generalCard: TorneoCard = {
        id: null,
        nombre: 'Ranking General — Prode Mundial 2026',
        participantes: lb.length,
        posicion: userEntry?.posicion ?? null,
        puntosPrimero: lb[0]?.puntos_totales ?? 0,
        puntosPropios: userEntry?.puntos_totales ?? 0,
      }

      const torneosList: any[] = torneosJson.data ?? []
      const activosList = torneosList.filter((t: any) => (t.estado ?? 'activo') === 'activo')
      const pendientesList = torneosList.filter((t: any) => t.estado === 'pendiente')

      const activoCards: TorneoCard[] = await Promise.all(
        activosList.map(async (t: any) => {
          const res = await fetch(`/api/torneos/${t.id}`)
          const json = await res.json()
          const members: any[] = json.members ?? []
          const pos = members.findIndex((m: any) => m.id === userId)
          return {
            id: t.id,
            nombre: t.nombre,
            descripcion: t.descripcion ?? null,
            estado: 'activo' as const,
            participantes: members.length,
            posicion: pos >= 0 ? pos + 1 : null,
            puntosPrimero: members[0]?.puntos ?? 0,
            puntosPropios: pos >= 0 ? members[pos].puntos : 0,
            invite_code: t.invite_code,
            creado_por: t.creado_por,
          }
        })
      )

      const pendienteCards: TorneoCard[] = pendientesList.map((t: any) => ({
        id: t.id,
        nombre: t.nombre,
        descripcion: t.descripcion ?? null,
        estado: 'pendiente' as const,
        participantes: 0,
        posicion: null,
        puntosPrimero: 0,
        puntosPropios: 0,
        invite_code: t.invite_code,
      }))

      setCards([generalCard, ...activoCards])
      setPendingCards(pendienteCards)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { if (user) load() }, [user, load])

  const reload = useCallback(() => {
    setLoading(true); setCards([]); setPendingCards([]); load()
  }, [load])

  const handleAcceptPending = async (torneoId: string) => {
    const res = await fetch('/api/torneos/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ torneo_id: torneoId, usuario_id: user?.id }),
    })
    if (!res.ok) { toast({ message: 'Error al aceptar', type: 'error' }); return }
    toast({ message: '¡Te uniste al torneo!', type: 'success' })
    reload()
  }

  const handleRejectPending = async (torneoId: string) => {
    const res = await fetch('/api/torneos/accept', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ torneo_id: torneoId, usuario_id: user?.id }),
    })
    if (!res.ok) { toast({ message: 'Error al rechazar', type: 'error' }); return }
    toast({ message: 'Invitación rechazada', type: 'success', duration: 2000 })
    setPendingCards(prev => prev.filter(c => c.id !== torneoId))
  }

  // onLeave y onDelete reciben el id directamente en la closure, sin depender del estado confirm
  const handleLeave = useCallback((torneoId: string, torneoNombre: string) => {
    setConfirm({
      open: true,
      title: '¿Salir del torneo?',
      message: `Vas a salir de "${torneoNombre}". Dejará de aparecer en tu lista y no vas a sumar puntos en ese torneo.`,
      confirmLabel: 'Salir del torneo',
      action: async () => {
        const res = await fetch('/api/torneos/accept', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ torneo_id: torneoId, usuario_id: user?.id }),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          toast({ message: json.error || 'Error al salir del torneo', type: 'error' })
          return
        }
        toast({ message: 'Saliste del torneo', type: 'success', duration: 2000 })
        setConfirm(CONFIRM_CLOSED)
        reload()
      },
    })
  }, [user, toast, reload])

  const handleDelete = useCallback((torneoId: string, torneoNombre: string) => {
    setConfirm({
      open: true,
      title: '¿Eliminar torneo?',
      message: `Vas a eliminar "${torneoNombre}" permanentemente. Todos los participantes perderán acceso al torneo.`,
      confirmLabel: 'Eliminar torneo',
      action: async () => {
        const res = await fetch(`/api/torneos/${torneoId}?usuario_id=${user?.id}`, {
          method: 'DELETE',
        })
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          toast({ message: json.error || 'Error al eliminar el torneo', type: 'error' })
          return
        }
        toast({ message: 'Torneo eliminado', type: 'success', duration: 2000 })
        setConfirm(CONFIRM_CLOSED)
        reload()
      },
    })
  }, [user, toast, reload])

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: BAIN.grayBg }}>
      <TopNav activePage="mi-torneo" />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-10">
        <section className="flex items-end justify-between mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div>
            <p className="text-xs font-bold uppercase mb-2" style={{ color: BAIN.red, letterSpacing: '0.1em' }}>TORNEOS</p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: BAIN.black }}>Mis Torneos</h1>
          </div>
          <button type="button" onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-bold flex-shrink-0"
            style={{ backgroundColor: BAIN.red, color: BAIN.white }}>
            <Plus size={16} /> Crear torneo
          </button>
        </section>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: `${BAIN.red} transparent transparent transparent` }} />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {pendingCards.length > 0 && (
              <>
                <p className="text-xs font-bold uppercase mt-2" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>
                  INVITACIONES PENDIENTES
                </p>
                {pendingCards.map(card => (
                  <PendingTorneoCard key={card.id} card={card}
                    onAccept={() => handleAcceptPending(card.id!)}
                    onReject={() => handleRejectPending(card.id!)} />
                ))}
                <p className="text-xs font-bold uppercase mt-4" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>
                  MIS TORNEOS
                </p>
              </>
            )}
            {cards.map(card => (
              <TorneoCardView key={card.id ?? 'general'} card={card} userId={user?.id ?? ''}
                onLeave={handleLeave}
                onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>

      <Footer />

      {showCreate && (
        <CrearTorneoModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); reload() }}
        />
      )}

      {confirm.open && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          onConfirm={confirm.action}
          onClose={() => setConfirm(CONFIRM_CLOSED)}
        />
      )}
    </div>
  )
}

export default function MisTorneosPage() {
  return (
    <ToastProvider>
      <MisTorneosContent />
    </ToastProvider>
  )
}