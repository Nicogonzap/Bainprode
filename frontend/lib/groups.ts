/**
 * Estructura de grupos y partidos del Mundial 2026 (mock).
 *
 * 12 grupos (A-L) de 4 equipos cada uno = 48 equipos.
 * Cada grupo tiene 6 partidos (round-robin).
 * Total fase de grupos: 72 partidos.
 *
 * NOTA: Esta es una versión MOCK. Cuando esté la API/Supabase conectada
 * vamos a poblar esto desde openfootball/worldcup.json (la fuente real).
 *
 * Para que funcione la vista "Por grupo" y el preview de standings,
 * cada grupo necesita sus 6 partidos definidos acá.
 */

export type GroupKey = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L'

export type GroupTeam = {
  code: string  // FIFA 3-letter code (alineado con lib/countries.ts)
  name: string
}

export type GroupMatch = {
  id: string
  group: GroupKey
  home: string
  homeName: string
  away: string
  awayName: string
  date: string         // formato display, e.g. "LUNES 15 DE JUNIO"
  dateSort: string     // formato ISO para ordenar, e.g. "2026-06-15"
  time: string         // e.g. "21:00 ARG"
  venue: string
}

// ============================================================
// EQUIPOS POR GRUPO
// ============================================================
export const GROUPS: Record<GroupKey, GroupTeam[]> = {
  A: [
    { code: 'NED', name: 'Países Bajos' },
    { code: 'POL', name: 'Polonia' },
    { code: 'NOR', name: 'Noruega' },
    { code: 'JAM', name: 'Jamaica' },
  ],
  B: [
    { code: 'ENG', name: 'Inglaterra' },
    { code: 'USA', name: 'Estados Unidos' },
    { code: 'IRN', name: 'Irán' },
    { code: 'ECU', name: 'Ecuador' },
  ],
  C: [
    { code: 'FRA', name: 'Francia' },
    { code: 'DEN', name: 'Dinamarca' },
    { code: 'TUN', name: 'Túnez' },
    { code: 'AUS', name: 'Australia' },
  ],
  D: [
    { code: 'CAN', name: 'Canadá' },
    { code: 'BEL', name: 'Bélgica' },
    { code: 'CRO', name: 'Croacia' },
    { code: 'MAR', name: 'Marruecos' },
  ],
  E: [
    { code: 'ALE', name: 'Alemania' },
    { code: 'JPN', name: 'Japón' },
    { code: 'KOR', name: 'Corea del Sur' },
    { code: 'GHA', name: 'Ghana' },
  ],
  F: [
    { code: 'BRA', name: 'Brasil' },
    { code: 'CMR', name: 'Camerún' },
    { code: 'SUI', name: 'Suiza' },
    { code: 'SRB', name: 'Serbia' },
  ],
  G: [
    { code: 'ITA', name: 'Italia' },
    { code: 'COL', name: 'Colombia' },
    { code: 'CIV', name: 'Costa de Marfil' },
    { code: 'WAL', name: 'Gales' },
  ],
  H: [
    { code: 'ESP', name: 'España' },
    { code: 'CRC', name: 'Costa Rica' },
    { code: 'SEN', name: 'Senegal' },
    { code: 'NZL', name: 'Nueva Zelanda' },
  ],
  I: [
    { code: 'POR', name: 'Portugal' },
    { code: 'URY', name: 'Uruguay' },
    { code: 'AUT', name: 'Austria' },
    { code: 'EGY', name: 'Egipto' },
  ],
  J: [
    { code: 'ARG', name: 'Argentina' },
    { code: 'ARS', name: 'Arabia Saudita' },
    { code: 'MEX', name: 'México' },
    { code: 'NGA', name: 'Nigeria' },
  ],
  K: [
    { code: 'TUR', name: 'Turquía' },
    { code: 'PAR', name: 'Paraguay' },
    { code: 'QAT', name: 'Qatar' },
    { code: 'JOR', name: 'Jordania' },
  ],
  L: [
    { code: 'VEN', name: 'Venezuela' },
    { code: 'PAN', name: 'Panamá' },
    { code: 'UZB', name: 'Uzbekistán' },
    { code: 'HON', name: 'Honduras' },
  ],
}

