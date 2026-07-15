"use client";

import { create } from "zustand";
import { soundManager } from "@/lib/sound-manager";

interface SoundStore {
  currentTrackId: string | null;
  setCurrentTrackId: (id: string | null) => void;
}

export const useSoundStore = create<SoundStore>((set) => {
  soundManager.setOnStateChange((id) => {
    set({ currentTrackId: id });
  });

  return {
    currentTrackId: null,
    setCurrentTrackId: (id) => set({ currentTrackId: id }),
  };
});
