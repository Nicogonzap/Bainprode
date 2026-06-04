'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Copy, Check, ArrowLeft, Users, Pencil, X, Save, ChevronDown, ChevronUp } from 'lucide-react'
import { TopNav } from '@/components/top-nav'
import { Footer } from '@/components/footer'
import { ToastProvider, useToast } from '@/components/toast'
import { useAuth } from '@/lib/auth-context'
import { CountryFlag } from '@/components/country-flag'

const BAIN = {
  red: '#CC0000',
  black: '#000000',
  white: '#FFFFFF',
  grayBg: '#F5F5F5',
  grayBorder: '#E5E5E5',
  graySecondary: '#666666',
  grayTertiary: '#999999',
} as const

type Torneo = { id: string; nombre: string; descripcion: string | null; invite_code: string; creado_por: string }
type Miembro = { id: string; nombre: string | null; apellido: string | null; nombre_usuario: string | null; tenure: string | null; puntos: number }

type Detalle = {
  partido_id: string
  fecha: string
  fase: string
  grupo_fase: string | null
  local_codigo: string
  local_nombre: string
  local_url: string | null
  visitante_codigo: string
  visitante_nombre: string
  visitante_url: string | null
  resultado_local: number
  resultado_visitante: number
  pred_local: number | null
  pred_visitante: number | null
  puntos: number
  es_exacto: boolean
}

function getNombre(m: Miembro) {
  return m.nombre && m.apellido
    ? `${m.nombre} ${m.apellido}`
    : m.nombre_usuario ?? 'Usuario'
}

function getInitials(nombre: string) {
  return nombre.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
}

function PointsBadge({ puntos, esExacto, hasPred }: { puntos: number; esExacto: boolean; hasPred: boolean }) {
  if (!hasPred) return <span className="text-xs font-medium" style={{ color: BAIN.grayTertiary }}>—</span>
  if (puntos === 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold"
        style={{ backgroundColor: '#F5F5F5', color: BAIN.graySecondary }}>0 pts</span>
    )
  }
  if (esExacto) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold"
        style={{ backgroundColor: '#E8F5E9', color: '#2E7D32' }}>{puntos} pts ✓✓</span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold"
      style={{ backgroundColor: '#FFF8E1', color: '#E65100' }}>{puntos} pts ✓</span>
  )
}

