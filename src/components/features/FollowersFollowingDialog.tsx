"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface UserEntry {
  _id: string;
  firebaseId: string;
  username: string;
  avatarUrl: string;
}

interface FollowersFollowingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  type: "followers" | "following";
  count: number;
}

export default function FollowersFollowingDialog({
  open,
  onOpenChange,
  userId,
  type,
  count,
}: FollowersFollowingDialogProps) {
  const router = useRouter();
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!open) return;
    setIsLoading(true);
    try {
      const endpoint =
        type === "followers"
          ? `/api/users/${userId}/followers`
          : `/api/users/${userId}/following`;
      const res = await fetch(endpoint);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data.users);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [open, type, userId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {type === "followers" ? "Followers" : "Following"}
            {count > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {count}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {type === "followers"
                ? "No followers yet"
                : "Not following anyone yet"}
            </div>
          ) : (
            <div className="space-y-1">
              {users.map((user) => (
                <div
                  key={user.firebaseId}
                  className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted"
                >
                  <Link
                    href={`/profile/${user.username}`}
                    onClick={() => onOpenChange(false)}
                    className="flex flex-1 items-center gap-3"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback className="text-xs">
                        {user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{user.username}</span>
                  </Link>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-xs"
                  >
                    <Link
                      href={`/profile/${user.username}`}
                      onClick={() => onOpenChange(false)}
                    >
                      View
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
