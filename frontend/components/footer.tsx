const BAIN = {
  white: '#FFFFFF',
  grayBorder: '#E5E5E5',
  graySecondary: '#666666',
  grayTertiary: '#999999',
} as const

export function Footer() {
  return (
    <footer style={{ backgroundColor: BAIN.white, borderTop: `1px solid ${BAIN.grayBorder}` }}>
      <div className="max-w-[1200px] mx-auto px-6 py-6 text-center">
        <p className="text-xs" style={{ color: BAIN.graySecondary }}>
          Proyecto interno · Oficina de Bain Buenos Aires · Mundial FIFA 2026
        </p>
        <p className="text-xs mt-1" style={{ color: BAIN.grayTertiary }}>
          11 de junio – 19 de julio · 48 equipos · 104 partidos
        </p>
      </div>
    </footer>
  )
}

export default Footer
