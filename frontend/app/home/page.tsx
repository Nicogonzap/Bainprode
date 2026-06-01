'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Target, Trophy, Calendar } from 'lucide-react'
import { TopNav } from '@/components/top-nav'
import { Footer } from '@/components/footer'
import { CountryFlag } from '@/components/country-flag'
import { ToastProvider, useToast } from '@/components/toast'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

const BAIN = {
  red: '#CC0000',
  redHover: '#990000',
  black: '#000000',
  white: '#FFFFFF',
  grayBg: '#F5F5F5',
  grayBorder: '#E5E5E5',
  graySecondary: '#666666',
  grayTertiary: '#999999',
} as const

type UserProfile = {
  nombre: string | null
  apellido: string | null
  nombre_usuario: string | null
}

type UpcomingMatch = {
  id: string
  date: string
  home: string
  homeName: string
  away: string
  awayName: string
  phase: string
}

const UPCOMING_STATIC: UpcomingMatch[] = [
  { id: '1', date: '15 JUN', home: 'ARG', homeName: 'Argentina', away: 'ARS', awayName: 'Arabia Saudita', phase: 'GRUPO J' },
  { id: '2', date: '16 JUN', home: 'BRA', homeName: 'Brasil', away: 'CMR', awayName: 'Camerún', phase: 'GRUPO F' },
  { id: '3', date: '17 JUN', home: 'ARG', homeName: 'Argentina', away: 'MEX', awayName: 'México', phase: 'GRUPO J' },
]

