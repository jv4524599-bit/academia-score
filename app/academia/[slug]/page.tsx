import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { getSessionId } from '@/lib/session';
import ReviewForm from '@/components/ReviewForm';
import GymFavoriteButton from '@/components/GymFavoriteButton';
import ReportReviewButton from '@/components/ReportReviewButton';
import { Badge } from '@/components/Badge';
import {
  ALUNO_LABEL,
  avgRatingFromNotas,
  fmtMoney,
  haversineKm,
  idealParaBadges,
  ratingHistory,
  reviewAvg,
  score10,
  type StatusStr,
} from '@/lib/gym-helpers';

// Isso aqui é o que resolve o SEO que discutimos: cada academia tem sua
// própria URL real (/academia/nome-da-academia) e metadados próprios
// pra aparecer certinho no Google e quando compartilhado no WhatsApp.
export const revalidate = 60;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const gym = await db.gym.findUnique({ where: { slug: params.slug } });
  if (!gym) return {};
  return {
    title: `${gym.name} — Avaliações, preço e horários | Academia Score`,
    description: `Veja avaliações reais, preço da mensalidade, horários e se aceita Gympass/TotalPass na ${gym.name}, em ${gym.bairro}, Valparaíso de Goiás.`,
  };
}

export default async function GymPage({ params }: { params: { slug: string } }) {
  const sessionId = getSessionId();

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
    const mensalidadeReal = g.mensalidade != null;
    const mensalidade = mensalidadeReal ? g.mensalidade : 89.9;
    const hasCoords = hasCurrentCoords && g.lat != null && g.lng != null;
    const distancia = hasCoords ? haversineKm(gym.lat, gym.lng, g.lat, g.lng).toFixed(1) : null;
    const r = avgRatingFromNotas((g.reviews as any[]).map((rv) => rv.notas as unknown as Record<string, number>));
    return { g, mensalidade, mensalidadeReal, distancia, r };
  });

  const hist = rating ? ratingHistory(gym.id, parseFloat(score10(rating.avg))) : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', padding: '24px 16px 60px' }}>
      <div>
        <div className="modal" style={{ maxWidth: 640, margin: '0 auto', maxHeight: 'none', animation: 'none' }}>
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
                <span className="dchip-stars">
                  {rating
                    ? `${'★'.repeat(filled)}${'☆'.repeat(5 - filled)} ${score10(rating.avg)}`
                    : '☆☆☆☆☆'}
                </span>
              </span>
            </div>
            <Link href="/" className="modal-close" style={{ textDecoration: 'none' }} aria-label="Voltar">
              &times;
            </Link>
          </div>

          <div className="modal-body">
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

            <h4>Endereço</h4>
            {gym.mensalidade ? (
              <>
                <p style={{ margin: 0, fontSize: 14.5 }}>{gym.address}</p>
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
            ) : (
              <p style={{ margin: 0, fontSize: 14.5 }}>{gym.address}</p>
            )}

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

            <h4>Convênios</h4>
            <div className="badges">
              <Badge label="Gympass" status={gym.gympass as StatusStr} nivel={gym.gympassNivel} />
              <Badge label="TotalPass" status={gym.totalpass as StatusStr} nivel={gym.totalpassNivel} />
            </div>

            <h4>Ideal para</h4>
            <div className="ideal-para-row">
              {idealParaBadges(gym.slug).map((b) => (
                <span className="ideal-badge" key={b}>
                  {b}
                </span>
              ))}
            </div>

            <h4>Horários de funcionamento</h4>
            <p style={{ margin: 0, fontSize: 14.5, whiteSpace: 'pre-line' }}>{gym.horarios || 'A confirmar'}</p>

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

            <h4>Avaliação média</h4>
            {rating ? (
              <>
                <div className="rating-showcase">
                  <span className="rating-big">{score10(rating.avg)}</span>
                  <div>
                    <div className="rating-stars-row">
                      {'⭐'.repeat(filled)}
                      {'☆'.repeat(5 - filled)}
                    </div>
                    <div className="rating-count">({rating.count} avaliações)</div>
                  </div>
                </div>
                <p className="recommend-line">
                  {Math.round((rating.avg / 5) * 100)}% dos usuários recomendam esta academia{' '}
                  <em className="demo-tag">(estimado)</em>
                </p>
                {hist && (
                  <>
                    <h4 style={{ marginTop: 18 }}>📈 Histórico da nota — últimos 6 meses</h4>
                    <div className="rating-history">
                      <RatingHistorySvg months={hist} />
                    </div>
                    <div className="rating-history-labels">
                      {hist.map((m) => (
                        <span key={m.m}>
                          {m.m}
                          <br />
                          <strong>{m.v.toFixed(1).replace('.', ',')}</strong>
                        </span>
                      ))}
                    </div>
                    <p className="note">Evolução simulada para fins de demonstração.</p>
                  </>
                )}
              </>
            ) : (
              'Sem avaliações ainda'
            )}

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
                  Ainda sem comentários. Seja o primeiro a avaliar.
                </p>
              )}
            </div>

            <ReviewForm gymId={gym.id} gymSlug={gym.slug} />
            <p className="note">{gym.sourceNote || ''}</p>

            {similar.length > 0 && (
              <>
                <h4 style={{ marginTop: 22 }}>Compare com academias semelhantes</h4>
                <div className="similar-gyms-list">
                  {similar.map((s) => (
                    <div className="similar-gym-row" key={s.g.id}>
                      <div>
                        <strong>{s.g.name}</strong>
                        <div className="similar-gym-meta">
                          {s.r ? `★ ${s.r.avg.toFixed(1)}` : 'Sem avaliações'} · {fmtMoney(s.mensalidade)}/mês
                          {!s.mensalidadeReal ? (
                            <em className="demo-tag"> (estimado)</em>
                          ) : (
                            ''
                          )}
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

function RatingHistorySvg({ months }: { months: Array<{ m: string; v: number }> }) {
  const w = 280;
  const h = 70;
  const pad = 8;
  const min = 5;
  const max = 10;
  const points = months.map((pt, i) => {
    const x = pad + (i * (w - 2 * pad)) / 5;
    const y = h - pad - ((pt.v - min) / (max - min)) * (h - 2 * pad);
    return { x, y };
  });
  const pointsStr = points.map((p) => `${p.x},${p.y}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }}>
      <polyline points={pointsStr} fill="none" stroke="#A63F27" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="#D6A23D" />
      ))}
    </svg>
  );
}
