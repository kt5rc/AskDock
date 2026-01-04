"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MemoCard } from "@/components/memo-card";
import { MemoEditor } from "@/components/memo-editor";
import { MemoFilters, Filters } from "@/components/memo-filters";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { MemoWithAuthor, UserPublic } from "@/types/db";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserPublic | null>(null);
  const [memos, setMemos] = useState<MemoWithAuthor[]>([]);
  const [filters, setFilters] = useState<Filters>({
    view: "open",
    category: "",
    q: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!user) return;
    const loadMemos = async () => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters.view === "open" || filters.view === "solved") {
        params.set("status", filters.view);
      } else {
        params.set("owned", "1");
      }
      if (filters.category) params.set("category", filters.category);
      if (filters.q) params.set("q", filters.q);
      const res = await fetch(`/api/memos?${params.toString()}`);
      if (!res.ok) {
        setError("Failed to load memos");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setMemos(data.memos || []);
      setLoading(false);
    };
    loadMemos();
  }, [filters, user]);

  const handleCreate = async (draft: {
    title: string;
    body: string;
    category: string;
  }) => {
    const res = await fetch("/api/memos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (res.ok) {
      const created = await res.json();
      const withAuthor = user ? { ...created, author: user } : created;
      setMemos((prev) => [withAuthor, ...prev]);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Question Cards</h1>
          {user && (
            <p className="text-sm text-muted-foreground">
              Welcome back, {user.display_name}
            </p>
          )}
        </div>
        <Button variant="ghost" onClick={handleLogout}>
          Log out
        </Button>
      </div>

      <Card className="card-sheen">
        <CardContent className="space-y-4">
          <div className="text-sm font-semibold mt-3">Post a new question</div>
          <MemoEditor
            submitLabel="Post question"
            onSubmit={handleCreate}
            disabled={!user}
          />
        </CardContent>
      </Card>

      <MemoFilters filters={filters} onChange={setFilters} />

      {error && <div className="text-sm text-destructive">{error}</div>}
      {loading && (
        <div className="text-sm text-muted-foreground">Loading memos...</div>
      )}
      {!loading && memos.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No memos yet. Start with your first question.
        </div>
      )}
      <div className="grid gap-4">
        {memos.map((memo) => (
          <MemoCard key={memo.id} memo={memo} />
        ))}
      </div>
    </div>
  );
}
