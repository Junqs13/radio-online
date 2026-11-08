'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { pageview, startAnalytics } from '@/lib/analytics';

/** Liga as estatísticas em qualquer página pública e conta cada página vista na navegação interna */
export default function SiteAnalytics() {
  const path = usePathname();
  const primeira = useRef(true);
  useEffect(() => {
    startAnalytics(); // a primeira página já entra aqui
  }, []);
  useEffect(() => {
    if (primeira.current) {
      primeira.current = false;
      return;
    }
    pageview();
  }, [path]);
  return null;
}
