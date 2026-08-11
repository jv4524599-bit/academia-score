import Link from 'next/link';
import { db } from '@/lib/db';
import { getSessionId } from '@/lib/session';
import HomeApp, { type GymSummary } from '@/components/HomeApp';
import PremiumDemo from '@/components/PremiumDemo';
import HowItWorksButton from '@/components/HowItWorksButton';
import PartnerCtaButton from '@/components/PartnerCtaButton';
import PartnerForm from '@/components/PartnerForm';
import { avgRatingFromNotas, CURRENT_CITY_SLUG, fmtDatePtBr, reviewAvg, score10 } from '@/lib/gym-helpers';

// Roda no servidor: busca os dados direto do banco a cada visita.
// Isso é o que resolve o problema de SEO -- o Google já recebe o HTML pronto.
export const revalidate = 60; // regenera a página a cada 60s (ISR)

type DemoReview = {
  autor: string;
  gymName: string;
  comentario: string;
  notas: Record<string, number>;
  data: Date;
  isDemo: boolean;
};

const DEMO_RECENT_REVIEWS: DemoReview[] = [
  {
    autor: 'Camila R.',
    gymName: 'Pacheco Fit — Jardim Oriente',
    comentario: 'Estrutura muito boa e professores atenciosos, recomendo!',
    notas: { Atendimento: 5, Equipamentos: 5 },
    data: new Date(Date.now() - 86400000 * 2),
    isDemo: true,
  },
  {
    autor: 'Rafael S.',
    gymName: 'Smart Fit — Parque Esplanada III',
    comentario: 'Bom custo-benefício, mas fica cheia no horário de pico.',
    notas: { 'Custo-benefício': 5, Lotação: 2 },
    data: new Date(Date.now() - 86400000 * 5),
    isDemo: true,
  },
  {
    autor: 'Juliana M.',
    gymName: 'Vida Fitness Academia',
    comentario: 'Ambiente limpo e organizado, virei aluna fixa.',
    notas: { Limpeza: 5, Organização: 5 },
    data: new Date(Date.now() - 86400000 * 8),
    isDemo: true,
  },
];

async function getData(sessionId: string | null) {
  const city = await db.city.findUnique({ where: { slug: CURRENT_CITY_SLUG } });
  if (!city) return null;

  const gyms: any[] = await db.gym.findMany({
    where: { cityId: city.id },
    include: {
      reviews: { where: { status: 'APPROVED' } },
    },
  });

  const favoriteRows: any[] = sessionId
    ? await db.favorite.findMany({ where: { sessionId, gym: { cityId: city.id } }, select: { gymId: true } })
    : [];
  const favoriteSet = new Set(favoriteRows.map((f) => f.gymId));

  const summaries: GymSummary[] = gyms.map((g) => ({
    id: g.id,
    slug: g.slug,
    name: g.name,
    bairro: g.bairro,
    quadra: g.quadra,
    address: g.address,
    phone: g.phone,
    instagram: g.instagram,
    gympass: g.gympass,
    gympassNivel: g.gympassNivel,
    totalpass: g.totalpass,
    totalpassNivel: g.totalpassNivel,
    horarios: g.horarios,
    mensalidade: g.mensalidade,
    logoUrl: g.logoUrl,
    reviewNotas: (g.reviews as any[]).map((r) => r.notas as unknown as Record<string, number>),
    isFavorite: favoriteSet.has(g.id),
  }));

  const ranked = [...summaries].sort((a, b) => {
    const ra = avgRatingFromNotas(a.reviewNotas);
    const rb = avgRatingFromNotas(b.reviewNotas);
    if (ra && rb) return rb.avg - ra.avg;
    if (ra && !rb) return -1;
    if (!ra && rb) return 1;
    return a.name.localeCompare(b.name);
  });

  const bairros = [...new Set(summaries.map((g) => g.bairro))].sort();

  const recentReviews: any[] = await db.review.findMany({
    where: { status: 'APPROVED', gym: { cityId: city.id } },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: { gym: { select: { name: true } } },
  });

  const totalApprovedReviews = await db.review.count({ where: { status: 'APPROVED', gym: { cityId: city.id } } });

  return { city, summaries, ranked, bairros, recentReviews, totalApprovedReviews };
}

