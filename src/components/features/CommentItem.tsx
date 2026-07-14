"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReplyInput } from "./ReplyInput";
import type { IComment, IUser } from "@/types";

interface CommentItemProps {
  comment: IComment & { userId: IUser };
  replies: (IComment & { userId: IUser })[];
  currentUserId?: string;
  onReply: (parentId: string, text: string) => Promise<void>;
  onDelete: (commentId: string) => void;
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function CommentItem({
  comment,
  replies,
  currentUserId,
  onReply,
  onDelete,
}: CommentItemProps) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const author = comment.userId as unknown as { username: string; avatarUrl: string };
  const isOwner = currentUserId === (comment.userId as unknown as { firebaseId: string })?.firebaseId;

  return (
    <div>
      <div className="flex gap-3">
        <Link href={`/profile/${author.username}`}>
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={author.avatarUrl} alt={author.username} />
            <AvatarFallback className="text-[10px]">
              {author.username?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${author.username}`}
              className="text-sm font-medium hover:underline"
            >
              {author.username}
            </Link>
            <span className="text-xs text-muted-foreground">
              {timeAgo(comment.createdAt)}
            </span>
          </div>
          <p className="mt-0.5 text-sm leading-relaxed">{comment.text}</p>
          <div className="mt-1 flex items-center gap-3">
            {currentUserId && (
              <button
                onClick={() => setShowReplyInput(!showReplyInput)}
                className="flex min-h-[44px] min-w-[44px] items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Reply
              </button>
            )}
            {isOwner && (
              <button
                onClick={() => onDelete(comment._id)}
                className="flex min-h-[44px] min-w-[44px] items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {showReplyInput && (
        <div className="ml-11 mt-2">
          <ReplyInput
            onSubmit={async (text) => {
              await onReply(comment._id, text);
              setShowReplyInput(false);
            }}
            onCancel={() => setShowReplyInput(false)}
          />
        </div>
      )}

      {replies.length > 0 && (
        <div className="ml-11 mt-3 space-y-3 border-l-2 border-border pl-4">
          {replies.map((reply) => {
            const rAuthor = reply.userId as unknown as { username: string; avatarUrl: string };
            const rIsOwner = currentUserId === (reply.userId as unknown as { firebaseId: string })?.firebaseId;
            return (
              <div key={reply._id} className="flex gap-3">
                <Link href={`/profile/${rAuthor.username}`}>
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarImage src={rAuthor.avatarUrl} alt={rAuthor.username} />
                    <AvatarFallback className="text-[9px]">
                      {rAuthor.username?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/profile/${rAuthor.username}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {rAuthor.username}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(reply.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm leading-relaxed">{reply.text}</p>
                  {rIsOwner && (
                    <button
                      onClick={() => onDelete(reply._id)}
                      className="mt-1 flex min-h-[44px] min-w-[44px] items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
