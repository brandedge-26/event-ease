"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5510";

// ─── Types ────────────────────────────────────────────────────────────────────
type Review = {
  id:         string;
  name:       string;
  rating:     number;
  text:       string;
  createdAt:  string;
  vendorId:   string;
  vendorName: string | null;
  vendorSlug: string | null;
};

type VendorOption = { id: string; name: string };
type Pagination   = { page: number; pageSize: number; total: number; totalPages: number };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function adminFetch(path: string, opts: RequestInit = {}) {
  return fetch(`${API_BASE}/api${path}`, {
    ...opts,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts.headers ?? {}) },
  });
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= rating ? "#F59E0B" : "none"}
          stroke={i <= rating ? "#F59E0B" : "#D1D5DB"}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </span>
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

// ─── Star picker ──────────────────────────────────────────────────────────────
function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <span className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}>
          <svg width="22" height="22" viewBox="0 0 24 24"
            fill={(hover || value) >= i ? "#F59E0B" : "none"}
            stroke={(hover || value) >= i ? "#F59E0B" : "#D1D5DB"}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      ))}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ReviewsPage() {
  const [reviews,    setReviews]    = useState<Review[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");

  // Vendor list for add form
  const [vendorList, setVendorList] = useState<VendorOption[]>([]);

  // Add modal
  const [addOpen,  setAddOpen]  = useState(false);
  const [addBusy,  setAddBusy]  = useState(false);
  const [addErr,   setAddErr]   = useState("");
  const [addForm,  setAddForm]  = useState({ vendorId: "", name: "", rating: 5, text: "" });

  // Edit modal
  const [editTarget, setEditTarget] = useState<Review | null>(null);
  const [editBusy,   setEditBusy]   = useState(false);
  const [editErr,    setEditErr]    = useState("");
  const [editForm,   setEditForm]   = useState({ name: "", rating: 5, text: "" });

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);
  const [deleteBusy,   setDeleteBusy]   = useState(false);

  useEffect(() => {
    fetchReviews(1);
    adminFetch("/admin/reviews/vendors")
      .then(r => r.json())
      .then(d => { if (d.success) setVendorList(d.vendors); });
  }, []);

  async function fetchReviews(page: number) {
    setLoading(true);
    setError("");
    try {
      const res  = await adminFetch(`/admin/reviews?page=${page}`);
      const data = await res.json();
      if (data.success) { setReviews(data.reviews); setPagination(data.pagination); }
      else setError(data.message ?? "Failed to load reviews.");
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  }

  // ── Add ────────────────────────────────────────────────────────────────────
  function openAdd() {
    setAddForm({ vendorId: vendorList[0]?.id ?? "", name: "", rating: 5, text: "" });
    setAddErr("");
    setAddOpen(true);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.vendorId || !addForm.name.trim() || !addForm.text.trim()) {
      setAddErr("All fields are required."); return;
    }
    setAddBusy(true); setAddErr("");
    try {
      const res  = await adminFetch("/admin/reviews", { method: "POST", body: JSON.stringify(addForm) });
      const data = await res.json();
      if (data.success) { setAddOpen(false); fetchReviews(1); }
      else setAddErr(data.message ?? "Failed to add review.");
    } catch { setAddErr("Network error."); }
    finally { setAddBusy(false); }
  }

  // ── Edit ───────────────────────────────────────────────────────────────────
  function openEdit(r: Review) {
    setEditTarget(r);
    setEditForm({ name: r.name, rating: r.rating, text: r.text });
    setEditErr("");
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    if (!editForm.name.trim() || !editForm.text.trim()) {
      setEditErr("Name and text are required."); return;
    }
    setEditBusy(true); setEditErr("");
    try {
      const res  = await adminFetch(`/admin/reviews/${editTarget.id}`, { method: "PATCH", body: JSON.stringify(editForm) });
      const data = await res.json();
      if (data.success) {
        setEditTarget(null);
        setReviews(prev => prev.map(r => r.id === editTarget.id ? { ...r, ...editForm } : r));
      } else setEditErr(data.message ?? "Failed to update.");
    } catch { setEditErr("Network error."); }
    finally { setEditBusy(false); }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      const res  = await adminFetch(`/admin/reviews/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setDeleteTarget(null);
        const newTotal      = pagination.total - 1;
        const newTotalPages = Math.max(1, Math.ceil(newTotal / pagination.pageSize));
        fetchReviews(pagination.page > newTotalPages ? newTotalPages : pagination.page);
      }
    } finally { setDeleteBusy(false); }
  }

  const { page, totalPages, total } = pagination;

  return (
    <div className="p-6 min-h-screen" style={{ background: "#F9FAFB" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-black">Reviews</h1>
          <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>All reviews across all vendors</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "#FF3B6B" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Review
        </button>
      </div>

      {/* Table card */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: "#fff", borderColor: "#E5E7EB" }}>
        {/* Column headers */}
        <div className="grid gap-3 px-5 py-3 text-xs font-semibold uppercase tracking-wide border-b"
          style={{ gridTemplateColumns: "1.8fr 2fr 3fr 1fr 1fr 80px", color: "#6B7280", borderColor: "#E5E7EB" }}>
          <span>Reviewer</span>
          <span>Banquet</span>
          <span>Review</span>
          <span>Rating</span>
          <span>Date</span>
          <span className="text-right">Actions</span>
        </div>

        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grid gap-3 px-5 py-4 border-b animate-pulse"
              style={{ gridTemplateColumns: "1.8fr 2fr 3fr 1fr 1fr 80px", borderColor: "#F3F4F6" }}>
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className="h-4 rounded-md" style={{ background: "#F3F4F6" }} />
              ))}
            </div>
          ))
        ) : error ? (
          <div className="py-16 text-center text-sm" style={{ color: "#EF4444" }}>{error}</div>
        ) : reviews.length === 0 ? (
          <div className="py-16 text-center text-sm" style={{ color: "#9CA3AF" }}>No reviews yet.</div>
        ) : (
          reviews.map((r, idx) => (
            <div key={r.id}
              className="grid gap-3 px-5 py-4 items-center hover:bg-gray-50 transition-colors"
              style={{
                gridTemplateColumns: "1.8fr 2fr 3fr 1fr 1fr 80px",
                borderBottom: idx < reviews.length - 1 ? "1px solid #F3F4F6" : "none",
              }}>
              {/* Reviewer */}
              <p className="text-sm font-semibold text-black truncate">{r.name}</p>
              {/* Banquet */}
              <p className="text-sm truncate" style={{ color: "#374151" }}>{r.vendorName ?? "—"}</p>
              {/* Review text */}
              <p className="text-sm truncate" style={{ color: "#6B7280" }}>{r.text}</p>
              {/* Rating */}
              <Stars rating={r.rating} />
              {/* Date */}
              <p className="text-xs" style={{ color: "#9CA3AF" }}>{fmt(r.createdAt)}</p>
              {/* Actions */}
              <div className="flex items-center justify-end gap-1.5">
                {/* Edit */}
                <button onClick={() => openEdit(r)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
                  style={{ background: "#EFF6FF" }} title="Edit">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                {/* Delete */}
                <button onClick={() => setDeleteTarget(r)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
                  style={{ background: "#FEE2E2" }} title="Delete">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
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
      {!loading && !error && totalPages > 0 && (
        <div className="flex items-center justify-between mt-5">
          <p className="text-sm" style={{ color: "#6B7280" }}>Page {page} of {totalPages} · {total} reviews</p>
          <div className="flex items-center gap-1">
            <button onClick={() => fetchReviews(page - 1)} disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border"
              style={{ borderColor: "#E5E7EB", color: page <= 1 ? "#D1D5DB" : "#374151", background: "#fff", cursor: page <= 1 ? "not-allowed" : "pointer" }}>
              ← Prev
            </button>
            {buildPages(page, totalPages).map((p, i) =>
              p === "…" ? (
                <span key={`e${i}`} className="px-2 text-sm" style={{ color: "#9CA3AF" }}>…</span>
              ) : (
                <button key={p} onClick={() => fetchReviews(p as number)}
                  className="w-8 h-8 rounded-lg text-sm font-medium"
                  style={{ background: p === page ? "#FF3B6B" : "#fff", color: p === page ? "#fff" : "#374151", border: p === page ? "none" : "1px solid #E5E7EB" }}>
                  {p}
                </button>
              )
            )}
            <button onClick={() => fetchReviews(page + 1)} disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border"
              style={{ borderColor: "#E5E7EB", color: page >= totalPages ? "#D1D5DB" : "#374151", background: "#fff", cursor: page >= totalPages ? "not-allowed" : "pointer" }}>
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ── Add Review Modal ─────────────────────────────────────────────────── */}
      {addOpen && (
        <Modal onClose={() => !addBusy && setAddOpen(false)}>
          <ModalIcon color="#FFF0F4" stroke="#FF3B6B">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </ModalIcon>
          <p className="text-base font-bold text-black text-center mt-1">Add Review</p>
          <p className="text-sm text-center mt-1 mb-4" style={{ color: "#6B7280" }}>Post a review as admin for any banquet</p>

          <form onSubmit={handleAdd} className="space-y-3 text-left">
            {/* Vendor select */}
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Banquet</label>
              <select
                value={addForm.vendorId}
                onChange={e => setAddForm(f => ({ ...f, vendorId: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                style={{ borderColor: "#E5E7EB", color: "#111827" }}>
                {vendorList.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            {/* Reviewer name */}
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Reviewer Name</label>
              <input
                value={addForm.name}
                onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Ahmed Khan"
                className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                style={{ borderColor: "#E5E7EB", color: "#111827" }} />
            </div>
            {/* Rating */}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: "#374151" }}>Rating</label>
              <StarPicker value={addForm.rating} onChange={n => setAddForm(f => ({ ...f, rating: n }))} />
            </div>
            {/* Text */}
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Review</label>
              <textarea
                value={addForm.text}
                onChange={e => setAddForm(f => ({ ...f, text: e.target.value }))}
                rows={3}
                placeholder="Write the review…"
                className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none resize-none"
                style={{ borderColor: "#E5E7EB", color: "#111827" }} />
            </div>
            {addErr && <p className="text-xs" style={{ color: "#DC2626" }}>{addErr}</p>}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setAddOpen(false)} disabled={addBusy}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
                style={{ borderColor: "#E5E7EB", color: "#374151" }}>
                Cancel
              </button>
              <button type="submit" disabled={addBusy}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "#FF3B6B", opacity: addBusy ? 0.6 : 1 }}>
                {addBusy ? "Adding…" : "Add Review"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Edit Review Modal ────────────────────────────────────────────────── */}
      {editTarget && (
        <Modal onClose={() => !editBusy && setEditTarget(null)}>
          <ModalIcon color="#EFF6FF" stroke="#2563EB">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </ModalIcon>
          <p className="text-base font-bold text-black text-center mt-1">Edit Review</p>
          <p className="text-sm text-center mt-1 mb-4" style={{ color: "#6B7280" }}>
            Editing review by <strong>{editTarget.name}</strong> for <strong>{editTarget.vendorName ?? "—"}</strong>
          </p>

          <form onSubmit={handleEdit} className="space-y-3 text-left">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Reviewer Name</label>
              <input
                value={editForm.name}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                style={{ borderColor: "#E5E7EB", color: "#111827" }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: "#374151" }}>Rating</label>
              <StarPicker value={editForm.rating} onChange={n => setEditForm(f => ({ ...f, rating: n }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Review</label>
              <textarea
                value={editForm.text}
                onChange={e => setEditForm(f => ({ ...f, text: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none resize-none"
                style={{ borderColor: "#E5E7EB", color: "#111827" }} />
            </div>
            {editErr && <p className="text-xs" style={{ color: "#DC2626" }}>{editErr}</p>}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setEditTarget(null)} disabled={editBusy}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
                style={{ borderColor: "#E5E7EB", color: "#374151" }}>
                Cancel
              </button>
              <button type="submit" disabled={editBusy}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "#2563EB", opacity: editBusy ? 0.6 : 1 }}>
                {editBusy ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Delete Modal ─────────────────────────────────────────────────────── */}
      {deleteTarget && (
        <Modal onClose={() => !deleteBusy && setDeleteTarget(null)}>
          <ModalIcon color="#FEE2E2" stroke="#DC2626">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/>
            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
          </ModalIcon>
          <p className="text-base font-bold text-black text-center mt-1">Delete Review</p>
          <p className="text-sm text-center mt-2" style={{ color: "#6B7280" }}>
            Delete review by <strong>{deleteTarget.name}</strong> for{" "}
            <strong>{deleteTarget.vendorName ?? "this vendor"}</strong>? This cannot be undone.
          </p>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setDeleteTarget(null)} disabled={deleteBusy}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
              style={{ borderColor: "#E5E7EB", color: "#374151" }}>
              Cancel
            </button>
            <button onClick={handleDelete} disabled={deleteBusy}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "#DC2626", opacity: deleteBusy ? 0.6 : 1 }}>
              {deleteBusy ? "Deleting…" : "Delete"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Shared modal shell ───────────────────────────────────────────────────────
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.4)" }} onClick={onClose} />
      <div className="relative z-50 rounded-2xl p-6 shadow-2xl w-full max-w-sm" style={{ background: "#fff" }}>
        {children}
      </div>
    </div>
  );
}

// ─── Shared modal icon ────────────────────────────────────────────────────────
function ModalIcon({ color, stroke, children }: { color: string; stroke: string; children: React.ReactNode }) {
  return (
    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
      style={{ background: color }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </div>
  );
}
