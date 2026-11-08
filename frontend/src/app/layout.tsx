import type { Metadata, Viewport } from "next";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/orbitron/500.css";
import "@fontsource/orbitron/800.css";
import "@fontsource/monoton/400.css";
import "./globals.css";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "Antena Rock | Rádio online de rock em Sorocaba", template: "%s | Antena Rock" },
  description: SITE.description,
  applicationName: "Antena Rock",
  keywords: ["rádio rock", "rádio online", "rádio de rock Sorocaba", "rock Sorocaba", "rádio Sorocaba", "rock nacional", "classic rock", "heavy metal"],
  alternates: { canonical: "/", types: { "application/rss+xml": [{ url: "/rss.xml", title: "Matérias da Antena Rock" }] } },
  // Códigos do Google Search Console e do Bing Webmaster, se forem verificar pela tag (opcional: dá para verificar pelo DNS)
  verification: {
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } : {}),
    ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? { other: { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } } : {}),
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "Antena Rock",
    title: "Antena Rock | Rádio online de rock em Sorocaba",
    description: SITE.description,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Antena Rock, rádio online de rock em Sorocaba" }],
  },
  twitter: { card: "summary_large_image", title: "Antena Rock", description: SITE.description, images: ["/og.png"] },
  other: { "geo.region": "BR-SP", "geo.placename": "Sorocaba" },
  // iPhone: "Compartilhar > Adicionar à Tela de Início" abre a rádio como app, sem a barra do Safari
  appleWebApp: { capable: true, title: "Antena Rock", statusBarStyle: "black-translucent" },
  icons: {
    // O Google mostra o favicon nos resultados: pede tamanho múltiplo de 48 px
    icon: [
      { url: "/icons/icon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icons/icon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

// Dados estruturados: a rádio (organização local de Sorocaba) e o site (nome que o Google mostra nos resultados)
const sameAs = Object.values(SITE.social).filter(Boolean);
const RADIO_ID = `${SITE.url}/#radio`;
const radio = {
  "@type": "RadioStation",
  "@id": RADIO_ID,
  name: SITE.name,
  url: SITE.url,
  logo: `${SITE.url}/icons/icon-512.png`,
  image: `${SITE.url}/og.png`,
  description: SITE.description,
  genre: ["Rock", "Classic Rock", "Heavy Metal", "Rock Nacional"],
  address: { "@type": "PostalAddress", addressLocality: SITE.city, addressRegion: SITE.state, addressCountry: SITE.country },
  areaServed: [{ "@type": "City", name: "Sorocaba" }, { "@type": "Country", name: "Brasil" }],
  openingHours: "Mo-Su 00:00-23:59",
  ...(SITE.email ? { email: SITE.email } : {}),
  ...(sameAs.length ? { sameAs } : {}),
};
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    radio,
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#site`,
      url: SITE.url,
      name: SITE.name,
      alternateName: ["Antena Rock Sorocaba", "Rádio Antena Rock"],
      inLanguage: "pt-BR",
      publisher: { "@id": RADIO_ID },
    },
  ],
};

export const viewport: Viewport = {
  themeColor: "#050507",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Abertura da página inicial só na primeira visita da aba (ver IntroSplash.tsx) */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var h=document.documentElement;if(sessionStorage.getItem('ar_intro'))h.classList.add('intro-seen');else{sessionStorage.setItem('ar_intro','1');h.classList.add('intro-play')}}catch(e){document.documentElement.classList.add('intro-seen')}",
          }}
        />
      </head>
      <body
        className="antialiased"
      >
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {children}
      </body>
    </html>
  );
}
