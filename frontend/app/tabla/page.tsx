'use client'

import { useState, useMemo, useEffect } from 'react'
import { ChevronDown, ChevronUp, ChevronsUpDown, Globe, MapPin, Briefcase, Trophy } from 'lucide-react'
import { TopNav } from '@/components/top-nav'
import { Footer } from '@/components/footer'
import { useAuth } from '@/lib/auth-context'

const BAIN = {
  red: '#CC0000',
  redLight: '#CC000008',
  redLightBg: '#FFF0F0',
  black: '#000000',
  white: '#FFFFFF',
  grayBg: '#F5F5F5',
  grayBorder: '#E5E5E5',
  graySecondary: '#666666',
  grayTertiary: '#999999',
} as const

type Row = {
  pos: number
  nombre_usuario: string
  initials: string
  puntos_totales: number
  partidos_puntuados: number
  usuario_id: string
  grupo_id: string
  nombre_torneo: string
  oficina: string | null
  tenure: string | null
}

type SortKey = 'pos' | 'puntos_totales' | 'partidos_puntuados'
type SortDir = 'asc' | 'desc'
type ScopeKey = 'overall'

const SCOPES = [
  { key: 'overall' as const, label: 'Overall', icon: <Globe size={14} strokeWidth={2} />, description: 'Todos los participantes' },
]

