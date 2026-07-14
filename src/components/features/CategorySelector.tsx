"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import categories from "@/data/categories.json";

interface CategorySelectorProps {
  value: string[];
  onChange: (categories: string[]) => void;
  placeholder?: string;
  max?: number;
}

export function CategorySelector({
  value,
  onChange,
  placeholder = "Add categories...",
  max = 10,
}: CategorySelectorProps) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const q = input.toLowerCase().trim();
    const filtered = categories.filter(
      (c) =>
        c.toLowerCase().includes(q) &&
        !value.some((v) => v.toLowerCase() === c.toLowerCase())
    );
    return filtered.slice(0, 8);
  }, [input, value]);

  const exactMatch = categories.some(
    (c) => c.toLowerCase() === input.toLowerCase().trim()
  );

  const showCustomOption =
    input.trim() &&
    !exactMatch &&
    !value.some((v) => v.toLowerCase() === input.toLowerCase().trim()) &&
    value.length < max;

  useEffect(() => {
    setHighlighted(0);
  }, [input]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const addCategory = (cat: string) => {
    const trimmed = cat.trim();
    if (!trimmed || value.length >= max) return;
    if (value.some((v) => v.toLowerCase() === trimmed.toLowerCase())) return;
    onChange([...value, trimmed]);
    setInput("");
  };

  const removeCategory = (cat: string) => {
    onChange(value.filter((v) => v !== cat));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalOptions = suggestions.length + (showCustomOption ? 1 : 0);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((prev) => (prev + 1) % Math.max(totalOptions, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((prev) => (prev - 1 + Math.max(totalOptions, 1)) % Math.max(totalOptions, 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (showCustomOption && highlighted === suggestions.length) {
        addCategory(input.trim());
      } else if (suggestions[highlighted]) {
        addCategory(suggestions[highlighted]);
      } else if (input.trim()) {
        addCategory(input.trim());
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      removeCategory(value[value.length - 1]);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          "flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm transition-colors",
          open && "ring-1 ring-ring"
        )}
      >
        <AnimatePresence mode="popLayout">
          {value.map((cat) => (
            <motion.span
              key={cat}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-0.5 text-xs font-medium text-background"
            >
              {cat}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeCategory(cat);
                }}
                className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-background/20"
              >
                <X className="h-3 w-3" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        {value.length < max && (
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? placeholder : ""}
            className="min-w-[120px] flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-muted-foreground"
          />
        )}
      </div>

      {open && (suggestions.length > 0 || showCustomOption) && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-background shadow-md">
          {suggestions.map((cat, i) => (
            <button
              key={cat}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addCategory(cat);
              }}
              onMouseEnter={() => setHighlighted(i)}
              className={cn(
                "flex w-full items-center px-3 py-2 text-sm transition-colors",
                i === highlighted ? "bg-accent text-foreground" : "text-foreground hover:bg-accent"
              )}
            >
              {cat}
            </button>
          ))}
          {showCustomOption && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addCategory(input.trim());
              }}
              onMouseEnter={() => setHighlighted(suggestions.length)}
              className={cn(
                "flex w-full items-center px-3 py-2 text-sm transition-colors",
                highlighted === suggestions.length
                  ? "bg-accent text-foreground"
                  : "text-foreground hover:bg-accent"
              )}
            >
              Create &ldquo;{input.trim()}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
