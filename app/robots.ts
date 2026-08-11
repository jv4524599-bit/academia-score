import type { MetadataRoute } from 'next';

const SITE_URL = 'https://academia-score.vercel.app';

// Libera tudo que é público para indexação; só bloqueia o painel admin
// (que já não tem link público, mas continua existindo tecnicamente) e as
// rotas internas de autenticação, que não fazem sentido pro Google indexar.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
