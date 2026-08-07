"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
type DbBooking = {
  id: string;
  customerName: string;
  phone: string;
  event: string;
  hall: string;
  date: string;        // YYYY-MM-DD
  timeFrom: string;    // HH:MM
  timeTo: string;
  guests: number;
  amount: number;
  paid: number;
  status: "confirmed" | "pending" | "cancelled" | "blocked";
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["S","M","T","W","T","F","S"];

function toKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function fmt12h(t: string) {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${period}`;
}
function fmtDateShort(d: string) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
function fmtDateLong(d: Date) {
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function fmtRs(n: number) { return "Rs. " + n.toLocaleString("en-PK"); }

// ─── Mini Calendar ────────────────────────────────────────────────────────────
type BookingMap = Record<string, { status: string }[]>;

function MiniCalendar({ bookingMap }: { bookingMap: BookingMap }) {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  function prev() { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); }
  function next() { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); }

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev  = new Date(year, month, 0).getDate();
  const totalCells  = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const todayKey    = toKey(today.getFullYear(), today.getMonth(), today.getDate());

  const cells: { day: number; current: boolean; key: string }[] = [];
  for (let i = 0; i < totalCells; i++) {
    if (i < firstDay) {
      const d = daysInPrev - firstDay + 1 + i;
      cells.push({ day: d, current: false, key: toKey(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1, d) });
    } else if (i < firstDay + daysInMonth) {
      cells.push({ day: i - firstDay + 1, current: true, key: toKey(year, month, i - firstDay + 1) });
    } else {
      const d = i - firstDay - daysInMonth + 1;
      cells.push({ day: d, current: false, key: toKey(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1, d) });
    }
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-black">Overview</h2>
        <Link href="/vendor/dashboard/calendar" className="text-xs font-medium hover:underline" style={{ color: "var(--primary)" }}>
          Full view
        </Link>
      </div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer hover:bg-gray-100 transition-colors" style={{ color: "var(--fg-muted)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span className="text-sm font-semibold text-black">{MONTHS[month].slice(0, 3)} {year}</span>
        <button onClick={next} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer hover:bg-gray-100 transition-colors" style={{ color: "var(--fg-muted)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold py-1" style={{ color: "var(--fg-muted)" }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((cell, i) => {
          const isPast       = cell.current && cell.key < todayKey;
          const bks          = cell.current && !isPast ? (bookingMap[cell.key] || []) : [];
          const isToday      = cell.key === todayKey && cell.current;
          const hasConfirmed = bks.some(b => b.status === "confirmed");
          const hasPending   = bks.some(b => b.status === "pending");
          const hasBlocked   = bks.some(b => b.status === "blocked");
          const hasAny       = bks.length > 0;
          const isAvailable  = cell.current && !isPast && !hasAny && !isToday;

          let bg = "transparent";
          let textColor = cell.current ? (isPast ? "#C4C4C4" : "#111") : "#D1D5DB";
          if (isToday)           { bg = "var(--primary)"; textColor = "#fff"; }
          else if (!isPast && hasBlocked)   { bg = "#FEE2E2"; textColor = "#DC2626"; }
          else if (!isPast && hasConfirmed) { bg = "var(--primary-light)"; textColor = "var(--primary)"; }
          else if (!isPast && hasPending)   { bg = "#FFFBEB"; textColor = "#D97706"; }
          else if (isAvailable)             { bg = "#F0FDF4"; textColor = "#16A34A"; }

          return (
            <div key={i} className="flex flex-col items-center py-0.5">
              <div className="w-7 h-7 flex items-center justify-center rounded-full text-[12px] font-medium"
                style={{ background: bg, color: textColor, fontWeight: isToday || hasAny ? 600 : 400, opacity: isPast ? 0.45 : 1 }}>
                {cell.day}
              </div>
              {hasAny && !isToday ? (
                <div className="flex gap-0.5 mt-0.5">
                  {hasConfirmed && <span className="w-1 h-1 rounded-full" style={{ background: "var(--primary)" }} />}
                  {hasPending   && <span className="w-1 h-1 rounded-full" style={{ background: "#D97706" }} />}
                  {hasBlocked   && <span className="w-1 h-1 rounded-full" style={{ background: "#DC2626" }} />}
                </div>
              ) : (
                <div className="h-1.5" />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-4 pt-3 border-t" style={{ borderColor: "#F4F4F5" }}>
        {[
          { color: "var(--primary)", label: "Confirmed" },
          { color: "#D97706",        label: "Pending" },
          { color: "#16A34A",        label: "Available" },
          { color: "#DC2626",        label: "Blocked" },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
            <span style={{ color: "var(--fg-muted)", fontSize: 10 }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Skeleton helpers ─────────────────────────────────────────────────────────
function StatSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
      <div className="w-10 h-10 rounded-xl mb-3" style={{ background: "#E5E7EB" }} />
      <div className="h-8 w-12 rounded mb-1" style={{ background: "#E5E7EB" }} />
      <div className="h-3 w-24 rounded" style={{ background: "#E5E7EB" }} />
    </div>
  );
}
function BookingCardSkeleton() {
  return (
    <div className="rounded-2xl p-4 animate-pulse" style={{ border: "1.5px solid #F4F4F5" }}>
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="w-9 h-9 rounded-full shrink-0" style={{ background: "#E5E7EB" }} />
        <div className="flex-1">
          <div className="h-3.5 w-28 rounded mb-1" style={{ background: "#E5E7EB" }} />
          <div className="h-3 w-20 rounded" style={{ background: "#E5E7EB" }} />
        </div>
      </div>
      <div className="h-2 rounded-full w-full" style={{ background: "#E5E7EB" }} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { accessToken } = useAuthStore();
  const [bookings, setBookings] = useState<DbBooking[]>([]);
  const [loading,  setLoading]  = useState(true);

  const todayKey = toKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  useEffect(() => { document.title = "Dashboard — Event Ease"; }, []);

  useEffect(() => {
    if (!accessToken) return;
    api.get<{ bookings: DbBooking[] }>("/api/vendor/bookings", accessToken)
      .then(res => { if (res.success) setBookings(res.bookings ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken]);

  // Derive data
  const active = bookings.filter(b => b.status !== "cancelled" && b.status !== "blocked");

  const todayBookings    = active.filter(b => b.date === todayKey);
  const upcomingBookings = active
    .filter(b => b.date >= todayKey)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);
  const pendingPayments  = active.filter(b => b.amount > 0 && b.paid < b.amount).length;
  const upcomingCount    = active.filter(b => b.date > todayKey).length;

  // bookingMap for mini calendar
  const bookingMap: BookingMap = {};
  for (const b of bookings) {
    if (b.status === "cancelled") continue;
    if (!bookingMap[b.date]) bookingMap[b.date] = [];
    bookingMap[b.date].push({ status: b.status });
  }

  const stats = [
    { label: "Today's Events",   value: loading ? "—" : String(todayBookings.length),  color: "var(--primary)", light: "var(--primary-light)", icon: <TodayIcon /> },
    { label: "Pending Payments", value: loading ? "—" : String(pendingPayments),         color: "#D97706",        light: "#FFFBEB",              icon: <PaymentIcon /> },
    { label: "Upcoming Events",  value: loading ? "—" : String(upcomingCount),           color: "#16A34A",        light: "#F0FDF4",              icon: <UpcomingIcon /> },
    { label: "Total Bookings",   value: loading ? "—" : String(active.length),           color: "#2563EB",        light: "#EFF6FF",              icon: <BookIcon /> },
  ];


  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-xl lg:text-2xl font-semibold text-black tracking-tight">Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "var(--fg-muted)" }}>{fmtDateLong(new Date())}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6 lg:mb-8">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          : stats.map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: s.light, color: s.color }}>
                {s.icon}
              </div>
              <p className="text-3xl font-semibold text-black">{s.value}</p>
              <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>{s.label}</p>
            </div>
          ))
        }
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">

        {/* Left col */}
        <div className="lg:col-span-2 flex flex-col gap-4 lg:gap-6">

          {/* Today's Events */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-black mb-4">Today&apos;s Events</h2>
            {loading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-3 border-b border-[#F4F4F5] animate-pulse">
                    <div className="w-8 h-8 rounded-xl shrink-0" style={{ background: "#E5E7EB" }} />
                    <div className="flex-1">
                      <div className="h-3.5 w-36 rounded mb-1" style={{ background: "#E5E7EB" }} />
                      <div className="h-3 w-24 rounded" style={{ background: "#E5E7EB" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : todayBookings.length === 0 ? (
              <p className="text-sm text-center py-6 rounded-xl" style={{ color: "var(--fg-muted)", background: "var(--bg-subtle)" }}>
                No events today
              </p>
            ) : (
              <div className="flex flex-col gap-0">
                {todayBookings.map((b, i) => (
                  <div key={b.id} className={`flex items-center justify-between py-3 ${i !== todayBookings.length - 1 ? "border-b border-[#F4F4F5]" : ""}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: "var(--primary)" }}>
                        {b.hall.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-black">{b.event} — {b.customerName}</p>
                        <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{b.hall}{b.guests > 0 ? ` · ${b.guests} guests` : ""}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium shrink-0" style={{ color: "var(--fg-muted)" }}>{fmt12h(b.timeFrom)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Bookings */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="text-base font-semibold text-black">Upcoming Bookings</h2>
              <Link href="/vendor/dashboard/bookings" className="text-xs font-medium hover:underline" style={{ color: "var(--primary)" }}>
                View all
              </Link>
            </div>
            <div className="flex flex-col gap-2 px-4 pb-4">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <BookingCardSkeleton key={i} />)
              ) : upcomingBookings.length === 0 ? (
                <p className="text-sm text-center py-6 rounded-xl" style={{ color: "var(--fg-muted)", background: "var(--bg-subtle)" }}>
                  No upcoming bookings
                </p>
              ) : (
                upcomingBookings.map(b => {
                  const paidPct  = b.amount > 0 ? Math.min(100, Math.round((b.paid / b.amount) * 100)) : 0;
                  const balance  = b.amount - b.paid;
                  const stColor  = b.status === "confirmed" ? "var(--primary)" : "#D97706";
                  const stBg     = b.status === "confirmed" ? "var(--primary-light)" : "#FFFBEB";
                  return (
                    <div key={b.id} className="rounded-2xl p-4" style={{ border: "1.5px solid #F4F4F5" }}>
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 text-white" style={{ background: "var(--primary)" }}>
                            {b.customerName[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-black truncate">{b.customerName}</p>
                            <p className="text-xs truncate" style={{ color: "var(--fg-muted)" }}>{b.phone || "—"}</p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 capitalize" style={{ background: stBg, color: stColor }}>
                          {b.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>{b.hall}</span>
                        <span className="text-xs font-medium text-black">{b.event}</span>
                      </div>
                      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mb-2.5">
                        <div className="flex items-center gap-1">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fg-subtle)" }}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{fmtDateShort(b.date)}</span>
                        </div>
                        {b.timeFrom && (
                          <div className="flex items-center gap-1">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fg-subtle)" }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{fmt12h(b.timeFrom)}</span>
                          </div>
                        )}
                        {b.guests > 0 && (
                          <div className="flex items-center gap-1">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fg-subtle)" }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{b.guests}</span>
                          </div>
                        )}
                      </div>
                      {b.amount > 0 && (
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px]" style={{ color: "var(--fg-subtle)" }}>Payment</span>
                              <span className="text-[10px] font-medium" style={{ color: paidPct === 100 ? "#16A34A" : "#D97706" }}>{paidPct}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full" style={{ background: "#E5E7EB" }}>
                              <div className="h-1.5 rounded-full" style={{ width: `${paidPct}%`, background: paidPct === 100 ? "#16A34A" : "var(--primary)" }} />
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-black">{fmtRs(b.amount)}</p>
                            {balance > 0
                              ? <p className="text-[10px]" style={{ color: "#D97706" }}>Due: {fmtRs(balance)}</p>
                              : <p className="text-[10px]" style={{ color: "#16A34A" }}>Fully Paid</p>
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Right col */}
        <div className="flex flex-col gap-4 lg:gap-6">
          <MiniCalendar bookingMap={bookingMap} />
        </div>

      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function TodayIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none" /></svg>;
}
function PaymentIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>;
}
function UpcomingIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
}
function BookIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>;
}
