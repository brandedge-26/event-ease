"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { galleryStore } from "@/lib/galleryStore";

const inputStyle = {
  background: "var(--bg-subtle)",
  color: "var(--fg)",
};

export default function VerifyEmailPage() {
  const router  = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [otp,       setOtp]       = useState(["", "", "", "", "", ""]);
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [email,     setEmail]     = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Read email from sessionStorage only on client
  useEffect(() => {
    try {
      const step3 = JSON.parse(sessionStorage.getItem("ob_step3") ?? "{}");
      if (step3.email) setEmail(step3.email);
    } catch { /* ignore */ }
  }, []);

  // ── OTP Input Handlers ──────────────────────────────────────────────────
  function handleOtp(e: React.ChangeEvent<HTMLInputElement>, i: number) {
    const val  = e.target.value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, i: number) {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = [...otp];
    text.split("").forEach((c, i) => { next[i] = c; });
    setOtp(next);
    otpRefs.current[Math.min(text.length, 5)]?.focus();
  }

  // ── Resend OTP ──────────────────────────────────────────────────────────
  async function handleResend() {
    if (!email) return;
    setError("");
    setResending(true);
    try {
      const res = await api.post("/api/vendor/auth/send-otp", { email });
      if (!res.success) setError(res.message ?? "Could not resend OTP.");
      else setOtp(["", "", "", "", "", ""]);
    } catch {
      setError("Could not connect to server.");
    } finally {
      setResending(false);
    }
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    let step1: Record<string, string> = {};
    let step2: Record<string, string> = {};
    let step3: Record<string, string> = {};

    try {
      step1 = JSON.parse(sessionStorage.getItem("ob_step1") ?? "{}");
      step2 = JSON.parse(sessionStorage.getItem("ob_step2") ?? "{}");
      step3 = JSON.parse(sessionStorage.getItem("ob_step3") ?? "{}");
    } catch {
      setError("Session expired. Please start registration again.");
      return;
    }

    if (!step1.businessName || !step3.email) {
      setError("Session data missing. Please go back and fill all steps.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<{ accessToken?: string; vendor?: { id: string; name: string; email: string; ownerName: string; slug: string; businessType: string; isVerified: boolean; isBlocked: boolean } }>(
        "/api/vendor/auth/register",
        {
          businessName: step1.businessName,
          businessType: step1.businessType,
          mobile:       step1.mobile,
          whatsapp:     step1.whatsapp,
          city:         step1.city,
          area:         step1.area,
          address:      step1.address,
          cnic:         step1.cnic,
          about:        step2.description ?? "",
          halls:        step2.maxCapacity
            ? [{
                name:     `Main ${step1.businessType ?? "Hall"}`,
                capacity: Number(step2.maxCapacity) || 1,
                price:    Number(step2.startingPrice) || 0,
                desc:     step2.description ?? null,
              }]
            : step2.startingPrice
            ? [{
                name:     `${step1.businessType ?? "Service"} Package`,
                capacity: 1,
                price:    Number(step2.startingPrice) || 0,
                desc:     step2.description ?? null,
              }]
            : [],
          ownerName:    step3.ownerName,
          email:        step3.email,
          password:     step3.password,
          otp:          otp.join(""),
        },
      );

      if (!res.success || !res.accessToken || !res.vendor) {
        setError(res.message ?? "Registration failed. Please try again.");
        return;
      }

      setAuth(res.accessToken, res.vendor);

      // Upload logo if vendor provided one during onboarding
      const logoB64  = sessionStorage.getItem("ob_logo_b64");
      const logoType = sessionStorage.getItem("ob_logo_type") ?? "image/jpeg";
      if (logoB64) {
        try {
            // Convert base64 data URL to Blob with correct MIME type
          const base64Data = logoB64.split(",")[1];
          const byteChars  = atob(base64Data);
          const byteArr    = new Uint8Array(byteChars.length);
          for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
          const blob = new Blob([byteArr], { type: logoType });

          const ext      = logoType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
          const formData = new FormData();
          formData.append("logo", blob, `logo.${ext}`);
          await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5510"}/api/vendor/upload/logo`, {
            method:  "POST",
            headers: { Authorization: `Bearer ${res.accessToken}` },
            body:    formData,
          });
        } catch {
          // Logo upload failure is non-critical — continue
        }
      }

      // Upload gallery images if any
      const galleryFiles = galleryStore.get();
      if (galleryFiles.length > 0) {
        try {
          const formData = new FormData();
          galleryFiles.forEach((f) => formData.append("images", f));
          await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5510"}/api/vendor/upload/gallery`, {
            method:  "POST",
            headers: { Authorization: `Bearer ${res.accessToken}` },
            body:    formData,
          });
        } catch {
          // Gallery upload failure is non-critical — continue
        }
        galleryStore.clear();
      }

      sessionStorage.removeItem("ob_step1");
      sessionStorage.removeItem("ob_step2");
      sessionStorage.removeItem("ob_step3");
      sessionStorage.removeItem("ob_logo_b64");
      sessionStorage.removeItem("ob_logo_type");

      router.push("/vendor/onboarding/complete");
      // businessType stored in auth so complete page can redirect correctly
    } catch {
      setError("Could not connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const otpComplete = otp.every((d) => d !== "");

  return (
    <div className="w-full max-w-lg">

      <h1 className="text-4xl font-semibold text-black mb-1 tracking-tight">
        Verify Your Email.
      </h1>
      <p className="text-sm mb-2" style={{ color: "var(--fg-muted)" }}>
        Step 4 of 4 — Enter the 6-digit code sent to your email
      </p>
      {email && (
        <p className="text-sm font-semibold mb-8" style={{ color: "var(--fg)" }}>
          {email}
        </p>
      )}

      {error && (
        <div className="mb-5 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "#FEE2E2", color: "#B91C1C" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* OTP Boxes */}
        <div className="grid grid-cols-6 gap-2" onPaste={handlePaste}>
          {otp.map((val, i) => (
            <input
              key={i}
              ref={(el) => { otpRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={val}
              onChange={(e) => handleOtp(e, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              className="w-full text-center text-2xl font-semibold py-4 rounded-2xl outline-none border border-[#D1D5DB] focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
              style={inputStyle}
            />
          ))}
        </div>

        {/* Resend */}
        <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
          Didn&apos;t receive a code?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="font-semibold hover:underline disabled:opacity-50"
            style={{ color: "var(--primary)" }}
          >
            {resending ? "Sending…" : "Resend"}
          </button>
        </p>

        {/* Back & Verify */}
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
            disabled={!otpComplete || loading}
            className="w-full py-4 rounded-2xl text-base font-semibold transition-opacity"
            style={{
              background: "var(--primary)",
              color: "#ffffff",
              opacity: !otpComplete || loading ? 0.4 : 1,
              cursor: !otpComplete || loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Creating account…" : "Verify & Finish"}
          </button>
        </div>

      </form>
    </div>
  );
}
