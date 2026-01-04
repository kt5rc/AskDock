"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const categories = [
  { value: "", label: "All categories" },
  { value: "env", label: "Env" },
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "db", label: "DB" },
  { value: "git", label: "Git" },
  { value: "other", label: "Other" },
  { value: "chat", label: "Chat" },
];

export type Filters = {
  view: "all" | "open" | "solved" | "owned";
  category: string;
  q: string;
  sort: "desc" | "asc";
};

export function MemoFilters({
  filters,
  onChange,
  counts,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
  counts: { all: number; open: number; solved: number; owned: number };
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={filters.view === "all" ? "default" : "ghost"}
          size="sm"
          onClick={() => onChange({ ...filters, view: "all" })}
        >
          All
          <span className="ml-2 text-xs text-muted-foreground">{counts.all}</span>
        </Button>
        <Button
          type="button"
          variant={filters.view === "open" ? "default" : "secondary"}
          size="sm"
          className={filters.view === "open" ? "border-amber-500/40 bg-amber-500/20 text-amber-200" : ""}
          onClick={() => onChange({ ...filters, view: "open" })}
        >
          Open
          <span className="ml-2 text-xs text-muted-foreground">{counts.open}</span>
        </Button>
        <Button
          type="button"
          variant={filters.view === "solved" ? "default" : "secondary"}
          size="sm"
          className={filters.view === "solved" ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-200" : ""}
          onClick={() => onChange({ ...filters, view: "solved" })}
        >
          Solved
          <span className="ml-2 text-xs text-muted-foreground">{counts.solved}</span>
        </Button>
        <Button
          type="button"
          variant={filters.view === "owned" ? "default" : "secondary"}
          size="sm"
          onClick={() => onChange({ ...filters, view: "owned" })}
        >
          Owned
          <span className="ml-2 text-xs text-muted-foreground">{counts.owned}</span>
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            onChange({ ...filters, sort: filters.sort === "desc" ? "asc" : "desc" })
          }
          title={filters.sort === "desc" ? "Newest first" : "Oldest first"}
          aria-label={filters.sort === "desc" ? "Newest first" : "Oldest first"}
        >
          <span className="text-xs">{filters.sort === "desc" ? "v new" : "^ old"}</span>
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-[180px_1fr]">
        <Select
          value={filters.category}
          onChange={(event) => onChange({ ...filters, category: event.target.value })}
        >
          {categories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </Select>
        <Input
          placeholder="Search title or body"
          value={filters.q}
          onChange={(event) => onChange({ ...filters, q: event.target.value })}
        />
      </div>
    </div>
  );
}