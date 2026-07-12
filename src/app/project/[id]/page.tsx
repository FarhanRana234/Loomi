"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Heart, Share2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { IProject } from "@/types";

export default function ProjectDetailPage() {
  const params = useParams();
  const [project, setProject] = useState<IProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetch(`/api/projects/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setProject(d.data);
          setLikeCount(d.data.likes.length);
        }
        setLoading(false);
      });
  }, [params.id]);

  const handleLike = () => {
    startTransition(async () => {
      const prevLiked = liked;
      const prevCount = likeCount;
      setLiked(!liked);
      setLikeCount(liked ? likeCount - 1 : likeCount + 1);

      try {
        const token = document.cookie
          .split("; ")
          .find((c) => c.startsWith("__session="))
          ?.split("=")[1];

        const res = await fetch(`/api/projects/${params.id}/like`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          setLiked(prevLiked);
          setLikeCount(prevCount);
        }
      } catch {
        setLiked(prevLiked);
        setLikeCount(prevCount);
      }
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: project?.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Skeleton className="h-[500px] w-full rounded-xl" />
          </div>
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-8 w-3/4 rounded-md" />
            <Skeleton className="h-4 w-1/2 rounded-md" />
            <Skeleton className="h-24 w-full rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  const author = project.userId as unknown as {
    username: string;
    avatarUrl: string;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to feed
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        {/* Hero Image */}
        <div className="lg:col-span-3">
          <img
            src={project.mediaUrl}
            alt={project.title}
            className="w-full rounded-xl object-cover"
          />
        </div>

        {/* Details Sidebar */}
        <div className="space-y-6 lg:col-span-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {project.title}
            </h1>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                {author.username?.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-sm font-medium">{author.username}</span>
            </div>
          </div>

          {project.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {project.description}
            </p>
          )}

          {project.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant={liked ? "default" : "outline"}
              className={cn(liked && "bg-foreground text-background")}
              onClick={handleLike}
              disabled={isPending}
            >
              <Heart
                className={cn("mr-2 h-4 w-4", liked && "fill-current")}
              />
              {likeCount} {likeCount === 1 ? "Like" : "Likes"}
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>

          <div className="rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground">
              Published{" "}
              {new Date(project.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {project.views} views
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
