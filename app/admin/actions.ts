'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { ADMIN_COOKIE, isAdminSession } from '@/lib/session';

// Porta checkAdminPassword() do protótipo -- só que a senha (mesma,
// "patriotasftc", vinda de process.env.ADMIN_PASSWORD) agora é conferida
// no servidor, nunca exposta no bundle JS do cliente.
export async function loginAdmin(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const password = String(formData.get('password') || '');
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected || password !== expected) {
    return { ok: false, error: 'Senha incorreta.' };
  }

  cookies().set(ADMIN_COOKIE, 'ok', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8h
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
