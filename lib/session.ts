import { cookies } from 'next/headers';

// Lê o id de sessão (cookie "sid") em Server Components -- só leitura,
// não pode gravar cookie fora de Server Actions/Route Handlers.
export function getSessionId(): string | null {
  return cookies().get('sid')?.value ?? null;
}

// Versão usada dentro de Server Actions: garante que sempre exista um id,
// criando o cookie na hora se o middleware ainda não tiver rodado
// (ex.: primeiríssima requisição do visitante).
export function getOrCreateSessionId(): string {
  const store = cookies();
  let sid = store.get('sid')?.value;
  if (!sid) {
    sid = crypto.randomUUID();
    store.set('sid', sid, { maxAge: 60 * 60 * 24 * 365, sameSite: 'lax', path: '/' });
  }
  return sid;
}

// Cookie de sessão do painel de administração.
export const ADMIN_COOKIE = 'admin_session';

export function isAdminSession(): boolean {
  return cookies().get(ADMIN_COOKIE)?.value === 'ok';
}
