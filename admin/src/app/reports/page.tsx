"use client";

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";

const API      = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5510";
const PRIMARY  = "#FF3B6B";
const BLUE     = "#3B82F6";
const ORANGE   = "#F97316";

const TYPE_COLORS: Record<string, string> = {
  "Banquet Hall": PRIMARY,
  "Marquee":      BLUE,
  "Ballroom":     "#7C3AED",
  "Wedding Lawn": "#22C55E",
  "Other":        "#F59E0B",
};

const TYPE_BADGE: Record<string, string> = {
  "Banquet Hall": "#FFF0F4",
  "Marquee":      "#EFF6FF",
  "Ballroom":     "#F5F3FF",
  "Wedding Lawn": "#F0FDF4",
};

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  Completed: { bg: "#F0FDF4", color: "#16A34A" },
  Pending:   { bg: "#FFF7ED", color: "#D97706" },
  Cancelled: { bg: "#FEF2F2", color: "#DC2626" },
};

// Mock transactions only
const MOCK_TRANSACTIONS = [
  { id: "TXN-001", venue: "Grand Marquee", customer: "Ali Hassan",    amount: 120000, date: "2026-08-15", status: "Completed" },
  { id: "TXN-002", venue: "Royal Banquet", customer: "Sara Ahmed",    amount: 85000,  date: "2026-08-14", status: "Completed" },
  { id: "TXN-003", venue: "Pearl Halls",   customer: "Usman Khan",    amount: 200000, date: "2026-08-13", status: "Pending"   },
  { id: "TXN-004", venue: "Serena Lawn",   customer: "Fatima Malik",  amount: 75000,  date: "2026-08-12", status: "Completed" },
  { id: "TXN-005", venue: "Fiza Marquee",  customer: "Bilal Qureshi", amount: 60000,  date: "2026-08-11", status: "Cancelled" },
];

const RANGE_OPTIONS = [
  { label: "Last 7 days",  value: "7d"  },
  { label: "Last 30 days", value: "30d" },
  { label: "3 Months",     value: "3m"  },
  { label: "1 Year",       value: "1y"  },
];

type Stats    = { totalRevenue: number; totalBookings: number; totalVenues: number; avgBookingValue: number };
type Monthly  = { month: string; bookings: number; revenue: number };
type ByType   = { name: string; value: number };
type ByCity   = { city: string; bookings: number };
type TopVenue = { id: string; name: string; city: string; type: string; bookings: number; revenue: number };

