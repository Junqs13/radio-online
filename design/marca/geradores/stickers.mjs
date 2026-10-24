// Figurinhas do WhatsApp: 512 x 512, fundo transparente, contorno branco de adesivo, 16 px de margem
import { mkdirSync } from 'fs';
import { browser, shot, mark, C } from './kit.mjs';

const OUT = '/tmp/claude-0/-home-claude/3d89a1b3-0db1-507b-86a8-9a6bc4d197b7/scratchpad/brand/figurinhas/png';
mkdirSync(OUT, { recursive: true });

// Contorno de adesivo recortado: várias sombras brancas sem desfoque em volta + uma sombra suave
const outline = (w = 7) => {
  const d = [];
  for (let a = 0; a < 360; a += 30) {
    const r = (a * Math.PI) / 180;
    d.push(`drop-shadow(${(Math.cos(r) * w).toFixed(1)}px ${(Math.sin(r) * w).toFixed(1)}px 0 #FFFFFF)`);
  }
  return d.join(' ') + ' drop-shadow(0 6px 8px rgba(0,0,0,.35))';
};
const wrap = (inner, rot = 0) =>
  `<div style="width:760px;height:760px;display:flex;align-items:center;justify-content:center">
     <div style="filter:${outline()};transform:rotate(${rot}deg);display:flex;align-items:center;justify-content:center">${inner}</div></div>`;
const neon = `font-family:Monoton;color:${C.sinal}`;
const orb = `font-family:Orbitron;font-weight:800`;
const sg = `font-family:'Space Grotesk';font-weight:700`;
const eq = (n, h, w = 14) =>
  `<div style="display:flex;align-items:flex-end;gap:7px;height:${h}px">${Array.from({ length: n }, (_, i) => {
    const hh = [0.45, 0.8, 0.6, 1, 0.7, 0.9, 0.5, 0.75, 0.55][i % 9];
    return `<span style="width:${w}px;height:${Math.round(h * hh)}px;border-radius:4px;background:linear-gradient(0deg,${C.sinal},${C.neon})"></span>`;
  }).join('')}</div>`;

const S = [];

// 1. Logo completo
S.push(['01-antena-rock', wrap(`<div style="background:${C.palco};border-radius:44px;padding:28px 40px;display:flex;flex-direction:column;align-items:center;color:${C.valvula}">
  ${mark(170)}<span style="${orb};font-size:30px;letter-spacing:15px;padding-left:15px;margin-top:10px">ANTENA</span>
  <span style="${neon};font-size:104px;line-height:1">ROCK</span></div>`)]);

// 2. AUMENTA!
S.push(['02-aumenta', wrap(`<div style="display:flex;flex-direction:column;align-items:center;gap:10px;background:${C.palco};border-radius:40px;padding:34px 30px 30px">
  <span style="${neon};font-size:70px;line-height:1;white-space:nowrap">AUMENTA!</span>${eq(9, 110, 20)}</div>`, -4)]);

// 3. NO AR (placa de estúdio)
S.push(['03-no-ar', wrap(`<div style="background:${C.sinal};border:10px solid #3B0A10;border-radius:34px;padding:40px 44px;box-shadow:inset 0 0 40px rgba(255,255,255,.28);display:flex;flex-direction:column;align-items:center">
  <span style="${orb};font-size:96px;color:#FFF7F0;letter-spacing:8px;white-space:nowrap;text-shadow:0 0 18px #fff">NO AR</span>
  <span style="${sg};font-size:24px;letter-spacing:8px;color:#FFE4E6;margin-top:6px">ANTENA ROCK</span></div>`, 3)]);

