import { useId } from 'react';

/**
 * Marca da Antena Rock: a torre de transmissão (A) com ondas e faixas retrô.
 * - BrandMark: o símbolo. "simple" tira os detalhes para tamanhos pequenos (abaixo de ~48 px).
 * - BrandWordmark: ANTENA (Orbitron) + ROCK (Monoton).
 * Cores da marca: Palco #0B0A10, Válvula #F4EDE0, Sinal #E11D2E, Neon #7C3AED.
 */

type Tone = 'color' | 'white' | 'black';

export function BrandMark({
  size = 48,
  tone = 'color',
  simple = false,
  className = '',
  title,
}: {
  size?: number;
  tone?: Tone;
  simple?: boolean;
  className?: string;
  title?: string;
}) {
  const id = useId().replace(/:/g, '');
  const fg = tone === 'black' ? '#0B0A10' : tone === 'white' ? '#FFFFFF' : '#F4EDE0';
  const red = tone === 'color' ? '#E11D2E' : fg;
  const purple = tone === 'color' ? '#7C3AED' : fg;
  const stripes = tone === 'color' ? `url(#g${id})` : fg;
  const a11y = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true as const };

  if (simple) {
    return (
      <svg width={size} height={size} viewBox="0 0 200 200" className={className} {...a11y}>
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#E11D2E" />
            <stop offset="1" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <path className="bm-w1" d="M84 20 A22 22 0 0 0 84 52 M116 20 A22 22 0 0 1 116 52" fill="none" stroke={red} strokeWidth="10" strokeLinecap="round" />
        <circle cx="100" cy="36" r="12" fill={fg} />
        <path d="M100 52 L150 184 H50 Z" fill="none" stroke={fg} strokeWidth="13" strokeLinejoin="round" />
        <path d="M68 138 H132 M60 162 H140" stroke={stripes} strokeWidth="11" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 200 200" className={className} {...a11y}>
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#E11D2E" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
        <clipPath id={`c${id}`}>
          <path d="M100 46 L152 184 H48 Z" />
        </clipPath>
      </defs>
      <path className="bm-w1" d="M84 20 A22 22 0 0 0 84 52 M116 20 A22 22 0 0 1 116 52" fill="none" stroke={red} strokeWidth="6" strokeLinecap="round" />
      <path className="bm-w2" d="M70 6 A40 40 0 0 0 70 66 M130 6 A40 40 0 0 1 130 66" fill="none" stroke={purple} strokeWidth="6" strokeLinecap="round" />
      <circle cx="100" cy="36" r="9" fill={fg} />
      <g clipPath={`url(#c${id})`} fill={stripes}>
        <rect x="40" y="132" width="120" height="13" />
        <rect x="40" y="152" width="120" height="10" />
        <rect x="40" y="169" width="120" height="7" />
        <rect x="40" y="181" width="120" height="4" />
      </g>
      <path d="M100 46 L152 184 H48 Z" fill="none" stroke={fg} strokeWidth="7" strokeLinejoin="round" />
      <path
        d="M81 96 H119 M71 122 H129 M100 46 L81 96 L119 96 L71 122"
        fill="none"
        stroke={fg}
        strokeWidth="4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** ANTENA ROCK em linha, para topo do site, rodapé e painel */
export function BrandWordmark({ size = 'md', className = '' }: { size?: 'sm' | 'md'; className?: string }) {
  const small = size === 'sm';
  return (
    <span className={`inline-flex items-center gap-2 leading-none ${className}`}>
      <span className={`font-brand font-extrabold text-[#F4EDE0] ${small ? 'text-[10px] tracking-[0.3em]' : 'text-xs sm:text-sm tracking-[0.32em]'}`}>
        ANTENA
      </span>
      <span className={`font-neon text-[#E11D2E] ${small ? 'text-xl' : 'text-2xl sm:text-3xl'}`}>ROCK</span>
    </span>
  );
}
