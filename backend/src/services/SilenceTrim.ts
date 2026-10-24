import { spawn } from 'child_process';
import path from 'path';
import { prisma } from '../lib/prisma.js';
import { config } from '../lib/config.js';

/**
 * Corta o silêncio das pontas de cada faixa.
 * O ffmpeg ouve o arquivo inteiro e marca onde o som começa e onde termina de verdade
 * (abaixo de -48 dB por mais de 0,4 s conta como silêncio). Esses pontos vão para o banco
 * e o Auto-DJ manda para o Liquidsoap como liq_cue_in / liq_cue_out. O arquivo não é alterado.
 */

const THRESHOLD_DB = -48;
const MIN_SILENCE = 0.4;
const KEEP = 0.1; // deixa um respiro curtinho para não cortar o ataque da primeira nota
const MAX_LEAD = 20; // mais que isso no começo provavelmente é intro intencional, não silêncio

let ffmpegMissing = false;
let running = false;

function analyze(file: string): Promise<{ duration: number; cueIn: number | null; cueOut: number | null }> {
  return new Promise((resolve, reject) => {
    const p = spawn('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', `silencedetect=n=${THRESHOLD_DB}dB:d=${MIN_SILENCE}`, '-f', 'null', '-']);
    let err = '';
    p.stderr.on('data', (d) => (err += d.toString()));
    p.on('error', reject);
    p.on('close', (code) => {
      if (code !== 0) return reject(new Error(`ffmpeg saiu com ${code}`));
      const m = err.match(/Duration: (\d+):(\d+):([\d.]+)/);
      if (!m) return reject(new Error('duração não encontrada'));
      const duration = Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
      const starts = [...err.matchAll(/silence_start: (-?[\d.]+)/g)].map((x) => Number(x[1]));
      const ends = [...err.matchAll(/silence_end: ([\d.]+)/g)].map((x) => Number(x[1]));

      let cueIn: number | null = null;
      if (starts.length && starts[0] <= 0.05 && ends.length && ends[0] <= MAX_LEAD) cueIn = Math.max(0, ends[0] - KEEP);

      // Silêncio que vai até o fim do arquivo: ou não tem silence_end, ou ele bate na duração
      let cueOut: number | null = null;
      const lastStart = starts[starts.length - 1];
      const tailOpen = starts.length > ends.length || (ends.length && ends[ends.length - 1] >= duration - 0.15);
      if (starts.length && tailOpen && lastStart > (cueIn ?? 0) + 5) cueOut = Math.min(duration, lastStart + KEEP);

      // Diferenças pequenas não valem o corte
      if (cueIn !== null && cueIn < 0.25) cueIn = null;
      if (cueOut !== null && duration - cueOut < 0.25) cueOut = null;
      resolve({ duration, cueIn: cueIn === null ? null : round(cueIn), cueOut: cueOut === null ? null : round(cueOut) });
    });
  });
}

const round = (n: number) => Math.round(n * 100) / 100;

/** Analisa as faixas que ainda não foram medidas, algumas por vez, sem travar a rádio. */
export async function trimPending(limit = 40) {
  if (ffmpegMissing || running) return 0;
  running = true;
  let done = 0;
  try {
    const items = await prisma.mediaItem.findMany({
      where: { cueCheckedAt: null },
      select: { id: true, filename: true },
      orderBy: { id: 'asc' },
      take: limit,
    });
    for (const it of items) {
      try {
        const r = await analyze(path.join(config.mediaDir, it.filename));
        await prisma.mediaItem.update({
          where: { id: it.id },
          data: { cueIn: r.cueIn, cueOut: r.cueOut, cueCheckedAt: new Date() },
        });
        done++;
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
          ffmpegMissing = true;
          console.error('[silêncio] ffmpeg não encontrado no servidor; as faixas tocam sem corte de silêncio.');
          break;
        }
        // Arquivo com problema: marca como visto para não tentar de novo a cada rodada
        await prisma.mediaItem.update({ where: { id: it.id }, data: { cueCheckedAt: new Date() } }).catch(() => {});
      }
    }
    if (done) console.log(`[silêncio] ${done} faixa(s) medidas.`);
  } finally {
    running = false;
  }
  return done;
}
