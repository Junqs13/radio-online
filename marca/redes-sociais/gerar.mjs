// Kit de redes sociais da Antena Rock.
// Gera todas as peças em PNG nas medidas de cada rede, com as fontes e o símbolo do site.
// Uso: node marca/redes-sociais/gerar.mjs [pasta-de-saida]
// Precisa do frontend instalado (npm ci em frontend/) por causa das fontes e dos ícones.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const FRONT = resolve(AQUI, '../../frontend');
const req = createRequire(join(FRONT, 'package.json'));
const { chromium } = createRequire(import.meta.url)('playwright');
const SAIDA = resolve(process.argv[2] || join(AQUI, 'saida'));
const TMP = join(SAIDA, '.html');
mkdirSync(TMP, { recursive: true });

// ---------- Marca ----------
const C = { palco: '#0B0A10', valvula: '#F4EDE0', sinal: '#E11D2E', neon: '#7C3AED' };
const fonte = (pkg, file) => pathToFileURL(join(FRONT, 'node_modules/@fontsource', pkg, 'files', file)).href;
const FONTES = `
@font-face{font-family:Orbitron;font-weight:800;src:url(${fonte('orbitron', 'orbitron-latin-800-normal.woff2')})}
@font-face{font-family:Orbitron;font-weight:600;src:url(${fonte('orbitron', 'orbitron-latin-600-normal.woff2')})}
@font-face{font-family:Monoton;src:url(${fonte('monoton', 'monoton-latin-400-normal.woff2')})}
@font-face{font-family:SG;font-weight:400;src:url(${fonte('space-grotesk', 'space-grotesk-latin-400-normal.woff2')})}
@font-face{font-family:SG;font-weight:500;src:url(${fonte('space-grotesk', 'space-grotesk-latin-500-normal.woff2')})}
@font-face{font-family:SG;font-weight:600;src:url(${fonte('space-grotesk', 'space-grotesk-latin-600-normal.woff2')})}
@font-face{font-family:SG;font-weight:700;src:url(${fonte('space-grotesk', 'space-grotesk-latin-700-normal.woff2')})}`;

