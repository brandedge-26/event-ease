"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useUserStore } from "@/store/useUserStore";

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
const ICON_COLOR = "#6B7280";
const ICON_BG    = "#F3F4F6";

const VENUE_TYPES = [
  {
    label: "Banquet Hall", desc: "Grand halls for large gatherings", href: "/venues?type=Banquet+Hall",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  },
  {
    label: "Marquee", desc: "Elegant open-air event spaces", href: "/venues?type=Marquee",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 21L12 4l8.5 17"/><path d="M12 4v17"/><path d="M3.5 21h17"/></svg>,
  },
  {
    label: "Ballroom", desc: "Luxury spaces for premium events", href: "/venues?type=Ballroom",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>,
  },
  {
    label: "Wedding Lawn", desc: "Lush outdoor wedding venues", href: "/venues?type=Wedding+Lawn",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V12"/><path d="M5 12H2a10 10 0 0017 7.16"/><path d="M14.5 9.5A4.5 4.5 0 007 9.5V12h7.5z"/><path d="M19 12h3a10 10 0 00-4-7.9V9a4 4 0 010 3z"/></svg>,
  },
  {
    label: "Hotel Banquet", desc: "5-star hotel event facilities", href: "/venues?type=Hotel+Banquet",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M2 9h20"/><path d="M9 3v6"/><rect x="6" y="13" width="3" height="3"/><rect x="12" y="13" width="3" height="3"/></svg>,
  },
  {
    label: "Rooftop Venue", desc: "Open-sky events with city views", href: "/venues?type=Rooftop",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20"/><path d="M2 12l10-9 10 9"/><rect x="5" y="12" width="14" height="9"/><rect x="9" y="16" width="6" height="5"/></svg>,
  },
  {
    label: "Beauty Parlor", desc: "Bridal makeup & grooming services", href: "/venues?type=Beauty+Parlor",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.24 12.24a6 6 0 00-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg>,
  },
  {
    label: "Farm House", desc: "Scenic countryside event venues", href: "/venues?type=Farm+House",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-4h6v4"/><path d="M10 11h4"/><path d="M10 15h4"/></svg>,
  },
  {
    label: "Florist", desc: "Fresh flowers & floral arrangements", href: "/venues?type=Florist",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V12"/><path d="M12 12C12 12 7 10 7 6a5 5 0 0110 0c0 4-5 6-5 6z"/><path d="M12 12c0 0-5 2-8 0a5 5 0 017.07-7.07"/><path d="M12 12c0 0 5 2 8 0a5 5 0 00-7.07-7.07"/><path d="M12 12c0 0-2 5 0 8a5 5 0 007.07-7.07"/><path d="M12 12c0 0 2-5 0-8a5 5 0 00-7.07 7.07"/></svg>,
  },
];

const ADD_ONS = [
  {
    label: "Catering",       desc: "Food & beverage packages",    href: "/venues?q=catering",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
  },
  {
    label: "Decoration",     desc: "Floral & event styling",      href: "/venues?q=decoration",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z"/></svg>,
  },
  {
    label: "Photography",    desc: "Photo & video coverage",      href: "/venues?q=photography",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  },
  {
    label: "Sound & Lights", desc: "Audio & lighting setup",      href: "/venues?q=sound",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07"/><path d="M19.07 4.93a10 10 0 010 14.14"/></svg>,
  },
  {
    label: "Car Rental",     desc: "Luxury & bridal transport",   href: "/venues?q=car+rental",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 4v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  },
  {
    label: "Fireworks",      desc: "Stunning pyrotechnic shows",  href: "/venues?q=fireworks",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v6"/><path d="M12 16v6"/><path d="M4.93 4.93l4.24 4.24"/><path d="M14.83 14.83l4.24 4.24"/><path d="M2 12h6"/><path d="M16 12h6"/><path d="M4.93 19.07l4.24-4.24"/><path d="M14.83 9.17l4.24-4.24"/></svg>,
  },
];

