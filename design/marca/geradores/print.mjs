// Adesivos para gráfica: PDF vetorial com sangria de 2 mm, página 2 = linha de corte (faca)
import { writeFileSync, readFileSync, mkdirSync } from 'fs';
import { browser, mark, fonts, C } from './kit.mjs';

const OUT = '/tmp/claude-0/-home-claude/3d89a1b3-0db1-507b-86a8-9a6bc4d197b7/scratchpad/brand/adesivos';
mkdirSync(OUT, { recursive: true });
const qr = readFileSync('/tmp/claude-0/-home-claude/3d89a1b3-0db1-507b-86a8-9a6bc4d197b7/scratchpad/brand/qr.svg', 'utf8').replace('<svg ', '<svg width="100%" height="100%" ');
const tmp = `${OUT}/_print.html`;
const b = await browser();

async function pdf(name, wmm, hmm, pages) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}
    @page{size:${wmm}mm ${hmm}mm;margin:0} html,body{margin:0} *{box-sizing:border-box}
    .pg{width:${wmm}mm;height:${hmm}mm;position:relative;overflow:hidden;page-break-after:always;break-after:page}
    .pg:last-child{page-break-after:auto;break-after:auto}
  </style></head><body>${pages.map((p) => `<div class="pg">${p}</div>`).join('')}</body></html>`;
  writeFileSync(tmp, html);
  const p = await b.newPage();
  await p.goto('file://' + tmp);
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: `${OUT}/${name}.pdf`, width: `${wmm}mm`, height: `${hmm}mm`, printBackground: true, preferCSSPageSize: true });
  // Prévia em PNG da primeira página
  await p.setViewportSize({ width: Math.round(wmm * 8), height: Math.round(hmm * 8) });
  await p.addStyleTag({ content: `.pg{zoom:${(8 / 3.7795).toFixed(4)}} .pg+.pg{display:none}` });
  await p.screenshot({ path: `${OUT}/${name}-previa.png`, clip: { x: 0, y: 0, width: Math.round(wmm * 8), height: Math.round(hmm * 8) } });
  await p.close();
}

const dieNote = (txt) => `<div style="position:absolute;left:0;right:0;bottom:1mm;text-align:center;font:600 2mm 'Space Grotesk';color:#E5007E">${txt}</div>`;

// ---------- Redondo 8 cm (arte 84 x 84 mm: 2 mm de sangria em volta) ----------
const roundArt = `
<div style="position:absolute;inset:0;background:${C.palco}"></div>
<div style="position:absolute;left:5mm;top:5mm;width:74mm;height:74mm;border-radius:50%;border:0.8mm solid transparent;background:linear-gradient(${C.palco},${C.palco}) padding-box,linear-gradient(135deg,${C.sinal},${C.neon}) border-box"></div>
<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${C.valvula}">
  <div style="width:24mm;height:24mm">${mark(0, {}).replace('width="0" height="0"', 'width="100%" height="100%"')}</div>
  <div style="font:800 4.6mm Orbitron;letter-spacing:2.6mm;padding-left:2.6mm;margin-top:2.4mm">ANTENA</div>
  <div style="font:400 15.5mm/1 Monoton;color:${C.sinal};margin-top:0.4mm">ROCK</div>
  <div style="font:600 2.3mm 'Space Grotesk';letter-spacing:0.75mm;color:#CFC8DA;margin-top:2mm">O ROCK NÃO SAI DO AR</div>
  <div style="font:600 2.5mm 'Space Grotesk';color:${C.valvula};margin-top:1.4mm;letter-spacing:0.2mm">antenarock.com.br</div>