let gid = 0;
/** Símbolo (torre). tone: color | white | black */
function marca(size, tone = 'color') {
  const id = `m${gid++}`;
  const fg = tone === 'black' ? C.palco : tone === 'white' ? '#FFFFFF' : C.valvula;
  const red = tone === 'color' ? C.sinal : fg;
  const purple = tone === 'color' ? C.neon : fg;
  const stripes = tone === 'color' ? `url(#g${id})` : fg;
  return `<svg width="${size}" height="${size}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
<defs><linearGradient id="g${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.sinal}"/><stop offset="1" stop-color="${C.neon}"/></linearGradient>
<clipPath id="c${id}"><path d="M100 46 L152 184 H48 Z"/></clipPath></defs>
<path d="M84 20 A22 22 0 0 0 84 52 M116 20 A22 22 0 0 1 116 52" fill="none" stroke="${red}" stroke-width="6" stroke-linecap="round"/>
<path d="M70 6 A40 40 0 0 0 70 66 M130 6 A40 40 0 0 1 130 66" fill="none" stroke="${purple}" stroke-width="6" stroke-linecap="round"/>
<circle cx="100" cy="36" r="9" fill="${fg}"/>
<g clip-path="url(#c${id})" fill="${stripes}"><rect x="40" y="132" width="120" height="13"/><rect x="40" y="152" width="120" height="10"/><rect x="40" y="169" width="120" height="7"/><rect x="40" y="181" width="120" height="4"/></g>
<path d="M100 46 L152 184 H48 Z" fill="none" stroke="${fg}" stroke-width="7" stroke-linejoin="round"/>
<path d="M81 96 H119 M71 122 H129 M100 46 L81 96 L119 96 L71 122" fill="none" stroke="${fg}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}

/** ANTENA (Orbitron) sobre ROCK (Monoton). h = altura de ROCK em px */
const nome = (h, { cor = C.sinal, topo = C.valvula, alinhar = 'left' } = {}) => `
<div style="display:flex;flex-direction:column;align-items:${alinhar === 'center' ? 'center' : 'flex-start'};line-height:1">
  <div style="font:800 ${h * 0.3}px Orbitron;letter-spacing:${h * 0.3 * 0.62}px;color:${topo};margin-right:-${h * 0.3 * 0.62}px;margin-bottom:${h * 0.1}px">ANTENA</div>
  <div style="font:${h * 1.22}px Monoton;color:${cor};margin-left:-${h * 0.04}px">ROCK</div>
</div>`;

/** Nome em linha, para rodapés */
const nomeLinha = (h) => `<span style="display:inline-flex;align-items:center;gap:${h * 0.35}px;line-height:1">
<span style="font:800 ${h * 0.5}px Orbitron;letter-spacing:${h * 0.16}px;color:${C.valvula}">ANTENA</span>
<span style="font:${h}px Monoton;color:${C.sinal}">ROCK</span></span>`;

/** As três faixas retrô (vermelho para roxo) */
const faixas = (esp = 1, estilo = '') => `<div style="position:absolute;left:0;right:0;${estilo}">
${[[10, 1], [6, 0.6], [3, 0.35]].map(([h, o], i) => `<div style="height:${h * esp}px;margin-top:${i ? 12 * esp : 0}px;opacity:${o};background:linear-gradient(90deg,${C.sinal},${C.neon})"></div>`).join('')}</div>`;

/** Ondas de rádio bem apagadas, saindo de um ponto */
const ondas = (x, y, r0, passo, n, op = 0.07) => `<svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none" xmlns="http://www.w3.org/2000/svg">
${Array.from({ length: n }, (_, i) => `<circle cx="${x}" cy="${y}" r="${r0 + i * passo}" fill="none" stroke="${C.valvula}" stroke-width="2" opacity="${(op * (1 - i / n)).toFixed(3)}"/>`).join('')}</svg>`;

const fundo = (glow = 1) => `background:
radial-gradient(65% 55% at 0% 0%, rgba(225,29,46,${0.3 * glow}), transparent 70%),
radial-gradient(65% 55% at 100% 100%, rgba(124,58,237,${0.3 * glow}), transparent 70%),
${C.palco};`;

const rotulo = (txt, px, cor = C.sinal) => `<div style="display:inline-flex;align-items:center;gap:${px * 0.6}px;font:700 ${px}px SG;letter-spacing:${px * 0.3}px;text-transform:uppercase;color:${cor}">${txt}</div>`;
const ponto = (px) => `<span style="width:${px}px;height:${px}px;border-radius:50%;background:${C.sinal};box-shadow:0 0 ${px * 1.5}px ${C.sinal}"></span>`;

// Ícones do mesmo pacote do site (Lucide, licença ISC)
async function icone(nomeIcone, size, cor = C.valvula, traco = 1.6) {
  const mod = await import(pathToFileURL(req.resolve(`lucide-react/dist/esm/icons/${nomeIcone}.mjs`)).href);
  const nodes = mod.__iconData.node.map(([tag, a]) => `<${tag} ${Object.entries(a).filter(([k]) => k !== 'key').map(([k, v]) => `${k}="${v}"`).join(' ')}/>`).join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${cor}" stroke-width="${traco}" stroke-linecap="round" stroke-linejoin="round">${nodes}</svg>`;
}

const pagina = (w, h, corpo, bg = fundo()) => `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}html,body{width:${w}px;height:${h}px;overflow:hidden}
body{position:relative;${bg}color:${C.valvula};font-family:SG}</style></head><body>${corpo}</body></html>`;

