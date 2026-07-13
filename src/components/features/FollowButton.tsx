"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing: boolean;
  initialFollowersCount: number;
  size?: "default" | "sm" | "lg";
}

export default function FollowButton({
  targetUserId,
  initialIsFollowing,
  initialFollowersCount,
  size = "sm",
}: FollowButtonProps) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);

  const toggle = useCallback(async () => {
    const wasFollowing = isFollowing;
    const prevCount = followersCount;

    setIsFollowing(!wasFollowing);
    setFollowersCount(wasFollowing ? prevCount - 1 : prevCount + 1);

    try {
      const method = wasFollowing ? "DELETE" : "POST";
      const res = await fetch(`/api/users/${targetUserId}/follow`, { method });
      const data = await res.json();

      if (!data.success) {
        setIsFollowing(wasFollowing);
        setFollowersCount(prevCount);
        toast.error(data.error || "Something went wrong");
        return;
      }

      setIsFollowing(data.data.isFollowing);
      setFollowersCount(data.data.followersCount);
      router.refresh();
    } catch {
      setIsFollowing(wasFollowing);
      setFollowersCount(prevCount);
      toast.error("Network error. Please try again.");
    }
  }, [isFollowing, followersCount, targetUserId, router]);

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      size={size}
      onClick={toggle}
    >
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
}
