"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@/lib/api";
import type { Branch } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

export default function VendorLoginPage() {
  const router  = useRouter();
  const setAuth      = useAuthStore((s) => s.setAuth);
  const setBranches  = useAuthStore((s) => s.setBranches);

  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState("");
  const [loading,      setLoading]      = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post<{ accessToken?: string; vendor?: { id: string; name: string; email: string; ownerName: string; slug: string; businessType: string; isVerified: boolean; isBlocked: boolean }; branches?: Branch[] }>(
        "/api/vendor/auth/login",
        { email: email.trim(), password },
      );

      if (!res.success || !res.accessToken || !res.vendor) {
        setError(res.message ?? "Login failed. Please try again.");
        return;
      }

      setAuth(res.accessToken, res.vendor);
      if (res.branches && res.branches.length > 0) {
        const defaultBranch = res.branches.find((b) => b.isDefault);
        setBranches(res.branches, defaultBranch?.id);
      }
      const VENUE_TYPES = ["Banquet Hall","Marquee","Ballroom","Wedding Lawn","Hotel Banquet","Rooftop Venue","Farm House"];
      if (VENUE_TYPES.includes(res.vendor.businessType)) {
        router.push("/vendor/dashboard");
      } else {
        router.push("/vendor/general/dashboard");
      }
    } catch {
      setError("Could not connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isDisabled = !email || !password || loading;

  return (
    <div className="flex flex-1 min-h-screen items-center justify-center bg-white px-4 py-16">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/logo/logo-icon.svg"
            alt="Event Ease Logo"
            width={44}
            height={44}
            className="rounded-2xl"
          />
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-semibold text-black mb-1 tracking-tight">
          Vendor Login.
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--fg-muted)" }}>
          Sign in to manage your venue, bookings & inquiries.
        </p>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "#FEE2E2", color: "#B91C1C" }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">

          {/* Email */}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-5 py-4 rounded-2xl text-base outline-none transition-all duration-200 border border-[#D1D5DB] focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
            style={{ background: "var(--bg-subtle)", color: "var(--fg)" }}
          />

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-5 py-4 rounded-2xl text-base outline-none transition-all duration-200 pr-12 border border-[#D1D5DB] focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
              style={{ background: "var(--bg-subtle)", color: "var(--fg)" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
              style={{ color: "var(--fg-subtle)" }}
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>

          {/* Links */}
          <p className="text-left mt-2 text-sm" style={{ color: "var(--fg-muted)" }}>
            Don&apos;t have a business account?{" "}
            <a
              href="/vendor/onboarding"
              className="font-medium hover:underline"
              style={{ color: "var(--primary)" }}
            >
              Register Business
            </a>
          </p>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isDisabled}
            className="w-full mt-1 py-4 rounded-2xl text-base font-semibold transition-opacity"
            style={{
              background: "var(--primary)",
              color: "#ffffff",
              opacity: isDisabled ? 0.4 : 1,
              cursor: isDisabled ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

        </form>
      </div>
    </div>
  );
}

function Eye() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
