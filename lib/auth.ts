import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

// Sistema de conta de usuário (visitante que quer avaliar uma academia).
// Guarda só nome, e-mail e provedor de login -- nada além disso. Sessão
// baseada em tabela própria (Session), não JWT: mesma filosofia do cookie
// "sid" (favoritos) e "admin_session" (painel) já usados no projeto, só que
// agora com registro no banco para permitir revogar sessões.
export const USER_SESSION_COOKIE = 'us';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 dias

function randomToken(): string {
  return `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, '');
}

// Cria a sessão no banco e devolve o token -- quem chama decide como
// escrever o cookie (cookies().set() em Server Action, res.cookies.set()
// em Route Handler, já que os dois contextos gravam cookie de formas diferentes).
export async function issueSessionToken(userId: string): Promise<string> {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  await db.session.create({ data: { token, userId, expiresAt } });
  return token;
}

// Usado dentro de Server Actions (login/cadastro por e-mail+senha), onde
// cookies().set() é permitido.
export async function createUserSession(userId: string): Promise<void> {
  const token = await issueSessionToken(userId);
  cookies().set(USER_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroyUserSession(): Promise<void> {
  const token = cookies().get(USER_SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { token } }).catch(() => {});
  }
  cookies().delete(USER_SESSION_COOKIE);
}

// Lê o usuário logado (Server Components e Server Actions). Só leitura --
// não apaga sessão expirada aqui (isso exigiria escrita de cookie, que só
// é permitido em Server Actions/Route Handlers).
export async function getCurrentUser() {
  const token = cookies().get(USER_SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({ where: { token }, include: { user: true } });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) return null;

  return session.user;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Nome exibido publicamente numa avaliação: "Primeiro I." -- nunca o nome
// completo, nunca o e-mail. Ex: "João Vitor" -> "João V."
export function displayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Usuário';
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${first} ${lastInitial}.`;
}
