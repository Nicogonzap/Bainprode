/**
 * Diccionario de países del Mundial 2026 con sus colores oficiales.
 *
 * Cada país tiene un gradient definido por los colores principales de su bandera.
 * Se usa en <CountryFlag /> para renderizar un cuadrado con los colores de la
 * selección, manteniendo el código del país como overlay para legibilidad.
 *
 * Los códigos están alineados con FIFA (3 letras).
 * Cuando no se encuentra un país, cae a un default gris neutro.
 */

export type CountryColors = {
  /** Nombre completo en español */
  name: string
  /** Colores principales de la bandera (2-3) en orden de izquierda a derecha o arriba a abajo */
  colors: string[]
  /** Dirección del gradiente: 'horizontal' (bandera tipo Francia) o 'vertical' (bandera tipo Argentina) */
  direction: 'horizontal' | 'vertical'
  /** Color de texto que mejor contrasta con el fondo */
  textColor: 'white' | 'black'
  /** Confederación: útil para "Continentes desconocidos" KPI */
  confederation: 'CONMEBOL' | 'UEFA' | 'CONCACAF' | 'AFC' | 'CAF' | 'OFC'
}

export const COUNTRIES: Record<string, CountryColors> = {
  // ========== CONMEBOL ==========
  ARG: { name: 'Argentina',  colors: ['#75AADB', '#FFFFFF', '#75AADB'], direction: 'vertical',   textColor: 'black', confederation: 'CONMEBOL' },
  BRA: { name: 'Brasil',     colors: ['#009C3B', '#FFDF00'],            direction: 'horizontal', textColor: 'black', confederation: 'CONMEBOL' },
  URY: { name: 'Uruguay',    colors: ['#7FB3D5', '#FFFFFF'],            direction: 'horizontal', textColor: 'black', confederation: 'CONMEBOL' },
  COL: { name: 'Colombia',   colors: ['#FFCD00', '#003893', '#CE1126'], direction: 'vertical',   textColor: 'black', confederation: 'CONMEBOL' },
  ECU: { name: 'Ecuador',    colors: ['#FFD100', '#003893', '#CE1126'], direction: 'vertical',   textColor: 'black', confederation: 'CONMEBOL' },
  PAR: { name: 'Paraguay',   colors: ['#D52B1E', '#FFFFFF', '#0038A8'], direction: 'vertical',   textColor: 'black', confederation: 'CONMEBOL' },
  PER: { name: 'Perú',       colors: ['#D91023', '#FFFFFF', '#D91023'], direction: 'horizontal', textColor: 'black', confederation: 'CONMEBOL' },
  CHI: { name: 'Chile',      colors: ['#FFFFFF', '#D52B1E'],            direction: 'horizontal', textColor: 'black', confederation: 'CONMEBOL' },
  BOL: { name: 'Bolivia',    colors: ['#D52B1E', '#F4E400', '#007934'], direction: 'vertical',   textColor: 'black', confederation: 'CONMEBOL' },
  VEN: { name: 'Venezuela',  colors: ['#FFDA00', '#0033A0', '#CF142B'], direction: 'vertical',   textColor: 'black', confederation: 'CONMEBOL' },

  // ========== UEFA ==========
  FRA: { name: 'Francia',     colors: ['#0055A4', '#FFFFFF', '#EF4135'], direction: 'horizontal', textColor: 'black', confederation: 'UEFA' },
  ESP: { name: 'España',      colors: ['#AA151B', '#F1BF00', '#AA151B'], direction: 'vertical',   textColor: 'white', confederation: 'UEFA' },
  ENG: { name: 'Inglaterra',  colors: ['#FFFFFF', '#CE1124'],            direction: 'horizontal', textColor: 'black', confederation: 'UEFA' },
  GER: { name: 'Alemania',    colors: ['#000000', '#DD0000', '#FFCC00'], direction: 'vertical',   textColor: 'white', confederation: 'UEFA' },
  ALE: { name: 'Alemania',    colors: ['#000000', '#DD0000', '#FFCC00'], direction: 'vertical',   textColor: 'white', confederation: 'UEFA' },
  ITA: { name: 'Italia',      colors: ['#008C45', '#FFFFFF', '#CD212A'], direction: 'horizontal', textColor: 'black', confederation: 'UEFA' },
  POR: { name: 'Portugal',    colors: ['#006600', '#FF0000'],            direction: 'horizontal', textColor: 'white', confederation: 'UEFA' },
  NED: { name: 'Países Bajos',colors: ['#AE1C28', '#FFFFFF', '#21468B'], direction: 'vertical',   textColor: 'black', confederation: 'UEFA' },
  BEL: { name: 'Bélgica',     colors: ['#000000', '#FAE042', '#ED2939'], direction: 'horizontal', textColor: 'white', confederation: 'UEFA' },
  POL: { name: 'Polonia',     colors: ['#FFFFFF', '#DC143C'],            direction: 'vertical',   textColor: 'black', confederation: 'UEFA' },
  CRO: { name: 'Croacia',     colors: ['#FF0000', '#FFFFFF', '#171796'], direction: 'vertical',   textColor: 'black', confederation: 'UEFA' },
  DEN: { name: 'Dinamarca',   colors: ['#C8102E', '#FFFFFF'],            direction: 'horizontal', textColor: 'white', confederation: 'UEFA' },
  SUI: { name: 'Suiza',       colors: ['#FF0000', '#FFFFFF'],            direction: 'horizontal', textColor: 'white', confederation: 'UEFA' },
  AUT: { name: 'Austria',     colors: ['#ED2939', '#FFFFFF', '#ED2939'], direction: 'vertical',   textColor: 'black', confederation: 'UEFA' },
  TUR: { name: 'Turquía',     colors: ['#E30A17', '#FFFFFF'],            direction: 'horizontal', textColor: 'white', confederation: 'UEFA' },
  SRB: { name: 'Serbia',      colors: ['#C6363C', '#0C4076', '#FFFFFF'], direction: 'vertical',   textColor: 'white', confederation: 'UEFA' },
  UKR: { name: 'Ucrania',     colors: ['#0057B7', '#FFD700'],            direction: 'vertical',   textColor: 'black', confederation: 'UEFA' },
  WAL: { name: 'Gales',       colors: ['#FFFFFF', '#00AB39'],            direction: 'vertical',   textColor: 'black', confederation: 'UEFA' },
  SCO: { name: 'Escocia',     colors: ['#005EB8', '#FFFFFF'],            direction: 'horizontal', textColor: 'white', confederation: 'UEFA' },
  NOR: { name: 'Noruega',     colors: ['#EF2B2D', '#FFFFFF', '#002868'], direction: 'horizontal', textColor: 'white', confederation: 'UEFA' },
  SWE: { name: 'Suecia',      colors: ['#006AA7', '#FECC00'],            direction: 'horizontal', textColor: 'black', confederation: 'UEFA' },
  CZE: { name: 'Chequia',     colors: ['#FFFFFF', '#D7141A', '#11457E'], direction: 'horizontal', textColor: 'white', confederation: 'UEFA' },
  HUN: { name: 'Hungría',     colors: ['#CE2939', '#FFFFFF', '#477050'], direction: 'horizontal', textColor: 'black', confederation: 'UEFA' },
  GRE: { name: 'Grecia',      colors: ['#0D5EAF', '#FFFFFF'],            direction: 'horizontal', textColor: 'white', confederation: 'UEFA' },
  ROU: { name: 'Rumania',     colors: ['#002B7F', '#FCD116', '#CE1126'], direction: 'vertical',   textColor: 'black', confederation: 'UEFA' },

  // ========== CONCACAF ==========
  MEX: { name: 'México',           colors: ['#006847', '#FFFFFF', '#CE1126'], direction: 'vertical',   textColor: 'black', confederation: 'CONCACAF' },
  USA: { name: 'Estados Unidos',   colors: ['#B22234', '#FFFFFF', '#3C3B6E'], direction: 'horizontal', textColor: 'white', confederation: 'CONCACAF' },
  CAN: { name: 'Canadá',           colors: ['#FF0000', '#FFFFFF', '#FF0000'], direction: 'vertical',   textColor: 'black', confederation: 'CONCACAF' },
  CRC: { name: 'Costa Rica',       colors: ['#002B7F', '#FFFFFF', '#CE1126'], direction: 'horizontal', textColor: 'white', confederation: 'CONCACAF' },
  PAN: { name: 'Panamá',           colors: ['#FFFFFF', '#005AA7', '#D21034'], direction: 'horizontal', textColor: 'black', confederation: 'CONCACAF' },
  JAM: { name: 'Jamaica',          colors: ['#009A49', '#000000', '#FFD100'], direction: 'horizontal', textColor: 'black', confederation: 'CONCACAF' },
  HON: { name: 'Honduras',         colors: ['#0073CF', '#FFFFFF', '#0073CF'], direction: 'horizontal', textColor: 'black', confederation: 'CONCACAF' },
  HTI: { name: 'Haití',            colors: ['#00209F', '#D21034'],            direction: 'horizontal', textColor: 'white', confederation: 'CONCACAF' },

  // ========== AFC ==========
  JPN: { name: 'Japón',            colors: ['#FFFFFF', '#BC002D'],            direction: 'horizontal', textColor: 'black', confederation: 'AFC' },
  KOR: { name: 'Corea del Sur',    colors: ['#FFFFFF', '#003478'],            direction: 'horizontal', textColor: 'black', confederation: 'AFC' },
  ARS: { name: 'Arabia Saudita',   colors: ['#006C35', '#FFFFFF'],            direction: 'horizontal', textColor: 'white', confederation: 'AFC' },
  KSA: { name: 'Arabia Saudita',   colors: ['#006C35', '#FFFFFF'],            direction: 'horizontal', textColor: 'white', confederation: 'AFC' },
  IRN: { name: 'Irán',             colors: ['#239F40', '#FFFFFF', '#DA0000'], direction: 'horizontal', textColor: 'black', confederation: 'AFC' },
  AUS: { name: 'Australia',        colors: ['#012169', '#FFFFFF', '#E4002B'], direction: 'horizontal', textColor: 'white', confederation: 'AFC' },
  QAT: { name: 'Qatar',            colors: ['#FFFFFF', '#8A1538'],            direction: 'horizontal', textColor: 'white', confederation: 'AFC' },
  UZB: { name: 'Uzbekistán',       colors: ['#0099B5', '#FFFFFF', '#1EB53A'], direction: 'horizontal', textColor: 'white', confederation: 'AFC' },
  JOR: { name: 'Jordania',         colors: ['#000000', '#FFFFFF', '#007A3D'], direction: 'horizontal', textColor: 'white', confederation: 'AFC' },
  IRQ: { name: 'Irak',             colors: ['#CE1126', '#FFFFFF', '#000000'], direction: 'horizontal', textColor: 'white', confederation: 'AFC' },

  // ========== CAF ==========
  MAR: { name: 'Marruecos',        colors: ['#C1272D', '#006233'],            direction: 'horizontal', textColor: 'white', confederation: 'CAF' },
  SEN: { name: 'Senegal',          colors: ['#00853F', '#FDEF42', '#E31B23'], direction: 'vertical',   textColor: 'black', confederation: 'CAF' },
  EGY: { name: 'Egipto',           colors: ['#CE1126', '#FFFFFF', '#000000'], direction: 'horizontal', textColor: 'white', confederation: 'CAF' },
  CMR: { name: 'Camerún',          colors: ['#007A5E', '#CE1126', '#FCD116'], direction: 'vertical',   textColor: 'white', confederation: 'CAF' },
  GHA: { name: 'Ghana',            colors: ['#CE1126', '#FCD116', '#006B3F'], direction: 'horizontal', textColor: 'white', confederation: 'CAF' },
  NGA: { name: 'Nigeria',          colors: ['#008751', '#FFFFFF', '#008751'], direction: 'vertical',   textColor: 'black', confederation: 'CAF' },
  TUN: { name: 'Túnez',            colors: ['#E70013', '#FFFFFF'],            direction: 'horizontal', textColor: 'white', confederation: 'CAF' },
  ALG: { name: 'Argelia',          colors: ['#006233', '#FFFFFF', '#D21034'], direction: 'vertical',   textColor: 'black', confederation: 'CAF' },
  CIV: { name: 'Costa de Marfil',  colors: ['#F77F00', '#FFFFFF', '#009E60'], direction: 'vertical',   textColor: 'black', confederation: 'CAF' },
  RSA: { name: 'Sudáfrica',        colors: ['#007749', '#000000', '#FFB81C'], direction: 'horizontal', textColor: 'white', confederation: 'CAF' },

  // ========== OFC ==========
  NZL: { name: 'Nueva Zelanda',    colors: ['#012169', '#C8102E'],            direction: 'horizontal', textColor: 'white', confederation: 'OFC' },
}

/** Helper para buscar país de manera segura. Devuelve null si no existe. */
export function getCountry(code: string): CountryColors | null {
  return COUNTRIES[code.toUpperCase()] ?? null
}

/** Default fallback para países no listados */
export const FALLBACK_COUNTRY: CountryColors = {
  name: 'Desconocido',
  colors: ['#E5E5E5', '#999999'],
  direction: 'horizontal',
  textColor: 'black',
  confederation: 'UEFA',
}