"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
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
    setUploading(true);
    setError("");

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

      const resourceType = selectedFile.type.startsWith("video/") ? "video" : "image";
      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
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
          description,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          cloudinaryPublicId: uploadData.public_id,
          mediaUrl: uploadData.secure_url,
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

            {/* Upload Zone / Preview */}
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
              <label className="text-sm font-medium">Title</label>
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
              <label className="text-sm font-medium">Tags</label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="photography, portrait, editorial"
              />
              <p className="text-xs text-muted-foreground">Comma-separated</p>
            </div>

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
