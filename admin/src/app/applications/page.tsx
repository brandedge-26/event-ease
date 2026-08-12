"use client";

import { useEffect, useState, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5510";
const PRIMARY = "#FF3B6B";

type Application = {
  id: string; name: string; email: string;
  subject: string; message: string; isRead: boolean; createdAt: string;
};

const SUBJECT_LABELS: Record<string, string> = {
  venue_listing: "Venue Listing", booking: "Booking Support",
  partnership: "Partnership", technical: "Technical Issue", other: "Other",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ApplicationsPage() {
  const [rows,       setRows]       = useState<Application[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);
  const [selected,   setSelected]   = useState<Application | null>(null);
  const [deleteId,   setDeleteId]   = useState<string | null>(null);
  const [deleting,   setDeleting]   = useState(false);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/admin/applications?page=${p}`, { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setRows(data.applications);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(page); }, [page, load]);

  async function openDrawer(app: Application) {
    setSelected(app);
    if (!app.isRead) {
      await fetch(`${API}/api/admin/applications/${app.id}/read`, { method: "PATCH", credentials: "include" });
      setRows(r => r.map(a => a.id === app.id ? { ...a, isRead: true } : a));
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    await fetch(`${API}/api/admin/applications/${deleteId}`, { method: "DELETE", credentials: "include" });
    setDeleting(false);
    setDeleteId(null);
    if (selected?.id === deleteId) setSelected(null);
    load(page);
  }

  const unread = rows.filter(r => !r.isRead).length;

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-black">Applications</h1>
          <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
            {total} total
            {unread > 0 && <span className="font-semibold ml-1" style={{ color: PRIMARY }}>{unread} unread</span>}
          </p>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: PRIMARY, borderTopColor: "transparent" }} />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#F3F4F6" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
                <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/>
              </svg>
            </div>
            <p className="font-semibold text-black mb-1">No applications yet</p>
            <p className="text-sm" style={{ color: "#9CA3AF" }}>Contact form submissions will appear here.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "#F3F4F6", background: "#FAFAFA" }}>
                <th className="px-4 py-3 w-6" />
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide hidden md:table-cell" style={{ color: "#9CA3AF" }}>Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide hidden lg:table-cell" style={{ color: "#9CA3AF" }}>Subject</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide hidden sm:table-cell" style={{ color: "#9CA3AF" }}>Received</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(app => (
                <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3.5 w-6">
                    {!app.isRead && <span className="block w-2 h-2 rounded-full" style={{ background: PRIMARY }} />}
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-black">{app.name}</p>
                    <p className="text-xs mt-0.5 md:hidden" style={{ color: "#9CA3AF" }}>{app.email}</p>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell" style={{ color: "#374151" }}>{app.email}</td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "#F3F4F6", color: "#374151" }}>
                      {SUBJECT_LABELS[app.subject] ?? app.subject}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell text-xs" style={{ color: "#9CA3AF" }}>{timeAgo(app.createdAt)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openDrawer(app)} title="View"
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-blue-50 cursor-pointer"
                        style={{ color: "#2563EB" }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                      <button onClick={() => setDeleteId(app.id)} title="Delete"
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-red-50 cursor-pointer"
                        style={{ color: "#DC2626" }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: "#F3F4F6" }}>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>Page {page} of {totalPages}</p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="w-8 h-8 rounded-xl flex items-center justify-center border transition-colors hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                style={{ borderColor: "#E5E7EB" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className="w-8 h-8 rounded-xl text-xs font-semibold border transition-colors cursor-pointer"
                  style={{ background: p === page ? PRIMARY : "#fff", color: p === page ? "#fff" : "#374151", borderColor: p === page ? PRIMARY : "#E5E7EB" }}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="w-8 h-8 rounded-xl flex items-center justify-center border transition-colors hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                style={{ borderColor: "#E5E7EB" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {selected && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setSelected(null)} />
          <div className="fixed right-0 top-0 h-full z-50 w-full max-w-md bg-white shadow-2xl flex flex-col"
            style={{ animation: "slideUp .25s ease" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#F3F4F6" }}>
              <h2 className="font-bold text-black text-base">Application Detail</h2>
              <button onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 cursor-pointer" style={{ color: "#6B7280" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: "#F9FAFB" }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-white text-base shrink-0"
                  style={{ background: "linear-gradient(135deg, #FF3B6B, #FF8FA3)" }}>
                  {selected.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-black">{selected.name}</p>
                  <p className="text-sm" style={{ color: "#6B7280" }}>{selected.email}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "#9CA3AF" }}>Subject</p>
                <span className="px-3 py-1.5 rounded-xl text-sm font-semibold inline-block" style={{ background: "#F3F4F6", color: "#374151" }}>
                  {SUBJECT_LABELS[selected.subject] ?? selected.subject}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "#9CA3AF" }}>Message</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap p-4 rounded-2xl" style={{ background: "#F9FAFB", color: "#374151" }}>
                  {selected.message}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#9CA3AF" }}>Received</p>
                <p className="text-sm" style={{ color: "#374151" }}>
                  {new Date(selected.createdAt).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
            </div>
            <div className="px-5 py-4 border-t flex gap-3" style={{ borderColor: "#F3F4F6" }}>
              <a href={`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(selected.email)}&su=${encodeURIComponent(`Re: ${SUBJECT_LABELS[selected.subject] ?? selected.subject}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: PRIMARY }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                Reply via Email
              </a>
              <button onClick={() => { setDeleteId(selected.id); setSelected(null); }}
                className="px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors hover:bg-red-50 cursor-pointer"
                style={{ borderColor: "#FCA5A5", color: "#DC2626" }}>
                Delete
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => !deleting && setDeleteId(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#FEF2F2" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                </svg>
              </div>
              <h3 className="text-base font-bold text-black text-center mb-1">Delete Application?</h3>
              <p className="text-sm text-center mb-6" style={{ color: "#6B7280" }}>This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold border cursor-pointer"
                  style={{ borderColor: "#E5E7EB", color: "#374151" }}>Cancel</button>
                <button onClick={confirmDelete} disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer transition-opacity"
                  style={{ background: "#DC2626", opacity: deleting ? 0.6 : 1 }}>
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
