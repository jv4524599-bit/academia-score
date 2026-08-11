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

type RecentReview = {
  autor: string;
  gymName: string;
  comentario: string;
  notas: Record<string, number>;
  data: Date;
};

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

export default async function HomePage({
  searchParams,
}: {
  searchParams: { compare?: string; authError?: string };
}) {
  const sessionId = getSessionId();
  const data = await getData(sessionId);

  if (!data) {
    return <main className="p-10 text-center">Cidade não encontrada.</main>;
  }

  const { city, summaries, ranked, bairros, recentReviews, totalApprovedReviews } = data;

  // Só vira "ranking" de verdade quando há pelo menos 3 academias com
  // avaliação real -- nunca medalha quem ainda não foi avaliado por ninguém.
  const rankedWithRating = ranked.filter((g) => avgRatingFromNotas(g.reviewNotas));
  const showTop3 = rankedWithRating.length >= 3;
  const top3 = rankedWithRating.slice(0, 3);
  const medals = [
    { cls: 'gold', icon: '🥇' },
    { cls: 'silver', icon: '🥈' },
    { cls: 'bronze', icon: '🥉' },
  ];

  const initialCompare = (searchParams.compare || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const recentSource: RecentReview[] = recentReviews.map((r) => ({
    autor: r.autor,
    gymName: r.gym.name,
    comentario: r.comentario,
    notas: r.notas as unknown as Record<string, number>,
    data: r.createdAt,
  }));

  const AUTH_ERROR_MESSAGES: Record<string, string> = {
    google_not_configured: 'Login com Google ainda não está disponível. Tente entrar com e-mail e senha.',
    google_state: 'Não foi possível confirmar o login com Google. Tente novamente.',
    google_token: 'Não foi possível concluir o login com Google. Tente novamente.',
    google_userinfo: 'Não foi possível obter seus dados do Google. Tente novamente.',
    google_no_email: 'Sua conta Google precisa ter um e-mail associado para entrar.',
    google_unexpected: 'Algo deu errado no login com Google. Tente novamente.',
  };
  const authErrorMessage = searchParams.authError ? AUTH_ERROR_MESSAGES[searchParams.authError] : null;

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
        </nav>
        {authErrorMessage && (
          <div
            style={{
              maxWidth: 900,
              margin: '0 auto',
              padding: '8px 16px',
              fontSize: 13.5,
              color: 'var(--warn)',
              textAlign: 'center',
            }}
          >
            {authErrorMessage}
          </div>
        )}
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
                      <span className="top3-score">{r ? `★ ${r.avg.toFixed(1)} · ${score10(r.avg)}/10` : ''}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="section-block">
              <h3 className="top3-title">Academias da cidade</h3>
              <p className="note" style={{ marginTop: -4 }}>
                O ranking por nota aparece aqui assim que pelo menos 3 academias tiverem avaliações reais. Enquanto
                isso, veja todas as academias cadastradas na lista abaixo.
              </p>
            </div>
          )
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
            <p className="note" style={{ marginTop: 10 }}>
              O pagamento de uma parceria não altera a posição da academia no ranking — a ordem é 100% baseada nas
              notas recebidas.
            </p>
          </div>
        }
        premium={<PremiumDemo />}
        recent={
          <div className="recent-reviews section-block">
            <h3>Últimas avaliações</h3>
            {recentSource.length > 0 ? (
              <div className="recent-reviews-grid">
                {recentSource.map((rv, i) => (
                  <div className="recent-review-card" key={i}>
                    <div className="recent-review-top">
                      <span className="rr-name">{rv.autor}</span>
                      <span className="rr-stars">★ {reviewAvg(rv.notas).toFixed(1)}</span>
                    </div>
                    <p>&quot;{rv.comentario}&quot;</p>
                    <div className="recent-review-date">
                      {rv.gymName} · {fmtDatePtBr(rv.data)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="note" style={{ marginTop: 0 }}>
                Ainda não há avaliações públicas nesta cidade. Seja o primeiro a avaliar uma academia!
              </p>
            )}
          </div>
        }
      />

      <footer className="partner-footer">
        <div className="partner-inner">
          <div className="partner-text">
            <h3>É dono(a) de uma academia em {city.nome}?</h3>
            <p>
              Academias parceiras ganham perfil com galeria de fotos e vídeos ampliada, tabela de planos, tour 360° e
              botão direto de WhatsApp — para ajudar quem está pesquisando a te conhecer melhor. Fale com a gente
              para saber mais.
            </p>
            <p className="note" style={{ marginTop: -4, marginBottom: 12 }}>
              O pagamento de uma parceria não altera a posição da academia no ranking.
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
