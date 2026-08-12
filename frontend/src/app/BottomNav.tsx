"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const PRIMARY = "#FF3B6B";

const NAV_ITEMS = [
  {
    label: "Home",
    href: "/",
    icon: (a: boolean) => (
      <svg width="21" height="21" viewBox="0 0 24 24" fill={a ? PRIMARY : "none"} stroke={a ? PRIMARY : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    label: "Venues",
    href: "/venues",
    icon: (a: boolean) => (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={a ? PRIMARY : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="1"/>
        <path d="M9 22v-4h6v4"/>
        <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/>
      </svg>
    ),
  },
  {
    label: "Vendors",
    href: "/vendor/login",
    icon: (a: boolean) => (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={a ? PRIMARY : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87"/>
        <path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
];

const MORE_ITEMS = [
  {
    label: "How it Works",
    href: "/#how",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
  {
    label: "About",
    href: "/#about",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    label: "Contact",
    href: "/contact",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
    ),
  },
  {
    label: "List Your Venue",
    href: "/vendor/onboarding/business-info",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF3B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14"/>
      </svg>
    ),
    highlight: true,
  },
];

function isActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  // never mark hash links or external anchors as active
  if (href.includes("#")) return false;
  return pathname === href || pathname.startsWith(href + "/");
}

export default function BottomNav() {
  const pathname  = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  // Close sheet on navigation
  useEffect(() => { setMoreOpen(false); }, [pathname]);

  // Lock body scroll when sheet open
  useEffect(() => {
    document.body.style.overflow = moreOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [moreOpen]);

  return (
    <>
      {/* ── Bottom nav bar ────────────────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t"
        style={{ borderColor: "#E5E7EB", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-center justify-around px-1 py-1">

          {NAV_ITEMS.map(item => {
            const active = isActive(item.href, pathname);
            return (
              <Link key={item.label} href={item.href}
                className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-0"
                style={{ color: active ? PRIMARY : "#9CA3AF" }}>
                {item.icon(active)}
                <span className="text-[10px] font-semibold leading-none">{item.label}</span>
              </Link>
            );
          })}

          {/* More button */}
          <button onClick={() => setMoreOpen(o => !o)}
            className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-0 cursor-pointer"
            style={{ color: moreOpen ? PRIMARY : "#9CA3AF" }}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              stroke={moreOpen ? PRIMARY : "#9CA3AF"}>
              <circle cx="5"  cy="12" r="1.2" fill={moreOpen ? PRIMARY : "#9CA3AF"}/>
              <circle cx="12" cy="12" r="1.2" fill={moreOpen ? PRIMARY : "#9CA3AF"}/>
              <circle cx="19" cy="12" r="1.2" fill={moreOpen ? PRIMARY : "#9CA3AF"}/>
            </svg>
            <span className="text-[10px] font-semibold leading-none">More</span>
          </button>

        </div>
      </nav>

      {/* ── More bottom sheet ─────────────────────────────────────────────────── */}
      {moreOpen && (
        <>
          {/* Backdrop */}
          <div className="backdrop-animate fixed inset-0 z-40 md:hidden"
            style={{ background: "rgba(0,0,0,0.4)" }}
            onClick={() => setMoreOpen(false)} />

          {/* Sheet */}
          <div className="sheet-animate fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white rounded-t-3xl overflow-hidden"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>

            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full" style={{ background: "#E5E7EB" }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-2 border-b" style={{ borderColor: "#F3F4F6" }}>
              <span className="text-base font-bold text-black">More</span>
              <button onClick={() => setMoreOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 cursor-pointer transition-colors"
                style={{ color: "#6B7280" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Items */}
            <div className="px-4 py-3 flex flex-col gap-1">
              {MORE_ITEMS.map(item => (
                <Link key={item.label} href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-colors hover:bg-gray-50"
                  style={{ color: item.highlight ? PRIMARY : "#111827" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: item.highlight ? "#FFF0F4" : "#F9FAFB" }}>
                    {item.icon}
                  </div>
                  <span className="text-sm font-semibold">{item.label}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" className="ml-auto">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </Link>
              ))}
            </div>

            {/* Branding */}
            <div className="px-5 pb-5 pt-2">
              <p className="text-center text-xs" style={{ color: "#D1D5DB" }}>
                &copy; {new Date().getFullYear()} <span style={{ color: PRIMARY }}>Event Ease</span> · Pakistan&apos;s Venue Platform
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
