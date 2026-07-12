"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="mt-20 rounded-xl border border-border bg-muted/30 p-8 text-center">
      <h2 className="text-xl font-semibold tracking-tight">Stay in the loop</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Get weekly highlights of the best creative work.
      </p>
      {submitted ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Thanks for subscribing!
        </p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const email = new FormData(form).get("email") as string;
            fetch("/api/newsletter", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email }),
            }).then(() => {
              setSubmitted(true);
            });
          }}
          className="mx-auto mt-4 flex max-w-sm gap-2"
        >
          <input
            name="email"
            type="email"
            required
            placeholder="you@email.com"
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <button
            type="submit"
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90"
          >
            Subscribe
          </button>
        </form>
      )}
    </div>
  );
}
