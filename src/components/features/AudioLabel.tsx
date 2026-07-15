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
        "absolute top-2 left-2 z-20 flex items-center gap-1.5 overflow-hidden rounded-full bg-black/60 px-2 py-1 backdrop-blur-md sm:top-3 sm:left-3 sm:gap-2 sm:px-3 sm:py-1.5",
        className
      )}
    >
      <Music className="h-2.5 w-2.5 shrink-0 text-white/80 sm:h-3 sm:w-3" />
      <div className="relative min-w-0 max-w-[120px] sm:max-w-[260px]">
        <div className="flex whitespace-nowrap animate-marquee">
          <span className="pr-8 text-[10px] font-medium text-white sm:pr-12 sm:text-xs">{displayText}</span>
          <span className="pr-8 text-[10px] font-medium text-white sm:pr-12 sm:text-xs">{displayText}</span>
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
        "absolute top-2 left-2 z-20 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 backdrop-blur-md sm:top-3 sm:left-3 sm:gap-1.5 sm:px-3 sm:py-1.5",
        className
      )}
    >
      <Music className="h-2.5 w-2.5 shrink-0 text-white/80 sm:h-3 sm:w-3" />
      <span className="text-[10px] font-medium text-white sm:text-xs">{text}</span>
    </div>
  );
}
