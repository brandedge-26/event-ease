"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

type Notif = {
  id:        string;
  type:      string;
  title:     string;
  body:      string;
  isRead:    boolean;
  link:      string | null;
  refId:     string | null;
  createdAt: string;
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7)  return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-PK", { day: "numeric", month: "short" });
}

function NotifIcon({ type }: { type: string }) {
  if (type === "inquiry")
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>;
  if (type === "booking")
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>;
  if (type === "review")
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
}

function iconBg(type: string) {
  if (type === "inquiry") return { bg: "#EFF6FF", color: "#3B82F6" };
  if (type === "booking")  return { bg: "#F0FDF4", color: "#22C55E" };
  if (type === "review")   return { bg: "#FFFBEB", color: "#F59E0B" };
  return { bg: "#F5F3FF", color: "#8B5CF6" };
}

export default function NotificationsPage() {
  const { accessToken } = useAuthStore();
  const router = useRouter();
  const [notifs,   setNotifs]   = useState<Notif[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [marking,  setMarking]  = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get("/api/vendor/notifications", accessToken ?? undefined);
      if (data.success) setNotifs((data as { success: boolean; notifications: Notif[] }).notifications);
    } finally {
      setLoading(false);
    }
  }

  async function markAllRead() {
    setMarking(true);
    try {
      await api.patch("/api/vendor/notifications/read-all", {}, accessToken ?? undefined);
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    } finally {
      setMarking(false);
    }
  }

  async function handleClick(n: Notif) {
    if (!n.isRead) {
      await api.patch(`/api/vendor/notifications/${n.id}/read`, {}, accessToken ?? undefined);
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
    }
    if (n.link) router.push(n.link);
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    await api.delete(`/api/vendor/notifications/${id}`, accessToken ?? undefined);
    setNotifs(prev => prev.filter(n => n.id !== id));
  }

  const unreadCount = notifs.filter(n => !n.isRead).length;

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 max-w-3xl">
        <div>
          <h1 className="text-xl font-bold text-black">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} disabled={marking}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50"
            style={{ borderColor: "#E5E7EB", color: "#374151" }}>
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-[3px] animate-spin" style={{ borderColor: "var(--primary-light)", borderTopColor: "var(--primary)" }} />
        </div>
      ) : notifs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "#F3F4F6" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
          </div>
          <p className="text-sm font-semibold text-black">No notifications yet</p>
          <p className="text-xs" style={{ color: "#9CA3AF" }}>You&apos;ll see inquiry alerts and updates here</p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden max-w-3xl" style={{ background: "#fff", borderColor: "#E5E7EB" }}>
          {notifs.map((n, i) => {
            const { bg, color } = iconBg(n.type);
            return (
              <div key={n.id}
                onClick={() => handleClick(n)}
                className="flex items-start gap-4 px-4 py-4 transition-colors cursor-pointer"
                style={{
                  background:   n.isRead ? "transparent" : "#FAFBFF",
                  borderTop:    i === 0 ? "none" : "1px solid #F3F4F6",
                }}>
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg, color }}>
                  <NotifIcon type={n.type} />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold leading-tight" style={{ color: n.isRead ? "#374151" : "#111827" }}>
                      {n.title}
                    </p>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: "var(--primary)" }} />
                    )}
                  </div>
                  <p className="text-xs mt-0.5 leading-snug" style={{ color: "#6B7280" }}>{n.body}</p>
                  <p className="text-[11px] mt-1.5 font-medium" style={{ color: "#9CA3AF" }}>{timeAgo(n.createdAt)}</p>
                </div>

                {/* Delete */}
                <button
                  onClick={(e) => handleDelete(e, n.id)}
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                  style={{ color: "#9CA3AF" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
