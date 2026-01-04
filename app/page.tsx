import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { MemoWithAuthor } from "@/types/db";
import HomeClient from "@/components/home-client";

const DEFAULT_LIMIT = 50;

async function loadInitialData(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("memos")
    .select(
      "id, title, body, category, status, assignee_id, author_id, created_at, updated_at, solved_at, author:users!memos_author_id_fkey(id, username, display_name, role), comments:comments(created_at)"
    )
    .eq("status", "open")
    .order("updated_at", { ascending: false })
    .limit(DEFAULT_LIMIT);

  if (error || !data) {
    return {
      memos: [] as MemoWithAuthor[],
      counts: { all: 0, open: 0, solved: 0, owned: 0 },
    };
  }

  const memos = data.map((memo) => {
    const comments = (memo as { comments?: Array<{ created_at: string }> }).comments || [];
    const commentCount = comments.length;
    const latest =
      commentCount === 0
        ? null
        : comments
            .map((comment) => comment.created_at)
            .reduce((a, b) => (a > b ? a : b));
    const { comments: _comments, ...rest } = memo as Record<string, unknown>;
    return { ...rest, comment_count: commentCount, comment_latest_at: latest } as MemoWithAuthor;
  });

  const [allCount, openCount, solvedCount, ownedCount] = await Promise.all([
    supabaseAdmin.from("memos").select("id", { count: "exact", head: true }),
    supabaseAdmin
      .from("memos")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    supabaseAdmin
      .from("memos")
      .select("id", { count: "exact", head: true })
      .eq("status", "solved"),
    supabaseAdmin
      .from("memos")
      .select("id", { count: "exact", head: true })
      .eq("author_id", userId),
  ]);

  return {
    memos,
    counts: {
      all: allCount.count ?? 0,
      open: openCount.count ?? 0,
      solved: solvedCount.count ?? 0,
      owned: ownedCount.count ?? 0,
    },
  };
}

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const initialData = await loadInitialData(user.id);

  return <HomeClient initialUser={user} initialData={initialData} />;
}