"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/store/useStore";
import type { Booking, Payment } from "@/store/useStore";

// ─── Types ────────────────────────────────────────────────────────────────────
type Range = "this_month" | "last_month" | "last_3" | "last_6" | "all";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtRs(n: number) {
  if (n >= 1_000_000) return "Rs. " + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return "Rs. " + (n / 1_000).toFixed(0) + "K";
  return "Rs. " + n.toLocaleString();
}
function fmtRsFull(n: number) {
  return "Rs. " + n.toLocaleString("en-PK");
}
function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}
function fmtTime(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hr   = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, "0")} ${ampm}`;
}
function monthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString("en-PK", { month: "short", year: "numeric" });
}

function getRangeStart(range: Range): Date {
  const now = new Date();
  if (range === "this_month")  return new Date(now.getFullYear(), now.getMonth(), 1);
  if (range === "last_month")  return new Date(now.getFullYear(), now.getMonth() - 1, 1);
  if (range === "last_3")      return new Date(now.getFullYear(), now.getMonth() - 2, 1);
  if (range === "last_6")      return new Date(now.getFullYear(), now.getMonth() - 5, 1);
  return new Date(2000, 0, 1);
}
function getRangeEnd(range: Range): Date {
  const now = new Date();
  if (range === "last_month") return new Date(now.getFullYear(), now.getMonth(), 0);
  return new Date(now.getFullYear(), now.getMonth() + 1, 0);
}

function inRange(dateStr: string, start: Date, end: Date) {
  const d = new Date(dateStr);
  return d >= start && d <= end;
}

const RANGE_OPTIONS: { label: string; value: Range }[] = [
  { label: "This Month",   value: "this_month" },
  { label: "Last Month",   value: "last_month" },
  { label: "Last 3 Months",value: "last_3" },
  { label: "Last 6 Months",value: "last_6" },
  { label: "All Time",     value: "all" },
];

const STATUS_CFG = {
  confirmed: { label: "Confirmed", color: "#16A34A", bg: "#F0FDF4" },
  pending:   { label: "Pending",   color: "#D97706", bg: "#FFFBEB" },
  cancelled: { label: "Cancelled", color: "#DC2626", bg: "#FEF2F2" },
} as const;

const EVENT_COLORS: Record<string, string> = {
  Wedding: "#FF3B6B", Engagement: "#7C3AED", "Birthday Party": "#EA580C",
  "Corporate Event": "#2563EB", Conference: "#0891B2", Anniversary: "#16A34A", Other: "#6B7280",
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, subColor, icon, accent }: {
  label: string; value: string; sub?: string; subColor?: string;
  icon: React.ReactNode; accent?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 lg:p-5 border flex items-center gap-4" style={{ borderColor: "#E5E7EB" }}>
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
        style={{ background: accent ? accent + "18" : "var(--primary-light)", color: accent ?? "var(--primary)" }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xl lg:text-2xl font-bold truncate" style={{ color: "#111827" }}>{value}</p>
        <p className="text-xs font-medium" style={{ color: "#6B7280" }}>{label}</p>
        {sub && <p className="text-[11px] font-semibold mt-0.5" style={{ color: subColor ?? "#9CA3AF" }}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────
function BarChart({ data }: { data: { label: string; revenue: number; paid: number }[] }) {
  const max = Math.max(...data.map(d => d.revenue), 1);
  return (
    <div className="flex items-end gap-2 lg:gap-3 h-40">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
          <p className="text-[10px] font-bold" style={{ color: "#111827" }}>
            {d.revenue > 0 ? fmtRs(d.revenue) : ""}
          </p>
          <div className="w-full relative rounded-t-lg overflow-hidden flex flex-col justify-end" style={{ height: 100, background: "#F3F4F6" }}>
            {/* Paid portion */}
            <div
              className="w-full rounded-t-lg transition-all duration-500"
              style={{
                height: `${(d.revenue / max) * 100}%`,
                background: "var(--primary)",
                opacity: 0.18,
                position: "absolute",
                bottom: 0,
              }}
            />
            <div
              className="w-full rounded-t-lg transition-all duration-500 absolute bottom-0"
              style={{ height: `${(d.paid / max) * 100}%`, background: "var(--primary)" }}
            />
          </div>
          <p className="text-[10px] truncate w-full text-center" style={{ color: "#9CA3AF" }}>{d.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-semibold" style={{ color: "#374151" }}>{label}</span>
        <span className="text-sm font-bold" style={{ color }}>{fmtRs(value)} <span className="text-xs font-normal" style={{ color: "#9CA3AF" }}>({pct}%)</span></span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function Section({ title, subtitle, children, action }: {
  title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border p-5 lg:p-6" style={{ borderColor: "#E5E7EB" }}>
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-sm font-bold" style={{ color: "#111827" }}>{title}</h2>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { bookings, payments, staff } = useStore();
  const [range, setRange] = useState<Range>("this_month");

  const start = getRangeStart(range);
  const end   = getRangeEnd(range);

  // ── Filtered bookings ──
  const filtered = useMemo(() =>
    range === "all" ? bookings : bookings.filter(b => inRange(b.date, start, end)),
    [bookings, range, start, end]
  );

  // ── Previous period (for comparison) ──
  const prevStart = useMemo(() => {
    if (range === "this_month")  return new Date(start.getFullYear(), start.getMonth() - 1, 1);
    if (range === "last_month")  return new Date(start.getFullYear(), start.getMonth() - 1, 1);
    if (range === "last_3")      return new Date(start.getFullYear(), start.getMonth() - 3, 1);
    if (range === "last_6")      return new Date(start.getFullYear(), start.getMonth() - 6, 1);
    return start;
  }, [range, start]);
  const prevEnd = useMemo(() => new Date(start.getTime() - 1), [start]);
  const prevBookings = useMemo(() =>
    bookings.filter(b => inRange(b.date, prevStart, prevEnd)),
    [bookings, prevStart, prevEnd]
  );

  // ── Revenue stats ──
  const totalRevenue  = filtered.reduce((s, b) => s + b.amount, 0);
  const totalPaid     = filtered.reduce((s, b) => s + b.paid, 0);
  const totalDue      = totalRevenue - totalPaid;
  const prevRevenue   = prevBookings.reduce((s, b) => s + b.amount, 0);
  const revenueChange = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : null;
  const collectionRate = totalRevenue > 0 ? Math.round((totalPaid / totalRevenue) * 100) : 0;

  // ── Booking stats ──
  const confirmed = filtered.filter(b => b.status === "confirmed").length;
  const pending   = filtered.filter(b => b.status === "pending").length;
  const cancelled = filtered.filter(b => b.status === "cancelled").length;

  // ── Revenue by event type ──
  const eventRevMap = new Map<string, number>();
  for (const b of filtered) eventRevMap.set(b.event, (eventRevMap.get(b.event) ?? 0) + b.amount);
  const eventRevList = [...eventRevMap.entries()].sort((a, b) => b[1] - a[1]);

  // ── Revenue by hall ──
  const hallRevMap = new Map<string, number>();
  for (const b of filtered) hallRevMap.set(b.hall, (hallRevMap.get(b.hall) ?? 0) + b.amount);
  const hallRevList = [...hallRevMap.entries()].sort((a, b) => b[1] - a[1]);

  // ── Top customers ──
  const custMap = new Map<string, { name: string; phone: string; spent: number; paid: number; count: number }>();
  for (const b of filtered) {
    const key = `${b.customerName}__${b.phone}`;
    const c = custMap.get(key) ?? { name: b.customerName, phone: b.phone, spent: 0, paid: 0, count: 0 };
    c.spent += b.amount; c.paid += b.paid; c.count++;
    custMap.set(key, c);
  }
  const topCustomers = [...custMap.values()].sort((a, b) => b.spent - a.spent).slice(0, 5);

  // ── Upcoming events (next 30 days, confirmed) ──
  const today    = new Date();
  const in30days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const upcoming = bookings
    .filter(b => b.status !== "cancelled" && inRange(b.date, today, in30days))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  // ── Overdue payments ──
  const overdue = payments.filter(p => p.status === "overdue");
  const overdueTotal = overdue.reduce((s, p) => s + (p.totalAmount - p.paid), 0);

  // ── Monthly revenue chart (last 6 months) ──
  const chartData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const yr  = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1).getFullYear();
      const mo  = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1).getMonth();
      const mBks = bookings.filter(b => {
        const d = new Date(b.date);
        return d.getFullYear() === yr && d.getMonth() === mo;
      });
      return {
        label:   monthLabel(yr, mo),
        revenue: mBks.reduce((s, b) => s + b.amount, 0),
        paid:    mBks.reduce((s, b) => s + b.paid,   0),
      };
    });
  }, [bookings]);

  // ── Staff payroll ──
  const monthlyPayroll = staff.filter(s => s.status !== "inactive").reduce((sum, s) => sum + s.salary, 0);

  return (
    <div className="p-4 lg:p-6 min-h-screen" style={{ background: "var(--bg-subtle, #F4F4F5)" }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#111827" }}>Reports</h1>
          <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>Business performance overview</p>
        </div>

        {/* Range Filter */}
        <div className="flex gap-1 p-1 rounded-2xl overflow-x-auto shrink-0" style={{ background: "#E5E7EB" }}>
          {RANGE_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => setRange(o.value)}
              className="px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
              style={{
                background: range === o.value ? "#fff" : "transparent",
                color: range === o.value ? "#111827" : "#6B7280",
                boxShadow: range === o.value ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >{o.label}</button>
          ))}
        </div>
      </div>

      {/* ── Revenue Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard
          label="Total Sales"
          value={fmtRs(totalRevenue)}
          sub={revenueChange !== null ? `${revenueChange >= 0 ? "+" : ""}${revenueChange}% vs prev period` : undefined}
          subColor={revenueChange !== null ? (revenueChange >= 0 ? "#16A34A" : "#DC2626") : undefined}
          icon={<RevenueIcon />}
        />
        <StatCard
          label="Total Collected"
          value={fmtRs(totalPaid)}
          sub={`${collectionRate}% collection rate`}
          subColor="#16A34A"
          icon={<CollectedIcon />}
          accent="#16A34A"
        />
        <StatCard
          label="Outstanding Due"
          value={fmtRs(totalDue)}
          sub={totalDue > 0 ? "Pending collection" : "All clear!"}
          subColor={totalDue > 0 ? "#D97706" : "#16A34A"}
          icon={<DueIcon />}
          accent="#D97706"
        />
        <StatCard
          label="Monthly Payroll"
          value={fmtRs(monthlyPayroll)}
          sub={`${staff.filter(s => s.status === "active").length} active staff`}
          icon={<PayrollIcon />}
          accent="#7C3AED"
        />
      </div>

      {/* ── Booking Stats ── */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <StatCard label="Confirmed" value={String(confirmed)} icon={<CheckIcon />} accent="#16A34A" />
        <StatCard label="Pending"   value={String(pending)}   icon={<ClockIcon />} accent="#D97706" />
        <StatCard label="Cancelled" value={String(cancelled)} icon={<XIcon />}    accent="#DC2626" />
      </div>

      {/* ── Revenue Chart ── */}
      <div className="mb-4">
        <Section title="Monthly Revenue" subtitle="Last 6 months — bar = total, fill = collected">
          <BarChart data={chartData} />
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ background: "var(--primary)" }}/><span className="text-xs" style={{ color: "#6B7280" }}>Collected</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ background: "var(--primary)", opacity: 0.18 }}/><span className="text-xs" style={{ color: "#6B7280" }}>Total billed</span></div>
          </div>
        </Section>
      </div>

      {/* ── Top Customers + Upcoming Events ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* Top Customers */}
        <Section title="Top Customers" subtitle="By total booking value in selected period">
          {topCustomers.length === 0
            ? <p className="text-sm text-center py-6" style={{ color: "#9CA3AF" }}>No customers in this period</p>
            : (
              <div className="flex flex-col gap-2">
                {topCustomers.map((c, i) => {
                  const due = c.spent - c.paid;
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: "#F9FAFB" }}>
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0" style={{ background: i === 0 ? "#FFF0F4" : "#F3F4F6", color: i === 0 ? "var(--primary)" : "#6B7280" }}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: "#111827" }}>{c.name}</p>
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>{c.count} booking{c.count > 1 ? "s" : ""} · {c.phone}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold" style={{ color: "#111827" }}>{fmtRs(c.spent)}</p>
                        {due > 0
                          ? <p className="text-[11px]" style={{ color: "#DC2626" }}>Due: {fmtRs(due)}</p>
                          : <p className="text-[11px]" style={{ color: "#16A34A" }}>Paid ✓</p>
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          }
        </Section>

        {/* Upcoming Events */}
        <Section title="Upcoming Events" subtitle="Next 30 days">
          {upcoming.length === 0
            ? <p className="text-sm text-center py-6" style={{ color: "#9CA3AF" }}>No upcoming events</p>
            : (
              <div className="flex flex-col gap-2">
                {upcoming.map(b => {
                  const daysLeft = Math.ceil((new Date(b.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  const st = STATUS_CFG[b.status];
                  return (
                    <div key={b.id} className="flex items-center gap-3 p-3 rounded-2xl border" style={{ borderColor: "#F3F4F6" }}>
                      <div className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0" style={{ background: "var(--primary-light)" }}>
                        <p className="text-base font-black leading-none" style={{ color: "var(--primary)" }}>
                          {new Date(b.date).getDate()}
                        </p>
                        <p className="text-[10px] font-semibold" style={{ color: "var(--primary)" }}>
                          {new Date(b.date).toLocaleDateString("en-PK", { month: "short" })}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: "#111827" }}>{b.customerName}</p>
                        <p className="text-xs truncate" style={{ color: "#6B7280" }}>{b.event} · {b.hall}</p>
                        <p className="text-[11px]" style={{ color: "#9CA3AF" }}>{fmtTime(b.timeFrom)} – {fmtTime(b.timeTo)} · {b.guests} guests</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                        <p className="text-[11px] mt-1" style={{ color: daysLeft <= 3 ? "#DC2626" : "#9CA3AF" }}>
                          {daysLeft === 0 ? "Today" : daysLeft === 1 ? "Tomorrow" : `${daysLeft}d left`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          }
        </Section>
      </div>

      {/* ── Payment Health ── */}
      <Section
        title="Payment Health"
        subtitle="Overall collection status"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Collection Rate Donut */}
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#F3F4F6" strokeWidth="3.5" />
                <circle
                  cx="18" cy="18" r="15.9155" fill="none"
                  stroke="var(--primary)" strokeWidth="3.5"
                  strokeDasharray={`${collectionRate} ${100 - collectionRate}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-xl font-black" style={{ color: "#111827" }}>{collectionRate}%</p>
                <p className="text-[10px]" style={{ color: "#9CA3AF" }}>collected</p>
              </div>
            </div>
            <p className="text-xs font-semibold" style={{ color: "#374151" }}>Collection Rate</p>
          </div>

          {/* Stats */}
          <div className="sm:col-span-2 flex flex-col justify-center gap-3">
            {[
              { label: "Total Billed",     value: fmtRsFull(totalRevenue),  color: "#111827" },
              { label: "Total Collected",  value: fmtRsFull(totalPaid),     color: "#16A34A" },
              { label: "Outstanding Due",  value: fmtRsFull(totalDue),      color: totalDue > 0 ? "#D97706" : "#16A34A" },
              { label: "Overdue Payments", value: overdue.length === 0 ? "None" : `${overdue.length} ${overdue.length === 1 ? "payment" : "payments"} · ${fmtRsFull(overdueTotal)}`, color: overdue.length > 0 ? "#DC2626" : "#16A34A" },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between gap-3 py-2.5 border-b last:border-0" style={{ borderColor: "#F3F4F6" }}>
                <span className="text-sm" style={{ color: "#6B7280" }}>{r.label}</span>
                <span className="text-sm font-bold" style={{ color: r.color }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function RevenueIcon()   { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>; }
function CollectedIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>; }
function DueIcon()       { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function PayrollIcon()   { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function CheckIcon()     { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function ClockIcon()     { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function XIcon()         { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
