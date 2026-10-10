'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getOrCreateSessionId } from '@/lib/session';
import { displayName, getCurrentUser } from '@/lib/auth';
import { REVIEW_CATEGORIES } from '@/lib/gym-helpers';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const COMENTARIO_MAX_LENGTH = 1000;

// O formulário (ReviewForm) só deixa escolher 1-5 estrelas nas categorias
// conhecidas, mas isso é só UX -- quem chama a Server Action diretamente
// (DevTools, curl, script) pode mandar qualquer JSON. Sem essa validação,
// "notas" era gravado no banco sem checagem nenhuma (tipo, chaves, faixa de
// valor), o que dava pra usar pra inflar/zerar médias com valores fora de
// 1-5 ou poluir o registro com categorias/dados arbitrários.
function sanitizeNotas(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!(REVIEW_CATEGORIES as readonly string[]).includes(key)) continue;
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1 || n > 5) continue;
    out[key] = n;
  }
  return out;
}

// Server Action: roda no servidor, direto a partir do formulário de
// avaliação (ReviewForm, Client Component). Substitui o submitReview()
// do protótipo -- agora com notas por categoria e alunoAtual, salvando
// de verdade no banco em vez de window.storage. Exige login: o nome exibido
// vem sempre da conta autenticada, nunca de texto digitado pelo usuário
// (evita nome falso e mantém "Nome I." consistente em todo o site).
//
// Devolve { ok, error? } em vez de lançar erro para os casos esperados
// (não logado, rate limit, validação, já avaliou). Em produção o Next.js
// troca a mensagem de um erro lançado numa Server Action por um texto
// genérico antes de entregar ao cliente -- então o usuário nunca via o
// motivo real (ex.: "Você já avaliou esta academia"), só um "tente
// novamente" sem explicação nenhuma, e ficava tentando de novo pra sempre
// sem saber que a avaliação anterior já tinha sido salva com sucesso.
// Devolver como valor normal passa pelo caminho de serialização comum do
// React, sem passar pela sanitização de erro -- a mensagem chega inteira.
export async function submitReview(
  gymId: string,
  gymSlug: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: 'Você precisa estar logado para avaliar.' };
  }

  // Já existe um limite de "uma avaliação por usuário por academia" abaixo,
  // mas isso só barra depois de bater no banco; o rate limit evita rajadas
  // de tentativas (ex.: script tentando IDs de academia em sequência).
  const ip = getClientIp();
  if (!checkRateLimit(`review:${user.id}:${ip}`, 20, 10 * 60 * 1000)) {
    return { ok: false, error: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.' };
  }

  const autor = displayName(user.name);
  let comentario = String(formData.get('comentario') || '').trim();
  const alunoAtualRaw = String(formData.get('alunoAtual') || '');
  const notasRaw = String(formData.get('notas') || '{}');

  let notasParsed: unknown = {};
  try {
    notasParsed = JSON.parse(notasRaw);
  } catch {
    notasParsed = {};
  }
  const notas = sanitizeNotas(notasParsed);

  if (Object.keys(notas).length === 0) {
    return { ok: false, error: 'Avalie ao menos uma categoria de 1 a 5 estrelas.' };
  }
  if (!comentario) {
    return { ok: false, error: 'Escreva um comentário curto sobre sua experiência.' };
  }
  if (comentario.length > COMENTARIO_MAX_LENGTH) {
    comentario = comentario.slice(0, COMENTARIO_MAX_LENGTH);
  }

  const alunoAtual = ['SIM', 'JA_FUI', 'NAO'].includes(alunoAtualRaw) ? alunoAtualRaw : undefined;

  // Uma avaliação por usuário por academia -- a conta autenticada já é
  // suficiente pra evitar duplicidade, sem precisar de contato extra.
  const already = await db.review.findFirst({ where: { gymId, userId: user.id } });
  if (already) {
    return { ok: false, error: 'Você já avaliou esta academia.' };
  }

  await db.review.create({
    data: {
      gymId,
      userId: user.id,
      autor,
      comentario,
      notas,
      alunoAtual: alunoAtual as any,
      status: 'PENDING', // só aparece publicamente após aprovação no painel admin
    },
  });

  revalidatePath(`/academia/${gymSlug}`);
  revalidatePath('/');
  return { ok: true };
}

// Porta reportReview() -- marca uma avaliação como denunciada (soma no
// contador reportCount), pra priorização no painel de moderação. Sem
// autenticação (denunciar não deveria exigir login), então o rate limit por
// IP é a única barreira contra um script inflando reportCount em massa.
export async function reportReview(reviewId: string, gymSlug: string) {
  const ip = getClientIp();
  if (!checkRateLimit(`report:${ip}`, 30, 10 * 60 * 1000)) {
    throw new Error('Muitas tentativas. Aguarde alguns minutos e tente de novo.');
  }

  await db.review.update({
    where: { id: reviewId },
    data: { reportCount: { increment: 1 } },
  });
  revalidatePath(`/academia/${gymSlug}`);
}

// Favoritar a partir da própria ficha da academia (mesmo comportamento do
// coração na listagem, ver app/actions.ts).
export async function toggleFavoriteOnGymPage(gymId: string, gymSlug: string) {
  const sessionId = getOrCreateSessionId();
  const existing = await db.favorite.findUnique({ where: { gymId_sessionId: { gymId, sessionId } } });
  if (existing) {
    await db.favorite.delete({ where: { id: existing.id } });
  } else {
    await db.favorite.create({ data: { gymId, sessionId } });
  }
  revalidatePath(`/academia/${gymSlug}`);
  revalidatePath('/');
  return { favorited: !existing };
}