// ---------- Conteúdo real (da API da rádio) ----------
const CURIOSIDADE = {
  texto: 'Rick Allen, baterista do Def Leppard, perdeu o braço esquerdo num acidente de carro no último dia de 1984. Voltou a tocar com uma bateria eletrônica adaptada, usando os pés para o que o braço fazia.',
  tag: '#DefLeppard',
};
const GRADE_SEXTA = [
  ['07:00', 'Clássicos Internacionais', 'Classic Rock', '#ea580c'],
  ['09:00', 'Antena Rock Mix', 'Rock', '#dc2626'],
  ['11:00', 'Especial Elvis Presley', 'Rock and Roll', '#be123c'],
  ['12:00', 'Rock Nacional', 'Rock Brasileiro', '#16a34a'],
  ['13:00', 'Rock Anos 70', 'Rock / Anos 70', '#ca8a04'],
  ['15:00', 'Pesado', 'Heavy Metal', '#64748b'],
  ['17:00', 'Alternativo', 'Rock Alternativo', '#0891b2'],
  ['19:00', 'Arena Rock', 'Hard Rock', '#db2777'],
  ['21:00', 'Antena Rock Mix', 'Rock', '#dc2626'],
  ['23:00', 'Especial Ramones', 'Especial', '#15803d'],
  ['23:30', 'Madrugada Antena Rock', 'Rock', '#7c3aed'],
];
const NO_AR = { titulo: 'Arena Rock', estilo: 'Hard Rock', horario: '19h às 21h', cor: '#db2777' };

// ---------- Peças ----------
const P = []; // [arquivo, largura, altura, html, fundoTransparente?]
const add = (arq, w, h, corpo, bg, transp) => P.push([arq, w, h, pagina(w, h, corpo, bg), transp]);

// 1. Perfil
add('1-perfil/perfil-escuro.png', 1080, 1080, `${ondas(540, 540, 330, 60, 6, 0.06)}
<div style="position:absolute;inset:0;display:grid;place-items:center"><div style="margin-top:-20px">${marca(620)}</div></div>`,
  `background:radial-gradient(60% 60% at 30% 20%, rgba(225,29,46,.35), transparent 70%),radial-gradient(60% 60% at 75% 85%, rgba(124,58,237,.35), transparent 70%),${C.palco};`);
add('1-perfil/perfil-vermelho.png', 1080, 1080, `${ondas(540, 540, 330, 60, 6, 0.12)}
<div style="position:absolute;inset:0;display:grid;place-items:center"><div style="margin-top:-20px">${marca(620, 'white')}</div></div>`,
  `background:radial-gradient(80% 80% at 30% 20%, #F0384A, #B5101F 70%);`);

// 2. Capas
const blocoMarca = (sm, sn, gap) => `<div style="display:flex;align-items:center;gap:${gap}px">${marca(sm)}<div>${nome(sn)}
<div style="font:600 ${sn * 0.2}px SG;letter-spacing:${sn * 0.2 * 0.42}px;color:#cfc8d8;margin-top:${sn * 0.22}px">O ROCK NÃO SAI DO AR</div></div></div>`;

add('2-capas/facebook-capa-1640x624.png', 1640, 624, `${ondas(560, 300, 160, 70, 8)}
<div style="position:absolute;left:0;right:0;top:0;height:520px;display:grid;place-items:center">${blocoMarca(280, 150, 64)}</div>
${faixas(1.2, 'bottom:44px')}`);

add('2-capas/youtube-banner-2560x1440.png', 2560, 1440, `${ondas(1010, 700, 220, 90, 12)}
<div style="position:absolute;left:507px;top:509px;width:1546px;height:423px;display:flex;align-items:center;justify-content:center">${blocoMarca(250, 112, 56)}</div>
${faixas(1.6, 'bottom:330px')}
<div style="position:absolute;left:0;right:0;bottom:240px;text-align:center;font:500 34px SG;letter-spacing:6px;color:#a8a1b3">ROCK NACIONAL E INTERNACIONAL 24 HORAS · ANTENAROCK.COM.BR</div>`);

