import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';
import { slugsParaSitemap } from '@/lib/materias';

// Refeito a cada hora, para matérias novas entrarem e as retiradas saírem
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let materias: { slug: string; updated_at: string }[] = [];
  try {
    materias = await slugsParaSitemap();
  } catch {
    /* Supabase fora do ar: o sitemap sai só com as páginas fixas */
  }
  return [
    { url: SITE.url, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${SITE.url}/materias`, lastModified: materias[0] ? new Date(materias[0].updated_at) : new Date(), changeFrequency: 'hourly', priority: 0.8 },
    ...materias.map((m) => ({
      url: `${SITE.url}/materias/${m.slug}`,
      lastModified: new Date(m.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ];
}
