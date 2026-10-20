import { config } from './config.js';

export interface IcecastSource {
  title?: string;
  artist?: string;
  listeners?: number;
  genre?: string;
  server_name?: string;
  listenurl?: string;
}

/** Busca o mountpoint da rádio no status do Icecast. Retorna null se o mount não estiver no ar. */
export async function getIcecastSource(timeoutMs = 3000): Promise<IcecastSource | null> {
  const res = await fetch(`${config.icecastUrl}/status-json.xsl`, {
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`Icecast respondeu ${res.status}`);

  const data: any = await res.json();
  const raw = data?.icestats?.source;
  if (!raw) return null;

  const sources: IcecastSource[] = Array.isArray(raw) ? raw : [raw];
  return sources.find((s) => s.listenurl?.endsWith(config.icecastMount)) ?? null;
}

/** O Liquidsoap envia "Artista - Título" no campo title quando a faixa tem as duas tags. */
export function splitTitle(source: IcecastSource): { title: string; artist: string | null } {
  const full = (source.title || '').trim();
  if (source.artist) return { title: full, artist: source.artist };
  const i = full.indexOf(' - ');
  if (i > 0) return { artist: full.slice(0, i).trim(), title: full.slice(i + 3).trim() };
  return { title: full, artist: null };
}
