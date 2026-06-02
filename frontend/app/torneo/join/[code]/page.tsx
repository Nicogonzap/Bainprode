'use client'

import { useState, useEffect } from 'react'
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
  const [torneoId, setTorneoId] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!code) return
    fetch(`/api/torneos/info?invite_code=${code}`)
      .then(r => r.json())
      .then(({ nombre, id, error: e }) => {
        if (e || !nombre) { setError('Link de invitación inválido.'); return }
        setTorneoNombre(nombre)
        setTorneoId(id)
      })
      .catch(() => setError('Error al cargar la invitación.'))
  }, [code])

  const handleJoin = async () => {
    if (!user) return
    setJoining(true)
    setError('')
    try {
      const res = await fetch('/api/torneos/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_code: code, usuario_id: user.id }),
      })
      const json = await res.json()
      if (!res.ok && !json.already_member) throw new Error(json.error || 'Error al unirse')
      setJoined(true)
      toast({ message: json.already_member ? 'Ya sos miembro de este torneo' : '¡Te uniste al torneo!', type: 'success' })
      setTimeout(() => router.push(`/torneo/${json.torneo_id}`), 1200)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setJoining(false)
    }
  }

  if (authLoading) return null

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: BAIN.grayBg }}>
      <div className="w-full max-w-sm rounded-md p-8 shadow-sm"
        style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}` }}>
        <h1 className="text-2xl font-bold mb-2" style={{ color: BAIN.black }}>
          Invitación a torneo
        </h1>

        {error ? (
          <p className="text-sm mt-3" style={{ color: BAIN.red }}>{error}</p>
        ) : !torneoNombre ? (
          <p className="text-sm mt-3" style={{ color: BAIN.graySecondary }}>Cargando invitación...</p>
        ) : (
          <>
            <p className="text-sm mt-2 mb-6" style={{ color: BAIN.graySecondary }}>
              Te invitaron a unirte a{' '}
              <span className="font-bold" style={{ color: BAIN.black }}>{torneoNombre}</span>
            </p>

            {!user ? (
              <>
                <p className="text-sm mb-4" style={{ color: BAIN.graySecondary }}>
                  Necesitás iniciar sesión para unirte.
                </p>
                <Link href={`/?returnUrl=/torneo/join/${code}`}
                  className="block w-full text-center py-2.5 rounded-md text-sm font-bold"
                  style={{ backgroundColor: BAIN.red, color: BAIN.white }}>
                  Iniciar sesión
                </Link>
              </>
            ) : joined ? (
              <p className="text-sm font-medium text-center py-4" style={{ color: BAIN.graySecondary }}>
                Redirigiendo...
              </p>
            ) : (
              <button type="button" onClick={handleJoin} disabled={joining}
                className="w-full py-2.5 rounded-md text-sm font-bold transition-opacity"
                style={{ backgroundColor: BAIN.red, color: BAIN.white, opacity: joining ? 0.7 : 1 }}>
                {joining ? 'Uniéndome...' : 'Unirme al torneo'}
              </button>
            )}
          </>
        )}

        <Link href="/home" className="block text-center text-sm mt-5 hover:underline"
          style={{ color: BAIN.graySecondary }}>
          Ir al inicio
        </Link>
      </div>
    </main>
  )
}

export default function JoinPage() {
  return <ToastProvider><JoinPageContent /></ToastProvider>
}