function fmt(n: number) {
  if (n >= 1_000_000) return `Rs ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `Rs ${(n / 1_000).toFixed(0)}K`;
  return `Rs ${n}`;
}

function StatCard({ label, value, sub, icon, color }: {
  label: string; value: string; sub: string; icon: React.ReactNode; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border p-5 flex items-start gap-4" style={{ borderColor: "#E5E7EB" }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: color + "18" }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: "#9CA3AF" }}>{label}</p>
        <p className="text-2xl font-black text-black leading-none">{value}</p>
        <p className="text-xs mt-1" style={{ color: "#6B7280" }}>{sub}</p>
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label, isRevenue }: {
  active?: boolean; payload?: { value: number; name: string; color: string }[];
  label?: string; isRevenue?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl border px-3 py-2.5 shadow-lg" style={{ borderColor: "#E5E7EB" }}>
      <p className="text-xs font-semibold mb-1" style={{ color: "#374151" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs font-medium" style={{ color: p.color }}>
          {p.name}: {isRevenue ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: PRIMARY, borderTopColor: "transparent" }} />
    </div>
  );
}

export default function ReportsPage() {
  const [range,      setRange]      = useState("1y");
  const [loading,    setLoading]    = useState(true);
  const [stats,      setStats]      = useState<Stats>({ totalRevenue: 0, totalBookings: 0, totalVenues: 0, avgBookingValue: 0 });
  const [monthly,    setMonthly]    = useState<Monthly[]>([]);
  const [byType,     setByType]     = useState<ByType[]>([]);
  const [byCity,     setByCity]     = useState<ByCity[]>([]);
  const [topVenues,  setTopVenues]  = useState<TopVenue[]>([]);

  useEffect(() => {
    fetchReports(range);
  }, [range]);

  async function fetchReports(r: string) {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/admin/reports?range=${r}`, { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setMonthly(data.monthly);
        setByType(data.byType.map((t: ByType) => ({ ...t, color: TYPE_COLORS[t.name] ?? "#9CA3AF" })));
        setByCity(data.byCity);
        setTopVenues(data.topVenues);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 min-h-screen" style={{ background: "#F9FAFB" }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-black">Reports</h1>
          <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>Platform analytics & performance overview</p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "#F3F4F6" }}>
          {RANGE_OPTIONS.map(r => (
            <button key={r.value} onClick={() => setRange(r.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: range === r.value ? "#fff" : "transparent",
                color:      range === r.value ? "#111827" : "#6B7280",
                boxShadow:  range === r.value ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Revenue"      value={fmt(stats.totalRevenue)}   sub="Sum of paid amounts"   color={PRIMARY}   icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>} />
            <StatCard label="Total Bookings"     value={stats.totalBookings.toString()} sub="Confirmed + pending" color={BLUE}   icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>} />
            <StatCard label="Active Venues"      value={stats.totalVenues.toString()}   sub="Across all cities"   color="#22C55E" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/></svg>} />
            <StatCard label="Avg. Booking Value" value={fmt(stats.avgBookingValue)}  sub="Per booking"            color="#7C3AED" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>} />
          </div>

          {/* Bookings & Revenue Charts */}
          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E5E7EB" }}>
              <p className="font-bold text-black mb-0.5">Bookings Over Time</p>
              <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>Monthly confirmed bookings</p>
              {monthly.length === 0 ? (
                <p className="text-sm text-center py-12" style={{ color: "#9CA3AF" }}>No booking data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={monthly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="bookGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={PRIMARY} stopOpacity={0.18} />
                        <stop offset="95%" stopColor={PRIMARY} stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="bookings" name="Bookings" stroke={PRIMARY} strokeWidth={2.5}
                      fill="url(#bookGrad)" dot={false} activeDot={{ r: 5, fill: PRIMARY }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E5E7EB" }}>
              <p className="font-bold text-black mb-0.5">Revenue Over Time</p>
              <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>Monthly revenue (paid amounts) in PKR</p>
              {monthly.length === 0 ? (
                <p className="text-sm text-center py-12" style={{ color: "#9CA3AF" }}>No revenue data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthly} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false}
                      tickFormatter={v => v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}M` : `${(v/1000).toFixed(0)}K`} />
                    <Tooltip content={<ChartTooltip isRevenue />} />
                    <Bar dataKey="revenue" name="Revenue" fill={BLUE} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Venue Type & City Charts */}
          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E5E7EB" }}>
              <p className="font-bold text-black mb-0.5">Bookings by Venue Type</p>
              <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>Distribution across categories</p>
              {byType.length === 0 ? (
                <p className="text-sm text-center py-12" style={{ color: "#9CA3AF" }}>No data yet.</p>
              ) : (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie data={byType} dataKey="value" cx="50%" cy="50%"
                        innerRadius={50} outerRadius={80} paddingAngle={3}>
                        {byType.map((entry, i) => (
                          <Cell key={i} fill={(entry as ByType & { color?: string }).color ?? TYPE_COLORS[entry.name] ?? "#9CA3AF"} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => [v, "bookings"]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-2.5">
                    {byType.map((item, i) => {
                      const color = (item as ByType & { color?: string }).color ?? TYPE_COLORS[item.name] ?? "#9CA3AF";
                      const total = byType.reduce((s, t) => s + t.value, 0);
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
                          <span className="text-xs font-medium" style={{ color: "#374151" }}>{item.name}</span>
                          <span className="text-xs font-bold ml-auto" style={{ color: "#111827" }}>
                            {total > 0 ? Math.round((item.value / total) * 100) : 0}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E5E7EB" }}>
              <p className="font-bold text-black mb-0.5">Bookings by City</p>
              <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>Top performing cities</p>
              {byCity.length === 0 ? (
                <p className="text-sm text-center py-12" style={{ color: "#9CA3AF" }}>No data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={byCity} layout="vertical" margin={{ top: 0, right: 16, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="city" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="bookings" name="Bookings" fill={ORANGE} radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top Venues Table */}
          <div className="bg-white rounded-2xl border mb-4 overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: "#F3F4F6" }}>
              <p className="font-bold text-black">Top Performing Venues</p>
              <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>Ranked by total bookings in selected period</p>
            </div>
            {topVenues.length === 0 ? (
              <p className="text-sm text-center py-12" style={{ color: "#9CA3AF" }}>No venue data yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>#</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Venue</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide hidden md:table-cell" style={{ color: "#9CA3AF" }}>Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide hidden sm:table-cell" style={{ color: "#9CA3AF" }}>City</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Bookings</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wide hidden lg:table-cell" style={{ color: "#9CA3AF" }}>Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topVenues.map((v, i) => (
                    <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
                          style={{ background: i === 0 ? "#FFF0F4" : "#F9FAFB", color: i === 0 ? PRIMARY : "#9CA3AF" }}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-black">{v.name}</td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: TYPE_BADGE[v.type] ?? "#F3F4F6", color: "#374151" }}>
                          {v.type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell text-sm" style={{ color: "#6B7280" }}>{v.city}</td>
                      <td className="px-4 py-3.5 text-right font-bold" style={{ color: PRIMARY }}>{v.bookings}</td>
                      <td className="px-5 py-3.5 text-right text-sm font-semibold hidden lg:table-cell" style={{ color: "#374151" }}>{fmt(v.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Recent Transactions (mock) */}
          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#F3F4F6" }}>
              <div>
                <p className="font-bold text-black">Recent Transactions</p>
                <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>Sample data — payment integration coming soon</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "#FFF7ED", color: "#D97706" }}>
                Mock
              </span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Venue</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide hidden md:table-cell" style={{ color: "#9CA3AF" }}>Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide hidden sm:table-cell" style={{ color: "#9CA3AF" }}>Date</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Amount</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {MOCK_TRANSACTIONS.map(tx => {
                  const s = STATUS_STYLE[tx.status];
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs" style={{ color: "#9CA3AF" }}>{tx.id}</td>
                      <td className="px-4 py-3.5 font-semibold text-black">{tx.venue}</td>
                      <td className="px-4 py-3.5 hidden md:table-cell" style={{ color: "#6B7280" }}>{tx.customer}</td>
                      <td className="px-4 py-3.5 hidden sm:table-cell text-xs" style={{ color: "#9CA3AF" }}>{tx.date}</td>
                      <td className="px-4 py-3.5 text-right font-bold text-black">{fmt(tx.amount)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: s.bg, color: s.color }}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
