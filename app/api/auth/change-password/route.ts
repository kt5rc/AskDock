import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getSessionUser, getCookieName, getSessionCookieOptions } from '@/lib/auth';
import { getString } from '@/lib/validators';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rate = checkRateLimit(`pwd:${user.id}`, 6, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const currentPassword = getString(body?.current_password, 200);
  const newPassword = getString(body?.new_password, 200);
  const confirmPassword = getString(body?.confirm_password, 200);

  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
  }

  const { data: userRow, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, password_hash')
    .eq('id', user.id)
    .maybeSingle();

  if (userError || !userRow) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const ok = await bcrypt.compare(currentPassword, userRow.password_hash);
  if (!ok) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({ password_hash: passwordHash })
    .eq('id', user.id);

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }

  await supabaseAdmin.from('sessions').delete().eq('user_id', user.id);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(getCookieName(), '', { ...getSessionCookieOptions(), maxAge: 0 });
  return response;
}
