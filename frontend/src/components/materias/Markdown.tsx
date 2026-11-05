import { Fragment, type ReactNode } from 'react';

/**
 * Markdown simples das matérias virando elementos React.
 * Nada do banco entra como HTML: tudo é texto, então uma tag escrita na matéria aparece como texto.
 * Cobre o que o geek-news gera (parágrafos e um intertítulo ##) e um pouco mais por segurança:
 * ###, listas, citação, **negrito**, *itálico* e `código`. Link vira só o texto (o site não aponta para outros sites).
 */

const INLINE = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*\s][^*]*\*|_[^_\s][^_]*_|`[^`]+`|\[[^\]]+\]\([^)]*\))/g;

function inline(text: string, key = ''): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    const k = `${key}-${i}`;
    if (!part) return null;
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__')) ) {
      return <strong key={k} className="font-semibold text-white">{inline(part.slice(2, -2), k)}</strong>;
    }
    if (part.length > 2 && ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_')))) {
      return <em key={k}>{inline(part.slice(1, -1), k)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={k} className="rounded bg-white/10 px-1.5 py-0.5 text-[0.9em]">{part.slice(1, -1)}</code>;
    }
    const link = part.match(/^\[([^\]]+)\]\([^)]*\)$/);
    if (link) return <Fragment key={k}>{inline(link[1], k)}</Fragment>;
    return <Fragment key={k}>{part}</Fragment>;
  });
}

export default function Markdown({ source }: { source: string }) {
  const blocks = source.replace(/\r\n?/g, '\n').trim().split(/\n\s*\n/);
  return (
    <>
      {blocks.map((raw, i) => {
        const b = raw.trim();
        if (!b) return null;
        const h = b.match(/^(#{1,6})\s+(.+)$/);
        if (h && !b.includes('\n')) {
          return h[1].length <= 2 ? (
            <h2 key={i} className="font-brand text-xl sm:text-2xl font-extrabold text-white tracking-tight pt-4">{inline(h[2], `h${i}`)}</h2>
          ) : (
            <h3 key={i} className="text-lg font-bold text-white pt-2">{inline(h[2], `h${i}`)}</h3>
          );
        }
        const lines = b.split('\n');
        if (lines.every((l) => /^\s*[-*+]\s+/.test(l))) {
          return (
            <ul key={i} className="list-disc pl-6 space-y-2 marker:text-red-500">
              {lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*[-*+]\s+/, ''), `u${i}-${j}`)}</li>)}
            </ul>
          );
        }
        if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
          return (
            <ol key={i} className="list-decimal pl-6 space-y-2 marker:text-red-500">
              {lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*\d+[.)]\s+/, ''), `o${i}-${j}`)}</li>)}
            </ol>
          );
        }
        if (lines.every((l) => l.startsWith('>'))) {
          return (
            <blockquote key={i} className="border-l-2 border-red-600 pl-5 text-gray-200 italic">
              {inline(lines.map((l) => l.replace(/^>\s?/, '')).join(' '), `q${i}`)}
            </blockquote>
          );
        }
        // Parágrafo: quebra simples de linha vira espaço, como no Markdown
        return <p key={i}>{inline(lines.map((l) => l.replace(/^#{1,6}\s+/, '')).join(' '), `p${i}`)}</p>;
      })}
    </>
  );
}