// 4. Botão de volume no 11
const ticks = Array.from({ length: 12 }, (_, i) => {
  const a = ((-225 + i * 24.5) * Math.PI) / 180;
  const x = 160 + Math.cos(a) * 138, y = 160 + Math.sin(a) * 138;
  return `<text x="${x.toFixed(1)}" y="${(y + 9).toFixed(1)}" text-anchor="middle" font-family="Orbitron" font-weight="800" font-size="${i === 11 ? 30 : 20}" fill="${i === 11 ? C.sinal : C.valvula}">${i}</text>`;
}).join('');
const pa = ((-225 + 11 * 24.5) * Math.PI) / 180;
S.push(['04-vai-ate-o-11', wrap(`<div style="background:${C.palco};border-radius:50%;width:400px;height:400px;display:flex;flex-direction:column;align-items:center;justify-content:center">
  <svg width="320" height="320" viewBox="0 0 320 320">${ticks}
   <circle cx="160" cy="160" r="96" fill="#1E1B2A" stroke="${C.neon}" stroke-width="6"/>
   <line x1="160" y1="160" x2="${(160 + Math.cos(pa) * 80).toFixed(1)}" y2="${(160 + Math.sin(pa) * 80).toFixed(1)}" stroke="${C.sinal}" stroke-width="14" stroke-linecap="round"/>
   <circle cx="160" cy="160" r="16" fill="${C.valvula}"/></svg>
  <span style="${orb};font-size:26px;letter-spacing:4px;color:${C.valvula};margin-top:-36px">VAI ATÉ O 11</span></div>`)]);

// 5. Fita cassete
S.push(['05-fita', wrap(`<svg width="430" height="290" viewBox="0 0 430 290">
  <rect x="5" y="5" width="420" height="280" rx="26" fill="#1E1B2A" stroke="${C.palco}" stroke-width="6"/>
  <rect x="34" y="28" width="362" height="150" rx="12" fill="${C.valvula}"/>
  <rect x="34" y="28" width="362" height="34" rx="12" fill="${C.sinal}"/><rect x="34" y="50" width="362" height="12" fill="${C.sinal}"/>
  <rect x="34" y="62" width="362" height="10" fill="${C.neon}"/>
  <text x="215" y="128" text-anchor="middle" font-family="Orbitron" font-weight="800" font-size="30" letter-spacing="8" fill="${C.palco}">ANTENA ROCK</text>
  <text x="215" y="160" text-anchor="middle" font-family="Space Grotesk" font-weight="700" font-size="18" letter-spacing="3" fill="#4A4458">LADO A · 24 HORAS</text>
  <rect x="104" y="196" width="222" height="62" rx="31" fill="${C.palco}"/>
  <circle cx="148" cy="227" r="20" fill="${C.valvula}"/><circle cx="148" cy="227" r="9" fill="${C.palco}"/>
  <circle cx="282" cy="227" r="20" fill="${C.valvula}"/><circle cx="282" cy="227" r="9" fill="${C.palco}"/>
  <path d="M60 285 L82 240 H348 L370 285" fill="#141220"/></svg>`, -6)]);

// 6. Disco de vinil
const grooves = [170, 155, 140, 125, 110].map((r) => `<circle cx="190" cy="190" r="${r}" fill="none" stroke="#2A2635" stroke-width="2"/>`).join('');
S.push(['06-vinil', wrap(`<svg width="380" height="380" viewBox="0 0 380 380">
  <circle cx="190" cy="190" r="186" fill="#0B0A10"/>${grooves}
  <path d="M70 120 A150 150 0 0 1 150 52" fill="none" stroke="#5A5468" stroke-width="6" stroke-linecap="round"/>
  <circle cx="190" cy="190" r="78" fill="url(#lb)"/>
  <defs><linearGradient id="lb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.sinal}"/><stop offset="1" stop-color="${C.neon}"/></linearGradient></defs>
  <g transform="translate(150 132) scale(0.4)">${mark(200, { tone: 'white', simple: true }).replace(/^<svg[^>]*>/, '').replace('</svg>', '')}</g>
  <circle cx="190" cy="190" r="7" fill="${C.valvula}"/></svg>`)]);

// 7. Tô na Antena (fone)
S.push(['07-to-na-antena', wrap(`<div style="display:flex;flex-direction:column;align-items:center;background:${C.palco};border-radius:44px;padding:30px 40px">
  <svg width="220" height="190" viewBox="0 0 220 190"><path d="M30 130 V105 A80 80 0 0 1 190 105 V130" fill="none" stroke="${C.valvula}" stroke-width="16" stroke-linecap="round"/>
  <rect x="12" y="110" width="50" height="76" rx="18" fill="${C.sinal}"/><rect x="158" y="110" width="50" height="76" rx="18" fill="${C.neon}"/></svg>
  <span style="${orb};font-size:46px;color:${C.valvula};letter-spacing:3px;margin-top:6px">TÔ NA</span>
  <span style="${neon};font-size:72px;line-height:1">ANTENA</span></div>`, 3)]);

