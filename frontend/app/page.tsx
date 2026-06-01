'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const BAIN = {
  red: '#CC0000',
  redHover: '#990000',
  black: '#000000',
  white: '#FFFFFF',
  grayBg: '#F5F5F5',
  grayBorder: '#E5E5E5',
  graySecondary: '#666666',
} as const

const BAIN_LOGO_FULL =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFh4ztKgk26sNf9iYsiT3neD-akow1st08-g&s'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Por favor ingresá tu email corporativo')
      return
    }
    if (!email.toLowerCase().endsWith('@bain.com')) {
      setError('Solo se permiten emails @bain.com')
      return
    }
    if (!password) {
      setError('Por favor ingresá tu contraseña')
      return
    }

    setLoading(true)
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError
      router.push('/home')
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials'
        ? 'Email o contraseña incorrectos'
        : err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ backgroundColor: BAIN.grayBg }}
    >
      <div
        className="w-full max-w-[420px] bg-white rounded-md shadow-sm border animate-in fade-in slide-in-from-bottom-2 duration-500"
        style={{ borderColor: BAIN.grayBorder }}
      >
        {/* Logo Header */}
        <div
          className="px-8 pt-8 pb-6 border-b flex flex-col items-center"
          style={{ borderColor: BAIN.grayBorder }}
        >
          <div className="relative w-[140px] h-[40px] mb-3">
            <Image
              src={BAIN_LOGO_FULL}
              alt="Bain & Company"
              fill
              sizes="140px"
              className="object-contain"
              priority
              unoptimized
            />
          </div>
          <p className="text-sm" style={{ color: BAIN.graySecondary }}>
            Prode Mundial 2026
          </p>
        </div>

        {/* Title */}
        <div className="px-8 pt-8 pb-4">
          <h1 className="text-3xl font-bold mb-2 tracking-tight" style={{ color: BAIN.black }}>
            Bienvenido
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: BAIN.graySecondary }}>
            Ingresá con tu email de Bain para acceder al prode de la oficina.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 pb-6 space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: BAIN.black }}>
              Email corporativo
            </label>
            <input
              id="email"
              type="email"
              placeholder="nombre.apellido@bain.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              autoComplete="email"
              className="w-full px-3 py-2 rounded-md text-sm focus:outline-none transition-colors"
              style={{
                border: `1px solid ${error ? BAIN.red : BAIN.grayBorder}`,
                backgroundColor: BAIN.white,
                color: BAIN.black,
              }}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: BAIN.black }}>
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              autoComplete="current-password"
              className="w-full px-3 py-2 rounded-md text-sm focus:outline-none transition-colors"
              style={{
                border: `1px solid ${error ? BAIN.red : BAIN.grayBorder}`,
                backgroundColor: BAIN.white,
                color: BAIN.black,
              }}
            />
          </div>

          {error && (
            <p className="text-xs" style={{ color: BAIN.red }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full font-bold py-2.5 px-4 rounded-md text-sm transition-colors"
            style={{
              backgroundColor: BAIN.red,
              color: BAIN.white,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>

          <p className="text-center text-sm" style={{ color: BAIN.graySecondary }}>
            ¿No tenés cuenta?{' '}
            <a href="/registro" className="font-medium hover:underline" style={{ color: BAIN.red }}>
              Registrate
            </a>
          </p>
        </form>

        {/* Footer */}
        <div
          className="px-8 py-6 text-center border-t"
          style={{ borderColor: BAIN.grayBorder }}
        >
          <p className="text-xs leading-relaxed" style={{ color: BAIN.graySecondary }}>
            Solo empleados de Bain con email @bain.com pueden participar.
          </p>
        </div>
      </div>

      <div className="mt-6 text-center text-xs" style={{ color: BAIN.graySecondary }}>
        <p className="mb-1">Proyecto interno · Oficina de Bain Buenos Aires · Mundial FIFA 2026</p>
        <p>11 de junio – 19 de julio · 48 equipos · 104 partidos</p>
      </div>
    </main>
  )
}