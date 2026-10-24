// Peças da marca Antena Rock reaproveitadas por todos os geradores (ícones, figurinhas, stories, adesivo)
import { writeFileSync } from 'fs';
import { chromium } from '/tmp/claude-0/-home-claude/3d89a1b3-0db1-507b-86a8-9a6bc4d197b7/scratchpad/fe/pw/node_modules/playwright/index.mjs';

const FS = '/home/claude/radio-online/frontend/node_modules/@fontsource';
export const fonts = `
@font-face{font-family:'Orbitron';font-weight:500;src:url('file://${FS}/orbitron/files/orbitron-latin-500-normal.woff2') format('woff2')}
@font-face{font-family:'Orbitron';font-weight:800;src:url('file://${FS}/orbitron/files/orbitron-latin-800-normal.woff2') format('woff2')}
@font-face{font-family:'Monoton';font-weight:400;src:url('file://${FS}/monoton/files/monoton-latin-400-normal.woff2') format('woff2')}
@font-face{font-family:'Space Grotesk';font-weight:400;src:url('file://${FS}/space-grotesk/files/space-grotesk-latin-400-normal.woff2') format('woff2')}
@font-face{font-family:'Space Grotesk';font-weight:600;src:url('file://${FS}/space-grotesk/files/space-grotesk-latin-600-normal.woff2') format('woff2')}
@font-face{font-family:'Space Grotesk';font-weight:700;src:url('file://${FS}/space-grotesk/files/space-grotesk-latin-700-normal.woff2') format('woff2')}
`;

export const C = { palco: '#0B0A10', valvula: '#F4EDE0', sinal: '#E11D2E', neon: '#7C3AED', sinalClaro: '#C8102E' };

let n = 0;
/** Símbolo em SVG. tone: color | white | black. simple: versão para tamanhos pequenos. fg: cor das linhas na versão color. */
export function mark(size, { tone = 'color', simple = false, fg } = {}) {
  const id = `m${n++}`;
  const F = fg ?? (tone === 'black' ? '#0B0A10' : tone === 'white' ? '#FFFFFF' : C.valvula);
  const R = tone === 'color' ? C.sinal : F;
  const P = tone === 'color' ? C.neon : F;
  const ST = tone === 'color' ? `url(#g${id})` : F;
  const defs = `<defs><linearGradient id="g${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.sinal}"/><stop offset="1" stop-color="${C.neon}"/></linearGradient><clipPath id="c${id}"><path d="M100 46 L152 184 H48 Z"/></clipPath></defs>`;
  if (simple) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 200 200">${defs}
<path d="M84 20 A22 22 0 0 0 84 52 M116 20 A22 22 0 0 1 116 52" fill="none" stroke="${R}" stroke-width="10" stroke-linecap="round"/>
<circle cx="100" cy="36" r="12" fill="${F}"/>
<path d="M100 52 L150 184 H50 Z" fill="none" stroke="${F}" stroke-width="13" stroke-linejoin="round"/>
<path d="M68 138 H132 M60 162 H140" stroke="${ST}" stroke-width="11" stroke-linecap="round"/></svg>`;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 200 200">${defs}
<path d="M84 20 A22 22 0 0 0 84 52 M116 20 A22 22 0 0 1 116 52" fill="none" stroke="${R}" stroke-width="6" stroke-linecap="round"/>
<path d="M70 6 A40 40 0 0 0 70 66 M130 6 A40 40 0 0 1 130 66" fill="none" stroke="${P}" stroke-width="6" stroke-linecap="round"/>
<circle cx="100" cy="36" r="9" fill="${F}"/>
<g clip-path="url(#c${id})" fill="${ST}"><rect x="40" y="132" width="120" height="13"/><rect x="40" y="152" width="120" height="10"/><rect x="40" y="169" width="120" height="7"/><rect x="40" y="181" width="120" height="4"/></g>
<path d="M100 46 L152 184 H48 Z" fill="none" stroke="${F}" stroke-width="7" stroke-linejoin="round"/>
<path d="M81 96 H119 M71 122 H129 M100 46 L81 96 L119 96 L71 122" fill="none" stroke="${F}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}

export async function browser() {
  return chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
}

/** Renderiza um HTML no tamanho exato e salva PNG (fundo transparente quando o HTML não pinta fundo) */
export async function shot(b, html, w, h, out, { transparent = false } = {}) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  // Abre de um arquivo (file://) para as fontes locais carregarem
  const tmp = `/tmp/claude-0/-home-claude/3d89a1b3-0db1-507b-86a8-9a6bc4d197b7/scratchpad/brand/_render-${process.pid}.html`;
  writeFileSync(tmp, `<!doctype html><html><head><meta charset="utf-8"><style>${fonts} html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden;${transparent ? 'background:transparent' : ''}} *{box-sizing:border-box}</style></head><body>${html}</body></html>`);
  await p.goto('file://' + tmp);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(150);
  await p.screenshot({ path: out, omitBackground: transparent });
  await p.close();
}
