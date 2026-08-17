"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const PRIMARY = "#FF3B6B";

// ─── Chevron ──────────────────────────────────────────────────────────────────
function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ transition: "transform .2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

// ─── Services data ────────────────────────────────────────────────────────────
const VENUE_TYPES = [
  {
    label: "Banquet Hall", desc: "Grand halls for large gatherings", href: "/venues?type=Banquet+Hall", color: "#FF3B6B",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  },
  {
    label: "Marquee", desc: "Elegant open-air event spaces", href: "/venues?type=Marquee", color: "#F97316",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 21L12 4l8.5 17"/><path d="M12 4v17"/><path d="M3.5 21h17"/></svg>,
  },
  {
    label: "Ballroom", desc: "Luxury spaces for premium events", href: "/venues?type=Ballroom", color: "#A855F7",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>,
  },
  {
    label: "Wedding Lawn", desc: "Lush outdoor wedding venues", href: "/venues?type=Wedding+Lawn", color: "#22C55E",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V12"/><path d="M5 12H2a10 10 0 0017 7.16"/><path d="M14.5 9.5A4.5 4.5 0 007 9.5V12h7.5z"/><path d="M19 12h3a10 10 0 00-4-7.9V9a4 4 0 010 3z"/></svg>,
  },
  {
    label: "Hotel Banquet", desc: "5-star hotel event facilities", href: "/venues?type=Hotel+Banquet", color: "#3B82F6",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M2 9h20"/><path d="M9 3v6"/><rect x="6" y="13" width="3" height="3"/><rect x="12" y="13" width="3" height="3"/></svg>,
  },
  {
    label: "Rooftop Venue", desc: "Open-sky events with city views", href: "/venues?type=Rooftop", color: "#F59E0B",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20"/><path d="M2 12l10-9 10 9"/><rect x="5" y="12" width="14" height="9"/><rect x="9" y="16" width="6" height="5"/></svg>,
  },
];

const ADD_ONS = [
  { label: "Catering",       href: "/venues?q=catering",    color: "#FF3B6B" },
  { label: "Decoration",     href: "/venues?q=decoration",  color: "#A855F7" },
  { label: "Photography",    href: "/venues?q=photography", color: "#F97316" },
  { label: "Sound & Lights", href: "/venues?q=sound",       color: "#3B82F6" },
  { label: "Car Rental",     href: "/venues?q=car+rental",  color: "#22C55E" },
];

// ─── Events data ──────────────────────────────────────────────────────────────
const EVENT_ITEMS = [
  {
    label: "Barat Planning", href: "/venues?event=barat", color: "#FF3B6B",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  },
  {
    label: "Mehndi & Mayo", href: "/venues?event=mehndi", color: "#22C55E",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z"/><path d="M12 11a3 3 0 100-6 3 3 0 000 6z"/></svg>,
  },
  {
    label: "Walima Reception", href: "/venues?event=walima", color: "#F97316",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 15V2s-5 0-5 7v6a2 2 0 002 2h3zm0 0v7"/></svg>,
  },
  {
    label: "Bridal Shower", href: "/venues?event=bridal", color: "#EC4899",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"/><path d="M12 13v9"/><path d="M8 18h8"/></svg>,
  },
  {
    label: "Engagement", href: "/venues?event=engagement", color: "#A855F7",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="15" r="6"/><path d="M9.5 8l2.5-5 2.5 5"/><path d="M9.5 8h5"/><circle cx="12" cy="15" r="2.5"/></svg>,
  },
  {
    label: "Nikkah", href: "/venues?event=nikkah", color: "#3B82F6",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21V10l9-7 9 7v11"/><path d="M3 21h18"/><path d="M9 21v-6h6v6"/><path d="M12 3V1"/><path d="M12 1l-2 2h4l-2-2z"/></svg>,
  },
  {
    label: "Qawali Night", href: "/venues?event=qawali", color: "#F59E0B",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  },
];

// ─── Company items ─────────────────────────────────────────────────────────────
const COMPANY_ITEMS = [
  {
    label: "How it Works", href: "/how-it-works",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>,
  },
  {
    label: "About", href: "#about",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  },
  {
    label: "Contact", href: "/contact",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  },
];

