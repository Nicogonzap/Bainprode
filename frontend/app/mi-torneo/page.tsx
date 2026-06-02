'use client'

import { useState } from 'react'
import { TopNav } from '@/components/top-nav'
import { Footer } from '@/components/footer'
import { ToastProvider, useToast } from '@/components/toast'
import { Copy, Check } from 'lucide-react'

const BAIN = {
  red: '#CC0000',
  redHover: '#990000',
  redLight: '#FFF0F0',
  black: '#000000',
  white: '#FFFFFF',
  grayBg: '#F5F5F5',
  grayBorder: '#E5E5E5',
  graySecondary: '#666666',
  grayTertiary: '#999999',
} as const

const TOURNAMENT_LINK = 'https://prode-bain.vercel.app/join/bna-2026'

const RULES = [
  'Marcador exacto: 5 puntos',
  'Ganador correcto: 3 puntos',
  'Acertar goles del local: +1 punto extra',
  'Acertar goles del visitante: +1 punto extra',
  'Predicción solitaria (único que acertó): +5 bonus',
]

const METRICS = [
  { label: 'DÍAS RESTANTES', value: '17' },
  { label: 'TUS PUNTOS', value: '0' },
  { label: 'TU POSICIÓN', value: '— / 47' },
]

function MiTorneoContent() {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(TOURNAMENT_LINK)
      setCopied(true)
      toast({ message: 'Link copiado al portapapeles', type: 'success', duration: 2500 })
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({ message: 'No se pudo copiar el link', type: 'error' })
    }
  }

  const handleLeaveTournament = () => {
    if (confirm('¿Seguro que querés salir del torneo? Perderás todas tus predicciones.')) {
      toast({ message: 'Funcionalidad pendiente: salir del torneo', type: 'info' })
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: BAIN.grayBg }}>
      <TopNav activePage="mi-torneo" />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-10">
        {/* Hero */}
        <section className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <p
            className="text-xs font-bold uppercase mb-2"
            style={{ color: BAIN.red, letterSpacing: '0.1em' }}
          >
            TORNEO PRINCIPAL
          </p>
          <h1
            className="text-3xl md:text-4xl font-bold tracking-tight"
            style={{ color: BAIN.black }}
          >
            Torneo BNA Bain 2026
          </h1>
        </section>

        {/* Description card */}
        <section
          className="rounded-md p-6 mb-8"
          style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}` }}
        >
          <h2 className="text-base font-bold tracking-tight mb-3" style={{ color: BAIN.black }}>
            Sobre este torneo
          </h2>
          <p className="text-sm mb-5 leading-relaxed" style={{ color: BAIN.graySecondary }}>
            Torneo principal de la oficina de Bain Buenos Aires. Todos los empleados pueden participar.
            Las predicciones se cierran 5 minutos antes del comienzo de cada partido.
          </p>
          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5"
            style={{ borderTop: `1px solid ${BAIN.grayBorder}` }}
          >
            <div>
              <p
                className="text-xs font-medium uppercase mb-1"
                style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}
              >
                PARTICIPANTES
              </p>
              <p className="text-sm font-bold" style={{ color: BAIN.black }}>47</p>
            </div>
            <div>
              <p
                className="text-xs font-medium uppercase mb-1"
                style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}
              >
                CREADO POR
              </p>
              <p className="text-sm font-bold" style={{ color: BAIN.black }}>Admin Bain Argentina</p>
            </div>
            <div>
              <p
                className="text-xs font-medium uppercase mb-1"
                style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}
              >
                SISTEMA DE PUNTAJE
              </p>
              <p className="text-sm font-bold" style={{ color: BAIN.black }}>Estándar</p>
            </div>
          </div>
        </section>

        {/* Metrics */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {METRICS.map((m, i) => (
            <div
              key={m.label}
              className="rounded-md p-5 transition-shadow hover:shadow-sm animate-in fade-in slide-in-from-bottom-2"
              style={{
                backgroundColor: BAIN.white,
                border: `1px solid ${BAIN.grayBorder}`,
                animationDelay: `${i * 80}ms`,
                animationFillMode: 'backwards',
                animationDuration: '500ms',
              }}
            >
              <p
                className="text-xs font-medium uppercase mb-3"
                style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}
              >
                {m.label}
              </p>
              <p className="text-3xl font-bold tracking-tight" style={{ color: BAIN.black }}>
                {m.value}
              </p>
            </div>
          ))}
        </section>

        {/* Two-column layout */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
          {/* LEFT: Rules */}
          <div className="lg:col-span-3">
            <div
              className="rounded-md p-6 h-full"
              style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}` }}
            >
              <h2 className="text-base font-bold tracking-tight mb-5" style={{ color: BAIN.black }}>
                Reglas del torneo
              </h2>
              <ul className="space-y-3">
                {RULES.map((rule) => (
                  <li key={rule} className="flex items-start gap-3">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                      style={{ backgroundColor: BAIN.red }}
                      aria-hidden
                    />
                    <span className="text-sm" style={{ color: BAIN.black }}>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* RIGHT: Share */}
          <div className="lg:col-span-2">
            <div
              className="rounded-md p-6 h-full"
              style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}` }}
            >
              <h2 className="text-base font-bold tracking-tight mb-3" style={{ color: BAIN.black }}>
                Compartir torneo
              </h2>
              <p className="text-sm mb-4" style={{ color: BAIN.graySecondary }}>
                Invitá a tus colegas con este link:
              </p>

              <div
                className="rounded-md px-3 py-2.5 mb-3 overflow-hidden"
                style={{
                  backgroundColor: BAIN.grayBg,
                  border: `1px solid ${BAIN.grayBorder}`,
                }}
              >
                <p
                  className="text-xs font-mono truncate"
                  style={{ color: BAIN.black }}
                  title={TOURNAMENT_LINK}
                >
                  {TOURNAMENT_LINK}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2.5 px-4 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2"
                style={{
                  backgroundColor: copied ? BAIN.black : BAIN.red,
                  color: BAIN.white,
                }}
                onMouseEnter={(e) => {
                  if (!copied) {
                    ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = BAIN.redHover
                  }
                }}
                onMouseLeave={(e) => {
                  if (!copied) {
                    ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = BAIN.red
                  }
                }}
              >
                {copied ? (
                  <>
                    <Check size={16} strokeWidth={2.5} />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copiar link
                  </>
                )}
              </button>

              <p className="text-xs mt-3" style={{ color: BAIN.graySecondary }}>
                Solo emails @bain.com pueden unirse.
              </p>
            </div>
          </div>
        </section>

        {/* Danger zone */}
        <section
          className="rounded-md p-6"
          style={{
            backgroundColor: BAIN.redLight,
            border: `1px solid ${BAIN.red}30`,
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold tracking-tight mb-1" style={{ color: BAIN.black }}>
                Salir del torneo
              </h2>
              <p className="text-sm" style={{ color: BAIN.graySecondary }}>
                Perderás todas tus predicciones para este torneo.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLeaveTournament}
              className="py-2 px-4 rounded-md text-sm font-bold transition-colors flex-shrink-0"
              style={{
                backgroundColor: BAIN.white,
                color: BAIN.red,
                border: `1px solid ${BAIN.red}`,
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = BAIN.red
                ;(e.currentTarget as HTMLButtonElement).style.color = BAIN.white
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = BAIN.white
                ;(e.currentTarget as HTMLButtonElement).style.color = BAIN.red
              }}
            >
              Salir del torneo
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default function MiTorneoPage() {
  return (
    <ToastProvider>
      <MiTorneoContent />
    </ToastProvider>
  )
}
