import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { issueSessionToken, USER_SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Callback do login com Google: troca o code por token, busca o perfil
// (nome, e-mail, foto) direto na API do Google, cria/recupera o usuário
// só com esses dados, e abre a sessão -- sem next-auth, chamadas diretas
// (essas chamadas rodam no servidor da Vercel, que tem acesso normal à
// internet).
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const expectedState = req.cookies.get('g_oauth_state')?.value;
  const returnTo = req.cookies.get('g_oauth_return')?.value || '/';

  function fail(reason: string) {
    const res = NextResponse.redirect(`${url.origin}/?authError=${reason}`);
    res.cookies.delete('g_oauth_state');
    res.cookies.delete('g_oauth_return');
    return res;
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    return fail('google_state');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return fail('google_not_configured');
  }

  const redirectUri = `${url.origin}/api/auth/google/callback`;

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) return fail('google_token');
    const tokenData = await tokenRes.json();

    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!userInfoRes.ok) return fail('google_userinfo');
    const profile: { email?: string; name?: string; picture?: string } = await userInfoRes.json();

    if (!profile.email) return fail('google_no_email');
    const email = profile.email.toLowerCase();

    let user = await db.user.findUnique({ where: { email } });
    if (!user) {
      user = await db.user.create({
        data: {
          name: profile.name || email.split('@')[0],
          email,
          provider: 'GOOGLE',
          image: profile.picture || null,
        },
      });
    }

    const token = await issueSessionToken(user.id);
    const res = NextResponse.redirect(`${url.origin}${returnTo}`);
    res.cookies.set(USER_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    res.cookies.delete('g_oauth_state');
    res.cookies.delete('g_oauth_return');
    return res;
  } catch {
    return fail('google_unexpected');
  }
}
