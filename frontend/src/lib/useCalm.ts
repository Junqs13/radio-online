'use client';

import { useEffect, useState } from 'react';

/**
 * true quando a pessoa pediu menos movimento no sistema.
 * Começa false no servidor e na primeira pintura, para não dar diferença na hidratação,
 * e acompanha se a pessoa mudar a configuração com a página aberta.
 */
export function useCalm() {
  const [calm, setCalm] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setCalm(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return calm;
}
