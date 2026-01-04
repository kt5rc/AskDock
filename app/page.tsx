"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MemoCard } from "@/components/memo-card";
import { MemoEditor } from "@/components/memo-editor";
import { MemoFilters, Filters } from "@/components/memo-filters";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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
    sort: "desc",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState<{ all: number; open: number; solved: number; owned: number }>({
    all: 0,
    open: 0,
    solved: 0,
    owned: 0,
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

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
    if (!menuOpen) return;
    const onClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!user) return;
    const loadMemos = async () => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters.view === "open" || filters.view === "solved") {
        params.set("status", filters.view);
      } else if (filters.view === "owned") {
        params.set("owned", "1");
      } else {
        // all
      }
      if (filters.category) params.set("category", filters.category);
      if (filters.q) params.set("q", filters.q);
      params.set("sort", filters.sort);
      const res = await fetch(`/api/memos?${params.toString()}`);
      if (!res.ok) {
        setError("Failed to load memos");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setMemos(data.memos || []);
      if (data.counts) {
        setCounts({
          all: data.counts.all ?? 0,
          open: data.counts.open ?? 0,
          solved: data.counts.solved ?? 0,
          owned: data.counts.owned ?? 0,
        });
      }
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
          <p className="min-h-[1.25rem] text-sm text-muted-foreground">
            {user ? `Welcome back, ${user.display_name}` : "\u00A0"}
          </p>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:text-foreground focus:outline-none"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span className="text-lg leading-none">...</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-md border border-border bg-secondary/90 p-1 shadow-md backdrop-blur">
              <Link
                href="/account"
                className="block rounded-sm px-3 py-2 text-sm text-foreground/90 hover:bg-accent"
                onClick={() => setMenuOpen(false)}
              >
                Account
              </Link>
              {user?.role === "admin" && (
                <Link
                  href="/admin/users"
                  className="block rounded-sm px-3 py-2 text-sm text-foreground/90 hover:bg-accent"
                  onClick={() => setMenuOpen(false)}
                >
                  Users
                </Link>
              )}
              <Button
                variant="ghost"
                className="h-9 w-full justify-start px-3 text-sm"
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
              >
                Log out
              </Button>
            </div>
          )}
        </div>
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

      <MemoFilters filters={filters} onChange={setFilters} counts={counts} />

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
