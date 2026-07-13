"use client";

import { create } from "zustand";

export interface User {
  _id: string;
  firebaseId: string;
  email: string;
  username: string;
  role: "user" | "admin";
  bio: string;
  avatarUrl: string;
  socialLinks: { label: string; url: string }[];
}

interface UserStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  clearUser: () => void;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) =>
    set({ user, isAuthenticated: user !== null }),

  clearUser: () =>
    set({ user: null, isAuthenticated: false }),

  fetchUser: async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const d = await res.json();
        if (d.success && d.data) {
          set({ user: d.data, isAuthenticated: true, isLoading: false });
          return;
        }
      }
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // best-effort
    }
    sessionStorage.clear();
    set({ user: null, isAuthenticated: false, isLoading: false });
    window.location.href = "/login";
  },
}));
