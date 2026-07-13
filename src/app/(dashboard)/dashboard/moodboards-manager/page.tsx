"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  GripVertical,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface MoodboardProject {
  _id: string;
  title: string;
  mediaUrl: string;
  thumbnailUrl?: string;
}

interface Moodboard {
  _id: string;
  name: string;
  visibility: "public" | "private";
  projects: MoodboardProject[];
  createdAt: string;
}

export default function MoodboardsManagerPage() {
  const [moodboards, setMoodboards] = useState<Moodboard[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const fetchMoodboards = useCallback(async () => {
    try {
      const res = await fetch("/api/moodboards");
      if (res.ok) {
        const d = await res.json();
        if (d.success) setMoodboards(d.data || []);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchMoodboards();
  }, [fetchMoodboards]);

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setCreating(true);
    try {
      const res = await fetch("/api/moodboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, visibility: "public" }),
      });
      if (res.ok) {
        toast.success("Moodboard created");
        setNewName("");
        fetchMoodboards();
      } else {
        toast.error("Failed to create");
      }
    } catch {
      toast.error("Failed to create");
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this moodboard? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/moodboards/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Moodboard deleted");
        fetchMoodboards();
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleToggleVisibility = async (mb: Moodboard) => {
    const next = mb.visibility === "public" ? "private" : "public";
    try {
      const res = await fetch(`/api/moodboards/${mb._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: next }),
      });
      if (res.ok) {
        setMoodboards((prev) =>
          prev.map((m) =>
            m._id === mb._id ? { ...m, visibility: next } : m
          )
        );
        toast.success(`Now ${next}`);
      }
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleRename = async (mb: Moodboard) => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === mb.name) {
      setEditingId(null);
      return;
    }
    try {
      const res = await fetch(`/api/moodboards/${mb._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        setMoodboards((prev) =>
          prev.map((m) => (m._id === mb._id ? { ...m, name: trimmed } : m))
        );
        toast.success("Renamed");
      }
    } catch {
      toast.error("Failed to rename");
    }
    setEditingId(null);
  };

  const handleRemoveProject = async (mbId: string, projectId: string) => {
    try {
      const res = await fetch(`/api/moodboards/${mbId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", projectId }),
      });
      if (res.ok) {
        setMoodboards((prev) =>
          prev.map((m) =>
            m._id === mbId
              ? { ...m, projects: m.projects.filter((p) => p._id !== projectId) }
              : m
          )
        );
        toast.success("Project removed");
      }
    } catch {
      toast.error("Failed to remove project");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Moodboards</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Organize projects into collections and control who sees them.
        </p>
      </div>

      {/* Create new */}
      <div className="mt-8 flex gap-2">
        <Input
          placeholder="New moodboard name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          className="max-w-xs"
        />
        <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
          {creating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Create
        </Button>
      </div>

      {/* Moodboards list */}
      {moodboards.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">No moodboards yet.</p>
          <p className="mt-1 text-sm text-muted-foreground/60">
            Create one above to start collecting projects.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {moodboards.map((mb) => (
            <div
              key={mb._id}
              className="rounded-xl border border-border bg-card"
            >
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                <div className="flex-1">
                  {editingId === mb._id ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(mb);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      onBlur={() => handleRename(mb)}
                      className="h-7 max-w-xs text-sm"
                      autoFocus
                    />
                  ) : (
                    <h3
                      className="cursor-pointer text-sm font-medium hover:underline"
                      onClick={() => {
                        setEditingId(mb._id);
                        setEditName(mb.name);
                      }}
                    >
                      {mb.name}
                    </h3>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={`gap-1 text-[10px] ${
                    mb.visibility === "private"
                      ? "text-amber-500"
                      : "text-emerald-500"
                  }`}
                >
                  {mb.visibility === "private" ? (
                    <EyeOff className="h-3 w-3" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                  {mb.visibility}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleToggleVisibility(mb)}
                  title={`Make ${mb.visibility === "public" ? "private" : "public"}`}
                >
                  {mb.visibility === "public" ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => handleDelete(mb._id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Projects grid */}
              <div className="px-4 py-3">
                {mb.projects.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    Empty — save projects from their detail page.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                    {mb.projects.map((p) => (
                      <div key={p._id} className="group relative">
                        <img
                          src={p.thumbnailUrl || p.mediaUrl}
                          alt={p.title}
                          className="aspect-square w-full rounded-lg object-cover"
                          loading="lazy"
                        />
                        <button
                          className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground group-hover:flex"
                          onClick={() => handleRemoveProject(mb._id, p._id)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
