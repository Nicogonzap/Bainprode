'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) { setError('Por favor ingresá tu email corporativo'); return }
    if (!email.toLowerCase().endsWith('@bain.com')) { setError('Solo se permiten emails @bain.com'); return }
    if (!password) { setError('Por favor ingresá tu contraseña'); return }

    setLoading(true)
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError
      if (rememberMe) {
        localStorage.removeItem('prode_no_remember')
      } else {
        localStorage.setItem('prode_no_remember', '1')
        sessionStorage.setItem('prode_active', '1')
      }
      router.push('/home')
    } catch (err: any) {
      setError(
        err.message === 'Invalid login credentials'
          ? 'Email o contraseña incorrectos'
          : err.message || 'Error al iniciar sesión'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex">
      {/* Left panel — black */}
      <div
        className="hidden lg:flex flex-col justify-between w-[460px] flex-shrink-0 p-12"
        style={{ backgroundColor: '#000000' }}
      >
        {/* Logo */}
        <div>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="font-black text-3xl tracking-tight" style={{ color: '#FFFFFF', letterSpacing: '-0.03em' }}>BAIN</span>
            <span className="text-sm font-bold ml-1.5" style={{ color: '#CC0000' }}>&amp; COMPANY</span>
          </div>
          <p className="text-sm" style={{ color: '#555555' }}>Prode Mundial 2026</p>
        </div>

        {/* Watermark + tagline */}
        <div>
          <div className="font-black text-[140px] leading-none select-none" style={{ color: '#111111', letterSpacing: '-0.04em' }}>
            26
          </div>
          <h2 className="text-2xl font-bold mt-4 leading-snug" style={{ color: '#FFFFFF' }}>
            Predecí. Competí.<br />Ganá la gloria.
          </h2>
          <p className="text-sm mt-3" style={{ color: '#666666' }}>
            El prode oficial de Bain para el Mundial USA · MEX · CAN 2026.
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-8">
          {[['104', 'Partidos'], ['48', 'Equipos'], ['3', 'Sedes']].map(([val, lbl]) => (
            <div key={lbl}>
              <p className="text-2xl font-black leading-none" style={{ color: '#FFFFFF' }}>{val}</p>
              <p className="text-xs font-medium uppercase mt-1" style={{ color: '#555555', letterSpacing: '0.08em' }}>{lbl}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — login form */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 py-12"
        style={{ backgroundColor: '#0a0a0a' }}
      >
        {/* Mobile logo */}
        <div className="lg:hidden mb-10 text-center">
          <div className="flex items-baseline justify-center gap-1 mb-1">
            <span className="font-black text-2xl tracking-tight" style={{ color: '#FFFFFF', letterSpacing: '-0.03em' }}>BAIN</span>
            <span className="text-xs font-bold ml-1" style={{ color: '#CC0000' }}>&amp; COMPANY</span>
          </div>
          <p className="text-xs" style={{ color: '#555555' }}>Prode Mundial 2026</p>
        </div>

        <div className="w-full max-w-[380px] animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h1 className="text-2xl font-bold mb-1 tracking-tight" style={{ color: '#FFFFFF' }}>Iniciar sesión</h1>
          <p className="text-sm mb-8" style={{ color: '#666666' }}>Ingresá con tu email corporativo de Bain.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            <div>
              <label htmlFor="email" className="block text-xs font-medium uppercase mb-2" style={{ color: '#888888', letterSpacing: '0.08em' }}>
                Email corporativo
              </label>
              <input
                id="email"
                type="email"
                placeholder="nombre.apellido@bain.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                autoComplete="email"
                className="w-full px-4 py-3 rounded-md text-sm focus:outline-none"
                style={{
                  border: `1px solid ${error ? '#CC0000' : '#2a2a2a'}`,
                  backgroundColor: '#141414',
                  color: '#FFFFFF',
                }}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium uppercase mb-2" style={{ color: '#888888', letterSpacing: '0.08em' }}>
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-md text-sm focus:outline-none"
                style={{
                  border: `1px solid ${error ? '#CC0000' : '#2a2a2a'}`,
                  backgroundColor: '#141414',
                  color: '#FFFFFF',
                }}
              />
            </div>

            {error && <p className="text-xs" style={{ color: '#CC0000' }}>{error}</p>}

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded accent-red-600 cursor-pointer"
              />
              <span className="text-sm" style={{ color: '#888888' }}>Recordarme</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full font-bold py-3 px-4 rounded-md text-sm transition-opacity"
              style={{ backgroundColor: '#CC0000', color: '#FFFFFF', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Ingresando…' : 'Ingresar'}
            </button>

            <p className="text-center text-sm" style={{ color: '#666666' }}>
              ¿No tenés cuenta?{' '}
              <Link href="/registro" className="font-medium hover:opacity-80" style={{ color: '#CC0000' }}>
                Registrate
              </Link>
            </p>
          </form>

          <p className="text-xs text-center mt-10" style={{ color: '#333333' }}>
            Solo empleados con email @bain.com pueden participar.
          </p>
        </div>
      </div>
    </main>
  )
}