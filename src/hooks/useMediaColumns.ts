"use client";

import { useState, useEffect } from "react";

export function useMediaColumns() {
  const [columns, setColumns] = useState(4);

  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      if (w >= 1280) setColumns(4);
      else if (w >= 1024) setColumns(3);
      else if (w >= 640) setColumns(2);
      else setColumns(1);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return columns;
}
