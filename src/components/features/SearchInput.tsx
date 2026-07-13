"use client";

import { Loader2, Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  isPending: boolean;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({
  value,
  isPending,
  onChange,
  onSubmit,
  placeholder = "Search projects...",
}: SearchInputProps) {
  return (
    <div className="relative w-full">
      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit(value);
        }}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-input bg-transparent pl-8 pr-8 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      {isPending && (
        <Loader2 className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}
