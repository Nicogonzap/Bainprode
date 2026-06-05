import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const API_KEY = process.env.API_FOOTBALL_KEY!
const LEAGUE = 1
const SEASON = 2026

function getServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function fetchApi<T>(path: string): Promise<T> {
  const url = `https://v3.football.api-sports.io${path}`
  const res = await fetch(url, {
    headers: { 'x-apisports-key': API_KEY },
    next: { revalidate: 0 },
  })
  if (!res.ok) throw new Error(`API-Football ${path} → HTTP ${res.status}`)
  return res.json() as Promise<T>
}

export type Evento = {
  minuto: number
  minutoExtra: number | null
  tipo: 'gol' | 'tarjeta'
  subtipo: 'normal' | 'penal' | 'en_contra' | 'amarilla' | 'roja'
  jugador: string
  equipo: 'local' | 'visitante'
}

export type LiveMatch = {
  partido_id: string
  api_fixture_id: number
  local: { codigo: string; nombre: string; url: string | null }
  visitante: { codigo: string; nombre: string; url: string | null }
  goles_local: number | null
  goles_visitante: number | null
  estado: string
  minuto: number | null
  status_short: string
  fase: string
  grupo_fase: string | null
  fecha_hora: string
  eventos: Evento[]
}

interface ApiEvent {
  time: { elapsed: number; extra: number | null }
  team: { id: number; name: string }
  player: { id: number | null; name: string | null }
  type: string
  detail: string
}

function parseEventos(
  events: ApiEvent[],
  localApiId: number,
  visitanteApiId: number
): Evento[] {
  const result: Evento[] = []
  for (const e of events) {
    const equipo: 'local' | 'visitante' =
      e.team.id === localApiId ? 'local' : 'visitante'

    if (e.type === 'Goal') {
      if (e.detail === 'Missed Penalty') continue
      let subtipo: Evento['subtipo'] = 'normal'
      if (e.detail === 'Penalty') subtipo = 'penal'
      else if (e.detail === 'Own Goal') subtipo = 'en_contra'
      result.push({
        minuto: e.time.elapsed,
        minutoExtra: e.time.extra ?? null,
        tipo: 'gol',
        subtipo,
        jugador: e.player.name ?? '?',
        equipo,
      })
    } else if (e.type === 'Card') {
      if (e.detail === 'Yellow Card') {
        result.push({
          minuto: e.time.elapsed,
          minutoExtra: e.time.extra ?? null,
          tipo: 'tarjeta',
          subtipo: 'amarilla',
          jugador: e.player.name ?? '?',
          equipo,
        })
      } else if (e.detail === 'Red Card' || e.detail === 'Yellow-Red Card') {
        result.push({
          minuto: e.time.elapsed,
          minutoExtra: e.time.extra ?? null,
          tipo: 'tarjeta',
          subtipo: 'roja',
          jugador: e.player.name ?? '?',
          equipo,
        })
      }
    }
  }
  return result.sort((a, b) => a.minuto - b.minuto || (a.minutoExtra ?? 0) - (b.minutoExtra ?? 0))
}

export async function GET() {
  try {
    const supabase = getServerClient()
    const now = new Date()
    const in90min = new Date(now.getTime() + 90 * 60 * 1000)

    // Matches that are live OR start within 90 minutes
    const { data: partidos } = await supabase
      .from('partidos')
      .select(`
        id, api_fixture_id, estado, goles_local, goles_visitante,
        minuto_juego, fase, grupo_fase, fecha_hora,
        equipo_local:equipos!equipo_local_id (codigo_iso, nombre_pais, bandera_url),
        equipo_visitante:equipos!equipo_visitante_id (codigo_iso, nombre_pais, bandera_url)
      `)
      .or(`estado.eq.en_juego,and(estado.eq.programado,fecha_hora.lte.${in90min.toISOString()})`)
      .order('fecha_hora', { ascending: true })

    if (!partidos || partidos.length === 0) {
      return NextResponse.json({ matches: [] })
    }

    // For live matches, fetch events from API-Football
    // First get the local/visitante api IDs from the live fixture data
    const livePartidos = partidos.filter((p: any) => p.estado === 'en_juego' && p.api_fixture_id)

    // Fetch all live fixtures in one call to get team API IDs
    interface ApiLiveFixture {
      fixture: { id: number; status: { short: string; elapsed: number | null } }
      teams: { home: { id: number }; away: { id: number } }
      goals: { home: number | null; away: number | null }
      events: ApiEvent[]
    }

    let liveFixtureMap = new Map<number, ApiLiveFixture>()

    if (livePartidos.length > 0) {
      // Use live endpoint — returns fixtures+events in one shot
      const liveRes = await fetchApi<{ response: ApiLiveFixture[] }>(
        `/fixtures?live=all&league=${LEAGUE}&season=${SEASON}`
      )
      for (const f of liveRes.response ?? []) {
        liveFixtureMap.set(f.fixture.id, f)
      }

      // If /live doesn't return events inline, fetch events per fixture
      const needsEvents = livePartidos.filter((p: any) => {
        const f = liveFixtureMap.get(p.api_fixture_id)
        return f && (!f.events || f.events.length === 0)
      })

      await Promise.all(
        needsEvents.map(async (p: any) => {
          const evRes = await fetchApi<{ response: ApiEvent[] }>(
            `/fixtures/events?fixture=${p.api_fixture_id}`
          )
          const existing = liveFixtureMap.get(p.api_fixture_id)
          if (existing) existing.events = evRes.response ?? []
        })
      )
    }

    const matches: LiveMatch[] = partidos.map((p: any) => {
      const liveData = liveFixtureMap.get(p.api_fixture_id)
      const eventos = liveData
        ? parseEventos(
            liveData.events ?? [],
            liveData.teams.home.id,
            liveData.teams.away.id
          )
        : []

      return {
        partido_id: p.id,
        api_fixture_id: p.api_fixture_id,
        local: {
          codigo: p.equipo_local?.codigo_iso ?? '',
          nombre: p.equipo_local?.nombre_pais ?? '',
          url: p.equipo_local?.bandera_url ?? null,
        },
        visitante: {
          codigo: p.equipo_visitante?.codigo_iso ?? '',
          nombre: p.equipo_visitante?.nombre_pais ?? '',
          url: p.equipo_visitante?.bandera_url ?? null,
        },
        goles_local: liveData?.goals.home ?? p.goles_local,
        goles_visitante: liveData?.goals.away ?? p.goles_visitante,
        estado: p.estado,
        minuto: liveData?.fixture.status.elapsed ?? p.minuto_juego ?? null,
        status_short: liveData?.fixture.status.short ?? '',
        fase: p.fase,
        grupo_fase: p.grupo_fase,
        fecha_hora: p.fecha_hora,
        eventos,
      }
    })

    return NextResponse.json(
      { matches },
      { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=60' } }
    )
  } catch (err: any) {
    console.error('Live error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}