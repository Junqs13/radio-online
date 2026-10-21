import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../lib/prisma.js';
import { config } from '../lib/config.js';
import { ensureMediaDir, isAudioFile, readAudioInfo, isPlayableAudio } from '../services/MediaLibrary.js';
import { requireAdmin } from '../lib/auth.js';
import { mediaUsage } from '../services/MediaUsage.js';

const router = Router();
ensureMediaDir();

// Mantém o nome legível e seguro: sem barras, acentos estranhos ou caracteres de controle
function safeName(original: string) {
  const ext = path.extname(original).toLowerCase();
  const base = path
    .basename(original, path.extname(original))
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\-. ()\[\]&]+/g, '_')
    .trim()
    .slice(0, 120) || 'audio';
  return `${Date.now()}-${base}${ext}`;
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, config.mediaDir),
    filename: (req, file, cb) => cb(null, safeName(file.originalname)),
  }),
  limits: { fileSize: config.maxUploadMb * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    // Primeira barreira: extensão e tipo declarado. A segunda (conteúdo real) roda depois de salvar.
    const mimeOk = file.mimetype.startsWith('audio/') || file.mimetype === 'application/octet-stream';
    if (isAudioFile(file.originalname) && mimeOk) cb(null, true);
    else cb(new Error('Formato não suportado. Envie MP3, OGG, FLAC, WAV ou M4A.'));
  },
});

// GET: acervo cadastrado
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const media = await prisma.mediaItem.findMany({ orderBy: { id: 'desc' } });
    res.status(200).json({ success: true, media });
  } catch (err) {
    console.error('Erro ao listar acervo:', err);
    res.status(500).json({ success: false, error: 'Erro ao listar acervo.' });
  }
});

// GET: pastas do acervo com quantidade de faixas e duração (para vincular a programas)
router.get('/folders', async (req: Request, res: Response): Promise<void> => {
  try {
    const groups = await prisma.mediaItem.groupBy({
      by: ['category'],
      where: { type: 'music', enabled: true },
      _count: { _all: true },
      _sum: { duration: true },
    });
    const folders = groups
      .filter((g) => g.category)
      .map((g) => ({ name: g.category, tracks: g._count._all, seconds: g._sum.duration ?? 0 }))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
    res.json({ success: true, folders });
  } catch (err) {
    console.error('Erro ao listar pastas:', err);
    res.status(500).json({ success: false, error: 'Erro ao listar pastas.' });
  }
});

// GET: onde cada faixa toca (programas e horários da grade)
router.get('/usage', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, ...(await mediaUsage()) });
  } catch (err) {
    console.error('Erro ao calcular uso do acervo:', err);
    res.status(500).json({ success: false, error: 'Erro ao calcular uso do acervo.' });
  }
});

// PATCH: muda tipo (música/vinheta/spot), programa ou tira/volta a faixa da rotação
router.patch('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = Number.parseInt(String(req.params.id), 10);
  const b = req.body ?? {};
  const data: Record<string, unknown> = {};
  if (typeof b.enabled === 'boolean') data.enabled = b.enabled;
  if (['music', 'jingle', 'spot'].includes(b.type)) data.type = b.type;
  if (b.programId === null || Number.isInteger(b.programId)) data.programId = b.programId;
  if (!Number.isInteger(id) || Object.keys(data).length === 0) {
    res.status(400).json({ success: false, error: 'Nada para alterar.' });
    return;
  }
  try {
    const { count } = await prisma.mediaItem.updateMany({ where: { id }, data });
    res.status(count ? 200 : 404).json({ success: count > 0 });
  } catch (err) {
    console.error('Erro ao editar faixa:', err);
    res.status(500).json({ success: false, error: 'Erro interno.' });
  }
});

// POST: upload de áudio para a rotação do Auto-DJ
router.post(
  '/upload',
  requireAdmin,
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('audioFile')(req, res, (err: unknown) => {
      if (!err) return next();
      const message =
        err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE'
          ? `Arquivo maior que ${config.maxUploadMb} MB.`
          : err instanceof Error
            ? err.message
            : 'Erro no upload.';
      res.status(400).json({ success: false, error: message });
    });
  },
  async (req: Request, res: Response): Promise<void> => {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: 'Nenhum arquivo de áudio enviado.' });
      return;
    }

    // Confere o conteúdo: um arquivo renomeado para .mp3 que não é áudio é apagado na hora
    if (!(await isPlayableAudio(file.path))) {
      fs.rm(file.path, { force: true }, () => {});
      res.status(400).json({ success: false, error: 'O arquivo não é um áudio válido.' });
      return;
    }

    try {
      const { title, artist, programId, type } = req.body ?? {};
      const info = await readAudioInfo(file.path);
      const parsedProgramId = programId ? Number.parseInt(programId, 10) : null;

      const item = await prisma.mediaItem.create({
        data: {
          filename: file.filename,
          title: (title && String(title).trim()) || info.title,
          artist: (artist && String(artist).trim()) || info.artist,
          duration: info.duration,
          type: ['music', 'jingle', 'spot'].includes(type) ? type : 'music',
          programId: Number.isInteger(parsedProgramId) ? parsedProgramId : null,
        },
      });

      res.status(201).json({ success: true, media: item, message: 'Áudio adicionado ao acervo.' });
    } catch (err) {
      console.error('Erro no upload:', err);
      fs.rm(file.path, { force: true }, () => {}); // não deixa arquivo órfão na pasta
      res.status(500).json({ success: false, error: 'Erro interno no upload.' });
    }
  },
);

export default router;
