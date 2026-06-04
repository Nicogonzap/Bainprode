'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

const BAIN = {
  red: '#CC0000',
  black: '#000000',
  white: '#FFFFFF',
  grayBg: '#F5F5F5',
  grayBorder: '#E5E5E5',
  graySecondary: '#666666',
} as const

const BAIN_LOGO_SYMBOL = '/favicon.png'

type ActivePage = 'home' | 'predicciones' | 'especiales' | 'tabla' | 'mi-torneo' | 'admin'

const NAV_LINKS: { href: string; label: string; key: ActivePage }[] = [
  { href: '/home', label: 'Inicio', key: 'home' },
  { href: '/predicciones', label: 'Predicciones', key: 'predicciones' },
  { href: '/especiales', label: 'Especiales', key: 'especiales' },
  { href: '/tabla', label: 'Resultados', key: 'tabla' },
  { href: '/mi-torneo', label: 'Mis torneos', key: 'mi-torneo' },
]

function detectActive(pathname: string): ActivePage | null {
  if (pathname.startsWith('/home')) return 'home'
  if (pathname.startsWith('/predicciones')) return 'predicciones'
  if (pathname.startsWith('/especiales')) return 'especiales'
  if (pathname.startsWith('/tabla')) return 'tabla'
  if (pathname.startsWith('/mi-torneo')) return 'mi-torneo'
  if (pathname.startsWith('/admin')) return 'admin'
  return null
}

const ADMIN_EMAIL = 'nicolas.gonzalezpedrini@bain.com'

export function TopNav({ activePage }: { activePage?: ActivePage }) {
  const pathname = usePathname() || ''
  const active = activePage ?? detectActive(pathname)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user } = useAuth()
  const isAdmin = user?.email === ADMIN_EMAIL
  const effectiveLinks = isAdmin
    ? [...NAV_LINKS, { href: '/admin', label: 'Test', key: 'admin' as ActivePage }]
    : NAV_LINKS

  return (
    <header
      className="sticky top-0 z-50"
      style={{ backgroundColor: BAIN.white, borderBottom: `1px solid ${BAIN.grayBorder}` }}
    >
      <div className="max-w-[1200px] mx-auto h-16 px-6 flex items-center justify-between">
        {/* Left: logo */}
        <Link href="/home" className="flex items-center gap-3 group">
          <div className="relative w-8 h-8 flex-shrink-0">
            <Image
              src={BAIN_LOGO_SYMBOL}
              alt="Bain & Company"
              fill
              sizes="32px"
              className="object-contain"
              priority
              unoptimized
            />
          </div>
          <span className="font-bold text-base tracking-tight" style={{ color: BAIN.black }}>
            Bain
          </span>
          <span className="hidden md:inline" style={{ color: BAIN.grayBorder }}>
            /
          </span>
          <span className="hidden md:inline text-sm" style={{ color: BAIN.graySecondary }}>
            Prode Mundial 2026
          </span>
        </Link>

        {/* Center: desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {effectiveLinks.map((link) => {
            const isActive = active === link.key
            return (
              <Link
                key={link.key}
                href={link.href}
                className="relative text-sm font-medium transition-colors h-16 flex items-center hover:opacity-80"
                style={{ color: isActive ? BAIN.black : BAIN.graySecondary }}
              >
                {link.label}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0"
                    style={{ height: '2px', backgroundColor: BAIN.red }}
                    aria-hidden="true"
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right: hamburger (mobile only) */}
        <div className="flex items-center">
          <button
            type="button"
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-md transition-colors"
            style={{ color: BAIN.black }}
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((s) => !s)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden animate-in slide-in-from-top duration-200"
          style={{ backgroundColor: BAIN.white, borderTop: `1px solid ${BAIN.grayBorder}` }}
        >
          <nav className="max-w-[1200px] mx-auto px-6 py-2 flex flex-col">
            {effectiveLinks.map((link) => {
              const isActive = active === link.key
              return (
                <Link
                  key={link.key}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-medium py-3 pl-3 transition-colors"
                  style={{
                    color: isActive ? BAIN.black : BAIN.graySecondary,
                    borderLeft: `3px solid ${isActive ? BAIN.red : 'transparent'}`,
                  }}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </header>
  )
}

export default TopNav