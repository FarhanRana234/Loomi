"use client";

import { useState, useRef, useCallback } from "react";

export function useDebouncedSearch(
  onSearch: (value: string) => void,
  delay = 300
) {
  const [value, setValue] = useState("");
  const [isPending, setIsPending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerSearch = useCallback(
    (searchValue: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setIsPending(true);
      timerRef.current = setTimeout(() => {
        onSearch(searchValue);
        setIsPending(false);
      }, delay);
    },
    [onSearch, delay]
  );

  const handleChange = useCallback(
    (newValue: string) => {
      setValue(newValue);
      triggerSearch(newValue);
    },
    [triggerSearch]
  );

  const handleSubmit = useCallback(
    (submitValue: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setIsPending(false);
      onSearch(submitValue);
    },
    [onSearch]
  );

  return { value, isPending, handleChange, handleSubmit };
}
