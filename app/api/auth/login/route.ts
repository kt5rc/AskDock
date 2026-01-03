import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { checkRateLimit } from '@/lib/rateLimit';
import { getSessionCookieOptions, getCookieName, getSessionDays } from '@/lib/auth';
import { getString } from '@/lib/validators';

export async function POST(req: Request) {
  const ip = headers().get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rate = checkRateLimit(`login:${ip}`, 8, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const username = getString(body?.username, 50);
  const password = getString(body?.password, 200);
  if (!username || !password) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, username, password_hash, display_name, role')
    .eq('username', username)
    .maybeSingle();

  if (error || !user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const expiresAt = new Date(Date.now() + getSessionDays() * 24 * 60 * 60 * 1000);
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('sessions')
    .insert({ user_id: user.id, expires_at: expiresAt.toISOString() })
    .select('id')
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }

  const response = NextResponse.json({
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    role: user.role
  });
  response.cookies.set(getCookieName(), session.id, getSessionCookieOptions());
  return response;
}