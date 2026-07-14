"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Send, MoreHorizontal, Trash2, Flag } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserStore } from "@/hooks/useUserStore";
import type { IComment } from "@/types";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface CommentItemProps {
  comment: IComment;
  children?: IComment[];
  depth?: number;
  onDelete?: (id: string) => void;
}

export function CommentItem({ comment, children = [], depth = 0, onDelete }: CommentItemProps) {
  const user = useUserStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const author = comment.userId as unknown as { username: string; avatarUrl: string; firebaseId?: string };
  const commentFirebaseId = (comment.userId as unknown as { firebaseId?: string })?.firebaseId;
  const isOwner = !!user && !!commentFirebaseId && user.firebaseId === commentFirebaseId;
  const canReply = depth < 2;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleDelete = async () => {
    setOpen(false);
    try {
      const res = await fetch(`/api/comments/${comment._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Comment deleted");
      onDelete?.(comment._id);
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  const handleReport = () => {
    setOpen(false);
    toast.success("Report submitted");
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: (comment as unknown as { projectId: string }).projectId, text: replyText.trim(), parentId: comment._id }),
      });
      if (!res.ok) throw new Error();
      toast.success("Reply sent");
      setReplyText("");
      setReplyOpen(false);
    } catch {
      toast.error("Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className={`group flex gap-3 ${depth > 0 ? "pl-4" : ""}`}>
        <Link href={`/profile/${author?.username}`} className="shrink-0">
          <Avatar className="h-8 w-8">
            <AvatarImage src={author?.avatarUrl} />
            <AvatarFallback className="text-xs">
              {author?.username?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link href={`/profile/${author?.username}`} className="text-sm font-medium hover:underline">{author?.username}</Link>
            <span className="text-xs text-muted-foreground">
              {timeAgo(comment.createdAt)}
            </span>
          </div>
          <p className="mt-0.5 text-sm leading-relaxed text-foreground">{comment.text}</p>

          <div className="mt-1.5 flex items-center gap-3">
            {canReply && user && (
              <button
                onClick={() => setReplyOpen(!replyOpen)}
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Reply
              </button>
            )}
          </div>

          {replyOpen && (
            <form onSubmit={handleReply} className="mt-2 flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to ${author?.username}...`}
                maxLength={1000}
                autoFocus
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                type="submit"
                disabled={!replyText.trim() || sending}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-foreground text-background transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          )}
        </div>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setOpen(!open)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent hover:text-foreground"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {open && (
            <div className="absolute right-0 top-full z-50 mt-1 w-36 overflow-hidden rounded-lg border border-border bg-background shadow-md">
              {isOwner && (
                <button
                  onClick={handleDelete}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              )}
              <button
                onClick={handleReport}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
              >
                <Flag className="h-3.5 w-3.5" />
                Report
              </button>
            </div>
          )}
        </div>
      </div>

      {children.length > 0 && (
        <div className={`mt-2 space-y-3 ${depth > 0 ? "pl-4" : "ml-11"}`}>
          {children.map((child) => (
            <CommentItem
              key={child._id}
              comment={child}
              depth={depth + 1}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
