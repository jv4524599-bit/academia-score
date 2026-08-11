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
  trust,
  premium,
  recent,
}: {
  gyms: GymSummary[];
  bairros: string[];
  initialCompare: string[];
  top3: React.ReactNode;
  trust: React.ReactNode;
  premium: React.ReactNode;
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

  useEffect(() => {
    if (validInitialCompare.length >= 2) setCompareOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <section className="hero-search">
        <div className="hero-search-inner">
          <h2>Encontre sua academia</h2>
          <div className="hero-search-box">
            <span className="search-icon">🔍</span>
            <input
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
        {trust}

        <div className="filters section-block">
          <select value={bairro} onChange={(e) => setBairro(e.target.value)}>
            <option value="">Todos os bairros</option>
            {bairros.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <label>
            <input type="checkbox" checked={wantGympass} onChange={(e) => setWantGympass(e.target.checked)} /> Aceita
            Gympass
          </label>
          <label>
            <input type="checkbox" checked={wantTotalpass} onChange={(e) => setWantTotalpass(e.target.checked)} />{' '}
            Aceita TotalPass
          </label>
          <label>
            <input type="checkbox" checked={wantFavorites} onChange={(e) => setWantFavorites(e.target.checked)} /> ❤️
            Só favoritas
          </label>
          <span className="count-tag">{filtered.length} academia(s)</span>
        </div>

        {premium}

        <div>
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
                      </>
                    ) : (
                      <span className="count">Sem avaliações ainda</span>
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
    </>
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
        return r ? `★ ${r.avg.toFixed(1)} (${r.count} aval.)` : 'Sem avaliações';
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
