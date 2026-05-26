/**
 * Carga el fixture completo del Mundial 2026 desde API-Football.
 * Debe correrse UNA sola vez al inicio del proyecto, después del seed.
 *
 * Uso: npm run sync-fixture
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import type { Database, FasePartido } from '../src/types/database.types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
) as any

const API_KEY = process.env.API_FOOTBALL_KEY!
const WC_LEAGUE_ID = 1
const WC_SEASON = 2026

// ─── Tipos API-Football ───────────────────────────────────────────────────────

interface ApiFixture {
  fixture: {
    id: number
    date: string
    status: { short: string; elapsed: number | null }
    venue: { name: string | null; city: string | null }
  }
  league: { round: string }
  teams: {
    home: { id: number; name: string; logo: string }
    away: { id: number; name: string; logo: string }
  }
  goals: { home: number | null; away: number | null }
  score: {
    penalty: { home: number | null; away: number | null }
  }
}

// ─── Mapeos ───────────────────────────────────────────────────────────────────

function mapearEstado(short: string): 'programado' | 'en_juego' | 'finalizado' | 'suspendido' {
  if (['1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(short)) return 'en_juego'
  if (['FT', 'AET', 'PEN'].includes(short)) return 'finalizado'
  if (['PST', 'CANC', 'SUSP', 'ABD', 'WO', 'AWD'].includes(short)) return 'suspendido'
  return 'programado'
}

function mapearFase(round: string): FasePartido {
  const r = round.toLowerCase()
  if (r.includes('group')) return 'grupos'
  if (r.includes('round of 32') || r.includes('round of 16')) return 'octavos'
  if (r.includes('quarter')) return 'cuartos'
  if (r.includes('semi')) return 'semifinal'
  if (r.includes('3rd') || r.includes('third')) return 'tercer_puesto'
  if (r.includes('final')) return 'final'
  return 'grupos'
}

// ─── Helper HTTP ──────────────────────────────────────────────────────────────

async function fetchApi<T>(path: string): Promise<T> {
  const url = `https://v3.football.api-sports.io${path}`
  const res = await fetch(url, { headers: { 'x-apisports-key': API_KEY } })
  if (!res.ok) throw new Error(`API-Football ${path} → HTTP ${res.status}`)
  return res.json() as Promise<T>
}

// ─── Mapa de alias nombre API → nombre en nuestra BD ─────────────────────────

const ALIAS: Record<string, string> = {
  'usa': 'estados unidos',
  'united states': 'estados unidos',
  'netherlands': 'países bajos',
  'holland': 'países bajos',
  'czech republic': 'república checa',
  'czechia': 'república checa',
  'bosnia': 'bosnia-herzegovina',
  'bosnia & herzegovina': 'bosnia-herzegovina',
  'south korea': 'corea del sur',
  'korea republic': 'corea del sur',
  'japan': 'japón',
  'belgium': 'bélgica',
  'algeria': 'argelia',
  'south africa': 'sudáfrica',
  'scotland': 'escocia',
  'norway': 'noruega',
  'sweden': 'suecia',
  'switzerland': 'suiza',
  'qatar': 'catar',
  'cape verde': 'cabo verde',
  'saudi arabia': 'arabia saudita',
  'haiti': 'haití',
  'jordan': 'jordania',
  'new zealand': 'nueva zelanda',
  'uzbekistan': 'uzbekistán',
  'panama': 'panamá',
  'croatia': 'croacia',
  'curacao': 'curazao',
  'curaçao': 'curazao',
  'dr congo': 'congo dr',
  'democratic republic of congo': 'congo dr',
  'morocco': 'marruecos',
  'tunisia': 'túnez',
  'turkey': 'turquía',
  'türkiye': 'turquía',
  'iran': 'irán',
  'iraq': 'irak',
  'england': 'inglaterra',
  'brazil': 'brasil',
  'germany': 'alemania',
  'spain': 'españa',
  'france': 'francia',
  'portugal': 'portugal',
  'argentina': 'argentina',
  'colombia': 'colombia',
  'ecuador': 'ecuador',
  'uruguay': 'uruguay',
  'paraguay': 'paraguay',
  'mexico': 'méxico',
  'senegal': 'senegal',
  'ghana': 'ghana',
  'egypt': 'egipto',
  'costa rica': 'costa rica',
  'australia': 'australia',
  'austria': 'austria',
  'canada': 'canadá',
}

function normalizarNombre(nombre: string): string {
  const lower = nombre.toLowerCase().trim()
  return ALIAS[lower] ?? lower
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Obteniendo fixture completo del Mundial 2026 desde API-Football...')

  const response = await fetchApi<{ response: ApiFixture[]; results: number }>(
    `/fixtures?league=${WC_LEAGUE_ID}&season=${WC_SEASON}`
  )

  console.log(`API-Football devolvió ${response.results} partidos`)

  if (response.results === 0) {
    console.warn('No se encontraron partidos. Verificá WC_LEAGUE_ID y WC_SEASON.')
    process.exit(0)
  }

  // Cargar todos los equipos de la BD
  const { data: equipos, error: eqError } = await db
    .from('equipos')
    .select('id, nombre_pais, grupo_fase, logo_url, bandera_url')

  if (eqError) throw new Error(eqError.message)

  // Mapa: nombre normalizado → { id, grupo_fase, logo, bandera }
  const equipoMap = new Map<string, { id: string; grupo_fase: string; logo: string | null; bandera: string | null }>()
  for (const eq of equipos ?? []) {
    equipoMap.set(eq.nombre_pais.toLowerCase(), {
      id: eq.id,
      grupo_fase: eq.grupo_fase,
      logo: eq.logo_url,
      bandera: eq.bandera_url,
    })
  }

  let insertados = 0
  let sinEquipo = 0
  const logoActualizar: { id: string; logo_url: string; bandera_url?: string }[] = []

  for (const fixture of response.response) {
    const homeNorm = normalizarNombre(fixture.teams.home.name)
    const awayNorm = normalizarNombre(fixture.teams.away.name)

    const local = equipoMap.get(homeNorm)
    const visitante = equipoMap.get(awayNorm)

    if (!local || !visitante) {
      console.warn(
        `Sin equipo para fixture ${fixture.fixture.id}: "${fixture.teams.home.name}" vs "${fixture.teams.away.name}"`
      )
      sinEquipo++
      continue
    }

    // Actualizar logo/bandera si API-Football los provee y no los tenemos
    if (!local.logo && fixture.teams.home.logo) {
      logoActualizar.push({ id: local.id, logo_url: fixture.teams.home.logo })
    }
    if (!visitante.logo && fixture.teams.away.logo) {
      logoActualizar.push({ id: visitante.id, logo_url: fixture.teams.away.logo })
    }

    const fase = mapearFase(fixture.league.round)
    const estado = mapearEstado(fixture.fixture.status.short)

    // Para fase grupos, el grupo_fase viene de nuestro equipo local
    const grupoFase = fase === 'grupos' ? local.grupo_fase : null

    // Calcular ganador y diferencia si el partido está finalizado
    let ganadorId: string | null = null
    let diferenciaGoles: number | null = null

    if (estado === 'finalizado' && fixture.goals.home !== null && fixture.goals.away !== null) {
      diferenciaGoles = Math.abs(fixture.goals.home - fixture.goals.away)
      if (fixture.goals.home > fixture.goals.away) ganadorId = local.id
      else if (fixture.goals.away > fixture.goals.home) ganadorId = visitante.id
    }

    const partido = {
      api_fixture_id: fixture.fixture.id,
      equipo_local_id: local.id,
      equipo_visitante_id: visitante.id,
      fecha_hora: fixture.fixture.date,
      estadio: fixture.fixture.venue.name ?? null,
      ciudad: fixture.fixture.venue.city ?? null,
      fase,
      grupo_fase: grupoFase,
      estado,
      minuto_juego: fixture.fixture.status.elapsed ?? null,
      goles_local: fixture.goals.home,
      goles_visitante: fixture.goals.away,
      ganador_id: ganadorId,
      diferencia_goles: diferenciaGoles,
      ultimo_sync: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { error } = await db
      .from('partidos')
      .upsert(partido, { onConflict: 'api_fixture_id' })

    if (error) {
      console.error(`Error fixture ${fixture.fixture.id}:`, error.message)
    } else {
      insertados++
    }
  }

  // Actualizar logos en equipos
  if (logoActualizar.length > 0) {
    console.log(`Actualizando logos en ${logoActualizar.length} equipos...`)
    for (const { id, logo_url } of logoActualizar) {
      await db.from('equipos').update({ logo_url }).eq('id', id)
    }
  }

  console.log(`\n✓ ${insertados} partidos insertados/actualizados`)
  if (sinEquipo > 0) {
    console.warn(`⚠ ${sinEquipo} partidos sin equipo en BD — revisá los alias de nombres`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