</div>`;
const roundDie = `${roundArt}
<div style="position:absolute;inset:0;background:rgba(255,255,255,.55)"></div>
<div style="position:absolute;left:2mm;top:2mm;width:80mm;height:80mm;border-radius:50%;border:0.25mm solid #E5007E"></div>
<div style="position:absolute;left:5mm;top:5mm;width:74mm;height:74mm;border-radius:50%;border:0.2mm dashed #00A0E3"></div>
${dieNote('Rosa: corte (80 mm) · Azul: área segura · Fora do rosa: sangria')}`;
await pdf('adesivo-redondo-8cm', 84, 84, [roundArt, roundDie]);

// ---------- Retangular 10 x 5 cm com QR code (arte 104 x 54 mm) ----------
const rectArt = `
<div style="position:absolute;inset:0;background:${C.palco}"></div>
<div style="position:absolute;left:0;right:0;bottom:6mm;display:flex;flex-direction:column;gap:0.9mm">
  <div style="height:1.3mm;background:linear-gradient(90deg,${C.sinal},${C.neon})"></div>
  <div style="height:0.8mm;background:linear-gradient(90deg,${C.sinal},${C.neon});opacity:.7"></div>
</div>
<div style="position:absolute;left:7mm;top:6mm;bottom:11mm;display:flex;align-items:center;gap:3mm;color:${C.valvula}">
  <div style="width:19mm;height:19mm;flex:none">${mark(0, {}).replace('width="0" height="0"', 'width="100%" height="100%"')}</div>
  <div style="display:flex;flex-direction:column">
    <span style="font:800 3.1mm Orbitron;letter-spacing:1.55mm">ANTENA</span>
    <span style="font:400 10.2mm/1 Monoton;color:${C.sinal}">ROCK</span>
    <span style="font:600 1.8mm 'Space Grotesk';letter-spacing:0.45mm;color:#CFC8DA;margin-top:1.4mm">O ROCK NÃO SAI DO AR</span>
  </div>
</div>
<div style="position:absolute;right:7mm;top:6mm;width:25mm;display:flex;flex-direction:column;align-items:center;gap:1.2mm">
  <div style="width:25mm;height:25mm;background:${C.valvula};border-radius:2.2mm;padding:2mm">${qr}</div>
  <span style="font:600 2.1mm 'Space Grotesk';color:${C.valvula}">Aponte e ouça</span>
  <span style="font:400 1.9mm 'Space Grotesk';color:#CFC8DA">antenarock.com.br</span>
</div>`;
const rectDie = `${rectArt}
<div style="position:absolute;inset:0;background:rgba(255,255,255,.55)"></div>
<div style="position:absolute;left:2mm;top:2mm;width:100mm;height:50mm;border-radius:4mm;border:0.25mm solid #E5007E"></div>
<div style="position:absolute;left:5mm;top:5mm;width:94mm;height:44mm;border-radius:2.5mm;border:0.2mm dashed #00A0E3"></div>
${dieNote('Rosa: corte (100 x 50 mm, cantos de 4 mm) · Azul: área segura')}`;
await pdf('adesivo-retangular-10x5cm', 104, 54, [rectArt, rectDie]);

// ---------- Cartela A4: 4 redondos de 8 cm + 2 retangulares de 10 x 5 cm ----------
const scaleBox = (left, top, w, h, inner, r) =>
  `<div style="position:absolute;left:${left}mm;top:${top}mm;width:${w}mm;height:${h}mm;overflow:hidden;border-radius:${r}">
     <div style="position:absolute;left:-2mm;top:-2mm;width:${w + 4}mm;height:${h + 4}mm">${inner}</div></div>`;
const sheet = `<div style="position:absolute;inset:0;background:#fff"></div>
${scaleBox(17, 10, 80, 80, roundArt, '50%')}${scaleBox(113, 10, 80, 80, roundArt, '50%')}
${scaleBox(17, 97, 80, 80, roundArt, '50%')}${scaleBox(113, 97, 80, 80, roundArt, '50%')}
${scaleBox(55, 185, 100, 50, rectArt, '4mm')}
${scaleBox(55, 240, 100, 50, rectArt, '4mm')}`;
await pdf('cartela-A4', 210, 297, [sheet]);

await b.close();
console.log('ok');
