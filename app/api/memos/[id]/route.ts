import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getOptionalString } from '@/lib/validators';

const allowedStatus = new Set(['open', 'solved']);
const allowedCategory = new Set(['env', 'frontend', 'backend', 'db', 'git', 'other', 'chat']);

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const memoId = params.id;

  const { data: memo, error: memoError } = await supabaseAdmin
    .from('memos')
    .select(
      'id, title, body, category, status, assignee_id, author_id, created_at, updated_at, solved_at, author:users!memos_author_id_fkey(id, username, display_name, role)'
    )
    .eq('id', memoId)
    .maybeSingle();

  if (memoError || !memo) {
    return NextResponse.json({ error: 'Memo not found' }, { status: 404 });
  }

  const { data: comments, error: commentError } = await supabaseAdmin
    .from('comments')
    .select('id, memo_id, author_id, body, is_answer, created_at, updated_at, author:users!comments_author_id_fkey(id, username, display_name, role)')
    .eq('memo_id', memoId)
    .order('created_at', { ascending: true });

  if (commentError) {
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 });
  }

  return NextResponse.json({ memo, comments: comments || [] });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const memoId = params.id;
  const { data: memo, error: memoError } = await supabaseAdmin
    .from('memos')
    .select('id, author_id, status')
    .eq('id', memoId)
    .maybeSingle();

  if (memoError || !memo) {
    return NextResponse.json({ error: 'Memo not found' }, { status: 404 });
  }

  const isAdmin = user.role === 'admin';
  if (!isAdmin && memo.author_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const title = getOptionalString(body?.title, 120);
  const memoBody = getOptionalString(body?.body, 2000);
  const category = getOptionalString(body?.category, 20);
  const status = getOptionalString(body?.status, 10);

  if (category && !allowedCategory.has(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }

  if (status && !allowedStatus.has(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  if (status && !isAdmin && memo.author_id !== user.id) {
    return NextResponse.json({ error: 'Only admin or author can change status' }, { status: 403 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  };

  if (title) updates.title = title;
  if (memoBody) updates.body = memoBody;
  if (category) updates.category = category;
  if (status) {
    updates.status = status;
    updates.solved_at = status === 'solved' ? new Date().toISOString() : null;
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('memos')
    .update(updates)
    .eq('id', memoId)
    .select('id, title, body, category, status, assignee_id, author_id, created_at, updated_at, solved_at')
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ error: 'Failed to update memo' }, { status: 500 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const memoId = params.id;
  const { data: memo, error: memoError } = await supabaseAdmin
    .from('memos')
    .select('id, author_id')
    .eq('id', memoId)
    .maybeSingle();

  if (memoError || !memo) {
    return NextResponse.json({ error: 'Memo not found' }, { status: 404 });
  }

  const isAdmin = user.role === 'admin';
  if (!isAdmin && memo.author_id !== user.id) {
    return NextResponse.json({ error: 'Only admin or author can delete memo' }, { status: 403 });
  }

  const { error: deleteError } = await supabaseAdmin.from('memos').delete().eq('id', memoId);
  if (deleteError) {
    return NextResponse.json({ error: 'Failed to delete memo' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
