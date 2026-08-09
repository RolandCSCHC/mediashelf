import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MediaShelf',
    short_name: 'MediaShelf',
    description: 'Track movies and TV series in one private library.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f3f6f8',
    theme_color: '#2a7a6d',
    orientation: 'any',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
