import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Prode Bain — Mundial 2026',
    short_name: 'Prode Bain',
    description: 'Pronósticos del Mundial FIFA 2026 para Bain & Company',
    start_url: '/home',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#CC0000',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}