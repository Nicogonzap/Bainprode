'use client'

import { TopNav } from '@/components/top-nav'
import { Footer } from '@/components/footer'

const BAIN = {
  red: '#CC0000',
  black: '#000000',
  white: '#FFFFFF',
  grayBg: '#F5F5F5',
  grayBorder: '#E5E5E5',
  graySecondary: '#666666',
  grayTertiary: '#999999',
} as const

function Pts({ n, color }: { n: number; color?: string }) {
  return (
    <span
      className="inline-flex items-center justify-center min-w-[2.5rem] px-2 h-7 rounded font-bold text-sm tabular-nums"
      style={{ backgroundColor: color ?? BAIN.black, color: BAIN.white }}
    >
      +{n}
    </span>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-xs font-bold uppercase tracking-widest mb-3 mt-8"
      style={{ color: BAIN.graySecondary }}
    >
      {children}
    </h2>
  )
}

const MATCH_ROWS: { label: string; ganador: number; exacto: number; note?: string }[] = [
  { label: 'Grupos', ganador: 3, exacto: 5, note: 'Incluye predicción de empate' },
  { label: '16vos de final', ganador: 3, exacto: 5 },
  { label: 'Octavos de final', ganador: 3, exacto: 5 },
  { label: 'Cuartos de final', ganador: 4, exacto: 6 },
  { label: 'Semifinal', ganador: 5, exacto: 7 },
  { label: 'Tercer y cuarto puesto', ganador: 5, exacto: 7 },
  { label: 'Final', ganador: 6, exacto: 8 },
]

const ESPECIALES_ROWS = [
  { label: 'Campeón del mundo', pts: 15 },
  { label: 'Subcampeón', pts: 8 },
  { label: 'Tercer puesto', pts: 5 },
  { label: 'Goleador del torneo', pts: 10 },
  { label: 'Balón de oro', pts: 10 },
  { label: 'Guante de oro', pts: 10 },
]

export default function PuntosPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: BAIN.grayBg }}>
      <TopNav activePage="puntos" />
      <main className="flex-1 max-w-[860px] w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2" style={{ color: BAIN.black }}>
          Sistema de puntos
        </h1>
        <p className="text-sm mb-10" style={{ color: BAIN.graySecondary }}>
          Cómo se calculan los puntos por cada predicción acertada.
        </p>

        <SectionTitle>Predicciones de partidos</SectionTitle>
        <div className="rounded-md overflow-hidden" style={{ border: `1px solid ${BAIN.grayBorder}` }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: BAIN.grayBg }}>
                <th className="text-left px-4 py-2.5 font-bold uppercase text-xs" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>
                  Fase
                </th>
                <th className="text-center px-4 py-2.5 font-bold uppercase text-xs w-36" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>
                  Ganador / Empate
                </th>
                <th className="text-center px-4 py-2.5 font-bold uppercase text-xs w-36" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>
                  Resultado exacto
                </th>
              </tr>
            </thead>
            <tbody>
              {MATCH_ROWS.map((row, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${BAIN.grayBorder}`, backgroundColor: BAIN.white }}>
                  <td className="px-4 py-3">
                    <span className="font-medium" style={{ color: BAIN.black }}>{row.label}</span>
                    {row.note && (
                      <p className="text-xs mt-0.5" style={{ color: BAIN.grayTertiary }}>{row.note}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Pts n={row.ganador} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Pts n={row.exacto} color={BAIN.red} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          className="mt-4 rounded-md px-4 py-3 flex items-start gap-3"
          style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}` }}
        >
          <div>
            <p className="text-sm font-bold" style={{ color: BAIN.black }}>
              Bonus goleada{' '}
              <span
                className="inline-flex items-center justify-center px-2 h-6 rounded font-bold text-xs ml-1"
                style={{ backgroundColor: '#92400E', color: BAIN.white }}
              >
                +1
              </span>
            </p>
            <p className="text-sm mt-1" style={{ color: BAIN.graySecondary }}>
              Si acertás el resultado exacto y la diferencia de goles es 3 o más, sumás 1 punto adicional.
              Aplica en todas las fases.
            </p>
          </div>
        </div>

        <SectionTitle>Predicciones especiales</SectionTitle>
        <div className="rounded-md overflow-hidden" style={{ border: `1px solid ${BAIN.grayBorder}` }}>
          {ESPECIALES_ROWS.map((row, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-3"
              style={{
                backgroundColor: BAIN.white,
                borderTop: i > 0 ? `1px solid ${BAIN.grayBorder}` : undefined,
              }}
            >
              <span className="text-sm font-medium" style={{ color: BAIN.black }}>{row.label}</span>
              <Pts n={row.pts} color={row.pts >= 10 ? BAIN.red : BAIN.black} />
            </div>
          ))}
        </div>
        <p className="text-xs mt-3" style={{ color: BAIN.grayTertiary }}>
          Los puntos especiales se acreditan una vez terminado el torneo y confirmados los premios oficiales.
        </p>

        <SectionTitle>Ejemplos</SectionTitle>
        <div className="flex flex-col gap-3">
          {[
            {
              cat: 'Exacto en grupos',
              desc: 'Predijiste Argentina 2 – 1 y el resultado fue Argentina 2 – 1',
              pts: 5,
            },
            {
              cat: 'Ganador correcto en Cuartos',
              desc: 'Predijiste que Argentina ganaba, y ganó (pero con diferente marcador)',
              pts: 4,
            },
            {
              cat: 'Exacto en Final',
              desc: 'Acertaste el resultado exacto de la final',
              pts: 8,
            },
            {
              cat: 'Exacto + goleada en Semifinal',
              desc: 'Acertaste el exacto y la diferencia de goles fue 3 o más',
              pts: 8,
            },
          ].map((ex, i) => (
            <div
              key={i}
              className="rounded-md px-4 py-3 flex items-center justify-between gap-4"
              style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}` }}
            >
              <div>
                <p className="text-xs font-bold uppercase mb-0.5" style={{ color: BAIN.graySecondary, letterSpacing: '0.06em' }}>
                  {ex.cat}
                </p>
                <p className="text-sm" style={{ color: BAIN.black }}>{ex.desc}</p>
              </div>
              <Pts n={ex.pts} color={ex.pts >= 7 ? BAIN.red : BAIN.black} />
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
