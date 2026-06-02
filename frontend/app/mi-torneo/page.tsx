'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { TopNav } from '@/components/top-nav'
import { Footer } from '@/components/footer'
import { ToastProvider } from '@/components/toast'

const BAIN = {
  red: '#CC0000',
  black: '#000000',
  white: '#FFFFFF',
  grayBg: '#F5F5F5',
  grayBorder: '#E5E5E5',
  graySecondary: '#666666',
  grayTertiary: '#999999',
} as const

interface TorneoCard {
  id: string | null
  nombre: string
  participantes: number
  posicion: number | null
  puntosPrimero: number
  puntosPropios: number
  invite_code?: string
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase mb-1" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>
        {label}
      </p>
      <p className="text-2xl font-bold tracking-tight" style={{ color: BAIN.black }}>
        {value}
      </p>
    </div>
  )
}

function TorneoCardView({ card }: { card: TorneoCard }) {
  const host = typeof window !== 'undefined' ? window.location.origin : ''
  const inviteUrl = card.invite_code ? `${host}/torneo/join/${card.invite_code}` : null

  return (
    <div
      className="rounded-md p-6"
      style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}` }}
    >
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="text-xs font-bold uppercase mb-1" style={{ color: BAIN.red, letterSpacing: '0.1em' }}>
            {card.id === null ? 'RANKING GENERAL' : 'TORNEO'}
          </p>
          <h2 className="text-lg font-bold tracking-tight" style={{ color: BAIN.black }}>
            {card.nombre}
          </h2>
        </div>
        {card.id !== null && (
          <Link
            href={`/torneo/${card.id}`}
            className="text-xs font-medium flex-shrink-0 underline"
            style={{ color: BAIN.red }}
          >
            Ver ranking
          </Link>
        )}
      </div>

      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-5"
        style={{ borderTop: `1px solid ${BAIN.grayBorder}` }}
      >
        <StatBox label="PARTICIPANTES" value={card.participantes} />
        <StatBox
          label="TU POSICIÓN"
          value={card.posicion !== null ? `${card.posicion}°` : '—'}
        />
        <StatBox label="PUNTOS 1°" value={card.puntosPrimero} />
        <StatBox label="TUS PUNTOS" value={card.puntosPropios} />
      </div>

      {inviteUrl && (
        <div
          className="mt-5 pt-5 flex items-center gap-3"
          style={{ borderTop: `1px solid ${BAIN.grayBorder}` }}
        >
          <span className="text-xs font-mono truncate flex-1" style={{ color: BAIN.graySecondary }}>
            {inviteUrl}
          </span>
          <button
            type="button"
            className="text-xs font-medium flex-shrink-0 px-3 py-1.5 rounded-md"
            style={{ backgroundColor: BAIN.grayBg, border: `1px solid ${BAIN.grayBorder}`, color: BAIN.black }}
            onClick={() => navigator.clipboard.writeText(inviteUrl)}
          >
            Copiar link
          </button>
        </div>
      )}
    </div>
  )
}

function MisTorneosContent() {
  const { user } = useAuth()
  const [cards, setCards] = useState<TorneoCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const userId = user.id

    async function load() {
      try {
        const [lbRes, torneosRes] = await Promise.all([
          fetch('/api/leaderboard'),
          fetch(`/api/torneos?usuario_id=${userId}`),
        ])
        const lbJson = await lbRes.json()
        const torneosJson = await torneosRes.json()

        const lb: any[] = lbJson.data ?? []
        const userEntry = lb.find((r: any) => r.usuario_id === userId)
        const generalCard: TorneoCard = {
          id: null,
          nombre: 'Ranking General — Prode Mundial 2026',
          participantes: lb.length,
          posicion: userEntry?.posicion ?? null,
          puntosPrimero: lb[0]?.puntos ?? 0,
          puntosPropios: userEntry?.puntos ?? 0,
        }

        const torneosList: any[] = torneosJson.data ?? []
        const torneoCards: TorneoCard[] = await Promise.all(
          torneosList.map(async (t: any) => {
            const res = await fetch(`/api/torneos/${t.id}`)
            const json = await res.json()
            const members: any[] = json.members ?? []
            const pos = members.findIndex((m: any) => m.id === userId)
            return {
              id: t.id,
              nombre: t.nombre,
              participantes: members.length,
              posicion: pos >= 0 ? pos + 1 : null,
              puntosPrimero: members[0]?.puntos ?? 0,
              puntosPropios: pos >= 0 ? members[pos].puntos : 0,
              invite_code: t.invite_code,
            }
          })
        )

        setCards([generalCard, ...torneoCards])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user])

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: BAIN.grayBg }}>
      <TopNav activePage="mi-torneo" />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-10">
        <section className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <p
            className="text-xs font-bold uppercase mb-2"
            style={{ color: BAIN.red, letterSpacing: '0.1em' }}
          >
            TORNEOS
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: BAIN.black }}>
            Mis Torneos
          </h1>
        </section>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div
              className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: `${BAIN.red} transparent transparent transparent` }}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {cards.map((card) => (
              <TorneoCardView key={card.id ?? 'general'} card={card} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default function MisTorneosPage() {
  return (
    <ToastProvider>
      <MisTorneosContent />
    </ToastProvider>
  )
}