"use client";

import { useEffect } from "react";
import { api } from "@/lib/api";
import { useAuthStore, getCachedVendor } from "@/store/useAuthStore";
import type { VendorSession } from "@/lib/api";

// Runs once on app load — tries to restore session via refresh cookie.
// If cookie is valid, backend returns a new access token + vendor info.
// Token never touches localStorage — lives only in memory (Zustand).
// If offline on load, vendor is restored from localStorage so user stays logged in.

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, clearAuth } = useAuthStore();

  async function restoreSession() {
    try {
      const res = await api.post<{ accessToken?: string; vendor?: VendorSession }>(
        "/api/vendor/auth/refresh",
        {},
        undefined,
        5_000, // fail fast so offline users don't wait
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
        // Server responded but rejected the token.
        // If the device is offline (wifi off), keep the user logged in with
        // cached data — the token may be fine but can't be revalidated without
        // a real connection. clearAuth only if we're genuinely online.
        if (!navigator.onLine) {
          const cached = getCachedVendor();
          if (cached) { setAuth("offline-session", cached); return; }
        }
        clearAuth();
      }
    } catch {
      // Network error (offline, no internet, server unreachable, etc.)
      // navigator.onLine is unreliable (returns true even when wifi has no internet)
      // so we just try the cache on ANY fetch failure.
      const cached = getCachedVendor();
      if (cached) {
        // Restore vendor from cache with a placeholder token.
        // Real API calls won't work but cached data + offline booking queue will.
        setAuth("offline-session", cached);
        return;
      }
      clearAuth();
    }
  }

  useEffect(() => {
    restoreSession();

    // When internet comes back, if we're in offline-session mode, get a real token
    function handleOnline() {
      const { accessToken } = useAuthStore.getState();
      if (accessToken === "offline-session") {
        restoreSession();
      }
    }

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