add('2-capas/x-cabecalho-1500x500.png', 1500, 500, `${ondas(1140, 240, 120, 60, 8)}
<div style="position:absolute;right:110px;top:0;height:430px;display:flex;align-items:center">${blocoMarca(220, 116, 48)}</div>
${faixas(1, 'bottom:36px')}`);

// 3. Destaques do Instagram (o app corta um círculo no centro; o nome vai escrito no app)
const DESTAQUES = [
  ['ao-vivo', 'radio'], ['pedidos', 'music-2'], ['grade', 'calendar-days'],
  ['materias', 'newspaper'], ['lendas', 'guitar'], ['curiosidades', 'lightbulb'],
];
const fundoDestaque = `background:radial-gradient(40% 25% at 50% 50%, rgba(225,29,46,.28), transparent 75%),radial-gradient(60% 35% at 50% 50%, rgba(124,58,237,.18), transparent 80%),${C.palco};`;
const anel = `<div style="position:absolute;left:50%;top:50%;width:620px;height:620px;margin:-310px 0 0 -310px;border-radius:50%;padding:8px;background:linear-gradient(135deg,${C.sinal},${C.neon});-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 8px),#000 calc(100% - 7px))"></div>`;
for (const [arq, ic] of DESTAQUES) {
  add(`3-destaques-instagram/destaque-${arq}.png`, 1080, 1920, `${anel}<div style="position:absolute;inset:0;display:grid;place-items:center">${await icone(ic, 300, C.valvula, 1.5)}</div>`, fundoDestaque);
}
add('3-destaques-instagram/destaque-antena-rock.png', 1080, 1920, `${anel}<div style="position:absolute;inset:0;display:grid;place-items:center"><div style="margin-top:-10px">${marca(380)}</div></div>`, fundoDestaque);

// 4. Posts do feed (1080x1350)
const rodapePost = `<div style="position:absolute;left:84px;right:84px;bottom:92px;display:flex;align-items:center;justify-content:space-between">
<div style="display:flex;align-items:center;gap:20px">${marca(76)}${nomeLinha(44)}</div>
<div style="font:500 28px SG;color:#a8a1b3">antenarock.com.br</div></div>${faixas(0.8, 'bottom:0;height:40px')}`;
const cabecalhoCuriosidade = async () => `<div style="position:absolute;left:84px;top:96px">${rotulo(`${await icone('lightbulb', 40, C.sinal, 2)} Curiosidade do dia`, 30)}</div>`;

add('4-posts/curiosidade-do-dia.png', 1080, 1350, `${ondas(980, 160, 120, 70, 6, 0.06)}${await cabecalhoCuriosidade()}
<div style="position:absolute;left:84px;right:84px;top:210px;bottom:250px;display:flex;flex-direction:column;justify-content:center">
<div style="font:600 58px/1.32 SG;color:${C.valvula};letter-spacing:-0.5px">${CURIOSIDADE.texto}</div>
<div style="font:600 36px SG;color:${C.sinal};margin-top:44px">${CURIOSIDADE.tag}</div></div>${rodapePost}`);
add('4-posts/curiosidade-do-dia-FUNDO.png', 1080, 1350, `${ondas(980, 160, 120, 70, 6, 0.06)}${await cabecalhoCuriosidade()}${rodapePost}`);

