/**
 * Carga el fixture completo del Mundial 2026 desde API-Football.
 * Debe correrse UNA sola vez al inicio del proyecto, después del seed.
 *
 * Uso: npm run sync-fixture
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import type { Database, FasePartido, PartidoInsert } from '../src/types/database.types'

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

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
    home: { id: number; name: string }
    away: { id: number; name: string }
  }
  goals: { home: number | null; away: number | null }
  score: {
    penalty: { home: number | null; away: number | null }
  }
}

// ─── Mapeos ───────────────────────────────────────────────────────────────────

function mapearEstado(short: string): 'programado' | 'en_juego' | 'finalizado' | 'suspendido' {
  const EN_JUEGO = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT']
  const FINALIZADO = ['FT', 'AET', 'PEN']
  const SUSPENDIDO = ['PST', 'CANC', 'SUSP', 'ABD', 'WO', 'AWD']

  if (EN_JUEGO.includes(short)) return 'en_juego'
  if (FINALIZADO.includes(short)) return 'finalizado'
  if (SUSPENDIDO.includes(short)) return 'suspendido'
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
  const res = await fetch(url, {
    headers: { 'x-apisports-key': API_KEY },
  })
  if (!res.ok) throw new Error(`API-Football ${path} → HTTP ${res.status}`)
  return res.json() as Promise<T>
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Obteniendo fixture completo del Mundial 2026...')

  const response = await fetchApi<{ response: ApiFixture[]; results: number }>(
    `/fixtures?league=${WC_LEAGUE_ID}&season=${WC_SEASON}`
  )

  console.log(`API-Football devolvió ${response.results} partidos`)

  if (response.results === 0) {
    console.warn('No se encontraron partidos. Verificá WC_LEAGUE_ID y WC_SEASON.')
    process.exit(0)
  }

  // Cargar todos los equipos de la BD para el mapeo id ↔ api_football_id
  const { data: equipos, error: eqError } = await supabase
    .from('equipos')
    .select('id, nombre_pais, api_football_id')

  if (eqError) throw eqError

  // Mapa: api_football_id → uuid interno
  const equipoMap = new Map<number, string>()
  for (const eq of equipos ?? []) {
    if (eq.api_football_id) {
      equipoMap.set(eq.api_football_id, eq.id)
    }
  }

  // Mapa por nombre para los equipos sin api_football_id aún
  const equipoNombreMap = new Map<string, string>()
  for (const eq of equipos ?? []) {
    equipoNombreMap.set(eq.nombre_pais.toLowerCase(), eq.id)
  }

  let insertados = 0
  let sinEquipo = 0
  const apiIdActualizar: { id: string; api_football_id: number }[] = []

  for (const fixture of response.response) {
    const homeApiId = fixture.teams.home.id
    const awayApiId = fixture.teams.away.id

    let localId = equipoMap.get(homeApiId)
    let visitanteId = equipoMap.get(awayApiId)

    // Fallback: buscar por nombre si no hay api_football_id registrado
    if (!localId) {
      const found = resolverPorNombre(fixture.teams.home.name, equipoNombreMap)
      if (found) {
        localId = found
        apiIdActualizar.push({ id: found, api_football_id: homeApiId })
        equipoMap.set(homeApiId, found)
      }
    }

    if (!visitanteId) {
      const found = resolverPorNombre(fixture.teams.away.name, equipoNombreMap)
      if (found) {
        visitanteId = found
        apiIdActualizar.push({ id: found, api_football_id: awayApiId })
        equipoMap.set(awayApiId, found)
      }
    }

    if (!localId || !visitanteId) {
      console.warn(
        `Sin equipo para fixture ${fixture.fixture.id}: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`
      )
      sinEquipo++
      continue
    }

    const partido: PartidoInsert = {
      api_football_id: fixture.fixture.id,
      equipo_local_id: localId,
      equipo_visitante_id: visitanteId,
      fecha_hora: fixture.fixture.date,
      estadio: fixture.fixture.venue.name ?? null,
      ciudad: fixture.fixture.venue.city ?? null,
      fase: mapearFase(fixture.league.round),
      estado: mapearEstado(fixture.fixture.status.short),
      minuto_juego: fixture.fixture.status.elapsed ?? null,
      goles_local: fixture.goals.home,
      goles_visitante: fixture.goals.away,
    }

    const { error } = await supabase
      .from('partidos')
      .upsert(partido, { onConflict: 'api_football_id' })

    if (error) {
      console.error(`Error insertando fixture ${fixture.fixture.id}:`, error.message)
    } else {
      insertados++
    }
  }

  // Actualizar api_football_id en equipos que se resolvieron por nombre
  if (apiIdActualizar.length > 0) {
    console.log(`Actualizando api_football_id en ${apiIdActualizar.length} equipos...`)
    for (const { id, api_football_id } of apiIdActualizar) {
      await supabase
        .from('equipos')
        .update({ api_football_id })
        .eq('id', id)
    }
  }

  console.log(`\n✓ ${insertados} partidos insertados/actualizados`)
  if (sinEquipo > 0) {
    console.warn(
      `⚠ ${sinEquipo} partidos sin equipo local en BD — corré el seed primero y verificá los nombres`
    )
  }
}

function resolverPorNombre(
  nombre: string,
  mapa: Map<string, string>
): string | undefined {
  const clave = nombre.toLowerCase()
  if (mapa.has(clave)) return mapa.get(clave)

  // Búsqueda parcial para variantes de nombre (ej. "USA" → "Estados Unidos")
  const alias: Record<string, string[]> = {
    'estados unidos': ['usa', 'united states', 'us'],
    'países bajos': ['netherlands', 'holland'],
    'república checa': ['czech republic', 'czechia'],
    'bosnia-herzegovina': ['bosnia', 'bosnia & herzegovina'],
    'corea del sur': ['south korea', 'korea republic', 'korea'],
    'irán': ['iran'],
    'irak': ['iraq'],
    'turquía': ['turkey', 'türkiye'],
    'japón': ['japan'],
    'bélgica': ['belgium'],
    'argelia': ['algeria'],
    'sudáfrica': ['south africa'],
    'escocia': ['scotland'],
    'noruega': ['norway'],
    'suecia': ['sweden'],
    'suiza': ['switzerland'],
    'catar': ['qatar'],
    'cabo verde': ['cape verde'],
    'arabia saudita': ['saudi arabia'],
    'haití': ['haiti'],
    'jordania': ['jordan'],
    'nueva zelanda': ['new zealand'],
    'uzbekistán': ['uzbekistan'],
    'panamá': ['panama'],
    'croacia': ['croatia'],
    'curazao': ['curacao', 'curaçao'],
    'congo dr': ['dr congo', 'congo dr', 'democratic republic of congo'],
    'marruecos': ['morocco'],
    'túnez': ['tunisia'],
  }

  for (const [español, variantes] of Object.entries(alias)) {
    if (variantes.includes(clave)) {
      return mapa.get(español)
    }
  }

  return undefined
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
