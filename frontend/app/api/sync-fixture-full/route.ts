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
  if (!res.ok) throw new Error(`API-Football ${path} -> HTTP ${res.status}`)
  return res.json() as Promise<T>
}

// Alias: nombre en ingles (API) -> nombre normalizado sin tildes para comparar con DB
const ALIAS: Record<string, string> = {
  usa: 'estados unidos',
  'united states': 'estados unidos',
  netherlands: 'paises bajos',
  holland: 'paises bajos',
  england: 'inglaterra',
  brazil: 'brasil',
  germany: 'alemania',
  spain: 'espana',
  france: 'francia',
  'south korea': 'corea del sur',
  'korea republic': 'corea del sur',
  japan: 'japon',
  switzerland: 'suiza',
  'czech republic': 'republica checa',
  czechia: 'republica checa',
  croatia: 'croacia',
  turkey: 'turquia',
  turkiye: 'turquia',
  iran: 'iran',
  iraq: 'irak',
  'saudi arabia': 'arabia saudita',
  morocco: 'marruecos',
  'ivory coast': 'costa de marfil',
  "cote d'ivoire": 'costa de marfil',
  "cote divoire": 'costa de marfil',
  scotland: 'escocia',
  norway: 'noruega',
  sweden: 'suecia',
  belgium: 'belgica',
  algeria: 'argelia',
  egypt: 'egipto',
  'new zealand': 'nueva zelanda',
  'south africa': 'sudafrica',
  panama: 'panama',
  canada: 'canada',
  haiti: 'haiti',
  argentina: 'argentina',
  colombia: 'colombia',
  ecuador: 'ecuador',
  uruguay: 'uruguay',
  mexico: 'mexico',
  portugal: 'portugal',
  senegal: 'senegal',
  ghana: 'ghana',
  qatar: 'catar',
  austria: 'austria',
  jordan: 'jordania',
  uzbekistan: 'uzbekistan',
  'cape verde': 'cabo verde',
  'cape verde islands': 'cabo verde',
  'dr congo': 'congo dr',
  'democratic republic of congo': 'congo dr',
  australia: 'australia',
  paraguay: 'paraguay',
  curacao: 'curazao',
  'bosnia & herzegovina': 'bosnia-herzegovina',
  bosnia: 'bosnia-herzegovina',
  tunisia: 'tunez',
}

function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function normalizarNombre(nombre: string): string {
  const lower = stripDiacritics(nombre).toLowerCase().trim()
  return ALIAS[lower] ?? lower
}

function mapearFase(round: string): string {
  const r = round.toLowerCase()
  if (r.includes('round of 32')) return '16vos'
  if (r.includes('round of 16')) return 'octavos'
  if (r.includes('quarter')) return 'cuartos'
  if (r.includes('semi')) return 'semifinal'
  if (r.includes('3rd') || r.includes('third')) return 'tercer_puesto'
  if (r.includes('final')) return 'final'
  return 'grupos'
}

function mapEstado(short: string): string {
  if (['1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(short)) return 'en_juego'
  if (['FT', 'AET', 'PEN'].includes(short)) return 'finalizado'
  if (['PST', 'CANC', 'SUSP', 'ABD', 'WO', 'AWD'].includes(short)) return 'suspendido'
  return 'programado'
}

interface ApiFixture {
  fixture: {
    id: number
    date: string
    status: { short: string; elapsed: number | null }
    venue: { name: string | null; city: string | null }
  }
  league: { round: string }
  goals: { home: number | null; away: number | null }
  teams: { home: { id: number; name: string }; away: { id: number; name: string } }
}

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

    // Fetch all WC 2026 fixtures in one call
    const res = await fetchApi<{ response: ApiFixture[] }>(
      `/fixtures?league=${LEAGUE}&season=${SEASON}`
    )

    // Only process playoff phases (not group stage - those are already synced)
    const playoffFixtures = res.response.filter((f) => {
      const r = f.league.round.toLowerCase()
      return !r.includes('group')
    })

    if (playoffFixtures.length === 0) {
      return NextResponse.json({ created: 0, updated: 0, total: 0 })
    }

    // Load all equipos for name-to-id mapping
    const { data: equipos } = await supabase.from('equipos').select('id, nombre_pais')
    const equipoByName = new Map<string, string>()
    for (const eq of (equipos ?? [])) {
      equipoByName.set(normalizarNombre(eq.nombre_pais), eq.id)
    }

    // Load existing playoff partidos from DB
    const apiIds = playoffFixtures.map((f) => f.fixture.id)
    const { data: existing } = await supabase
      .from('partidos')
      .select('id, api_fixture_id, equipo_local_id, equipo_visitante_id, estado')
      .in('api_fixture_id', apiIds)

    const existingMap = new Map<number, NonNullable<typeof existing>[0]>()
    for (const p of (existing ?? [])) {
      if (p.api_fixture_id) existingMap.set(p.api_fixture_id, p)
    }

    let created = 0
    let updated = 0

    for (const fixture of playoffFixtures) {
      const homeNorm = normalizarNombre(fixture.teams.home.name)
      const awayNorm = normalizarNombre(fixture.teams.away.name)
      // null if team is TBD or not found
      const homeId = equipoByName.get(homeNorm) ?? null
      const awayId = equipoByName.get(awayNorm) ?? null

      const fase = mapearFase(fixture.league.round)
      const estado = mapEstado(fixture.fixture.status.short)
      const existingPartido = existingMap.get(fixture.fixture.id)

      if (!existingPartido) {
        // Create new partido
        let ganadorId: string | null = null
        if (
          estado === 'finalizado' &&
          fixture.goals.home !== null &&
          fixture.goals.away !== null &&
          homeId &&
          awayId
        ) {
          if (fixture.goals.home > fixture.goals.away) ganadorId = homeId
          else if (fixture.goals.away > fixture.goals.home) ganadorId = awayId
        }

        const { error } = await supabase.from('partidos').insert({
          api_fixture_id: fixture.fixture.id,
          equipo_local_id: homeId,
          equipo_visitante_id: awayId,
          fecha_hora: fixture.fixture.date,
          estadio: fixture.fixture.venue.name ?? null,
          ciudad: fixture.fixture.venue.city ?? null,
          fase,
          grupo_fase: null,
          estado,
          goles_local: fixture.goals.home,
          goles_visitante: fixture.goals.away,
          minuto_juego: fixture.fixture.status.elapsed ?? null,
          ...(ganadorId ? { ganador_id: ganadorId } : {}),
          ultimo_sync: new Date().toISOString(),
        })

        if (!error) created++
        else console.error(`Error creating fixture ${fixture.fixture.id}:`, error.message)
      } else {
        // Update only team IDs when a TBD slot got confirmed
        const updates: Record<string, unknown> = {}
        if (!existingPartido.equipo_local_id && homeId) updates.equipo_local_id = homeId
        if (!existingPartido.equipo_visitante_id && awayId) updates.equipo_visitante_id = awayId

        if (Object.keys(updates).length > 0) {
          updates.ultimo_sync = new Date().toISOString()
          const { error } = await supabase
            .from('partidos')
            .update(updates)
            .eq('id', existingPartido.id)
          if (!error) updated++
          else console.error(`Error updating fixture ${fixture.fixture.id}:`, error.message)
        }
      }
    }

    return NextResponse.json({ created, updated, total: playoffFixtures.length })
  } catch (err: any) {
    console.error('Sync fixture full error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
