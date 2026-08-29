"use client";

import { usePathname } from "next/navigation";

const STEPS = [
  { label: "Business Info", path: "/vendor/onboarding/business-info" },
  { label: "Hall Details",  path: "/vendor/onboarding/halls"          },
  { label: "Account Info",  path: "/vendor/onboarding/account"        },
  { label: "Verify Email",  path: "/vendor/onboarding/verify"         },
];

export default function StepIndicator() {
  const pathname = usePathname();

  const currentIndex = STEPS.findIndex(s => pathname.startsWith(s.path));
  // complete page → all done
  const isDone = pathname.includes("/complete");

  return (
    <div className="flex items-center gap-2">
      {STEPS.map((step, i) => {
        const completed = isDone || (currentIndex !== -1 && i < currentIndex);
        const active    = currentIndex === i;

        let dotColor: string;
        if (completed)    dotColor = "#16A34A";          // green
        else if (active)  dotColor = "var(--primary)";   // pink
        else              dotColor = "#D1D5DB";           // gray

        return (
          <div key={i} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              {completed ? (
                /* Green checkmark dot */
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="12" fill="#16A34A"/>
                  <polyline points="6,12 10,16 18,8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <div className="w-2 h-2 rounded-full" style={{ background: dotColor }} />
              )}
              <span className="text-xs hidden sm:block" style={{ color: completed ? "#16A34A" : active ? "var(--primary)" : "var(--fg-muted)" }}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="w-8 h-px" style={{ background: completed ? "#BBF7D0" : "#E5E7EB" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
