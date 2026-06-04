export function Footer() {
  const stats = [
    { label: 'Partidos', value: '104' },
    { label: 'Equipos', value: '48' },
    { label: 'Sedes', value: '3' },
  ]

  return (
    <footer style={{ backgroundColor: '#000000', borderTop: '1px solid #1a1a1a' }}>
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Left: wordmark */}
          <div className="flex items-baseline gap-1 leading-none">
            <span className="font-black text-xl tracking-tight" style={{ color: '#FFFFFF', letterSpacing: '-0.03em' }}>
              BAIN
            </span>
            <span className="text-[10px] font-bold ml-1" style={{ color: '#CC0000' }}>
              &amp; COMPANY
            </span>
          </div>

          {/* Center: stats */}
          <div className="flex items-center gap-8">
            {stats.map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-lg font-black leading-none" style={{ color: '#FFFFFF' }}>{value}</p>
                <p className="text-[10px] font-medium uppercase mt-0.5" style={{ color: '#666666', letterSpacing: '0.08em' }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Right: tagline */}
          <p className="text-xs text-center sm:text-right" style={{ color: '#555555' }}>
            Mundial FIFA 2026<br />
            11 jun – 19 jul · USA · MEX · CAN
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer