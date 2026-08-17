"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";
import {
  AreaChart, Area, BarChart as ReBarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
type Range = "this_month" | "last_month" | "last_3" | "last_6" | "all";

type ReportData = {
  stats: {
    totalRevenue: number; totalPaid: number; totalDue: number;
    revenueChange: number | null; collectionRate: number;
    confirmed: number; pending: number; cancelled: number;
  };
  monthlyChart: { label: string; revenue: number; paid: number }[];
  topCustomers: { name: string; phone: string; spent: number; paid: number; count: number }[];
  upcoming: {
    id: string; customerName: string; event: string; hall: string;
    date: string; timeFrom: string | null; timeTo: string | null;
    guests: number | null; status: string;
  }[];
  payroll: { monthlyPayroll: number; activeStaffCount: number };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtRs(n: number) {
  if (n >= 1_000_000) return "Rs. " + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return "Rs. " + (n / 1_000).toFixed(0) + "K";
  return "Rs. " + n.toLocaleString();
}
function fmtRsFull(n: number) { return "Rs. " + n.toLocaleString("en-PK"); }
function fmtMonth(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
function fmtTime(t: string | null) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

const RANGE_OPTIONS: { label: string; value: Range }[] = [
  { label: "This Month",    value: "this_month" },
  { label: "Last Month",    value: "last_month" },
  { label: "Last 3 Months", value: "last_3" },
  { label: "Last 6 Months", value: "last_6" },
  { label: "All Time",      value: "all" },
];

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  confirmed: { label: "Confirmed", color: "#16A34A", bg: "#F0FDF4" },
  pending:   { label: "Pending",   color: "#D97706", bg: "#FFFBEB" },
  cancelled: { label: "Cancelled", color: "#DC2626", bg: "#FEF2F2" },
  blocked:   { label: "Blocked",   color: "#6B7280", bg: "#F3F4F6" },
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, subColor, icon, accent }: {
  label: string; value: string; sub?: string; subColor?: string;
  icon: React.ReactNode; accent?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-5 border flex items-center gap-2 sm:gap-4 min-w-0" style={{ borderColor: "#E5E7EB" }}>
      <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0"
        style={{ background: accent ? accent + "18" : "#FFF0F4", color: accent ?? "#FF3B6B" }}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-base sm:text-xl lg:text-2xl font-bold truncate" style={{ color: "#111827" }}>{value}</p>
        <p className="text-[10px] sm:text-xs font-medium truncate" style={{ color: "#6B7280" }}>{label}</p>
        {sub && <p className="text-[9px] sm:text-[11px] font-semibold mt-0.5 truncate" style={{ color: subColor ?? "#9CA3AF" }}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── Chart Tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, isRevenue }: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
  isRevenue?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl border px-3 py-2 shadow-lg" style={{ borderColor: "#E5E7EB" }}>
      <p className="text-xs font-semibold mb-1" style={{ color: "#374151" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs font-medium" style={{ color: p.color }}>
          {p.name}: {isRevenue ? fmtRs(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border p-4 sm:p-5 lg:p-6" style={{ borderColor: "#E5E7EB" }}>
      <div className="mb-4 sm:mb-5">
        <h2 className="text-sm font-bold" style={{ color: "#111827" }}>{title}</h2>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ h = "h-24" }: { h?: string }) {
  return <div className={`bg-white rounded-2xl ${h} animate-pulse border`} style={{ borderColor: "#E5E7EB" }} />;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { accessToken } = useAuthStore();
  const [range, setRange]         = useState<Range>("this_month");
  const [customMonth, setCustomMonth] = useState<string>("");
  const [data, setData]           = useState<ReportData | null>(null);
  const [loading, setLoading]     = useState(true);
  const monthInputRef             = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!accessToken) return;
    fetchReports();
  }, [accessToken, range, customMonth]);

  async function fetchReports() {
    setLoading(true);
    try {
      const url = customMonth
        ? `/api/vendor/reports?month=${customMonth}`
        : `/api/vendor/reports?range=${range}`;
      const res = await api.get<ReportData & { success: boolean }>(url, accessToken!);
      if (res.success) setData(res as unknown as ReportData);
    } finally {
      setLoading(false);
    }
  }

  function handleRangeChange(val: Range) {
    setCustomMonth("");
    setRange(val);
  }

  const s = data?.stats;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="p-4 lg:p-6 min-h-screen" style={{ background: "var(--bg-subtle, #F4F4F5)", maxWidth: "100%", overflowX: "hidden" }}>

      {/* Header */}
      <div className="mb-5" style={{ maxWidth: "100%" }}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold" style={{ color: "#111827" }}>Reports</h1>
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: "#6B7280" }}>Business performance overview</p>
          </div>

          {/* Calendar month picker button */}
          <div className="relative shrink-0 inline-flex items-center gap-1">
            <button
              onClick={() => {
                const el = monthInputRef.current;
                if (!el) return;
                try { (el as any).showPicker(); } catch { el.focus(); }
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all"
              style={{
                background:  customMonth ? "#FFF0F4" : "#fff",
                color:       customMonth ? "#FF3B6B" : "#6B7280",
                borderColor: customMonth ? "#FF3B6B" : "#E5E7EB",
              }}
            >
              <CalendarIcon />
              <span>{customMonth ? fmtMonth(customMonth) : "Pick month"}</span>
            </button>

            {/* Hidden but real-size input so showPicker() works */}
            <input
              ref={monthInputRef}
              type="month"
              value={customMonth}
              onChange={e => setCustomMonth(e.target.value)}
              style={{
                position: "absolute", top: 0, left: 0,
                width: "1px", height: "1px", opacity: 0,
                border: "none", padding: 0, margin: 0,
              }}
            />

            {customMonth && (
              <button
                onClick={() => setCustomMonth("")}
                className="flex items-center justify-center w-6 h-6 rounded-full text-sm font-bold cursor-pointer"
                style={{ color: "#FF3B6B", background: "#FFF0F4", border: "1px solid #FF3B6B" }}
              >×</button>
            )}
          </div>
        </div>

        {/* Mobile: dropdown */}
        <div className="sm:hidden relative">
          <select
            value={range}
            onChange={e => handleRangeChange(e.target.value as Range)}
            className="appearance-none w-full cursor-pointer text-sm font-semibold pl-4 pr-9 py-2.5 rounded-xl border outline-none"
            style={{
              background: "#fff",
              color: "#111827",
              borderColor: "#E5E7EB",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            {RANGE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {/* Desktop: tab bar */}
        <div className="hidden sm:block" style={{ overflow: "hidden" }}>
          <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "#E5E7EB" }}>
            {RANGE_OPTIONS.map(o => (
              <button key={o.value} onClick={() => handleRangeChange(o.value)}
                className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer"
                style={{
                  background: !customMonth && range === o.value ? "#fff" : "transparent",
                  color:      !customMonth && range === o.value ? "#111827" : "#6B7280",
                  boxShadow:  !customMonth && range === o.value ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}
              >{o.label}</button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[1,2,3,4].map(n => <Skeleton key={n} />)}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1,2,3].map(n => <Skeleton key={n} h="h-16 sm:h-20" />)}
          </div>
          <Skeleton h="h-48 sm:h-56" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <Skeleton h="h-56 sm:h-64" /><Skeleton h="h-56 sm:h-64" />
          </div>
        </div>
      ) : !data ? (
        <div className="text-center py-20" style={{ color: "#9CA3AF" }}>Failed to load reports.</div>
      ) : (
        <>
          {/* ── Revenue Stats ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
            <StatCard
              label="Total Sales" value={fmtRs(s!.totalRevenue)}
              sub={s!.revenueChange !== null ? `${s!.revenueChange! >= 0 ? "+" : ""}${s!.revenueChange}% vs prev period` : undefined}
              subColor={s!.revenueChange !== null ? (s!.revenueChange! >= 0 ? "#16A34A" : "#DC2626") : undefined}
              icon={<RevenueIcon />}
            />
            <StatCard
              label="Total Collected" value={fmtRs(s!.totalPaid)}
              sub={`${s!.collectionRate}% collection rate`} subColor="#16A34A"
              icon={<CollectedIcon />} accent="#16A34A"
            />
            <StatCard
              label="Outstanding Due" value={fmtRs(s!.totalDue)}
              sub={s!.totalDue > 0 ? "Pending collection" : "All clear!"}
              subColor={s!.totalDue > 0 ? "#D97706" : "#16A34A"}
              icon={<DueIcon />} accent="#D97706"
            />
            <StatCard
              label="Monthly Payroll" value={fmtRs(data.payroll.monthlyPayroll)}
              sub={`${data.payroll.activeStaffCount} active staff`}
              icon={<PayrollIcon />} accent="#7C3AED"
            />
          </div>

          {/* ── Booking Status ── */}
          <div className="grid grid-cols-3 gap-2 mb-3 sm:mb-4">
            <StatCard label="Confirmed" value={String(s!.confirmed)} icon={<CheckIcon />} accent="#16A34A" />
            <StatCard label="Pending"   value={String(s!.pending)}   icon={<ClockIcon />} accent="#D97706" />
            <StatCard label="Cancelled" value={String(s!.cancelled)} icon={<XIcon />}     accent="#DC2626" />
          </div>

          {/* ── Monthly Charts ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">

            {/* Revenue collected — Area chart */}
            <Section title="Revenue Over Time" subtitle="Monthly collected amount (PKR)">
              {data.monthlyChart.every(d => d.paid === 0) ? (
                <p className="text-sm text-center py-10" style={{ color: "#9CA3AF" }}>No revenue data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={data.monthlyChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#FF3B6B" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#FF3B6B" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false}
                      tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} />
                    <Tooltip content={<ChartTooltip isRevenue />} />
                    <Area type="monotone" dataKey="paid" name="Collected"
                      stroke="#FF3B6B" strokeWidth={2.5}
                      fill="url(#revenueGrad)" dot={false}
                      activeDot={{ r: 5, fill: "#FF3B6B" }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Section>

            {/* Total billed vs collected — Bar chart */}
            <Section title="Billed vs Collected" subtitle="Monthly comparison (PKR)">
              {data.monthlyChart.every(d => d.revenue === 0) ? (
                <p className="text-sm text-center py-10" style={{ color: "#9CA3AF" }}>No billing data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <ReBarChart data={data.monthlyChart} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false}
                      tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} />
                    <Tooltip content={<ChartTooltip isRevenue />} />
                    <Bar dataKey="revenue" name="Billed"     fill="#FF3B6B" fillOpacity={0.2} radius={[4,4,0,0]} />
                    <Bar dataKey="paid"    name="Collected"  fill="#FF3B6B"                   radius={[4,4,0,0]} />
                  </ReBarChart>
                </ResponsiveContainer>
              )}
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ background: "#FF3B6B" }} />
                  <span className="text-xs" style={{ color: "#6B7280" }}>Collected</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ background: "#FF3B6B", opacity: 0.2 }} />
                  <span className="text-xs" style={{ color: "#6B7280" }}>Total billed</span>
                </div>
              </div>
            </Section>
          </div>

          {/* ── Top Customers + Upcoming Events ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">

            {/* Top Customers */}
            <Section title="Top Customers" subtitle="By total booking value in selected period">
              {data.topCustomers.length === 0
                ? <p className="text-sm text-center py-6" style={{ color: "#9CA3AF" }}>No customers in this period</p>
                : (
                  <div className="flex flex-col gap-2">
                    {data.topCustomers.map((c, i) => {
                      const due = c.spent - c.paid;
                      return (
                        <div key={i} className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-2xl" style={{ background: "#F9FAFB" }}>
                          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ background: i === 0 ? "#FFF0F4" : "#F3F4F6", color: i === 0 ? "#FF3B6B" : "#6B7280" }}>
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
                              : <p className="text-[11px]" style={{ color: "#16A34A" }}>Paid ✓</p>}
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
              {data.upcoming.length === 0
                ? <p className="text-sm text-center py-6" style={{ color: "#9CA3AF" }}>No upcoming events</p>
                : (
                  <div className="flex flex-col gap-2">
                    {data.upcoming.map(b => {
                      const daysLeft = Math.ceil((new Date(b.date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
                      const st = STATUS_CFG[b.status] ?? STATUS_CFG.pending;
                      return (
                        <div key={b.id} className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-2xl border" style={{ borderColor: "#F3F4F6" }}>
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex flex-col items-center justify-center shrink-0" style={{ background: "#FFF0F4" }}>
                            <p className="text-sm sm:text-base font-black leading-none" style={{ color: "#FF3B6B" }}>
                              {new Date(b.date).getDate()}
                            </p>
                            <p className="text-[10px] font-semibold" style={{ color: "#FF3B6B" }}>
                              {new Date(b.date).toLocaleDateString("en-PK", { month: "short" })}
                            </p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate" style={{ color: "#111827" }}>{b.customerName}</p>
                            <p className="text-xs truncate" style={{ color: "#6B7280" }}>{b.event} · {b.hall}</p>
                            <p className="text-[11px]" style={{ color: "#9CA3AF" }}>
                              {fmtTime(b.timeFrom)}{b.timeTo ? ` – ${fmtTime(b.timeTo)}` : ""}{b.guests ? ` · ${b.guests} guests` : ""}
                            </p>
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
          <Section title="Payment Health" subtitle="Overall collection status for selected period">
            <div className="flex flex-col sm:grid sm:grid-cols-3 gap-4 sm:gap-6">
              {/* Donut */}
              <div className="flex flex-row sm:flex-col items-center justify-center gap-3 sm:gap-2">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#F3F4F6" strokeWidth="3.5" />
                    <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#FF3B6B" strokeWidth="3.5"
                      strokeDasharray={`${s!.collectionRate} ${100 - s!.collectionRate}`}
                      strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-lg sm:text-xl font-black" style={{ color: "#111827" }}>{s!.collectionRate}%</p>
                    <p className="text-[10px]" style={{ color: "#9CA3AF" }}>collected</p>
                  </div>
                </div>
                <p className="text-xs font-semibold" style={{ color: "#374151" }}>Collection Rate</p>
              </div>

              {/* Stats */}
              <div className="sm:col-span-2 flex flex-col justify-center gap-2 sm:gap-3">
                {[
                  { label: "Total Billed",    value: fmtRsFull(s!.totalRevenue), color: "#111827" },
                  { label: "Total Collected", value: fmtRsFull(s!.totalPaid),    color: "#16A34A" },
                  { label: "Outstanding Due", value: fmtRsFull(s!.totalDue),     color: s!.totalDue > 0 ? "#D97706" : "#16A34A" },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between gap-3 py-2.5 border-b last:border-0" style={{ borderColor: "#F3F4F6" }}>
                    <span className="text-sm" style={{ color: "#6B7280" }}>{r.label}</span>
                    <span className="text-sm font-bold" style={{ color: r.color }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        </>
      )}
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function CalendarIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function RevenueIcon()   { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>; }
function CollectedIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>; }
function DueIcon()       { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function PayrollIcon()   { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function CheckIcon()     { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function ClockIcon()     { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function XIcon()         { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
