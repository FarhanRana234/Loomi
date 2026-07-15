"use client";

import { useEffect, useRef, useCallback } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { soundManager } from "@/lib/sound-manager";
import { useSoundStore } from "@/hooks/useSoundStore";
import { cn } from "@/lib/utils";

interface SoundButtonProps {
  trackId: string;
  className?: string;
}

export function SoundButton({ trackId, className }: SoundButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);
  const currentTrackId = useSoundStore((s) => s.currentTrackId);
  const isPlaying = currentTrackId === trackId;

  useEffect(() => {
    if (!trackId || !containerRef.current || loadedRef.current) return;
    loadedRef.current = true;
    soundManager.load(trackId, containerRef.current);
  }, [trackId]);

  useEffect(() => {
    return () => {
      soundManager.unload(trackId);
    };
  }, [trackId]);

  const toggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    soundManager.toggle(trackId);
  }, [trackId]);

  return (
    <>
      <div ref={containerRef} className="absolute h-0 w-0 overflow-hidden opacity-0" />
      <button
        onClick={toggle}
        className={cn(
          "flex items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70",
          className
        )}
        aria-label={isPlaying ? "Mute soundtrack" : "Unmute soundtrack"}
      >
        {isPlaying ? (
          <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        ) : (
          <VolumeX className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        )}
      </button>
    </>
  );
}
