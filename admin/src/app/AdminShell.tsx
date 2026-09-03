"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5510";

// ─── Nav Items ────────────────────────────────────────────────────────────────
const vendorsNav = [
  { label: "Vendors",   href: "/vendors",   icon: <BuildingIcon /> },
  { label: "Branches",  href: "/branches",  icon: <BranchIcon />  },
];

const nav = [
  { label: "Dashboard",    href: "/",               icon: <GridIcon /> },
  { label: "Users",        href: "/users",          icon: <UsersIcon /> },
  { label: "Applications", href: "/applications",   icon: <InboxIcon /> },
  { label: "Bookings",     href: "/bookings",       icon: <BookIcon /> },
  { label: "Payments",     href: "/payments",       icon: <PaymentIcon /> },
  { label: "Reviews",      href: "/reviews",        icon: <StarIcon /> },
  { label: "Notifications",href: "/notifications",  icon: <BellIcon /> },
  { label: "Reports",      href: "/reports",        icon: <ChartIcon /> },
  { label: "Settings",     href: "/settings",       icon: <SettingsIcon /> },
];

const promotionsNav = [
  { label: "Featured",         href: "/promotions/featured",          icon: <FeaturedIcon /> },
  { label: "Venue Promotion",  href: "/promotions/venue-promotion",   icon: <MegaphoneIcon /> },
];

const bottomNavMain = [
  { label: "Dashboard", href: "/",         icon: <GridIcon /> },
  { label: "Vendors",   href: "/vendors",  icon: <BuildingIcon /> },
  { label: "Bookings",  href: "/bookings", icon: <BookIcon /> },
];

const bottomNavMore = [
  { label: "Payments",       href: "/payments",       icon: <PaymentIcon /> },
  { label: "Reviews",        href: "/reviews",        icon: <StarIcon /> },
  { label: "Notifications",  href: "/notifications",  icon: <BellIcon /> },
  { label: "Reports",        href: "/reports",        icon: <ChartIcon /> },
  { label: "Settings",       href: "/settings",       icon: <SettingsIcon /> },
];

