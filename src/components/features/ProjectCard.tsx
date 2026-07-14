"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/hooks/useUserStore";
import type { IProject } from "@/types";

interface ProjectCardProps {
  project: IProject;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const user = useUserStore((s) => s.user);
  const [liked, setLiked] = useState(
    user ? project.likes.includes(user.firebaseId) : false
  );
  const [likeCount, setLikeCount] = useState(project.likes.length);
  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please log in to like projects");
      return;
    }

    const prevLiked = liked;
    const prevCount = likeCount;

    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);

    fetch(`/api/projects/${project._id}/like`, { method: "POST" })
      .then((res) => {
        if (!res.ok) {
          setLiked(prevLiked);
          setLikeCount(prevCount);
        }
      })
      .catch(() => {
        setLiked(prevLiked);
        setLikeCount(prevCount);
      });
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card">
      <Link href={`/project/${project._id}`}>
        <div className="relative overflow-hidden">
          <img
            src={project.thumbnailUrl || project.mediaUrl}
            alt={project.title}
            className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <h3 className="text-sm font-semibold text-white tracking-tight">
              {project.title}
            </h3>
            <p className="mt-1 text-xs text-white/70">
              <Link
                href={`/profile/${(project.userId as unknown as { username: string })?.username}`}
                className="hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {(project.userId as unknown as { username: string })?.username || "Creator"}
              </Link>
            </p>
          </div>
        </div>
      </Link>

      <div className="flex items-center justify-between p-3">
        <div className="flex flex-wrap gap-1">
          {project.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-7 gap-1 px-2", liked && "text-red-500")}
          onClick={handleLike}
        >
          <Heart
            className={cn("h-3.5 w-3.5", liked && "fill-current")}
          />
          <span className="text-xs">{likeCount}</span>
        </Button>
      </div>
    </div>
  );
}
