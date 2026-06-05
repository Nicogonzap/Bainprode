import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const API_KEY = process.env.API_FOOTBALL_KEY!
const LEAGUE = 1
const SEASON = 2026

function getServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

function mapEstado(short: string): string {
  if (['1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(short)) return 'en_juego'
  if (['FT', 'AET', 'PEN'].includes(short)) return 'finalizado'
  if (['PST', 'CANC', 'SUSP', 'ABD', 'WO', 'AWD'].includes(short)) return 'suspendido'
  return 'programado'
}

// Vercel Cron sends GET with Authorization: Bearer CRON_SECRET
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const supabase = getServerClient()

    // Fetch today + yesterday from API-Football (covers late finishes)
    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

    interface ApiFixture {
      fixture: { id: number; status: { short: string; elapsed: number | null } }
      goals: { home: number | null; away: number | null }
    }
    const [res1, res2, res3] = await Promise.all([
      fetchApi<{ response: ApiFixture[] }>(`/fixtures?league=${LEAGUE}&season=${SEASON}&date=${yesterday}`),
      fetchApi<{ response: ApiFixture[] }>(`/fixtures?league=${LEAGUE}&season=${SEASON}&date=${today}`),
      fetchApi<{ response: ApiFixture[] }>(`/fixtures?league=${LEAGUE}&season=${SEASON}&date=${tomorrow}`),
    ])

    const apiFixtures = [...(res1.response ?? []), ...(res2.response ?? []), ...(res3.response ?? [])]

    if (apiFixtures.length === 0) return NextResponse.json({ updated: 0, scored: 0 })

    // Get matching partidos from DB by api_fixture_id
    const apiIds = apiFixtures.map((f) => f.fixture.id)
    const { data: partidos } = await supabase
      .from('partidos')
      .select('id, api_fixture_id, estado, goles_local, goles_visitante')
      .in('api_fixture_id', apiIds)

    if (!partidos || partidos.length === 0) return NextResponse.json({ updated: 0, scored: 0 })

    const partidoMap = new Map<number, typeof partidos[0]>()
    for (const p of partidos) {
      if (p.api_fixture_id) partidoMap.set(p.api_fixture_id, p)
    }

    let updated = 0
    let scored = 0

    for (const fixture of apiFixtures) {
      const partido = partidoMap.get(fixture.fixture.id)
      if (!partido) continue

      const nuevoEstado = mapEstado(fixture.fixture.status.short)
      const nuevoLocal = fixture.goals.home
      const nuevoVisitante = fixture.goals.away
      const nuevoMinuto = fixture.fixture.status.elapsed ?? null

      // Don't overwrite admin-entered results when API still says "programado" (future match).
      // Only sync when API has real data: en_juego, finalizado, or suspendido.
      if (nuevoEstado === 'programado') continue

      const cambioEstado = partido.estado !== nuevoEstado
      const cambioScore =
        partido.goles_local !== nuevoLocal || partido.goles_visitante !== nuevoVisitante

      if (!cambioEstado && !cambioScore) continue

      // Compute ganador_id if finalizado
      let ganadorId: string | null = null
      if (nuevoEstado === 'finalizado' && nuevoLocal !== null && nuevoVisitante !== null) {
        if (nuevoLocal > nuevoVisitante) {
          const { data: p } = await supabase
            .from('partidos')
            .select('equipo_local_id')
            .eq('id', partido.id)
            .single()
          ganadorId = p?.equipo_local_id ?? null
        } else if (nuevoVisitante > nuevoLocal) {
          const { data: p } = await supabase
            .from('partidos')
            .select('equipo_visitante_id')
            .eq('id', partido.id)
            .single()
          ganadorId = p?.equipo_visitante_id ?? null
        }
      }

      const { error } = await supabase
        .from('partidos')
        .update({
          estado: nuevoEstado,
          goles_local: nuevoLocal,
          goles_visitante: nuevoVisitante,
          minuto_juego: nuevoMinuto,
          ...(ganadorId ? { ganador_id: ganadorId } : {}),
          ultimo_sync: new Date().toISOString(),
        })
        .eq('id', partido.id)

      if (error) {
        console.error(`Error updating partido ${partido.id}:`, error.message)
        continue
      }

      updated++

      // Trigger point calculation if just finished
      if (nuevoEstado === 'finalizado' && partido.estado !== 'finalizado') {
        const { error: rpcError } = await supabase.rpc('calcular_puntos_prediccion', {
          p_partido_id: partido.id,
        })
        if (rpcError) {
          console.error(`Error scoring partido ${partido.id}:`, rpcError.message)
        } else {
          scored++
        }
      }
    }

    return NextResponse.json({ updated, scored, total: apiFixtures.length })
  } catch (err: any) {
    console.error('Sync error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}