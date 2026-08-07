"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5510";

// ─── Types ────────────────────────────────────────────────────────────────────
type Booking = {
  id:           string;
  customerName: string;
  phone:        string;
  event:        string;
  hall:         string;
  date:         string;
  guests:       number;
  amount:       number;
  paid:         number;
  status:       "pending" | "confirmed" | "cancelled" | "blocked";
  createdAt:    string;
  vendorId:     string;
  vendorName:   string | null;
};

type BookingDetail = Booking & {
  timeFrom:    string | null;
  timeTo:      string | null;
  hallAmount:  number;
  notes:       string | null;
  services:    string | null;
  updatedAt:   string;
  vendorSlug:  string | null;
  vendorPhone: string | null;
  vendorCity:  string | null;
};

type Pagination = { page: number; pageSize: number; total: number; totalPages: number };

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

function fmtMoney(n: number) {
  return "Rs " + n.toLocaleString();
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  confirmed:  { bg: "#D1FAE5", text: "#065F46", label: "Confirmed"  },
  pending:    { bg: "#FEF3C7", text: "#92400E", label: "Pending"    },
  cancelled:  { bg: "#FEE2E2", text: "#991B1B", label: "Cancelled"  },
  blocked:    { bg: "#F3F4F6", text: "#374151", label: "Blocked"    },
};

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.pending;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.text }}>
      {c.label}
    </span>
  );
}

