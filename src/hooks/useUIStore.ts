"use client";

import { create } from "zustand";

interface UIStore {
  isGlobalBlocking: boolean;
  pendingCount: number;
  _activateTimer: ReturnType<typeof setTimeout> | null;
  requestBlocking: () => void;
  releaseBlocking: () => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  isGlobalBlocking: false,
  pendingCount: 0,
  _activateTimer: null,

  requestBlocking: () => {
    const next = get().pendingCount + 1;
    set({ pendingCount: next });

    if (next === 1 && !get()._activateTimer) {
      const timer = setTimeout(() => {
        if (get().pendingCount > 0) {
          set({ isGlobalBlocking: true, _activateTimer: null });
        }
      }, 200);
      set({ _activateTimer: timer });
    }
  },

  releaseBlocking: () => {
    const prev = get();
    const next = Math.max(0, prev.pendingCount - 1);

    if (next === 0 && prev._activateTimer) {
      clearTimeout(prev._activateTimer);
      set({ pendingCount: 0, _activateTimer: null, isGlobalBlocking: false });
    } else {
      set({ pendingCount: next });
      if (next === 0) {
        set({ isGlobalBlocking: false });
      }
    }
  },
}));
