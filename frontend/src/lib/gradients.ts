import { API_URL } from './config';

/**
 * Cores de fundo dos cards de lenda sem foto. As classes ficam escritas aqui por
 * inteiro para o Tailwind gerar o CSS; o banco guarda só o nome da cor.
 */
export const GRADIENTS: Record<string, { label: string; classes: string }> = {
  vermelho: { label: 'Vermelho', classes: 'from-red-700 via-rose-900 to-black' },
  vinho: { label: 'Vinho', classes: 'from-red-800 via-neutral-900 to-black' },
  fogo: { label: 'Fogo', classes: 'from-amber-500 via-red-800 to-black' },
  laranja: { label: 'Laranja', classes: 'from-orange-600 via-red-900 to-black' },
  ambar: { label: 'Âmbar', classes: 'from-amber-600 via-orange-950 to-black' },
  ouro: { label: 'Ouro', classes: 'from-yellow-500 via-amber-800 to-black' },
  lima: { label: 'Lima', classes: 'from-lime-600 via-neutral-900 to-black' },
  verde: { label: 'Verde', classes: 'from-emerald-700 via-green-950 to-black' },
  'verde-agua': { label: 'Verde-água', classes: 'from-teal-800 via-slate-900 to-black' },
  ciano: { label: 'Ciano', classes: 'from-cyan-600 via-blue-900 to-black' },
  azul: { label: 'Azul', classes: 'from-sky-700 via-indigo-900 to-black' },
  violeta: { label: 'Violeta', classes: 'from-violet-700 via-slate-900 to-black' },
  roxo: { label: 'Roxo', classes: 'from-purple-700 via-purple-950 to-black' },
  'roxo-escuro': { label: 'Roxo escuro', classes: 'from-purple-900 via-neutral-900 to-black' },
  magenta: { label: 'Magenta', classes: 'from-fuchsia-600 via-blue-900 to-black' },
  rosa: { label: 'Rosa', classes: 'from-pink-700 via-zinc-900 to-black' },
  prata: { label: 'Prata', classes: 'from-neutral-200 via-neutral-700 to-black' },
  cinza: { label: 'Cinza', classes: 'from-zinc-500 via-zinc-800 to-black' },
  pedra: { label: 'Pedra', classes: 'from-stone-400 via-stone-800 to-black' },
  ardosia: { label: 'Ardósia', classes: 'from-slate-600 via-slate-900 to-black' },
};

export const gradientClasses = (key?: string | null) => (GRADIENTS[key ?? ''] ?? GRADIENTS.vermelho).classes;

/** Imagens enviadas pelo painel vêm da API; as outras são do próprio site ou de um https:// */
export function imageSrc(url?: string | null) {
  if (!url) return null;
  if (url.startsWith('/api/')) return API_URL.replace(/\/api\/?$/, '') + url;
  return url;
}
