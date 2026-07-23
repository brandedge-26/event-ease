import Image from "next/image";
import Link from "next/link";

export default function OnboardingCompletePage() {
  return (
    <div className="w-full max-w-md text-center">

      {/* Logo */}
      <div className="flex justify-center mb-6">
        <Image
          src="/logo/logo-icon.svg"
          alt="Event Ease"
          width={56}
          height={56}
          className="rounded-2xl"
        />
      </div>

      {/* Check Icon */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{ background: "var(--primary-light)" }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--primary)" }}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      {/* Heading */}
      <h1 className="text-4xl font-semibold text-black mb-2 tracking-tight">
        You're all set!
      </h1>
      <p className="text-sm mb-2" style={{ color: "var(--fg-muted)" }}>
        Your business profile has been submitted for verification.
      </p>
      <p className="text-sm mb-10" style={{ color: "var(--fg-muted)" }}>
        Our team will review and activate your account within <span className="font-medium" style={{ color: "var(--fg)" }}>24–48 hours.</span>
      </p>

      {/* Go to Dashboard */}
      <Link
        href="/dashboard"
        className="w-full flex items-center justify-center py-4 rounded-2xl text-base font-semibold cursor-pointer transition-opacity hover:opacity-90"
        style={{ background: "var(--primary)", color: "#ffffff" }}
      >
        Go to Dashboard
      </Link>

    </div>
  );
}
