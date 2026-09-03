"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getPendingCount } from "@/lib/offlineDB";
import { syncPending } from "@/lib/syncBookings";
import { useAuthStore } from "@/store/useAuthStore";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5510";

export function useOfflineSync(onSynced?: () => void | Promise<void>) {
  const [isOnline,       setIsOnline]       = useState(true);
  const [pendingCount,   setPendingCount]   = useState(0);
  const [syncing,        setSyncing]        = useState(false);
  const [justCameOnline, setJustCameOnline] = useState(false);

  const onSyncedRef = useRef(onSynced);
  onSyncedRef.current = onSynced;

  const refreshCount = useCallback(async () => {
    if (typeof window === "undefined") return;
    try {
      const count = await getPendingCount();
      setPendingCount(count);
    } catch { /* IndexedDB unavailable */ }
  }, []);

  const syncingRef = useRef(false);
  const doSyncInternal = useCallback(async () => {
    if (!navigator.onLine || syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);
    try {
      const { accessToken } = useAuthStore.getState();
      const result = await syncPending(accessToken ?? undefined);
      await refreshCount();
      if (result.synced > 0) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("offline-synced"));
        }
        await onSyncedRef.current?.();
      }
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [refreshCount]);

  const doSyncRef = useRef(doSyncInternal);
  doSyncRef.current = doSyncInternal;

  const sync = useCallback(() => doSyncRef.current(), []);

  // Refresh token then sync — handles coming online from "offline-session" state.
  // Always refreshes the token first so pending ops don't fail with a stale/fake token.
  const refreshTokenAndSync = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE}/api/vendor/auth/refresh`, {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify({}),
        signal:      AbortSignal.timeout(8000),
      });

      if (resp.status >= 500) return; // backend down, still offline

      try {
        const data = await resp.clone().json();
        if (data?.success && data?.accessToken) {
          const { setAuth, vendor } = useAuthStore.getState();
          setAuth(data.accessToken, data.vendor ?? vendor!);
        }
      } catch { /* response may not be JSON */ }

      // Now sync with the refreshed token
      await doSyncRef.current();
    } catch { /* network still unstable — will retry on next interval */ }
  }, []);

  const refreshTokenAndSyncRef = useRef(refreshTokenAndSync);
  refreshTokenAndSyncRef.current = refreshTokenAndSync;

  // Manual reconnect button
  const tryReconnect = useCallback(async () => {
    setIsOnline(true);
    setJustCameOnline(true);
    setTimeout(() => setJustCameOnline(false), 3000);
    await refreshTokenAndSyncRef.current();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const online = navigator.onLine;
    setIsOnline(online);
    refreshCount();

    // If this hook mounts while already online (e.g. OfflineBarWrapper remounted
    // after a key change and missed the window.online event), kick off a sync now.
    if (online) {
      const { accessToken } = useAuthStore.getState();
      if (accessToken === "offline-session") {
        // Token still stale — do a full refresh-then-sync
        refreshTokenAndSyncRef.current();
      } else {
        // Real token already in place — just sync any pending items
        doSyncRef.current();
      }
    }

    const handleOnline = () => {
      setIsOnline(true);
      setJustCameOnline(true);
      setTimeout(() => setJustCameOnline(false), 3000);
      refreshTokenAndSyncRef.current();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);

    // Periodic sync every 30s — always use refreshTokenAndSync so a stale
    // "offline-session" token is replaced before attempting the network write.
    const timer = setInterval(() => {
      if (!navigator.onLine) return;
      const { accessToken } = useAuthStore.getState();
      if (accessToken === "offline-session") {
        refreshTokenAndSyncRef.current();
      } else {
        doSyncRef.current();
      }
    }, 30_000);

    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(timer);
    };
  }, [refreshCount]);

  return { isOnline, pendingCount, syncing, justCameOnline, sync, tryReconnect, refreshCount };
}
