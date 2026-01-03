import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { clampNumber, getOptionalString } from '@/lib/validators';

const allowedStatus = new Set(['open', 'solved']);
const allowedCategory = new Set(['env', 'frontend', 'backend', 'db', 'git', 'other', 'chat']);

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = getOptionalString(searchParams.get('status'), 10);
  const owned = getOptionalString(searchParams.get('owned'), 5);
  const category = getOptionalString(searchParams.get('category'), 20);
  const q = getOptionalString(searchParams.get('q'), 120);
  const cursor = getOptionalString(searchParams.get('cursor'), 40);
  const limit = clampNumber(searchParams.get('limit'), 1, 50, 50);

  let query = supabaseAdmin
    .from('memos')
    .select(
      'id, title, body, category, status, assignee_id, author_id, created_at, updated_at, solved_at, author:users!memos_author_id_fkey(id, username, display_name, role)'
    )
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (status && allowedStatus.has(status)) {
    query = query.eq('status', status);
  }

  if (owned === '1' || owned === 'true') {
    query = query.eq('author_id', user.id);
  }

  if (category && allowedCategory.has(category)) {
    query = query.eq('category', category);
  }

  if (q) {
    query = query.or(`title.ilike.%${q}%,body.ilike.%${q}%`);
  }

  if (cursor) {
    query = query.lt('updated_at', cursor);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: 'Failed to load memos' }, { status: 500 });
  }

  const nextCursor = data && data.length === limit ? data[data.length - 1].updated_at : null;

  return NextResponse.json({ memos: data || [], nextCursor });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const title = getOptionalString(body?.title, 120);
  const memoBody = getOptionalString(body?.body, 2000);
  const category = getOptionalString(body?.category, 20);

  if (!title || !memoBody || !category || !allowedCategory.has(category)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('memos')
    .insert({
      author_id: user.id,
      title,
      body: memoBody,
      category
    })
    .select('id, title, body, category, status, assignee_id, author_id, created_at, updated_at, solved_at')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to create memo' }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