function DetallePanel({ torneoId, userId, memberName }: { torneoId: string; userId: string; memberName: string }) {
  const [detalles, setDetalles] = useState<Detalle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/torneos/${torneoId}/detalles?usuario_id=${userId}`)
      .then((r) => r.json())
      .then(({ detalles: d, error: e }) => {
        if (e) { setError(e); return }
        setDetalles(d ?? [])
      })
      .catch(() => setError('Error al cargar'))
      .finally(() => setLoading(false))
  }, [torneoId, userId])

  if (loading) {
    return (
      <tr style={{ backgroundColor: '#FAFAFA' }}>
        <td colSpan={4} className="px-6 py-4 text-center">
          <div className="flex justify-center">
            <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: `${BAIN.red} transparent transparent transparent` }} />
          </div>
        </td>
      </tr>
    )
  }

  if (error) {
    return (
      <tr style={{ backgroundColor: '#FAFAFA' }}>
        <td colSpan={4} className="px-6 py-3 text-xs" style={{ color: BAIN.red }}>{error}</td>
      </tr>
    )
  }

  if (detalles.length === 0) {
    return (
      <tr style={{ backgroundColor: '#FAFAFA' }}>
        <td colSpan={4} className="px-6 py-4 text-xs" style={{ color: BAIN.graySecondary }}>
          {memberName} aún no tiene predicciones en partidos finalizados.
        </td>
      </tr>
    )
  }

  return (
    <tr style={{ backgroundColor: '#FAFAFA' }}>
      <td colSpan={4} className="px-4 pb-4 pt-2">
        <div className="rounded-md overflow-hidden" style={{ border: `1px solid ${BAIN.grayBorder}` }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ backgroundColor: BAIN.grayBg }}>
                <th className="px-3 py-2 text-left font-semibold uppercase" style={{ color: BAIN.graySecondary, letterSpacing: '0.06em' }}>Partido</th>
                <th className="px-3 py-2 text-center font-semibold uppercase" style={{ color: BAIN.graySecondary, letterSpacing: '0.06em' }}>Resultado</th>
                <th className="px-3 py-2 text-center font-semibold uppercase" style={{ color: BAIN.graySecondary, letterSpacing: '0.06em' }}>Predicción</th>
                <th className="px-3 py-2 text-right font-semibold uppercase" style={{ color: BAIN.graySecondary, letterSpacing: '0.06em' }}>Pts</th>
              </tr>
            </thead>
            <tbody>
              {detalles.map((d) => (
                <tr key={d.partido_id} style={{ borderTop: `1px solid ${BAIN.grayBorder}`, backgroundColor: BAIN.white }}>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <CountryFlag code={d.local_codigo} url={d.local_url ?? undefined} size="sm" />
                      <span className="font-medium truncate max-w-[70px] hidden sm:inline" style={{ color: BAIN.black }}>{d.local_nombre}</span>
                      <span className="text-gray-400 mx-0.5">vs</span>
                      <CountryFlag code={d.visitante_codigo} url={d.visitante_url ?? undefined} size="sm" />
                      <span className="font-medium truncate max-w-[70px] hidden sm:inline" style={{ color: BAIN.black }}>{d.visitante_nombre}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="font-bold tabular-nums" style={{ color: BAIN.black }}>
                      {d.resultado_local} — {d.resultado_visitante}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {d.pred_local !== null && d.pred_visitante !== null ? (
                      <span className="tabular-nums font-medium" style={{ color: BAIN.graySecondary }}>
                        {d.pred_local} — {d.pred_visitante}
                      </span>
                    ) : (
                      <span style={{ color: BAIN.grayTertiary }}>—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <PointsBadge
                      puntos={d.puntos}
                      esExacto={d.es_exacto}
                      hasPred={d.pred_local !== null}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  )
}

function TorneoPageContent() {
  const params = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const id = params?.id as string

  const [torneo, setTorneo] = useState<Torneo | null>(null)
  const [members, setMembers] = useState<Miembro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  // Edicion
  const [editing, setEditing] = useState(false)
  const [editNombre, setEditNombre] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [saving, setSaving] = useState(false)

  const inviteUrl = torneo && typeof window !== 'undefined'
    ? `${window.location.origin}/torneo/join/${torneo.invite_code}`
    : ''

  const isCreator = !!user && torneo?.creado_por === user.id

  useEffect(() => {
    if (!id) return
    fetch(`/api/torneos/${id}`)
      .then(r => r.json())
      .then(({ torneo: t, members: m, error: e }) => {
        if (e) { setError(e); return }
        setTorneo(t)
        setMembers(m ?? [])
      })
      .catch(() => setError('Error al cargar el torneo'))
      .finally(() => setLoading(false))
  }, [id])

  const toggleExpand = useCallback((memberId: string) => {
    setExpanded(prev => prev === memberId ? null : memberId)
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      toast({ message: 'Link copiado', type: 'success', duration: 2000 })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({ message: 'No se pudo copiar', type: 'error' })
    }
  }

  const startEdit = () => {
    if (!torneo) return
    setEditNombre(torneo.nombre)
    setEditDesc(torneo.descripcion ?? '')
    setEditing(true)
  }

  const handleSave = async () => {
    if (!torneo || !user) return
    setSaving(true)
    try {
      const res = await fetch(`/api/torneos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: editNombre, descripcion: editDesc, usuario_id: user.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al guardar')
      setTorneo(json.torneo)
      setEditing(false)
      toast({ message: 'Torneo actualizado', type: 'success', duration: 2000 })
    } catch (e: any) {
      toast({ message: e.message, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: BAIN.grayBg }}>
      <TopNav />
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-10">
        <Link href="/mi-torneo" className="inline-flex items-center gap-2 text-sm mb-6 hover:underline"
          style={{ color: BAIN.graySecondary }}>
          <ArrowLeft size={16} /> Mis Torneos
        </Link>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: `${BAIN.red} transparent transparent transparent` }} />
          </div>
        ) : error ? (
          <p className="text-sm" style={{ color: BAIN.red }}>{error}</p>
        ) : torneo && (
          <>
            <section className="mb-8">
              {editing ? (
                <div className="flex flex-col gap-3 max-w-lg">
                  <input type="text" value={editNombre} onChange={e => setEditNombre(e.target.value)}
                    maxLength={80} className="text-2xl font-bold px-3 py-2 rounded-md outline-none"
                    style={{ border: `1px solid ${BAIN.grayBorder}`, color: BAIN.black, backgroundColor: BAIN.white }} />
                  <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)}
                    placeholder="Descripción (opcional)" rows={2} maxLength={300}
                    className="px-3 py-2 rounded-md text-sm outline-none resize-none"
                    style={{ border: `1px solid ${BAIN.grayBorder}`, color: BAIN.black, backgroundColor: BAIN.white }} />
                  <div className="flex gap-2">
                    <button type="button" onClick={handleSave} disabled={saving || !editNombre.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-bold"
                      style={{ backgroundColor: BAIN.red, color: BAIN.white, opacity: saving || !editNombre.trim() ? 0.6 : 1 }}>
                      <Save size={14} />{saving ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button type="button" onClick={() => setEditing(false)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium"
                      style={{ backgroundColor: BAIN.grayBg, border: `1px solid ${BAIN.grayBorder}`, color: BAIN.black }}>
                      <X size={14} />Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight mb-1" style={{ color: BAIN.black }}>{torneo.nombre}</h1>
                    {torneo.descripcion && (
                      <p className="text-sm mb-2" style={{ color: BAIN.graySecondary }}>{torneo.descripcion}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <Users size={16} style={{ color: BAIN.graySecondary }} />
                      <span className="text-sm" style={{ color: BAIN.graySecondary }}>
                        {members.length} participante{members.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  {isCreator && (
                    <button type="button" onClick={startEdit}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium mt-1"
                      style={{ backgroundColor: BAIN.grayBg, border: `1px solid ${BAIN.grayBorder}`, color: BAIN.black }}>
                      <Pencil size={14} /> Editar
                    </button>
                  )}
                </div>
              )}
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Ranking + detalles */}
              <div className="lg:col-span-3">
                <div className="rounded-md overflow-hidden" style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}` }}>
                  <div className="px-6 py-4" style={{ borderBottom: `1px solid ${BAIN.grayBorder}` }}>
                    <h2 className="text-base font-bold" style={{ color: BAIN.black }}>Ranking</h2>
                    <p className="text-xs mt-0.5" style={{ color: BAIN.graySecondary }}>Click en un jugador para ver el detalle de sus predicciones</p>
                  </div>
                  {members.length === 0 ? (
                    <div className="px-6 py-10 text-center">
                      <p className="text-sm" style={{ color: BAIN.graySecondary }}>Aún no hay participantes.</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${BAIN.grayBorder}` }}>
                          {['#', 'Participante', 'Nivel', 'Puntos'].map(h => (
                            <th key={h} className={`px-6 py-3 text-xs font-medium uppercase ${h === 'Puntos' ? 'text-right' : 'text-left'}`}
                              style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((m, i) => {
                          const isMe = m.id === user?.id
                          const isOpen = expanded === m.id
                          const nombre = getNombre(m)
                          const inits = getInitials(nombre)
                          return (
                            <>
                              <tr
                                key={m.id}
                                onClick={() => toggleExpand(m.id)}
                                className="cursor-pointer transition-colors hover:bg-gray-50"
                                style={{
                                  borderTop: i > 0 ? `1px solid ${BAIN.grayBorder}` : undefined,
                                  backgroundColor: isOpen ? '#FFF8F8' : isMe ? '#FFF8F8' : BAIN.white,
                                }}
                              >
                                <td className="px-4 py-3 text-sm font-bold w-10" style={{ color: i === 0 ? BAIN.red : BAIN.black }}>{i + 1}</td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                      style={{ backgroundColor: BAIN.grayBg, color: BAIN.black }}>{inits}</span>
                                    <span className="text-sm font-medium" style={{ color: BAIN.black }}>
                                      {nombre}
                                      {isMe && <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: BAIN.red, color: BAIN.white }}>VOS</span>}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm" style={{ color: BAIN.graySecondary }}>{m.tenure ?? '—'}</td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <span className="text-sm font-bold" style={{ color: BAIN.black }}>{m.puntos}</span>
                                    {isOpen
                                      ? <ChevronUp size={14} style={{ color: BAIN.grayTertiary }} />
                                      : <ChevronDown size={14} style={{ color: BAIN.grayTertiary }} />}
                                  </div>
                                </td>
                              </tr>
                              {isOpen && (
                                <DetallePanel
                                  key={`detail-${m.id}`}
                                  torneoId={id}
                                  userId={m.id}
                                  memberName={nombre}
                                />
                              )}
                            </>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Invitar */}
              <div className="lg:col-span-2">
                <div className="rounded-md p-6" style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}` }}>
                  <h2 className="text-base font-bold mb-3" style={{ color: BAIN.black }}>Invitar participantes</h2>
                  <p className="text-sm mb-4" style={{ color: BAIN.graySecondary }}>
                    Compartí este link para invitar a tus colegas:
                  </p>
                  <div className="rounded-md px-3 py-2.5 mb-3 break-all"
                    style={{ backgroundColor: BAIN.grayBg, border: `1px solid ${BAIN.grayBorder}` }}>
                    <p className="text-xs font-mono" style={{ color: BAIN.black }}>{inviteUrl}</p>
                  </div>
                  <button type="button" onClick={handleCopy}
                    className="w-full py-2.5 px-4 rounded-md text-sm font-bold flex items-center justify-center gap-2"
                    style={{ backgroundColor: copied ? BAIN.black : BAIN.red, color: BAIN.white }}>
                    {copied ? <><Check size={16} />Copiado</> : <><Copy size={16} />Copiar link</>}
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}

export default function TorneoPage() {
  return <ToastProvider><TorneoPageContent /></ToastProvider>
}