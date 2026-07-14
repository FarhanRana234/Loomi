"use client";

interface MoodboardThumbnailProps {
  images: string[];
  className?: string;
}

export function MoodboardThumbnail({ images, className = "" }: MoodboardThumbnailProps) {
  const slots = Array.from({ length: 4 }, (_, i) => images[i] || null);
  const count = images.length;

  if (count === 0) {
    return (
      <div className={`grid grid-cols-2 gap-0.5 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 ${className}`}>
        {slots.map((_, i) => (
          <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-700" />
        ))}
      </div>
    );
  }

  if (count === 1) {
    return (
      <div className={`overflow-hidden rounded-lg ${className}`}>
        <img
          src={slots[0]!}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 gap-0.5 overflow-hidden rounded-lg ${className}`}>
      {slots.map((src, i) => (
        <div key={i} className="aspect-square overflow-hidden">
          {src ? (
            <img src={src} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gray-200 dark:bg-gray-700" />
          )}
        </div>
      ))}
    </div>
  );
}
