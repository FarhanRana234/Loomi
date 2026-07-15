"use client";

import { Suspense } from "react";
import { FeedMasonry } from "@/components/features/FeedMasonry";
import { NewsletterForm } from "@/components/features/NewsletterForm";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={null}>
        <FeedMasonry />
      </Suspense>

      <NewsletterForm />
    </div>
  );
}
