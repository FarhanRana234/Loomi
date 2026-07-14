"use client";

import { useState } from "react";
import { Send } from "lucide-react";

interface ReplyInputProps {
  onSubmit: (text: string) => Promise<void>;
  onCancel: () => void;
}

export function ReplyInput({ onSubmit, onCancel }: ReplyInputProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    await onSubmit(text.trim());
    setText("");
    setSending(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a reply..."
        maxLength={1000}
        autoFocus
        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
      />
      <button
        type="submit"
        disabled={!text.trim() || sending}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-foreground text-background transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        <Send className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
      >
        Cancel
      </button>
    </form>
  );
}
