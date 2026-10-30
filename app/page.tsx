import Link from 'next/link';
import { db } from '@/lib/db';
import { getSessionId } from '@/lib/session';
import HomeApp, { type GymSummary } from '@/components/HomeApp';
import MovaltBanner from '@/components/MovaltBanner';
import HowItWorksButton from '@/components/HowItWorksButton';
import PartnerCtaButton from '@/components/PartnerCtaButton';
import {
  avgRatingFromNotas,
  CURRENT_CITY_SLUG,
  fmtDatePtBr,
  isTrustedRating,
  reviewAvg,
  score10,
} from '@/lib/gym-helpers';

// Roda no servidor: busca os dados direto do banco a cada visita.
// Isso é o que resolve o problema de SEO -- o Google já recebe o HTML pronto.
export const revalidate = 60; // regenera a página a cada 60s (ISR)

const SITE_URL = 'https://academia-score.vercel.app';

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

  // Ranking principal: só entram academias com avaliações suficientes pra
  // uma nota "confiável" (ver MIN_TRUSTED_REVIEWS em lib/gym-helpers) --
  // nunca tratamos 1 avaliação isolada como prova de que uma academia é
  // melhor que outra com dezenas de avaliações reais. As academias com
  // avaliação real mas ainda abaixo desse mínimo não ficam escondidas: vão
  // para a vitrine "Notas em formação" logo abaixo, com essa nota "em
  // formação" explícita.
  const ratedGyms = ranked
    .map((g) => ({ g, r: avgRatingFromNotas(g.reviewNotas) }))
    .filter((x): x is { g: GymSummary; r: { avg: number; count: number } } => x.r !== null);
  const trustedRanked = ratedGyms.filter((x) => isTrustedRating(x.r.count));
  const emFormacao = ratedGyms.filter((x) => !isTrustedRating(x.r.count));

  const showTop3 = trustedRanked.length >= 3;
  const top3 = trustedRanked.slice(0, 3);
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

  // JSON-LD: só descreve o que já está na página (nome, URL, nota média e
  // contagem de avaliações de quem já tem avaliação real) -- nada inventado.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Academia Score',
    url: SITE_URL,
    description: 'Compare academias por avaliações reais, preço, estrutura, Wellhub (Gympass) e TotalPass.',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/?busca={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header>
        <nav className="main-nav" aria-label="Principal">
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
            role="alert"
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
            <p className="tagline">Descubra qual academia realmente combina com você.</p>
            <p className="sub">
              Compare preços, avaliações reais, estrutura, Wellhub (Gympass), TotalPass e escolha com mais
              confiança — sem posição paga no ranking.
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
                <span className="hero-stat-label">avaliações reais</span>
              </div>
              <div className="hero-stat-card">
                <span className="hero-stat-icon">🏙️</span>
                <span className="hero-stat-num">{bairros.length}</span>
                <span className="hero-stat-label">bairros cobertos</span>
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
          </div>
        </div>
      </header>

      <HomeApp
        gyms={summaries}
        bairros={bairros}
        initialCompare={initialCompare}
        top3={
          showTop3 ? (
            <div className="section-block" id="ranking">
              <h3 className="top3-title">🏆 Ranking principal</h3>
              <p className="note" style={{ marginTop: -8, marginBottom: 14 }}>
                Só entram aqui academias com pelo menos 3 avaliações reais — nota confiável, sem posição paga.
              </p>
              <div className="top3-grid">
                {top3.map(({ g, r }, i) => (
                  <Link
                    href={`/academia/${g.slug}`}
                    key={g.id}
                    className={`top3-card ${medals[i].cls}`}
                    title={`Ver perfil de ${g.name}`}
                    style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                  >
                    <span className="top3-medal">{medals[i].icon}</span>
                    <h4>{g.name}</h4>
                    <span className="top3-score">★ {r.avg.toFixed(2)} · {score10(r.avg)}/10</span>
                    <span className="top3-count">{r.count} avaliações</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="section-block" id="ranking">
              <h3 className="top3-title">Academias da cidade</h3>
              <p className="note" style={{ marginTop: -4 }}>
                O ranking principal aparece aqui assim que pelo menos 3 academias tiverem 3 ou mais avaliações reais
                cada. Enquanto isso, veja todas as academias cadastradas na lista abaixo.
              </p>
            </div>
          )
        }
        emFormacao={
          emFormacao.length > 0 ? (
            <div className="section-block">
              <h3 className="top3-title" style={{ fontSize: 15 }}>
                📊 Notas em formação
              </h3>
              <p className="note" style={{ marginTop: -8, marginBottom: 14 }}>
                Já têm avaliações reais, mas ainda não chegaram a 3 — a nota pode mudar bastante com as próximas
                avaliações.
              </p>
              <div className="forming-grid">
                {emFormacao.map(({ g, r }) => (
                  <Link
                    href={`/academia/${g.slug}`}
                    key={g.id}
                    className="forming-card"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <strong>{g.name}</strong>
                    <span className="forming-meta">
                      ★ {r.avg.toFixed(1)} · {r.count} avaliação{r.count === 1 ? '' : 's'}
                    </span>
                    <span className="trust-chip">Nota em formação</span>
                  </Link>
                ))}
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
            <p className="note" style={{ marginTop: 10, marginBottom: 0 }}>
              Academias parceiras não recebem vantagem na nota. {' '}
              <Link href="/para-academias" style={{ color: 'var(--neon)' }}>
                Veja como funciona para academias →
              </Link>
            </p>
          </div>
        }
        promo={<MovaltBanner />}
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

      <section className="cta-band">
        <div className="cta-band-inner">
          <div>
            <h3>É dono(a) de uma academia em {city.nome}?</h3>
            <p>
              Mostre sua estrutura, planos e diferenciais para quem está pesquisando — sem nunca alterar sua posição
              no ranking.
            </p>
          </div>
          <PartnerCtaButton className="btn-add partner-cta-hero">🏆 Cadastre sua Academia</PartnerCtaButton>
        </div>
      </section>

      <footer className="site-footer">
        <div className="site-footer-grid">
          <div className="site-footer-col">
            <div className="site-footer-brand">Academia Score</div>
            <p>
              Comparação de academias baseada só em dados reais: avaliações da comunidade, estrutura, preço e
              convênios. Sem posição paga no ranking.
            </p>
            <a
              href="https://www.instagram.com/academiascore?igsh=aWUwYTRwbGdvM2s2"
              target="_blank"
              rel="noopener"
              className="footer-instagram"
            >
              <span className="social-icon-circle ig">IG</span>@academiascore
            </a>
          </div>
          <div className="site-footer-col">
            <h4>Explorar</h4>
            <Link href="/#ranking">Ranking principal</Link>
            <Link href={`/cidade/${city.slug}`}>{city.nome}</Link>
            <a href="mailto:contato@academiascore.com.br?subject=Sugest%C3%A3o%20de%20academia">
              Sugerir academia
            </a>
          </div>
          <div className="site-footer-col">
            <h4>Confiança</h4>
            <span className="site-footer-note">Como calculamos as notas, verificação de avaliações e moderação.</span>
            <a href="mailto:contato@academiascore.com.br?subject=Denunciar%20problema">Denunciar um problema</a>
          </div>
          <div className="site-footer-col">
            <h4>Para academias</h4>
            <span className="site-footer-note">Academias parceiras não recebem vantagem na nota.</span>
            <Link href="/para-academias">Anuncie sua academia →</Link>
          </div>
        </div>
        <div className="site-footer-bottom">© {new Date().getFullYear()} Academia Score</div>
      </footer>
    </>
  );
}
