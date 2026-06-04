'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, User } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

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

function BainLogo() {
  return (
    <Link href="/home" className="flex items-center gap-2.5 group flex-shrink-0">
      {/* Wordmark */}
      <div className="flex items-baseline gap-0.5 leading-none">
        <span
          className="font-black text-[22px] tracking-tight"
          style={{ color: '#FFFFFF', letterSpacing: '-0.03em' }}
        >
          BAIN
        </span>
        <span
          className="text-[11px] font-bold ml-1"
          style={{ color: '#CC0000' }}
        >
          &amp; COMPANY
        </span>
      </div>
      {/* Badge */}
      <span
        className="hidden sm:inline text-[9px] font-bold px-2 py-0.5 rounded-sm tracking-widest uppercase"
        style={{ backgroundColor: '#CC000022', color: '#CC0000', border: '1px solid #CC000040' }}
      >
        USA · MEX · CAN 26
      </span>
    </Link>
  )
}

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
      style={{ backgroundColor: '#000000', borderBottom: '1px solid #1a1a1a' }}
    >
      <div className="max-w-[1200px] mx-auto h-16 px-6 flex items-center justify-between">
        <BainLogo />

        {/* Center: desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {effectiveLinks.map((link) => {
            const isActive = active === link.key
            return (
              <Link
                key={link.key}
                href={link.href}
                className="relative text-sm font-medium transition-opacity h-16 flex items-center hover:opacity-70"
                style={{ color: isActive ? '#FFFFFF' : '#999999' }}
              >
                {link.label}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0"
                    style={{ height: '2px', backgroundColor: '#CC0000' }}
                    aria-hidden="true"
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right: user icon + hamburger */}
        <div className="flex items-center gap-3">
          <Link
            href="/perfil"
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-full transition-opacity hover:opacity-70"
            style={{ backgroundColor: '#1a1a1a', color: '#999999' }}
            aria-label="Mi perfil"
          >
            <User size={15} />
          </Link>
          <button
            type="button"
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-md"
            style={{ color: '#FFFFFF' }}
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
          style={{ backgroundColor: '#000000', borderTop: '1px solid #1a1a1a' }}
        >
          <nav className="max-w-[1200px] mx-auto px-6 py-2 flex flex-col">
            {effectiveLinks.map((link) => {
              const isActive = active === link.key
              return (
                <Link
                  key={link.key}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-medium py-3 pl-3 transition-opacity hover:opacity-70"
                  style={{
                    color: isActive ? '#FFFFFF' : '#999999',
                    borderLeft: `3px solid ${isActive ? '#CC0000' : 'transparent'}`,
                  }}
                >
                  {link.label}
                </Link>
              )
            })}
            <Link
              href="/perfil"
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium py-3 pl-3 transition-opacity hover:opacity-70"
              style={{ color: '#999999', borderLeft: '3px solid transparent' }}
            >
              Mi perfil
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}

export default TopNav