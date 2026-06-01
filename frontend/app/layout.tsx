import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/auth-context'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Prode Bain — Mundial 2026',
  description:
    'Pronósticos del Mundial FIFA 2026 para la oficina de Bain Argentina. Predecí los 104 partidos y competí con tus colegas.',
  generator: 'v0.app',
  applicationName: 'Prode Bain Mundial 2026',
  keywords: ['prode', 'mundial', '2026', 'bain', 'argentina', 'pronósticos', 'fifa'],
  authors: [{ name: 'Bain & Company Argentina' }],
  openGraph: {
    title: 'Prode Bain — Mundial 2026',
    description: 'Pronósticos del Mundial 2026 para la oficina de Bain Argentina.',
    type: 'website',
    locale: 'es_AR',
  },
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es-AR" className={inter.variable}>
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}