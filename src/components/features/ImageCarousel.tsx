"use client";

import { useCallback, useEffect, useState } from "react";
import type { EmblaCarouselType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { cn } from "@/lib/utils";

interface ImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
  protectedImages?: string[];
  variant?: "feed" | "detail";
  onEmblaApi?: (api: EmblaCarouselType | null) => void;
}

export function ImageCarousel({
  images,
  alt,
  className,
  protectedImages,
  variant = "feed",
  onEmblaApi,
}: ImageCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: images.length > 1, dragFree: false },
    images.length > 1 ? [Autoplay({ delay: 5000, stopOnInteraction: true })] : []
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    onEmblaApi?.(emblaApi ?? null);
  }, [emblaApi, onEmblaApi]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  if (!images || images.length === 0) return null;

  const displayImages = protectedImages && protectedImages.length > 0
    ? protectedImages
    : images;

  const isDetail = variant === "detail";

  return (
    <div className={cn("group/carousel relative", className)}>
      <div className="overflow-hidden rounded-xl" ref={emblaRef}>
        <div className="flex">
          {displayImages.map((img, idx) => (
            <div
              key={idx}
              className="min-w-0 flex-[0_0_100%] relative"
            >
              <img
                src={img}
                alt={`${alt} ${idx + 1}`}
                className="h-auto w-full object-cover"
                loading={idx === 0 ? "eager" : "lazy"}
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); scrollPrev(); }}
            className={cn(
              "absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/80 p-1.5 text-foreground backdrop-blur-sm transition-opacity",
              "opacity-0 group-hover/carousel:opacity-100",
              !canScrollPrev && "hidden"
            )}
            aria-label="Previous image"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); scrollNext(); }}
            className={cn(
              "absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/80 p-1.5 text-foreground backdrop-blur-sm transition-opacity",
              "opacity-0 group-hover/carousel:opacity-100",
              !canScrollNext && "hidden"
            )}
            aria-label="Next image"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}

interface PaginationDotsProps {
  emblaApi: EmblaCarouselType | null;
  count: number;
  variant?: "feed" | "detail";
}

export function PaginationDots({ emblaApi, count, variant = "feed" }: PaginationDotsProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  if (count <= 1) return null;

  return (
    <div
      className="flex items-center justify-center my-2"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex gap-1.5">
        {Array.from({ length: count }, (_, idx) => (
          <button
            key={idx}
            onClick={() => emblaApi?.scrollTo(idx)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              variant === "detail"
                ? idx === selectedIndex
                  ? "w-5 bg-foreground"
                  : "w-1.5 bg-foreground/30"
                : idx === selectedIndex
                  ? "w-5 bg-foreground"
                  : "w-1.5 bg-foreground/30"
            )}
            aria-label={`Go to image ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
