import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { avgRatingFromNotas } from '@/lib/gym-helpers';

// Porta openCityPage() do protótipo -- agora como rota de verdade
// (/cidade/[slug]) em vez de modal, pra ficar indexável no Google.
export const revalidate = 60;

const SITE_URL = 'https://academia-score.vercel.app';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const city = await db.city.findUnique({ where: { slug: params.slug } });
  if (!city) return {};

  const title = `Academias em ${city.nome} — ${city.uf} | Academia Score`;
  const description = `Ranking completo de academias em ${city.nome} - ${city.uf}, com preços, avaliações reais e convênios (Gympass/TotalPass).`;
  const url = `${SITE_URL}/cidade/${city.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'Academia Score', type: 'website', locale: 'pt_BR' },
    twitter: { card: 'summary', title, description },
  };
}

export default async function CityPage({ params }: { params: { slug: string } }) {
  const city = await db.city.findUnique({ where: { slug: params.slug } });
  if (!city) notFound();

  const gyms: any[] = await db.gym.findMany({
    where: { cityId: city.id },
    include: { reviews: { where: { status: 'APPROVED' } } },
  });

  const ranked = gyms
    .map((g) => ({
      g,
      r: avgRatingFromNotas((g.reviews as any[]).map((rv) => rv.notas as unknown as Record<string, number>)),
    }))
    .sort((a, b) => {
      if (a.r && b.r) return b.r.avg - a.r.avg;
      if (a.r && !b.r) return -1;
      if (!a.r && b.r) return 1;
      return a.g.name.localeCompare(b.g.name);
    });

  const withRating = ranked.filter((x) => x.r);
  const best = withRating[0];
  const cityAvg = withRating.length
    ? (withRating.reduce((sum, x) => sum + (x.r as any).avg, 0) / withRating.length).toFixed(1)
    : '—';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', padding: '24px 16px 60px' }}>
      <div className="modal" style={{ maxWidth: 900, margin: '0 auto', maxHeight: 'none' }}>
        <div className="modal-head">
          <h2>
            {city.nome} — {city.uf}
          </h2>
          <Link href="/" className="modal-close" style={{ textDecoration: 'none' }} aria-label="Voltar">
            &times;
          </Link>
        </div>
        <div className="modal-body">
          <div className="premium-stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
            <div className="premium-stat-box">
              <span className="num">{gyms.length}</span>
              <span className="label">Academias cadastradas</span>
            </div>
            <div className="premium-stat-box">
              <span className="num">{best ? best.g.name.slice(0, 16) : '—'}</span>
              <span className="label">Melhor academia</span>
            </div>
            <div className="premium-stat-box">
              <span className="num">{cityAvg} ⭐</span>
              <span className="label">Nota média da cidade</span>
            </div>
          </div>
          <p className="note" style={{ marginBottom: 16 }}>
            Mapa da cidade em breve — por enquanto, veja o endereço de cada academia no perfil individual.
          </p>
          <h4 style={{ fontFamily: "'Oswald',sans-serif", textTransform: 'uppercase', fontSize: 15, marginBottom: 10 }}>
            Ranking completo de {city.nome}
          </h4>
          <div className="similar-gyms-list">
            {ranked.map(({ g, r }, i) => (
              <div className="similar-gym-row" key={g.id}>
                <div>
                  <strong>
                    {i + 1}. {g.name}
                  </strong>
                  <div className="similar-gym-meta">
                    {g.bairro} · {r ? `★ ${r.avg.toFixed(1)}` : 'Ainda não avaliada'}
                  </div>
                </div>
                <Link href={`/academia/${g.slug}`} className="btn-sm" style={{ textDecoration: 'none' }}>
                  Ver perfil
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
