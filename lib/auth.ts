import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export type SessionUser = {
  id: string;
  username: string;
  display_name: string;
  role: 'admin' | 'user';
};

export function getCookieName() {
  return process.env.APP_COOKIE_NAME || 'sid';
}

export function getSessionDays() {
  const raw = process.env.APP_SESSION_DAYS;
  const days = raw ? Number(raw) : 14;
  return Number.isFinite(days) && days > 0 ? days : 14;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieName = getCookieName();
  const cookie = cookies().get(cookieName);
  if (!cookie?.value) return null;

  const { data: session, error } = await supabaseAdmin
    .from('sessions')
    .select('id, expires_at, user:users!sessions_user_id_fkey(id, username, display_name, role)')
    .eq('id', cookie.value)
    .maybeSingle();

  if (error || !session || !session.user) return null;

  const expiresAt = new Date(session.expires_at);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    await supabaseAdmin.from('sessions').delete().eq('id', cookie.value);
    return null;
  }

  return session.user as SessionUser;
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: getSessionDays() * 24 * 60 * 60
  };
}