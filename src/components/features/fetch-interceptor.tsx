import { useEffect } from "react";
import { useUIStore } from "@/hooks/useUIStore";

let installed = false;

function installInterceptor() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const originalFetch = window.fetch;

  window.fetch = async (...args) => {
    const input = args[0];
    const init = args[1];

    const url =
      typeof input === "string"
        ? input
        : input instanceof Request
          ? input.url
          : String(input);

    const method = (init?.method || "GET").toUpperCase();
    const isMutating = method !== "GET";

    if (isMutating) {
      useUIStore.getState().requestBlocking();
    }

    try {
      return await originalFetch(...args);
    } finally {
      if (isMutating) {
        useUIStore.getState().releaseBlocking();
      }
    }
  };
}

export function FetchInterceptor() {
  useEffect(() => {
    installInterceptor();
  }, []);

  return null;
}
