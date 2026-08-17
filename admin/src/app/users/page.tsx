"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const API     = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5510";
const PRIMARY = "#FF3B6B";

type UserRow = {
  id:           string;
  name:         string;
  email:        string;
  city:         string | null;
  businessType: string | null;
  isVerified?:  boolean;
  isBlocked:    boolean;
  logoUrl?:     string | null;
  avatarUrl?:   string | null;
  createdAt:    string;
  _type:        "vendor" | "user";
};

type Stats = { total: number; totalVendors: number; totalUsers: number; totalBlocked: number };
type Pagination = { page: number; total: number; totalPages: number };

type Tab = "all" | "vendors" | "users";

const TABS: { label: string; value: Tab }[] = [
  { label: "All",               value: "all"     },
  { label: "Vendors",           value: "vendors" },
  { label: "Marketplace Users", value: "users"   },
];

const TYPE_COLOR: Record<string, string> = {
  "Banquet Hall": "#FFF0F4",
  "Marquee":      "#EFF6FF",
  "Ballroom":     "#F5F3FF",
};

function timeAgo(iso: string) {
  const diff  = Date.now() - new Date(iso).getTime();
  const days  = Math.floor(diff / 86_400_000);
  const hours = Math.floor(diff / 3_600_000);
  const mins  = Math.floor(diff / 60_000);
  if (days > 30)  return new Date(iso).toLocaleDateString("en-PK", { dateStyle: "medium" });
  if (days >= 1)  return `${days}d ago`;
  if (hours >= 1) return `${hours}h ago`;
  if (mins >= 1)  return `${mins}m ago`;
  return "Just now";
}

function Avatar({ row }: { row: UserRow }) {
  const url = row._type === "vendor" ? row.logoUrl : row.avatarUrl;
  const bg  = row._type === "vendor" ? "#FFF0F4" : "#EFF6FF";
  const col = row._type === "vendor" ? PRIMARY   : "#3B82F6";
  if (url) {
    return <img src={url} alt={row.name} className="w-9 h-9 rounded-xl object-cover" />;
  }
  return (
    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
      style={{ background: bg, color: col }}>
      {row.name[0]?.toUpperCase()}
    </div>
  );
}

