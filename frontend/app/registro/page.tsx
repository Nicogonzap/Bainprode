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

type Tenure = 'AC' | 'SAC' | 'C' | 'M' | 'SM' | 'AP' | 'P'

const TENURE_OPTIONS: { value: Tenure; label: string }[] = [
  { value: 'AC', label: 'AC — Associate Consultant' },
  { value: 'SAC', label: 'SAC — Senior Associate Consultant' },
  { value: 'C', label: 'C — Consultant' },
  { value: 'M', label: 'M — Manager' },
  { value: 'SM', label: 'SM — Senior Manager' },
  { value: 'AP', label: 'AP — Associate Principal' },
  { value: 'P', label: 'P — Principal' },
]

type FormErrors = {
  email?: string
  password?: string
  confirmPassword?: string
  nombre?: string
  apellido?: string
  tenure?: string
  general?: string
}

export default function RegistroPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nombre: '',
    apellido: '',
    tenure: '' as Tenure | '',
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const validate = (): boolean => {
    const e: FormErrors = {}
    if (!form.email.trim()) {
      e.email = 'El email es requerido'
    } else if (!form.email.toLowerCase().endsWith('@bain.com')) {
      e.email = 'Solo se permiten emails @bain.com'
    }
    if (!form.password) {
      e.password = 'La contraseña es requerida'
    } else if (form.password.length < 8) {
      e.password = 'La contraseña debe tener al menos 8 caracteres'
    }
    if (!form.confirmPassword) {
      e.confirmPassword = 'Repetí la contraseña'
    } else if (form.password !== form.confirmPassword) {
      e.confirmPassword = 'Las contraseñas no coinciden'
    }
    if (!form.nombre.trim()) e.nombre = 'El nombre es requerido'
    if (!form.apellido.trim()) e.apellido = 'El apellido es requerido'
    if (!form.tenure) e.tenure = 'Seleccioná tu nivel'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setErrors({})

    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            nombre: form.nombre.trim(),
            apellido: form.apellido.trim(),
            tenure: form.tenure,
            nombre_usuario: `${form.nombre.trim()} ${form.apellido.trim()}`,
          },
        },
      })

      if (error) throw error
      setSuccess(true)
    } catch (err: any) {
      setErrors({ general: err.message || 'Error al registrar. Intentá nuevamente.' })
    } finally {
      setLoading(false)
    }
  }

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }))
  }

  if (success) {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
        style={{ backgroundColor: BAIN.grayBg }}
      >
        <div
          className="w-full max-w-[420px] bg-white rounded-md shadow-sm border p-8 text-center animate-in fade-in duration-500"
          style={{ borderColor: BAIN.grayBorder }}
        >
          <div className="text-4xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold mb-3" style={{ color: BAIN.black }}>
            ¡Cuenta creada!
          </h1>
          <p className="text-sm mb-6" style={{ color: BAIN.graySecondary }}>
            Revisá tu email <strong>{form.email}</strong> para confirmar tu cuenta y luego ingresá.
          </p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="w-full font-bold py-2 px-4 rounded-md text-sm"
            style={{ backgroundColor: BAIN.red, color: BAIN.white }}
          >
            Ir al inicio de sesión
          </button>
        </div>
      </main>
    )
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ backgroundColor: BAIN.grayBg }}
    >
      <div
        className="w-full max-w-[480px] bg-white rounded-md shadow-sm border animate-in fade-in slide-in-from-bottom-2 duration-500"
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

        <div className="px-8 pt-6 pb-2">
          <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: BAIN.black }}>
            Crear cuenta
          </h1>
          <p className="text-sm" style={{ color: BAIN.graySecondary }}>
            Registrate con tu email corporativo para participar del prode.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8 pt-4 space-y-4" noValidate>
          {errors.general && (
            <div
              className="rounded-md p-3 text-sm"
              style={{ backgroundColor: '#FFF0F0', color: BAIN.red, border: `1px solid ${BAIN.red}40` }}
            >
              {errors.general}
            </div>
          )}

          {/* Nombre y Apellido */}
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Nombre"
              id="nombre"
              type="text"
              placeholder="Juan"
              value={form.nombre}
              onChange={set('nombre')}
              error={errors.nombre}
              autoComplete="given-name"
            />
            <Field
              label="Apellido"
              id="apellido"
              type="text"
              placeholder="Pérez"
              value={form.apellido}
              onChange={set('apellido')}
              error={errors.apellido}
              autoComplete="family-name"
            />
          </div>

          {/* Email */}
          <Field
            label="Email corporativo"
            id="email"
            type="email"
            placeholder="nombre.apellido@bain.com"
            value={form.email}
            onChange={set('email')}
            error={errors.email}
            hint="Solo se permiten emails @bain.com"
            autoComplete="email"
          />

          {/* Tenure */}
          <div>
            <label
              htmlFor="tenure"
              className="block text-sm font-medium mb-1.5"
              style={{ color: BAIN.black }}
            >
              Nivel / Tenure
            </label>
            <select
              id="tenure"
              value={form.tenure}
              onChange={set('tenure')}
              className="w-full px-3 py-2 rounded-md text-sm focus:outline-none transition-colors"
              style={{
                border: `1px solid ${errors.tenure ? BAIN.red : BAIN.grayBorder}`,
                backgroundColor: BAIN.white,
                color: form.tenure ? BAIN.black : BAIN.graySecondary,
              }}
            >
              <option value="">— Seleccioná tu nivel —</option>
              {TENURE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {errors.tenure && (
              <p className="text-xs mt-1" style={{ color: BAIN.red }}>
                {errors.tenure}
              </p>
            )}
          </div>

          {/* Password */}
          <Field
            label="Contraseña"
            id="password"
            type="password"
            placeholder="Mínimo 8 caracteres"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            autoComplete="new-password"
          />

          {/* Confirm Password */}
          <Field
            label="Repetir contraseña"
            id="confirmPassword"
            type="password"
            placeholder="Igual que la contraseña"
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />

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
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>

          <p className="text-center text-sm" style={{ color: BAIN.graySecondary }}>
            ¿Ya tenés cuenta?{' '}
            <a href="/" className="font-medium hover:underline" style={{ color: BAIN.red }}>
              Iniciá sesión
            </a>
          </p>
        </form>
      </div>
    </main>
  )
}

function Field({
  label,
  id,
  type,
  placeholder,
  value,
  onChange,
  error,
  hint,
  autoComplete,
}: {
  label: string
  id: string
  type: string
  placeholder: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  hint?: string
  autoComplete?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1.5" style={{ color: BAIN.black }}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        className="w-full px-3 py-2 rounded-md text-sm focus:outline-none transition-colors"
        style={{
          border: `1px solid ${error ? BAIN.red : BAIN.grayBorder}`,
          backgroundColor: BAIN.white,
          color: BAIN.black,
        }}
      />
      {(error || hint) && (
        <p className="text-xs mt-1" style={{ color: error ? BAIN.red : BAIN.graySecondary }}>
          {error || hint}
        </p>
      )}
    </div>
  )
}