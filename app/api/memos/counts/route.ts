import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getOptionalString } from '@/lib/validators';

const allowedCategory = new Set(['env', 'frontend', 'backend', 'db', 'git', 'other', 'chat']);

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = getOptionalString(searchParams.get('category'), 20);
  const q = getOptionalString(searchParams.get('q'), 120);

  const applySearchFilters = (query: any) => {
    let next = query;
    if (category && allowedCategory.has(category)) {
      next = next.eq('category', category);
    }
    if (q) {
      next = next.or(`title.ilike.%${q}%,body.ilike.%${q}%`);
    }
    return next;
  };

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
    all: allCount.count ?? 0,
    open: openCount.count ?? 0,
    solved: solvedCount.count ?? 0,
    owned: ownedCount.count ?? 0
  });
}