function initials(nombre: string) {
  return nombre
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

function Avatar({ initials: i, size = 'md' }: { initials: string; size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'lg' ? 'w-16 h-16 text-base' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-12 h-12 text-sm'
  return <span className={`${dim} rounded-full flex items-center justify-center font-bold flex-shrink-0`} style={{ backgroundColor: BAIN.grayBg, color: BAIN.black }}>{i}</span>
}

export default function TablaPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('pos')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((r) => r.json())
      .then(({ data }) => {
        if (!data) return
        setRows(
          data.map((r: any, idx: number) => ({
            ...r,
            pos: r.posicion ?? idx + 1,
            initials: initials(r.nombre_usuario ?? '?'),
            oficina: r.oficina ?? null,
            tenure: r.tenure ?? null,
          }))
        )
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const av = a[sortKey] as number
      const bv = b[sortKey] as number
      return sortDir === 'asc' ? av - bv : bv - av
    })
  }, [rows, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir(key === 'pos' ? 'asc' : 'desc') }
  }

  const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) => {
    if (!active) return <ChevronsUpDown size={12} style={{ color: BAIN.grayTertiary }} />
    return dir === 'asc' ? <ChevronUp size={12} style={{ color: BAIN.red }} /> : <ChevronDown size={12} style={{ color: BAIN.red }} />
  }

  const top3 = sorted.slice(0, 3)
  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3
  const currentRow = sorted.find((r) => r.usuario_id === user?.id)

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: BAIN.grayBg }}>
      <TopNav activePage="tabla" />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-10">
        <section className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2" style={{ color: BAIN.black }}>Resultados</h1>
          <p className="text-sm" style={{ color: BAIN.graySecondary }}>Ranking de participantes del prode.</p>
        </section>

        {/* Mi posición */}
        {currentRow && (
          <section className="mb-6 rounded-md p-4 flex items-center justify-between animate-in fade-in duration-500" style={{ backgroundColor: BAIN.redLightBg, border: `1px solid ${BAIN.red}40` }}>
            <div className="flex items-center gap-3">
              <Avatar initials={currentRow.initials} size="md" />
              <div>
                <p className="text-xs font-bold uppercase" style={{ color: BAIN.red, letterSpacing: '0.08em' }}>TU POSICIÓN</p>
                <p className="text-base font-bold" style={{ color: BAIN.black }}>{currentRow.nombre_usuario}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold tracking-tight" style={{ color: BAIN.red }}>#{currentRow.pos}</p>
              <p className="text-xs" style={{ color: BAIN.graySecondary }}>de {sorted.length}</p>
            </div>
          </section>
        )}

        {/* Podio */}
        {podiumOrder.length === 3 && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 items-end">
            {podiumOrder.map((p, idx) => {
              const isFirst = p.pos === 1
              return (
                <div key={p.usuario_id} className="rounded-md p-6 text-center transition-shadow hover:shadow-sm" style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}`, borderTop: isFirst ? `4px solid ${BAIN.red}` : `1px solid ${BAIN.grayBorder}` }}>
                  <p className="text-xs font-bold uppercase mb-3" style={{ color: isFirst ? BAIN.red : BAIN.graySecondary, letterSpacing: '0.08em' }}>{p.pos}° LUGAR</p>
                  <div className="flex justify-center mb-3"><Avatar initials={p.initials} size={isFirst ? 'lg' : 'md'} /></div>
                  <p className="font-bold tracking-tight mb-1" style={{ color: BAIN.black, fontSize: isFirst ? '1rem' : '0.875rem' }}>{p.nombre_usuario}</p>
                  <p className="text-2xl font-bold tracking-tight mt-2" style={{ color: BAIN.black }}>{p.puntos_totales}</p>
                  <p className="text-xs" style={{ color: BAIN.graySecondary }}>puntos</p>
                </div>
              )
            })}
          </section>
        )}

        {/* Tabla */}
        <section className="rounded-md overflow-hidden" style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}` }}>
          {loading ? (
            <div className="py-10 text-center"><p className="text-sm" style={{ color: BAIN.graySecondary }}>Cargando ranking…</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: BAIN.grayBg }}>
                    <th className="text-xs font-bold uppercase px-4 py-3 cursor-pointer" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em', width: '60px' }} onClick={() => handleSort('pos')}>
                      <span className="inline-flex items-center gap-1">POS <SortIcon active={sortKey === 'pos'} dir={sortDir} /></span>
                    </th>
                    <th className="text-left text-xs font-bold uppercase px-4 py-3" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>PARTICIPANTE</th>
                    <th className="text-right text-xs font-bold uppercase px-4 py-3 cursor-pointer" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }} onClick={() => handleSort('puntos_totales')}>
                      <span className="inline-flex items-center gap-1 flex-row-reverse">PUNTOS <SortIcon active={sortKey === 'puntos_totales'} dir={sortDir} /></span>
                    </th>
                    <th className="text-left text-xs font-bold uppercase px-4 py-3 hidden lg:table-cell" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>OFICINA</th>
                    <th className="text-left text-xs font-bold uppercase px-4 py-3 hidden xl:table-cell" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>TENURE</th>
                    <th className="text-right text-xs font-bold uppercase px-4 py-3 hidden sm:table-cell cursor-pointer" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }} onClick={() => handleSort('partidos_puntuados')}>
                      <span className="inline-flex items-center gap-1 flex-row-reverse">PRED. <SortIcon active={sortKey === 'partidos_puntuados'} dir={sortDir} /></span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row) => (
                    <tr key={`${row.usuario_id}-${row.grupo_id}`} className="transition-colors hover:bg-gray-50" style={{ backgroundColor: row.usuario_id === user?.id ? BAIN.redLight : BAIN.white, borderTop: `1px solid ${BAIN.grayBorder}` }}>
                      <td className="px-4 py-4"><span className="text-sm font-bold" style={{ color: BAIN.black }}>{row.pos}</span></td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar initials={row.initials} size="sm" />
                          <span className="text-sm font-bold" style={{ color: BAIN.black }}>{row.nombre_usuario}</span>
                          {row.usuario_id === user?.id && (
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ backgroundColor: BAIN.red, color: BAIN.white, letterSpacing: '0.06em' }}>VOS</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right"><span className="text-sm font-bold" style={{ color: BAIN.black }}>{row.puntos_totales}</span></td>
                      <td className="px-4 py-4 hidden lg:table-cell"><span className="text-sm" style={{ color: BAIN.graySecondary }}>{row.oficina ?? '—'}</span></td>
                      <td className="px-4 py-4 hidden xl:table-cell"><span className="text-sm" style={{ color: BAIN.graySecondary }}>{row.tenure ?? '—'}</span></td>
                      <td className="px-4 py-4 text-right hidden sm:table-cell"><span className="text-sm" style={{ color: BAIN.black }}>{row.partidos_puntuados}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sorted.length === 0 && (
                <div className="py-10 text-center"><p className="text-sm" style={{ color: BAIN.graySecondary }}>El ranking aparecerá cuando empiece el Mundial.</p></div>
              )}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}