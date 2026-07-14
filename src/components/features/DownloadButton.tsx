"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { handleDownload } from "@/lib/download";

interface DownloadButtonProps {
  url: string;
  filename: string;
  isDownloadable: boolean;
}

export function DownloadButton({ url, filename, isDownloadable }: DownloadButtonProps) {
  if (!isDownloadable) return null;

  return (
    <Button
      variant="outline"
      onClick={() => handleDownload(url, filename, isDownloadable)}
      className="min-h-[44px] min-w-[44px]"
    >
      <Download className="mr-2 h-4 w-4" />
      Download
    </Button>
  );
}
