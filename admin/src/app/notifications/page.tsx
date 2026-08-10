"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5510";

function adminFetch(path: string, opts: RequestInit = {}) {
  return fetch(`${API_BASE}/api${path}`, {
    ...opts,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts.headers ?? {}) },
  });
}

type Notification = {
  id:        string;
  type:      string;
  title:     string;
  body:      string;
  isRead:    boolean;
  refId:     string | null;
  createdAt: string;
};

type Pagination = { page: number; pageSize: number; total: number; totalPages: number };

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 1)   return "Just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

const TYPE_ICON: Record<string, { bg: string; stroke: string; path: React.ReactNode }> = {
  new_vendor: {
    bg:     "#FFF0F4",
    stroke: "#FF3B6B",
    path:   <><rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/></>,
  },
  default: {
    bg:     "#EFF6FF",
    stroke: "#2563EB",
    path:   <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
  },
};

function NotifIcon({ type }: { type: string }) {
  const cfg = TYPE_ICON[type] ?? TYPE_ICON.default;
  return (
    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
      style={{ background: cfg.bg }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke={cfg.stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {cfg.path}
      </svg>
    </div>
  );
}

function buildPages(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (page > 3) pages.push("…");
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
  if (page < totalPages - 2) pages.push("…");
  pages.push(totalPages);
  return pages;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [items,      setItems]      = useState<Notification[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [loading,    setLoading]    = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => { fetchPage(1); }, []);

  async function fetchPage(page: number) {
    setLoading(true);
    try {
      const res  = await adminFetch(`/admin/notifications?page=${page}`);
      const data = await res.json();
      if (data.success) { setItems(data.notifications); setPagination(data.pagination); }
    } finally { setLoading(false); }
  }

  async function markRead(id: string) {
    await adminFetch(`/admin/notifications/${id}/read`, { method: "PATCH" });
    setItems(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }

  async function markAllRead() {
    setMarkingAll(true);
    await adminFetch("/admin/notifications/read-all", { method: "PATCH" });
    setItems(prev => prev.map(n => ({ ...n, isRead: true })));
    setMarkingAll(false);
  }

  async function deleteNotif(id: string) {
    await adminFetch(`/admin/notifications/${id}`, { method: "DELETE" });
    const newTotal      = pagination.total - 1;
    const newTotalPages = Math.max(1, Math.ceil(newTotal / pagination.pageSize));
    fetchPage(pagination.page > newTotalPages ? newTotalPages : pagination.page);
  }

  async function handleClick(n: Notification) {
    if (!n.isRead) await markRead(n.id);
    if (n.type === "new_vendor" && n.refId) router.push("/vendors");
  }

  const unread = items.filter(n => !n.isRead).length;
  const { page, totalPages, total } = pagination;

  return (
    <div className="p-6 min-h-screen" style={{ background: "#F9FAFB" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-black">Notifications</h1>
          <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
            {total} total {unread > 0 && `· ${unread} unread`}
          </p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} disabled={markingAll}
            className="px-4 py-2 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50"
            style={{ borderColor: "#E5E7EB", color: "#374151", opacity: markingAll ? 0.6 : 1 }}>
            {markingAll ? "Marking…" : "Mark all as read"}
          </button>
        )}
      </div>

      {/* List */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: "#fff", borderColor: "#E5E7EB" }}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 px-5 py-4 border-b animate-pulse" style={{ borderColor: "#F3F4F6" }}>
              <div className="w-10 h-10 rounded-xl shrink-0" style={{ background: "#F3F4F6" }} />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 rounded-md" style={{ background: "#F3F4F6" }} />
                <div className="h-3 w-full rounded-md" style={{ background: "#F3F4F6" }} />
              </div>
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#F3F4F6" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <p className="text-sm" style={{ color: "#9CA3AF" }}>No notifications yet.</p>
          </div>
        ) : (
          items.map((n, idx) => (
            <div key={n.id}
              className="flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-gray-50"
              style={{
                borderBottom: idx < items.length - 1 ? "1px solid #F3F4F6" : "none",
                background: n.isRead ? "#fff" : "#FFFBFB",
              }}
              onClick={() => handleClick(n)}>
              {/* Icon */}
              <NotifIcon type={n.type} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-black">{n.title}</p>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#FF3B6B" }} />
                  )}
                </div>
                <p className="text-sm mt-0.5 leading-relaxed" style={{ color: "#6B7280" }}>{n.body}</p>
                <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>{timeAgo(n.createdAt)}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                {!n.isRead && (
                  <button onClick={() => markRead(n.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
                    title="Mark as read">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </button>
                )}
                <button onClick={() => deleteNotif(n.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-red-50"
                  title="Delete">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/>
                    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <p className="text-sm" style={{ color: "#6B7280" }}>Page {page} of {totalPages} · {total} notifications</p>
          <div className="flex items-center gap-1">
            <button onClick={() => fetchPage(page - 1)} disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border"
              style={{ borderColor: "#E5E7EB", color: page <= 1 ? "#D1D5DB" : "#374151", background: "#fff", cursor: page <= 1 ? "not-allowed" : "pointer" }}>
              ← Prev
            </button>
            {buildPages(page, totalPages).map((p, i) =>
              p === "…" ? (
                <span key={`e${i}`} className="px-2 text-sm" style={{ color: "#9CA3AF" }}>…</span>
              ) : (
                <button key={p} onClick={() => fetchPage(p as number)}
                  className="w-8 h-8 rounded-lg text-sm font-medium"
                  style={{ background: p === page ? "#FF3B6B" : "#fff", color: p === page ? "#fff" : "#374151", border: p === page ? "none" : "1px solid #E5E7EB" }}>
                  {p}
                </button>
              )
            )}
            <button onClick={() => fetchPage(page + 1)} disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border"
              style={{ borderColor: "#E5E7EB", color: page >= totalPages ? "#D1D5DB" : "#374151", background: "#fff", cursor: page >= totalPages ? "not-allowed" : "pointer" }}>
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