const tituloGrade = (dia) => `<div style="position:absolute;left:84px;top:92px">${rotulo(`${await_cal} Programação`, 28)}
<div style="font:800 72px Orbitron;letter-spacing:2px;margin-top:22px;color:${C.valvula}">${dia}</div></div>`;
const await_cal = await icone('calendar-days', 36, C.sinal, 2);
const linhasGrade = GRADE_SEXTA.map(([h, t, e, cor]) => `<div style="display:flex;align-items:center;gap:30px;height:74px;border-bottom:1px solid rgba(255,255,255,.08)">
<div style="font:700 34px SG;color:${C.valvula};width:110px;font-variant-numeric:tabular-nums">${h}</div>
<div style="width:10px;height:40px;border-radius:5px;background:${cor}"></div>
<div style="flex:1;font:600 36px SG;color:${C.valvula};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t}</div>
<div style="font:500 24px SG;color:#a8a1b3;white-space:nowrap">${e}</div></div>`).join('');
add('4-posts/grade-do-dia.png', 1080, 1350, `${tituloGrade('SEXTA')}
<div style="position:absolute;left:84px;right:84px;top:300px">${linhasGrade}</div>${rodapePost}`);
add('4-posts/grade-do-dia-FUNDO.png', 1080, 1350, `${rotuloSo()}${rodapePost}`);
function rotuloSo() { return `<div style="position:absolute;left:84px;top:92px">${rotulo(`${await_cal} Programação`, 28)}</div>`; }

// 5. Stories (1080x1920). Texto fora dos 250 px de cima e de baixo, que o Instagram cobre.
const topoStory = `<div style="position:absolute;left:0;right:0;top:250px;display:flex;justify-content:center">${nomeLinha(52)}</div>`;
const pilula = (txt) => `<div style="display:inline-flex;align-items:center;gap:18px;padding:30px 54px;border-radius:999px;background:linear-gradient(180deg,#e8394a,#a3101f);box-shadow:0 0 60px rgba(225,29,46,.45), inset 0 1px 0 rgba(255,255,255,.35);font:700 38px SG;letter-spacing:4px;color:#fff">${txt}</div>`;
const espacoLink = `<div style="position:absolute;left:0;right:0;bottom:330px;text-align:center;font:500 30px SG;color:#8f889c">antenarock.com.br</div>`;

const noAr = (p) => `${ondas(540, 860, 200, 90, 10, 0.07)}${topoStory}
<div style="position:absolute;left:96px;right:96px;top:560px">
<div style="display:flex;align-items:center;gap:20px">${ponto(22)}${rotulo('No ar agora', 36)}</div>
${p ? `<div style="font:700 150px/1.02 SG;letter-spacing:-3px;margin-top:40px">${p.titulo}</div>
<div style="display:flex;align-items:center;gap:22px;margin-top:44px"><div style="width:14px;height:56px;border-radius:7px;background:${p.cor}"></div>
<div style="font:500 46px SG;color:#d9d2e3">${p.estilo} · ${p.horario}</div></div>` : ''}</div>
<div style="position:absolute;left:0;right:0;bottom:470px;text-align:center">${pilula(`${'&#9654;'} OUÇA AO VIVO`)}</div>${espacoLink}
${faixas(1.2, 'bottom:120px')}`;
add('5-stories/no-ar-agora.png', 1080, 1920, noAr(NO_AR));
add('5-stories/no-ar-agora-FUNDO.png', 1080, 1920, noAr(null));

add('5-stories/peca-sua-musica.png', 1080, 1920, `${ondas(540, 860, 200, 90, 10, 0.07)}${topoStory}
<div style="position:absolute;left:96px;right:96px;top:500px">
<div style="width:150px;height:150px;border-radius:40px;background:rgba(225,29,46,.18);border:2px solid rgba(225,29,46,.45);display:grid;place-items:center">${await icone('music-2', 84, C.sinal, 2)}</div>
<div style="font:700 140px/1.02 SG;letter-spacing:-3px;margin-top:56px">Peça sua música</div>
<div style="font:500 48px/1.35 SG;color:#d9d2e3;margin-top:44px">Escolha uma música do nosso acervo no site. Ela entra na fila e toca na rádio.</div></div>
<div style="position:absolute;left:0;right:0;bottom:470px;text-align:center">${pilula('FAZER PEDIDO')}</div>${espacoLink}
${faixas(1.2, 'bottom:120px')}`);

