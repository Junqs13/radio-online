import fs from 'fs';
import path from 'path';
import { parseFile } from 'music-metadata';
import { prisma } from '../lib/prisma.js';
import { config, AUDIO_EXTENSIONS } from '../lib/config.js';

export interface AudioInfo {
  title: string;
  artist: string | null;
  duration: number;
}

export function ensureMediaDir() {
  fs.mkdirSync(config.mediaDir, { recursive: true });
}

export function isAudioFile(name: string) {
  return AUDIO_EXTENSIONS.includes(path.extname(name).toLowerCase());
}

/** Lê as tags do arquivo. Sem tags, tenta "Artista - Título.mp3" no nome do arquivo. */
export async function readAudioInfo(filePath: string): Promise<AudioInfo> {
  const base = path.basename(filePath, path.extname(filePath));
  let fromName: { title: string; artist: string | null } = { title: base, artist: null };
  const i = base.indexOf(' - ');
  if (i > 0) fromName = { artist: base.slice(0, i).trim(), title: base.slice(i + 3).trim() };

  try {
    const meta = await parseFile(filePath, { duration: true, skipCovers: true });
    return {
      title: meta.common.title?.trim() || fromName.title,
      artist: meta.common.artist?.trim() || fromName.artist,
      duration: Math.round(meta.format.duration ?? 0),
    };
  } catch {
    return { ...fromName, duration: 0 };
  }
}

/** true se o arquivo é áudio de verdade (cabeçalho válido e duração maior que zero). */
export async function isPlayableAudio(filePath: string) {
  try {
    const meta = await parseFile(filePath, { duration: true, skipCovers: true });
    return Boolean(meta.format.codec || meta.format.container) && (meta.format.duration ?? 0) > 0;
  } catch {
    return false;
  }
}

let lastSync: { at: Date; added: number; removed: number; total: number } | null = null;
export const getLastSync = () => lastSync;

/** Lista os arquivos de áudio da pasta de mídia, incluindo subpastas, como caminhos relativos ("Categoria/Arquivo.mp3"). */
export function listAudioFiles(dir = config.mediaDir, prefix = ''): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...listAudioFiles(path.join(dir, entry.name), rel));
    else if (entry.isFile() && isAudioFile(entry.name)) out.push(rel);
  }
  return out;
}

/**
 * Mantém o banco igual à pasta de mídia: cadastra arquivos novos (lendo as tags)
 * e remove registros de arquivos que não existem mais.
 * Assim, copiar MP3 direto para a pasta storage/ já faz eles aparecerem no acervo.
 */
export async function syncMediaDir() {
  ensureMediaDir();
  const files = listAudioFiles();
  const onDisk = new Set(files);
  const rows = await prisma.mediaItem.findMany({ select: { id: true, filename: true } });
  const known = new Set(rows.map((m) => m.filename));

  const missing = rows.filter((m) => !onDisk.has(m.filename)).map((m) => m.id);
  if (missing.length) await prisma.mediaItem.deleteMany({ where: { id: { in: missing } } });

  let added = 0;
  for (const filename of files) {
    if (known.has(filename)) continue;
    const info = await readAudioInfo(path.join(config.mediaDir, filename));
    const category = filename.includes('/') ? filename.split('/')[0] : null;
    // Pasta "Vinhetas" (ou "Jingles") entra como vinheta; o resto como música
    const plain = (category ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const type = ['vinheta', 'vinhetas', 'jingle', 'jingles'].includes(plain) ? 'jingle' : 'music';
    await prisma.mediaItem.create({ data: { filename, type, category, ...info } });
    added++;
  }

  lastSync = { at: new Date(), added, removed: missing.length, total: files.length };
  return lastSync;
}
