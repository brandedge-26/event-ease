"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const inputClass =
  "w-full px-5 py-4 rounded-2xl text-base outline-none transition-all duration-200 border border-[#D1D5DB] focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2";

const inputStyle = {
  background: "var(--bg-subtle)",
  color: "var(--fg)",
};

export default function AccountInfoPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    ownerName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSendCode() {
    if (!form.email) return;
    setOtpSent(true);
    setTimeout(() => otpRefs.current[0]?.focus(), 50);
  }

  function handleOtp(e: React.ChangeEvent<HTMLInputElement>, i: number) {
    const val = e.target.value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  }

  function handleOtpKeyDown(e: React.KeyboardEvent<HTMLInputElement>, i: number) {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = [...otp];
    text.split("").forEach((c, i) => { next[i] = c; });
    setOtp(next);
    otpRefs.current[Math.min(text.length, 5)]?.focus();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push("/vendor/onboarding/complete");
  }

  const otpComplete = otp.every((d) => d !== "");
  const isDisabled =
    !form.ownerName ||
    !form.email ||
    !otpSent ||
    !otpComplete ||
    !form.password ||
    !form.confirmPassword;

  return (
    <div className="w-full max-w-lg">

      {/* Heading */}
      <h1 className="text-4xl font-semibold text-black mb-1 tracking-tight">
        Account Info.
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--fg-muted)" }}>
        Step 3 of 3 — Set up your login credentials.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">

        {/* Owner Name */}
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

        {/* Email + Send Code */}
        <div className="flex gap-3">
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
          <button
            type="button"
            onClick={handleSendCode}
            className="shrink-0 px-5 rounded-2xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90 active:opacity-80 whitespace-nowrap"
            style={{ background: "var(--primary)", color: "#ffffff" }}
          >
            Send Code
          </button>
        </div>

        {/* OTP Boxes */}
        {otpSent && (
          <div className="grid grid-cols-6 gap-2" onPaste={handleOtpPaste}>
            {otp.map((val, i) => (
              <input
                key={i}
                ref={(el) => { otpRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={val}
                onChange={(e) => handleOtp(e, i)}
                onKeyDown={(e) => handleOtpKeyDown(e, i)}
                className="w-full text-center text-xl font-semibold py-4 rounded-2xl outline-none border border-[#D1D5DB] focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
                style={inputStyle}
              />
            ))}
          </div>
        )}

        {/* Password */}
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

        {/* Confirm Password */}
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

        {/* Back & Submit */}
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
            Finish Setup
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
