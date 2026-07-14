import { toast } from "sonner";

export async function handleDownload(
  url: string,
  filename: string,
  isDownloadable: boolean
) {
  if (!isDownloadable) {
    toast.error("Downloads are disabled by the creator");
    return;
  }

  const isVideo = /\.(mp4|webm|mov)$/i.test(url) || url.includes("video");

  if (isVideo) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error("Download failed");
    }
  }
}
