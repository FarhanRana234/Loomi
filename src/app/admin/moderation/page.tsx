"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Trash2 } from "lucide-react";
import type { IProject } from "@/types";

export default function ModerationPage() {
  const [flagged, setFlagged] = useState<IProject[]>([]);

  useEffect(() => {
    fetch("/api/admin/flagged")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setFlagged(d.data || []);
      });
  }, []);

  const handleApprove = async (id: string) => {
    await fetch(`/api/admin/projects/${id}/approve`, { method: "POST" });
    setFlagged((prev) => prev.filter((p) => p._id !== id));
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/projects/${id}`, { method: "DELETE" });
    setFlagged((prev) => prev.filter((p) => p._id !== id));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight">Moderation Queue</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Review flagged projects for approval or removal
      </p>

      <Card className="mt-8">
        <CardContent className="pt-6">
          {flagged.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No flagged projects. Everything looks good.
            </p>
          ) : (
            <div className="space-y-3">
              {flagged.map((project) => (
                <div
                  key={project._id}
                  className="flex items-center gap-4 rounded-xl border border-border p-4"
                >
                  <img
                    src={project.mediaUrl}
                    alt={project.title}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{project.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {project.description.slice(0, 100)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApprove(project._id)}
                    >
                      <Check className="mr-1 h-3.5 w-3.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(project._id)}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
