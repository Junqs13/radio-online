import type { MetadataRoute } from 'next';

// Permite "Adicionar à tela de início" no celular: abre em tela cheia, com ícone e nome da rádio
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Antena Rock',
    short_name: 'Antena Rock',
    description: 'Rádio online de rock, 24 horas no ar.',
    lang: 'pt-BR',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#050507',
    theme_color: '#050507',
    categories: ['music', 'entertainment'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
