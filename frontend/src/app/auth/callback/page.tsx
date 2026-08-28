"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useUserStore, type UserSession } from "@/store/useUserStore";

export default function AuthCallbackPage() {
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const setAuth       = useUserStore((s) => s.setAuth);
  const clearAuth     = useUserStore((s) => s.clearAuth);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      router.replace("/login?error=google_failed");
      return;
    }

    (async () => {
      try {
        const res = await api.get<{ user?: UserSession }>("/api/user/auth/me", token);
        if (res.success && res.user) {
          setAuth(token, res.user);
          router.replace("/");
        } else {
          clearAuth();
          router.replace("/login?error=google_failed");
        }
      } catch {
        clearAuth();
        router.replace("/login?error=google_failed");
      }
    })();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF3B6B" strokeWidth="2.5">
          <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round"/>
        </svg>
        <p className="text-sm" style={{ color: "#6B7280" }}>Signing you in…</p>
      </div>
    </div>
  );
}
