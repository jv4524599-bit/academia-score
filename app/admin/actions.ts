'use server';

import crypto from 'crypto';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { ADMIN_COOKIE, ADMIN_SESSION_MAX_AGE_SECONDS, createAdminToken, isAdminSession } from '@/lib/session';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// Comparação em tempo constante: evita que um atacante infira a senha
// caractere-a-caractere medindo quanto tempo cada tentativa leva (timing
// attack). Compara hashes de tamanho fixo em vez das strings originais,
// para não vazar nem o tamanho da senha certa via timingSafeEqual.
function safeCompare(a: string, b: string): boolean {
  const ah = crypto.createHash('sha256').update(a).digest();
  const bh = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ah, bh);
}

// Porta checkAdminPassword() do protótipo -- a senha (vinda de
// process.env.ADMIN_PASSWORD) é conferida no servidor, nunca exposta no
// bundle JS do cliente. Limite de tentativas por IP + comparação em tempo
// constante pra dificultar força bruta (ver lib/rate-limit.ts sobre as
// limitações desse limitador em memória).
export async function loginAdmin(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const ip = getClientIp();
  const allowed = checkRateLimit(`admin-login:${ip}`, 5, 10 * 60 * 1000);
  if (!allowed) {
    return { ok: false, error: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.' };
  }

  const password = String(formData.get('password') || '');
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected || !safeCompare(password, expected)) {
    return { ok: false, error: 'Senha incorreta.' };
  }

  const token = createAdminToken();
  if (!token) {
    return { ok: false, error: 'Login de admin não configurado no servidor.' };
  }

  cookies().set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    path: '/',
  });

  return { ok: true };
}

export async function logoutAdmin() {
  cookies().delete(ADMIN_COOKIE);
  revalidatePath('/admin');
}

// As três ações de moderação abaixo portam moderateReview()/deleteReview()
// do protótipo. Cada uma confere a sessão de admin de novo no servidor
// (defesa em profundidade -- não confiar só na página ter escondido o botão).
export async function approveReview(reviewId: string) {
  if (!isAdminSession()) throw new Error('Não autorizado.');
  const review = await db.review.update({ where: { id: reviewId }, data: { status: 'APPROVED' } });
  await revalidateAfterModeration(review.gymId);
}

export async function rejectReview(reviewId: string) {
  if (!isAdminSession()) throw new Error('Não autorizado.');
  const review = await db.review.update({ where: { id: reviewId }, data: { status: 'REJECTED' } });
  await revalidateAfterModeration(review.gymId);
}

export async function deleteReview(reviewId: string) {
  if (!isAdminSession()) throw new Error('Não autorizado.');
  const review = await db.review.delete({ where: { id: reviewId } });
  await revalidateAfterModeration(review.gymId);
}

async function revalidateAfterModeration(gymId: string) {
  const gym = await db.gym.findUnique({ where: { id: gymId } });
  revalidatePath('/admin');
  revalidatePath('/');
  if (gym) revalidatePath(`/academia/${gym.slug}`);
}
