'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Copy, Check, ArrowLeft, Users, Pencil, X, Save } from 'lucide-react'
import { TopNav } from '@/components/top-nav'
import { Footer } from '@/components/footer'
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
} as const

type Torneo = { id: string; nombre: string; descripcion: string | null; invite_code: string; creado_por: string }
type Miembro = { id: string; nombre: string | null; apellido: string | null; nombre_usuario: string | null; tenure: string | null; puntos: number }

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

  const cancelEdit = () => setEditing(false)

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

  const getNombre = (m: Miembro) =>
    m.nombre && m.apellido ? `${m.nombre} ${m.apellido}` : m.nombre_usuario ?? 'Usuario'

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: BAIN.grayBg }}>
      <TopNav />
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-10">
        <Link href="/mi-torneo" className="inline-flex items-center gap-2 text-sm mb-6 hover:underline"
          style={{ color: BAIN.graySecondary }}>
          <ArrowLeft size={16} /> Mis Torneos
        </Link>

        {loading ? (
          <p className="text-sm" style={{ color: BAIN.graySecondary }}>Cargando torneo...</p>
        ) : error ? (
          <p className="text-sm" style={{ color: BAIN.red }}>{error}</p>
        ) : torneo && (
          <>
            <section className="mb-8">
              {editing ? (
                <div className="flex flex-col gap-3 max-w-lg">
                  <input
                    type="text"
                    value={editNombre}
                    onChange={e => setEditNombre(e.target.value)}
                    maxLength={80}
                    className="text-2xl font-bold px-3 py-2 rounded-md outline-none"
                    style={{ border: `1px solid ${BAIN.grayBorder}`, color: BAIN.black, backgroundColor: BAIN.white }}
                  />
                  <textarea
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    placeholder="Descripción (opcional)"
                    rows={2}
                    maxLength={300}
                    className="px-3 py-2 rounded-md text-sm outline-none resize-none"
                    style={{ border: `1px solid ${BAIN.grayBorder}`, color: BAIN.black, backgroundColor: BAIN.white }}
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={handleSave} disabled={saving || !editNombre.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-bold"
                      style={{ backgroundColor: BAIN.red, color: BAIN.white, opacity: saving || !editNombre.trim() ? 0.6 : 1 }}>
                      <Save size={14} />{saving ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button type="button" onClick={cancelEdit}
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
              <div className="lg:col-span-3">
                <div className="rounded-md overflow-hidden" style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}` }}>
                  <div className="px-6 py-4" style={{ borderBottom: `1px solid ${BAIN.grayBorder}` }}>
                    <h2 className="text-base font-bold" style={{ color: BAIN.black }}>Ranking</h2>
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
                          return (
                            <tr key={m.id} style={{ borderBottom: `1px solid ${BAIN.grayBorder}`, backgroundColor: isMe ? '#FFF8F8' : BAIN.white }}>
                              <td className="px-6 py-3 text-sm font-bold" style={{ color: i === 0 ? BAIN.red : BAIN.black }}>{i + 1}</td>
                              <td className="px-6 py-3">
                                <span className="text-sm font-medium" style={{ color: BAIN.black }}>
                                  {getNombre(m)}
                                  {isMe && <span className="ml-2 text-xs" style={{ color: BAIN.red }}>tú</span>}
                                </span>
                              </td>
                              <td className="px-6 py-3 text-sm" style={{ color: BAIN.graySecondary }}>{m.tenure ?? '—'}</td>
                              <td className="px-6 py-3 text-sm font-bold text-right" style={{ color: BAIN.black }}>{m.puntos}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

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