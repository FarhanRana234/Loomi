"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Heart, FolderOpen, Plus, Bookmark } from "lucide-react";
import { AnalyticsChart } from "@/components/features/AnalyticsChart";
import { useAuthStore } from "@/lib/store";
import type { IProject, IUser } from "@/types";

export default function DashboardPage() {
  const storeUser = useAuthStore((s) => s.user);
  const [projects, setProjects] = useState<IProject[]>([]);
  const [stats, setStats] = useState({ views: 0, likes: 0, count: 0 });

  useEffect(() => {
    if (!storeUser) return;
    fetch(`/api/projects?userId=${storeUser._id}&limit=100`)
      .then((r) => r.json())
      .then((p) => {
        const items = p.data?.items || [];
        setProjects(items);
        setStats({
          views: items.reduce((a: number, i: IProject) => a + i.views, 0),
          likes: items.reduce((a: number, i: IProject) => a + i.likes.length, 0),
          count: items.length,
        });
      });
  }, [storeUser]);

  const chartData = projects.slice(0, 7).map((p) => ({
    name: p.title.slice(0, 8),
    views: p.views,
    likes: p.likes.length,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {storeUser?.username || "..."}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your creative portfolio
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/moodboards">
              <Bookmark className="mr-2 h-4 w-4" />
              Moodboards
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/upload">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Views
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.views}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Likes
            </CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.likes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Projects Published
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.count}</div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Project Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsChart data={chartData} />
          </CardContent>
        </Card>
      )}

      {/* Projects Table */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Your Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No projects yet.{" "}
              <Link href="/dashboard/upload" className="font-medium hover:underline">
                Upload your first project
              </Link>
            </p>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project._id}
                  className="flex items-center gap-4 rounded-xl border border-border p-3"
                >
                  <img
                    src={project.mediaUrl}
                    alt={project.title}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{project.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(project.createdAt).toLocaleDateString()} ·{" "}
                      {project.likes.length} likes · {project.views} views
                    </p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                    {project.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
