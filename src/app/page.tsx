"use client";

import { Suspense } from "react";
import { FeedMasonry } from "@/components/features/FeedMasonry";
import { NewsletterForm } from "@/components/features/NewsletterForm";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Discover Creative Work
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          A curated space for portfolios, projects, and visual storytelling.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Badge variant="outline">Photography</Badge>
          <Badge variant="outline">Design</Badge>
          <Badge variant="outline">Illustration</Badge>
          <Badge variant="outline">Development</Badge>
          <Badge variant="outline">3D Art</Badge>
        </div>
      </div>

      <Suspense fallback={null}>
        <FeedMasonry />
      </Suspense>

      <NewsletterForm />
    </div>
  );
}
