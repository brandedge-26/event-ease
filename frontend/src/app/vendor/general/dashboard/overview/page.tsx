"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";
import {
  AreaChart, Area, BarChart as ReBarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
type Range = "this_month" | "last_month" | "last_3" | "last_6" | "all";

type OverviewData = {
  stats: {
    totalRevenue: number; totalPaid: number; totalDue: number;
    collectionRate: number;
    confirmed: number; pending: number; cancelled: number; totalBookings: number;
    totalInquiries: number; newInquiries: number;
  };
  branchStats: {
    id: string; name: string; city: string; area: string;
    isDefault: boolean; isActive: boolean; isApproved: boolean;
    revenue: number; paid: number; due: number;
    confirmed: number; pending: number; cancelled: number; inquiries: number;
  }[];
  monthlyChart: { label: string; revenue: number; paid: number }[];
  upcoming: {
    id: string; branchId: string; branchName: string;
    customerName: string; event: string; hall: string;
    date: string; timeFrom: string | null; guests: number;
    amount: number; paid: number; status: string;
  }[];
};

// ─── Overview cache (cross-branch — not scoped by branch ID) ─────────────────
const OV_PREFIX = "ee_ov_";
const OV_TTL    = 24 * 60 * 60 * 1000;

function ovSave(range: Range, data: OverviewData) {
  try { localStorage.setItem(OV_PREFIX + range, JSON.stringify({ d: data, t: Date.now() })); } catch {}
}
function ovLoad(range: Range): OverviewData | null {
  try {
    const raw = localStorage.getItem(OV_PREFIX + range);
    if (!raw) return null;
    const { d, t } = JSON.parse(raw) as { d: OverviewData; t: number };
    if (Date.now() - t > OV_TTL) { localStorage.removeItem(OV_PREFIX + range); return null; }
    return d;
  } catch { return null; }
}
// ─────────────────────────────────────────────────────────────────────────────

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtRs(n: number) {
  if (n >= 1_000_000) return "Rs. " + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return "Rs. " + (n / 1_000).toFixed(0) + "K";
  return "Rs. " + n.toLocaleString();
}

const RANGE_OPTIONS: { label: string; value: Range }[] = [
  { label: "All Time",      value: "all" },
  { label: "This Month",    value: "this_month" },
  { label: "Last Month",    value: "last_month" },
  { label: "Last 3 Months", value: "last_3" },
  { label: "Last 6 Months", value: "last_6" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border ${className}`} style={{ borderColor: "#E5E7EB" }}>
      {children}
    </div>
  );
}

function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="px-4 sm:px-5 py-4 border-b" style={{ borderColor: "#F3F4F6" }}>
      <p className="text-sm font-semibold" style={{ color: "#111827" }}>{title}</p>
      <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{sub}</p>
    </div>
  );
}

function ChartTooltip({ active, payload, label, isRevenue }: {
  active?: boolean; payload?: { value: number; name: string }[];
  label?: string; isRevenue?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-lg border px-3 py-2 shadow-md" style={{ borderColor: "#E5E7EB" }}>
      <p className="text-xs font-semibold mb-1" style={{ color: "#374151" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs" style={{ color: "#6B7280" }}>
          {p.name}: <span style={{ color: "#111827", fontWeight: 600 }}>{isRevenue ? fmtRs(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  );
}

function Skeleton({ h = "h-24" }: { h?: string }) {
  return <div className={`bg-white rounded-xl ${h} animate-pulse border`} style={{ borderColor: "#E5E7EB" }} />;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OverviewPage() {
  const router = useRouter();
  const { branches, accessToken } = useAuthStore();
  const [range,   setRange]   = useState<Range>("all");
  const [data,    setData]    = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (branches.length > 0 && branches.length <= 1) {
      router.replace("/vendor/general/dashboard");
    }
  }, [branches]);

  useEffect(() => {
    if (!accessToken || branches.length <= 1) return;

    // Always show cached data instantly — avoids blank screen while network loads
    const cached = ovLoad(range);
    if (cached) { setData(cached); setLoading(false); }
    else setLoading(true);

    // Skip network entirely when offline
    if (accessToken === "offline-session" || !navigator.onLine) {
      setLoading(false);
      return;
    }

    // Online: fetch fresh data in background, update if newer than cache
    api.get(`/api/vendor/overview?range=${range}`, accessToken, 6_000)
      .then((res: any) => {
        if (res.success && !res._fromCache) {
          setData(res as OverviewData);
          ovSave(range, res as OverviewData);
        }
      })
      .finally(() => setLoading(false));
  }, [range, accessToken, branches.length]);

  if (branches.length > 0 && branches.length <= 1) return null;

  const s     = data?.stats;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="p-4 lg:p-6 min-h-screen" style={{ background: "#F7F7F8" }}>

      {/* ── Header ── */}
      <div className="mb-5">
        <div className="mb-4">
          <h1 className="text-xl font-bold tracking-tight" style={{ color: "#111827" }}>Overview</h1>
          <p className="text-sm mt-0.5" style={{ color: "#9CA3AF" }}>
            {branches.length} branches · combined performance
          </p>
        </div>

        {/* Mobile: dropdown */}
        <div className="sm:hidden relative">
          <select value={range} onChange={e => setRange(e.target.value as Range)}
            className="appearance-none w-full cursor-pointer text-sm font-medium pl-4 pr-9 py-2.5 rounded-lg border outline-none"
            style={{ background: "#fff", color: "#111827", borderColor: "#E5E7EB" }}>
            {RANGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
        </div>

        {/* Desktop: tab bar */}
        <div className="hidden sm:flex gap-0.5 p-0.5 rounded-lg w-fit" style={{ background: "#E5E7EB" }}>
          {RANGE_OPTIONS.map(o => (
            <button key={o.value} onClick={() => setRange(o.value)}
              className="px-4 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap cursor-pointer"
              style={{
                background: range === o.value ? "#fff" : "transparent",
                color:      range === o.value ? "#111827" : "#6B7280",
                boxShadow:  range === o.value ? "0 1px 2px rgba(0,0,0,0.07)" : "none",
              }}>{o.label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton h="h-36" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[1,2,3,4].map(n => <Skeleton key={n} h="h-20" />)}</div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3"><Skeleton h="h-52" /><Skeleton h="h-52" /></div>
          <Skeleton h="h-48" /><Skeleton h="h-48" />
        </div>
      ) : !data ? (
        <div className="text-center py-20" style={{ color: "#9CA3AF" }}>Failed to load overview.</div>
      ) : (
        <div className="flex flex-col gap-3">

          {/* ── Financial summary ── */}
          <Card>
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
              {[
                { label: "Total Billed",    value: fmtRs(s!.totalRevenue), note: `${s!.collectionRate}% collected` },
                { label: "Collected",       value: fmtRs(s!.totalPaid),    note: `across ${s!.totalBookings} bookings` },
                { label: "Outstanding Due", value: fmtRs(s!.totalDue),     note: s!.totalDue > 0 ? "Pending collection" : "Fully settled" },
              ].map((item, i) => (
                <div key={i} className="p-4 sm:p-5 lg:p-6">
                  <p className="text-xs font-medium mb-2" style={{ color: "#9CA3AF" }}>{item.label}</p>
                  <p className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: "#111827" }}>{item.value}</p>
                  <p className="text-xs mt-1.5" style={{ color: "#9CA3AF" }}>{item.note}</p>
                </div>
              ))}
            </div>
            <div className="px-4 sm:px-5 lg:px-6 pb-4">
              <div className="w-full h-1 rounded-full" style={{ background: "#F3F4F6" }}>
                <div className="h-1 rounded-full transition-all duration-500"
                  style={{ width: `${s!.collectionRate}%`, background: "#FF3B6B" }} />
              </div>
            </div>
          </Card>

          {/* ── Booking counts ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Confirmed",  value: s!.confirmed,      note: undefined,                                               dimColor: false, red: false },
              { label: "Pending",    value: s!.pending,        note: undefined,                                               dimColor: true,  red: false },
              { label: "Cancelled",  value: s!.cancelled,      note: undefined,                                               dimColor: false, red: true  },
              { label: "Inquiries",  value: s!.totalInquiries, note: s!.newInquiries > 0 ? `${s!.newInquiries} new` : undefined, dimColor: false, red: false },
            ].map(item => (
              <Card key={item.label} className="p-4">
                <p className="text-2xl font-bold"
                  style={{ color: item.red ? "#DC2626" : item.dimColor ? "#6B7280" : "#111827" }}>
                  {item.value}
                </p>
                <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>{item.label}</p>
                {item.note && (
                  <p className="text-[11px] mt-0.5 font-medium" style={{ color: "#FF3B6B" }}>{item.note}</p>
                )}
              </Card>
            ))}
          </div>

          {/* ── Charts ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card className="p-4 sm:p-5">
              <p className="text-sm font-semibold" style={{ color: "#111827" }}>Revenue Over Time</p>
              <p className="text-xs mb-4 mt-0.5" style={{ color: "#9CA3AF" }}>Monthly collected — all branches</p>
              {data.monthlyChart.every(d => d.paid === 0) ? (
                <p className="text-sm text-center py-10" style={{ color: "#9CA3AF" }}>No revenue data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={data.monthlyChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ovAreaGradGen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#FF3B6B" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="#FF3B6B" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false}
                      tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} />
                    <Tooltip content={<ChartTooltip isRevenue />} />
                    <Area type="monotone" dataKey="paid" name="Collected" stroke="#FF3B6B" strokeWidth={2}
                      fill="url(#ovAreaGradGen)" dot={false} activeDot={{ r: 4, fill: "#FF3B6B" }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card className="p-4 sm:p-5">
              <p className="text-sm font-semibold" style={{ color: "#111827" }}>Billed vs Collected</p>
              <p className="text-xs mb-4 mt-0.5" style={{ color: "#9CA3AF" }}>Monthly comparison — all branches</p>
              {data.monthlyChart.every(d => d.revenue === 0) ? (
                <p className="text-sm text-center py-10" style={{ color: "#9CA3AF" }}>No billing data yet.</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <ReBarChart data={data.monthlyChart} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false}
                        tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} />
                      <Tooltip content={<ChartTooltip isRevenue />} />
                      <Bar dataKey="revenue" name="Billed"    fill="#FF3B6B" fillOpacity={0.15} radius={[3,3,0,0]} />
                      <Bar dataKey="paid"    name="Collected" fill="#FF3B6B"                    radius={[3,3,0,0]} />
                    </ReBarChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "#FF3B6B" }} />
                      <span className="text-xs" style={{ color: "#6B7280" }}>Collected</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "#FF3B6B", opacity: 0.15 }} />
                      <span className="text-xs" style={{ color: "#6B7280" }}>Billed</span>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </div>

          {/* ── Branch Breakdown ── */}
          <Card>
            <SectionHeader title="Branch Breakdown" sub="Performance per branch for selected period" />
            <div className="divide-y divide-gray-100">
              {data.branchStats.map(branch => {
                const rate = branch.revenue > 0 ? Math.round((branch.paid / branch.revenue) * 100) : 0;
                return (
                  <div key={branch.id} className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold" style={{ color: "#111827" }}>{branch.name}</p>
                          {branch.isDefault && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                              style={{ background: "#F3F4F6", color: "#6B7280" }}>Default</span>
                          )}
                          {!branch.isDefault && !branch.isApproved && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                              style={{ background: "#FEF9C3", color: "#A16207" }}>Pending approval</span>
                          )}
                          {!branch.isActive && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                              style={{ background: "#FEF2F2", color: "#B91C1C" }}>Inactive</span>
                          )}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                          {branch.city}{branch.area ? `, ${branch.area}` : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold" style={{ color: "#111827" }}>{fmtRs(branch.revenue)}</p>
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>billed</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-3 text-center">
                      {[
                        { label: "Collected", value: fmtRs(branch.paid) },
                        { label: "Confirmed", value: String(branch.confirmed) },
                        { label: "Pending",   value: String(branch.pending) },
                        { label: "Inquiries", value: String(branch.inquiries) },
                      ].map(col => (
                        <div key={col.label} className="rounded-lg py-2.5" style={{ background: "#F9FAFB" }}>
                          <p className="text-xs font-semibold" style={{ color: "#111827" }}>{col.value}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>{col.label}</p>
                        </div>
                      ))}
                    </div>

                    {branch.revenue > 0 && (
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px]" style={{ color: "#9CA3AF" }}>Collection rate</span>
                          <span className="text-[10px] font-semibold" style={{ color: "#374151" }}>{rate}%</span>
                        </div>
                        <div className="w-full h-1 rounded-full" style={{ background: "#F3F4F6" }}>
                          <div className="h-1 rounded-full"
                            style={{ width: `${Math.min(100, rate)}%`, background: "#FF3B6B" }} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* ── Upcoming Events ── */}
          {data.upcoming.length > 0 && (
            <Card>
              <SectionHeader title="Upcoming Events" sub="Next 30 days — all branches" />
              <div className="divide-y divide-gray-100">
                {data.upcoming.map(b => {
                  const daysLeft = Math.ceil((new Date(b.date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
                  const dateObj  = new Date(b.date);
                  return (
                    <div key={b.id} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5">
                      <div className="w-9 shrink-0 text-center">
                        <p className="text-base font-bold leading-none" style={{ color: "#111827" }}>{dateObj.getDate()}</p>
                        <p className="text-[10px] font-medium mt-0.5 uppercase tracking-wide" style={{ color: "#9CA3AF" }}>
                          {dateObj.toLocaleDateString("en-PK", { month: "short" })}
                        </p>
                      </div>
                      <div className="w-px h-8 shrink-0" style={{ background: "#F3F4F6" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "#111827" }}>{b.customerName}</p>
                        <p className="text-xs truncate" style={{ color: "#6B7280" }}>
                          {b.event}{b.hall ? ` · ${b.hall}` : ""}
                        </p>
                        <p className="text-[11px]" style={{ color: "#9CA3AF" }}>{b.branchName}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold" style={{ color: "#111827" }}>{fmtRs(b.amount)}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: daysLeft <= 3 ? "#DC2626" : "#9CA3AF" }}>
                          {daysLeft === 0 ? "Today" : daysLeft === 1 ? "Tomorrow" : `in ${daysLeft}d`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

        </div>
      )}
    </div>
  );
}
