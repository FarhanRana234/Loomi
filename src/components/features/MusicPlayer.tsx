"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Volume2, VolumeX, Play } from "lucide-react";
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
          events?: Record<string, (event: { target: YT.Player }) => void>;
        }
      ) => YT.Player;
    };
    onYouTubeIframeAPIReady: () => void;
  }

  namespace YT {
    class Player {
      playVideo(): void;
      pauseVideo(): void;
      mute(): void;
      unMute(): void;
      destroy(): void;
    }
  }
}

interface MusicPlayerProps {
  trackId: string;
  title?: string;
  artist?: string;
  thumbnail?: string;
  className?: string;
  compact?: boolean;
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

export function MusicPlayer({
  trackId,
  title,
  artist,
  thumbnail,
  className,
  compact = false,
}: MusicPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!trackId || !containerRef.current) return;

    let mounted = true;
    const playerContainerId = `yt-player-${trackId}-${Math.random().toString(36).slice(2, 8)}`;

    const container = containerRef.current;
    const div = document.createElement("div");
    div.id = playerContainerId;
    div.className = "w-full";
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
          width: "100%",
          height: compact ? "52" : "80",
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
          },
          events: {
            onReady: () => {
              if (mounted) setIsReady(true);
            },
            onError: () => {
              if (mounted) setLoadError(true);
            },
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
  }, [trackId, compact]);

  const togglePlay = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    try {
      if (isPlaying) {
        player.pauseVideo();
        setIsPlaying(false);
      } else {
        player.playVideo();
        setIsPlaying(true);
      }
    } catch {}
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
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

  if (!trackId) return null;

  if (loadError) {
    return (
      <div className={cn("rounded-xl border border-border bg-muted/50 p-3", className)}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Play className="h-3 w-3" />
          <span>Soundtrack unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl overflow-hidden", className)}>
      {(title || artist) && !compact && (
        <div className="mb-2 flex items-center gap-2 px-1">
          <button
            onClick={togglePlay}
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors",
              isPlaying ? "bg-red-500/20 text-red-500" : "bg-red-500/10 text-red-500"
            )}
            aria-label={isPlaying ? "Pause soundtrack" : "Play soundtrack"}
          >
            {isPlaying ? (
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <div className="min-w-0 flex-1">
            {title && (
              <p className="truncate text-xs font-medium">{title}</p>
            )}
            {artist && (
              <p className="truncate text-[10px] text-muted-foreground">{artist}</p>
            )}
          </div>
          <button
            onClick={toggleMute}
            className="rounded-full p-1 text-muted-foreground hover:text-foreground"
            aria-label={isMuted ? "Unmute soundtrack" : "Mute soundtrack"}
          >
            {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      )}
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
