"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5510";

function adminFetch(path: string) {
  return fetch(`${API_BASE}/api${path}`, { credentials: "include" });
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Stats = {
  vendors:      { total: number; verified: number; unverified: number; blocked: number };
  bookings:     { total: number; confirmed: number; pending: number; cancelled: number };
  reviews:      number;
  totalRevenue: number;
};

type RecentBooking = {
  id: string; customerName: string; event: string; hall: string;
  date: string; amount: number; paid: number;
  status: "pending" | "confirmed" | "cancelled" | "blocked";
  vendorName: string | null; createdAt: string;
};

type RecentVendor = {
  id: string; name: string; email: string; city: string;
  isVerified: boolean; isBlocked: boolean; createdAt: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtMoney(n: number) {
  if (n >= 1_000_000) return "Rs " + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return "Rs " + (n / 1_000).toFixed(0)     + "K";
  return "Rs " + n;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  confirmed: { bg: "#D1FAE5", text: "#065F46" },
  pending:   { bg: "#FEF3C7", text: "#92400E" },
  cancelled: { bg: "#FEE2E2", text: "#991B1B" },
  blocked:   { bg: "#F3F4F6", text: "#374151" },
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, iconBg, icon,
}: {
  label: string; value: string | number; sub?: string;
  iconBg: string; icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border p-5 flex flex-col gap-4" style={{ background: "#fff", borderColor: "#E5E7EB" }}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium" style={{ color: "#6B7280" }}>{label}</p>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-black">{value}</p>
        {sub && <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── Mini bar ─────────────────────────────────────────────────────────────────
function MiniBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-20 shrink-0" style={{ color: "#6B7280" }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full" style={{ background: "#F3F4F6" }}>
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold w-6 text-right" style={{ color: "#374151" }}>{value}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [stats,          setStats]          = useState<Stats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [recentVendors,  setRecentVendors]  = useState<RecentVendor[]>([]);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    adminFetch("/admin/dashboard/stats")
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setStats(d.stats);
          setRecentBookings(d.recentBookings);
          setRecentVendors(d.recentVendors);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 min-h-screen" style={{ background: "#F9FAFB" }}>
        <div className="mb-6">
          <div className="h-7 w-48 rounded-lg animate-pulse" style={{ background: "#E5E7EB" }} />
          <div className="h-4 w-64 rounded-lg animate-pulse mt-2" style={{ background: "#F3F4F6" }} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border p-5 h-32 animate-pulse" style={{ background: "#fff", borderColor: "#E5E7EB" }} />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center" style={{ background: "#F9FAFB" }}>
        <p className="text-sm" style={{ color: "#EF4444" }}>Failed to load dashboard.</p>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen" style={{ background: "#F9FAFB" }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">Dashboard</h1>
        <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Vendors" value={stats.vendors.total}
          sub={`${stats.vendors.verified} verified · ${stats.vendors.blocked} blocked`}
          iconBg="#FFF0F4"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF3B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/></svg>}
        />
        <StatCard
          label="Total Bookings" value={stats.bookings.total}
          sub={`${stats.bookings.confirmed} confirmed · ${stats.bookings.pending} pending`}
          iconBg="#EFF6FF"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>}
        />
        <StatCard
          label="Total Revenue" value={fmtMoney(stats.totalRevenue)}
          sub="Sum of all paid amounts"
          iconBg="#F0FDF4"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
        />
        <StatCard
          label="Total Reviews" value={stats.reviews}
          sub="Across all vendors"
          iconBg="#FFFBEB"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
        />
      </div>

      {/* ── Breakdown Row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Vendor breakdown */}
        <div className="rounded-2xl border p-5" style={{ background: "#fff", borderColor: "#E5E7EB" }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-black">Vendor Status</p>
            <Link href="/vendors" className="text-xs font-medium hover:underline" style={{ color: "#FF3B6B" }}>View all →</Link>
          </div>
          <div className="space-y-3">
            <MiniBar label="Verified"   value={stats.vendors.verified}   total={stats.vendors.total} color="#22C55E" />
            <MiniBar label="Unverified" value={stats.vendors.unverified} total={stats.vendors.total} color="#F59E0B" />
            <MiniBar label="Blocked"    value={stats.vendors.blocked}    total={stats.vendors.total} color="#EF4444" />
          </div>
        </div>

        {/* Booking breakdown */}
        <div className="rounded-2xl border p-5" style={{ background: "#fff", borderColor: "#E5E7EB" }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-black">Booking Status</p>
            <Link href="/bookings" className="text-xs font-medium hover:underline" style={{ color: "#FF3B6B" }}>View all →</Link>
          </div>
          <div className="space-y-3">
            <MiniBar label="Confirmed" value={stats.bookings.confirmed} total={stats.bookings.total} color="#22C55E" />
            <MiniBar label="Pending"   value={stats.bookings.pending}   total={stats.bookings.total} color="#F59E0B" />
            <MiniBar label="Cancelled" value={stats.bookings.cancelled} total={stats.bookings.total} color="#EF4444" />
          </div>
        </div>
      </div>

      {/* ── Recent Activity ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Bookings */}
        <div className="rounded-2xl border overflow-hidden" style={{ background: "#fff", borderColor: "#E5E7EB" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E5E7EB" }}>
            <p className="text-sm font-bold text-black">Recent Bookings</p>
            <Link href="/bookings" className="text-xs font-medium hover:underline" style={{ color: "#FF3B6B" }}>View all →</Link>
          </div>
          {recentBookings.length === 0 ? (
            <p className="py-10 text-center text-sm" style={{ color: "#9CA3AF" }}>No bookings yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentBookings.map(b => {
                const sc = STATUS_COLORS[b.status] ?? STATUS_COLORS.pending;
                return (
                  <div key={b.id} className="flex items-center gap-3 px-5 py-3">
                    {/* Left */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-black truncate">{b.customerName}</p>
                      <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>{b.vendorName ?? "—"} · {b.hall}</p>
                    </div>
                    {/* Date */}
                    <p className="text-xs shrink-0 hidden sm:block" style={{ color: "#9CA3AF" }}>{b.date}</p>
                    {/* Status */}
                    <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: sc.bg, color: sc.text }}>
                      {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                    </span>
                    {/* Amount */}
                    <p className="text-sm font-bold shrink-0 text-black">{fmtMoney(b.amount)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Vendors */}
        <div className="rounded-2xl border overflow-hidden" style={{ background: "#fff", borderColor: "#E5E7EB" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E5E7EB" }}>
            <p className="text-sm font-bold text-black">Recent Vendors</p>
            <Link href="/vendors" className="text-xs font-medium hover:underline" style={{ color: "#FF3B6B" }}>View all →</Link>
          </div>
          {recentVendors.length === 0 ? (
            <p className="py-10 text-center text-sm" style={{ color: "#9CA3AF" }}>No vendors yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentVendors.map(v => (
                <div key={v.id} className="flex items-center gap-3 px-5 py-3">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
                    style={{ background: "#FFF0F4", color: "#FF3B6B" }}>
                    {v.name.charAt(0).toUpperCase()}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-black truncate">{v.name}</p>
                    <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>{v.city} · {fmt(v.createdAt)}</p>
                  </div>
                  {/* Badges */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {v.isBlocked ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#991B1B" }}>Blocked</span>
                    ) : v.isVerified ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#D1FAE5", color: "#065F46" }}>Verified</span>
                    ) : (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FEF3C7", color: "#92400E" }}>Pending</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
