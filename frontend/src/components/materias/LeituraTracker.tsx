'use client';

import { useEffect } from 'react';
import { flushNow, onLeave, track } from '@/lib/analytics';

/**
 * Mede a leitura de uma matéria: segundos com a aba visível e até onde a pessoa rolou o texto.
 * Manda o que acumulou quando a pessoa sai, esconde a aba ou vai para outra página do site.
 */
export default function LeituraTracker({ titulo, alvo }: { titulo: string; alvo: string }) {
  useEffect(() => {
    const caminho = location.pathname; // na navegação interna, a saída acontece já com o endereço novo
    let segundos = 0;
    let maior = 0;
    let enviado = 0;
    const medir = () => {
      const el = document.getElementById(alvo);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const lido = ((window.innerHeight - r.top) / Math.max(1, r.height)) * 100;
      maior = Math.max(maior, Math.min(100, Math.max(0, Math.round(lido))));
    };
    const tic = setInterval(() => {
      if (document.visibilityState === 'visible') segundos++;
    }, 1000);
    const enviar = () => {
      medir();
      if (segundos > enviado) {
        track('read', titulo, { section: 'materia', path: caminho, value: segundos - enviado });
        enviado = segundos;
      }
      if (maior > 0) track('scroll', titulo, { section: 'materia', path: caminho, value: maior });
    };
    medir();
    window.addEventListener('scroll', medir, { passive: true });
    const tirar = onLeave(enviar);
    return () => {
      enviar();
      flushNow();
      clearInterval(tic);
      tirar();
      window.removeEventListener('scroll', medir);
    };
  }, [titulo, alvo]);
  return null;
}
