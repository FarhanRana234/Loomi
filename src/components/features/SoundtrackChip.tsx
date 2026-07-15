"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Volume2, VolumeX, Play, Pause, Music } from "lucide-react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    YT: {
      Player: new (
        id: string | HTMLElement,
        config: {
          videoId?: string;
          width?: string | number;
          height?: string | number;
          playerVars?: Record<string, number | string>;
          events?: Record<string, (event: { target: SoundtrackChipPlayer }) => void>;
        }
      ) => SoundtrackChipPlayer;
    };
    onYouTubeIframeAPIReady: () => void;
  }

  class SoundtrackChipPlayer {
    playVideo(): void;
    pauseVideo(): void;
    mute(): void;
    unMute(): void;
    destroy(): void;
  }
}

let apiLoaded = false;
let apiLoading = false;

function loadYouTubeAPI(): Promise<void> {
  if (apiLoaded) return Promise.resolve();
  if (apiLoading) {
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (apiLoaded) { clearInterval(check); resolve(); }
      }, 100);
    });
  }

  apiLoading = true;
  return new Promise((resolve) => {
    if (typeof window === "undefined") { resolve(); return; }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      apiLoaded = true;
      resolve();
    };

    setTimeout(() => { apiLoaded = true; resolve(); }, 5000);
  });
}

interface SoundtrackChipProps {
  trackId: string;
  title?: string;
  artist?: string;
  thumbnail?: string;
  variant?: "feed" | "detail";
  onPlayStateChange?: (playing: boolean) => void;
}

export function SoundtrackChip({
  trackId,
  title,
  artist,
  thumbnail,
  variant = "feed",
  onPlayStateChange,
}: SoundtrackChipProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<SoundtrackChipPlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!trackId || !containerRef.current) return;

    let mounted = true;
    const playerContainerId = `yt-chip-${trackId}-${Math.random().toString(36).slice(2, 8)}`;

    const container = containerRef.current;
    const div = document.createElement("div");
    div.id = playerContainerId;
    container.innerHTML = "";
    container.appendChild(div);

    loadYouTubeAPI().then(() => {
      if (!mounted || !window.YT || !window.YT.Player) {
        setLoadError(true);
        return;
      }

      try {
        playerRef.current = new window.YT.Player(playerContainerId, {
          videoId: trackId,
          width: 1,
          height: 1,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            loop: 1,
          },
          events: {
            onReady: () => { if (mounted) setIsReady(true); },
            onError: () => { if (mounted) setLoadError(true); },
          },
        });
      } catch {
        if (mounted) setLoadError(true);
      }
    });

    return () => {
      mounted = false;
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }
    };
  }, [trackId]);

  const togglePlay = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const player = playerRef.current;
    if (!player) return;

    try {
      if (isPlaying) {
        player.pauseVideo();
        setIsPlaying(false);
        onPlayStateChange?.(false);
      } else {
        player.playVideo();
        setIsPlaying(true);
        onPlayStateChange?.(true);
      }
    } catch {}
  }, [isPlaying, onPlayStateChange]);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const player = playerRef.current;
    if (!player) return;

    try {
      if (isMuted) {
        player.unMute();
        setIsMuted(false);
      } else {
        player.mute();
        setIsMuted(true);
      }
    } catch {}
  }, [isMuted]);

  if (!trackId || loadError) return null;

  const isDetail = variant === "detail";

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "absolute z-20 flex items-center gap-2 rounded-xl backdrop-blur-md shadow-lg",
        isDetail
          ? "bottom-4 left-4 bg-black/60 px-3 py-2"
          : "bottom-2 left-2 bg-black/60 px-2 py-1.5",
        "select-none"
      )}
    >
      <div ref={containerRef} className="absolute h-0 w-0 overflow-hidden opacity-0" />

      {thumbnail ? (
        <img
          src={thumbnail}
          alt={title || "Soundtrack"}
          className={cn(
            "shrink-0 rounded object-cover",
            isDetail ? "h-8 w-8" : "h-6 w-6"
          )}
        />
      ) : (
        <div className={cn(
          "flex shrink-0 items-center justify-center rounded bg-white/10",
          isDetail ? "h-8 w-8" : "h-6 w-6"
        )}>
          <Music className={cn("text-white/70", isDetail ? "h-3.5 w-3.5" : "h-2.5 w-2.5")} />
        </div>
      )}

      <div className="min-w-0 max-w-[140px] sm:max-w-[200px]">
        {title && (
          <p className={cn(
            "truncate font-medium text-white",
            isDetail ? "text-xs" : "text-[10px]"
          )}>
            {title}
          </p>
        )}
        {artist && (
          <p className={cn(
            "truncate text-white/60",
            isDetail ? "text-[10px]" : "text-[9px]"
          )}>
            {artist}
          </p>
        )}
      </div>

      <button
        onClick={togglePlay}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30",
          isDetail ? "h-8 w-8" : "h-6 w-6"
        )}
        aria-label={isPlaying ? "Pause soundtrack" : "Play soundtrack"}
      >
        {isPlaying ? (
          <Pause className={cn(isDetail ? "h-3.5 w-3.5" : "h-2.5 w-2.5")} />
        ) : (
          <Play className={cn(isDetail ? "h-3.5 w-3.5" : "h-2.5 w-2.5", "ml-0.5")} />
        )}
      </button>

      <button
        onClick={toggleMute}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full text-white/70 transition-colors hover:text-white",
          isDetail ? "h-8 w-8" : "h-6 w-6"
        )}
        aria-label={isMuted ? "Unmute soundtrack" : "Mute soundtrack"}
      >
        {isMuted ? (
          <VolumeX className={cn(isDetail ? "h-3.5 w-3.5" : "h-2.5 w-2.5")} />
        ) : (
          <Volume2 className={cn(isDetail ? "h-3.5 w-3.5" : "h-2.5 w-2.5")} />
        )}
      </button>
    </div>
  );
}
