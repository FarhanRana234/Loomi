"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, FolderOpen, Flag, Trash2, Eye, Heart } from "lucide-react";
import { toast } from "sonner";
import type { IUser, IProject } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  published: "bg-green-500/10 text-green-600 border-green-500/20",
  draft: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  flagged: "bg-red-500/10 text-red-600 border-red-500/20",
};

export default function AdminPage() {
  const [users, setUsers] = useState<IUser[]>([]);
  const [projects, setProjects] = useState<IProject[]>([]);
  const [totalProjects, setTotalProjects] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const fetchProjects = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/projects?${params}`);
      const d = await res.json();
      if (d.success) {
        setProjects(d.data?.items || []);
        setTotalProjects(d.data?.total || 0);
      }
    } catch {
      // silent
    }
  }, [statusFilter]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      const d = await res.json();
      if (d.success) setUsers(d.data || []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDelete = async (projectId: string) => {
    if (!confirm("Delete this project? This will also remove it from Cloudinary and all moodboards. This cannot be undone.")) return;

    setDeleting(projectId);
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      toast.success("Project deleted");
      fetchProjects();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
    setDeleting(null);
  };

  const flaggedCount = projects.filter((p) => p.status === "flagged").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Platform management and moderation
      </p>

      {/* Metrics */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Projects
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Flagged
            </CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{flaggedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* All Projects */}
      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            All Projects
          </CardTitle>
          <div className="flex gap-1">
            {["", "published", "draft", "flagged"].map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setStatusFilter(s)}
              >
                {s || "All"}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No projects found
            </p>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => {
                const owner = project.userId as unknown as {
                  username: string;
                  avatarUrl: string;
                };
                return (
                  <div
                    key={project._id}
                    className="flex items-center gap-4 rounded-xl border border-border p-3"
                  >
                    <img
                      src={project.mediaUrl}
                      alt={project.title}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{project.title}</p>
                        <Badge
                          variant="outline"
                          className={`text-[10px] shrink-0 ${STATUS_COLORS[project.status] || ""}`}
                        >
                          {project.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        by {owner?.username || "unknown"} ·{" "}
                        {new Date(project.createdAt).toLocaleDateString()} ·{" "}
                        {project.likes.length} likes · {project.views} views
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                      >
                        <Link href={`/project/${project._id}`}>
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={deleting === project._id}
                        onClick={() => handleDelete(project._id)}
                      >
                        <Trash2
                          className={`h-4 w-4 ${
                            deleting === project._id
                              ? "animate-pulse text-muted-foreground"
                              : "text-destructive"
                          }`}
                        />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.map((u) => (
              <div
                key={u._id}
                className="flex items-center gap-4 rounded-xl border border-border p-3"
              >
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                  {u.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{u.username}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <Badge variant="outline">{u.role}</Badge>
              </div>
            ))}
            {users.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No users found
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
