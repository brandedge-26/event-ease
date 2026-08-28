"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { useUserStore, type UserSession } from "@/store/useUserStore";

const PRIMARY  = "#FF3B6B";
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5510";

function getStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8)            score++;
  if (/[A-Z]/.test(pw))         score++;
  if (/[0-9]/.test(pw))         score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { label: "Too weak",    color: "#EF4444" },
    { label: "Weak",        color: "#F97316" },
    { label: "Fair",        color: "#EAB308" },
    { label: "Strong",      color: "#22C55E" },
    { label: "Very strong", color: "#16A34A" },
  ];
  return { score, ...map[score] };
}

export default function RegisterPage() {
  const router  = useRouter();
  const setAuth = useUserStore((s) => s.setAuth);

  const [name,        setName]        = useState("");
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [showPw,      setShowPw]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error,       setError]       = useState("");
  const [loading,     setLoading]     = useState(false);

  const passwordsMatch = confirm === "" || password === confirm;
  const strength       = getStrength(password);
  const isDisabled     = !name || !email || !password || !confirm || password !== confirm || loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await api.post<{ accessToken?: string; user?: UserSession }>(
        "/api/user/auth/register",
        { name: name.trim(), email: email.trim(), password },
      );

      if (!res.success || !res.accessToken || !res.user) {
        setError(res.message ?? "Registration failed. Please try again.");
        return;
      }

      setAuth(res.accessToken, res.user);
      router.push("/");
    } catch {
      setError("Could not connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 min-h-screen items-center justify-center bg-white px-4 py-16">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Link href="/">
            <Image src="/logo/logo-icon.svg" alt="Event Ease" width={44} height={44} className="rounded-2xl" />
          </Link>
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-semibold text-black mb-1 tracking-tight">Create Account.</h1>
        <p className="text-sm mb-8" style={{ color: "#6B7280" }}>
          Join Event Ease and discover venues across Pakistan.
        </p>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "#FEE2E2", color: "#B91C1C" }}>
            {error}
          </div>
        )}

        {/* Google */}
        <a
          href={`${API_BASE}/api/user/auth/google`}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border text-sm font-semibold transition-all hover:bg-gray-50 active:scale-[0.98]"
          style={{ borderColor: "#D1D5DB", color: "#111827" }}
        >
          <GoogleIcon />
          Continue with Google
        </a>

        {/* Divider */}
        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
          <span className="text-xs" style={{ color: "#9CA3AF" }}>or</span>
          <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">

          {/* Full Name */}
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full px-5 py-4 rounded-2xl text-base outline-none border transition-all focus:ring-2 focus:ring-offset-2"
            style={{ background: "#F8F8F8", borderColor: "#D1D5DB", color: "#111827" }}
          />

          {/* Email */}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-5 py-4 rounded-2xl text-base outline-none border transition-all focus:ring-2 focus:ring-offset-2"
            style={{ background: "#F8F8F8", borderColor: "#D1D5DB", color: "#111827" }}
          />

          {/* Password */}
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-5 py-4 pr-12 rounded-2xl text-base outline-none border transition-all focus:ring-2 focus:ring-offset-2"
              style={{ background: "#F8F8F8", borderColor: "#D1D5DB", color: "#111827" }}
            />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
              style={{ color: "#9CA3AF" }}>
              {showPw ? <EyeOff /> : <Eye />}
            </button>
          </div>

          {/* Password strength */}
          {password && (
            <div className="px-1">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                    style={{ background: i <= strength.score ? strength.color : "#E5E7EB" }} />
                ))}
              </div>
              <p className="text-xs" style={{ color: strength.color }}>{strength.label}</p>
            </div>
          )}

          {/* Confirm Password */}
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              className="w-full px-5 py-4 pr-12 rounded-2xl text-base outline-none border transition-all focus:ring-2 focus:ring-offset-2"
              style={{
                background:  "#F8F8F8",
                borderColor: !passwordsMatch ? "#EF4444" : "#D1D5DB",
                color:       "#111827",
              }}
            />
            <button type="button" onClick={() => setShowConfirm(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
              style={{ color: "#9CA3AF" }}>
              {showConfirm ? <EyeOff /> : <Eye />}
            </button>
          </div>
          {!passwordsMatch && (
            <p className="text-xs px-1" style={{ color: "#EF4444" }}>Passwords do not match.</p>
          )}

          {/* Sign up button */}
          <button
            type="submit"
            disabled={isDisabled}
            className="w-full mt-2 py-4 rounded-2xl text-base font-semibold text-white transition-opacity flex items-center justify-center gap-2"
            style={{ background: PRIMARY, opacity: isDisabled ? 0.4 : 1, cursor: isDisabled ? "not-allowed" : "pointer" }}
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round"/>
                </svg>
                Creating account…
              </>
            ) : "Create Account"}
          </button>

          <p className="text-center text-sm mt-2" style={{ color: "#6B7280" }}>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: PRIMARY }}>Sign in</Link>
          </p>
        </form>

        {/* Vendor link */}
        <p className="text-center text-xs mt-8" style={{ color: "#9CA3AF" }}>
          Are you a venue owner?{" "}
          <Link href="/vendor/onboarding" className="font-semibold hover:underline" style={{ color: PRIMARY }}>
            Register your venue →
          </Link>
        </p>

      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
      <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
      <path d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
      <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
      <path d="M43.611 20.083H42V20H24v8h11.303a11.896 11.896 0 01-4.087 5.571l6.19 5.238C42.012 35.245 44 30 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
    </svg>
  );
}

function Eye() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
function EyeOff() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}
