'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, User } from 'lucide-react'
import { TopNav } from '@/components/top-nav'
import { Footer } from '@/components/footer'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

const BAIN = {
  red: '#CC0000',
  black: '#000000',
  white: '#FFFFFF',
  grayBg: '#F5F5F5',
  grayBorder: '#E5E5E5',
  graySecondary: '#666666',
  grayTertiary: '#999999',
} as const

const TENURE_OPTIONS = ['AC', 'SAC', 'C', 'M', 'SM', 'AP', 'P'] as const
const OFICINA_OPTIONS = [
  'Buenos Aires', 'Santiago', 'Lima', 'Bogotá', 'São Paulo', 'Ciudad de México', 'Monterrey',
] as const

type FormState = {
  nombre: string
  apellido: string
  tenure: string
  oficina: string
}

function LabeledField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase mb-2" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

export default function PerfilPage() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [form, setForm] = useState<FormState>({ nombre: '', apellido: '', tenure: '', oficina: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const { data } = await supabase.from('usuarios').select('nombre, apellido, tenure, oficina').eq('id', user.id).single()
        if (data) {
          setForm({
            nombre: data.nombre ?? '',
            apellido: data.apellido ?? '',
            tenure: data.tenure ?? '',
            oficina: data.oficina ?? '',
          })
        }
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [user])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: user.id,
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          tenure: form.tenure || null,
          oficina: form.oficina || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al guardar')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: BAIN.grayBg }}>
      <TopNav />

      <main className="flex-1 max-w-[600px] w-full mx-auto px-6 py-10">
        <section className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: BAIN.black }}>
              <User size={18} color={BAIN.white} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase" style={{ color: BAIN.red, letterSpacing: '0.1em' }}>PERFIL</p>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: BAIN.black }}>Mi cuenta</h1>
            </div>
          </div>
          <p className="text-sm mt-2" style={{ color: BAIN.graySecondary }}>{user.email}</p>
        </section>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: `${BAIN.red} transparent transparent transparent` }} />
          </div>
        ) : (
          <form onSubmit={handleSave}
            className="rounded-md p-6 flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-500"
            style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}` }}>

            <div className="grid grid-cols-2 gap-4">
              <LabeledField label="Nombre">
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Tu nombre"
                  className="w-full px-3 py-2.5 rounded-md text-sm focus:outline-none"
                  style={{ border: `1px solid ${BAIN.grayBorder}`, backgroundColor: BAIN.white, color: BAIN.black }}
                />
              </LabeledField>
              <LabeledField label="Apellido">
                <input
                  type="text"
                  value={form.apellido}
                  onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))}
                  placeholder="Tu apellido"
                  className="w-full px-3 py-2.5 rounded-md text-sm focus:outline-none"
                  style={{ border: `1px solid ${BAIN.grayBorder}`, backgroundColor: BAIN.white, color: BAIN.black }}
                />
              </LabeledField>
            </div>

            <LabeledField label="Tenure">
              <select
                value={form.tenure}
                onChange={e => setForm(f => ({ ...f, tenure: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-md text-sm focus:outline-none"
                style={{ border: `1px solid ${BAIN.grayBorder}`, backgroundColor: BAIN.white, color: form.tenure ? BAIN.black : BAIN.graySecondary }}
              >
                <option value="">Seleccioná tu tenure</option>
                {TENURE_OPTIONS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </LabeledField>

            <LabeledField label="Oficina">
              <select
                value={form.oficina}
                onChange={e => setForm(f => ({ ...f, oficina: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-md text-sm focus:outline-none"
                style={{ border: `1px solid ${BAIN.grayBorder}`, backgroundColor: BAIN.white, color: form.oficina ? BAIN.black : BAIN.graySecondary }}
              >
                <option value="">Seleccioná tu oficina</option>
                {OFICINA_OPTIONS.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </LabeledField>

            {error && <p className="text-sm" style={{ color: BAIN.red }}>{error}</p>}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-bold transition-all"
                style={{
                  backgroundColor: saved ? '#0F7B3E' : BAIN.red,
                  color: BAIN.white,
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Guardando…' : saved ? <><Check size={14} />Guardado</> : 'Guardar cambios'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2.5 rounded-md text-sm font-medium"
                style={{ backgroundColor: BAIN.grayBg, border: `1px solid ${BAIN.grayBorder}`, color: BAIN.black }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={signOut}
                className="ml-auto px-4 py-2.5 rounded-md text-sm font-medium"
                style={{ color: BAIN.red }}
              >
                Cerrar sesión
              </button>
            </div>
          </form>
        )}
      </main>

      <Footer />
    </div>
  )
}