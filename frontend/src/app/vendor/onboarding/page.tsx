import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "List Your Business — Event Ease" };

const PRIMARY = "#FF3B6B";

const STEPS = [
  {
    step: "01",
    title: "Business Details",
    desc: "Basic information about your venue.",
    color: "#FF3B6B",
    bg: "#FFF0F4",
    items: [
      "Business name & type",
      "Mobile & WhatsApp number",
      "City, area & full address",
      "CNIC number (for verification)",
    ],
  },
  {
    step: "02",
    title: "Business Information",
    desc: "Details about your services and pricing.",
    color: "#F97316",
    bg: "#FFF7ED",
    items: [
      "Service / hall name",
      "Capacity or service details",
      "Pricing (PKR)",
      "Short description (optional)",
    ],
  },
  {
    step: "03",
    title: "Account Setup",
    desc: "Create your vendor login credentials.",
    color: "#A855F7",
    bg: "#FAF5FF",
    items: [
      "Owner / manager full name",
      "Email address (for login & updates)",
      "Password (min. 8 characters)",
    ],
  },
  {
    step: "04",
    title: "Email Verification",
    desc: "We'll send a one-time code to verify your email.",
    color: "#22C55E",
    bg: "#F0FDF4",
    items: [
      "Access to your email inbox",
      "6-digit OTP sent instantly",
      "Valid for 10 minutes",
    ],
  },
];

export default function OnboardingIndexPage() {
  return (
    <div className="w-full max-w-2xl">

      {/* Header */}
      <div className="mb-10">
        <span
          className="inline-block text-xs font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-4"
          style={{ background: "#FFF0F4", color: PRIMARY }}
        >
          Get Started
        </span>
        <h1 className="text-3xl font-black tracking-tight text-black mb-2">
          Here&apos;s what you&apos;ll need.
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>
          Get these ready before you start — the whole process takes about{" "}
          <span className="font-semibold text-black">2 minutes.</span>
        </p>
      </div>

      {/* Steps */}
      <div className="flex flex-col gap-3 mb-10">
        {STEPS.map((s) => (
          <div
            key={s.step}
            className="flex gap-4 rounded-2xl p-5"
            style={{ border: "1.5px solid #F3F4F6", background: "#fff" }}
          >
            {/* Step number */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0"
              style={{ background: s.bg, color: s.color }}
            >
              {s.step}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-bold text-black">{s.title}</p>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: s.bg, color: s.color }}
                >
                  Step {s.step}
                </span>
              </div>
              <p className="text-xs mb-3" style={{ color: "#9CA3AF" }}>{s.desc}</p>

              <ul className="flex flex-col gap-1.5">
                {s.items.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <svg
                      className="shrink-0 mt-0.5"
                      width="13" height="13" viewBox="0 0 24 24"
                      fill="none" stroke={s.color} strokeWidth="2.5"
                      strokeLinecap="round" strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-xs" style={{ color: "#374151" }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Note */}
      <div
        className="flex items-start gap-3 rounded-2xl px-4 py-3.5 mb-8"
        style={{ background: "#FFFBEB", border: "1.5px solid #FDE68A" }}
      >
        <svg className="shrink-0 mt-0.5" width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p className="text-xs leading-relaxed" style={{ color: "#92400E" }}>
          Your listing will go live after our team reviews and verifies your business.
          This usually takes <span className="font-semibold">24–48 hours.</span>
        </p>
      </div>

      {/* CTA */}
      <div className="flex items-center gap-4">
        <Link
          href="/vendor/onboarding/business-info"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
          style={{ background: PRIMARY }}
        >
          Start Registration
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>

    </div>
  );
}
