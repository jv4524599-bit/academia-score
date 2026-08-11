import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Garante que todo visitante tenha um identificador de sessão (cookie "sid"),
// usado para favoritos (Favorite.sessionId) sem exigir cadastro/login.
export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const existing = req.cookies.get('sid')?.value;
  if (!existing) {
    res.cookies.set('sid', crypto.randomUUID(), {
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      path: '/',
    });
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/).*)'],
};
