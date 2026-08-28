"use client";

import { useEffect } from "react";
import { api } from "@/lib/api";
import { useUserStore, type UserSession } from "@/store/useUserStore";

// Runs once on app load — tries to restore user session via httpOnly refresh cookie.
// Token never touches localStorage — lives only in Zustand memory.

export default function UserAuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, clearAuth } = useUserStore();

  useEffect(() => {
    async function restoreSession() {
      try {
        const res = await api.post<{ accessToken?: string; user?: UserSession }>(
          "/api/user/auth/refresh",
          {},
        );
        if (res.success && res.accessToken && res.user) {
          setAuth(res.accessToken, res.user);
        } else {
          clearAuth();
        }
      } catch {
        clearAuth();
      }
    }

    restoreSession();
  }, []);

  return <>{children}</>;
}
