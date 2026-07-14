"use client";

import { Download } from "lucide-react";
import { handleDownload } from "@/lib/download";

interface DownloadButtonProps {
  url: string;
  filename: string;
  isDownloadable?: boolean;
}

export function DownloadButton({ url, filename, isDownloadable = true }: DownloadButtonProps) {
  if (!isDownloadable) return null;

  return (
    <button
      onClick={() => handleDownload(url, filename, true)}
      title="Download"
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      <Download className="h-4 w-4" />
    </button>
  );
}
