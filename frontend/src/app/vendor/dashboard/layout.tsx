"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

const nav = [
  { label: "Dashboard", href: "/vendor/dashboard", icon: <GridIcon /> },
  { label: "Calendar", href: "/vendor/dashboard/calendar", icon: <CalendarIcon /> },
  { label: "Bookings", href: "/vendor/dashboard/bookings", icon: <BookIcon /> },
  { label: "Inquiries", href: "/vendor/dashboard/inquiries", icon: <InboxIcon /> },
  { label: "Customers", href: "/vendor/dashboard/customers", icon: <UsersIcon /> },
  { label: "Payments", href: "/vendor/dashboard/payments", icon: <PaymentIcon /> },
  { label: "Quotations", href: "/vendor/dashboard/quotations", icon: <FileIcon /> },
  { label: "Packages", href: "/vendor/dashboard/packages", icon: <PackageIcon /> },
  { label: "Manage Profile", href: "/vendor/dashboard/profile", icon: <BuildingIcon /> },
  { label: "Staff", href: "/vendor/dashboard/staff", icon: <StaffIcon /> },
  { label: "Reports", href: "/vendor/dashboard/reports", icon: <ChartIcon /> },
];

// Shown directly in bottom bar
const bottomNavMain = [
  { label: "Dashboard", href: "/vendor/dashboard", icon: <GridIcon /> },
  { label: "Bookings", href: "/vendor/dashboard/bookings", icon: <BookIcon /> },
  { label: "Calendar", href: "/vendor/dashboard/calendar", icon: <CalendarIcon /> },
];

