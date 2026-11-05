'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCalm } from '@/lib/useCalm';
import { scrollToTarget } from '@/lib/scrollTo';

// page: item que abre outra página. Na home ele acende quando o bloco de mesmo id passa pela tela.
const SECTIONS: readonly { id: string; label: string; page?: string }[] = [
  { id: 'player', label: 'Ao vivo' },
  { id: 'materias', label: 'Matérias', page: '/materias' },
  { id: 'lendas', label: 'Lendas' },
  { id: 'pedidos', label: 'Pedidos' },
  { id: 'historia', label: 'Manifesto' },
  { id: 'programacao', label: 'Grade' },
  { id: 'fale-conosco', label: 'Fale conosco' },
];

/** Qual seção está passando pelo terço de cima da tela agora */
function useActiveSection() {
  const [active, setActive] = useState<string>('');
  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const line = window.innerHeight * 0.35;
      let current = '';
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= line) current = s.id;
      }
      // No fim da página, o último bloco ganha mesmo sem chegar à linha
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = SECTIONS[SECTIONS.length - 1].id;
      setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);
  return active;
}

const go = (e: React.MouseEvent, id: string) => {
  e.preventDefault();
  scrollToTarget(id);
  history.replaceState(null, '', `#${id}`);
};

/**
 * Menu do topo que acende a seção onde a pessoa está. No celular vira uma faixa que rola para o lado.
 * current: fora da home (ex.: "materias"), os itens viram links de volta para as seções da home.
 */
export default function SectionNav({ current }: { current?: string }) {
  const spied = useActiveSection();
  const active = current ?? spied;
  const stripRef = useRef<HTMLElement>(null);

  // No celular, mantém o item aceso visível dentro da faixa
  useEffect(() => {
    const strip = stripRef.current;
    const link = strip?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (!strip || !link || strip.scrollWidth <= strip.clientWidth) return;
    strip.scrollTo({ left: link.offsetLeft - strip.clientWidth / 2 + link.clientWidth / 2, behavior: 'smooth' });
  }, [active]);

  const link = (s: (typeof SECTIONS)[number], mobile: boolean) => {
    const on = active === s.id;
    const cls = `relative flex-shrink-0 transition-colors ${on ? 'text-white' : 'hover:text-white'} ${mobile ? 'py-1' : 'py-1.5'}`;
    const bar = (
      <span
        aria-hidden
        className={`absolute left-0 right-0 -bottom-0.5 h-[2px] rounded-full bg-gradient-to-r from-red-600 to-purple-600 origin-left transition-transform duration-300 ${
          on ? 'scale-x-100' : 'scale-x-0'
        }`}
      />
    );
    // Outra página, ou uma seção da home vista de fora dela: navegação normal do Next (a rádio segue tocando)
    if (s.page || current) {
      return (
        <Link key={s.id} href={s.page ?? `/#${s.id}`} data-id={s.id} aria-current={on ? (current ? 'page' : 'location') : undefined} className={cls}>
          {s.label}
          {bar}
        </Link>
      );
    }
    return (
      <a
        key={s.id}
        href={`#${s.id}`}
        data-id={s.id}
        onClick={(e) => go(e, s.id)}
        aria-current={on ? 'location' : undefined}
        className={cls}
      >
        {s.label}
        {bar}
      </a>
    );
  };

  return (
    <>
      <nav aria-label="Seções" className="hidden xl:flex items-center gap-6 2xl:gap-8 text-xs uppercase tracking-widest text-gray-400 font-medium">
        {SECTIONS.map((s) => link(s, false))}
      </nav>
      <nav
        ref={stripRef}
        aria-label="Seções"
        className="xl:hidden order-last w-full flex gap-5 overflow-x-auto text-xs uppercase tracking-wider text-gray-400 font-medium -mb-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {SECTIONS.map((s) => link(s, true))}
      </nav>
    </>
  );
}

/** Botão redondo que aparece depois da primeira tela e leva de volta ao topo */
export function BackToTop() {
  const [show, setShow] = useState(false);
  const calm = useCalm();
  useEffect(() => {
    const on = () => setShow(window.scrollY > window.innerHeight * 1.2);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <motion.button
      onClick={() => scrollToTarget(0)}
      aria-label="Voltar ao topo"
      tabIndex={show ? 0 : -1}
      initial={false}
      animate={{ opacity: show ? 1 : 0, y: show || calm ? 0 : 16 }}
      transition={calm ? { duration: 0.15 } : { type: 'spring', bounce: 0, duration: 0.35 }}
      style={{ pointerEvents: show ? 'auto' : 'none' }}
      className="glass fixed right-4 sm:right-6 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 w-11 h-11 rounded-full text-gray-100 flex items-center justify-center cursor-pointer"
    >
      <ArrowUp className="w-5 h-5" />
    </motion.button>
  );
}
