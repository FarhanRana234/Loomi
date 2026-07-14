"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Check, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MoodboardMini {
  _id: string;
  name: string;
  projects: { _id: string }[];
}

interface MoodboardSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSaved?: (moodboardId: string) => void;
}

export function MoodboardSelectModal({
  open,
  onOpenChange,
  projectId,
  onSaved,
}: MoodboardSelectModalProps) {
  const [moodboards, setMoodboards] = useState<MoodboardMini[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchMoodboards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/moodboards");
      if (res.ok) {
        const d = await res.json();
        if (d.success) setMoodboards(d.data || []);
      }
    } catch {
      // silent
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) fetchMoodboards();
  }, [open, fetchMoodboards]);

  const handleSave = async (mbId: string) => {
    setSaving(mbId);
    try {
      const res = await fetch(`/api/moodboards/${mbId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", projectId }),
      });
      if (res.ok) {
        toast.success("Saved to moodboard");
        setMoodboards((prev) =>
          prev.map((m) =>
            m._id === mbId
              ? {
                  ...m,
                  projects: m.projects.some((p) => p._id === projectId)
                    ? m.projects
                    : [...m.projects, { _id: projectId }],
                }
              : m
          )
        );
        onSaved?.(mbId);
        onOpenChange(false);
      } else {
        toast.error("Failed to save");
      }
    } catch {
      toast.error("Failed to save");
    }
    setSaving(null);
  };

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/moodboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, visibility: "public" }),
      });
      if (res.ok) {
        const d = await res.json();
        setNewName("");
        await fetchMoodboards();
        if (d.data?._id) {
          handleSave(d.data._id);
        }
      } else {
        toast.error("Failed to create moodboard");
      }
    } catch {
      toast.error("Failed to create moodboard");
    }
    setCreating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save to Moodboard</DialogTitle>
          <DialogDescription>
            Choose a moodboard or create a new one.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex gap-2">
          <Input
            placeholder="New moodboard name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            className="flex-1"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleCreate}
            disabled={!newName.trim() || creating}
          >
            <Plus className="mr-1 h-4 w-4" />
            Create
          </Button>
        </div>

        <div className="mt-3 max-h-64 space-y-1 overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : moodboards.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No moodboards yet. Create one above.
            </div>
          ) : (
            moodboards.map((mb) => {
              const alreadySaved = mb.projects.some((p) => p._id === projectId);
              return (
                <button
                  key={mb._id}
                  onClick={() => !alreadySaved && handleSave(mb._id)}
                  disabled={saving !== null || alreadySaved}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent disabled:opacity-60"
                >
                  <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate font-medium">{mb.name}</span>
                  {alreadySaved ? (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Check className="h-3.5 w-3.5" />
                      Saved
                    </span>
                  ) : saving === mb._id ? (
                    <span className="text-xs text-muted-foreground">Saving...</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {mb.projects.length} items
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
