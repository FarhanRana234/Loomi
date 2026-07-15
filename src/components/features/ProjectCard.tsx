"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Heart, Volume2, VolumeX } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
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

  const images = project.images || [];
  const hasMultipleImages = images.length > 1;
  const isVideo = project.mediaType === "video" || (!project.mediaType && images.length === 0 && /\.(mp4|webm|mov)(\?|$)/i.test(project.mediaUrl));

  const displayImages = hasMultipleImages
    ? ((project as unknown as { signedImageUrls?: string[] }).signedImageUrls || images)
    : [];

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
          {hasMultipleImages ? (
            <CardCarousel images={displayImages} alt={project.title} />
          ) : isVideo ? (
            <CardVideo
              src={(project as unknown as { signedVideoUrl?: string }).signedVideoUrl || project.mediaUrl}
              poster={project.thumbnailUrl}
            />
          ) : (
            <img
              src={(project as unknown as { signedImageUrl?: string }).signedImageUrl || project.thumbnailUrl || project.mediaUrl}
              alt={project.title}
              className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          )}
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
          {(project.categories || []).slice(0, 2).map((cat) => (
            <Link
              key={cat}
              href={`/?categories=${encodeURIComponent(cat)}`}
              className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              {cat}
            </Link>
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

function CardCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, dragFree: false });
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {images.map((img, idx) => (
            <div key={idx} className="min-w-0 flex-[0_0_100%]">
              <img
                src={img}
                alt={`${alt} ${idx + 1}`}
                className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading={idx === 0 ? "eager" : "lazy"}
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
          {images.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                idx === selectedIndex ? "w-4 bg-white" : "w-1 bg-white/50"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CardVideo({ src, poster }: { src: string; poster?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.3 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isInView) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isInView]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMuted((p) => !p);
  }, []);

  return (
    <div ref={containerRef} className="group/video relative">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="auto"
        className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <button
        onClick={toggleMute}
        className="absolute bottom-2 right-2 z-10 rounded-full bg-background/80 p-1.5 text-foreground opacity-0 backdrop-blur-sm transition-opacity group-hover/video:opacity-100"
        aria-label={muted ? "Unmute" : "Mute"}
      >
        {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