function navColor(t: boolean) { return t ? "rgba(255,255,255,0.92)" : "#374151"; }
function navHoverBg(t: boolean) { return t ? "rgba(255,255,255,0.12)" : "#F3F4F6"; }

// ─── Main Header ──────────────────────────────────────────────────────────────
export default function SiteHeader() {
  const [open,     setOpen]     = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const pathname  = usePathname();
  const isHome    = pathname === "/";
  const tr        = isHome && !scrolled; // transparent

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  const headerStyle = tr
    ? { background: "transparent", borderBottom: "none" }
    : {
        background:          "rgba(255,255,255,0.80)",
        backdropFilter:      "blur(20px)",
        WebkitBackdropFilter:"blur(20px)",
        borderBottom:        "1px solid rgba(229,231,235,0.55)",
        boxShadow:           "0 2px 20px rgba(0,0,0,0.06)",
      };

  return (
    <header className="sticky top-0 z-50 transition-all duration-300" style={headerStyle}>
      <div className="px-4 lg:px-8 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image src="/logo/logo-icon.svg" alt="Event Ease" width={28} height={28} className="rounded-lg" />
          <span className="text-base font-black tracking-tight">
            <span style={{ color: tr ? "#fff" : "#111827" }}>Event</span>
            <span style={{ color: PRIMARY }}>Ease</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">

          {/* Venues */}
          <Link href="/venues"
            className="px-3.5 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ color: navColor(tr) }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = navHoverBg(tr)}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
            Venues
          </Link>

          {/* ── Services ───────────────────────────────────────────────────── */}
          <div className="relative"
            onMouseEnter={() => setOpen("Services")}
            onMouseLeave={() => setOpen(null)}>

            <button className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-sm font-medium cursor-pointer"
              style={{ color: navColor(tr), background: open === "Services" ? navHoverBg(tr) : "transparent" }}>
              Services <Chevron open={open === "Services"} />
            </button>

            {open === "Services" && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 z-50 pt-3" style={{ minWidth: 580 }}>
                <div className="rounded-2xl bg-white overflow-hidden"
                  style={{ border: "1px solid #EBEBEB", boxShadow: "0 24px 60px rgba(0,0,0,0.13), 0 4px 16px rgba(0,0,0,0.06)" }}>

                  {/* Two-column split */}
                  <div className="flex">

                    {/* Left — venue types */}
                    <div className="flex-1 py-3">
                      <p className="px-4 pb-2 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "#C0C0C0" }}>
                        Venue Types
                      </p>
                      {VENUE_TYPES.map(v => (
                        <Link key={v.label} href={v.href} onClick={() => setOpen(null)}
                          className="flex items-center gap-3 px-4 py-2.5 group transition-colors"
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#FAFAFA"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                          {/* Colored icon dot */}
                          <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                            style={{ background: v.color + "18", color: v.color }}>
                            {v.icon}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-semibold" style={{ color: "#1A1A1A" }}>{v.label}</span>
                            <span className="block text-[11px] leading-tight" style={{ color: "#ABABAB" }}>{v.desc}</span>
                          </span>
                          <svg className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#CCCCCC" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                        </Link>
                      ))}
                    </div>

                    {/* Right — add-ons (subtle gray bg) */}
                    <div className="w-44 py-3 shrink-0" style={{ background: "#FAFAFA", borderLeft: "1px solid #F0F0F0" }}>
                      <p className="px-4 pb-2 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "#C0C0C0" }}>
                        Add-ons
                      </p>
                      {ADD_ONS.map(a => (
                        <Link key={a.label} href={a.href} onClick={() => setOpen(null)}
                          className="flex items-center gap-2.5 px-4 py-2.5 group transition-colors"
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F0F0F0"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: a.color }} />
                          <span className="text-sm font-medium" style={{ color: "#444" }}>{a.label}</span>
                        </Link>
                      ))}
                    </div>

                  </div>

                  {/* Footer */}
                  <div className="px-4 py-2.5 flex items-center justify-between"
                    style={{ borderTop: "1px solid #F0F0F0", background: "#FAFAFA" }}>
                    <span className="text-xs" style={{ color: "#BBBBBB" }}>Browse all venues & services</span>
                    <Link href="/venues" onClick={() => setOpen(null)}
                      className="text-xs font-bold flex items-center gap-1 transition-opacity hover:opacity-70"
                      style={{ color: PRIMARY }}>
                      View All
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </Link>
                  </div>

                </div>
              </div>
            )}
          </div>

          {/* ── Events ─────────────────────────────────────────────────────── */}
          <div className="relative"
            onMouseEnter={() => setOpen("Events")}
            onMouseLeave={() => setOpen(null)}>

            <button className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-sm font-medium cursor-pointer"
              style={{ color: navColor(tr), background: open === "Events" ? navHoverBg(tr) : "transparent" }}>
              Events <Chevron open={open === "Events"} />
            </button>

            {open === "Events" && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 z-50 pt-3" style={{ minWidth: 440 }}>
                <div className="rounded-2xl bg-white overflow-hidden"
                  style={{ border: "1px solid #EBEBEB", boxShadow: "0 24px 60px rgba(0,0,0,0.13), 0 4px 16px rgba(0,0,0,0.06)" }}>

                  <div className="px-4 pt-3 pb-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "#C0C0C0" }}>Plan Your Event</p>
                  </div>

                  {/* 2-column list — same row style as Services */}
                  <div className="grid grid-cols-2 pb-1" style={{ borderTop: "1px solid #F5F5F5" }}>
                    {EVENT_ITEMS.map(ev => (
                      <Link key={ev.label} href={ev.href} onClick={() => setOpen(null)}
                        className="flex items-center gap-3 px-4 py-2.5 group transition-colors"
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#FAFAFA"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                        <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                          style={{ background: ev.color + "18", color: ev.color }}>
                          {ev.icon}
                        </span>
                        <span className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>{ev.label}</span>
                      </Link>
                    ))}
                  </div>

                  <div className="px-4 py-2.5 flex items-center justify-between"
                    style={{ borderTop: "1px solid #F0F0F0", background: "#FAFAFA" }}>
                    <span className="text-xs" style={{ color: "#BBBBBB" }}>Find the perfect venue for your occasion</span>
                    <Link href="/venues" onClick={() => setOpen(null)}
                      className="text-xs font-bold flex items-center gap-1 transition-opacity hover:opacity-70"
                      style={{ color: PRIMARY }}>
                      Explore
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </Link>
                  </div>

                </div>
              </div>
            )}
          </div>

          {/* Vendors */}
          <Link href="/vendor/login"
            className="px-3.5 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ color: navColor(tr) }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = navHoverBg(tr)}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
            Vendors
          </Link>

          {/* ── Company ────────────────────────────────────────────────────── */}
          <div className="relative"
            onMouseEnter={() => setOpen("Company")}
            onMouseLeave={() => setOpen(null)}>

            <button className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-sm font-medium cursor-pointer"
              style={{ color: navColor(tr), background: open === "Company" ? navHoverBg(tr) : "transparent" }}>
              Company <Chevron open={open === "Company"} />
            </button>

            {open === "Company" && (
              <div className="absolute top-full left-0 z-50 pt-3" style={{ minWidth: 195 }}>
                <div className="rounded-2xl bg-white overflow-hidden"
                  style={{ border: "1px solid #EBEBEB", boxShadow: "0 16px 40px rgba(0,0,0,0.10)" }}>
                  <div className="py-1.5">
                    {COMPANY_ITEMS.map(item => (
                      <Link key={item.label} href={item.href}
                        onClick={() => setOpen(null)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors"
                        style={{ color: "#374151" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#FAFAFA"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                        {item.icon}
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

        </nav>

        {/* Auth buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/login"
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all"
            style={{
              borderColor: tr ? "rgba(255,255,255,0.55)" : "#E5E7EB",
              color:       tr ? "#fff"                    : "#374151",
              background:  "transparent",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = tr ? "rgba(255,255,255,0.10)" : "#F3F4F6"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            Login
          </Link>
          <Link href="/vendor/onboarding/business-info"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: PRIMARY }}>
            List Your Business
          </Link>
        </div>

      </div>
    </header>
  );
}