function HomePageContent() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [prediccionesCount, setPrediccionesCount] = useState(0)
  const [puntosTotales, setPuntosTotales] = useState<number | null>(null)

  useEffect(() => {
    if (!user) return

    // Cargar perfil
    supabase
      .from('usuarios')
      .select('nombre, apellido, nombre_usuario')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProfile(data)
      })

    // Contar predicciones del usuario
    supabase
      .from('predicciones')
      .select('id', { count: 'exact', head: true })
      .eq('usuario_id', user.id)
      .then(({ count }) => setPrediccionesCount(count ?? 0))

    // Puntos totales
    supabase
      .from('historial_puntos')
      .select('puntos')
      .eq('usuario_id', user.id)
      .then(({ data }) => {
        if (data) {
          const total = data.reduce((sum, r) => sum + (r.puntos ?? 0), 0)
          setPuntosTotales(total)
        }
      })
  }, [user])

  const nombreDisplay =
    profile?.nombre && profile?.apellido
      ? profile.nombre
      : profile?.nombre_usuario?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Usuario'

  const kpis = [
    { label: 'PUNTOS TOTALES', value: puntosTotales !== null ? String(puntosTotales) : '0', caption: '0 partidos jugados' },
    { label: 'POSICIÓN EN TU TORNEO', value: '—', caption: 'Torneo BNA Bain 2026' },
    { label: 'PREDICCIONES CARGADAS', value: `${prediccionesCount} / 104`, caption: `Faltan ${104 - prediccionesCount} partidos` },
    { label: '% DE ACIERTOS', value: '—', caption: 'Disponible cuando empiece el Mundial' },
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: BAIN.grayBg }}>
      <TopNav activePage="home" />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-10">
        {/* Hero */}
        <section className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2" style={{ color: BAIN.black }}>
            Hola, {nombreDisplay}
          </h1>
          <p className="text-sm" style={{ color: BAIN.graySecondary }}>
            Faltan{' '}
            <span className="font-bold" style={{ color: BAIN.red }}>10 días</span>{' '}
            para el primer partido del Mundial.
          </p>
        </section>

        {/* KPI grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpis.map((k, i) => (
            <div key={k.label} className="rounded-md p-5 transition-all hover:shadow-sm animate-in fade-in slide-in-from-bottom-2" style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}`, animationDelay: `${i * 80}ms`, animationFillMode: 'backwards', animationDuration: '500ms' }}>
              <p className="text-xs font-medium mb-3" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>{k.label}</p>
              <p className="text-3xl font-bold tracking-tight mb-1" style={{ color: BAIN.black }}>{k.value}</p>
              <p className="text-xs" style={{ color: BAIN.graySecondary }}>{k.caption}</p>
            </div>
          ))}
        </section>

        {/* Two column layout */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Próximo partido */}
            <div className="rounded-md p-6 transition-shadow hover:shadow-sm animate-in fade-in duration-500" style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}`, animationDelay: '300ms', animationFillMode: 'backwards' }}>
              <div className="flex items-center gap-2 mb-5">
                <Target size={18} style={{ color: BAIN.black }} strokeWidth={1.75} />
                <h2 className="text-base font-bold tracking-tight" style={{ color: BAIN.black }}>Próximo partido a predecir</h2>
              </div>
              <p className="text-xs font-medium mb-2" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>FASE DE GRUPOS · GRUPO J</p>
              <p className="text-sm font-medium mb-1" style={{ color: BAIN.black }}>Lunes 15 de junio · 21:00 ARG</p>
              <p className="text-xs mb-6" style={{ color: BAIN.graySecondary }}>SoFi Stadium, Los Angeles</p>
              <div className="flex items-center justify-around mb-6">
                <div className="flex flex-col items-center gap-2">
                  <CountryFlag code="ARG" size="lg" />
                  <span className="text-sm font-bold" style={{ color: BAIN.black }}>Argentina</span>
                </div>
                <span className="text-sm" style={{ color: BAIN.graySecondary }}>vs</span>
                <div className="flex flex-col items-center gap-2">
                  <CountryFlag code="ARS" size="lg" />
                  <span className="text-sm font-bold" style={{ color: BAIN.black }}>Arabia Saudita</span>
                </div>
              </div>
              <Link href="/predicciones" className="block w-full text-center font-bold py-2.5 px-4 rounded-md text-sm transition-colors" style={{ backgroundColor: BAIN.red, color: BAIN.white }}>
                Cargar predicción
              </Link>
            </div>

            {/* Próximos partidos */}
            <div className="rounded-md p-6 transition-shadow hover:shadow-sm animate-in fade-in duration-500" style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}`, animationDelay: '400ms', animationFillMode: 'backwards' }}>
              <h2 className="text-base font-bold tracking-tight mb-4" style={{ color: BAIN.black }}>Próximos partidos</h2>
              <ul>
                {UPCOMING_STATIC.map((m, i) => (
                  <li key={m.id} className="flex items-center justify-between py-3 transition-colors hover:bg-gray-50 -mx-2 px-2 rounded" style={{ borderBottom: i < UPCOMING_STATIC.length - 1 ? `1px solid ${BAIN.grayBorder}` : 'none' }}>
                    <div className="flex items-center gap-4">
                      <span className="w-14 text-xs font-bold uppercase" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>{m.date}</span>
                      <div className="flex items-center gap-2">
                        <CountryFlag code={m.home} size="sm" />
                        <span className="text-sm font-medium" style={{ color: BAIN.black }}>vs</span>
                        <CountryFlag code={m.away} size="sm" />
                      </div>
                    </div>
                    <span className="text-xs uppercase" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>{m.phase}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-2">
            <div className="rounded-md p-6 transition-shadow hover:shadow-sm animate-in fade-in duration-500" style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}`, animationDelay: '500ms', animationFillMode: 'backwards' }}>
              <div className="flex items-center gap-2 mb-5">
                <Trophy size={18} style={{ color: BAIN.black }} strokeWidth={1.75} />
                <h2 className="text-base font-bold tracking-tight" style={{ color: BAIN.black }}>Tus torneos</h2>
              </div>
              <div className="py-3">
                <p className="text-sm font-bold mb-1" style={{ color: BAIN.black }}>Torneo BNA Bain 2026</p>
                <Link href="/mi-torneo" className="text-xs font-medium hover:underline" style={{ color: BAIN.red }}>Ver detalle →</Link>
              </div>
              <button type="button" onClick={() => toast({ message: 'Funcionalidad en desarrollo', type: 'info' })} className="w-full py-2.5 px-4 rounded-md text-sm font-medium transition-colors mt-4" style={{ backgroundColor: BAIN.white, color: BAIN.black, border: `1px solid ${BAIN.black}` }}>
                + Crear nuevo torneo
              </button>
            </div>
          </div>
        </section>

        {/* Recent results */}
        <section className="rounded-md p-6 animate-in fade-in duration-500" style={{ backgroundColor: BAIN.white, border: `1px solid ${BAIN.grayBorder}`, animationDelay: '600ms', animationFillMode: 'backwards' }}>
          <h2 className="text-base font-bold tracking-tight mb-6" style={{ color: BAIN.black }}>Últimos resultados</h2>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Calendar size={40} strokeWidth={1.5} style={{ color: BAIN.grayTertiary }} className="mb-4" />
            <p className="text-sm" style={{ color: BAIN.graySecondary }}>Los resultados van a aparecer cuando empiece el Mundial el 11 de junio.</p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default function HomePage() {
  return (
    <ToastProvider>
      <HomePageContent />
    </ToastProvider>
  )
}