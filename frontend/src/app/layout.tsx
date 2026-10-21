import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "Antena Rock | Rádio online de rock em Sorocaba", template: "%s | Antena Rock" },
  description: SITE.description,
  applicationName: "Antena Rock",
  keywords: ["rádio rock", "rádio online", "rádio de rock Sorocaba", "rock Sorocaba", "rádio Sorocaba", "rock nacional", "classic rock", "heavy metal"],
  alternates: { canonical: "/" },
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
    icon: [{ url: "/icons/favicon-64.png", sizes: "64x64", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

// Dados estruturados para o Google entender que é uma rádio de Sorocaba
const sameAs = Object.values(SITE.social).filter(Boolean);
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "RadioStation",
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

export const viewport: Viewport = {
  themeColor: "#050507",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {children}
      </body>
    </html>
  );
}
