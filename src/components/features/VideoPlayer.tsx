"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Volume2, VolumeX, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  variant?: "feed" | "detail";
}

export function VideoPlayer({
  src,
  poster,
  className,
  autoPlay = true,
  variant = "feed",
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDetail = variant === "detail";

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.3 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (autoPlay && isVisible) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isVisible, autoPlay]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    if (isDetail) {
      hideTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [isDetail]);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  const togglePlay = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMuted((prev) => !prev);
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  return (
    <div
      ref={containerRef}
      className={cn("group/video relative", className)}
      onMouseMove={isDetail ? showControlsTemporarily : undefined}
      onMouseEnter={isDetail ? () => setShowControls(true) : undefined}
      onMouseLeave={isDetail ? () => setShowControls(false) : undefined}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted={muted}
        loop
        playsInline
        preload={autoPlay ? "auto" : "metadata"}
        className="w-full rounded-xl object-cover"
        onClick={isDetail ? togglePlay : undefined}
      />

      {/* Persistent mute/unmute button (feed) - always visible */}
      {!isDetail && (
        <button
          onClick={toggleMute}
          className="absolute bottom-3 right-3 z-10 flex h-[44px] w-[44px] items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
          aria-label={muted ? "Unmute video" : "Mute video"}
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      )}

      {/* Detail page: custom play/pause + mute/unmute, hover-triggered */}
      {isDetail && (
        <div
          className={cn(
            "absolute inset-0 z-10 flex items-center justify-center gap-3 transition-opacity duration-300",
            showControls ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          <button
            onClick={togglePlay}
            className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
            aria-label={isPlaying ? "Pause video" : "Play video"}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
          </button>
          <button
            onClick={toggleMute}
            className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
            aria-label={muted ? "Unmute video" : "Mute video"}
          >
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        </div>
      )}
    </div>
  );
}
