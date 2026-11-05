'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { BrandMark, BrandWordmark } from './BrandLogo';
import SectionNav from './SectionNav';
import { HeaderClock, HeaderPlay } from './HeaderLive';
import { startGlass } from '@/lib/glass';

/** Topo das páginas internas (matérias): mesmo visual da home, com os itens levando de volta às seções dela */
export default function SiteHeader({ current }: { current: string }) {
  useEffect(() => {
    const stopGlass = startGlass();
    const onScroll = () => {
      if (window.scrollY > 8) document.documentElement.dataset.scrolled = '';
      else delete document.documentElement.dataset.scrolled;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      stopGlass();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <header className="header-edge fixed top-0 left-0 w-full z-50 backdrop-blur-2xl bg-[#050507]/70 px-5 sm:px-8 lg:px-16 py-4 lg:py-5 flex flex-wrap items-center justify-between gap-y-3">
      <Link href="/" aria-label="Antena Rock, voltar ao início" className="flex items-center gap-2.5 group">
        <BrandMark size={40} simple className="group-hover:scale-105 transition-transform" />
        <BrandWordmark />
      </Link>
      <SectionNav current={current} />
      <div className="flex items-center gap-3 sm:gap-4">
        <HeaderClock className="hidden min-[400px]:flex" />
        <HeaderPlay />
      </div>
    </header>
  );
}