function buildPages(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (page > 3)           pages.push("…");
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
  if (page < totalPages - 2) pages.push("…");
  pages.push(totalPages);
  return pages;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BookingsPage() {
  const [bookings,    setBookings]    = useState<Booking[]>([]);
  const [pagination,  setPagination]  = useState<Pagination>({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");

  // Drawer
  const [drawer,        setDrawer]        = useState<BookingDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Delete modal
  const [deleteModal, setDeleteModal] = useState<Booking | null>(null);
  const [deleteBusy,  setDeleteBusy]  = useState(false);

  useEffect(() => { fetchBookings(1); }, []);

  async function fetchBookings(page: number) {
    setLoading(true);
    setError("");
    try {
      const res  = await adminFetch(`/admin/bookings?page=${page}`);
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings);
        setPagination(data.pagination);
      } else {
        setError(data.message ?? "Failed to load bookings.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function openDrawer(id: string) {
    setDrawerLoading(true);
    setDrawer(null);
    try {
      const res  = await adminFetch(`/admin/bookings/${id}`);
      const data = await res.json();
      if (data.success) setDrawer(data.booking);
    } finally {
      setDrawerLoading(false);
    }
  }

  function closeDrawer() { setDrawer(null); setDrawerLoading(false); }

  async function handleDelete() {
    if (!deleteModal) return;
    setDeleteBusy(true);
    try {
      const res  = await adminFetch(`/admin/bookings/${deleteModal.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setDeleteModal(null);
        // If last item on page, go back one page
        const newTotal = pagination.total - 1;
        const newTotalPages = Math.max(1, Math.ceil(newTotal / pagination.pageSize));
        const targetPage = pagination.page > newTotalPages ? newTotalPages : pagination.page;
        fetchBookings(targetPage);
        if (drawer?.id === deleteModal.id) closeDrawer();
      }
    } finally {
      setDeleteBusy(false);
    }
  }

  const drawerOpen = drawer !== null || drawerLoading;
  const { page, totalPages, total } = pagination;

  return (
    <div className="p-6 min-h-screen" style={{ background: "#F9FAFB" }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">Bookings</h1>
        <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>All bookings across all vendors</p>
      </div>

      {/* Table card */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: "#fff", borderColor: "#E5E7EB" }}>
        {/* Table header */}
        <div className="grid gap-3 px-5 py-3 text-xs font-semibold uppercase tracking-wide border-b"
          style={{
            gridTemplateColumns: "2fr 2fr 1.2fr 1fr 1fr 1.2fr 80px",
            color: "#6B7280", borderColor: "#E5E7EB",
          }}>
          <span>Customer</span>
          <span>Banquet / Hall</span>
          <span>Date</span>
          <span>Guests</span>
          <span>Amount</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>

        {/* Rows */}
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grid gap-3 px-5 py-4 border-b animate-pulse"
              style={{ gridTemplateColumns: "2fr 2fr 1.2fr 1fr 1fr 1.2fr 80px", borderColor: "#F3F4F6" }}>
              {Array.from({ length: 7 }).map((_, j) => (
                <div key={j} className="h-4 rounded-md" style={{ background: "#F3F4F6" }} />
              ))}
            </div>
          ))
        ) : error ? (
          <div className="py-16 text-center text-sm" style={{ color: "#EF4444" }}>{error}</div>
        ) : bookings.length === 0 ? (
          <div className="py-16 text-center text-sm" style={{ color: "#9CA3AF" }}>No bookings found.</div>
        ) : (
          bookings.map((b, idx) => (
            <div key={b.id}
              className="grid gap-3 px-5 py-4 items-center hover:bg-gray-50 transition-colors"
              style={{
                gridTemplateColumns: "2fr 2fr 1.2fr 1fr 1fr 1.2fr 80px",
                borderBottom: idx < bookings.length - 1 ? "1px solid #F3F4F6" : "none",
              }}>
              {/* Customer */}
              <div>
                <p className="text-sm font-semibold text-black truncate">{b.customerName}</p>
                <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>{b.phone}</p>
              </div>
              {/* Banquet / Hall */}
              <div>
                <p className="text-sm font-medium text-black truncate">{b.vendorName ?? "—"}</p>
                <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>{b.hall}</p>
              </div>
              {/* Date */}
              <div className="text-sm" style={{ color: "#374151" }}>{b.date}</div>
              {/* Guests */}
              <div className="text-sm" style={{ color: "#374151" }}>{b.guests}</div>
              {/* Amount */}
              <div>
                <p className="text-sm font-medium text-black">{fmtMoney(b.amount)}</p>
                <p className="text-xs" style={{ color: "#9CA3AF" }}>Paid: {fmtMoney(b.paid)}</p>
              </div>
              {/* Status */}
              <div><StatusBadge status={b.status} /></div>
              {/* Actions */}
              <div className="flex items-center justify-end gap-1.5">
                {/* Eye */}
                <button onClick={() => openDrawer(b.id)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
                  style={{ background: "#F3F4F6" }}
                  title="View details">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
                {/* Delete */}
                <button onClick={() => setDeleteModal(b)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
                  style={{ background: "#FEE2E2" }}
                  title="Delete booking">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
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
          <p className="text-sm" style={{ color: "#6B7280" }}>
            Page {page} of {totalPages} · {total} bookings
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => fetchBookings(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
              style={{
                borderColor: "#E5E7EB",
                color: page <= 1 ? "#D1D5DB" : "#374151",
                background: "#fff",
                cursor: page <= 1 ? "not-allowed" : "pointer",
              }}>
              ← Prev
            </button>
            {buildPages(page, totalPages).map((p, i) =>
              p === "…" ? (
                <span key={`e${i}`} className="px-2 text-sm" style={{ color: "#9CA3AF" }}>…</span>
              ) : (
                <button key={p}
                  onClick={() => fetchBookings(p as number)}
                  className="w-8 h-8 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    background: p === page ? "#FF3B6B" : "#fff",
                    color:      p === page ? "#fff"    : "#374151",
                    border:     p === page ? "none"    : "1px solid #E5E7EB",
                  }}>
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => fetchBookings(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
              style={{
                borderColor: "#E5E7EB",
                color: page >= totalPages ? "#D1D5DB" : "#374151",
                background: "#fff",
                cursor: page >= totalPages ? "not-allowed" : "pointer",
              }}>
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ── Drawer overlay ──────────────────────────────────────────────────── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.35)" }}
            onClick={closeDrawer} />

          {/* Panel */}
          <div className="relative z-50 flex flex-col h-full overflow-y-auto shadow-2xl"
            style={{ width: "clamp(320px, 480px, 100vw)", background: "#fff" }}>

            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-5 border-b sticky top-0 z-10"
              style={{ background: "#fff", borderColor: "#E5E7EB" }}>
              <p className="text-base font-bold text-black">Booking Details</p>
              <button onClick={closeDrawer}
                className="w-8 h-8 flex items-center justify-center rounded-lg"
                style={{ background: "#F3F4F6" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {drawerLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF3B6B" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                  <path d="M12 2a10 10 0 0110 10" strokeOpacity="1"/>
                </svg>
              </div>
            ) : drawer ? (
              <div className="flex-1 px-6 py-5 space-y-6">
                {/* Status + ID */}
                <div className="flex items-center gap-3">
                  <StatusBadge status={drawer.status} />
                  <span className="text-xs font-mono" style={{ color: "#9CA3AF" }}>{drawer.id.slice(0, 8)}…</span>
                </div>

                {/* Customer */}
                <Section title="Customer">
                  <Row label="Name"   value={drawer.customerName} />
                  <Row label="Phone"  value={drawer.phone} />
                </Section>

                {/* Banquet */}
                <Section title="Banquet">
                  <Row label="Business" value={drawer.vendorName ?? "—"} />
                  <Row label="City"     value={drawer.vendorCity ?? "—"} />
                  <Row label="Phone"    value={drawer.vendorPhone ?? "—"} />
                </Section>

                {/* Event */}
                <Section title="Event">
                  <Row label="Type"   value={drawer.event} />
                  <Row label="Hall"   value={drawer.hall} />
                  <Row label="Date"   value={drawer.date} />
                  <Row label="Time"   value={drawer.timeFrom && drawer.timeTo ? `${drawer.timeFrom} – ${drawer.timeTo}` : "—"} />
                  <Row label="Guests" value={String(drawer.guests)} />
                </Section>

                {/* Financials */}
                <Section title="Financials">
                  <Row label="Total Amount" value={fmtMoney(drawer.amount)} />
                  <Row label="Hall Amount"  value={fmtMoney(drawer.hallAmount)} />
                  <Row label="Paid"         value={fmtMoney(drawer.paid)} />
                  <Row label="Balance"
                    value={fmtMoney(drawer.amount - drawer.paid)}
                    valueStyle={{ color: drawer.amount - drawer.paid > 0 ? "#DC2626" : "#059669" }} />
                </Section>

                {/* Services */}
                {drawer.services && (() => {
                  try {
                    const svcs: { name: string; price: number }[] = JSON.parse(drawer.services);
                    if (svcs.length === 0) return null;
                    return (
                      <Section title="Services">
                        {svcs.map((s, i) => (
                          <Row key={i} label={s.name} value={fmtMoney(s.price)} />
                        ))}
                      </Section>
                    );
                  } catch { return null; }
                })()}

                {/* Notes */}
                {drawer.notes && (
                  <Section title="Notes">
                    <p className="text-sm" style={{ color: "#374151" }}>{drawer.notes}</p>
                  </Section>
                )}

                {/* Timestamps */}
                <Section title="Record">
                  <Row label="Created" value={fmt(drawer.createdAt)} />
                  <Row label="Updated" value={fmt(drawer.updatedAt)} />
                </Section>

                {/* Delete */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      const b = bookings.find(x => x.id === drawer.id);
                      if (b) { closeDrawer(); setDeleteModal(b); }
                    }}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: "#DC2626" }}>
                    Delete Booking
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ── Delete modal ─────────────────────────────────────────────────────── */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.4)" }}
            onClick={() => !deleteBusy && setDeleteModal(null)} />
          <div className="relative z-50 rounded-2xl p-6 shadow-2xl w-full max-w-sm"
            style={{ background: "#fff" }}>
            {/* Icon */}
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "#FEE2E2" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
              </svg>
            </div>
            <p className="text-base font-bold text-black text-center">Delete Booking</p>
            <p className="text-sm text-center mt-2" style={{ color: "#6B7280" }}>
              Delete <strong>{deleteModal.customerName}</strong>&apos;s booking for{" "}
              <strong>{deleteModal.event}</strong> on {deleteModal.date}?
              This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteModal(null)}
                disabled={deleteBusy}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors"
                style={{ borderColor: "#E5E7EB", color: "#374151" }}>
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteBusy}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "#DC2626", opacity: deleteBusy ? 0.6 : 1 }}>
                {deleteBusy ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#9CA3AF" }}>{title}</p>
      <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
        {children}
      </div>
    </div>
  );
}

function Row({ label, value, valueStyle }: { label: string; value: string; valueStyle?: React.CSSProperties }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 gap-4">
      <span className="text-xs" style={{ color: "#9CA3AF", flexShrink: 0 }}>{label}</span>
      <span className="text-sm font-medium text-right" style={{ color: "#111827", ...valueStyle }}>{value}</span>
    </div>
  );
}
