'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { ToastProvider, useToast } from '@/components/toast'

const BAIN = {
  red: '#CC0000',
  black: '#000000',
  white: '#FFFFFF',
  grayBg: '#F5F5F5',
  grayBorder: '#E5E5E5',
  graySecondary: '#666666',
} as const

function JoinPageContent() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const code = params?.code as string

  const [torneoNombre, setTorneoNombre] = useState<string | null>(null)
  const [torneoDescripcion, setTorneoDescripcion] = useState<string | null>(null)
  const [torneoId, setTorneoId] = useState<string | null>(null)
  // estado: null=no miembro, 'pendiente', 'activo'
  const [estadoMembresía, setEstadoMembresía] = useState<string | null | undefined>(undefined)
  const [acting, setActing] = useState(false)
  const [error, setError] = useState('')

  const loadInfo = useCallback(async () => {
    if (!code) return
    const url = user
      ? `/api/torneos/info?invite_code=${code}&usuario_id=${user.id}`
      : `/api/torneos/info?invite_code=${code}`
    const res = await fetch(url)
    const json = await res.json()
    if (json.error || !json.nombre) {
      setError('Link de invitación inválido.')
      setEstadoMembresía(null)
      return
    }
    setTorneoNombre(json.nombre)
    setTorneoDescripcion(json.descripcion ?? null)
    setTorneoId(json.id)
    setEstadoMembresía(json.estado ?? null)

    // Si ya es miembro activo, redirigir a la página del torneo
    if (json.estado === 'activo') {
      router.replace(`/torneo/${json.id}`)
    }
  }, [code, user, router])

  useEffect(() => {
    if (!authLoading) loadInfo()
  }, [authLoading, loadInfo])

  const handleJoin = async () => {
    if (!user || !code) return
    setActing(true)
    setError('')
    try {
      const res = await fetch('/api/torneos/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_code: code, usuario_id: user.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al unirse')

      if (json.estado === 'activo') {
        router.push(`/torneo/${json.torneo_id}`)
      } else {
        setEstadoMembresía('pendiente')
        toast({ message: '¡Solicitud enviada! Confirmala en Mis Torneos.', type: 'success' })
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setActing(false)
    }
  }

  const handleConfirm = async () => {
    if (!user || !torneoId) return
    setActing(true)
    setError('')
    try {
      const res = await fetch('/api/torneos/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ torneo_id: torneoId, usuario_id: user.id }),
      })
      if (!res.ok) throw new Error('Error al confirmar')
      toast({ message: '¡Te uniste al torneo!', type: 'success' })
      setTimeout(() => router.push(`/torneo/${torneoId}`), 800)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setActing(false)
    }
  }

  if (authLoading || estadoMembresía === undefined) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BAIN.grayBg }}>
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: `${BAIN.red} transparent transparent transparent` }} />
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: BAIN.grayBg }}>
      <div className="w-full max-w-sm rounded-md p-8 shadow-sm"
        style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}` }}>

        <p className="text-xs font-bold uppercase mb-1" style={{ color: BAIN.red, letterSpacing: '0.1em' }}>
          INVITACIÓN A TORNEO
        </p>

        {error ? (
          <p className="text-sm mt-3" style={{ color: BAIN.red }}>{error}</p>
        ) : !torneoNombre ? (
          <p className="text-sm mt-3" style={{ color: BAIN.graySecondary }}>Cargando invitación...</p>
        ) : (
          <>
            <h1 className="text-2xl font-bold mt-1 mb-1" style={{ color: BAIN.black }}>{torneoNombre}</h1>
            {torneoDescripcion && (
              <p className="text-sm mb-4" style={{ color: BAIN.graySecondary }}>{torneoDescripcion}</p>
            )}

            {!user ? (
              <div className="mt-6">
                <p className="text-sm mb-4" style={{ color: BAIN.graySecondary }}>
                  Necesitás iniciar sesión para unirte.
                </p>
                <Link href={`/?returnUrl=/torneo/join/${code}`}
                  className="block w-full text-center py-2.5 rounded-md text-sm font-bold"
                  style={{ backgroundColor: BAIN.red, color: BAIN.white }}>
                  Iniciar sesión
                </Link>
              </div>
            ) : estadoMembresía === 'pendiente' ? (
              <div className="mt-6">
                <div className="rounded-md px-4 py-3 mb-4 text-sm"
                  style={{ backgroundColor: '#FFF8E1', border: '1px solid #FFD54F', color: '#5D4037' }}>
                  Tu solicitud está pendiente de confirmación. Podés confirmarla desde acá o desde <strong>Mis Torneos</strong>.
                </div>
                <button type="button" onClick={handleConfirm} disabled={acting}
                  className="w-full py-2.5 rounded-md text-sm font-bold"
                  style={{ backgroundColor: BAIN.red, color: BAIN.white, opacity: acting ? 0.7 : 1 }}>
                  {acting ? 'Confirmando...' : 'Confirmar unión'}
                </button>
              </div>
            ) : (
              <div className="mt-6">
                <p className="text-sm mb-4" style={{ color: BAIN.graySecondary }}>
                  Te invitaron a unirte a este torneo.
                </p>
                <button type="button" onClick={handleJoin} disabled={acting}
                  className="w-full py-2.5 rounded-md text-sm font-bold"
                  style={{ backgroundColor: BAIN.red, color: BAIN.white, opacity: acting ? 0.7 : 1 }}>
                  {acting ? 'Procesando...' : 'Unirse al torneo'}
                </button>
              </div>
            )}
          </>
        )}

        <Link href="/mi-torneo" className="block text-center text-sm mt-5 hover:underline"
          style={{ color: BAIN.graySecondary }}>
          Ver Mis Torneos
        </Link>
      </div>
    </main>
  )
}

export default function JoinPage() {
  return <ToastProvider><JoinPageContent /></ToastProvider>
}