// Funções puras portadas do protótipo (script_extracted.js) -- podem ser
// importadas tanto em Server Components quanto em Client Components,
// pois não usam nenhuma API de navegador.

// Única cidade ativa por enquanto (mesma ideia do CURRENT_CITY do protótipo,
// preparado pra expansão: cada cidade nova só precisa de uma linha na tabela City).
export const CURRENT_CITY_SLUG = 'valparaiso-go';

export const REVIEW_CATEGORIES = [
  'Equipamentos',
  'Estacionamento',
  'Limpeza',
  'Custo-benefício',
  'Atendimento',
  'Organização',
  'Lotação',
  'Ar-condicionado',
] as const;

export type ReviewCategory = (typeof REVIEW_CATEGORIES)[number];

export type StatusStr = 'SIM' | 'NAO' | 'A_CONFIRMAR';

// Média das notas (por categoria) de UMA avaliação.
export function reviewAvg(notas: Record<string, number> | null | undefined): number {
  if (!notas) return 0;
  const vals = Object.values(notas).filter((v) => typeof v === 'number');
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

// Nota em estrelas (0-5) convertida pra escala 0-10, como no protótipo.
export function score10(avgStars: number): string {
  return (avgStars * 2).toFixed(1);
}

// Nota média (0-5) e contagem de avaliações a partir de uma lista de `notas`.
export function avgRatingFromNotas(
  notasList: Array<Record<string, number>>
): { avg: number; count: number } | null {
  if (notasList.length === 0) return null;
  const sum = notasList.reduce((a, notas) => a + reviewAvg(notas), 0);
  return { avg: sum / notasList.length, count: notasList.length };
}

// Média por categoria (usada no comparador e nas fichas de academia).
export function categoryAverages(notasList: Array<Record<string, number>>): Record<string, number | null> {
  const result: Record<string, number | null> = {};
  REVIEW_CATEGORIES.forEach((cat) => {
    const vals = notasList.map((n) => n[cat]).filter((v): v is number => typeof v === 'number');
    result[cat] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  });
  return result;
}

export function badgeClass(status: StatusStr): string {
  return status === 'SIM' ? 'sim' : status === 'NAO' ? 'nao' : 'a_confirmar';
}

export function badgeText(label: string, status: StatusStr, nivel?: string | null): string {
  let text =
    status === 'SIM' ? `${label}: sim` : status === 'NAO' ? `${label}: não` : `${label}: a confirmar`;
  if (status === 'SIM' && nivel) text += ` (${nivel})`;
  return text;
}

export function normalizeText(s: string | null | undefined): string {
  return (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// Removido: gerador de "histórico de nota" simulado (baseado em hash do id,
// sem nenhum dado real por trás). Mostrar isso como se fosse um gráfico
// real violaria a regra de nunca exibir dado fictício como se fosse real.
// Quando houver histórico de nota real (snapshots ao longo do tempo), essa
// função pode voltar, lendo do banco em vez de simular.

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// "Ideal para" -- heurística simples portada do protótipo (só um caso
// especial hardcoded pra Crown, o resto cai no valor padrão).
export function idealParaBadges(gymSlug: string): string[] {
  if (gymSlug === 'crown-valparaiso') return ['🏋️ Crossfit'];
  return ['💪 Hipertrofia'];
}

export function fmtMoney(v: number): string {
  return `R$ ${v.toFixed(2).replace('.', ',')}`;
}

export function fmtDatePtBr(iso: string | Date): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

export const ALUNO_LABEL: Record<string, string> = {
  SIM: '✅ Aluno(a) atual',
  JA_FUI: '🕓 Já foi aluno(a)',
  NAO: '👀 Apenas visitou',
};
