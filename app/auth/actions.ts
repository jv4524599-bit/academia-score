'use server';

import { db } from '@/lib/db';
import { createUserSession, destroyUserSession, displayName, hashPassword, verifyPassword } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

type AuthResult = { ok: true; displayName: string } | { ok: false; error: string };

// Cadastro por e-mail + senha. Só pede nome, e-mail e senha -- nenhum outro
// dado. A senha nunca é guardada em texto puro (bcrypt).
export async function registerWithPassword(formData: FormData): Promise<AuthResult> {
  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  if (!name || !email || !password) {
    return { ok: false, error: 'Preencha nome, e-mail e senha.' };
  }
  if (!email.includes('@')) {
    return { ok: false, error: 'Informe um e-mail válido.' };
  }
  if (password.length < 6) {
    return { ok: false, error: 'A senha precisa ter pelo menos 6 caracteres.' };
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: 'Já existe uma conta com esse e-mail. Tente entrar.' };
  }

  const passwordHash = await hashPassword(password);
  const user = await db.user.create({
    data: { name, email, passwordHash, provider: 'EMAIL' },
  });

  await createUserSession(user.id);
  revalidatePath('/', 'layout');
  return { ok: true, displayName: displayName(user.name) };
}

export async function loginWithPassword(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  if (!email || !password) {
    return { ok: false, error: 'Informe e-mail e senha.' };
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    return { ok: false, error: 'E-mail ou senha inválidos.' };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { ok: false, error: 'E-mail ou senha inválidos.' };
  }

  await createUserSession(user.id);
  revalidatePath('/', 'layout');
  return { ok: true, displayName: displayName(user.name) };
}

export async function logoutUser(): Promise<void> {
  await destroyUserSession();
  revalidatePath('/', 'layout');
}
