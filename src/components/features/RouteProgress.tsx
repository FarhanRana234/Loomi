"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";

NProgress.configure({
  showSpinner: false,
  minimum: 0,
  speed: 200,
  trickleSpeed: 100,
});

export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevPath = useRef(`${pathname}?${searchParams}`);

  useEffect(() => {
    const current = `${pathname}?${searchParams}`;
    if (current !== prevPath.current) {
      prevPath.current = current;
      NProgress.start();
      const t = setTimeout(() => NProgress.done(), 200);
      return () => clearTimeout(t);
    }
  }, [pathname, searchParams]);

  return null;
}
