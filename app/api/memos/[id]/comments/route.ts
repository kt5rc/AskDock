import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getOptionalString } from '@/lib/validators';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const commentBody = getOptionalString(body?.body, 1500);
  if (!commentBody) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('comments')
    .insert({ memo_id: params.id, author_id: user.id, body: commentBody })
    .select('id, memo_id, author_id, body, is_answer, created_at, updated_at')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}