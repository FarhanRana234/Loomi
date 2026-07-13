"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Eye, EyeOff, X } from "lucide-react";
import { useUserStore } from "@/hooks/useUserStore";

interface Moodboard {
  _id: string;
  name: string;
  description: string;
  isPublic: boolean;
  projectIds: { _id: string; title: string; mediaUrl: string }[];
  createdAt: string;
}

function MoodboardsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useUserStore((s) => s.user);
  const [moodboards, setMoodboards] = useState<Moodboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

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
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) fetchMoodboards();
  }, [user, fetchMoodboards]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/moodboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, description: newDesc }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.success) setMoodboards([d.data, ...moodboards]);
        setShowCreate(false);
        setNewName("");
        setNewDesc("");
      }
    } catch {
      // silent
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/moodboards/${id}`, { method: "DELETE" });
    if (res.ok) setMoodboards(moodboards.filter((m) => m._id !== id));
  };

  const addProjectParam = searchParams.get("add");

  useEffect(() => {
    if (addProjectParam && moodboards.length > 0) {
      const add = async () => {
        for (const mb of moodboards) {
          const already = mb.projectIds.some((p) => p._id === addProjectParam);
          if (!already) {
            await fetch(`/api/moodboards/${mb._id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "add", projectId: addProjectParam }),
            });
          }
        }
        fetchMoodboards();
        router.replace("/dashboard/moodboards");
      };
      add();
    }
  }, [addProjectParam, moodboards, fetchMoodboards, router]);

  if (!user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Sign in to manage moodboards</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Moodboards</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize projects into curated collections
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Board
        </Button>
      </div>

      {showCreate && (
        <Card className="mt-6">
          <CardContent className="pt-6 space-y-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Board name"
              autoFocus
            />
            <Input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description (optional)"
            />
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
                {creating ? "Creating..." : "Create"}
              </Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="mt-8 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : moodboards.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">No moodboards yet</p>
          <p className="mt-1 text-sm text-muted-foreground/60">
            Create one to start curating projects
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {moodboards.map((mb) => (
            <Card key={mb._id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base">{mb.name}</CardTitle>
                  {mb.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {mb.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {mb.isPublic ? (
                      <><Eye className="mr-1 h-3 w-3" />Public</>
                    ) : (
                      <><EyeOff className="mr-1 h-3 w-3" />Private</>
                    )}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDelete(mb._id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {mb.projectIds.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    Empty board — save projects from the feed
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                    {mb.projectIds.map((p) => (
                      <div
                        key={p._id}
                        className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg"
                        onClick={() => router.push(`/project/${p._id}`)}
                      >
                        <img
                          src={p.mediaUrl}
                          alt={p.title}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                        <button
                          className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white group-hover:flex"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await fetch(`/api/moodboards/${mb._id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ action: "remove", projectId: p._id }),
                            });
                            fetchMoodboards();
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MoodboardsPage() {
  return (
    <Suspense>
      <MoodboardsContent />
    </Suspense>
  );
}
