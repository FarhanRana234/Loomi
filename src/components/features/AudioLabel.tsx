"use client";

import { Music } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrackMarqueeProps {
  text: string;
  className?: string;
}

export function TrackMarquee({ text, className }: TrackMarqueeProps) {
  const displayText = text || "Unknown track";

  return (
    <div
      className={cn(
        "absolute top-3 left-3 z-20 flex items-center gap-2 overflow-hidden rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-md",
        className
      )}
    >
      <Music className="h-3 w-3 shrink-0 text-white/80" />
      <div className="relative min-w-0 max-w-[180px] sm:max-w-[260px]">
        <div className="flex whitespace-nowrap animate-marquee">
          <span className="pr-12 text-xs font-medium text-white">{displayText}</span>
          <span className="pr-12 text-xs font-medium text-white">{displayText}</span>
        </div>
      </div>
    </div>
  );
}

interface AudioLabelProps {
  text: string;
  className?: string;
}

export function AudioLabel({ text, className }: AudioLabelProps) {
  return (
    <div
      className={cn(
        "absolute top-3 left-3 z-20 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-md",
        className
      )}
    >
      <Music className="h-3 w-3 shrink-0 text-white/80" />
      <span className="text-xs font-medium text-white">{text}</span>
    </div>
  );
}
