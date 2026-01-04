import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSessionUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getString } from '@/lib/validators';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rate = checkRateLimit(`admin-reset:${user.id}`, 10, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const newPassword = getString(body?.new_password, 200);
  const confirmPassword = getString(body?.confirm_password, 200);

  if (!newPassword || !confirmPassword) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({ password_hash: passwordHash })
    .eq('id', params.id);

  if (updateError) {
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }

  await supabaseAdmin.from('sessions').delete().eq('user_id', params.id);

  return NextResponse.json({ ok: true });
}
