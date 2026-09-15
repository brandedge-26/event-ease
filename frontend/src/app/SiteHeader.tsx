"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useUserStore } from "@/store/useUserStore";

const PRIMARY = "#FF3B6B";

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

// ─── Full-screen menu tabs ──────────────────────────────────────────────────────
const MENU_TABS = [
  { id: "Venues",   items: VENUE_TYPES },
  { id: "Services", items: ADD_ONS },
  { id: "Events",   items: EVENT_ITEMS },
  { id: "Vendors",  items: VENDOR_ITEMS },
  { id: "Company",  items: COMPANY_ITEMS },
] as const;
type MenuTabId = typeof MENU_TABS[number]["id"];

// ─── Get initials from name ───────────────────────────────────────────────────
function getInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join("");
}

// ─── Main Header ──────────────────────────────────────────────────────────────
export default function SiteHeader() {
  const [scrolled,   setScrolled]   = useState(false);
  const [userMenu,   setUserMenu]   = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [activeTab,  setActiveTab]  = useState<MenuTabId>("Venues");
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pathname    = usePathname();
  const router      = useRouter();
  const isHome      = pathname === "/";
  const tr          = isHome && !scrolled && !menuOpen;

  // Close full-screen menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

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
          <Image src="/favicon.svg" alt="Event Ease" width={28} height={28} className="rounded-lg" />
          <span className="text-lg font-black tracking-tight">
            <span style={{ color: tr ? "#fff" : "#111827" }}>Event</span>
            <span style={{ color: PRIMARY }}>Ease</span>
          </span>
        </Link>

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
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-sm font-semibold border transition-all"
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

          {/* List Your Business — mobile icon button */}
          <Link
            href="/vendor/onboarding"
            aria-label="List Your Business"
            className="sm:hidden flex items-center justify-center w-9 h-9 rounded-full shrink-0 transition-all active:scale-95"
            style={{
              background: "linear-gradient(135deg, #FF5478 0%, #FF3B6B 55%, #E8235A 100%)",
              boxShadow:  "0 4px 14px rgba(255,59,107,0.45), inset 0 1px 0 rgba(255,255,255,0.35)",
            }}>
            <img src="/logo/white_icon.png" alt="" width={16} height={16} />
          </Link>

          <Link href="/vendor/onboarding"
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
            style={{
              background:  "linear-gradient(135deg, #FF5478 0%, #FF3B6B 55%, #E8235A 100%)",
              boxShadow:   "0 4px 18px rgba(255,59,107,0.45), inset 0 1px 0 rgba(255,255,255,0.35)",
            }}>
            <img src="/logo/white_icon.png" alt="" width={14} height={14} className="shrink-0" />
            List Your Business
          </Link>

          {/* Menu toggle — desktop only */}
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer"
            style={{
              borderColor: tr ? "rgba(255,255,255,0.45)" : "#E5E7EB",
              color:       tr ? "#fff" : "#374151",
              background:  menuOpen ? (tr ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.05)") : "transparent",
            }}
          >
            {menuOpen ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Close
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
                Menu
              </>
            )}
          </button>
        </div>

      </div>

      {/* ── Full-screen menu overlay ── */}
      {menuOpen && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 hidden md:block"
          style={{ top: 64 }}
          onClick={() => setMenuOpen(false)}
        >
          <div className="absolute inset-0" style={{ background: "rgba(17,24,39,0.35)" }} />

          <div
            className="relative bg-white overflow-hidden"
            style={{ borderBottom: "1px solid #E5E7EB", boxShadow: "0 24px 60px rgba(0,0,0,0.15)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="px-4 lg:px-8">

              {/* Tabs row */}
              <div className="flex items-center gap-7 overflow-x-auto scrollbar-hide" style={{ borderBottom: "1px solid #F3F4F6" }}>
                {MENU_TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="py-4 text-sm font-bold whitespace-nowrap cursor-pointer"
                  >
                    <span
                      className="px-1.5 py-0.5 rounded transition-colors"
                      style={{
                        background: activeTab === tab.id ? PRIMARY : "transparent",
                        color:      activeTab === tab.id ? "#fff" : "#9CA3AF",
                      }}
                    >
                      {tab.id}
                    </span>
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="relative py-10" style={{ minHeight: 300 }}>
                {/* Watermark */}
                <img
                  src="/logo/logo-icon.png"
                  alt=""
                  className="absolute -left-12 -bottom-20 w-[420px] opacity-[0.14] pointer-events-none select-none"
                />

                <div className="relative z-10 grid grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-4 max-w-3xl">
                  {MENU_TABS.find(t => t.id === activeTab)?.items.map(item => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="text-lg sm:text-xl font-bold transition-colors w-fit"
                      style={{ color: "#111827" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = PRIMARY}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#111827"}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </header>
  );
}