export default function UsersPage() {
  const [tab,        setTab]        = useState<Tab>("all");
  const [rows,       setRows]       = useState<UserRow[]>([]);
  const [stats,      setStats]      = useState<Stats>({ total: 0, totalVendors: 0, totalUsers: 0, totalBlocked: 0 });
  const [pagination, setPagination] = useState<Pagination>({ page: 1, total: 0, totalPages: 1 });
  const [loading,    setLoading]    = useState(true);
  const [q,          setQ]          = useState("");
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [blockTarget,  setBlockTarget]  = useState<UserRow | null>(null);
  const [deleting,     setDeleting]     = useState(false);
  const [blocking,     setBlocking]     = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (page = 1, search = q, currentTab = tab) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), tab: currentTab });
      if (search) params.set("q", search);
      const res  = await fetch(`${API}/api/admin/users?${params}`, { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setRows(data.users);
        setStats(data.stats);
        setPagination(data.pagination);
      }
    } finally { setLoading(false); }
  }, [q, tab]);

  useEffect(() => { load(1, q, tab); }, [tab]);

  function handleSearch(val: string) {
    setQ(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(1, val, tab), 350);
  }

  async function confirmBlock() {
    if (!blockTarget) return;
    setBlocking(true);
    await fetch(`${API}/api/admin/users/${blockTarget.id}/block`, {
      method:      "PATCH",
      credentials: "include",
      headers:     { "Content-Type": "application/json" },
      body:        JSON.stringify({ type: blockTarget._type, blocked: !blockTarget.isBlocked }),
    });
    setRows(prev => prev.map(r => r.id === blockTarget.id ? { ...r, isBlocked: !r.isBlocked } : r));
    setStats(prev => ({
      ...prev,
      totalBlocked: prev.totalBlocked + (blockTarget.isBlocked ? -1 : 1),
    }));
    setBlocking(false);
    setBlockTarget(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`${API}/api/admin/users/${deleteTarget.id}`, {
      method:      "DELETE",
      credentials: "include",
      headers:     { "Content-Type": "application/json" },
      body:        JSON.stringify({ type: deleteTarget._type }),
    });
    setDeleting(false);
    setDeleteTarget(null);
    load(pagination.page);
  }

  const { page, totalPages, total } = pagination;

  return (
    <div className="p-6 min-h-screen" style={{ background: "#F9FAFB" }}>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">Users & Audience</h1>
        <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>All vendors and marketplace users on EventEase</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Users",        value: stats.total,        color: "#111827", bg: "#F3F4F6" },
          { label: "Vendors",            value: stats.totalVendors, color: PRIMARY,   bg: "#FFF0F4" },
          { label: "Marketplace Users",  value: stats.totalUsers,   color: "#3B82F6", bg: "#EFF6FF" },
          { label: "Blocked",            value: stats.totalBlocked, color: "#DC2626", bg: "#FEF2F2" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border p-4" style={{ borderColor: "#E5E7EB" }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#9CA3AF" }}>{s.label}</p>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "#F3F4F6" }}>
          {TABS.map(t => (
            <button key={t.value} onClick={() => { setTab(t.value); }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: tab === t.value ? "#fff" : "transparent",
                color:      tab === t.value ? "#111827" : "#6B7280",
                boxShadow:  tab === t.value ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border ml-auto"
          style={{ borderColor: "#E5E7EB", minWidth: 220 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={q} onChange={e => handleSearch(e.target.value)}
            placeholder="Search name or email…"
            className="flex-1 text-sm outline-none bg-transparent"
            style={{ color: "#111827" }} />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 border-2 rounded-full animate-spin"
              style={{ borderColor: PRIMARY, borderTopColor: "transparent" }} />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#F3F4F6" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <p className="font-semibold text-black mb-1">No users found</p>
            <p className="text-sm" style={{ color: "#9CA3AF" }}>
              {q ? "Try a different search term." : "No users have joined yet."}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide hidden md:table-cell" style={{ color: "#9CA3AF" }}>Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide hidden lg:table-cell" style={{ color: "#9CA3AF" }}>City</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide hidden sm:table-cell" style={{ color: "#9CA3AF" }}>Joined</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  {/* Name + avatar */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar row={row} />
                      <div className="min-w-0">
                        <p className="font-semibold text-black truncate">{row.name}</p>
                        <p className="text-xs md:hidden truncate" style={{ color: "#9CA3AF" }}>{row.email}</p>
                      </div>
                    </div>
                  </td>
                  {/* Email */}
                  <td className="px-4 py-3.5 hidden md:table-cell text-sm truncate max-w-[180px]" style={{ color: "#6B7280" }}>
                    {row.email}
                  </td>
                  {/* Type */}
                  <td className="px-4 py-3.5">
                    {row._type === "vendor" ? (
                      <div className="flex flex-col gap-1">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold w-fit"
                          style={{ background: "#FFF0F4", color: PRIMARY }}>
                          Vendor
                        </span>
                        {row.businessType && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium w-fit hidden lg:inline-flex"
                            style={{ background: TYPE_COLOR[row.businessType] ?? "#F3F4F6", color: "#374151" }}>
                            {row.businessType}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: "#EFF6FF", color: "#3B82F6" }}>
                        Customer
                      </span>
                    )}
                  </td>
                  {/* City */}
                  <td className="px-4 py-3.5 hidden lg:table-cell text-sm" style={{ color: "#6B7280" }}>
                    {row.city ?? "—"}
                  </td>
                  {/* Joined */}
                  <td className="px-4 py-3.5 hidden sm:table-cell text-xs" style={{ color: "#9CA3AF" }}>
                    {timeAgo(row.createdAt)}
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: row.isBlocked ? "#DC2626" : "#22C55E" }} />
                      <span className="text-xs font-medium" style={{ color: row.isBlocked ? "#DC2626" : "#22C55E" }}>
                        {row.isBlocked ? "Blocked" : "Active"}
                      </span>
                    </div>
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setBlockTarget(row)}
                        title={row.isBlocked ? "Unblock" : "Block"}
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                        style={{ color: row.isBlocked ? "#22C55E" : "#F59E0B" }}
                        onMouseEnter={e => (e.currentTarget.style.background = row.isBlocked ? "#F0FDF4" : "#FFFBEB")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        {row.isBlocked ? (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                            <path d="M8 12l3 3 5-5"/>
                          </svg>
                        ) : (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                          </svg>
                        )}
                      </button>
                      <button onClick={() => setDeleteTarget(row)}
                        title="Delete"
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                        style={{ color: "#DC2626" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#FEF2F2")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: "#F3F4F6" }}>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>
              Page {page} of {totalPages} · {total} results
            </p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => load(page - 1)} disabled={page === 1}
                className="w-8 h-8 rounded-xl flex items-center justify-center border transition-colors disabled:opacity-40 cursor-pointer hover:bg-gray-50"
                style={{ borderColor: "#E5E7EB" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page - 2 + i;
                if (p < 1 || p > totalPages) return null;
                return (
                  <button key={p} onClick={() => load(p)}
                    className="w-8 h-8 rounded-xl text-xs font-semibold border cursor-pointer"
                    style={{ background: p === page ? PRIMARY : "#fff", color: p === page ? "#fff" : "#374151", borderColor: p === page ? PRIMARY : "#E5E7EB" }}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => load(page + 1)} disabled={page === totalPages}
                className="w-8 h-8 rounded-xl flex items-center justify-center border transition-colors disabled:opacity-40 cursor-pointer hover:bg-gray-50"
                style={{ borderColor: "#E5E7EB" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Block/Unblock Confirmation Modal */}
      {blockTarget && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => !blocking && setBlockTarget(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: blockTarget.isBlocked ? "#F0FDF4" : "#FFFBEB" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                  stroke={blockTarget.isBlocked ? "#16A34A" : "#D97706"} strokeWidth="2" strokeLinecap="round">
                  {blockTarget.isBlocked
                    ? <><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/><path d="M8 12l3 3 5-5"/></>
                    : <><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></>
                  }
                </svg>
              </div>
              <h3 className="text-base font-bold text-black text-center mb-1">
                {blockTarget.isBlocked ? "Unblock User?" : "Block User?"}
              </h3>
              <p className="text-sm text-center mb-1" style={{ color: "#374151" }}>
                <span className="font-semibold">{blockTarget.name}</span>
              </p>
              <p className="text-xs text-center mb-6" style={{ color: "#9CA3AF" }}>
                {blockTarget.isBlocked
                  ? "This user will be able to access the platform again."
                  : "This user will be prevented from accessing the platform."}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setBlockTarget(null)} disabled={blocking}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold border cursor-pointer"
                  style={{ borderColor: "#E5E7EB", color: "#374151" }}>Cancel</button>
                <button onClick={confirmBlock} disabled={blocking}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer"
                  style={{ background: blockTarget.isBlocked ? "#16A34A" : "#D97706", opacity: blocking ? 0.6 : 1 }}>
                  {blocking ? "Please wait…" : blockTarget.isBlocked ? "Unblock" : "Block"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#FEF2F2" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                </svg>
              </div>
              <h3 className="text-base font-bold text-black text-center mb-1">Delete User?</h3>
              <p className="text-sm text-center mb-1" style={{ color: "#374151" }}>
                <span className="font-semibold">{deleteTarget.name}</span>
              </p>
              <p className="text-xs text-center mb-6" style={{ color: "#9CA3AF" }}>
                This will permanently delete this {deleteTarget._type === "vendor" ? "vendor and all their data" : "user"}. Cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold border cursor-pointer"
                  style={{ borderColor: "#E5E7EB", color: "#374151" }}>Cancel</button>
                <button onClick={confirmDelete} disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer"
                  style={{ background: "#DC2626", opacity: deleting ? 0.6 : 1 }}>
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
