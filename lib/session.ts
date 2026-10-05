import { cookies } from 'next/headers';
import crypto from 'crypto';

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
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8h

// O valor do cookie NÃO é um sentinela fixo (era "ok" antes -- qualquer um
// que descobrisse o nome do cookie podia forjar acesso de admin definindo
// esse mesmo valor). Agora é "<expiraEm>.<assinatura>", assinado com HMAC-SHA256
// usando ADMIN_PASSWORD como segredo: só quem conhece a senha consegue gerar
// um valor que passe na verificação, e o valor muda a cada login/expiração.
function signAdminToken(expiresAtMs: number): string | null {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return null;
  const payload = String(expiresAtMs);
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export function createAdminToken(): string | null {
  const expiresAtMs = Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000;
  return signAdminToken(expiresAtMs);
}

// Comparação em tempo constante (hash de tamanho fixo) para não vazar,
// via timing, quantos caracteres da assinatura esperada bateram.
function timingSafeStringEqual(a: string, b: string): boolean {
  const ah = crypto.createHash('sha256').update(a).digest();
  const bh = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ah, bh);
}

export function isAdminSession(): boolean {
  const value = cookies().get(ADMIN_COOKIE)?.value;
  if (!value) return false;

  const [payload, sig] = value.split('.');
  if (!payload || !sig) return false;

  const expiresAtMs = Number(payload);
  if (!Number.isFinite(expiresAtMs) || expiresAtMs < Date.now()) return false;

  const expected = signAdminToken(expiresAtMs);
  if (!expected) return false;

  return timingSafeStringEqual(value, expected);
}
