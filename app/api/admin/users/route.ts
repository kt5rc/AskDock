import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, username, display_name, role, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
  }

  return NextResponse.json({ users: data || [] });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const userId = typeof body?.id === 'string' ? body.id : null;
  if (!userId) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  if (userId === user.id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
  }

  const { data: systemUser, error: systemError } = await supabaseAdmin
    .from('users')
    .select('id, username')
    .eq('username', 'system')
    .maybeSingle();

  if (systemError || !systemUser) {
    return NextResponse.json({ error: 'System user not found' }, { status: 500 });
  }

  const { data: target, error: targetError } = await supabaseAdmin
    .from('users')
    .select('id, username')
    .eq('id', userId)
    .maybeSingle();

  if (targetError || !target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (target.username === systemUser.username) {
    return NextResponse.json({ error: 'Cannot delete system user' }, { status: 400 });
  }

  const { data: memoRows, error: memoError } = await supabaseAdmin
    .from('memos')
    .select('id, title')
    .eq('author_id', userId);

  if (memoError) {
    return NextResponse.json({ error: 'Failed to load user memos' }, { status: 500 });
  }

  const memoIds = (memoRows || []).map((row) => row.id);

  const { error: commentUpdateError } = await supabaseAdmin
    .from('comments')
    .update({ author_id: systemUser.id })
    .eq('author_id', userId);

  if (commentUpdateError) {
    return NextResponse.json({ error: 'Failed to migrate comments' }, { status: 500 });
  }

  const { error: memoUpdateError } = await supabaseAdmin
    .from('memos')
    .update({ author_id: systemUser.id })
    .eq('author_id', userId);

  if (memoUpdateError) {
    return NextResponse.json({ error: 'Failed to migrate memos' }, { status: 500 });
  }

  if (memoIds.length > 0) {
    const migrationComments = memoIds.map((memoId) => ({
      memo_id: memoId,
      author_id: systemUser.id,
      body: `Migrated from ${target.username}. Original author removed.`,
      is_answer: false
    }));
    const { error: insertError } = await supabaseAdmin.from('comments').insert(migrationComments);
    if (insertError) {
      return NextResponse.json({ error: 'Failed to add migration comments' }, { status: 500 });
    }
  }

  for (const memo of memoRows || []) {
    const title = memo.title || '';
    if (title.startsWith('[MIGRATED]')) continue;
    const nextTitle = `[MIGRATED] ${title}`.trim();
    const { error: titleError } = await supabaseAdmin
      .from('memos')
      .update({ title: nextTitle })
      .eq('id', memo.id);
    if (titleError) {
      return NextResponse.json({ error: 'Failed to update memo titles' }, { status: 500 });
    }
  }

  const { error: deleteError } = await supabaseAdmin.from('users').delete().eq('id', userId);
  if (deleteError) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