// ─── Events data ──────────────────────────────────────────────────────────────
const EVENT_ITEMS = [
  {
    label: "Barat", desc: "Grand wedding procession event", href: "/events/barat",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  },
  {
    label: "Mehndi & Mayo", desc: "Colorful pre-wedding celebrations", href: "/events/mehndi",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z"/><path d="M12 11a3 3 0 100-6 3 3 0 000 6z"/></svg>,
  },
  {
    label: "Walima", desc: "Post-wedding reception dinner", href: "/events/walima",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 15V2s-5 0-5 7v6a2 2 0 002 2h3zm0 0v7"/></svg>,
  },
  {
    label: "Bridal Shower", desc: "Intimate bridal party events", href: "/events/bridal",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"/><path d="M12 13v9"/><path d="M8 18h8"/></svg>,
  },
  {
    label: "Engagement", desc: "Ring ceremony & formal gatherings", href: "/events/engagement",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="15" r="6"/><path d="M9.5 8l2.5-5 2.5 5"/><path d="M9.5 8h5"/><circle cx="12" cy="15" r="2.5"/></svg>,
  },
  {
    label: "Nikkah", desc: "Sacred Islamic marriage ceremony", href: "/events/nikkah",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21V10l9-7 9 7v11"/><path d="M3 21h18"/><path d="M9 21v-6h6v6"/><path d="M12 3V1"/><path d="M12 1l-2 2h4l-2-2z"/></svg>,
  },
  {
    label: "Qawali Night", desc: "Soulful Sufi music evenings", href: "/events/qawali",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  },
  {
    label: "Birthday Party", desc: "Memorable birthday celebrations", href: "/events/birthday",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><path d="M9 3h6"/><path d="M12 3v4"/><rect x="3" y="11" width="18" height="10" rx="2"/></svg>,
  },
];

