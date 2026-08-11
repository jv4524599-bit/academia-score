import { NextRequest, NextResponse } from 'next/server';

// Início do login com Google (OAuth2 Authorization Code, sem next-auth --
// implementação direta pra não adicionar dependência pesada). Exige as
// variáveis de ambiente GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET; enquanto
// não forem configuradas, redireciona de volta com um aviso em vez de quebrar.
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.redirect(`${url.origin}/?authError=google_not_configured`);
  }

  const returnTo = url.searchParams.get('returnTo') || '/';
  const state = `${crypto.randomUUID()}${crypto.randomUUID()}`;
  const redirectUri = `${url.origin}/api/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  });

  const res = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  res.cookies.set('g_oauth_state', state, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 600 });
  res.cookies.set('g_oauth_return', returnTo, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 600 });
  return res;
}
