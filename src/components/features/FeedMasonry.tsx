"use client";

import { useEffect, useState, useCallback } from "react";
import { ProjectCard } from "./ProjectCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { IProject } from "@/types";

export function FeedMasonry() {
  const [projects, setProjects] = useState<IProject[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const fetchProjects = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects?page=${pageNum}&limit=12`);
      if (res.ok) {
        const data = await res.json();
        if (pageNum === 1) {
          setProjects(data.data?.items || []);
        } else {
          setProjects((prev) => [...prev, ...(data.data?.items || [])]);
        }
        setHasMore(pageNum < (data.data?.totalPages || 1));
      }
    } catch {
      // silent
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects(1);
  }, [fetchProjects]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 800 &&
        !loading &&
        hasMore
      ) {
        setPage((p) => {
          const next = p + 1;
          fetchProjects(next);
          return next;
        });
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, hasMore, fetchProjects]);

  return (
    <div>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
        {projects.map((project) => (
          <ProjectCard key={project._id} project={project} />
        ))}
      </div>

      {loading && (
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4 rounded-md" />
              <Skeleton className="h-3 w-1/2 rounded-md" />
            </div>
          ))}
        </div>
      )}

      {!loading && projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            No projects yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground/60">
            Be the first to share your work with the community.
          </p>
        </div>
      )}

      {!loading && !hasMore && projects.length > 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          You&apos;ve reached the end.
        </p>
      )}
    </div>
  );
}