// ─── Vendors data ─────────────────────────────────────────────────────────────
const VENDOR_ITEMS = [
  {
    label: "Banquet Hall",   desc: "Grand halls for large gatherings",     href: "/vendors/banquet-hall",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  },
  {
    label: "Caterer",        desc: "Food & beverage packages",             href: "/vendors/caterer",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
  },
  {
    label: "Florist",        desc: "Fresh flowers & floral arrangements",  href: "/vendors/florist",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V12"/><path d="M12 12C12 12 7 10 7 6a5 5 0 0110 0c0 4-5 6-5 6z"/><path d="M12 12c0 0-5 2-8 0a5 5 0 017.07-7.07"/><path d="M12 12c0 0 5 2 8 0a5 5 0 00-7.07-7.07"/></svg>,
  },
  {
    label: "Photographer",   desc: "Photo & video coverage",               href: "/vendors/photographer",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  },
  {
    label: "Decorator",      desc: "Floral & event styling",               href: "/vendors/decorator",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z"/></svg>,
  },
  {
    label: "Sound & Lights", desc: "Audio & lighting setup",               href: "/vendors/sound-lights",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07"/><path d="M19.07 4.93a10 10 0 010 14.14"/></svg>,
  },
  {
    label: "Beauty Parlor",  desc: "Bridal makeup & grooming services",    href: "/vendors/beauty-parlor",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.24 12.24a6 6 0 00-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg>,
  },
  {
    label: "Car Rental",     desc: "Luxury & bridal transport",            href: "/vendors/car-rental",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 4v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
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
function navHoverBg(t: boolean) { return t ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)"; }

// ─── Get initials from name ───────────────────────────────────────────────────
function getInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join("");
}

// ─── Main Header ──────────────────────────────────────────────────────────────
export default function SiteHeader() {
  const [open,       setOpen]       = useState<string | null>(null);
  const [scrolled,   setScrolled]   = useState(false);
  const [userMenu,   setUserMenu]   = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pathname    = usePathname();
  const router      = useRouter();
  const isHome      = pathname === "/";
  const tr          = isHome && !scrolled;

  const user        = useUserStore((s) => s.user);
  const clearAuth   = useUserStore((s) => s.clearAuth);
  const accessToken = useUserStore((s) => s.accessToken);
  const isLoading   = useUserStore((s) => s.isLoading);

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setScrolled(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  // Close user menu on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenu(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  async function handleLogout() {
    try { await api.post("/api/user/auth/logout", {}, accessToken ?? undefined); } catch { /* ignore */ }
    clearAuth();
    setUserMenu(false);
    router.push("/");
  }

  const headerStyle = tr
    ? {
        background:          "rgba(255,255,255,0.08)",
        backdropFilter:      "blur(20px)",
        WebkitBackdropFilter:"blur(20px)",
        borderBottom:        "1px solid rgba(255,255,255,0.14)",
        boxShadow:           "inset 0 1px 0 rgba(255,255,255,0.18)",
      }
    : {
        background:          "rgba(255,255,255,0.08)",
        backdropFilter:      "blur(20px)",
        WebkitBackdropFilter:"blur(20px)",
        borderBottom:        "1px solid rgba(180,180,190,0.35)",
        boxShadow:           "inset 0 1px 0 rgba(255,255,255,0.18)",
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
              <div className="absolute top-full left-1/2 -translate-x-1/2 z-50 pt-3" style={{ minWidth: 600 }}>
                <div className="rounded-2xl bg-white overflow-hidden"
                  style={{ border: "1px solid #EBEBEB", boxShadow: "0 24px 60px rgba(0,0,0,0.13), 0 4px 16px rgba(0,0,0,0.06)" }}>

                  {/* Venue Types */}
                  <div className="px-5 pt-4 pb-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "#C0C0C0" }}>Venue Types</p>
                  </div>
                  <div className="grid grid-cols-2 px-3 pb-2">
                    {VENUE_TYPES.map(v => (
                      <Link key={v.label} href={v.href} onClick={() => setOpen(null)}
                        className="flex items-center gap-3 px-2 py-2.5 rounded-xl group transition-colors"
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F9FAFB"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                        <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: ICON_BG }}>
                          {v.icon}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold leading-tight" style={{ color: "#111827" }}>{v.label}</span>
                          <span className="block text-[11px] leading-tight mt-0.5" style={{ color: "#9CA3AF" }}>{v.desc}</span>
                        </span>
                      </Link>
                    ))}
                  </div>

                  {/* Add-ons — no title, just separator */}
                  <div className="grid grid-cols-2 px-3 pb-2" style={{ borderTop: "1px solid #F3F4F6" }}>
                    {ADD_ONS.map(a => (
                      <Link key={a.label} href={a.href} onClick={() => setOpen(null)}
                        className="flex items-center gap-3 px-2 py-2.5 rounded-xl group transition-colors"
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F9FAFB"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                        <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: ICON_BG }}>
                          {a.icon}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold leading-tight" style={{ color: "#111827" }}>{a.label}</span>
                          <span className="block text-[11px] leading-tight mt-0.5" style={{ color: "#9CA3AF" }}>{a.desc}</span>
                        </span>
                      </Link>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-3 flex items-center justify-between"
                    style={{ borderTop: "1px solid #F3F4F6", background: "#FAFAFA" }}>
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
              <div className="absolute top-full left-1/2 -translate-x-1/2 z-50 pt-3" style={{ minWidth: 560 }}>
                <div className="rounded-2xl bg-white overflow-hidden"
                  style={{ border: "1px solid #EBEBEB", boxShadow: "0 24px 60px rgba(0,0,0,0.13), 0 4px 16px rgba(0,0,0,0.06)" }}>

                  <div className="px-5 pt-4 pb-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "#C0C0C0" }}>Plan Your Event</p>
                  </div>

                  <div className="grid grid-cols-2 px-3 pb-2">
                    {EVENT_ITEMS.map(ev => (
                      <Link key={ev.label} href={ev.href} onClick={() => setOpen(null)}
                        className="flex items-center gap-3 px-2 py-2.5 rounded-xl group transition-colors"
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F9FAFB"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                        <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: ICON_BG }}>
                          {ev.icon}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold leading-tight" style={{ color: "#111827" }}>{ev.label}</span>
                          <span className="block text-[11px] leading-tight mt-0.5" style={{ color: "#9CA3AF" }}>{ev.desc}</span>
                        </span>
                      </Link>
                    ))}
                  </div>

                  <div className="px-5 py-3 flex items-center justify-between"
                    style={{ borderTop: "1px solid #F3F4F6", background: "#FAFAFA" }}>
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

          {/* ── Vendors ────────────────────────────────────────────────── */}
          <div className="relative"
            onMouseEnter={() => setOpen("Vendors")}
            onMouseLeave={() => setOpen(null)}>

            <button className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-sm font-medium cursor-pointer"
              style={{ color: navColor(tr), background: open === "Vendors" ? navHoverBg(tr) : "transparent" }}>
              Vendors <Chevron open={open === "Vendors"} />
            </button>

            {open === "Vendors" && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 z-50 pt-3" style={{ minWidth: 520 }}>
                <div className="rounded-2xl bg-white overflow-hidden"
                  style={{ border: "1px solid #EBEBEB", boxShadow: "0 24px 60px rgba(0,0,0,0.13), 0 4px 16px rgba(0,0,0,0.06)" }}>

                  <div className="px-5 pt-4 pb-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "#C0C0C0" }}>Browse Vendors</p>
                  </div>

                  <div className="grid grid-cols-2 px-3 pb-2">
                    {VENDOR_ITEMS.map(v => (
                      <Link key={v.label} href={v.href} onClick={() => setOpen(null)}
                        className="flex items-center gap-3 px-2 py-2.5 rounded-xl transition-colors"
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F9FAFB"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                        <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: ICON_BG }}>
                          {v.icon}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold leading-tight" style={{ color: "#111827" }}>{v.label}</span>
                          <span className="block text-[11px] leading-tight mt-0.5" style={{ color: "#9CA3AF" }}>{v.desc}</span>
                        </span>
                      </Link>
                    ))}
                  </div>

                  <div className="px-5 py-3 flex items-center justify-between"
                    style={{ borderTop: "1px solid #F3F4F6", background: "#FAFAFA" }}>
                    <span className="text-xs" style={{ color: "#BBBBBB" }}>Find trusted vendors for your event</span>
                    <Link href="/vendors" onClick={() => setOpen(null)}
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

          {isLoading ? (
            /* ── Skeleton while checking session ── */
            <div className="hidden sm:flex items-center gap-2 px-2 py-1.5">
              <div
                className="w-8 h-8 rounded-full animate-pulse"
                style={{ background: tr ? "rgba(255,255,255,0.18)" : "#E5E7EB" }}
              />
              <div
                className="w-16 h-4 rounded-lg animate-pulse"
                style={{ background: tr ? "rgba(255,255,255,0.18)" : "#E5E7EB" }}
              />
            </div>
          ) : user ? (
            /* ── Logged-in avatar + dropdown ── */
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenu(v => !v)}
                className="flex items-center gap-2 cursor-pointer rounded-xl px-2 py-1.5 transition-all"
                style={{ background: userMenu ? (tr ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)") : "transparent" }}
              >
                <img
                  src={`https://avatar.vercel.sh/${encodeURIComponent(user.name)}.svg?text=${getInitials(user.name)}`}
                  alt={user.name}
                  width={32}
                  height={32}
                  className="rounded-full"
                  style={{ border: tr ? "2px solid rgba(255,255,255,0.5)" : "2px solid #E5E7EB" }}
                />
                <span className="hidden sm:block text-sm font-semibold max-w-[100px] truncate"
                  style={{ color: tr ? "#fff" : "#111827" }}>
                  {user.name.split(" ")[0]}
                </span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                  stroke={tr ? "rgba(255,255,255,0.7)" : "#9CA3AF"} strokeWidth="2.5" strokeLinecap="round"
                  style={{ transition: "transform .2s", transform: userMenu ? "rotate(180deg)" : "rotate(0deg)" }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {userMenu && (
                <div className="absolute top-full right-0 mt-2 z-50" style={{ minWidth: 200 }}>
                  <div className="rounded-2xl bg-white overflow-hidden"
                    style={{ border: "1px solid #EBEBEB", boxShadow: "0 16px 40px rgba(0,0,0,0.10)" }}>

                    {/* User info */}
                    <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: "1px solid #F3F4F6" }}>
                      <img
                        src={`https://avatar.vercel.sh/${encodeURIComponent(user.name)}.svg?text=${getInitials(user.name)}`}
                        alt={user.name}
                        width={36}
                        height={36}
                        className="rounded-full shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-black truncate">{user.name}</p>
                        <p className="text-[11px] truncate" style={{ color: "#9CA3AF" }}>{user.email}</p>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      <Link href="/profile" onClick={() => setUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors"
                        style={{ color: "#374151" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#FAFAFA"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        My Profile
                      </Link>
                      <Link href="/bookings" onClick={() => setUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors"
                        style={{ color: "#374151" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#FAFAFA"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        My Bookings
                      </Link>
                      {/* List Your Business — mobile only */}
                      <Link href="/vendor/onboarding" onClick={() => setUserMenu(false)}
                        className="sm:hidden flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors"
                        style={{ color: PRIMARY }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#FFF0F4"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                        List Your Business
                      </Link>
                    </div>

                    {/* Logout */}
                    <div style={{ borderTop: "1px solid #F3F4F6" }}>
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors"
                        style={{ color: "#EF4444" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#FEF2F2"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        Sign out
                      </button>
                    </div>

                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── Guest login button ── */
            <Link href="/login"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all"
              style={{
                borderColor: tr ? "rgba(255,255,255,0.45)" : "#E5E7EB",
                color:       tr ? "#fff" : "#374151",
                background:  "transparent",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = tr ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.05)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              Login
            </Link>
          )}

          <Link href="/vendor/onboarding"
            className="hidden sm:block px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: PRIMARY }}>
            List Your Business
          </Link>
        </div>

      </div>

    </header>
  );
}
