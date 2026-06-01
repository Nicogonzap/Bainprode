'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ChevronDown, Menu, X } from 'lucide-react'

const BAIN = {
  red: '#CC0000',
  black: '#000000',
  white: '#FFFFFF',
  grayBg: '#F5F5F5',
  grayBorder: '#E5E5E5',
  graySecondary: '#666666',
} as const

// Logo oficial de Bain (símbolo solo, sin texto). Usamos URL externa por velocidad.
// TODO: si queremos optimizar, descargar a /public/logo-bain.png y cambiar el src.
const BAIN_LOGO_SYMBOL = 'https://logos-world.net/wp-content/uploads/2025/04/Bain-Company-Symbol.png'

type ActivePage = 'home' | 'predicciones' | 'especiales' | 'tabla' | 'mi-torneo'

const NAV_LINKS: { href: string; label: string; key: ActivePage }[] = [
  { href: '/home', label: 'Inicio', key: 'home' },
  { href: '/predicciones', label: 'Predicciones', key: 'predicciones' },
  { href: '/especiales', label: 'Especiales', key: 'especiales' },
  { href: '/tabla', label: 'Resultados', key: 'tabla' },
  { href: '/mi-torneo', label: 'Mi torneo', key: 'mi-torneo' },
]

function detectActive(pathname: string): ActivePage | null {
  if (pathname.startsWith('/home')) return 'home'
  if (pathname.startsWith('/predicciones')) return 'predicciones'
  if (pathname.startsWith('/especiales')) return 'especiales'
  if (pathname.startsWith('/tabla')) return 'tabla'
  if (pathname.startsWith('/mi-torneo')) return 'mi-torneo'
  return null
}

export function TopNav({ activePage }: { activePage?: ActivePage }) {
  const pathname = usePathname() || ''
  const active = activePage ?? detectActive(pathname)
  const [mobileOpen, setMobileOpen] = useState(false)

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
          {NAV_LINKS.map((link) => {
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

        {/* Right: avatar (desktop) / hamburger (mobile) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="hidden md:flex items-center gap-2 transition-opacity hover:opacity-80"
            aria-label="Menú de usuario"
          >
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: BAIN.grayBg, color: BAIN.black }}
            >
              SM
            </span>
            <ChevronDown size={16} style={{ color: BAIN.graySecondary }} />
          </button>

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
            {NAV_LINKS.map((link) => {
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
            <div
              className="flex items-center gap-2 py-3 pl-3 mt-2"
              style={{ borderTop: `1px solid ${BAIN.grayBorder}` }}
            >
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: BAIN.grayBg, color: BAIN.black }}
              >
                SM
              </span>
              <span className="text-sm" style={{ color: BAIN.black }}>
                Santiago Matheu
              </span>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

export default TopNav
