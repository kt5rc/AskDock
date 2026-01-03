import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCookieName, getSessionCookieOptions } from '@/lib/auth';

export async function POST() {
  const cookieName = getCookieName();
  const cookie = cookies().get(cookieName);
  if (cookie?.value) {
    await supabaseAdmin.from('sessions').delete().eq('id', cookie.value);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieName, '', { ...getSessionCookieOptions(), maxAge: 0 });
  return response;
}