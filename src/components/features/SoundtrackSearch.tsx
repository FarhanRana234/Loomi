"use client";

import { useState, useCallback } from "react";
import { Music, X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
}

interface SoundtrackSearchProps {
  value: { id: string; title: string; artist: string } | null;
  onChange: (track: { id: string; title: string; artist: string } | null) => void;
}

export function SoundtrackSearch({ value, onChange }: SoundtrackSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [searching, setSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(q)}`);
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
    if (val.trim().length >= 2) {
      search(val);
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  };

  const selectTrack = (track: Track) => {
    onChange({ id: track.id, title: track.name, artist: track.artist });
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
      <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/5 p-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10">
          <Music className="h-4 w-4 text-green-500" />
        </div>
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
          placeholder="Search for a soundtrack..."
          className="pl-9"
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          {results.map((track) => (
            <button
              key={track.id}
              type="button"
              onClick={() => selectTrack(track)}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent"
              )}
            >
              {track.albumArt ? (
                <img
                  src={track.albumArt}
                  alt={track.album}
                  className="h-10 w-10 shrink-0 rounded object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted">
                  <Music className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{track.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {track.artist} &middot; {track.album}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.length >= 2 && !searching && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card p-4 text-center shadow-lg">
          <p className="text-sm text-muted-foreground">No tracks found</p>
        </div>
      )}
    </div>
  );
}