// ============================================================
// PARTIDOS DE FASE DE GRUPOS (round-robin: 6 partidos por grupo)
// ============================================================
// Generamos automáticamente los partidos para que cada grupo tenga sus 6 cruces.
// Las fechas son mock: cada grupo juega entre el 11 y el 27 de junio.

const VENUES = [
  'SoFi Stadium, Los Angeles',
  'MetLife Stadium, New Jersey',
  'Estadio Azteca, Ciudad de México',
  'AT&T Stadium, Dallas',
  'Mercedes-Benz, Atlanta',
  'Hard Rock Stadium, Miami',
  "Levi's Stadium, San Francisco",
  'Lumen Field, Seattle',
  'NRG Stadium, Houston',
  'Lincoln Financial Field, Philadelphia',
  'Arrowhead Stadium, Kansas City',
  'BMO Field, Toronto',
  'BC Place, Vancouver',
  'Estadio Akron, Guadalajara',
  'Estadio BBVA, Monterrey',
]

const TIMES = ['15:00 ARG', '17:00 ARG', '19:00 ARG', '21:00 ARG']

const GROUP_DAYS: Record<GroupKey, string[]> = {
  // Cada grupo juega sus 6 partidos en 3 fechas distintas (2 por jornada)
  A: ['2026-06-11', '2026-06-16', '2026-06-21'],
  B: ['2026-06-12', '2026-06-17', '2026-06-22'],
  C: ['2026-06-13', '2026-06-18', '2026-06-23'],
  D: ['2026-06-14', '2026-06-19', '2026-06-24'],
  E: ['2026-06-15', '2026-06-20', '2026-06-25'],
  F: ['2026-06-11', '2026-06-16', '2026-06-21'],
  G: ['2026-06-12', '2026-06-17', '2026-06-22'],
  H: ['2026-06-13', '2026-06-18', '2026-06-23'],
  I: ['2026-06-14', '2026-06-19', '2026-06-24'],
  J: ['2026-06-15', '2026-06-20', '2026-06-25'], // grupo de Argentina
  K: ['2026-06-13', '2026-06-18', '2026-06-23'],
  L: ['2026-06-14', '2026-06-19', '2026-06-24'],
}

const DAYS_OF_WEEK = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO']
const MONTHS = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE']

function formatDateDisplay(iso: string): string {
  const d = new Date(iso + 'T12:00:00') // mediodía para evitar issues de TZ
  return `${DAYS_OF_WEEK[d.getDay()]} ${d.getDate()} DE ${MONTHS[d.getMonth()]}`
}

/**
 * Genera los 6 partidos round-robin para un grupo dado.
 * Distribuye en 3 jornadas como se hace en mundiales reales:
 *  Jornada 1: T1 vs T2, T3 vs T4
 *  Jornada 2: T1 vs T3, T2 vs T4
 *  Jornada 3: T1 vs T4, T2 vs T3
 */
function generateGroupMatches(groupKey: GroupKey): GroupMatch[] {
  const teams = GROUPS[groupKey]
  const days = GROUP_DAYS[groupKey]

  // Pares por jornada (índices en el array de teams)
  const pairings: [number, number][][] = [
    [[0, 1], [2, 3]], // jornada 1
    [[0, 2], [1, 3]], // jornada 2
    [[0, 3], [1, 2]], // jornada 3
  ]

  const matches: GroupMatch[] = []
  let idx = 0

  pairings.forEach((dayPairings, dayIdx) => {
    dayPairings.forEach(([i, j], pairIdx) => {
      const home = teams[i]
      const away = teams[j]
      const dateIso = days[dayIdx]
      const venue = VENUES[(groupKey.charCodeAt(0) - 65 + dayIdx + pairIdx) % VENUES.length]
      const time = TIMES[(dayIdx + pairIdx) % TIMES.length]

      matches.push({
        id: `${groupKey}-${idx + 1}`,
        group: groupKey,
        home: home.code,
        homeName: home.name,
        away: away.code,
        awayName: away.name,
        date: formatDateDisplay(dateIso),
        dateSort: dateIso,
        time,
        venue,
      })
      idx += 1
    })
  })

  return matches
}