export default async function HomePage({ searchParams }: { searchParams: { compare?: string } }) {
  const sessionId = getSessionId();
  const data = await getData(sessionId);

  if (!data) {
    return <main className="p-10 text-center">Cidade não encontrada.</main>;
  }

  const { city, summaries, ranked, bairros, recentReviews, totalApprovedReviews } = data;

  const showTop3 = ranked.length >= 3;
  const top3 = ranked.slice(0, 3);
  const medals = [
    { cls: 'gold', icon: '🥇' },
    { cls: 'silver', icon: '🥈' },
    { cls: 'bronze', icon: '🥉' },
  ];

  const initialCompare = (searchParams.compare || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const realRecent: DemoReview[] = recentReviews.map((r) => ({
    autor: r.autor,
    gymName: r.gym.name,
    comentario: r.comentario,
    notas: r.notas as unknown as Record<string, number>,
    data: r.createdAt,
    isDemo: false,
  }));
  const recentSource = realRecent.length >= 3 ? realRecent : [...realRecent, ...DEMO_RECENT_REVIEWS].slice(0, 3);

  return (
    <>
      <header>
        <nav className="main-nav">
          <Link href={`/cidade/${city.slug}`}>🏙️ {city.nome}</Link>
          <HowItWorksButton />
          <a
            href="https://www.instagram.com/academiascore?igsh=aWUwYTRwbGdvM2s2"
            target="_blank"
            rel="noopener"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <span className="social-icon-circle ig" style={{ width: 18, height: 18, fontSize: 7 }}>
              IG
            </span>
            @academiascore
          </a>
          <Link href="/admin" style={{ marginLeft: 'auto', opacity: 0.6 }}>
            🔒 Painel
          </Link>
        </nav>
        <div className="header-inner">
          <div>
            <div className="eyebrow">
              {city.nome.toUpperCase()} · {city.uf}
            </div>
            <h1>Academia Score</h1>
            <p className="tagline">Encontre a academia ideal antes de fazer sua matrícula.</p>
            <p className="sub">
              Compare preços, avaliações reais, estrutura, Wellhub (Gympass), TotalPass e escolha com mais
              confiança.
            </p>
            <div className="hero-stats-row">
              <div className="hero-stat-card">
                <span className="hero-stat-icon">🏋️</span>
                <span className="hero-stat-num">{summaries.length}</span>
                <span className="hero-stat-label">academias cadastradas</span>
              </div>
              <div className="hero-stat-card">
                <span className="hero-stat-icon">⭐</span>
                <span className="hero-stat-num">{totalApprovedReviews}</span>
                <span className="hero-stat-label">avaliações</span>
              </div>
              <div className="hero-stat-card">
                <span className="hero-stat-icon">👥</span>
                <span className="hero-stat-num">—</span>
                <span className="hero-stat-label">usuários este mês</span>
              </div>
              <div className="hero-stat-card">
                <span className="hero-stat-icon">🔄</span>
                <span className="hero-stat-num">—</span>
                <span className="hero-stat-label">Atualizado diariamente</span>
              </div>
            </div>
          </div>
          <div className="hero-buttons">
            <a
              className="btn-add"
              style={{ textDecoration: 'none', textAlign: 'center' }}
              href="mailto:contato@academiascore.com.br?subject=Sugest%C3%A3o%20de%20academia"
            >
              + Sugerir academia
            </a>
            <PartnerCtaButton className="btn-add partner-cta-hero">🏆 Cadastre sua Academia</PartnerCtaButton>
          </div>
        </div>
      </header>

      <HomeApp
        gyms={summaries}
        bairros={bairros}
        initialCompare={initialCompare}
        top3={
          showTop3 ? (
            <div className="section-block">
              <h3 className="top3-title">🏆 Top 3 Academias da Cidade</h3>
              <div className="top3-grid">
                {top3.map((g, i) => {
                  const r = avgRatingFromNotas(g.reviewNotas);
                  return (
                    <Link
                      href={`/academia/${g.slug}`}
                      key={g.id}
                      className={`top3-card ${medals[i].cls}`}
                      title={`Ver perfil de ${g.name}`}
                      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                    >
                      <span className="top3-medal">{medals[i].icon}</span>
                      <h4>{g.name}</h4>
                      <span className="top3-score">
                        {r ? `★ ${r.avg.toFixed(1)} · ${score10(r.avg)}/10` : 'Sem avaliações ainda'}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null
        }
        trust={
          <div className="trust-section section-block">
            <h3>Por que confiar no Academia Score?</h3>
            <ul className="trust-list">
              <li>
                <span className="trust-icon">💬</span>Avaliações da comunidade
              </li>
              <li>
                <span className="trust-icon">⚖️</span>Ranking imparcial
              </li>
              <li>
                <span className="trust-icon">✅</span>Informações verificadas
              </li>
              <li>
                <span className="trust-icon">🔍</span>Comparação transparente
              </li>
              <li>
                <span className="trust-icon">🚫</span>Sem venda de posições
              </li>
            </ul>
            <PartnerCtaButton
              className="premium-cta-big"
              style={{ maxWidth: 320, marginTop: 16 }}
              title="Cadastre sua academia como parceira"
            >
              🏆 Cadastre sua Academia
            </PartnerCtaButton>
          </div>
        }
        premium={<PremiumDemo />}
        recent={
          <div className="recent-reviews section-block">
            <h3>Últimas avaliações</h3>
            <div className="recent-reviews-grid">
              {recentSource.map((rv, i) => (
                <div className="recent-review-card" key={i}>
                  <div className="recent-review-top">
                    <span className="rr-name">
                      {rv.autor}
                      {rv.isDemo ? <em className="demo-tag"> (exemplo)</em> : null}
                    </span>
                    <span className="rr-stars">★ {reviewAvg(rv.notas).toFixed(1)}</span>
                  </div>
                  <p>&quot;{rv.comentario}&quot;</p>
                  <div className="recent-review-date">
                    {rv.gymName} · {fmtDatePtBr(rv.data)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        }
      />

      <footer className="partner-footer">
        <div className="partner-inner">
          <div className="partner-text">
            <h3>É dono(a) de uma academia em {city.nome}?</h3>
            <p>
              Academias parceiras podem ganhar selos de destaque (Melhor atendimento, Melhor custo-benefício, Mais
              equipada, Menos lotada), galeria de fotos e vídeos, tabela de planos, tour 360° e botão direto de
              WhatsApp no perfil. Fale com a gente para saber mais.
            </p>
            <PartnerCtaButton className="btn-add partner-cta-hero">🏆 Cadastre sua Academia</PartnerCtaButton>{' '}
            <a
              className="btn-add"
              style={{ display: 'inline-block', textDecoration: 'none', marginTop: 10, marginLeft: 8 }}
              href="mailto:parcerias@academiascore.com.br?subject=Quero%20ser%20parceira"
            >
              Enviar e-mail para parceria
            </a>
            <a
              href="https://www.instagram.com/academiascore?igsh=aWUwYTRwbGdvM2s2"
              target="_blank"
              rel="noopener"
              className="footer-instagram"
            >
              <span className="social-icon-circle ig">IG</span>Siga o Academia Score no Instagram
            </a>
          </div>
          <PartnerForm />
        </div>
      </footer>
    </>
  );
}
