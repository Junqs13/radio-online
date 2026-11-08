import { SITE } from '@/lib/site';
import { categoria, paraFeed } from '@/lib/materias';

// Feed RSS das matérias: leitores de notícia, agregadores e o próprio Google descobrem as novas por aqui
export const revalidate = 300;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function GET() {
  let itens: Awaited<ReturnType<typeof paraFeed>> = [];
  try {
    itens = await paraFeed();
  } catch {
    /* Supabase fora do ar: feed sai vazio, sem erro */
  }
  const corpo = itens
    .map((m) => {
      const url = `${SITE.url}/materias/${m.slug}`;
      return `    <item>
      <title>${esc(m.titulo)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(m.publicada_em).toUTCString()}</pubDate>
      <category>${esc(categoria(m.categoria).nome)}</category>
      ${m.linha_fina ? `<description>${esc(m.linha_fina)}</description>` : ''}
      ${m.imagem_url ? `<enclosure url="${esc(m.imagem_url)}" type="image/jpeg" length="0" />` : ''}
    </item>`;
    })
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Matérias da ${SITE.name}</title>
    <link>${SITE.url}/materias</link>
    <atom:link href="${SITE.url}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Notícias curtas de rock, música e cultura pop da ${SITE.name}, rádio online de rock de Sorocaba.</description>
    <language>pt-BR</language>
    ${itens[0] ? `<lastBuildDate>${new Date(itens[0].updated_at).toUTCString()}</lastBuildDate>` : ''}
    <image><url>${SITE.url}/icons/icon-192.png</url><title>${SITE.name}</title><link>${SITE.url}</link></image>
${corpo}
  </channel>
</rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
}
