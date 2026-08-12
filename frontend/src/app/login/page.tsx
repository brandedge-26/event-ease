"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const PRIMARY = "#FF3B6B";

export default function UserLoginPage() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);

  // Placeholder — wire up to your auth backend when ready
  function handleGoogle() {
    alert("Google OAuth coming soon!");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
        <h1 className="text-4xl font-semibold text-black mb-1 tracking-tight">Welcome Back.</h1>
        <p className="text-sm mb-8" style={{ color: "#6B7280" }}>
          Sign in to discover and book your perfect venue.
        </p>

        {/* Google button */}
        <button
          type="button"
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-2xl border text-base font-semibold transition-all hover:bg-gray-50 cursor-pointer mb-6"
          style={{ borderColor: "#D1D5DB", color: "#111827" }}
        >
          {/* Google logo SVG */}
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
          <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>or continue with email</span>
          <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
        </div>

        {/* Email + Password form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl text-base outline-none border transition-all focus:ring-2 focus:ring-offset-2"
            style={{ background: "#F8F8F8", borderColor: "#D1D5DB", color: "#111827" }}
          />

          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-5 py-4 pr-12 rounded-2xl text-base outline-none border transition-all focus:ring-2 focus:ring-offset-2"
              style={{ background: "#F8F8F8", borderColor: "#D1D5DB", color: "#111827" }}
            />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
              style={{ color: "#9CA3AF" }}>
              {showPw ? <EyeOff /> : <Eye />}
            </button>
          </div>

          <div className="flex items-center justify-between mt-1">
            <p className="text-sm" style={{ color: "#6B7280" }}>
              New here?{" "}
              <Link href="/register" className="font-medium hover:underline" style={{ color: PRIMARY }}>
                Create account
              </Link>
            </p>
            <Link href="/forgot-password" className="text-sm font-medium hover:underline" style={{ color: "#6B7280" }}>
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={!email || !password}
            className="w-full mt-2 py-4 rounded-2xl text-base font-semibold text-white transition-opacity cursor-pointer"
            style={{ background: PRIMARY, opacity: (!email || !password) ? 0.4 : 1 }}
          >
            Sign in
          </button>
        </form>

        {/* Vendor link */}
        <p className="text-center text-xs mt-8" style={{ color: "#9CA3AF" }}>
          Are you a venue owner?{" "}
          <Link href="/vendor/login" className="font-semibold hover:underline" style={{ color: PRIMARY }}>
            Vendor login →
          </Link>
        </p>

      </div>
    </div>
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
