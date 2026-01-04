import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSessionUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getString } from '@/lib/validators';
import { checkRateLimit } from '@/lib/rateLimit';

const allowedRoles = new Set(['admin', 'user']);

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rate = checkRateLimit(`admin-create:${user.id}`, 6, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const username = getString(body?.username, 50);
  const displayName = getString(body?.display_name, 12);
  const password = getString(body?.password, 200);
  const role = getString(body?.role, 10);

  if (!username || !displayName || !password || !role) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  if (!allowedRoles.has(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert({
      username,
      display_name: displayName,
      password_hash: passwordHash,
      role
    })
    .select('id, username, display_name, role, created_at')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }

  return NextResponse.json({ user: data });
}
