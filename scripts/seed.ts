/**
 * Puebla la base de datos con los 48 equipos del Mundial 2026.
 * Grupos según el sorteo oficial del 5 de diciembre de 2025 (Washington D.C.)
 *
 * Uso: npm run seed
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import type { Database, EquipoInsert } from '../src/types/database.types'

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// ─── Datos del sorteo — Mundial 2026 ─────────────────────────────────────────
// Fuente: sorteo oficial FIFA, 5 de diciembre de 2025, Kennedy Center, Washington D.C.
// Rankings FIFA aproximados a diciembre 2025.
// codigo_iso: ISO 3166-1 alpha-2 salvo Inglaterra (EN) y Escocia (SC) que usan códigos FIFA.

const EQUIPOS: EquipoInsert[] = [
  // ── GRUPO A ──────────────────────────────────────────────────────────────
  { nombre_pais: 'México',            codigo_iso: 'MX', continente: 'CONCACAF', ranking_fifa: 16, grupo_fase: 'A' },
  { nombre_pais: 'Corea del Sur',     codigo_iso: 'KR', continente: 'AFC',      ranking_fifa: 22, grupo_fase: 'A' },
  { nombre_pais: 'Sudáfrica',         codigo_iso: 'ZA', continente: 'CAF',      ranking_fifa: 62, grupo_fase: 'A' },
  { nombre_pais: 'República Checa',   codigo_iso: 'CZ', continente: 'UEFA',     ranking_fifa: 40, grupo_fase: 'A' },

  // ── GRUPO B ──────────────────────────────────────────────────────────────
  { nombre_pais: 'Canadá',            codigo_iso: 'CA', continente: 'CONCACAF', ranking_fifa: 43, grupo_fase: 'B' },
  { nombre_pais: 'Suiza',             codigo_iso: 'CH', continente: 'UEFA',     ranking_fifa: 21, grupo_fase: 'B' },
  { nombre_pais: 'Catar',             codigo_iso: 'QA', continente: 'AFC',      ranking_fifa: 37, grupo_fase: 'B' },
  { nombre_pais: 'Bosnia-Herzegovina',codigo_iso: 'BA', continente: 'UEFA',     ranking_fifa: 63, grupo_fase: 'B' },

  // ── GRUPO C ──────────────────────────────────────────────────────────────
  { nombre_pais: 'Brasil',            codigo_iso: 'BR', continente: 'CONMEBOL', ranking_fifa: 5,  grupo_fase: 'C' },
  { nombre_pais: 'Marruecos',         codigo_iso: 'MA', continente: 'CAF',      ranking_fifa: 14, grupo_fase: 'C' },
  { nombre_pais: 'Escocia',           codigo_iso: 'SC', continente: 'UEFA',     ranking_fifa: 39, grupo_fase: 'C' },
  { nombre_pais: 'Haití',             codigo_iso: 'HT', continente: 'CONCACAF', ranking_fifa: 82, grupo_fase: 'C' },

  // ── GRUPO D ──────────────────────────────────────────────────────────────
  { nombre_pais: 'Estados Unidos',    codigo_iso: 'US', continente: 'CONCACAF', ranking_fifa: 13, grupo_fase: 'D' },
  { nombre_pais: 'Paraguay',          codigo_iso: 'PY', continente: 'CONMEBOL', ranking_fifa: 52, grupo_fase: 'D' },
  { nombre_pais: 'Australia',         codigo_iso: 'AU', continente: 'AFC',      ranking_fifa: 23, grupo_fase: 'D' },
  { nombre_pais: 'Turquía',           codigo_iso: 'TR', continente: 'UEFA',     ranking_fifa: 26, grupo_fase: 'D' },

  // ── GRUPO E ──────────────────────────────────────────────────────────────
  { nombre_pais: 'Alemania',          codigo_iso: 'DE', continente: 'UEFA',     ranking_fifa: 12, grupo_fase: 'E' },
  { nombre_pais: 'Curazao',           codigo_iso: 'CW', continente: 'CONCACAF', ranking_fifa: 85, grupo_fase: 'E' },
  { nombre_pais: 'Costa Rica',        codigo_iso: 'CR', continente: 'CONCACAF', ranking_fifa: 47, grupo_fase: 'E' },
  { nombre_pais: 'Ecuador',           codigo_iso: 'EC', continente: 'CONMEBOL', ranking_fifa: 33, grupo_fase: 'E' },

  // ── GRUPO F ──────────────────────────────────────────────────────────────
  { nombre_pais: 'Países Bajos',      codigo_iso: 'NL', continente: 'UEFA',     ranking_fifa: 7,  grupo_fase: 'F' },
  { nombre_pais: 'Japón',             codigo_iso: 'JP', continente: 'AFC',      ranking_fifa: 15, grupo_fase: 'F' },
  { nombre_pais: 'Túnez',             codigo_iso: 'TN', continente: 'CAF',      ranking_fifa: 30, grupo_fase: 'F' },
  { nombre_pais: 'Suecia',            codigo_iso: 'SE', continente: 'UEFA',     ranking_fifa: 25, grupo_fase: 'F' },

  // ── GRUPO G ──────────────────────────────────────────────────────────────
  { nombre_pais: 'Bélgica',           codigo_iso: 'BE', continente: 'UEFA',     ranking_fifa: 3,  grupo_fase: 'G' },
  { nombre_pais: 'Egipto',            codigo_iso: 'EG', continente: 'CAF',      ranking_fifa: 35, grupo_fase: 'G' },
  { nombre_pais: 'Irán',              codigo_iso: 'IR', continente: 'AFC',      ranking_fifa: 20, grupo_fase: 'G' },
  { nombre_pais: 'Nueva Zelanda',     codigo_iso: 'NZ', continente: 'OFC',      ranking_fifa: 91, grupo_fase: 'G' },

  // ── GRUPO H ──────────────────────────────────────────────────────────────
  { nombre_pais: 'España',            codigo_iso: 'ES', continente: 'UEFA',     ranking_fifa: 2,  grupo_fase: 'H' },
  { nombre_pais: 'Cabo Verde',        codigo_iso: 'CV', continente: 'CAF',      ranking_fifa: 72, grupo_fase: 'H' },
  { nombre_pais: 'Arabia Saudita',    codigo_iso: 'SA', continente: 'AFC',      ranking_fifa: 58, grupo_fase: 'H' },
  { nombre_pais: 'Uruguay',           codigo_iso: 'UY', continente: 'CONMEBOL', ranking_fifa: 17, grupo_fase: 'H' },

  // ── GRUPO I ──────────────────────────────────────────────────────────────
  { nombre_pais: 'Francia',           codigo_iso: 'FR', continente: 'UEFA',     ranking_fifa: 4,  grupo_fase: 'I' },
  { nombre_pais: 'Senegal',           codigo_iso: 'SN', continente: 'CAF',      ranking_fifa: 18, grupo_fase: 'I' },
  { nombre_pais: 'Noruega',           codigo_iso: 'NO', continente: 'UEFA',     ranking_fifa: 29, grupo_fase: 'I' },
  { nombre_pais: 'Irak',              codigo_iso: 'IQ', continente: 'AFC',      ranking_fifa: 68, grupo_fase: 'I' },

  // ── GRUPO J ──────────────────────────────────────────────────────────────
  { nombre_pais: 'Argentina',         codigo_iso: 'AR', continente: 'CONMEBOL', ranking_fifa: 1,  grupo_fase: 'J' },
  { nombre_pais: 'Argelia',           codigo_iso: 'DZ', continente: 'CAF',      ranking_fifa: 34, grupo_fase: 'J' },
  { nombre_pais: 'Austria',           codigo_iso: 'AT', continente: 'UEFA',     ranking_fifa: 27, grupo_fase: 'J' },
  { nombre_pais: 'Jordania',          codigo_iso: 'JO', continente: 'AFC',      ranking_fifa: 70, grupo_fase: 'J' },

  // ── GRUPO K ──────────────────────────────────────────────────────────────
  { nombre_pais: 'Portugal',          codigo_iso: 'PT', continente: 'UEFA',     ranking_fifa: 6,  grupo_fase: 'K' },
  { nombre_pais: 'Colombia',          codigo_iso: 'CO', continente: 'CONMEBOL', ranking_fifa: 9,  grupo_fase: 'K' },
  { nombre_pais: 'Uzbekistán',        codigo_iso: 'UZ', continente: 'AFC',      ranking_fifa: 65, grupo_fase: 'K' },
  { nombre_pais: 'Congo DR',          codigo_iso: 'CD', continente: 'CAF',      ranking_fifa: 53, grupo_fase: 'K' },

  // ── GRUPO L ──────────────────────────────────────────────────────────────
  { nombre_pais: 'Inglaterra',        codigo_iso: 'EN', continente: 'UEFA',     ranking_fifa: 8,  grupo_fase: 'L' },
  { nombre_pais: 'Croacia',           codigo_iso: 'HR', continente: 'UEFA',     ranking_fifa: 10, grupo_fase: 'L' },
  { nombre_pais: 'Ghana',             codigo_iso: 'GH', continente: 'CAF',      ranking_fifa: 60, grupo_fase: 'L' },
  { nombre_pais: 'Panamá',            codigo_iso: 'PA', continente: 'CONCACAF', ranking_fifa: 44, grupo_fase: 'L' },
]

async function main() {
  console.log(`Insertando ${EQUIPOS.length} equipos...`)

  const { data: equiposInsertados, error: equiposError } = await supabase
    .from('equipos')
    .upsert(EQUIPOS, { onConflict: 'nombre_pais' })
    .select('id, nombre_pais, grupo_fase')

  if (equiposError) {
    console.error('Error insertando equipos:', equiposError.message)
    process.exit(1)
  }

  console.log(`✓ ${equiposInsertados?.length ?? 0} equipos insertados/actualizados`)

  // Poblar tabla grupo_equipos con standings iniciales en 0
  if (equiposInsertados && equiposInsertados.length > 0) {
    console.log('Inicializando standings de grupo_equipos...')

    const standings = equiposInsertados.map((e) => ({
      grupo_letra: e.grupo_fase,
      equipo_id: e.id,
      pj: 0,
      pg: 0,
      pe: 0,
      pp: 0,
      gf: 0,
      gc: 0,
    }))

    const { error: standingsError } = await supabase
      .from('grupo_equipos')
      .upsert(standings, { onConflict: 'equipo_id' })

    if (standingsError) {
      console.error('Error en grupo_equipos:', standingsError.message)
    } else {
      console.log(`✓ ${standings.length} filas de grupo_equipos inicializadas`)
    }
  }

  console.log('\nSeed completado.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
