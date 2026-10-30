'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/Badge';
import { toggleFavorite as toggleFavoriteAction } from '@/app/actions';
import {
  REVIEW_CATEGORIES,
  avgRatingFromNotas,
  categoryAverages,
  fmtMoney,
  isTrustedRating,
  normalizeText,
  score10,
  type StatusStr,
} from '@/lib/gym-helpers';

export type GymSummary = {
  id: string;
  slug: string;
  name: string;
  bairro: string;
  quadra: string | null;
  address: string;
  phone: string | null;
  instagram: string | null;
  gympass: StatusStr;
  gympassNivel: string | null;
  totalpass: StatusStr;
  totalpassNivel: string | null;
  horarios: string | null;
  mensalidade: number | null;
  logoUrl: string | null;
  reviewNotas: Array<Record<string, number>>;
  isFavorite: boolean;
};

export default function HomeApp({
  gyms,
  bairros,
  initialCompare,
  top3,
  emFormacao,
  trust,
  promo,
  recent,
}: {
  gyms: GymSummary[];
  bairros: string[];
  initialCompare: string[];
  top3: React.ReactNode;
  emFormacao?: React.ReactNode;
  trust: React.ReactNode;
  promo?: React.ReactNode;
  recent: React.ReactNode;
}) {
  const [search, setSearch] = useState('');
  const [bairro, setBairro] = useState('');
  const [wantGympass, setWantGympass] = useState(false);
  const [wantTotalpass, setWantTotalpass] = useState(false);
  const [wantFavorites, setWantFavorites] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(
    () => new Set(gyms.filter((g) => g.isFavorite).map((g) => g.id))
  );
  const validInitialCompare = initialCompare.filter((id) => gyms.some((g) => g.id === id)).slice(0, 3);
  const [selected, setSelected] = useState<string[]>(validInitialCompare);
  const [compareOpen, setCompareOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);

  useEffect(() => {
    if (validInitialCompare.length >= 2) setCompareOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fecha qualquer modal aberto com Esc -- nenhum dos modais tinha isso antes,
  // então quem navega só pelo teclado ficava preso lá dentro.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      setCompareOpen(false);
      setQuizOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const ratings = useMemo(() => {
    const map = new Map<string, { avg: number; count: number } | null>();
    gyms.forEach((g) => map.set(g.id, avgRatingFromNotas(g.reviewNotas)));
    return map;
  }, [gyms]);

  const filtered = useMemo(() => {
    const s = normalizeText(search.trim());
    return gyms
      .filter((g) => {
        if (s && !normalizeText(g.name).includes(s) && !normalizeText(g.bairro).includes(s)) return false;
        if (bairro && g.bairro !== bairro) return false;
        if (wantGympass && g.gympass !== 'SIM') return false;
        if (wantTotalpass && g.totalpass !== 'SIM') return false;
        if (wantFavorites && !favorites.has(g.id)) return false;
        return true;
      })
      .sort((a, b) => {
        const ra = ratings.get(a.id);
        const rb = ratings.get(b.id);
        if (ra && rb) return rb.avg - ra.avg;
        if (ra && !rb) return -1;
        if (!ra && rb) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [gyms, search, bairro, wantGympass, wantTotalpass, wantFavorites, favorites, ratings]);

  async function handleToggleFavorite(gymId: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(gymId)) next.delete(gymId);
      else next.add(gymId);
      return next;
    });
    try {
      await toggleFavoriteAction(gymId);
    } catch (e) {
      // reverte em caso de erro
      setFavorites((prev) => {
        const next = new Set(prev);
        if (next.has(gymId)) next.delete(gymId);
        else next.add(gymId);
        return next;
      });
    }
  }

  function toggleCompare(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) {
        alert('Você pode comparar até 3 academias por vez.');
        return prev;
      }
      return [...prev, id];
    });
  }

  const chosen = gyms.filter((g) => selected.includes(g.id));

  return (
    <>
      <section className="hero-search" role="search" aria-label="Buscar academia">
        <div className="hero-search-inner">
          <h2>Encontre sua academia</h2>
          <div className="hero-search-box">
            <span className="search-icon" aria-hidden="true">🔍</span>
            <label htmlFor="busca-academia" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
              Buscar por nome da academia ou bairro
            </label>
            <input
              id="busca-academia"
              type="text"
              placeholder="Digite o nome da academia ou bairro..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      <main>
        {top3}
        {emFormacao}
        {trust}
        {promo}

        <div className="filters section-block">
          <select value={bairro} onChange={(e) => setBairro(e.target.value)} aria-label="Filtrar por bairro">
            <option value="">Todos os bairros</option>
            {bairros.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={`filter-chip ${wantGympass ? 'active' : ''}`}
            aria-pressed={wantGympass}
            onClick={() => setWantGympass((v) => !v)}
          >
            Aceita Gympass
          </button>
          <button
            type="button"
            className={`filter-chip ${wantTotalpass ? 'active' : ''}`}
            aria-pressed={wantTotalpass}
            onClick={() => setWantTotalpass((v) => !v)}
          >
            Aceita TotalPass
          </button>
          <button
            type="button"
            className={`filter-chip ${wantFavorites ? 'active' : ''}`}
            aria-pressed={wantFavorites}
            onClick={() => setWantFavorites((v) => !v)}
          >
            ❤️ Só favoritas
          </button>
          <button type="button" className="filter-chip quiz-chip" onClick={() => setQuizOpen(true)}>
            🎯 Encontre sua academia
          </button>
          <span className="count-tag" role="status" aria-live="polite">{filtered.length} academia(s)</span>
        </div>

        <div id="grade">
        {filtered.length === 0 ? (
          <div className="empty-state">
            Nenhuma academia encontrada com esses filtros.
            <br />
            Que tal <strong>sugerir uma academia</strong> que você conhece?
          </div>
        ) : (
          filtered.map((g, idx) => {
            const r = ratings.get(g.id);
            const isSelected = selected.includes(g.id);
            const isFav = favorites.has(g.id);
            return (
              <div className="row" key={g.id}>
                <div className="rank-num">{idx + 1}</div>
                <div className={`row-logo ${g.logoUrl ? '' : 'empty'}`}>
                  {g.logoUrl ? (
                    <Image src={g.logoUrl} alt={`Logo ${g.name}`} width={68} height={68} />
                  ) : (
                    g.name.charAt(0)
                  )}
                </div>
                <div className="row-main">
                  <h3>{g.name}</h3>
                  <span className="name-stars">
                    {'★'.repeat(r ? Math.round(r.avg) : 0)}
                    {'☆'.repeat(5 - (r ? Math.round(r.avg) : 0))}
                    {r ? ` - ${score10(r.avg)}` : ''}
                  </span>
                  <div className="badges">
                    <Badge label="Gympass" status={g.gympass} nivel={g.gympassNivel} />
                    <Badge label="TotalPass" status={g.totalpass} nivel={g.totalpassNivel} />
                  </div>
                </div>
                <div className="row-side">
                  <div className="stars">
                    {r ? (
                      <>
                        ★ {r.avg.toFixed(1)} <span className="count">({r.count})</span>
                        <br />
                        <span className="score10">{score10(r.avg)}/10</span>
                        {!isTrustedRating(r.count) && <span className="trust-chip">Nota em formação</span>}
                      </>
                    ) : (
                      <span className="count">Ainda não avaliada</span>
                    )}
                  </div>
                  <div className="row-actions">
                    <button className="btn-sm fav-btn" onClick={() => handleToggleFavorite(g.id)} title="Favoritar">
                      {isFav ? '❤️' : '🤍'}
                    </button>
                    <Link
                      href={`/academia/${g.slug}`}
                      className="btn-sm"
                      title="Ver planos, horários e avaliações completas"
                      style={{ textDecoration: 'none', display: 'inline-block' }}
                    >
                      Ver detalhes
                    </Link>
                    <button
                      className={`btn-sm ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleCompare(g.id)}
                      title="Adicionar ao comparativo (até 3 academias)"
                    >
                      {isSelected ? 'Selecionada' : 'Comparar'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
        </div>

        {recent}
      </main>

      <div className={`compare-bar ${selected.length >= 2 ? 'show' : ''}`}>
        <span className="mono">{selected.length} selecionadas para comparar</span>
        <button onClick={() => setCompareOpen(true)}>Comparar</button>
        <button className="clear" onClick={() => setSelected([])}>
          Limpar
        </button>
      </div>

      <div className={`overlay ${compareOpen ? 'show' : ''}`} onClick={(e) => e.target === e.currentTarget && setCompareOpen(false)}>
        <div className="modal" style={{ maxWidth: 900 }}>
          <div className="modal-head">
            <h2>Comparativo</h2>
            <button className="modal-close" onClick={() => setCompareOpen(false)}>
              &times;
            </button>
          </div>
          <div className="modal-body" style={{ overflowX: 'auto' }}>
            {chosen.length > 0 && <CompareTable gyms={chosen} ratings={ratings} />}
          </div>
        </div>
      </div>

      {quizOpen && <QuizFinder gyms={gyms} bairros={bairros} ratings={ratings} onClose={() => setQuizOpen(false)} />}
    </>
  );
}

// "Encontre sua academia" -- um filtro guiado em 3 perguntas sobre os MESMOS
// dados reais já carregados na página (sem nenhuma chamada nova ao banco, sem
// nenhum dado inventado). O resultado é sempre academias de verdade, nunca um
// exemplo fictício -- se nada bater com as respostas, a tela diz isso
// claramente em vez de forçar uma recomendação.
function QuizFinder({
  gyms,
  bairros,
  ratings,
  onClose,
}: {
  gyms: GymSummary[];
  bairros: string[];
  ratings: Map<string, { avg: number; count: number } | null>;
  onClose: () => void;
}) {
  const [bairroPref, setBairroPref] = useState('');
  const [orcamento, setOrcamento] = useState('');
  const [convenio, setConvenio] = useState<'qualquer' | 'gympass' | 'totalpass'>('qualquer');

  const ORCAMENTO_OPTIONS = [
    { label: 'Até R$ 100', max: 100 },
    { label: 'Até R$ 130', max: 130 },
    { label: 'Até R$ 160', max: 160 },
    { label: 'Sem limite', max: Infinity },
  ];

  const resultados = useMemo(() => {
    const maxPreco = ORCAMENTO_OPTIONS.find((o) => o.label === orcamento)?.max ?? Infinity;
    return gyms
      .filter((g) => {
        if (bairroPref && g.bairro !== bairroPref) return false;
        if (g.mensalidade != null && g.mensalidade > maxPreco) return false;
        if (convenio === 'gympass' && g.gympass !== 'SIM') return false;
        if (convenio === 'totalpass' && g.totalpass !== 'SIM') return false;
        return true;
      })
      .sort((a, b) => {
        const ra = ratings.get(a.id);
        const rb = ratings.get(b.id);
        if (ra && rb) return rb.avg - ra.avg;
        if (ra && !rb) return -1;
        if (!ra && rb) return 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 5);
  }, [gyms, bairroPref, orcamento, convenio, ratings]);

  const answered = bairroPref !== '' || orcamento !== '' || convenio !== 'qualquer';

  return (
    <div className="overlay show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-head">
          <h2>🎯 Encontre sua academia</h2>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            &times;
          </button>
        </div>
        <div className="modal-body">
          <p className="note" style={{ marginTop: 0, fontStyle: 'normal' }}>
            Responda o que fizer sentido pra você — o resultado é sempre academia de verdade já cadastrada, com os
            dados reais dela.
          </p>
          <div className="form-grid">
            <label htmlFor="quiz-bairro">Bairro preferido</label>
            <select id="quiz-bairro" value={bairroPref} onChange={(e) => setBairroPref(e.target.value)}>
              <option value="">Tanto faz</option>
              {bairros.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <label htmlFor="quiz-orcamento">Orçamento mensal</label>
            <select id="quiz-orcamento" value={orcamento} onChange={(e) => setOrcamento(e.target.value)}>
              <option value="">Tanto faz</option>
              {ORCAMENTO_OPTIONS.map((o) => (
                <option key={o.label} value={o.label}>
                  {o.label}
                </option>
              ))}
            </select>

            <label htmlFor="quiz-convenio">Precisa de convênio</label>
            <select id="quiz-convenio" value={convenio} onChange={(e) => setConvenio(e.target.value as typeof convenio)}>
              <option value="qualquer">Tanto faz</option>
              <option value="gympass">Precisa aceitar Gympass</option>
              <option value="totalpass">Precisa aceitar TotalPass</option>
            </select>
          </div>

          {answered && (
            <div style={{ marginTop: 18 }}>
              <h4 style={{ marginTop: 0 }}>
                {resultados.length > 0 ? `${resultados.length} academia(s) combinam` : 'Nenhuma academia combina com isso'}
              </h4>
              {resultados.length === 0 && (
                <p className="note" style={{ marginTop: 0 }}>
                  Tenta afrouxar algum filtro — por exemplo, aumentar o orçamento ou deixar o bairro em &quot;tanto
                  faz&quot;.
                </p>
              )}
              <div className="similar-gyms-list">
                {resultados.map((g) => {
                  const r = ratings.get(g.id);
                  return (
                    <div className="similar-gym-row" key={g.id}>
                      <div>
                        <strong>{g.name}</strong>
                        <div className="similar-gym-meta">
                          {g.bairro} · {r ? `★ ${r.avg.toFixed(1)}${!isTrustedRating(r.count) ? ' (nota em formação)' : ''}` : 'Ainda não avaliada'}{' '}
                          · {g.mensalidade != null ? `${fmtMoney(g.mensalidade)}/mês` : 'Preço não informado'}
                        </div>
                      </div>
                      <Link href={`/academia/${g.slug}`} className="btn-sm" style={{ textDecoration: 'none' }} onClick={onClose}>
                        Ver perfil
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CompareTable({
  gyms,
  ratings,
}: {
  gyms: GymSummary[];
  ratings: Map<string, { avg: number; count: number } | null>;
}) {
  type Row = {
    label: string;
    get: (g: GymSummary) => React.ReactNode;
    numeric?: (g: GymSummary) => number | null;
    lowerIsBetter?: boolean;
  };

  const rows: Row[] = [
    { label: 'Bairro/Quadra', get: (g) => `${g.quadra || '-'} · ${g.bairro}` },
    { label: 'Endereço', get: (g) => g.address },
    { label: 'Telefone', get: (g) => g.phone || '—' },
    {
      label: 'Gympass',
      get: (g) =>
        g.gympass === 'SIM' ? `Sim${g.gympassNivel ? ` (${g.gympassNivel})` : ''}` : g.gympass === 'NAO' ? 'Não' : 'A confirmar',
    },
    {
      label: 'TotalPass',
      get: (g) =>
        g.totalpass === 'SIM'
          ? `Sim${g.totalpassNivel ? ` (${g.totalpassNivel})` : ''}`
          : g.totalpass === 'NAO'
          ? 'Não'
          : 'A confirmar',
    },
    {
      label: 'Nota geral',
      get: (g) => {
        const r = ratings.get(g.id);
        if (!r) return 'Ainda não avaliada';
        return (
          <>
            ★ {r.avg.toFixed(1)} ({r.count} aval.)
            {!isTrustedRating(r.count) && <span className="trust-chip" style={{ display: 'block', marginTop: 4 }}>Nota em formação</span>}
          </>
        );
      },
      numeric: (g) => ratings.get(g.id)?.avg ?? null,
    },
    ...REVIEW_CATEGORIES.map((cat) => ({
      label: cat,
      get: (g: GymSummary) => {
        const v = categoryAverages(g.reviewNotas)[cat];
        return v != null ? `★ ${v.toFixed(1)}` : '—';
      },
      numeric: (g: GymSummary) => categoryAverages(g.reviewNotas)[cat],
    })),
    {
      label: 'Mensalidade',
      get: (g) => (g.mensalidade != null ? fmtMoney(g.mensalidade) : 'A confirmar'),
      numeric: (g) => (g.mensalidade != null ? g.mensalidade : null),
      lowerIsBetter: true,
    },
    {
      label: 'Horários',
      get: (g) =>
        (g.horarios || 'A confirmar').split('\n').map((line, i) => (
          <span key={i}>
            {line}
            <br />
          </span>
        )),
    },
    { label: 'Instagram', get: (g) => (g.instagram ? `@${g.instagram}` : '—') },
  ];

  return (
    <table className="compare">
      <tbody>
        <tr>
          <th className="label"></th>
          {gyms.map((g) => (
            <th className="gname" key={g.id}>
              {g.name}
            </th>
          ))}
        </tr>
        {rows.map((row) => {
          let winnerVal: number | null = null;
          if (row.numeric) {
            const vals = gyms.map((g) => row.numeric!(g)).filter((v): v is number => v != null);
            if (vals.length > 1) winnerVal = row.lowerIsBetter ? Math.min(...vals) : Math.max(...vals);
          }
          return (
            <tr key={row.label}>
              <th className="label">{row.label}</th>
              {gyms.map((g) => {
                const isWinner = row.numeric && winnerVal != null && row.numeric(g) === winnerVal;
                return (
                  <td className={isWinner ? 'compare-winner' : ''} key={g.id}>
                    {row.get(g)}
                    {isWinner ? <span className="winner-badge">✓ melhor</span> : null}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
