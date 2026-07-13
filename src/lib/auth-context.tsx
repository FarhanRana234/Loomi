"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  getIdToken: async () => null,
});

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

function decodeToken(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      uid: payload.user_id || payload.sub,
      email: payload.email || null,
      displayName: payload.name || null,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTokenRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshToken = useCallback(async (refreshTokenValue: string) => {
    try {
      const res = await fetch(
        `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshTokenValue,
          }),
        }
      );

      if (!res.ok) {
        setUser(null);
        setLoading(false);
        return;
      }

      const data = await res.json();
      const { id_token, refresh_token, expires_in } = data;

      // Sync new id_token to server cookie
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: id_token }),
      });

      // Store refresh token in sessionStorage for re-auth
      sessionStorage.setItem("loomi_refresh_token", refresh_token);

      const decoded = decodeToken(id_token);
      setUser(decoded);

      // Schedule next refresh 60s before expiry
      const refreshIn = (parseInt(expires_in) - 60) * 1000;
      if (refreshTokenRef.current) clearTimeout(refreshTokenRef.current);
      refreshTokenRef.current = setTimeout(() => {
        refreshToken(refresh_token);
      }, Math.max(refreshIn, 30000));

      setLoading(false);
    } catch {
      setUser(null);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Pick up Google OAuth refresh token from cookie
    const rtCookie = document.cookie
      .split("; ")
      .find((c) => c.startsWith("loomi_rt="));
    if (rtCookie) {
      const rt = rtCookie.split("=")[1];
      sessionStorage.setItem("loomi_refresh_token", rt);
      // Clear the cookie
      document.cookie = "loomi_rt=; path=/; max-age=0";
    }

    // Check if we have a stored refresh token from a previous session
    const storedRefresh = sessionStorage.getItem("loomi_refresh_token");
    if (storedRefresh) {
      refreshToken(storedRefresh);
    } else {
      setLoading(false);
    }

    return () => {
      if (refreshTokenRef.current) clearTimeout(refreshTokenRef.current);
    };
  }, [refreshToken]);

  const getIdToken = useCallback(async (): Promise<string | null> => {
    // We can't read the httpOnly cookie directly from JS.
    // Instead, call /api/auth/me to get the current user,
    // or call /api/auth/session with a refresh to get a new token.
    // For simplicity, use the stored refresh token to get a fresh id_token.
    const storedRefresh = sessionStorage.getItem("loomi_refresh_token");
    if (!storedRefresh) return null;

    try {
      const res = await fetch(
        `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: storedRefresh,
          }),
        }
      );

      if (!res.ok) return null;
      const data = await res.json();
      return data.id_token;
    } catch {
      return null;
    }
  }, [FIREBASE_API_KEY]);

  return (
    <AuthContext.Provider value={{ user, loading, getIdToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
