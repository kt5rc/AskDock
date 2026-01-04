"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CommentForm } from "@/components/comment-form";
import { CommentList } from "@/components/comment-list";
import { MemoEditor } from "@/components/memo-editor";
import type { CommentWithAuthor, MemoWithAuthor, UserPublic } from "@/types/db";
import { cn } from "@/lib/utils";

const categoryLabel: Record<string, string> = {
  env: "Env",
  frontend: "Frontend",
  backend: "Backend",
  db: "DB",
  git: "Git",
  other: "Other",
  chat: "Chat",
};

const categoryClass: Record<string, string> = {
  env: "border-sky-500/40 bg-sky-500/15 text-sky-200",
  frontend: "border-indigo-500/40 bg-indigo-500/15 text-indigo-200",
  backend: "border-cyan-500/40 bg-cyan-500/15 text-cyan-200",
  db: "border-lime-500/40 bg-lime-500/15 text-lime-200",
  git: "border-rose-500/40 bg-rose-500/15 text-rose-200",
  other: "border-stone-500/40 bg-stone-500/15 text-stone-200",
  chat: "border-blue-500/40 bg-blue-500/15 text-blue-200",
};

function formatDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function MemoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const memoId = params?.id as string;
  const [user, setUser] = useState<UserPublic | null>(null);
  const [memo, setMemo] = useState<MemoWithAuthor | null>(null);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.replace("/login");
        return;
      }
      const data = (await res.json()) as UserPublic;
      setUser(data);
    };
    loadUser();
  }, [router]);

  const loadMemo = async () => {
    setLoading(true);
    const res = await fetch(`/api/memos/${memoId}`);
    if (!res.ok) {
      router.replace("/");
      return;
    }
    const data = await res.json();
    setMemo(data.memo);
    setComments(data.comments || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!memoId || !user) return;
    loadMemo();
  }, [memoId, user]);

  const handleUpdate = async (draft: {
    title: string;
    body: string;
    category: string;
  }) => {
    const res = await fetch(`/api/memos/${memoId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (res.ok) {
      const updated = await res.json();
      setMemo((prev) => (prev ? { ...prev, ...updated } : updated));
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this memo?")) return;
    const res = await fetch(`/api/memos/${memoId}`, { method: "DELETE" });
    if (res.ok) {
      router.replace("/");
    }
  };

  const handleStatus = async () => {
    if (!memo) return;
    const nextStatus = memo.status === "open" ? "solved" : "open";
    const res = await fetch(`/api/memos/${memoId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) {
      const updated = await res.json();
      setMemo((prev) => (prev ? { ...prev, ...updated } : updated));
    }
  };

  const handleComment = async (body: string) => {
    const res = await fetch(`/api/memos/${memoId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (res.ok) {
      await loadMemo();
    }
  };

  const handleCommentUpdate = async (id: string, body: string) => {
    const res = await fetch(`/api/comments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (res.ok) {
      await loadMemo();
    }
  };

  const handleCommentDelete = async (id: string) => {
    if (!confirm("Delete this comment?")) return;
    const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
    if (res.ok) {
      await loadMemo();
    }
  };

  const handleToggleAnswer = async (id: string, next: boolean) => {
    const res = await fetch(`/api/comments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_answer: next }),
    });
    if (res.ok) {
      await loadMemo();
    }
  };

  if (loading || !memo || !user) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  const canEdit = user.role === "admin" || memo.author_id === user.id;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => router.push("/")}>
          Back
        </Button>
        <div className="text-xs text-muted-foreground">
          Updated {formatDate(memo.updated_at)}
        </div>
      </div>

      <Card className="card-sheen">
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge className={cn("border", categoryClass[memo.category] || "bg-secondary text-secondary-foreground")}>
              {categoryLabel[memo.category] || memo.category}
            </Badge>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
                memo.status === "solved"
                  ? "border-emerald-500/40 text-emerald-300"
                  : "border-amber-500/40 text-amber-300"
              )}
            >
              {memo.status}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{memo.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              By {memo.author.display_name}
            </p>
          </div>

          {editing ? (
            <MemoEditor
              initial={{
                title: memo.title,
                body: memo.body,
                category: memo.category,
              }}
              submitLabel="Save changes"
              onSubmit={handleUpdate}
            />
          ) : (
            <p className="whitespace-pre-line text-sm text-foreground/90">
              {memo.body}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            {(user.role === "admin" || memo.author_id === user.id) && (
              <Button size="sm" variant="secondary" onClick={handleStatus}>
                {memo.status === "open" ? "Mark solved" : "Reopen"}
              </Button>
            )}
            {canEdit && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditing((prev) => !prev)}
              >
                {editing ? "Cancel edit" : "Edit"}
              </Button>
            )}
            {(user.role === "admin" || memo.author_id === user.id) && (
              <Button size="sm" variant="ghost" onClick={handleDelete}>
                Delete
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Comments</h2>
        {comments.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            No comments yet. Start the discussion below.
          </div>
        )}
        {comments.length > 0 && (
          <CommentList
            comments={comments}
            currentUser={user}
            onUpdate={handleCommentUpdate}
            onDelete={handleCommentDelete}
            onToggleAnswer={handleToggleAnswer}
          />
        )}
      </section>

      <Card>
        <CardContent>
          <CommentForm onSubmit={handleComment} />
        </CardContent>
      </Card>
    </div>
  );
}
