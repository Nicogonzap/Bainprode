// Supabase Edge Function — corre en Deno, no en Node.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

// ─── Tipos mínimos de API-Football ────────────────────────────────────────────

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

interface ApiEvent {
  time: { elapsed: number; extra: number | null }
  team: { id: number }
  player: { name: string | null }
  assist: { name: string | null }
  type: string
  detail: string
}

// ─── Constantes del Mundial 2026 ──────────────────────────────────────────────

const WC_LEAGUE_ID = 1
const WC_SEASON = 2026

// ─── Mapeos de valores API-Football → ENUMs de la BD ─────────────────────────

function mapearEstado(short: string): string {
  const EN_JUEGO = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT']
  const FINALIZADO = ['FT', 'AET', 'PEN']
  const SUSPENDIDO = ['PST', 'CANC', 'SUSP', 'ABD', 'WO', 'AWD']

  if (EN_JUEGO.includes(short)) return 'en_juego'
  if (FINALIZADO.includes(short)) return 'finalizado'
  if (SUSPENDIDO.includes(short)) return 'suspendido'
  return 'programado'
}

function mapearFase(round: string): string {
  const r = round.toLowerCase()
  if (r.includes('group')) return 'grupos'
  if (r.includes('round of 32') || r.includes('round of 16')) return 'octavos'
  if (r.includes('quarter')) return 'cuartos'
  if (r.includes('semi')) return 'semifinal'
  if (r.includes('3rd') || r.includes('third')) return 'tercer_puesto'
  if (r.includes('final')) return 'final'
  return 'grupos'
}

function mapearTipoEvento(
  type: string,
  detail: string
): string | null {
  if (type === 'Goal') {
    if (detail === 'Penalty') return 'gol_penal'
    if (detail === 'Own Goal') return 'gol_propio'
    return 'gol'
  }
  if (type === 'Card') {
    if (detail === 'Yellow Card') return 'tarjeta_amarilla'
    if (detail === 'Red Card') return 'tarjeta_roja'
    if (detail === 'Yellow Red Card') return 'segunda_amarilla'
  }
  if (type === 'subst') return 'sustitucion'
  return null
}

// ─── Handler principal ────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const apiKey = Deno.env.get('API_FOOTBALL_KEY')!

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    })

    const today = new Date().toISOString().split('T')[0]

    // 1. Obtener partidos del día desde API-Football
    const fixtures = await fetchApiFootball<{ response: ApiFixture[] }>(
      `/fixtures?league=${WC_LEAGUE_ID}&season=${WC_SEASON}&date=${today}`,
      apiKey
    )

    const log: string[] = []
    let sincronizados = 0
    let eventosInsertados = 0
    let puntosCalculados = 0

    for (const fixture of fixtures.response) {
      const apiId = fixture.fixture.id
      const estadoApi = fixture.fixture.status.short
      const estado = mapearEstado(estadoApi)
      const fase = mapearFase(fixture.league.round)

      // 2. Resolver equipo_local_id y equipo_visitante_id por api_football_id
      const [localRow, visitanteRow] = await Promise.all([
        supabase
          .from('equipos')
          .select('id')
          .eq('api_football_id', fixture.teams.home.id)
          .single(),
        supabase
          .from('equipos')
          .select('id')
          .eq('api_football_id', fixture.teams.away.id)
          .single(),
      ])

      if (localRow.error || visitanteRow.error) {
        log.push(
          `WARN: no se encontró equipo para fixture ${apiId} (home=${fixture.teams.home.id}, away=${fixture.teams.away.id})`
        )
        continue
      }

      // 3. Upsert en tabla partidos
      const partidoData = {
        api_football_id: apiId,
        equipo_local_id: localRow.data.id,
        equipo_visitante_id: visitanteRow.data.id,
        fecha_hora: fixture.fixture.date,
        estadio: fixture.fixture.venue.name ?? null,
        ciudad: fixture.fixture.venue.city ?? null,
        fase,
        estado,
        minuto_juego: fixture.fixture.status.elapsed ?? null,
        periodo: estadoApi,
        goles_local: fixture.goals.home,
        goles_visitante: fixture.goals.away,
        updated_at: new Date().toISOString(),
      }

      const { data: partidoDB, error: upsertError } = await supabase
        .from('partidos')
        .upsert(partidoData, { onConflict: 'api_football_id' })
        .select('id, estado')
        .single()

      if (upsertError) {
        log.push(`ERROR upsert fixture ${apiId}: ${upsertError.message}`)
        continue
      }

      sincronizados++

      // 4. Si el partido está en curso, sincronizar eventos individuales
      if (estado === 'en_juego') {
        const eventos = await fetchApiFootball<{ response: ApiEvent[] }>(
          `/fixtures/events?fixture=${apiId}`,
          apiKey
        )

        for (const evento of eventos.response) {
          const tipo = mapearTipoEvento(evento.type, evento.detail)
          if (!tipo) continue

          // Resolver equipo_id del evento
          const { data: equipoEvento } = await supabase
            .from('equipos')
            .select('id')
            .eq('api_football_id', evento.team.id)
            .single()

          if (!equipoEvento) continue

          // Generar api_event_id estable: fixtureId * 1000 + minuto
          const apiEventId = apiId * 10000 + evento.time.elapsed * 10 + (evento.time.extra ?? 0)

          await supabase
            .from('eventos_partido')
            .upsert(
              {
                partido_id: partidoDB.id,
                api_event_id: apiEventId,
                tipo,
                minuto: evento.time.elapsed,
                minuto_extra: evento.time.extra ?? null,
                equipo_id: equipoEvento.id,
                jugador_nombre: evento.player.name ?? null,
                jugador_asistencia: evento.assist.name ?? null,
              },
              { onConflict: 'api_event_id' }
            )

          eventosInsertados++
        }

        // Sincronizar penales en playoffs si aplica
        const { home: penLocal, away: penVisitante } = fixture.score.penalty
        if (penLocal !== null || penVisitante !== null) {
          await supabase
            .from('playoffs')
            .upsert(
              {
                partido_id: partidoDB.id,
                ronda: fixture.league.round,
                penales_local: penLocal,
                penales_visitante: penVisitante,
              },
              { onConflict: 'partido_id' }
            )
        }
      }

      // 5. Si el partido pasó a finalizado, calcular puntos de predicciones
      if (estado === 'finalizado') {
        const { error: calcError } = await supabase.rpc(
          'calcular_puntos_prediccion',
          { partido_id: partidoDB.id }
        )

        if (calcError) {
          log.push(`ERROR calcular_puntos partido ${partidoDB.id}: ${calcError.message}`)
        } else {
          puntosCalculados++
        }
      }
    }

    const resultado = {
      ok: true,
      fecha: today,
      sincronizados,
      eventos_insertados: eventosInsertados,
      puntos_calculados: puntosCalculados,
      warnings: log,
    }

    console.log(JSON.stringify(resultado))

    return new Response(JSON.stringify(resultado), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('sync-live-matches error:', message)
    return new Response(JSON.stringify({ ok: false, error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

// ─── Helper HTTP para API-Football ───────────────────────────────────────────

async function fetchApiFootball<T>(path: string, apiKey: string): Promise<T> {
  const url = `https://v3.football.api-sports.io${path}`
  const res = await fetch(url, {
    headers: {
      'x-apisports-key': apiKey,
    },
  })

  if (!res.ok) {
    throw new Error(`API-Football ${path} → HTTP ${res.status}`)
  }

  return res.json() as Promise<T>
}
