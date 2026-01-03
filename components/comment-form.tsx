"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function CommentForm({
  onSubmit,
  disabled,
}: {
  onSubmit: (body: string) => Promise<void>;
  disabled?: boolean;
}) {
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!body.trim()) return;
    setLoading(true);
    try {
      await onSubmit(body.trim());
      setBody("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-3">
      <Textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Write a comment or answer"
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={loading || disabled}>
          {loading ? "Posting..." : "Post comment"}
        </Button>
      </div>
    </form>
  );
}
