// Supabase Edge Function — corre en Deno, no en Node.js
// Sincroniza los planteles del Mundial 2026 desde API-Football
// Invocar manualmente: supabase functions invoke sync-jugadores
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Tipos de API-Football
interface ApiSquadPlayer {
  id: number
  name: string
  age: number
  number: number | null
  position: string // "Goalkeeper" | "Defender" | "Midfielder" | "Attacker"
  photo: string
}
interface ApiSquadResponse {
  response: Array<{
    team: { id: number; name: string }
    players: ApiSquadPlayer[]
  }>
}

function mapPosicion(position: string): 'ARQ' | 'DEF' | 'MED' | 'DEL' {
  switch (position) {
    case 'Goalkeeper': return 'ARQ'
    case 'Defender':   return 'DEF'
    case 'Midfielder': return 'MED'
    case 'Attacker':   return 'DEL'
    default:           return 'DEL'
  }
}

async function fetchApiFootball<T>(path: string, apiKey: string): Promise<T> {
  const url = `https://v3.football.api-sports.io${path}`
  const res = await fetch(url, { headers: { 'x-apisports-key': apiKey } })
  if (!res.ok) throw new Error(`API-Football ${path} → HTTP ${res.status}`)
  return res.json() as Promise<T>
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const apiKey      = Deno.env.get('API_FOOTBALL_KEY')!

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    })

    // 1. Traer todos los equipos que participan en el Mundial (con su api_football_id)
    const { data: equipos, error: eqError } = await supabase
      .from('equipos')
      .select('id, nombre_pais, api_football_id')
      .not('api_football_id', 'is', null)

    if (eqError) throw eqError
    if (!equipos?.length) throw new Error('No se encontraron equipos con api_football_id')

    const log: string[] = []
    let totalInsertados = 0
    let totalEquipos = 0

    for (const equipo of equipos) {
      try {
        // 2. Pedir el plantel del equipo a API-Football
        const squadData = await fetchApiFootball<ApiSquadResponse>(
          `/players/squads?team=${equipo.api_football_id}`,
          apiKey
        )

        const response = squadData.response[0]
        if (!response?.players?.length) {
          log.push(`WARN: sin jugadores para ${equipo.nombre_pais} (api_id=${equipo.api_football_id})`)
          continue
        }

        // 3. Construir registros a insertar
        const rows = response.players.map((p) => ({
          nombre: p.name,
          equipo_id: equipo.id,
          posicion: mapPosicion(p.position),
          numero: p.number ?? null,
          api_football_player_id: p.id,
        }))

        // 4. Upsert por api_football_player_id
        const { error: upsertError, count } = await supabase
          .from('jugadores')
          .upsert(rows, {
            onConflict: 'api_football_player_id',
            ignoreDuplicates: false,
          })
          .select('id', { count: 'exact', head: true })

        if (upsertError) {
          log.push(`ERROR upsert ${equipo.nombre_pais}: ${upsertError.message}`)
          continue
        }

        totalInsertados += rows.length
        totalEquipos++
        log.push(`OK: ${equipo.nombre_pais} — ${rows.length} jugadores`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        log.push(`ERROR ${equipo.nombre_pais}: ${msg}`)
      }

      // Pequeña pausa para no saturar la API (100 req/min en plan free)
      await new Promise((r) => setTimeout(r, 700))
    }

    const resultado = {
      ok: true,
      equipos_sincronizados: totalEquipos,
      jugadores_insertados: totalInsertados,
      log,
    }

    console.log(JSON.stringify(resultado))

    return new Response(JSON.stringify(resultado), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('sync-jugadores error:', message)
    return new Response(JSON.stringify({ ok: false, error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})