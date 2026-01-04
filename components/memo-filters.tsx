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
  view: "open" | "solved" | "owned";
  category: string;
  q: string;
  sort: "desc" | "asc";
};

export function MemoFilters({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
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
          <span className="text-xs">
            {filters.sort === "desc" ? "↓ new" : "↑ old"}
          </span>
        </Button>
        <Button
          type="button"
          variant={filters.view === "open" ? "default" : "secondary"}
          size="sm"
          onClick={() => onChange({ ...filters, view: "open" })}
        >
          Open
        </Button>
        <Button
          type="button"
          variant={filters.view === "solved" ? "default" : "secondary"}
          size="sm"
          onClick={() => onChange({ ...filters, view: "solved" })}
        >
          Solved
        </Button>
        <Button
          type="button"
          variant={filters.view === "owned" ? "default" : "secondary"}
          size="sm"
          onClick={() => onChange({ ...filters, view: "owned" })}
        >
          Owned
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-[180px_1fr]">
        <Select
          value={filters.category}
          onChange={(event) =>
            onChange({ ...filters, category: event.target.value })
          }
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
