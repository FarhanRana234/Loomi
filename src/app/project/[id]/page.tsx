"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Heart, Share2, ArrowLeft, BookmarkPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/hooks/useUserStore";
import { ProjectCard } from "@/components/features/ProjectCard";
import { DownloadButton } from "@/components/features/DownloadButton";
import { CommentSection } from "@/components/features/CommentSection";
import { MoodboardSelectModal } from "@/components/features/MoodboardSelectModal";
import { ImageCarousel } from "@/components/features/ImageCarousel";
import { VideoPlayer } from "@/components/features/VideoPlayer";
import { SoundtrackChip } from "@/components/features/SoundtrackChip";
import type { IProject } from "@/types";

export default function ProjectDetailPage() {
  const params = useParams();
  const user = useUserStore((s) => s.user);
  const [project, setProject] = useState<IProject | null>(null);
  const [related, setRelated] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    fetch(`/api/projects/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setProject(d.data);
          setLikeCount(d.data.likes.length);
          if (user) {
            setLiked(d.data.likes.includes(user.firebaseId));
          }
        }
        setLoading(false);
      });
  }, [params.id, user]);

  useEffect(() => {
    if (project) {
      fetch(`/api/projects/${params.id}/related`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.data) setRelated(d.data);
        });
    }
  }, [params.id, project]);

  const [saveModalOpen, setSaveModalOpen] = useState(false);

  const handleLike = () => {
    if (!user) {
      toast.error("Please log in to like projects");
      return;
    }

    const prevLiked = liked;
    const prevCount = likeCount;

    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);

    fetch(`/api/projects/${params.id}/like`, { method: "POST" })
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

  const isOwner =
    user &&
    (project.userId as unknown as { firebaseId: string })?.firebaseId ===
      user.firebaseId;

  const isProtected = (project as unknown as { protected?: boolean }).protected;
  const images = project.images || [];
  const hasMultipleImages = images.length > 1;
  const isVideo = project.mediaType === "video" || (!project.mediaType && images.length === 0 && /\.(mp4|webm|mov)(\?|$)/i.test(project.mediaUrl));
  const isImage = !isVideo;
  const hasSoundtrack = !!project.soundtrackId;

  const protectedUrl =
    isProtected && project.mediaUrl && !hasMultipleImages
      ? project.mediaUrl.replace(
          "/upload/",
          `/upload/l_text:Arial_40:${author.username}_©_Loomi,o_30/`
        )
      : project.mediaUrl;

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
        <div className="lg:col-span-3">
          <div className="relative">
            {hasMultipleImages ? (
              <ImageCarousel
                images={images}
                protectedImages={(project as unknown as { signedImageUrls?: string[] }).signedImageUrls}
                alt={project.title}
                variant="detail"
              />
            ) : isVideo ? (
              <VideoPlayer
                src={(project as unknown as { signedVideoUrl?: string }).signedVideoUrl || project.mediaUrl}
                poster={project.thumbnailUrl}
                variant="detail"
              />
            ) : (
              <img
                src={protectedUrl}
                alt={project.title}
                className="w-full rounded-xl object-cover"
                onContextMenu={(e) => isProtected && e.preventDefault()}
              />
            )}

            {hasSoundtrack && isImage && (
              <SoundtrackChip
                trackId={project.soundtrackId!}
                title={project.soundtrackTitle}
                artist={project.soundtrackArtist}
                thumbnail={project.soundtrackThumbnail}
                variant="detail"
              />
            )}
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {project.title}
              </h1>
              {isProtected && (
                <Badge
                  variant="outline"
                  className="shrink-0 text-[10px]"
                >
                  Protected
                </Badge>
              )}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Link href={`/profile/${author.username}`} className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={author.avatarUrl} alt={author.username} />
                  <AvatarFallback className="text-xs">
                    {author.username?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hover:underline">{author.username}</span>
              </Link>
            </div>
          </div>

          {project.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {project.description}
            </p>
          )}

          {(project.categories || []).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {(project.categories || []).map((cat) => (
                <Link key={cat} href={`/?categories=${encodeURIComponent(cat)}`}>
                  <Badge variant="outline" className="transition-colors hover:bg-accent">
                    {cat}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              variant={liked ? "default" : "outline"}
              className={cn(liked && "bg-foreground text-background")}
              onClick={handleLike}
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
            <DownloadButton
              url={project.mediaUrl}
              filename={`${project.title}.${isVideo ? "mp4" : "jpg"}`}
              isDownloadable={!!(project as unknown as { isDownloadable?: boolean }).isDownloadable}
            />
            {user && !isOwner && (
              <Button variant="outline" onClick={() => setSaveModalOpen(true)}>
                <BookmarkPlus className="mr-2 h-4 w-4" />
                Save
              </Button>
            )}
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

          <CommentSection projectId={project._id} />
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="text-xl font-bold tracking-tight">
            You may also like
          </h2>
          <div className="mt-6 columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
            {related.map((p) => (
              <ProjectCard key={p._id} project={p} />
            ))}
          </div>
        </div>
      )}

      {project && (
        <MoodboardSelectModal
          open={saveModalOpen}
          onOpenChange={setSaveModalOpen}
          projectId={project._id}
        />
      )}
    </div>
  );
}
