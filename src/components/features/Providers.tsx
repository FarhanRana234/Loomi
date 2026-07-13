"use client";

import { useEffect } from "react";
import { useUserStore } from "@/hooks/useUserStore";
import { Toaster } from "sonner";
import { FetchInterceptor } from "./fetch-interceptor";

export function Providers({ children }: { children: React.ReactNode }) {
  const fetchUser = useUserStore((s) => s.fetchUser);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <>
      <FetchInterceptor />
      {children}
      <Toaster position="bottom-right" richColors closeButton />
    </>
  );
}
