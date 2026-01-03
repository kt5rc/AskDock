'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const categories = [
  { value: 'env', label: 'Env' },
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'db', label: 'DB' },
  { value: 'git', label: 'Git' },
  { value: 'other', label: 'Other' },
  { value: 'chat', label: 'Chat' }
];

export type MemoDraft = {
  title: string;
  body: string;
  category: string;
};

export function MemoEditor({
  initial,
  onSubmit,
  submitLabel,
  disabled
}: {
  initial?: MemoDraft;
  onSubmit: (draft: MemoDraft) => Promise<void>;
  submitLabel: string;
  disabled?: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'env');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setLoading(true);
    try {
      await onSubmit({ title: title.trim(), body: body.trim(), category });
      if (!initial) {
        setTitle('');
        setBody('');
        setCategory('env');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Question title"
      />
      <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
        <Select value={category} onChange={(event) => setCategory(event.target.value)}>
          {categories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </Select>
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Describe what you are stuck on"
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={loading || disabled}>
          {loading ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
