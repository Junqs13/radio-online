/**
 * Abertura da primeira visita: o ponto da antena acende, as duas ondas saem em seguida
 * e a tela some em menos de um segundo. Tudo em CSS (globals.css, bloco .intro), então
 * aparece já no primeiro desenho da página, antes do JavaScript.
 * Um script no <head> (layout.tsx) marca a visita: na mesma aba ela não se repete,
 * e quem pede menos movimento no sistema não vê a abertura.
 */
export default function IntroSplash() {
  return (
    <div className="intro" aria-hidden>
      <svg width="132" height="132" viewBox="0 0 200 200">
        <defs>
          <linearGradient id="intro-g" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#E11D2E" />
            <stop offset="1" stopColor="#7C3AED" />
          </linearGradient>
          <clipPath id="intro-c">
            <path d="M100 46 L152 184 H48 Z" />
          </clipPath>
        </defs>
        <path className="i-w1" style={{ color: '#E11D2E' }} d="M84 20 A22 22 0 0 0 84 52 M116 20 A22 22 0 0 1 116 52" fill="none" stroke="#E11D2E" strokeWidth="6" strokeLinecap="round" />
        <path className="i-w2" style={{ color: '#7C3AED' }} d="M70 6 A40 40 0 0 0 70 66 M130 6 A40 40 0 0 1 130 66" fill="none" stroke="#7C3AED" strokeWidth="6" strokeLinecap="round" />
        <circle className="i-dot" cx="100" cy="36" r="9" fill="#F4EDE0" />
        <g className="i-tower">
          <g clipPath="url(#intro-c)" fill="url(#intro-g)">
            <rect x="40" y="132" width="120" height="13" />
            <rect x="40" y="152" width="120" height="10" />
            <rect x="40" y="169" width="120" height="7" />
            <rect x="40" y="181" width="120" height="4" />
          </g>
          <path d="M100 46 L152 184 H48 Z" fill="none" stroke="#F4EDE0" strokeWidth="7" strokeLinejoin="round" />
          <path d="M81 96 H119 M71 122 H129 M100 46 L81 96 L119 96 L71 122" fill="none" stroke="#F4EDE0" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
        </g>
      </svg>
      <span className="i-name inline-flex items-center gap-2 leading-none">
        <span className="font-brand font-extrabold text-[#F4EDE0] text-sm tracking-[0.32em]">ANTENA</span>
        <span className="font-neon text-[#E11D2E] text-3xl">ROCK</span>
      </span>
    </div>
  );
}
