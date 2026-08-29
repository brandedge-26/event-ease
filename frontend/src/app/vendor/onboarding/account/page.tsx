"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const inputClass =
  "w-full px-5 py-4 rounded-2xl text-base outline-none transition-all duration-200 border border-[#D1D5DB] focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2";

const inputStyle = {
  background: "var(--bg-subtle)",
  color: "var(--fg)",
};

export default function AccountInfoPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    ownerName: "", email: "", password: "", confirmPassword: "",
  });

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("ob_step3");
      if (!saved) return;
      const parsed = JSON.parse(saved);
      setForm({
        ownerName:       parsed.ownerName       ?? "",
        email:           parsed.email           ?? "",
        password:        parsed.password        ?? "",
        confirmPassword: parsed.password        ?? "",
      });
    } catch {}
  }, []);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [error,        setError]        = useState("");
  const [loading,      setLoading]      = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/api/vendor/auth/send-otp", { email: form.email.trim() });
      if (!res.success) {
        setError(res.message ?? "Failed to send OTP. Please try again.");
        return;
      }

      // Save step 3 data for the verify page
      sessionStorage.setItem("ob_step3", JSON.stringify({
        ownerName: form.ownerName.trim(),
        email:     form.email.trim(),
        password:  form.password,
      }));

      router.push("/vendor/onboarding/verify");
    } catch {
      setError("Could not connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isDisabled =
    !form.ownerName || !form.email || !form.password || !form.confirmPassword || loading;

  return (
    <div className="w-full max-w-lg">

      <h1 className="text-4xl font-semibold text-black mb-1 tracking-tight">
        Create Vendor Account.
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--fg-muted)" }}>
        Step 3 of 4 — Set up your login credentials for the Vendor Dashboard.
      </p>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "#FEE2E2", color: "#B91C1C" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">

        <input
          name="ownerName"
          type="text"
          placeholder="Owner full name *"
          value={form.ownerName}
          onChange={handleChange}
          required
          className={inputClass}
          style={inputStyle}
        />

        <input
          name="email"
          type="email"
          placeholder="Email address *"
          value={form.email}
          onChange={handleChange}
          required
          className={inputClass}
          style={inputStyle}
        />

        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password *"
            value={form.password}
            onChange={handleChange}
            required
            className={`${inputClass} pr-12`}
            style={inputStyle}
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

        <div className="relative">
          <input
            name="confirmPassword"
            type={showConfirm ? "text" : "password"}
            placeholder="Confirm password *"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            className={`${inputClass} pr-12`}
            style={inputStyle}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
            style={{ color: "var(--fg-subtle)" }}
          >
            {showConfirm ? <EyeOff /> : <Eye />}
          </button>
        </div>

        <div className="flex gap-3 mt-1">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full py-4 rounded-2xl text-base font-semibold cursor-pointer transition-opacity hover:opacity-70"
            style={{ background: "var(--bg-subtle)", color: "var(--fg)" }}
          >
            Back
          </button>
          <button
            type="submit"
            disabled={isDisabled}
            className="w-full py-4 rounded-2xl text-base font-semibold transition-opacity"
            style={{
              background: "var(--primary)",
              color: "#ffffff",
              opacity: isDisabled ? 0.4 : 1,
              cursor: isDisabled ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Sending code…" : "Continue"}
          </button>
        </div>

      </form>
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
