"use client";

import { useUIStore } from "@/hooks/useUIStore";
import { Loader2 } from "lucide-react";

export function BlockingLoader() {
  const isGlobalBlocking = useUIStore((s) => s.isGlobalBlocking);

  if (!isGlobalBlocking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
        <p className="text-sm text-muted-foreground">Processing...</p>
      </div>
    </div>
  );
}
