import type { Metadata } from 'next';
import AdminShell from './AdminShell';

// Painel fora do Google: o robots.txt já bloqueia o rastreio, e esta etiqueta cobre quem chegar por link
export const metadata: Metadata = {
  title: 'Painel',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  alternates: { canonical: null },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
