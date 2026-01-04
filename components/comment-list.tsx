'use client';

import { useState } from 'react';
import { CommentWithAuthor, UserPublic } from '@/types/db';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

function formatDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function CommentList({
  comments,
  currentUser,
  onUpdate,
  onDelete,
  onToggleAnswer
}: {
  comments: CommentWithAuthor[];
  currentUser: UserPublic;
  onUpdate: (id: string, body: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggleAnswer: (id: string, next: boolean) => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const startEdit = (comment: CommentWithAuthor) => {
    setEditingId(comment.id);
    setDraft(comment.body);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft('');
  };

  const saveEdit = async () => {
    if (!editingId || !draft.trim()) return;
    await onUpdate(editingId, draft.trim());
    cancelEdit();
  };

  return (
    <div className="space-y-4">
      {comments.map((comment) => {
        const canEdit = currentUser.role === 'admin' || comment.author_id === currentUser.id;
        const canDelete = currentUser.role === 'admin' || comment.author_id === currentUser.id;
        const isEditing = editingId === comment.id;
        return (
          <div
            key={comment.id}
            className={cn(
              'rounded-xl border border-border bg-card p-4',
              comment.is_answer && 'border-emerald-400/40 bg-emerald-500/10'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">{comment.author.display_name}</div>
              <div className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</div>
            </div>
            {isEditing ? (
              <div className="mt-3 space-y-2">
                <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveEdit}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-2 whitespace-pre-line text-sm text-foreground/90">{comment.body}</p>
            )}
            {canEdit && !isEditing && (
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <Button size="sm" variant="secondary" onClick={() => startEdit(comment)}>
                  Edit
                </Button>
                {canDelete && (
                  <Button size="sm" variant="ghost" onClick={() => onDelete(comment.id)}>
                    Delete
                  </Button>
                )}
                {currentUser.role === 'admin' && (
                  <Button
                    size="sm"
                    variant={comment.is_answer ? 'default' : 'secondary'}
                    onClick={() => onToggleAnswer(comment.id, !comment.is_answer)}
                  >
                    {comment.is_answer ? 'Answer' : 'Mark answer'}
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
