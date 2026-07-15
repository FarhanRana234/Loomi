"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Music, X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface YouTubeVideo {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
}

interface SoundtrackSearchProps {
  value: { id: string; title: string; artist: string; thumbnail: string } | null;
  onChange: (track: { id: string; title: string; artist: string; thumbnail: string } | null) => void;
}

export function SoundtrackSearch({ value, onChange }: SoundtrackSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YouTubeVideo[]>([]);
  const [searching, setSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.data || []);
      }
    } catch {
      setResults([]);
    }
    setSearching(false);
  }, []);

  const handleQueryChange = (val: string) => {
    setQuery(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.trim().length >= 2) {
      setIsOpen(true);
      debounceRef.current = setTimeout(() => search(val), 400);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const selectTrack = (video: YouTubeVideo) => {
    onChange({
      id: video.videoId,
      title: video.title,
      artist: video.channel,
      thumbnail: video.thumbnail,
    });
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  const clearSoundtrack = () => {
    onChange(null);
    setQuery("");
    setResults([]);
  };

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-3">
        {value.thumbnail ? (
          <img
            src={value.thumbnail}
            alt={value.title}
            className="h-10 w-10 shrink-0 rounded object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-red-500/10">
            <Music className="h-4 w-4 text-red-500" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{value.title}</p>
          <p className="truncate text-xs text-muted-foreground">{value.artist}</p>
        </div>
        <button
          type="button"
          onClick={clearSoundtrack}
          className="rounded-full p-1 text-muted-foreground hover:text-foreground"
          aria-label="Remove soundtrack"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder="Search YouTube for a soundtrack..."
          className="pl-9"
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-80 w-full overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
          {results.map((video) => (
            <button
              key={video.videoId}
              type="button"
              onClick={() => selectTrack(video)}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent"
              )}
            >
              {video.thumbnail ? (
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="h-10 w-14 shrink-0 rounded object-cover"
                />
              ) : (
                <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded bg-muted">
                  <Music className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{video.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {video.channel}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.length >= 2 && !searching && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card p-4 text-center shadow-lg">
          <p className="text-sm text-muted-foreground">No videos found</p>
        </div>
      )}
    </div>
  );
}
