'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getOrCreateSessionId } from '@/lib/session';

// Server Action: roda no servidor, direto a partir do formulário de
// avaliação (ReviewForm, Client Component). Substitui o submitReview()
// do protótipo -- agora com notas por categoria e alunoAtual, salvando
// de verdade no banco em vez de window.storage.
export async function submitReview(gymId: string, gymSlug: string, formData: FormData) {
  const autor = String(formData.get('autor') || '').trim() || 'Anônimo';
  const comentario = String(formData.get('comentario') || '').trim();
  const alunoAtualRaw = String(formData.get('alunoAtual') || '');
  const contatoTipo = String(formData.get('contatoTipo') || 'whatsapp');
  const contatoValor = String(formData.get('contatoValor') || '').trim();
  const notasRaw = String(formData.get('notas') || '{}');

  let notas: Record<string, number> = {};
  try {
    notas = JSON.parse(notasRaw);
  } catch {
    notas = {};
  }

  if (Object.keys(notas).length === 0) {
    throw new Error('Avalie ao menos uma categoria de 1 a 5 estrelas.');
  }
  if (!comentario) {
    throw new Error('Escreva um comentário curto sobre sua experiência.');
  }
  if (!contatoValor) {
    throw new Error('Informe seu WhatsApp ou e-mail para concluir a avaliação.');
  }

  const alunoAtual = ['SIM', 'JA_FUI', 'NAO'].includes(alunoAtualRaw) ? alunoAtualRaw : undefined;

  const gym = await db.gym.findUnique({ where: { id: gymId } });

  await db.review.create({
    data: {
      gymId,
      autor,
      comentario,
      notas,
      alunoAtual: alunoAtual as any,
      status: 'PENDING', // só aparece publicamente após aprovação no painel admin
      contatoTipo,
      contatoValor,
    },
  });

  // Mesmo lead que capturávamos antes, agora persistido de verdade
  await db.lead.create({
    data: {
      nome: autor,
      contatoTipo,
      contatoValor,
      gymNome: gym?.name || gymId,
      origem: 'avaliacao',
    },
  });

  revalidatePath(`/academia/${gymSlug}`);
  revalidatePath('/');
}

// Porta reportReview() -- marca uma avaliação como denunciada (soma no
// contador reportCount), pra priorização no painel de moderação.
export async function reportReview(reviewId: string, gymSlug: string) {
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
