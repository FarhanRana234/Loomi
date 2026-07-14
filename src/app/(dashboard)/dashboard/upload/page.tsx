"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Shield, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { CategorySelector } from "@/components/features/CategorySelector";

const CATEGORIES = [
  "Web Design",
  "Motion Graphics",
  "Photography",
  "Full-Stack Development",
];

const uploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.string().min(1, "Selecting a creative category is mandatory."),
  description: z.string().optional(),
  projectCategories: z.array(z.string()).optional(),
});

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [projectCategories, setProjectCategories] = useState<string[]>([]);
  const [isProtected, setIsProtected] = useState(false);
  const [isDownloadable, setIsDownloadable] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<"image" | "video" | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const url = URL.createObjectURL(file);

    if (file.type.startsWith("video/")) {
      setPreviewType("video");
    } else {
      setPreviewType("image");
    }
    setPreview(url);
  };

  const clearPreview = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setPreviewType(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validation = uploadSchema.safeParse({ title, category, description, projectCategories });
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setUploading(true);

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        throw new Error("Cloudinary not configured");
      }

      if (!selectedFile) {
        throw new Error("Please select a file");
      }

      setProgress(30);

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("upload_preset", uploadPreset);
      formData.append("resource_type", "auto");

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        { method: "POST", body: formData }
      );

      if (!uploadRes.ok) throw new Error("Upload failed");

      const uploadData = await uploadRes.json();
      setProgress(70);

      const projectRes = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          category,
          description,
          categories: projectCategories,
          cloudinaryPublicId: uploadData.public_id,
          mediaUrl: uploadData.secure_url,
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

            {preview && previewType === "image" ? (
              <div className="relative overflow-hidden rounded-xl border border-border">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full max-h-80 object-contain bg-muted"
                />
                <button
                  type="button"
                  onClick={clearPreview}
                  className="absolute right-2 top-2 rounded-full bg-foreground/80 p-1.5 text-background hover:bg-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="p-3 text-center text-xs text-muted-foreground">
                  {selectedFile?.name} ({(selectedFile?.size ?? 0 / 1024).toFixed(0)} KB)
                </div>
              </div>
            ) : preview && previewType === "video" ? (
              <div className="relative overflow-hidden rounded-xl border border-border">
                <video
                  src={preview}
                  controls
                  className="w-full max-h-80 object-contain bg-muted"
                />
                <button
                  type="button"
                  onClick={clearPreview}
                  className="absolute right-2 top-2 rounded-full bg-foreground/80 p-1.5 text-background hover:bg-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="p-3 text-center text-xs text-muted-foreground">
                  {selectedFile?.name}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-foreground/30">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <p className="text-sm font-medium">Click or drag to upload</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Images and videos accepted
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
              <label className="text-sm font-medium">
                Category <span className="text-destructive">*</span>
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a creative category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              disabled={uploading || !selectedFile}
            >
              {uploading ? "Uploading..." : "Publish Project"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