add('5-stories/ouca-ao-vivo.png', 1080, 1920, `${ondas(540, 820, 260, 90, 10, 0.08)}
<div style="position:absolute;left:0;right:0;top:320px;display:flex;flex-direction:column;align-items:center">
${marca(400)}<div style="margin-top:60px">${nome(170, { alinhar: 'center' })}</div>
<div style="font:600 40px SG;letter-spacing:16px;color:#cfc8d8;margin-top:56px;margin-right:-16px">O ROCK NÃO SAI DO AR</div></div>
<div style="position:absolute;left:0;right:0;bottom:470px;text-align:center">${pilula('&#9654; OUÇA AO VIVO')}</div>${espacoLink}
${faixas(1.2, 'bottom:120px')}`);

// 6. Logos (fundo transparente)
const transp = 'background:transparent;';
add('6-logos/simbolo-cor.png', 2000, 2000, `<div style="position:absolute;inset:0;display:grid;place-items:center">${marca(1900)}</div>`, transp, true);
add('6-logos/simbolo-branco.png', 2000, 2000, `<div style="position:absolute;inset:0;display:grid;place-items:center">${marca(1900, 'white')}</div>`, transp, true);
add('6-logos/simbolo-preto.png', 2000, 2000, `<div style="position:absolute;inset:0;display:grid;place-items:center">${marca(1900, 'black')}</div>`, transp, true);
add('6-logos/logo-horizontal.png', 2400, 900, `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">${blocoMarca(560, 290, 120)}</div>`, transp, true);
add('6-logos/logo-empilhado.png', 1600, 2000, `<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:90px">${marca(820)}${nome(330, { alinhar: 'center' })}</div>`, transp, true);

// 7. Guia rápido da marca
const amostra = (cor, nomeCor, uso, borda) => `<div><div style="height:180px;border-radius:24px;background:${cor};${borda ? 'border:2px solid rgba(255,255,255,.18)' : ''}"></div>
<div style="font:700 30px SG;margin-top:20px">${nomeCor}</div><div style="font:500 24px SG;color:#a8a1b3;margin-top:6px">${cor} · ${uso}</div></div>`;
add('7-guia-de-marca.png', 1920, 1080, `<div style="position:absolute;inset:80px 100px;display:grid;grid-template-columns:1fr 1.15fr;gap:90px">
<div style="display:flex;flex-direction:column;justify-content:space-between">
<div>${rotulo('Guia rápido da marca', 26)}<div style="margin-top:40px;display:flex;align-items:center;gap:44px">${marca(260)}${nome(130)}</div>
<div style="font:500 28px/1.5 SG;color:#cfc8d8;margin-top:44px;max-width:640px">Símbolo sempre sobre fundo escuro ou sobre o vermelho Sinal. Em foto, use a versão branca. Deixe em volta um respiro de pelo menos metade da largura do símbolo.</div></div>
<div style="display:flex;gap:40px;align-items:center">
<div style="width:150px;height:150px;border-radius:50%;background:${C.palco};border:2px solid rgba(255,255,255,.15);display:grid;place-items:center">${marca(110)}</div>
<div style="width:150px;height:150px;border-radius:50%;background:${C.sinal};display:grid;place-items:center">${marca(110, 'white')}</div>
<div style="width:150px;height:150px;border-radius:50%;background:${C.valvula};display:grid;place-items:center">${marca(110, 'black')}</div></div></div>
<div style="display:flex;flex-direction:column;gap:56px">
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px">
${amostra(C.palco, 'Palco', 'fundo', true)}${amostra(C.valvula, 'Válvula', 'texto e símbolo')}${amostra(C.sinal, 'Sinal', 'destaque')}${amostra(C.neon, 'Neon', 'apoio')}</div>
<div style="display:flex;flex-direction:column;gap:30px">
<div style="display:flex;align-items:baseline;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.1);padding-bottom:24px"><span style="font:800 54px Orbitron;letter-spacing:12px">ANTENA</span><span style="font:500 24px SG;color:#a8a1b3">Orbitron 800 · nome e títulos curtos</span></div>
<div style="display:flex;align-items:baseline;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.1);padding-bottom:24px"><span style="font:70px Monoton;color:${C.sinal}">ROCK</span><span style="font:500 24px SG;color:#a8a1b3">Monoton · só na palavra ROCK</span></div>
<div style="display:flex;align-items:baseline;justify-content:space-between"><span style="font:600 50px SG">Space Grotesk</span><span style="font:500 24px SG;color:#a8a1b3">textos, posts e legendas</span></div></div>
<div style="position:relative;height:60px">${faixas(1.4, 'top:0')}</div></div></div>`);

