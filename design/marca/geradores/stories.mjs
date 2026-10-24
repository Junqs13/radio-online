// 3 stories estáticos 1080 x 1920 para divulgar a rádio entre amigos
import { mkdirSync, readFileSync } from 'fs';
import { browser, shot, mark, C } from './kit.mjs';

const OUT = '/tmp/claude-0/-home-claude/3d89a1b3-0db1-507b-86a8-9a6bc4d197b7/scratchpad/brand/stories';
mkdirSync(OUT, { recursive: true });
const qr = readFileSync('/tmp/claude-0/-home-claude/3d89a1b3-0db1-507b-86a8-9a6bc4d197b7/scratchpad/brand/qr-story.svg', 'utf8');
const orb = `font-family:Orbitron;font-weight:800`;
const sg = `font-family:'Space Grotesk'`;
const neon = `font-family:Monoton;color:${C.sinal}`;

const bg = (extra = '') => `
<div style="position:absolute;inset:0;background:${C.palco}"></div>
<div style="position:absolute;width:1100px;height:1100px;left:-420px;top:-380px;border-radius:50%;background:rgba(225,29,46,.22);filter:blur(160px)"></div>
<div style="position:absolute;width:1000px;height:1000px;right:-420px;bottom:-300px;border-radius:50%;background:rgba(124,58,237,.26);filter:blur(160px)"></div>
${extra}`;
const stripes = (bottom) => `<div style="position:absolute;left:0;right:0;bottom:${bottom}px;display:flex;flex-direction:column;gap:14px">
  <div style="height:16px;background:linear-gradient(90deg,${C.sinal},${C.neon})"></div>
  <div style="height:10px;background:linear-gradient(90deg,${C.sinal},${C.neon});opacity:.7"></div>
  <div style="height:5px;background:linear-gradient(90deg,${C.sinal},${C.neon});opacity:.45"></div></div>`;
const icon = (d) => `<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#8B8698" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

// ---------- 1. Post no estilo de rede social ----------
const s1 = `${bg()}
<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:56px;padding:0 70px">
  <div style="display:flex;align-items:center;gap:18px">${mark(84, { simple: true })}<span style="${sg};font-weight:700;font-size:34px;letter-spacing:10px;color:#CFC8DA">NOVIDADE NO AR</span></div>
  <div style="width:100%;background:#13111B;border:2px solid #2A2635;border-radius:44px;padding:56px 56px 40px;color:${C.valvula}">
    <div style="display:flex;align-items:center;gap:24px">
      <div style="width:110px;height:110px;border-radius:50%;background:${C.palco};border:3px solid #2A2635;display:flex;align-items:center;justify-content:center">${mark(76, { simple: true })}</div>
      <div style="display:flex;flex-direction:column;gap:4px"><span style="${sg};font-weight:700;font-size:42px">Antena Rock</span><span style="${sg};font-size:32px;color:#8B8698">antenarock.com.br · agora</span></div>
    </div>
    <p style="${sg};font-size:52px;line-height:1.32;margin:44px 0 0">Agora existe uma rádio só de rock tocando 24 horas, sem intervalo comercial.</p>
    <p style="${sg};font-size:52px;line-height:1.32;margin:30px 0 0">Vai de Elvis a Coldplay, passando por Raul, Legião e Iron Maiden. E dá pra pedir música pelo site.</p>
    <p style="${sg};font-size:44px;line-height:1.3;margin:30px 0 0;color:${C.sinal};font-weight:700">#ORockNãoSaiDoAr</p>
    <div style="display:flex;justify-content:space-between;margin-top:46px;padding-top:30px;border-top:2px solid #2A2635">
      ${icon('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12z"/>')}
      ${icon('<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>')}
      ${icon('<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z" fill="' + C.sinal + '" stroke="' + C.sinal + '"/>')}
      ${icon('<path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v13"/>')}
    </div>
  </div>
  <div style="display:flex;flex-direction:column;align-items:center;gap:18px">
    <span style="${sg};font-size:36px;color:#CFC8DA">Aperta o play em</span>
    <span style="${sg};font-weight:700;font-size:56px;color:${C.valvula};background:linear-gradient(90deg,${C.sinal},${C.neon});padding:22px 48px;border-radius:999px">antenarock.com.br</span>
  </div>
