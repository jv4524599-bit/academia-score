import { headers } from 'next/headers';

// Limitador de tentativas em memória -- barra scripts de força bruta óbvios
// contra login (admin e usuário) sem precisar de infraestrutura extra
// (Redis/KV). Limitação conhecida: em produção na Vercel cada instância de
// função serverless tem sua própria memória, então isso não é uma garantia
// global (um atacante distribuído entre várias instâncias/regiões pode
// escapar do limite). Para uma defesa robusta de verdade, configure uma
// regra de rate limit no Firewall da Vercel (Project Settings > Security)
// para a rota /admin e para as Server Actions de login -- isso funciona no
// edge, antes mesmo da requisição chegar aqui.
const buckets = new Map<string, { count: number; resetAt: number }>();

// Evita crescimento sem limite do Map ao longo da vida da instância.
const MAX_TRACKED_KEYS = 5000;

export function checkRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || entry.resetAt < now) {
    if (buckets.size >= MAX_TRACKED_KEYS) buckets.clear();
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxAttempts) return false;

  entry.count += 1;
  return true;
}

// Identificador best-effort do chamador, a partir dos headers de proxy da
// Vercel. Nunca confiar nisso para autorização -- só para throttling.
export function getClientIp(): string {
  const h = headers();
  const forwarded = h.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return h.get('x-real-ip') || 'unknown';
}
