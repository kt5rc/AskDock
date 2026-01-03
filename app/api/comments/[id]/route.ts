import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getOptionalString } from '@/lib/validators';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: comment, error: commentError } = await supabaseAdmin
    .from('comments')
    .select('id, author_id')
    .eq('id', params.id)
    .maybeSingle();

  if (commentError || !comment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  const isAdmin = user.role === 'admin';
  if (!isAdmin && comment.author_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const nextBody = getOptionalString(body?.body, 1500);
  const isAnswer = typeof body?.is_answer === 'boolean' ? body.is_answer : null;

  if (isAnswer !== null && !isAdmin) {
    return NextResponse.json({ error: 'Only admin can set answer' }, { status: 403 });
  }

  if (!nextBody && isAnswer === null) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  };
  if (nextBody) updates.body = nextBody;
  if (isAnswer !== null) updates.is_answer = isAnswer;

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('comments')
    .update(updates)
    .eq('id', params.id)
    .select('id, memo_id, author_id, body, is_answer, created_at, updated_at')
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: comment, error: commentError } = await supabaseAdmin
    .from('comments')
    .select('id, author_id')
    .eq('id', params.id)
    .maybeSingle();

  if (commentError || !comment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  if (comment.author_id !== user.id) {
    return NextResponse.json({ error: 'Only author can delete comment' }, { status: 403 });
  }

  const { error: deleteError } = await supabaseAdmin.from('comments').delete().eq('id', params.id);
  if (deleteError) {
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
