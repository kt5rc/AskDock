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
  const sort = getOptionalString(searchParams.get('sort'), 4);
  const limit = clampNumber(searchParams.get('limit'), 1, 50, 50);

  const applySearchFilters = (query: ReturnType<typeof supabaseAdmin.from>) => {
    let next = query;
    if (category && allowedCategory.has(category)) {
      next = next.eq('category', category);
    }
    if (q) {
      next = next.or(`title.ilike.%${q}%,body.ilike.%${q}%`);
    }
    return next;
  };

  let query = supabaseAdmin
    .from('memos')
    .select(
      'id, title, body, category, status, assignee_id, author_id, created_at, updated_at, solved_at, author:users!memos_author_id_fkey(id, username, display_name, role), comments:comments(created_at)'
    )
    .order('updated_at', { ascending: sort === 'asc' })
    .limit(limit);

  query = applySearchFilters(query);

  if (status && allowedStatus.has(status)) {
    query = query.eq('status', status);
  }

  if (owned === '1' || owned === 'true') {
    query = query.eq('author_id', user.id);
  }

  if (cursor) {
    query = query.lt('updated_at', cursor);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: 'Failed to load memos' }, { status: 500 });
  }

  const memos =
    data?.map((memo) => {
      const comments = (memo as { comments?: Array<{ created_at: string }> }).comments || [];
      const commentCount = comments.length;
      const latest =
        commentCount === 0
          ? null
          : comments
              .map((comment) => comment.created_at)
              .reduce((a, b) => (a > b ? a : b));
      const { comments: _comments, ...rest } = memo as Record<string, unknown>;
      return { ...rest, comment_count: commentCount, comment_latest_at: latest };
    }) || [];

  const nextCursor = data && data.length === limit ? data[data.length - 1].updated_at : null;

  const [allCount, openCount, solvedCount, ownedCount] = await Promise.all([
    applySearchFilters(
      supabaseAdmin.from('memos').select('id', { count: 'exact', head: true })
    ),
    applySearchFilters(
      supabaseAdmin.from('memos').select('id', { count: 'exact', head: true })
    ).eq('status', 'open'),
    applySearchFilters(
      supabaseAdmin.from('memos').select('id', { count: 'exact', head: true })
    ).eq('status', 'solved'),
    applySearchFilters(
      supabaseAdmin.from('memos').select('id', { count: 'exact', head: true })
    ).eq('author_id', user.id)
  ]);

  if (allCount.error || openCount.error || solvedCount.error || ownedCount.error) {
    return NextResponse.json({ error: 'Failed to load counts' }, { status: 500 });
  }

  return NextResponse.json({
    memos,
    nextCursor,
    counts: {
      all: allCount.count ?? 0,
      open: openCount.count ?? 0,
      solved: solvedCount.count ?? 0,
      owned: ownedCount.count ?? 0
    }
  });
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
