import { PlayerProvider } from '@/components/PlayerContext';
import StickyPlayer from '@/components/StickyPlayer';
import { BackToTop } from '@/components/SectionNav';

// Páginas públicas do site. O player fica aqui, fora das páginas, para a rádio
// continuar tocando quando o ouvinte vai da home para as matérias e volta.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlayerProvider>
      {children}
      <StickyPlayer />
      <BackToTop />
    </PlayerProvider>
  );
}
