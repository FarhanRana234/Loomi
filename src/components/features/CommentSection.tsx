"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { CommentItem } from "./CommentItem";
import { useUserStore } from "@/hooks/useUserStore";
import type { IComment, IUser } from "@/types";

type CommentWithUser = IComment & { userId: IUser };

interface CommentSectionProps {
  projectId: string;
}

export function CommentSection({ projectId }: CommentSectionProps) {
  const user = useUserStore((s) => s.user);
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?projectId=${projectId}`);
      const d = await res.json();
      if (d.success) setComments(d.data || []);
    } catch {
      // silent
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const tree = useMemo(() => {
    const topLevel = comments.filter((c) => !c.parentId);
    const byParent = new Map<string, CommentWithUser[]>();
    comments.forEach((c) => {
      if (c.parentId) {
        const list = byParent.get(c.parentId) || [];
        list.push(c);
        byParent.set(c.parentId, list);
      }
    });
    return { topLevel, byParent };
  }, [comments]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;

    const tempId = `temp_${Date.now()}`;
    const optimistic: CommentWithUser = {
      _id: tempId,
      projectId,
      userId: user as unknown as IUser,
      text: text.trim(),
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setComments((prev) => [optimistic, ...prev]);
    setText("");
    setSending(true);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, text: text.trim() }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to post");
      setComments((prev) =>
        prev.map((c) => (c._id === tempId ? d.data : c))
      );
    } catch {
      setComments((prev) => prev.filter((c) => c._id !== tempId));
      setText(text);
      toast.error("Failed to post comment");
    }
    setSending(false);
  };

  const handleReply = async (parentId: string, replyText: string) => {
    const tempId = `temp_${Date.now()}`;
    const optimistic: CommentWithUser = {
      _id: tempId,
      projectId,
      userId: user as unknown as IUser,
      text: replyText,
      parentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setComments((prev) => [...prev, optimistic]);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, text: replyText, parentId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to reply");
      setComments((prev) =>
        prev.map((c) => (c._id === tempId ? d.data : c))
      );
    } catch {
      setComments((prev) => prev.filter((c) => c._id !== tempId));
      toast.error("Failed to post reply");
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;
    const prev = comments;
    setComments((prev.filter((c) => c._id !== commentId && c.parentId !== commentId)));
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    } catch {
      setComments(prev);
      toast.error("Failed to delete comment");
    }
  };

  return (
    <div className="mt-8 rounded-xl border border-border p-4">
      <h3 className="text-sm font-semibold">
        {comments.filter((c) => !c.parentId).length}{" "}
        {comments.filter((c) => !c.parentId).length === 1 ? "Comment" : "Comments"}
      </h3>

      {user ? (
        <form onSubmit={handlePost} className="mt-3 flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment..."
            maxLength={1000}
            disabled={sending}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-foreground text-background transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          <a href="/login" className="font-medium hover:underline">Sign in</a> to leave a comment.
        </p>
      )}

      {loading ? (
        <div className="mt-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {tree.topLevel.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              replies={tree.byParent.get(comment._id) || []}
              currentUserId={user?.firebaseId}
              onReply={handleReply}
              onDelete={handleDelete}
            />
          ))}
          {tree.topLevel.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No comments yet. Be the first to share your thoughts.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