// Shown in "More" modal
const bottomNavMore = [
  { label: "Inquiries", href: "/vendor/dashboard/inquiries", icon: <InboxIcon /> },
  { label: "Customers", href: "/vendor/dashboard/customers", icon: <UsersIcon /> },
  { label: "Payments", href: "/vendor/dashboard/payments", icon: <PaymentIcon /> },
  { label: "Quotations", href: "/vendor/dashboard/quotations", icon: <FileIcon /> },
  { label: "Packages", href: "/vendor/dashboard/packages", icon: <PackageIcon /> },
  { label: "Manage Profile", href: "/vendor/dashboard/profile", icon: <BuildingIcon /> },
  { label: "Staff", href: "/vendor/dashboard/staff", icon: <StaffIcon /> },
  { label: "Reports", href: "/vendor/dashboard/reports", icon: <ChartIcon /> },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [collapsed,   setCollapsed]   = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [moreOpen,    setMoreOpen]    = useState(false);
  const [isMobile,    setIsMobile]    = useState(false);
  const [avatarOpen,  setAvatarOpen]  = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const { vendor, clearAuth, isLoading } = useAuthStore();

  async function handleLogout() {
    await api.post("/api/vendor/auth/logout", {});
    clearAuth();
    router.push("/vendor/login");
  }

  const businessName = vendor?.name      ?? "Business";
  const ownerName    = vendor?.ownerName ?? businessName;
  const vendorEmail  = vendor?.email     ?? "";
  const vendorSlug   = vendor?.slug      ?? "";
  const initials     = ownerName.charAt(0).toUpperCase();

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) { setMobileOpen(false); setMoreOpen(false); }
    }
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  function isActive(href: string) {
    if (href === "/vendor/dashboard") return pathname === href;
    return pathname.startsWith(href);
  }

  const desktopW = collapsed ? 64 : 256;

  function SidebarContent({ mobile = false }: { mobile?: boolean }) {
    const show = mobile ? true : !collapsed;
    return (
      <>
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10 shrink-0" style={{ minHeight: collapsed && !mobile ? 60 : "auto" }}>
          <Image src="/logo/logo-icon.svg" alt="Event Ease" width={24} height={24} className="rounded-lg shrink-0" />
          {show && (
            <div className="min-w-0 flex-1">
              {isLoading ? (
                <>
                  <div className="h-4 w-28 rounded-md animate-pulse" style={{ background: "rgba(255,255,255,0.15)" }} />
                  <div className="h-3 w-16 rounded-md mt-1 animate-pulse" style={{ background: "rgba(255,255,255,0.10)" }} />
                </>
              ) : (
                <>
                  <span className="text-sm font-semibold truncate block" style={{ color: "var(--sidebar-fg)" }}>
                    {businessName}
                  </span>
                  <span className="text-xs truncate block" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {ownerName}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
        <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5" style={{ overflowY: "auto", scrollbarWidth: "none" }}>
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={!show ? item.label : undefined}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors"
              style={{
                color: isActive(item.href) ? "#ffffff" : "var(--sidebar-fg)",
                background: isActive(item.href) ? "var(--sidebar-active)" : "transparent",
                opacity: isActive(item.href) ? 1 : 0.7,
                justifyContent: !show ? "center" : undefined,
              }}
            >
              <span className="shrink-0">{item.icon}</span>
              {show && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          ))}
        </nav>
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
        style={{ background: "var(--sidebar-bg)", width: 256, transform: mobileOpen ? "translateX(0)" : "translateX(-100%)" }}
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
          background: "#ffffff",
          transform: moreOpen ? "translateY(0)" : "translateY(100%)",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.10)",
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: "#E5E7EB" }} />
        </div>
        <p className="text-sm font-semibold px-5 pb-3" style={{ color: "var(--fg-muted)" }}>More</p>
        <div className="grid grid-cols-4 gap-1 px-3 pb-8">
          {bottomNavMore.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl transition-colors"
              style={{
                background: isActive(item.href) ? "var(--primary-light)" : "transparent",
                color: isActive(item.href) ? "var(--primary)" : "var(--fg-muted)",
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
          style={{ background: "#ffffff", height: 60, borderColor: "#E5E7EB" }}
        >
          {/* Mobile hamburger — always opens drawer */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer transition-colors hover:bg-gray-100"
            style={{ color: "var(--fg-muted)" }}
          >
            <HamburgerIcon />
          </button>
          {/* Desktop hamburger — collapses sidebar to icons */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-9 h-9 items-center justify-center rounded-xl cursor-pointer transition-colors hover:bg-gray-100"
            style={{ color: "var(--fg-muted)" }}
          >
            <HamburgerIcon />
          </button>

          <div className="relative" ref={avatarRef}>
            {isLoading ? (
              <div className="w-9 h-9 rounded-full animate-pulse" style={{ background: "#E5E7EB" }} />
            ) : (
            <button
              onClick={() => setAvatarOpen(!avatarOpen)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold cursor-pointer transition-opacity hover:opacity-80"
              style={{ background: "var(--primary-light)", color: "var(--primary)", border: "1.5px solid var(--primary-muted)" }}
            >
              {initials}
            </button>
            )}

            {avatarOpen && (
              <div
                className="absolute right-0 top-11 w-52 rounded-2xl shadow-lg border overflow-hidden z-50"
                style={{ background: "#ffffff", borderColor: "#E5E7EB" }}
              >
                <div className="px-4 py-3 border-b" style={{ borderColor: "#F4F4F5" }}>
                  {isLoading ? (
                    <>
                      <div className="h-3.5 w-32 rounded bg-gray-200 animate-pulse mb-1.5" />
                      <div className="h-3 w-40 rounded bg-gray-100 animate-pulse" />
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-black truncate">{businessName}</p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: "var(--fg-muted)" }}>{vendorEmail}</p>
                    </>
                  )}
                </div>
                <div className="p-1.5">
                  <Link href="/vendor/dashboard/profile" onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl hover:bg-gray-50 transition-colors"
                    style={{ color: "var(--fg)" }}>
                    <ProfileIcon /> Business Profile
                  </Link>
                  {vendorSlug && (
                    <a href={`/profile/${vendorSlug}`} target="_blank" rel="noopener noreferrer"
                      onClick={() => setAvatarOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl hover:bg-gray-50 transition-colors"
                      style={{ color: "var(--fg)" }}>
                      <ExternalLinkIcon /> View Profile
                    </a>
                  )}
                  <Link href="/vendor/dashboard/settings" onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl hover:bg-gray-50 transition-colors"
                    style={{ color: "var(--fg)" }}>
                    <SettingsIcon /> Settings
                  </Link>
                  <div className="border-t my-1.5 mx-1" style={{ borderColor: "#F4F4F5" }} />
                  <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl w-full text-left hover:bg-red-50 transition-colors cursor-pointer" style={{ color: "var(--danger)" }}>
                    <LogoutIcon /> Logout
                  </button>
                </div>
              </div>
            )}
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
        {bottomNavMain.map((item) => (
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

        {/* More button */}
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

function HamburgerIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>;
}
function MoreIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>;
}
function GridIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>;
}
function CalendarIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
}
function InboxIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>;
}
function BookIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>;
}
function UsersIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
}
function PaymentIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>;
}
function FileIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>;
}
function PackageIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>;
}
function BuildingIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="1" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" /></svg>;
}
function StaffIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>;
}
function ChartIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>;
}
function ExternalLinkIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>;
}
function ProfileIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
}
function SettingsIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
}
function LogoutIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
}
