import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Setup Your Business — Event Ease",
  description: "Complete your business profile to get started with Event Ease.",
};

const steps = [
  { label: "Business Info", path: "/vendor/onboarding/business-info" },
  { label: "Hall Details", path: "/vendor/onboarding/halls" },
  { label: "Account Info", path: "/vendor/onboarding/account" },
  { label: "Complete", path: "/vendor/onboarding/complete" },
];

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Top Bar */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-[#E5E7EB]">
        <Image
          src="/logo/logo-icon.svg"
          alt="Event Ease"
          width={36}
          height={36}
          className="rounded-xl"
        />
        <div className="flex items-center gap-2">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: "var(--primary)" }}
                />
                <span className="text-xs hidden sm:block" style={{ color: "var(--fg-muted)" }}>
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="w-8 h-px" style={{ background: "#E5E7EB" }} />
              )}
            </div>
          ))}
        </div>
        <div className="w-9" />
      </header>

      {/* Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </main>

    </div>
  );
}