// 8. O rock não sai do ar (selo)
S.push(['08-o-rock-nao-sai-do-ar', wrap(`<div style="width:420px;height:420px;border-radius:50%;background:${C.palco};border:10px solid ${C.sinal};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px">
  ${mark(120)}<span style="${sg};font-size:40px;line-height:1.05;text-align:center;color:${C.valvula};letter-spacing:2px">O ROCK<br>NÃO SAI<br>DO AR</span></div>`, -5)]);

// 9. Pede aí (balão de fala)
S.push(['09-pede-ai', wrap(`<svg width="430" height="350" viewBox="0 0 430 350">
  <path d="M40 20 H390 A30 30 0 0 1 420 50 V230 A30 30 0 0 1 390 260 H170 L90 330 L104 260 H40 A30 30 0 0 1 10 230 V50 A30 30 0 0 1 40 20 Z" fill="${C.palco}"/>
  <text x="215" y="140" text-anchor="middle" font-family="Monoton" font-size="96" fill="${C.sinal}">PEDE</text>
  <text x="215" y="215" text-anchor="middle" font-family="Orbitron" font-weight="800" font-size="56" letter-spacing="10" fill="${C.valvula}">AÍ</text></svg>`, 4)]);

// 10. Sextou com rock
S.push(['10-sextou', wrap(`<div style="display:flex;flex-direction:column;align-items:center;background:linear-gradient(135deg,${C.sinal},${C.neon});border-radius:40px;padding:34px 36px">
  <span style="${orb};font-size:68px;color:#fff;letter-spacing:4px;line-height:1">SEXTOU</span>
  <span style="${sg};font-size:34px;color:#fff;letter-spacing:10px;margin-top:10px">COM ROCK</span></div>`, -7)]);

// 11. Bom dia, rockeiro
S.push(['11-bom-dia', wrap(`<div style="display:flex;flex-direction:column;align-items:center;background:${C.valvula};border-radius:44px;padding:30px 34px">
  <svg width="170" height="110" viewBox="0 0 170 110"><circle cx="85" cy="100" r="52" fill="${C.sinal}"/>
  ${[-80, -50, -20, 10, 40].map((a) => { const r = (a - 90) * Math.PI / 180; return `<line x1="${85 + Math.cos(r) * 64}" y1="${100 + Math.sin(r) * 64}" x2="${85 + Math.cos(r) * 84}" y2="${100 + Math.sin(r) * 84}" stroke="${C.neon}" stroke-width="9" stroke-linecap="round"/>`; }).join('')}</svg>
  <span style="${orb};font-size:58px;color:${C.palco};letter-spacing:3px;margin-top:4px">BOM DIA,</span>
  <span style="${neon};font-size:66px;line-height:1.05">ROCKEIRO</span></div>`, 2)]);

// 12. Air guitar liberada (raio)
S.push(['12-air-guitar', wrap(`<div style="display:flex;align-items:center;gap:10px;background:${C.palco};border-radius:44px;padding:30px 34px">
  <svg width="120" height="200" viewBox="0 0 120 200"><path d="M76 4 L14 112 H54 L38 196 L108 80 H66 Z" fill="${C.sinal}" stroke="${C.valvula}" stroke-width="6" stroke-linejoin="round"/></svg>
  <div style="display:flex;flex-direction:column"><span style="${orb};font-size:50px;color:${C.valvula};line-height:1.05">AIR<br>GUITAR</span>
  <span style="${sg};font-size:30px;color:${C.sinal};letter-spacing:6px;margin-top:8px">LIBERADA</span></div></div>`, -3)]);

const b = await browser();
for (const [name, html] of S) await shot(b, html, 760, 760, `${OUT}/${name}.png`, { transparent: true });
// Ícone da bandeja do pacote: 96 x 96
await shot(b, `<div style="width:96px;height:96px;display:flex;align-items:center;justify-content:center">${mark(88)}</div>`, 96, 96, `${OUT}/../bandeja-96.png`, { transparent: true });
await b.close();
console.log('ok', S.length);
