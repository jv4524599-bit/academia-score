import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { getSessionId } from '@/lib/session';
import { getCurrentUser, displayName } from '@/lib/auth';
import ReviewGate from '@/components/ReviewGate';
import GymFavoriteButton from '@/components/GymFavoriteButton';
import ReportReviewButton from '@/components/ReportReviewButton';
import { Badge } from '@/components/Badge';
import {
  ALUNO_LABEL,
  avgRatingFromNotas,
  fmtMoney,
  haversineKm,
  idealParaBadges,
  reviewAvg,
  score10,
  type StatusStr,
} from '@/lib/gym-helpers';

// Isso aqui é o que resolve o SEO que discutimos: cada academia tem sua
// própria URL real (/academia/nome-da-academia) e metadados próprios
// pra aparecer certinho no Google e quando compartilhado no WhatsApp.
export const revalidate = 60;

const SITE_URL = 'https://academia-score.vercel.app';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const gym = await db.gym.findUnique({ where: { slug: params.slug } });
  if (!gym) return {};

  const title = `${gym.name} — Avaliações, preço e horários | Academia Score`;
  const description = `Veja avaliações reais, preço da mensalidade, horários e se aceita Gympass/TotalPass na ${gym.name}, em ${gym.bairro}, Valparaíso de Goiás.`;
  const url = `${SITE_URL}/academia/${gym.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Academia Score',
      type: 'website',
      locale: 'pt_BR',
      images: gym.logoUrl ? [{ url: gym.logoUrl }] : undefined,
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: gym.logoUrl ? [gym.logoUrl] : undefined,
    },
  };
}

export default async function GymPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { avaliar?: string };
}) {
  const sessionId = getSessionId();
  const currentUser = await getCurrentUser();

  const gym: any = await db.gym.findUnique({
    where: { slug: params.slug },
    include: {
      photos: { orderBy: { ordem: 'asc' } },
      reviews: { where: { status: 'APPROVED' }, orderBy: { createdAt: 'desc' } },
    },
  });

  if (!gym) notFound();

  const isFavorite = sessionId
    ? !!(await db.favorite.findUnique({ where: { gymId_sessionId: { gymId: gym.id, sessionId } } }))
    : false;

  const reviewNotasList = (gym.reviews as any[]).map((r) => r.notas as unknown as Record<string, number>);
  const rating = avgRatingFromNotas(reviewNotasList);
  const filled = rating ? Math.round(rating.avg) : 0;

  // "Compare com academias semelhantes" -- academias mais próximas (ou do
  // mesmo bairro se não houver coordenadas), igual a similarGyms() do protótipo.
  const others: any[] = await db.gym.findMany({
    where: { cityId: gym.cityId, id: { not: gym.id } },
    include: { reviews: { where: { status: 'APPROVED' } } },
  });
  const hasCurrentCoords = gym.lat != null && gym.lng != null;
  let picked: any[];
  if (hasCurrentCoords) {
    picked = [...others]
      .sort((a, b) => {
        const da = a.lat != null && a.lng != null ? haversineKm(gym.lat, gym.lng, a.lat, a.lng) : Infinity;
        const db_ = b.lat != null && b.lng != null ? haversineKm(gym.lat, gym.lng, b.lat, b.lng) : Infinity;
        return da - db_;
      })
      .slice(0, 3);
  } else {
    const sameBairro = others.filter((g) => g.bairro === gym.bairro);
    const rest = others.filter((g) => g.bairro !== gym.bairro);
    picked = [...sameBairro, ...rest].slice(0, 3);
  }
  const similar = picked.map((g) => {
    const hasCoords = hasCurrentCoords && g.lat != null && g.lng != null;
    const distancia = hasCoords ? haversineKm(gym.lat, gym.lng, g.lat, g.lng).toFixed(1) : null;
    const r = avgRatingFromNotas((g.reviews as any[]).map((rv) => rv.notas as unknown as Record<string, number>));
    return { g, distancia, r };
  });

  const hasBeneficios = gym.gympass !== 'A_CONFIRMAR' || gym.totalpass !== 'A_CONFIRMAR';
  const idealBadges = idealParaBadges(gym.slug);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', padding: '24px 16px 60px' }}>
      <div>
        <div className="modal" style={{ maxWidth: 640, margin: '0 auto', maxHeight: 'none', animation: 'none' }}>
          {/* 1. Nome */}
          <div className="modal-head">
            <div className="modal-logo">
              {gym.logoUrl && <Image src={gym.logoUrl} alt={`Logo ${gym.name}`} width={64} height={64} />}
            </div>
            <div style={{ flex: 1 }}>
              <h2>{gym.name}</h2>
              <span>
                <span className="quadra-chip">
                  {gym.quadra || '-'} · {gym.bairro}
                </span>
              </span>
            </div>
            <Link href="/" className="modal-close" style={{ textDecoration: 'none' }} aria-label="Voltar">
              &times;
            </Link>
          </div>

          <div className="modal-body">
            {/* 2 e 3. Nota + Nº de avaliações */}
            {rating ? (
              <div className="rating-showcase">
                <span className="rating-big">{score10(rating.avg)}</span>
                <div>
                  <div className="rating-stars-row">
                    {'⭐'.repeat(filled)}
                    {'☆'.repeat(5 - filled)}
                  </div>
                  <div className="rating-count">({rating.count} avaliação{rating.count === 1 ? '' : 's'})</div>
                </div>
              </div>
            ) : (
              <p style={{ margin: '0 0 4px', fontSize: 14.5 }}>
                ☆☆☆☆☆ <strong>Ainda não avaliada.</strong>{' '}
                <a href="#avaliar" style={{ color: 'var(--terracota)' }}>
                  Seja o primeiro a avaliar
                </a>
              </p>
            )}

            {/* 4. Localização */}
            <h4>Localização</h4>
            <p style={{ margin: 0, fontSize: 14.5 }}>{gym.address}</p>
            <div className="maps-row">
              {gym.lat != null && gym.lng != null && (
                <a
                  className="btn-sm"
                  style={{ textDecoration: 'none' }}
                  href={`https://www.google.com/maps/search/?api=1&query=${gym.lat},${gym.lng}`}
                  target="_blank"
                  rel="noopener"
                >
                  📍 Ver no Google Maps
                </a>
              )}
              {gym.phone && (
                <a
                  className="btn-sm"
                  style={{ textDecoration: 'none' }}
                  href={`https://wa.me/55${gym.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener"
                >
                  📱 {gym.phone}
                </a>
              )}
              <GymFavoriteButton gymId={gym.id} gymSlug={gym.slug} initialFavorite={isFavorite} />
            </div>

            {/* 5. Preço (só se existir) */}
            {gym.mensalidade != null && (
              <>
                <h4>Preço</h4>
                <p className="plan-highlight">
                  💰 {gym.planoNome ? `Plano ${gym.planoNome}: ` : ''}
                  {fmtMoney(gym.mensalidade)}/mês
                  {gym.semFidelidade
                    ? ' · sem fidelidade'
                    : gym.fidelidadeMeses
                    ? ` · fidelidade de ${gym.fidelidadeMeses} meses`
                    : ''}
                </p>
                {gym.primeiraMensalidade != null && (
                  <p className="plan-promo">🎁 1ª mensalidade por {fmtMoney(gym.primeiraMensalidade)}</p>
                )}
                {gym.matricula != null && (
                  <p className="plan-promo">
                    📝 Matrícula: {gym.matricula === 0 ? 'grátis' : fmtMoney(gym.matricula)}
                  </p>
                )}
                {gym.observacao && (
                  <p className="note" style={{ marginTop: 4 }}>
                    {gym.observacao}
                  </p>
                )}
              </>
            )}

            {/* 6. Benefícios (só se existir algo relevante) */}
            {hasBeneficios && (
              <>
                <h4>Benefícios</h4>
                <div className="badges">
                  <Badge label="Gympass" status={gym.gympass as StatusStr} nivel={gym.gympassNivel} />
                  <Badge label="TotalPass" status={gym.totalpass as StatusStr} nivel={gym.totalpassNivel} />
                </div>
              </>
            )}
            {idealBadges.length > 0 && (
              <div className="ideal-para-row" style={{ marginTop: 8 }}>
                {idealBadges.map((b) => (
                  <span className="ideal-badge" key={b}>
                    {b}
                  </span>
                ))}
              </div>
            )}

            {/* 7. CTA principal */}
            <div className="maps-row" style={{ marginTop: 14 }}>
              <a href="#avaliar" className="btn-add" style={{ textDecoration: 'none' }}>
                ⭐ {rating ? 'Deixar avaliação' : 'Seja o primeiro a avaliar'}
              </a>
            </div>

            {/* Fotos */}
            <h4>📸 Galeria</h4>
            {gym.photos.length > 0 ? (
              <div className="gallery-cat-grid gallery-simple-grid">
                {gym.photos.map((p: any) => (
                  <div className="gallery-cat" key={p.id}>
                    <div className="gallery-cat-img">
                      <Image src={p.url} alt={`Foto de ${gym.name}`} width={300} height={300} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="note">Ainda sem fotos cadastradas.</p>
            )}

            {/* Horários */}
            <h4>Horários de funcionamento</h4>
            <p style={{ margin: 0, fontSize: 14.5, whiteSpace: 'pre-line' }}>{gym.horarios || 'Não informado'}</p>

            {/* Redes sociais / site */}
            {gym.instagram && (
              <>
                <h4>Instagram</h4>
                <p style={{ margin: 0, fontSize: 14.5 }}>@{gym.instagram}</p>
              </>
            )}
            {gym.site && (
              <>
                <h4>Site</h4>
                <p style={{ margin: 0, fontSize: 14.5 }}>{gym.site}</p>
              </>
            )}

            {/* Avaliações */}
            <h4>Comentários</h4>
            <div>
              {gym.reviews.length ? (
                gym.reviews.map((rv: any) => {
                  const ra = reviewAvg(rv.notas as unknown as Record<string, number>);
                  return (
                    <div className="review" key={rv.id}>
                      <div className="review-top">
                        <span className="r-author">{rv.autor}</span>
                        <span className="r-stars">★ {ra.toFixed(1)}</span>
                      </div>
                      {rv.alunoAtual && <span className="aluno-tag">{ALUNO_LABEL[rv.alunoAtual] || ''}</span>}
                      <p>{rv.comentario}</p>
                      <ReportReviewButton reviewId={rv.id} gymSlug={gym.slug} />
                    </div>
                  );
                })
              ) : (
                <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>
                  Ainda não avaliada. Seja o primeiro a avaliar.
                </p>
              )}
            </div>

            <ReviewGate
              gymId={gym.id}
              gymSlug={gym.slug}
              loggedInDisplayName={currentUser ? displayName(currentUser.name) : null}
              autoOpen={searchParams.avaliar === '1'}
            />
            {gym.sourceNote && <p className="note">{gym.sourceNote}</p>}

            {/* Compare com academias semelhantes */}
            {similar.length > 0 && (
              <>
                <h4 style={{ marginTop: 22 }}>Compare com academias semelhantes</h4>
                <div className="similar-gyms-list">
                  {similar.map((s) => (
                    <div className="similar-gym-row" key={s.g.id}>
                      <div>
                        <strong>{s.g.name}</strong>
                        <div className="similar-gym-meta">
                          {s.r ? `★ ${s.r.avg.toFixed(1)}` : 'Ainda não avaliada'} ·{' '}
                          {s.g.mensalidade != null ? `${fmtMoney(s.g.mensalidade)}/mês` : 'Preço não informado'}
                          {s.distancia !== null ? ` · ${s.distancia} km` : ''}
                        </div>
                      </div>
                      <Link href={`/?compare=${gym.id},${s.g.id}`} className="btn-sm" style={{ textDecoration: 'none' }}>
                        Comparar Agora
                      </Link>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
