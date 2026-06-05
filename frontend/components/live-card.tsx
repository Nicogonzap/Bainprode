'use client'

import { useEffect, useState, useCallback } from 'react'
import { CountryFlag } from '@/components/country-flag'
import type { LiveMatch, Evento } from '@/app/api/live/route'

const BAIN = {
  red: '#CC0000',
  black: '#000000',
  white: '#FFFFFF',
  grayBg: '#F5F5F5',
  grayBorder: '#E5E5E5',
  graySecondary: '#666666',
  grayTertiary: '#999999',
} as const

const POLO_INTERVAL = 60_000 // 60s

function minutoLabel(e: Evento) {
  return e.minutoExtra ? `${e.minuto}+${e.minutoExtra}'` : `${e.minuto}'`
}

function subtipoSuffix(subtipo: Evento['subtipo']) {
  if (subtipo === 'penal') return ' (P)'
  if (subtipo === 'en_contra') return ' (C)'
  return ''
}

function EventoRow({ evento, isLocal }: { evento: Evento; isLocal: boolean }) {
  const isGol = evento.tipo === 'gol'
  const isRoja = evento.subtipo === 'roja'

  const icon = isGol
    ? '⚽'
    : isRoja
    ? '🟥'
    : '🟨'

  const text = (
    <span className="text-xs" style={{ color: BAIN.black }}>
      <span className="font-bold" style={{ color: BAIN.graySecondary }}>{minutoLabel(evento)}</span>
      {' '}
      <span className="font-medium">{evento.jugador}{isGol ? subtipoSuffix(evento.subtipo) : ''}</span>
    </span>
  )

  return (
    <div className={`flex items-center gap-1.5 ${isLocal ? 'flex-row' : 'flex-row-reverse'}`}>
      <span className="text-sm leading-none">{icon}</span>
      {text}
    </div>
  )
}

function MinutoBadge({ minuto, statusShort }: { minuto: number | null; statusShort: string }) {
  const label =
    statusShort === 'HT' ? 'ET'
    : statusShort === 'FT' ? 'FIN'
    : minuto !== null ? `${minuto}'`
    : '–'
  return (
    <span className="text-xs font-bold px-1.5 py-0.5 rounded"
      style={{ backgroundColor: BAIN.red + '15', color: BAIN.red }}>
      {label}
    </span>
  )
}

function LiveBadge() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: BAIN.red }} />
      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: BAIN.red }}>En vivo</span>
    </div>
  )
}

function UpcomingBadge({ fecha }: { fecha: string }) {
  const mins = Math.round((new Date(fecha).getTime() - Date.now()) / 60000)
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-medium" style={{ color: BAIN.graySecondary }}>
        {mins <= 0 ? 'Comenzando…' : `En ${mins} min`}
      </span>
    </div>
  )
}

function MatchCard({ match }: { match: LiveMatch }) {
  const isLive = match.estado === 'en_juego'
  const localEventos = match.eventos.filter((e) => e.equipo === 'local')
  const visitEventos = match.eventos.filter((e) => e.equipo === 'visitante')
  const hasEventos = match.eventos.length > 0

  const faseLbl = match.grupo_fase
    ? `Grupo ${match.grupo_fase}`
    : match.fase.charAt(0).toUpperCase() + match.fase.slice(1).replace('_', ' ')

  return (
    <div className="rounded-md overflow-hidden" style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}` }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: `1px solid ${BAIN.grayBorder}`, backgroundColor: BAIN.grayBg }}>
        <span className="text-xs font-medium" style={{ color: BAIN.graySecondary }}>{faseLbl}</span>
        {isLive
          ? <div className="flex items-center gap-2"><LiveBadge /><MinutoBadge minuto={match.minuto} statusShort={match.status_short} /></div>
          : <UpcomingBadge fecha={match.fecha_hora} />
        }
      </div>

      {/* Score row */}
      <div className="grid grid-cols-3 items-center gap-2 px-5 py-4">
        {/* Local */}
        <div className="flex items-center gap-2">
          <CountryFlag code={match.local.codigo} url={match.local.url ?? undefined} size="md" />
          <div className="min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: BAIN.black }}>{match.local.nombre}</p>
          </div>
        </div>

        {/* Score */}
        <div className="text-center">
          {isLive || (match.goles_local !== null && match.goles_visitante !== null) ? (
            <span className="text-2xl font-bold tabular-nums tracking-tight" style={{ color: BAIN.black }}>
              {match.goles_local ?? 0} — {match.goles_visitante ?? 0}
            </span>
          ) : (
            <span className="text-lg font-medium" style={{ color: BAIN.graySecondary }}>vs</span>
          )}
        </div>

        {/* Visitante */}
        <div className="flex items-center gap-2 justify-end">
          <div className="min-w-0 text-right">
            <p className="text-sm font-bold truncate" style={{ color: BAIN.black }}>{match.visitante.nombre}</p>
          </div>
          <CountryFlag code={match.visitante.codigo} url={match.visitante.url ?? undefined} size="md" />
        </div>
      </div>

      {/* Eventos */}
      {hasEventos && (
        <div className="px-4 pb-4 pt-1 grid grid-cols-2 gap-x-4 gap-y-1.5" style={{ borderTop: `1px solid ${BAIN.grayBorder}` }}>
          {/* Merge and render side by side per minute */}
          <div className="flex flex-col gap-1.5">
            {localEventos.map((e, i) => (
              <EventoRow key={i} evento={e} isLocal={true} />
            ))}
          </div>
          <div className="flex flex-col gap-1.5 items-end">
            {visitEventos.map((e, i) => (
              <EventoRow key={i} evento={e} isLocal={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function LiveCard() {
  const [matches, setMatches] = useState<LiveMatch[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLive = useCallback(async () => {
    try {
      const res = await fetch('/api/live')
      const json = await res.json()
      setMatches(json.matches ?? [])
    } catch {
      // silently ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLive()
    const hasLive = matches.some((m) => m.estado === 'en_juego')
    if (!hasLive) return
    const interval = setInterval(fetchLive, POLO_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchLive, matches])

  if (loading || matches.length === 0) return null

  return (
    <section className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center gap-2 mb-3">
        <p className="text-xs font-bold uppercase" style={{ color: BAIN.red, letterSpacing: '0.1em' }}>
          {matches.some((m) => m.estado === 'en_juego') ? 'En vivo ahora' : 'Próximo partido'}
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {matches.map((m) => (
          <MatchCard key={m.partido_id} match={m} />
        ))}
      </div>
    </section>
  )
}