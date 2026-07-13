"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ProjectCard } from "./ProjectCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import type { IProject } from "@/types";

export function FeedMasonry() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const tag = searchParams.get("tag") || "";
  const [projects, setProjects] = useState<IProject[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const fetchProjects = useCallback(async (pageNum: number, search: string, searchTag: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: "12" });
      if (search) params.set("q", search);
      if (searchTag) params.set("tag", searchTag);
      const res = await fetch(`/api/projects?${params}`);
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
    setPage(1);
    fetchProjects(1, q, tag);
  }, [q, tag, fetchProjects]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 800 &&
        !loading &&
        hasMore
      ) {
        setPage((p) => {
          const next = p + 1;
          fetchProjects(next, q, tag);
          return next;
        });
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, hasMore, fetchProjects, q, tag]);

  return (
    <div>
      {q && (
        <p className="mb-4 text-sm text-muted-foreground">
          Showing results for &ldquo;{q}&rdquo;
        </p>
      )}

      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
        {projects.map((project) => (
          <ProjectCard key={project._id} project={project} currentUserId={user?.uid} />
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
            {q ? "No results found" : "No projects yet"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground/60">
            {q ? "Try a different search term." : "Be the first to share your work with the community."}
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