// ─── Shell ────────────────────────────────────────────────────────────────────
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();

  const [authed,     setAuthed]     = useState(false);
  const [checking,   setChecking]   = useState(true);
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen,   setMoreOpen]   = useState(false);
  const [isMobile,   setIsMobile]   = useState(false);
  const [avatarOpen,   setAvatarOpen]   = useState(false);
  const [unreadCount,  setUnreadCount]  = useState(0);
  const [promoOpen,    setPromoOpen]    = useState(false);
  const [vendorsOpen,  setVendorsOpen]  = useState(() =>
    typeof window !== "undefined" && (window.location.pathname.startsWith("/vendors") || window.location.pathname.startsWith("/branches"))
  );
  const avatarRef = useRef<HTMLDivElement>(null);

  // ── Auth guard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (pathname === "/login") { setAuthed(false); setChecking(false); return; }
    setChecking(true);
    fetch(`${API_BASE}/api/admin/auth/me`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.success) setAuthed(true); else router.replace("/login"); })
      .catch(() => router.replace("/login"))
      .finally(() => setChecking(false));
  }, [pathname]);

  // Poll unread notification count every 30s
  useEffect(() => {
    if (!authed) return;
    function fetchCount() {
      fetch(`${API_BASE}/api/admin/notifications/unread-count`, { credentials: "include" })
        .then(r => r.json())
        .then(d => { if (typeof d.count === "number") setUnreadCount(d.count); })
        .catch(() => {});
    }
    fetchCount();
    const t = setInterval(fetchCount, 30_000);
    return () => clearInterval(t);
  }, [authed]);

  async function handleLogout() {
    await fetch(`${API_BASE}/api/admin/auth/logout`, { method: "POST", credentials: "include" });
    router.replace("/login");
  }

  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) { setMobileOpen(false); setMoreOpen(false); }
    }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node))
        setAvatarOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => { setMobileOpen(false); setMoreOpen(false); }, [pathname]);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const isPromoActive   = pathname.startsWith("/promotions");
  const isVendorsActive = pathname.startsWith("/vendors") || pathname.startsWith("/branches");

  const desktopW = collapsed ? 64 : 256;

  // ── Sidebar content ──────────────────────────────────────────────────────────
  function SidebarContent({ mobile = false }: { mobile?: boolean }) {
    const show = mobile ? true : !collapsed;
    return (
      <>
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-4 py-4 border-b border-white/10 shrink-0"
          style={{ minHeight: collapsed && !mobile ? 60 : "auto" }}
        >
          <Image src="/logo/logo-icon.svg" alt="Event Ease" width={24} height={24} className="rounded-lg shrink-0" />
          {show && (
            <div className="min-w-0 flex-1">
              <span className="text-sm font-semibold block truncate" style={{ color: "var(--sidebar-fg)" }}>
                Event Ease
              </span>
              <span className="text-xs block" style={{ color: "rgba(255,255,255,0.4)" }}>
                Admin Panel
              </span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav
          className="flex-1 px-2 py-3 flex flex-col gap-0.5"
          style={{ overflowY: "auto", scrollbarWidth: "none" }}
        >
          {/* Dashboard */}
          {nav.slice(0, 1).map(item => (
            <Link
              key={item.href}
              href={item.href}
              title={!show ? item.label : undefined}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors"
              style={{
                color:      isActive(item.href) ? "#fff" : "var(--sidebar-fg)",
                background: isActive(item.href) ? "var(--sidebar-active)" : "transparent",
                opacity:    isActive(item.href) ? 1 : 0.7,
                justifyContent: !show ? "center" : undefined,
              }}
            >
              <span className="shrink-0">{item.icon}</span>
              {show && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          ))}

          {/* ── Vendors accordion ── */}
          <button
            onClick={() => setVendorsOpen(v => !v)}
            title={!show ? "Vendors" : undefined}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors w-full cursor-pointer"
            style={{
              color:      isVendorsActive ? "#fff" : "var(--sidebar-fg)",
              background: isVendorsActive && !vendorsOpen ? "var(--sidebar-active)" : vendorsOpen ? "rgba(255,255,255,0.08)" : "transparent",
              opacity:    isVendorsActive || vendorsOpen ? 1 : 0.7,
              justifyContent: !show ? "center" : undefined,
            }}
          >
            <span className="shrink-0"><BuildingIcon /></span>
            {show && (
              <>
                <span className="whitespace-nowrap flex-1 text-left">Vendors</span>
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                  style={{ transition: "transform .2s", transform: vendorsOpen ? "rotate(180deg)" : "rotate(0deg)", opacity: 0.6 }}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </>
            )}
          </button>

          {vendorsOpen && show && (
            <div className="ml-3 flex flex-col gap-0.5 border-l pl-3" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
              {vendorsNav.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors"
                  style={{
                    color:      isActive(item.href) ? "#fff" : "var(--sidebar-fg)",
                    background: isActive(item.href) ? "var(--sidebar-active)" : "transparent",
                    opacity:    isActive(item.href) ? 1 : 0.65,
                  }}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className="whitespace-nowrap">{item.label}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Remaining nav items */}
          {nav.slice(1).map(item => (
            <Link
              key={item.href}
              href={item.href}
              title={!show ? item.label : undefined}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors"
              style={{
                color:      isActive(item.href) ? "#fff" : "var(--sidebar-fg)",
                background: isActive(item.href) ? "var(--sidebar-active)" : "transparent",
                opacity:    isActive(item.href) ? 1 : 0.7,
                justifyContent: !show ? "center" : undefined,
              }}
            >
              <span className="shrink-0">{item.icon}</span>
              {show && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          ))}

          {/* ── Promotions accordion ── */}
          <button
            onClick={() => setPromoOpen(v => !v)}
            title={!show ? "Promotions" : undefined}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors w-full cursor-pointer"
            style={{
              color:      isPromoActive ? "#fff" : "var(--sidebar-fg)",
              background: isPromoActive && !promoOpen ? "var(--sidebar-active)" : promoOpen ? "rgba(255,255,255,0.08)" : "transparent",
              opacity:    isPromoActive || promoOpen ? 1 : 0.7,
              justifyContent: !show ? "center" : undefined,
            }}
          >
            <span className="shrink-0"><MegaphoneIcon /></span>
            {show && (
              <>
                <span className="whitespace-nowrap flex-1 text-left">Promotions</span>
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                  style={{ transition: "transform .2s", transform: promoOpen ? "rotate(180deg)" : "rotate(0deg)", opacity: 0.6 }}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </>
            )}
          </button>

          {/* Sub-items */}
          {promoOpen && show && (
            <div className="ml-3 flex flex-col gap-0.5 border-l pl-3" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
              {promotionsNav.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors"
                  style={{
                    color:      isActive(item.href) ? "#fff" : "var(--sidebar-fg)",
                    background: isActive(item.href) ? "var(--sidebar-active)" : "transparent",
                    opacity:    isActive(item.href) ? 1 : 0.65,
                  }}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className="whitespace-nowrap">{item.label}</span>
                </Link>
              ))}
            </div>
          )}
        </nav>

        {/* Logout */}
        <div className="px-2 pb-4 border-t border-white/10 pt-3 shrink-0">
          <button
            onClick={handleLogout}
            title={!show ? "Logout" : undefined}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full cursor-pointer hover:bg-white/10 transition-colors"
            style={{ color: "var(--sidebar-fg)", opacity: 0.6, justifyContent: !show ? "center" : undefined }}
          >
            <span className="shrink-0"><LogoutIcon /></span>
            {show && <span className="whitespace-nowrap">Logout</span>}
          </button>
        </div>
      </>
    );
  }

  // Login page — no shell needed
  if (pathname === "/login") return <>{children}</>;

  // Show full-screen loader while verifying session
  if (checking) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F4F4F5" }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#FF3B6B", borderTopColor: "transparent" }} />
        <p className="text-sm font-medium" style={{ color: "#9CA3AF" }}>Verifying session…</p>
      </div>
    </div>
  );

  // Not authed — redirect is already fired in useEffect, render nothing
  if (!authed) return null;

  return (
    <div className="flex min-h-screen" style={{ background: "#F4F4F5" }}>

      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col fixed top-0 left-0 h-screen z-20 transition-all duration-200 overflow-hidden"
        style={{ background: "var(--sidebar-bg)", width: desktopW }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobile && mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/50" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile Drawer */}
      <aside
        className="lg:hidden flex flex-col fixed top-0 left-0 h-screen z-40 transition-transform duration-200 overflow-hidden"
        style={{
          background: "var(--sidebar-bg)",
          width: 256,
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        <SidebarContent mobile />
      </aside>

      {/* More Modal Overlay */}
      {moreOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMoreOpen(false)} />
      )}

      {/* More Bottom Modal */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden transition-transform duration-300 rounded-t-3xl overflow-hidden"
        style={{
          background: "#fff",
          transform: moreOpen ? "translateY(0)" : "translateY(100%)",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.10)",
        }}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: "#E5E7EB" }} />
        </div>
        <p className="text-sm font-semibold px-5 pb-3" style={{ color: "var(--fg-muted)" }}>More</p>
        <div className="grid grid-cols-4 gap-1 px-3 pb-8">
          {bottomNavMore.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl transition-colors"
              style={{
                background: isActive(item.href) ? "var(--primary-light)" : "transparent",
                color:      isActive(item.href) ? "var(--primary)" : "var(--fg-muted)",
              }}
            >
              {item.icon}
              <span className="text-xs text-center leading-tight">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Main */}
      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-200 pb-16 lg:pb-0"
        style={{ marginLeft: isMobile ? 0 : desktopW }}
      >
        {/* Top Bar */}
        <header
          className="sticky top-0 z-10 flex items-center justify-between px-4 lg:px-6 border-b"
          style={{ background: "#fff", height: 60, borderColor: "#E5E7EB" }}
        >
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer transition-colors hover:bg-gray-100"
            style={{ color: "var(--fg-muted)" }}
          >
            <HamburgerIcon />
          </button>
          {/* Desktop collapse */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-9 h-9 items-center justify-center rounded-xl cursor-pointer transition-colors hover:bg-gray-100"
            style={{ color: "var(--fg-muted)" }}
          >
            <HamburgerIcon />
          </button>

          {/* Avatar + Bell */}
          <div className="flex items-center gap-2">
            {/* Bell */}
            <Link href="/notifications"
              onClick={() => setUnreadCount(0)}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors hover:bg-gray-100"
              style={{ color: "var(--fg-muted)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1"
                  style={{ background: "#FF3B6B" }}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>

            {/* Avatar */}
            <div className="relative" ref={avatarRef}>
            <button
              onClick={() => setAvatarOpen(!avatarOpen)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer transition-opacity hover:opacity-80"
              style={{ background: "var(--primary-light)", color: "var(--primary)", border: "1.5px solid var(--primary-muted)" }}
            >
              A
            </button>

            {avatarOpen && (
              <div
                className="absolute right-0 top-11 w-48 rounded-2xl shadow-lg border overflow-hidden z-50"
                style={{ background: "#fff", borderColor: "#E5E7EB" }}
              >
                <div className="px-4 py-3 border-b" style={{ borderColor: "#F4F4F5" }}>
                  <p className="text-sm font-semibold text-black">Admin</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>admin@eventease.pk</p>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl w-full text-left hover:bg-red-50 transition-colors cursor-pointer"
                    style={{ color: "var(--danger)" }}
                  >
                    <LogoutIcon /> Logout
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center"
        style={{ background: "var(--sidebar-bg)", height: 64 }}
      >
        {bottomNavMain.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors"
            style={{ color: isActive(item.href) ? "var(--primary)" : "rgba(255,255,255,0.45)" }}
          >
            {item.icon}
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
        <button
          onClick={() => setMoreOpen(!moreOpen)}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2 cursor-pointer transition-colors"
          style={{ color: moreOpen ? "var(--primary)" : "rgba(255,255,255,0.45)" }}
        >
          <MoreIcon />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>

    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function GridIcon()     { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>; }
function BuildingIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/></svg>; }
function BookIcon()     { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>; }
function PaymentIcon()  { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>; }
function StarIcon()     { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>; }
function ChartIcon()    { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>; }
function SettingsIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>; }
function FeaturedIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>; }
function UsersIcon()    { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>; }
function InboxIcon()    { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>; }
function BellIcon()     { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>; }
function HamburgerIcon(){ return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>; }
function LogoutIcon()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }
function MoreIcon()     { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>; }
function MegaphoneIcon(){ return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>; }
function BranchIcon()   { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 01-9 9"/></svg>; }