// Símbolo em SVG, para gráfica e outros programas
mkdirSync(join(SAIDA, '6-logos'), { recursive: true });
for (const t of ['color', 'white', 'black']) writeFileSync(join(SAIDA, '6-logos', `simbolo-${{ color: 'cor', white: 'branco', black: 'preto' }[t]}.svg`), marca(1000, t));

// 8. Lançamento: três posts que formam uma linha no perfil (as faixas de baixo continuam de um para o outro)
const faixasTrio = (i) => `<div style="position:absolute;left:0;right:0;bottom:0;height:40px">
${[[10, 1], [6, 0.6], [3, 0.35]].map(([h, o], k) => `<div style="height:${h * 0.8}px;margin-top:${k ? 10 : 0}px;opacity:${o};background:linear-gradient(90deg,${C.sinal},${C.neon});background-size:3240px 100%;background-position:-${i * 1080}px 0"></div>`).join('')}</div>`;
const rodapeTrio = (i) => `<div style="position:absolute;left:84px;right:84px;bottom:92px;display:flex;align-items:center;justify-content:space-between">
<div style="display:flex;align-items:center;gap:20px">${marca(76)}${nomeLinha(44)}</div>
<div style="font:500 28px SG;color:#a8a1b3">antenarock.com.br</div></div>${faixasTrio(i)}`;
const fundoTrio = (i) => `background:radial-gradient(70% 50% at ${[0, 50, 100][i]}% ${[0, 0, 100][i]}%, rgba(${i === 2 ? '124,58,237' : '225,29,46'},.30), transparent 70%),radial-gradient(60% 45% at ${[100, 50, 0][i]}% 100%, rgba(${i === 2 ? '225,29,46' : '124,58,237'},.22), transparent 70%),${C.palco};`;
const chip = (t, px = 30) => `<span style="display:inline-block;padding:${px * 0.55}px ${px * 0.9}px;border-radius:999px;border:1.5px solid rgba(255,255,255,.2);background:linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.03));font:600 ${px}px SG;color:${C.valvula};margin:0 12px 14px 0">${t}</span>`;

add('8-lancamento/1-chegou.png', 1080, 1350, `${ondas(540, 470, 190, 70, 9, 0.07)}
<div style="position:absolute;left:0;right:0;top:110px;display:flex;justify-content:center"><div style="display:flex;align-items:center;gap:18px">${ponto(20)}${rotulo('Estamos no ar', 32)}</div></div>
<div style="position:absolute;left:0;right:0;top:200px;display:flex;flex-direction:column;align-items:center">
${marca(290)}<div style="margin-top:40px">${nome(140, { alinhar: 'center' })}</div>
<div style="font:600 44px/1.35 SG;text-align:center;margin-top:50px;color:${C.valvula}">Rádio online de rock,<br>24 horas por dia.</div>
<div style="font:500 32px SG;color:#a8a1b3;margin-top:20px">De Sorocaba para o mundo.</div></div>
<div style="position:absolute;left:0;right:0;bottom:84px;text-align:center;font:600 34px SG;letter-spacing:2px;color:${C.valvula}">antenarock.com.br</div>${faixasTrio(0)}`, fundoTrio(0));

