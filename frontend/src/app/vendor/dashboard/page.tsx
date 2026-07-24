"use client";

import { useState } from "react";
import Link from "next/link";

const BOOKINGS: Record<string, { status: "confirmed" | "pending" | "blocked" }[]> = {
  "2026-07-02": [{ status: "confirmed" }],
  "2026-07-05": [{ status: "confirmed" }, { status: "confirmed" }],
  "2026-07-10": [{ status: "pending" }],
  "2026-07-14": [{ status: "confirmed" }],
  "2026-07-18": [{ status: "confirmed" }, { status: "confirmed" }],
  "2026-07-20": [{ status: "blocked" }],
  "2026-07-24": [{ status: "pending" }],
  "2026-07-28": [{ status: "confirmed" }],
  "2026-08-03": [{ status: "confirmed" }],
  "2026-08-08": [{ status: "pending" }],
  "2026-08-15": [{ status: "confirmed" }],
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["S","M","T","W","T","F","S"];

function toKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function MiniCalendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-black">Overview</h2>
        <Link href="/vendor/dashboard/calendar" className="text-xs font-medium hover:underline" style={{ color: "var(--primary)" }}>
          Full view
        </Link>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer hover:bg-gray-100 transition-colors" style={{ color: "var(--fg-muted)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span className="text-sm font-semibold text-black">{MONTHS[month].slice(0, 3)} {year}</span>
        <button onClick={next} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer hover:bg-gray-100 transition-colors" style={{ color: "var(--fg-muted)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold py-1" style={{ color: "var(--fg-muted)" }}>{d}</div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((cell, i) => {
          const bookings      = cell.current ? (BOOKINGS[cell.key] || []) : [];
          const isToday       = cell.key === todayKey && cell.current;
          const hasConfirmed  = bookings.some(b => b.status === "confirmed");
          const hasPending    = bookings.some(b => b.status === "pending");
          const hasBlocked    = bookings.some(b => b.status === "blocked");
          const hasAny        = bookings.length > 0;

          const isAvailable = cell.current && !hasAny && !isToday;

          let bg = "transparent";
          let textColor = cell.current ? "#111" : "#D1D5DB";
          if (isToday)           { bg = "var(--primary)"; textColor = "#fff"; }
          else if (hasBlocked)   { bg = "#FEE2E2"; textColor = "#DC2626"; }
          else if (hasConfirmed) { bg = "var(--primary-light)"; textColor = "var(--primary)"; }
          else if (hasPending)   { bg = "#FFFBEB"; textColor = "#D97706"; }
          else if (isAvailable)  { bg = "#F0FDF4"; textColor = "#16A34A"; }

          return (
            <div key={i} className="flex flex-col items-center py-0.5">
              <div
                className="w-7 h-7 flex items-center justify-center rounded-full text-[12px] font-medium"
                style={{ background: bg, color: textColor, fontWeight: isToday || hasAny ? 600 : 400 }}
              >
                {cell.day}
              </div>
              {/* dots */}
              {hasAny && !isToday && (
                <div className="flex gap-0.5 mt-0.5">
                  {hasConfirmed && <span className="w-1 h-1 rounded-full" style={{ background: "var(--primary)" }} />}
                  {hasPending   && <span className="w-1 h-1 rounded-full" style={{ background: "#D97706" }} />}
                  {hasBlocked   && <span className="w-1 h-1 rounded-full" style={{ background: "#DC2626" }} />}
                </div>
              )}
              {!hasAny && <div className="h-1.5" />}
            </div>
          );
        })}
      </div>

      {/* Legend */}
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

export default function DashboardPage() {
  const stats = [
    { label: "Today's Events",    value: "3",  color: "var(--primary)", light: "var(--primary-light)", icon: <TodayIcon /> },
    { label: "Pending Payments",  value: "4",  color: "#D97706",        light: "#FFFBEB",              icon: <PaymentIcon /> },
    { label: "Upcoming Events",   value: "12", color: "#16A34A",        light: "#F0FDF4",              icon: <UpcomingIcon /> },
    { label: "Total Bookings",    value: "28", color: "#2563EB",        light: "#EFF6FF",              icon: <BookIcon /> },
  ];

  const quickActions = [
    { label: "New Booking",        icon: <BookIcon /> },
    { label: "Generate Quote",     icon: <FileIcon /> },
    { label: "Check Availability", icon: <CalendarIcon /> },
    { label: "Add Customer",       icon: <UserPlusIcon /> },
  ];

  const todayEvents = [
    { hall: "Hall A", event: "Wedding — Usman & Fatima", time: "6:00 PM", guests: "350" },
    { hall: "Hall B", event: "Birthday — Ayaan",         time: "4:00 PM", guests: "80" },
    { hall: "Hall C", event: "Corporate Dinner",         time: "7:30 PM", guests: "120" },
  ];

  const upcomingBookings = [
    { name: "Fatima Malik",  event: "Wedding",        date: "28 Jul", status: "Confirmed", statusColor: "var(--primary)", statusBg: "var(--primary-light)" },
    { name: "Omar Sheikh",   event: "Corporate Event", date: "3 Aug",  status: "Confirmed", statusColor: "var(--primary)", statusBg: "var(--primary-light)" },
    { name: "Zara Ahmed",    event: "Engagement",      date: "8 Aug",  status: "Pending",   statusColor: "#D97706",        statusBg: "#FFFBEB" },
    { name: "Ali Hassan",    event: "Wedding",         date: "15 Aug", status: "Confirmed", statusColor: "var(--primary)", statusBg: "var(--primary-light)" },
  ];

  return (
    <div className="p-4 lg:p-8">

      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-xl lg:text-2xl font-semibold text-black tracking-tight">Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "var(--fg-muted)" }}>Thursday, 24 July 2026</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6 lg:mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: s.light, color: s.color }}>
              {s.icon}
            </div>
            <p className="text-3xl font-semibold text-black">{s.value}</p>
            <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">

        {/* Left col */}
        <div className="lg:col-span-2 flex flex-col gap-4 lg:gap-6">

          {/* Today's Events */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-black mb-4">Today&apos;s Events</h2>
            <div className="flex flex-col gap-3">
              {todayEvents.map((e, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-[#F4F4F5] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-semibold" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                      {e.hall.split(" ")[1]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-black">{e.event}</p>
                      <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{e.hall} · {e.guests} guests</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium" style={{ color: "var(--fg-muted)" }}>{e.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Bookings */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-black">Upcoming Bookings</h2>
              <Link href="/vendor/dashboard/bookings" className="text-xs font-medium hover:underline" style={{ color: "var(--primary)" }}>
                View all
              </Link>
            </div>
            <div className="flex flex-col">
              {upcomingBookings.map((b, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-[#F4F4F5] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ background: "var(--primary)" }}>
                      {b.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-black">{b.name}</p>
                      <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{b.event} · {b.date}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: b.statusBg, color: b.statusColor }}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right col */}
        <div className="flex flex-col gap-4 lg:gap-6">

          {/* Mini Calendar */}
          <MiniCalendar />

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-black mb-4">Quick Actions</h2>
            <div className="flex flex-col gap-2">
              {quickActions.map((a) => (
                <button
                  key={a.label}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-left cursor-pointer transition-colors hover:opacity-80"
                  style={{ background: "var(--bg-subtle)", color: "var(--fg)" }}
                >
                  <span style={{ color: "var(--primary)" }}>{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

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
function FileIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
}
function CalendarIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
}
function UserPlusIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>;
}
