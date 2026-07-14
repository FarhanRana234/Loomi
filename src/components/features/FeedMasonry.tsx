"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ProjectCard } from "./ProjectCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useMediaColumns } from "@/hooks/useMediaColumns";
import type { IProject } from "@/types";

function distributeToColumns<T>(items: T[], numColumns: number): T[][] {
  const columns: T[][] = Array.from({ length: numColumns }, () => []);
  items.forEach((item) => {
    const shortestIdx = columns.reduce((minIdx, col, idx) =>
      col.length < columns[minIdx].length ? idx : minIdx, 0);
    columns[shortestIdx].push(item);
  });
  return columns;
}

export function FeedMasonry() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") || "";
  const categoriesParam = searchParams.get("categories") || "";
  const [projects, setProjects] = useState<IProject[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const numColumns = useMediaColumns();

  const fetchProjects = useCallback(async (pageNum: number, search: string, searchCategories: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: "12" });
      if (search) params.set("q", search);
      if (searchCategories) params.set("categories", searchCategories);
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
    fetchProjects(1, q, categoriesParam);
  }, [q, categoriesParam, fetchProjects]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 800 &&
        !loading &&
        hasMore
      ) {
        setPage((p) => {
          const next = p + 1;
          fetchProjects(next, q, categoriesParam);
          return next;
        });
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, hasMore, fetchProjects, q, categoriesParam]);

  const columns = useMemo(
    () => distributeToColumns(projects, numColumns),
    [projects, numColumns]
  );

  const activeCategories = categoriesParam
    ? categoriesParam.split(",").map((c) => c.trim()).filter(Boolean)
    : [];

  const removeCategory = (cat: string) => {
    const next = activeCategories.filter((c) => c !== cat);
    const sp = new URLSearchParams(searchParams.toString());
    if (next.length > 0) {
      sp.set("categories", next.join(","));
    } else {
      sp.delete("categories");
    }
    router.push(`/?${sp.toString()}`);
  };

  const clearFilters = () => {
    router.push("/");
  };

  return (
    <div>
      {(q || activeCategories.length > 0) && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {q && (
            <span className="text-sm text-muted-foreground">
              Showing results for &ldquo;{q}&rdquo;
            </span>
          )}
          {q && activeCategories.length > 0 && (
            <span className="text-sm text-muted-foreground">in</span>
          )}
          {activeCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => removeCategory(cat)}
              className="inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-1 text-xs font-medium text-background transition-opacity hover:opacity-80"
            >
              {cat}
              <X className="h-3 w-3" />
            </button>
          ))}
          {(q || activeCategories.length > 0) && (
            <button
              onClick={clearFilters}
              className="text-xs text-muted-foreground underline transition-colors hover:text-foreground"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {projects.length > 0 && (
        <div className="flex gap-4">
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
                      opacity: { duration: 0.5 },
                      y: { duration: 0.5 },
                      layout: { type: "spring", stiffness: 300, damping: 30 },
                    }}
                  >
                    <ProjectCard project={project} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {loading && projects.length === 0 && (
        <div className="flex gap-4">
          {Array.from({ length: numColumns }).map((_, colIdx) => (
            <div key={colIdx} className="flex min-w-0 flex-1 flex-col gap-4">
              {Array.from({ length: colIdx % 2 === 0 ? 3 : 2 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-3">
                  <Skeleton className={`w-full rounded-lg ${i % 2 === 0 ? "h-48" : "h-64"}`} />
                  <div className="mt-3 space-y-2">
                    <Skeleton className="h-4 w-3/4 rounded-md" />
                    <Skeleton className="h-3 w-1/2 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {loading && projects.length > 0 && (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
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