add('8-lancamento/2-o-que-toca.png', 1080, 1350, `${ondas(980, 200, 120, 70, 7, 0.06)}
<div style="position:absolute;left:84px;right:84px;top:110px;bottom:250px;display:flex;flex-direction:column">
<div>
${rotulo('O que toca', 32)}
<div style="font:700 100px/1.02 SG;letter-spacing:-2px;margin-top:40px">Do rock dos anos 50 ao de hoje.</div>
<div style="font:500 42px/1.35 SG;color:#d9d2e3;margin-top:40px">Tem Raul e Legião, tem Iron Maiden e Elvis. Nacional e internacional, sem parar.</div></div>
<div style="margin-top:auto">${['Classic Rock', 'Rock Nacional', 'Anos 70', 'Heavy Metal', 'Hard Rock', 'Alternativo', 'Rock and Roll'].map((t) => chip(t, 34)).join('')}</div></div>
${rodapeTrio(1)}`, fundoTrio(1));

add('8-lancamento/3-peca-sua-musica.png', 1080, 1350, `${ondas(100, 200, 120, 70, 7, 0.06)}
<div style="position:absolute;left:84px;right:84px;top:110px;bottom:250px;display:flex;flex-direction:column">
<div>
${rotulo('Pedidos abertos', 32)}
<div style="font:700 100px/1.02 SG;letter-spacing:-2px;margin-top:40px">A próxima quem escolhe é você.</div></div>
<div style="margin-top:auto;border-radius:40px;border:1.5px solid rgba(255,255,255,.12);background:linear-gradient(160deg,rgba(255,255,255,.06),rgba(255,255,255,.01));padding:44px">
<div style="display:flex;align-items:center;gap:20px"><div style="width:72px;height:72px;border-radius:20px;background:rgba(225,29,46,.18);border:1.5px solid rgba(225,29,46,.45);display:grid;place-items:center">${await icone('music-2', 40, C.sinal, 2)}</div>
<div style="font:700 40px SG">Peça sua música</div></div>
<div style="margin-top:30px;height:84px;border-radius:22px;border:1.5px solid rgba(255,255,255,.12);background:rgba(0,0,0,.35);display:flex;align-items:center;gap:18px;padding:0 28px;font:500 30px SG;color:#8f889c">${await icone('search', 32, '#8f889c', 2)} Música ou artista</div>
<div style="margin-top:28px">${['Algo pesado', 'Um clássico nacional', 'Me surpreenda'].map((t) => chip(t, 26)).join('')}</div>
<div style="margin-top:14px;height:88px;border-radius:24px;background:linear-gradient(180deg,#e8394a,#a3101f);box-shadow:0 0 50px rgba(225,29,46,.4);display:grid;place-items:center;font:700 30px SG;letter-spacing:4px;color:#fff">ENVIAR PEDIDO</div></div>
<div style="font:500 34px/1.35 SG;color:#d9d2e3;margin-top:36px">Escolha no site. Ela entra na fila e toca na rádio.</div></div>
${rodapeTrio(2)}`, fundoTrio(2));

// ---------- Render ----------
const nav = await chromium.launch();
const pg = await nav.newPage();
for (const [arq, w, h, html, transparente] of P) {
  if (process.env.SO && !arq.startsWith(process.env.SO)) continue; // SO=8-lancamento gera só essa pasta
  const f = join(TMP, arq.replace(/\//g, '__') + '.html');
  writeFileSync(f, html);
  await pg.setViewportSize({ width: w, height: h });
  await pg.goto(pathToFileURL(f).href);
  await pg.evaluate(() => document.fonts.ready);
  const out = join(SAIDA, arq);
  mkdirSync(dirname(out), { recursive: true });
  await pg.screenshot({ path: out, omitBackground: !!transparente });
  console.log('ok', arq, `${w}x${h}`);
}
await nav.close();
import('node:fs').then((fs) => fs.rmSync(TMP, { recursive: true, force: true }));
