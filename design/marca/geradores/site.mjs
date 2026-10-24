// Ícones do site/app e imagem de compartilhamento com a marca nova
import { browser, shot, mark, C } from './kit.mjs';

const ICONS = '/home/claude/radio-online/frontend/public/icons';
const PUB = '/home/claude/radio-online/frontend/public';
const grad = `linear-gradient(135deg, ${C.sinal}, ${C.neon})`;

const b = await browser();

// Ícone com cantos arredondados (navegador, Android "any")
const rounded = (s, pad) =>
  `<div style="width:${s}px;height:${s}px;border-radius:${s * 0.225}px;background:${grad};display:flex;align-items:center;justify-content:center">${mark(s * (1 - pad * 2), { tone: 'white', simple: true })}</div>`;
// Quadrado cheio: o sistema recorta (iPhone e ícone "maskable" do Android, que corta até 20% das bordas)
const full = (s, scale) =>
  `<div style="width:${s}px;height:${s}px;background:${grad};display:flex;align-items:center;justify-content:center">${mark(s * scale, { tone: 'white', simple: true })}</div>`;

await shot(b, rounded(192, 0.14), 192, 192, `${ICONS}/icon-192.png`, { transparent: true });
await shot(b, rounded(512, 0.14), 512, 512, `${ICONS}/icon-512.png`, { transparent: true });
await shot(b, full(512, 0.56), 512, 512, `${ICONS}/maskable-512.png`);
await shot(b, full(180, 0.66), 180, 180, `${ICONS}/apple-touch-icon.png`);
await shot(b, rounded(64, 0.1), 64, 64, `${ICONS}/favicon-64.png`, { transparent: true });

// Imagem que aparece ao compartilhar o link (WhatsApp, redes): 1200 x 630
const og = `
<div style="width:1200px;height:630px;background:${C.palco};position:relative;overflow:hidden;color:${C.valvula}">
  <div style="position:absolute;width:640px;height:640px;left:-180px;top:-260px;border-radius:50%;background:rgba(225,29,46,.20);filter:blur(120px)"></div>
  <div style="position:absolute;width:560px;height:560px;right:-160px;bottom:-280px;border-radius:50%;background:rgba(124,58,237,.22);filter:blur(120px)"></div>
  <div style="position:absolute;left:0;right:0;bottom:46px;display:flex;flex-direction:column;gap:12px">
    <div style="height:10px;background:linear-gradient(90deg,${C.sinal},${C.neon});opacity:.9"></div>
    <div style="height:6px;background:linear-gradient(90deg,${C.sinal},${C.neon});opacity:.65"></div>
    <div style="height:3px;background:linear-gradient(90deg,${C.sinal},${C.neon});opacity:.4"></div>
  </div>
  <div style="position:absolute;inset:0 0 90px 0;display:flex;align-items:center;justify-content:center;gap:56px">
    ${mark(250)}
    <div style="display:flex;flex-direction:column">
      <span style="font-family:Orbitron;font-weight:800;font-size:40px;letter-spacing:22px">ANTENA</span>
      <span style="font-family:Monoton;font-size:150px;line-height:1;color:${C.sinal}">ROCK</span>
      <span style="font-family:'Space Grotesk';font-weight:600;font-size:21px;letter-spacing:7px;color:#CFC8DA;margin-top:12px">O ROCK NÃO SAI DO AR</span>
      <span style="font-family:'Space Grotesk';font-size:24px;color:#A8A3B3;margin-top:16px">antenarock.com.br</span>
    </div>
  </div>
</div>`;
await shot(b, og, 1200, 630, `${PUB}/og.png`);

await b.close();
console.log('ok');
