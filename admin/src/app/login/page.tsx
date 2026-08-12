"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5510";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    fetch(`${API_BASE}/api/admin/auth/me`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.success) router.replace("/"); })
      .catch(() => {});
  }, []);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [showPass, setShowPass] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`${API_BASE}/api/admin/auth/login`, {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        router.replace("/");
      } else {
        setError(data.message ?? "Invalid credentials.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const INP = `w-full px-4 py-3 rounded-xl text-sm outline-none border transition-all duration-150
    focus:ring-2 focus:ring-[#FF3B6B] focus:ring-offset-1 focus:border-[#FF3B6B]`;

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg-subtle)" }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl overflow-hidden mb-3">
            <Image src="/logo/logo-icon.svg" alt="Event Ease" width={48} height={48} />
          </div>
          <h1 className="text-xl font-bold" style={{ color: "#111827" }}>Admin Login</h1>
          <p className="text-sm mt-1" style={{ color: "var(--fg-muted)" }}>Event Ease Admin Panel</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-lg)" }}>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "var(--danger-light)", color: "var(--danger)" }}>
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "#374151" }}>Email</label>
              <input
                type="email"
                className={INP}
                style={{ background: "var(--bg-subtle)", color: "var(--fg)", borderColor: "var(--border)" }}
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@eventease.com"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "#374151" }}>Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  className={INP}
                  style={{ background: "var(--bg-subtle)", color: "var(--fg)", borderColor: "var(--border)", paddingRight: 44 }}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ color: "var(--fg-muted)" }}
                >
                  {showPass ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all cursor-pointer disabled:opacity-50 mt-1"
              style={{ background: "var(--primary)" }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: "var(--fg-subtle)" }}>
          Event Ease © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

function EyeIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}
function EyeOffIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
}
