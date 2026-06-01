'use client'

/**
 * <CountryFlag />
 *
 * Renderiza un cuadrado con los colores de la bandera de un país.
 * Si el país no se encuentra en el diccionario, cae a un cuadrado gris neutro.
 *
 * Uso:
 *   <CountryFlag code="ARG" />              // tamaño default (md)
 *   <CountryFlag code="BRA" size="lg" />    // grande
 *   <CountryFlag code="MEX" size="sm" />    // chico
 *   <CountryFlag code="ARG" showCode />     // muestra el código encima
 */

import { getCountry, FALLBACK_COUNTRY } from '@/lib/countries'

type Size = 'sm' | 'md' | 'lg'

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'w-8 h-8 text-[10px]',
  md: 'w-10 h-10 text-xs',
  lg: 'w-14 h-14 text-sm',
}

export function CountryFlag({
  code,
  size = 'md',
  showCode = true,
  className = '',
}: {
  code: string
  size?: Size
  showCode?: boolean
  className?: string
}) {
  const country = getCountry(code) ?? FALLBACK_COUNTRY
  const sizeClass = SIZE_CLASSES[size]

  // Build gradient based on flag direction
  const gradientDirection = country.direction === 'vertical' ? 'to right' : 'to bottom'
  const stops = country.colors.map((color, i) => {
    const start = (i / country.colors.length) * 100
    const end = ((i + 1) / country.colors.length) * 100
    return `${color} ${start}%, ${color} ${end}%`
  }).join(', ')
  const background = `linear-gradient(${gradientDirection}, ${stops})`

  return (
    <span
      className={`${sizeClass} rounded-sm flex items-center justify-center font-bold tracking-tight flex-shrink-0 relative overflow-hidden border ${className}`}
      style={{
        background,
        borderColor: 'rgba(0,0,0,0.08)',
      }}
      title={country.name}
      aria-label={country.name}
    >
      {showCode && (
        <span
          className="relative z-10 px-1 rounded-sm"
          style={{
            color: country.textColor === 'white' ? '#FFFFFF' : '#000000',
            backgroundColor: country.textColor === 'white'
              ? 'rgba(0,0,0,0.35)'
              : 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
          }}
        >
          {code.toUpperCase()}
        </span>
      )}
    </span>
  )
}

export default CountryFlag
