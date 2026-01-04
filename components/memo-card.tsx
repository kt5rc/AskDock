"use client";

import Link from "next/link";
import { MemoWithAuthor } from "@/types/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

export function MemoCard({ memo }: { memo: MemoWithAuthor }) {
  const isNew = Date.now() - new Date(memo.created_at).getTime() < 24 * 60 * 60 * 1000;
  const hasRecentReply = memo.comment_latest_at
    ? Date.now() - new Date(memo.comment_latest_at).getTime() < 24 * 60 * 60 * 1000
    : false;
  const authorClass =
    memo.author?.username === "system"
      ? "text-violet-300"
      : memo.author?.role === "admin"
        ? "text-rose-300"
        : "text-muted-foreground";

  const isUpdated = memo.updated_at !== memo.created_at;

  return (
    <Link href={`/memos/${memo.id}`} className="block">
      <Card className="relative overflow-hidden card-sheen transition hover:border-muted">
        {(isNew || hasRecentReply) && (
          <div className="pointer-events-none absolute left-0 top-0 h-full w-2">
            {isNew && hasRecentReply ? (
              <>
                <div className="h-1/2 w-full bg-emerald-500/80" />
                <div className="h-1/2 w-full bg-sky-500/80" />
              </>
            ) : isNew ? (
              <div className="h-full w-full bg-emerald-500/80" />
            ) : (
              <div className="h-full w-full bg-sky-500/80" />
            )}
          </div>
        )}
        <CardContent className="space-y-3">
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
          <div className="text-base font-semibold text-foreground">
            {memo.title}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className={cn(authorClass)}>
              By {memo.author?.display_name || "Unknown"}
            </span>
            <span>
              {isUpdated ? "Updated " : "Created "}
              {formatDate(isUpdated ? memo.updated_at : memo.created_at)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
