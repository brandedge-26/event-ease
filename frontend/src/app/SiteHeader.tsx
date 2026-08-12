"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const PRIMARY = "#FF3B6B";

type NavChild = { label: string; href: string };
type NavItem  =
  | { label: string; href: string;  children?: never }
  | { label: string; href?: never;  children: NavChild[] };

const NAV: NavItem[] = [
  { label: "Venues",   href: "/venues" },
  {
    label: "Services",
    children: [
      { label: "Banquet Halls", href: "/?type=Banquet+Hall#venues" },
      { label: "Marquees",      href: "/?type=Marquee#venues"      },
      { label: "Ballrooms",     href: "/?type=Ballroom#venues"     },
    ],
  },
  { label: "Vendors", href: "/vendor/login" },
  {
    label: "Company",
    children: [
      { label: "How it Works", href: "#how"     },
      { label: "About",        href: "#about"   },
      { label: "Contact",      href: "/contact" },
    ],
  },
];

export default function SiteHeader() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-50 bg-white border-b" style={{ borderColor: "#E5E7EB" }}>
      <div className="px-4 lg:px-8 h-16 flex items-center justify-between gap-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image src="/logo/logo-icon.svg" alt="Event Ease" width={28} height={28} className="rounded-lg" />
          <span className="text-base font-black tracking-tight">
            <span className="text-black">Event</span>
            <span style={{ color: PRIMARY }}>Ease</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {NAV.map(item =>
            item.children ? (
              <div key={item.label} className="relative"
                onMouseEnter={() => setOpen(item.label)}
                onMouseLeave={() => setOpen(null)}>
                <button
                  className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-gray-50 cursor-pointer"
                  style={{ color: "#374151" }}>
                  {item.label}
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {open === item.label && (
                  <div className="absolute top-full left-0 z-50 pt-2 min-w-[168px]">
                    <div className="py-1.5 rounded-xl bg-white border"
                      style={{ borderColor: "#E5E7EB", boxShadow: "0 8px 24px rgba(0,0,0,0.09)" }}>
                      {item.children.map(child => (
                        <Link key={child.label} href={child.href}
                          onClick={() => setOpen(null)}
                          className="flex items-center px-4 py-2.5 text-sm transition-colors hover:bg-gray-50"
                          style={{ color: "#374151" }}>
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link key={item.label} href={item.href}
                className="px-3.5 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-gray-50"
                style={{ color: "#374151" }}>
                {item.label}
              </Link>
            )
          )}
        </nav>

        {/* Auth buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/login"
            className="hidden sm:flex px-4 py-2 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50"
            style={{ borderColor: "#E5E7EB", color: "#374151" }}>
            Login
          </Link>
          <Link href="/vendor/onboarding/business-info"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: PRIMARY }}>
            List Your Venue
          </Link>
        </div>

      </div>
    </header>
  );
}
