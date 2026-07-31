"use client";

import { useEffect } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import type { VendorSession } from "@/lib/api";

// Runs once on app load — tries to restore session via refresh cookie.
// If cookie is valid, backend returns a new access token + vendor info.
// Token never touches localStorage — lives only in memory (Zustand).

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    async function restoreSession() {
      try {
        const res = await api.post<{ accessToken?: string; vendor?: VendorSession }>(
          "/api/vendor/auth/refresh",
          {},
        );
        if (res.success && res.accessToken) {
          // vendor should come from refresh, but fallback to /me if missing
          const vendor = res.vendor ?? await api
            .get<{ vendor?: VendorSession }>("/api/vendor/auth/me", res.accessToken)
            .then((r) => r.vendor)
            .catch(() => null);

          if (vendor) {
            setAuth(res.accessToken, vendor);
          } else {
            clearAuth();
          }
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
