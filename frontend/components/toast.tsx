'use client'

/**
 * <ToastProvider /> + useToast()
 *
 * Sistema simple de notificaciones toast — para feedback como
 * "Link copiado ✓", "Predicción guardada", etc.
 *
 * Uso:
 *   // En el componente que dispara la notificación:
 *   const { toast } = useToast()
 *   toast({ message: 'Link copiado', type: 'success' })
 *
 *   // No hace falta envolver en provider — el ToastHost de abajo
 *   // se incluye en cada page directamente.
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { Check, AlertCircle, Info, X } from 'lucide-react'

const BAIN = {
  red: '#CC0000',
  black: '#000000',
  white: '#FFFFFF',
  grayBorder: '#E5E5E5',
  graySecondary: '#666666',
  success: '#0F7B3E',
} as const

type ToastType = 'success' | 'error' | 'info'

type ToastItem = {
  id: number
  message: string
  type: ToastType
}

type ToastContextValue = {
  toast: (input: { message: string; type?: ToastType; duration?: number }) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // Fallback que evita crashear si se usa sin provider
    return {
      toast: ({ message }: { message: string; type?: ToastType }) => {
        if (typeof window !== 'undefined') console.log(`[Toast] ${message}`)
      },
    }
  }
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback(
    ({ message, type = 'info', duration = 3000 }: { message: string; type?: ToastType; duration?: number }) => {
      const id = Date.now() + Math.random()
      setToasts((prev) => [...prev, { id, message, type }])
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    },
    []
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastHost toasts={toasts} onClose={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
    </ToastContext.Provider>
  )
}

function ToastHost({
  toasts,
  onClose,
}: {
  toasts: ToastItem[]
  onClose: (id: number) => void
}) {
  return (
    <div
      className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none"
      role="region"
      aria-label="Notificaciones"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onClose={() => onClose(t.id)} />
      ))}
    </div>
  )
}

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 10)
    return () => window.clearTimeout(t)
  }, [])

  const config: Record<ToastType, { icon: React.ReactNode; color: string }> = {
    success: { icon: <Check size={16} />, color: BAIN.success },
    error:   { icon: <AlertCircle size={16} />, color: BAIN.red },
    info:    { icon: <Info size={16} />, color: BAIN.black },
  }
  const { icon, color } = config[toast.type]

  return (
    <div
      className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-md shadow-md transition-all duration-200"
      style={{
        backgroundColor: BAIN.white,
        border: `1px solid ${BAIN.grayBorder}`,
        transform: visible ? 'translateX(0)' : 'translateX(20px)',
        opacity: visible ? 1 : 0,
      }}
      role="status"
    >
      <span
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}15`, color }}
      >
        {icon}
      </span>
      <p className="text-sm font-medium flex-1" style={{ color: BAIN.black }}>
        {toast.message}
      </p>
      <button
        type="button"
        onClick={onClose}
        className="flex-shrink-0 p-1 rounded transition-colors"
        style={{ color: BAIN.graySecondary }}
        aria-label="Cerrar notificación"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export default ToastProvider
