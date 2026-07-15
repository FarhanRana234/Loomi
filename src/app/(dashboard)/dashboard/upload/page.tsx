"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { X, Shield, ShieldCheck, Plus, GripVertical } from "lucide-react";
import { z } from "zod";
import { CategorySelector } from "@/components/features/CategorySelector";
import { SoundtrackSearch } from "@/components/features/SoundtrackSearch";

const uploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  projectCategories: z.array(z.string()).min(1, "At least one category is required."),
});

interface FileEntry {
  file: File;
  preview: string;
  type: "image" | "video";
}

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectCategories, setProjectCategories] = useState<string[]>([]);
  const [isProtected, setIsProtected] = useState(false);
  const [isDownloadable, setIsDownloadable] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [soundtrack, setSoundtrack] = useState<{ id: string; title: string; artist: string; thumbnail: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length === 0) return;

    const entries: FileEntry[] = newFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith("video/") ? "video" : "image",
    }));

    setFiles((prev) => {
      const hasVideo = entries.some((e) => e.type === "video") || prev.some((e) => e.type === "video");
      if (hasVideo) {
        prev.forEach((e) => URL.revokeObjectURL(e.preview));
        return entries.filter((e) => e.type === "video").slice(0, 1);
      }
      return [...prev, ...entries].filter((e) => e.type === "image").slice(0, 10);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const hasVideo = files.some((f) => f.type === "video");
  const isMultiImage = files.filter((f) => f.type === "image").length > 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validation = uploadSchema.safeParse({ title, description, projectCategories });
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    if (files.length === 0) {
      setError("Please select at least one file");
      return;
    }

    setUploading(true);

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        throw new Error("Cloudinary not configured");
      }

      const uploadedUrls: string[] = [];
      const uploadedIds: string[] = [];
      const totalFiles = files.length;

      for (let i = 0; i < totalFiles; i++) {
        setProgress(Math.round(((i + 0.5) / totalFiles) * 70));

        const formData = new FormData();
        formData.append("file", files[i].file);
        formData.append("upload_preset", uploadPreset);
        formData.append("resource_type", "auto");

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
          { method: "POST", body: formData }
        );

        if (!uploadRes.ok) throw new Error(`Upload failed for file ${i + 1}`);

        const uploadData = await uploadRes.json();
        uploadedUrls.push(uploadData.secure_url);
        uploadedIds.push(uploadData.public_id);
      }

      setProgress(75);

      const primaryMedia = files[0];
      const mediaType = hasVideo ? "video" : "image";

      const projectRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          categories: projectCategories,
          cloudinaryPublicId: uploadedIds[0],
          mediaUrl: uploadedUrls[0],
          mediaType,
          images: isMultiImage ? uploadedUrls : [],
          soundtrackId: soundtrack?.id || "",
          soundtrackTitle: soundtrack?.title || "",
          soundtrackArtist: soundtrack?.artist || "",
          soundtrackThumbnail: soundtrack?.thumbnail || "",
          protected: isProtected,
          isDownloadable,
        }),
      });

      if (!projectRes.ok) throw new Error("Failed to save project");

      setProgress(100);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight">Upload Project</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Share your creative work with the community
      </p>

      <Card className="mt-8">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {files.length > 0 ? (
              <div className="space-y-3">
                {hasVideo ? (
                  <div className="relative overflow-hidden rounded-xl border border-border">
                    <video
                      src={files[0].preview}
                      controls
                      className="w-full max-h-80 object-contain bg-muted"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(0)}
                      className="absolute right-2 top-2 rounded-full bg-foreground/80 p-1.5 text-background hover:bg-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="p-3 text-center text-xs text-muted-foreground">
                      {files[0].file.name}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {files.map((entry, idx) => (
                      <div key={idx} className="group/file relative overflow-hidden rounded-xl border border-border">
                        <img
                          src={entry.preview}
                          alt={`Upload ${idx + 1}`}
                          className="aspect-square w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="absolute right-1.5 top-1.5 rounded-full bg-foreground/80 p-1 text-background opacity-0 transition-opacity group-hover/file:opacity-100 hover:bg-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        {idx === 0 && (
                          <div className="absolute left-1.5 top-1.5 rounded-full bg-foreground/80 px-1.5 py-0.5 text-[10px] font-medium text-background">
                            Cover
                          </div>
                        )}
                      </div>
                    ))}
                    {files.length < 10 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-border transition-colors hover:border-foreground/30"
                      >
                        <Plus className="h-6 w-6 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {files.length} file{files.length !== 1 ? "s" : ""} selected
                    {files.length < 10 && !hasVideo && " (max 10)"}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      files.forEach((f) => URL.revokeObjectURL(f.preview));
                      setFiles([]);
                    }}
                    className="text-xs text-muted-foreground underline hover:text-foreground"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-foreground/30">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                <label
                  className="cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <p className="text-sm font-medium">Click or drag to upload</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Select multiple images or a single video
                  </p>
                </label>
              </div>
            )}

            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-foreground transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Title <span className="text-destructive">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Project title"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell the story behind this project..."
                rows={4}
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Categories</label>
              <CategorySelector
                value={projectCategories}
                onChange={setProjectCategories}
                placeholder="Add categories..."
                max={10}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Soundtrack (optional)</label>
              <SoundtrackSearch value={soundtrack} onChange={setSoundtrack} />
            </div>

            <button
              type="button"
              onClick={() => setIsProtected(!isProtected)}
              className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                isProtected
                  ? "border-blue-500/50 bg-blue-500/5"
                  : "border-border hover:border-foreground/20"
              }`}
            >
              {isProtected ? (
                <ShieldCheck className="h-5 w-5 shrink-0 text-blue-500" />
              ) : (
                <Shield className="h-5 w-5 shrink-0 text-muted-foreground" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">Protect Asset</p>
                <p className="text-xs text-muted-foreground">
                  Disables right-click and adds a watermark to your image
                </p>
              </div>
              <div
                className={`h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors ${
                  isProtected ? "bg-blue-500" : "bg-muted"
                }`}
              >
                <div
                  className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                    isProtected ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsDownloadable(!isDownloadable)}
              className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                isDownloadable
                  ? "border-green-500/50 bg-green-500/5"
                  : "border-border hover:border-foreground/20"
              }`}
            >
              <div className={`h-5 w-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-colors ${
                isDownloadable ? "border-green-500 bg-green-500" : "border-muted-foreground"
              }`}>
                {isDownloadable && (
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Allow Downloads</p>
                <p className="text-xs text-muted-foreground">
                  Let visitors download the original file
                </p>
              </div>
            </button>

            <Button
              type="submit"
              className="w-full"
              disabled={uploading || files.length === 0}
            >
              {uploading ? "Uploading..." : "Publish Project"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
