'use client'

const ISO3_TO_ISO2: Record<string, string> = {
  ARG: 'ar', BRA: 'br', MEX: 'mx', USA: 'us', CAN: 'ca',
  FRA: 'fr', GER: 'de', ESP: 'es', POR: 'pt', ITA: 'it',
  NED: 'nl', BEL: 'be', CRO: 'hr', DEN: 'dk', SUI: 'ch',
  URU: 'uy', COL: 'co', ECU: 'ec', CHI: 'cl', PER: 'pe',
  VEN: 've', PAR: 'py', BOL: 'bo', PAN: 'pa', HON: 'hn',
  CRC: 'cr', JAM: 'jm', TRI: 'tt', CUB: 'cu', HAI: 'ht',
  SEN: 'sn', MAR: 'ma', CMR: 'cm', GHA: 'gh', NGA: 'ng',
  CIV: 'ci', EGY: 'eg', MLI: 'ml', COD: 'cd', TUN: 'tn',
  ALG: 'dz', ZAM: 'zm', ANG: 'ao', KEN: 'ke', ZIM: 'zw',
  JPN: 'jp', KOR: 'kr', AUS: 'au', IRN: 'ir', SAU: 'sa',
  QAT: 'qa', UAE: 'ae', JOR: 'jo', IRQ: 'iq', UZB: 'uz',
  CHN: 'cn', IND: 'in', THA: 'th', IDN: 'id', PHI: 'ph',
  ENG: 'gb-eng', SCO: 'gb-sct', WAL: 'gb-wls', NIR: 'gb-nir',
  GBR: 'gb', SRB: 'rs', SVK: 'sk', SVN: 'si', POL: 'pl',
  CZE: 'cz', HUN: 'hu', ROU: 'ro', BUL: 'bg', GRE: 'gr',
  TUR: 'tr', UKR: 'ua', NOR: 'no', SWE: 'se', FIN: 'fi',
  ISL: 'is', AUT: 'at', IRL: 'ie', BIH: 'ba', MNE: 'me',
  MKD: 'mk', ALB: 'al', KOS: 'xk', LUX: 'lu', CYP: 'cy',
  NZL: 'nz', FIJ: 'fj', PNG: 'pg', VAN: 'vu', SOL: 'sb',
}

function getISO2(code: string | null | undefined): string {
  if (!code) return 'xx'
  const upper = code.trim().toUpperCase()
  if (upper === 'EN') return 'gb-eng'
  if (upper === 'SC') return 'gb-sct'
  if (upper.length === 2) return upper.toLowerCase()
  return ISO3_TO_ISO2[upper] ?? upper.slice(0, 2).toLowerCase()
}

type Size = 'sm' | 'md' | 'lg'

const SIZES: Record<Size, { cls: string; imgW: number }> = {
  sm: { cls: 'w-8 h-8', imgW: 40 },
  md: { cls: 'w-10 h-10', imgW: 40 },
  lg: { cls: 'w-14 h-14', imgW: 80 },
}

export function CountryFlag({
  code,
  url,
  size = 'md',
  showCode,
  className = '',
}: {
  code: string | null | undefined
  url?: string | null
  size?: Size
  showCode?: boolean
  className?: string
}) {
  const { cls, imgW } = SIZES[size]
  const iso2 = getISO2(code)
  const src = url || (iso2.includes('-') ? `https://flagcdn.com/${iso2}.svg` : `https://flagcdn.com/w${imgW}/${iso2}.png`)

  return (
    <span
      className={`${cls} rounded-full overflow-hidden flex-shrink-0 inline-flex items-center justify-center border ${className}`}
      style={{ borderColor: 'rgba(0,0,0,0.1)' }}
      title={code ?? ''}
      aria-label={code ?? ''}
    >
      <img
        src={src}
        alt={code ?? ''}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </span>
  )
}

export default CountryFlag