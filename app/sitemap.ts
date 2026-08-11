import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';

const SITE_URL = 'https://academia-score.vercel.app';

// Gerado dinamicamente a partir do banco -- toda academia e cidade reais
// entram automaticamente, sem precisar atualizar isso manualmente.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cities, gyms] = await Promise.all([
    db.city.findMany({ where: { ativa: true }, select: { slug: true } }),
    db.gym.findMany({ select: { slug: true, updatedAt: true } }),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
  ];

  const cityEntries: MetadataRoute.Sitemap = cities.map((c: { slug: string }) => ({
    url: `${SITE_URL}/cidade/${c.slug}`,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const gymEntries: MetadataRoute.Sitemap = gyms.map((g: { slug: string; updatedAt: Date }) => ({
    url: `${SITE_URL}/academia/${g.slug}`,
    lastModified: g.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticEntries, ...cityEntries, ...gymEntries];
}
