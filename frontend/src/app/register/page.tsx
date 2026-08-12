"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const PRIMARY = "#FF3B6B";

export default function RegisterPage() {
  const [name,        setName]        = useState("");
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [showPw,      setShowPw]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error,       setError]       = useState("");
  const [loading,     setLoading]     = useState(false);

  const passwordsMatch = confirm === "" || password === confirm;
  const strength = getStrength(password);
  const isDisabled = !name || !email || !password || !confirm || password !== confirm || loading;

  function handleGoogle() {
    alert("Google OAuth coming soon!");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setError("");
    setLoading(true);
    // TODO: wire up to backend
    setTimeout(() => setLoading(false), 1200);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-16">
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

        {/* Google button */}
        <button type="button" onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-2xl border text-base font-semibold transition-all hover:bg-gray-50 cursor-pointer mb-6"
          style={{ borderColor: "#D1D5DB", color: "#111827" }}>
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Sign up with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
          <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>or sign up with email</span>
          <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "#FEE2E2", color: "#B91C1C" }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">

          {/* Full Name */}
          <div className="relative">
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full px-5 py-4 rounded-2xl text-base outline-none border transition-all focus:ring-2 focus:ring-offset-2"
              style={{ background: "#F8F8F8", borderColor: "#D1D5DB", color: "#111827" }}
            />
          </div>

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
                background: "#F8F8F8",
                borderColor: !passwordsMatch ? "#EF4444" : "#D1D5DB",
                color: "#111827",
              }}
            />
            <button type="button" onClick={() => setShowConfirm(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
              style={{ color: "#9CA3AF" }}>
              {showConfirm ? <EyeOff /> : <Eye />}
            </button>
          </div>

          {/* Mismatch error */}
          {!passwordsMatch && (
            <p className="text-xs px-1" style={{ color: "#EF4444" }}>Passwords do not match.</p>
          )}

          {/* Sign up button */}
          <button
            type="submit"
            disabled={isDisabled}
            className="w-full mt-2 py-4 rounded-2xl text-base font-semibold text-white transition-opacity"
            style={{ background: PRIMARY, opacity: isDisabled ? 0.4 : 1, cursor: isDisabled ? "not-allowed" : "pointer" }}
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>

          {/* Login link */}
          <p className="text-center text-sm mt-2" style={{ color: "#6B7280" }}>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: PRIMARY }}>
              Sign in
            </Link>
          </p>
        </form>

        {/* Vendor link */}
        <p className="text-center text-xs mt-8" style={{ color: "#9CA3AF" }}>
          Are you a venue owner?{" "}
          <Link href="/vendor/onboarding/business-info" className="font-semibold hover:underline" style={{ color: PRIMARY }}>
            Register your venue →
          </Link>
        </p>

      </div>
    </div>
  );
}

// ─── Password strength ────────────────────────────────────────────────────────
function getStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8)              score++;
  if (/[A-Z]/.test(pw))           score++;
  if (/[0-9]/.test(pw))           score++;
  if (/[^A-Za-z0-9]/.test(pw))   score++;
  const map = [
    { label: "Too weak",  color: "#EF4444" },
    { label: "Weak",      color: "#F97316" },
    { label: "Fair",      color: "#EAB308" },
    { label: "Strong",    color: "#22C55E" },
    { label: "Very strong", color: "#16A34A" },
  ];
  return { score, ...map[score] };
}

// ─── Icons ────────────────────────────────────────────────────────────────────
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
