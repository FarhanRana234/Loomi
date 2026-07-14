"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, X, Lock, Globe } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore } from "@/hooks/useUserStore";
import { useMediaColumns } from "@/hooks/useMediaColumns";
import { Skeleton } from "@/components/ui/skeleton";

interface MoodboardProject {
  _id: string;
  title: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  likes: string[];
  views: number;
  userId: { username: string };
}

interface MoodboardData {
  _id: string;
  name: string;
  visibility: "public" | "private";
  userId: string;
  projects: MoodboardProject[];
  createdAt: string;
}

function distributeToColumns<T>(items: T[], numColumns: number): T[][] {
  const columns: T[][] = Array.from({ length: numColumns }, () => []);
  items.forEach((item) => {
    const shortestIdx = columns.reduce((minIdx, col, idx) =>
      col.length < columns[minIdx].length ? idx : minIdx, 0);
    columns[shortestIdx].push(item);
  });
  return columns;
}

export default function MoodboardWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const numColumns = useMediaColumns();
  const [moodboard, setMoodboard] = useState<MoodboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/moodboards/${params.id}?view=true`)
      .then((r) => {
        if (r.status === 403) throw new Error("This moodboard is private");
        if (r.status === 404) throw new Error("Moodboard not found");
        return r.json();
      })
      .then((d) => {
        if (d.success) setMoodboard(d.data);
        else throw new Error(d.error || "Failed to load");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleRemove = useCallback(async (projectId: string) => {
    if (!moodboard) return;
    const prev = moodboard.projects;
    setMoodboard((mb) =>
      mb ? { ...mb, projects: mb.projects.filter((p) => p._id !== projectId) } : mb
    );
    setRemoving(projectId);
    try {
      const res = await fetch(`/api/moodboards/${moodboard._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", projectId }),
      });
      if (!res.ok) throw new Error();
      toast.success("Removed from board");
    } catch {
      setMoodboard((mb) => (mb ? { ...mb, projects: prev } : mb));
      toast.error("Failed to remove");
    }
    setRemoving(null);
  }, [moodboard]);

  const handleToggleVisibility = useCallback(async () => {
    if (!moodboard) return;
    const next = moodboard.visibility === "public" ? "private" : "public";
    setMoodboard((mb) => (mb ? { ...mb, visibility: next } : mb));
    try {
      const res = await fetch(`/api/moodboards/${moodboard._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: next }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Now ${next}`);
    } catch {
      setMoodboard((mb) =>
        mb ? { ...mb, visibility: next === "public" ? "private" : "public" } : mb
      );
      toast.error("Failed to update");
    }
  }, [moodboard]);

  const isOwner = user && moodboard && user.firebaseId === moodboard.userId;

  const columns = useMemo(
    () => distributeToColumns(moodboard?.projects || [], numColumns),
    [moodboard?.projects, numColumns]
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="mb-8 h-4 w-32" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !moodboard) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <p className="text-lg font-medium text-muted-foreground">
          {error || "Moodboard not found"}
        </p>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          Back to feed
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to feed
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{moodboard.name}</h1>
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={isOwner ? handleToggleVisibility : undefined}
              disabled={!isOwner}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                moodboard.visibility === "private"
                  ? "bg-amber-500/10 text-amber-600"
                  : "bg-emerald-500/10 text-emerald-600"
              } ${isOwner ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
            >
              {moodboard.visibility === "private" ? (
                <Lock className="h-3 w-3" />
              ) : (
                <Globe className="h-3 w-3" />
              )}
              {moodboard.visibility}
              {isOwner && (
                <span className="ml-0.5 opacity-60">
                  {moodboard.visibility === "public" ? (
                    <EyeOff className="h-3 w-3" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                </span>
              )}
            </button>
            <span className="text-xs text-muted-foreground">
              {moodboard.projects.length} project{moodboard.projects.length !== 1 && "s"}
            </span>
          </div>
        </div>
      </div>

      {moodboard.projects.length === 0 ? (
        <div className="mt-20 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            This board is empty
          </p>
          <p className="mt-1 text-sm text-muted-foreground/60">
            {isOwner
              ? "Save projects from their detail page to populate this board."
              : "No projects have been added yet."}
          </p>
        </div>
      ) : (
        <div className="mt-8 flex gap-4">
          {columns.map((col, colIdx) => (
            <div key={colIdx} className="flex min-w-0 flex-1 flex-col gap-4">
              <AnimatePresence mode="popLayout">
                {col.map((project) => (
                  <motion.div
                    key={project._id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{
                      opacity: { duration: 0.3 },
                      y: { duration: 0.3 },
                      layout: { type: "spring", stiffness: 300, damping: 30 },
                    }}
                    className="group relative overflow-hidden rounded-xl border border-border bg-card"
                  >
                    <Link href={`/project/${project._id}`}>
                      <img
                        src={project.thumbnailUrl || project.mediaUrl}
                        alt={project.title}
                        className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    </Link>

                    {isOwner && (
                      <button
                        onClick={() => handleRemove(project._id)}
                        disabled={removing === project._id}
                        className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80 disabled:opacity-40"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}

                    <div className="p-3">
                      <p className="text-sm font-medium line-clamp-1">
                        {project.title}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