export const ALL_GROUP_MATCHES: GroupMatch[] = (Object.keys(GROUPS) as GroupKey[])
  .flatMap((g) => generateGroupMatches(g))
  .sort((a, b) => a.dateSort.localeCompare(b.dateSort))

// ============================================================
// CÁLCULO DE STANDINGS (en base a predicciones)
// ============================================================
export type Prediction = { home: number | ''; away: number | '' }
export type Predictions = Record<string, Prediction>

export type StandingRow = {
  code: string
  name: string
  pj: number    // partidos jugados (predichos)
  g: number     // ganados
  e: number     // empatados
  p: number     // perdidos
  gf: number    // goles a favor
  gc: number    // goles en contra
  dg: number    // diferencia de goles
  pts: number   // puntos
}

/**
 * Calcula los standings de un grupo en base a las predicciones del usuario.
 * Solo cuenta partidos donde ambos lados tienen predicción cargada (números).
 *
 * Ordenamiento FIFA:
 *  1. Puntos
 *  2. Diferencia de goles
 *  3. Goles a favor
 *  (Head-to-head se ignora en este mock — lo agregamos cuando esté la API real)
 */
export function calculateGroupStandings(
  groupKey: GroupKey,
  predictions: Predictions,
): StandingRow[] {
  const teams = GROUPS[groupKey]
  const matches = ALL_GROUP_MATCHES.filter((m) => m.group === groupKey)

  // Inicializar stats
  const stats: Record<string, StandingRow> = {}
  teams.forEach((t) => {
    stats[t.code] = {
      code: t.code,
      name: t.name,
      pj: 0, g: 0, e: 0, p: 0,
      gf: 0, gc: 0, dg: 0, pts: 0,
    }
  })

  // Procesar cada partido predicho
  matches.forEach((match) => {
    const pred = predictions[match.id]
    if (!pred || pred.home === '' || pred.away === '') return

    const h = stats[match.home]
    const a = stats[match.away]
    if (!h || !a) return

    const hg = Number(pred.home)
    const ag = Number(pred.away)

    h.pj += 1; a.pj += 1
    h.gf += hg; h.gc += ag
    a.gf += ag; a.gc += hg

    if (hg > ag) {
      h.g += 1; a.p += 1
      h.pts += 3
    } else if (hg < ag) {
      a.g += 1; h.p += 1
      a.pts += 3
    } else {
      h.e += 1; a.e += 1
      h.pts += 1; a.pts += 1
    }
  })

  // Calcular diferencia de goles
  Object.values(stats).forEach((s) => { s.dg = s.gf - s.gc })

  // Ordenar
  return Object.values(stats).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts
    if (b.dg !== a.dg) return b.dg - a.dg
    return b.gf - a.gf
  })
}

// ============================================================
// HELPERS
// ============================================================

/** Devuelve los partidos agrupados por fecha (para vista "Por fecha") */
export function matchesByDate(): { date: string; dateSort: string; matches: GroupMatch[] }[] {
  const map = new Map<string, GroupMatch[]>()
  ALL_GROUP_MATCHES.forEach((m) => {
    if (!map.has(m.dateSort)) map.set(m.dateSort, [])
    map.get(m.dateSort)!.push(m)
  })
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateSort, matches]) => ({
      date: matches[0].date,
      dateSort,
      matches,
    }))
}

/** Devuelve los partidos agrupados por grupo (para vista "Por grupo") */
export function matchesByGroup(): { group: GroupKey; teams: GroupTeam[]; matches: GroupMatch[] }[] {
  return (Object.keys(GROUPS) as GroupKey[]).map((g) => ({
    group: g,
    teams: GROUPS[g],
    matches: ALL_GROUP_MATCHES.filter((m) => m.group === g),
  }))
}