</div>`;

// ---------- 2. Tela de player: "tem tocado por lá" ----------
const tracks = [
  ['The Trooper', 'Iron Maiden'],
  ['Tempo Perdido', 'Legião Urbana'],
  ['Heartbreak Hotel', 'Elvis Presley'],
  ['Californication', 'Red Hot Chili Peppers'],
  ['Gita', 'Raul Seixas'],
];
const grooves = [300, 270, 240, 210, 180, 150].map((r) => `<circle cx="320" cy="320" r="${r}" fill="none" stroke="#24202F" stroke-width="3"/>`).join('');
const s2 = `${bg()}
<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;padding:200px 80px 0;gap:32px;color:${C.valvula}">
  <div style="display:flex;align-items:center;gap:16px;background:rgba(225,29,46,.15);border:2px solid rgba(225,29,46,.5);padding:14px 30px;border-radius:999px">
    <span style="width:20px;height:20px;border-radius:50%;background:${C.sinal};box-shadow:0 0 18px ${C.sinal}"></span>
    <span style="${sg};font-weight:700;font-size:32px;letter-spacing:8px;color:#FFB4BB">AO VIVO 24 HORAS</span></div>
  <svg width="500" height="500" viewBox="0 0 640 640">
    <circle cx="320" cy="320" r="318" fill="#0D0B13"/>${grooves}
    <path d="M110 200 A240 240 0 0 1 230 95" fill="none" stroke="#4A4458" stroke-width="10" stroke-linecap="round"/>
    <defs><linearGradient id="lb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.sinal}"/><stop offset="1" stop-color="${C.neon}"/></linearGradient></defs>
    <circle cx="320" cy="320" r="128" fill="url(#lb)"/>
    <g transform="translate(250 245) scale(0.7)">${mark(200, { tone: 'white', simple: true }).replace(/^<svg[^>]*>/, '').replace('</svg>', '')}</g>
    <circle cx="320" cy="320" r="12" fill="${C.valvula}"/></svg>
  <div style="width:100%;display:flex;flex-direction:column;gap:6px">
    <span style="${sg};font-weight:700;font-size:30px;letter-spacing:8px;color:#8B8698">TEM TOCADO POR LÁ</span>
    ${tracks
      .map(
        ([t, a], i) => `<div style="display:flex;align-items:center;gap:26px;padding:15px 0;border-bottom:2px solid #221E2C">
        <span style="${orb};font-size:30px;color:${i === 0 ? C.sinal : '#5A5468'};width:46px">${String(i + 1).padStart(2, '0')}</span>
        <div style="display:flex;flex-direction:column"><span style="${sg};font-weight:700;font-size:40px">${t}</span><span style="${sg};font-size:30px;color:#A8A3B3">${a}</span></div></div>`,
      )
      .join('')}
  </div>
  <div style="display:flex;align-items:center;gap:30px;margin-top:6px">
    <div style="width:130px;height:130px;border-radius:36px;background:linear-gradient(135deg,${C.sinal},${C.neon});display:flex;align-items:center;justify-content:center">
      <svg width="58" height="58" viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z" fill="#fff"/></svg></div>
    <div style="display:flex;flex-direction:column"><span style="${sg};font-size:34px;color:#CFC8DA">Ouça agora em</span><span style="${sg};font-weight:700;font-size:48px">antenarock.com.br</span></div>
  </div>
</div>`;

// ---------- 3. Ingresso de show ----------
const row = (k, v, big = false) => `<div style="display:flex;flex-direction:column;gap:6px">
  <span style="${sg};font-weight:700;font-size:24px;letter-spacing:6px;color:#8B8698">${k}</span>
  <span style="${sg};font-weight:700;font-size:${big ? 46 : 40}px;color:${C.palco}">${v}</span></div>`;
const s3 = `${bg(stripes(220))}
<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:50px;padding:0 80px">
  <span style="${sg};font-weight:700;font-size:36px;letter-spacing:12px;color:#CFC8DA">SEU INGRESSO CHEGOU</span>
  <div style="width:100%;transform:rotate(-3deg);filter:drop-shadow(0 30px 60px rgba(0,0,0,.6))">
    <div style="background:${C.valvula};border-radius:36px 36px 0 0;padding:48px 52px 40px;position:relative;overflow:hidden">
      <div style="position:absolute;left:0;right:0;top:0;height:18px;background:linear-gradient(90deg,${C.sinal},${C.neon})"></div>
      <div style="display:flex;align-items:center;gap:26px;margin-top:10px">
        ${mark(130, { fg: C.palco })}
        <div style="display:flex;flex-direction:column"><span style="${orb};font-size:40px;letter-spacing:14px;color:${C.palco}">ANTENA</span><span style="${neon};font-size:112px;line-height:1;color:${C.sinalClaro}">ROCK</span></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:34px 30px;margin-top:40px">
        ${row('EVENTO', 'Rock 24 horas', true)}${row('ENTRADA', 'Livre', true)}
        ${row('QUANDO', 'Todo dia')}${row('HORÁRIO', 'A hora que você quiser')}
        ${row('SETOR', 'Seu fone de ouvido')}${row('LOCAL', 'antenarock.com.br')}
      </div>
    </div>
    <div style="height:0;border-top:6px dashed #B8B0A2;margin:0 30px"></div>
    <div style="background:${C.valvula};border-radius:0 0 36px 36px;padding:34px 52px 40px;display:flex;align-items:center;justify-content:space-between;gap:30px">
      <div style="display:flex;flex-direction:column;gap:10px">
        <span style="${sg};font-weight:700;font-size:24px;letter-spacing:6px;color:#8B8698">ADMITE</span>
        <span style="${sg};font-weight:700;font-size:44px;color:${C.palco};line-height:1.15">Você e quem mais<br>quiser aumentar o som</span>
      </div>
      <div style="width:190px;height:190px;flex:none;background:#fff;border-radius:18px;padding:14px">${qr}</div>
    </div>
  </div>
  <span style="${sg};font-size:34px;color:#CFC8DA;text-align:center">O rock não sai do ar.</span>
</div>`;

const b = await browser();
await shot(b, s1, 1080, 1920, `${OUT}/story-1-post.png`);
await shot(b, s2, 1080, 1920, `${OUT}/story-2-tocando.png`);
await shot(b, s3, 1080, 1920, `${OUT}/story-3-ingresso.png`);
await b.close();
console.log('ok');
