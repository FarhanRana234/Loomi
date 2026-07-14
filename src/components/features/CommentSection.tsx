"use client";

import { useState, useEffect, useMemo } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { useUserStore } from "@/hooks/useUserStore";
import { CommentItem } from "./CommentItem";
import type { IComment } from "@/types";

interface CommentSectionProps {
  projectId: string;
}

export function CommentSection({ projectId }: CommentSectionProps) {
  const user = useUserStore((s) => s.user);
  const [comments, setComments] = useState<IComment[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch(`/api/comments?projectId=${projectId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setComments(d.data || []);
      });
  }, [projectId]);

  const tree = useMemo(() => {
    const byId = new Map<string, IComment & { children: IComment[] }>();
    const roots: (IComment & { children: IComment[] })[] = [];

    for (const c of comments) {
      byId.set(c._id, { ...c, children: [] });
    }

    for (const c of comments) {
      const node = byId.get(c._id)!;
      const parentId = (c as unknown as { parentId?: string | null }).parentId;
      if (parentId && byId.has(parentId)) {
        byId.get(parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }, [comments]);

  const handleDelete = (id: string) => {
    setComments((prev) => prev.filter((c) => c._id !== id));
  };

  const handleReplyAdded = (comment: IComment) => {
    setComments((prev) => [...prev, comment]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, text: text.trim() }),
      });
      if (!res.ok) throw new Error();
      const d = await res.json();
      if (d.success) {
        setComments((prev) => [...prev, d.data]);
        setText("");
      }
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">
        Comments {comments.length > 0 && `(${comments.length})`}
      </h3>

      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment..."
            maxLength={1000}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-foreground text-background transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          Log in to leave a comment.
        </p>
      )}

      <div className="space-y-4">
        {tree.map((comment) => (
          <CommentItem
            key={comment._id}
            comment={comment}
            children={comment.children}
            depth={0}
            onDelete={handleDelete}
            onReplyAdded={handleReplyAdded}
          />
        ))}
      </div>
    </div>
  );
}
