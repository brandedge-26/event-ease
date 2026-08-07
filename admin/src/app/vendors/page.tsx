"use client";

import { useEffect, useRef, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5510";

// ─── Types ────────────────────────────────────────────────────────────────────
type Vendor = {
  id:           string;
  name:         string;
  slug:         string;
  email:        string;
  phone:        string;
  businessType: string;
  city:         string;
  area:         string;
  logoUrl:      string | null;
  isVerified:   boolean;
  isBlocked:    boolean;
  hallCount:    number;
  createdAt:    string;
};

type VendorDetail = Vendor & {
  ownerName:     string;
  whatsapp:      string | null;
  address:       string;
  cnic:          string | null;
  about:         string | null;
  tagline:       string | null;
  services:      string[] | null;
  amenities:     string[] | null;
  established:   number | null;
  galleryImages: string[] | null;
  mapUrl:        string | null;
  halls: { id: string; name: string; capacity: number; price: number; desc: string | null }[];
};

type ModalType = "verify" | "block" | "delete" | null;

// ─── Fetch helper ─────────────────────────────────────────────────────────────
function adminFetch(path: string, opts: RequestInit = {}) {
  return fetch(`${API_BASE}/api${path}`, {
    ...opts,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts.headers ?? {}) },
  });
}

type Pagination = { page: number; pageSize: number; total: number; totalPages: number };

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function VendorsPage() {
  const [vendors,    setVendors]    = useState<Vendor[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [actingId,   setActingId]   = useState<string | null>(null);

  // Drawer
  const [drawer,        setDrawer]        = useState<VendorDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Modal
  const [modal,     setModal]     = useState<{ type: ModalType; vendor: Vendor } | null>(null);
  const [modalBusy, setModalBusy] = useState(false);

  useEffect(() => { fetchVendors(1); }, []);

  async function fetchVendors(page: number) {
    setLoading(true);
    try {
      const res  = await adminFetch(`/admin/vendors?page=${page}`);
      const data = await res.json();
      if (data.success) {
        setVendors(data.vendors);
        setPagination(data.pagination);
      } else {
        setError(data.message ?? "Failed to load vendors.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  function goToPage(p: number) {
    if (p < 1 || p > pagination.totalPages) return;
    fetchVendors(p);
  }

  async function openDrawer(id: string) {
    setDrawerLoading(true);
    setDrawer(null);
    try {
      const res  = await adminFetch(`/admin/vendors/${id}`);
      const data = await res.json();
      if (data.success) setDrawer(data.vendor);
    } finally {
      setDrawerLoading(false); // drawer pane still visible via drawerLoading
    }
  }

  function openModal(type: Exclude<ModalType, null>, vendor: Vendor) {
    setModal({ type, vendor });
  }

  async function confirmModal() {
    if (!modal) return;
    setModalBusy(true);
    const { type, vendor } = modal;
    try {
      if (type === "verify") {
        const res  = await adminFetch(`/admin/vendors/${vendor.id}/verify`, { method: "PATCH" });
        const data = await res.json();
        if (data.success) {
          setVendors(prev => prev.map(v => v.id === vendor.id ? { ...v, isVerified: data.isVerified } : v));
          if (drawer?.id === vendor.id) setDrawer(d => d ? { ...d, isVerified: data.isVerified } : d);
        }
      } else if (type === "block") {
        const res  = await adminFetch(`/admin/vendors/${vendor.id}/block`, { method: "PATCH" });
        const data = await res.json();
        if (data.success) {
          setVendors(prev => prev.map(v => v.id === vendor.id ? { ...v, isBlocked: data.isBlocked } : v));
          if (drawer?.id === vendor.id) setDrawer(d => d ? { ...d, isBlocked: data.isBlocked } : d);
        }
      } else if (type === "delete") {
        const res  = await adminFetch(`/admin/vendors/${vendor.id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          if (drawer?.id === vendor.id) setDrawer(null);
          // if last item on page, go to previous page; otherwise reload current
          const newTotal = pagination.total - 1;
          const remainingOnPage = vendors.filter(v => v.id !== vendor.id).length;
          const targetPage = remainingOnPage === 0 && pagination.page > 1
            ? pagination.page - 1
            : pagination.page;
          await fetchVendors(targetPage);
        }
      }
    } finally {
      setModalBusy(false);
      setModal(null);
    }
  }

  const drawerOpen = drawer !== null || drawerLoading;

  return (
    <div className="p-4 lg:p-6 min-h-screen" style={{ background: "var(--bg-subtle)" }}>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: "#111827" }}>Vendors</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>
          {loading ? "Loading…" : `${pagination.total} registered vendor${pagination.total !== 1 ? "s" : ""}`}
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "var(--danger-light)", color: "var(--danger)" }}>
          {error}
        </div>
      )}

      {/* Table card */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Vendor</th>
                <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Contact</th>
                <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Location</th>
                <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Halls</th>
                <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Joined</th>
                <th className="text-right px-5 py-3 text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 rounded-lg animate-pulse" style={{ background: "var(--bg-hover)", width: j === 0 ? 140 : 80 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : vendors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-sm" style={{ color: "var(--fg-muted)" }}>
                    No vendors registered yet.
                  </td>
                </tr>
              ) : (
                vendors.map(v => (
                  <tr key={v.id} className="transition-colors" style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-subtle)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "")}>

                    {/* Vendor */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 flex items-center justify-center font-bold text-white text-sm"
                          style={{ background: "var(--primary)" }}>
                          {v.logoUrl
                            ? <img src={v.logoUrl} alt="" className="w-full h-full object-cover" />
                            : v.name[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate" style={{ color: "#111827" }}>{v.name}</p>
                          <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{v.businessType}</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-5 py-4">
                      <p className="truncate" style={{ color: "#374151", maxWidth: 160 }}>{v.email}</p>
                      <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{v.phone}</p>
                    </td>

                    {/* Location */}
                    <td className="px-5 py-4">
                      <p style={{ color: "#374151" }}>{v.city}</p>
                      <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{v.area}</p>
                    </td>

                    {/* Halls */}
                    <td className="px-5 py-4">
                      <span className="font-semibold" style={{ color: "#111827" }}>{v.hallCount}</span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold w-fit"
                          style={{
                            background: v.isVerified ? "var(--success-light)" : "var(--warning-light)",
                            color:      v.isVerified ? "var(--success)"       : "var(--warning)",
                          }}>
                          {v.isVerified ? "✓ Verified" : "Pending"}
                        </span>
                        {v.isBlocked && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold w-fit"
                            style={{ background: "var(--danger-light)", color: "var(--danger)" }}>
                            Blocked
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-4 text-xs" style={{ color: "var(--fg-muted)" }}>
                      {new Date(v.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View */}
                        <ActionBtn title="View profile" onClick={() => openDrawer(v.id)}
                          bg="var(--bg-subtle)" color="var(--fg-muted)" border>
                          <EyeIcon />
                        </ActionBtn>
                        {/* Verify */}
                        <ActionBtn title={v.isVerified ? "Unverify" : "Verify"} onClick={() => openModal("verify", v)}
                          bg={v.isVerified ? "var(--warning-light)" : "var(--success-light)"}
                          color={v.isVerified ? "var(--warning)" : "var(--success)"}>
                          <ShieldIcon />
                        </ActionBtn>
                        {/* Block */}
                        <ActionBtn title={v.isBlocked ? "Unblock" : "Block"} onClick={() => openModal("block", v)}
                          bg={v.isBlocked ? "var(--warning-light)" : "#F3F4F6"}
                          color={v.isBlocked ? "var(--warning)" : "#6B7280"}>
                          <BlockIcon />
                        </ActionBtn>
                        {/* Delete */}
                        <ActionBtn title="Delete" onClick={() => openModal("delete", v)}
                          bg="var(--danger-light)" color="var(--danger)">
                          <TrashIcon />
                        </ActionBtn>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y" style={{ borderColor: "var(--border)" }}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 flex flex-col gap-2">
                <div className="h-4 w-36 rounded-lg animate-pulse" style={{ background: "var(--bg-hover)" }} />
                <div className="h-3 w-24 rounded-lg animate-pulse" style={{ background: "var(--bg-hover)" }} />
              </div>
            ))
          ) : vendors.length === 0 ? (
            <p className="p-8 text-center text-sm" style={{ color: "var(--fg-muted)" }}>No vendors yet.</p>
          ) : (
            vendors.map(v => (
              <div key={v.id} className="p-4 flex flex-col gap-3">
                {/* Top row */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center font-bold text-white"
                    style={{ background: "var(--primary)" }}>
                    {v.logoUrl
                      ? <img src={v.logoUrl} alt="" className="w-full h-full object-cover" />
                      : v.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate" style={{ color: "#111827" }}>{v.name}</p>
                    <p className="text-xs truncate" style={{ color: "var(--fg-muted)" }}>{v.email}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <span className="px-2 py-0.5 rounded-lg text-xs font-semibold"
                      style={{
                        background: v.isVerified ? "var(--success-light)" : "var(--warning-light)",
                        color:      v.isVerified ? "var(--success)"       : "var(--warning)",
                      }}>
                      {v.isVerified ? "Verified" : "Pending"}
                    </span>
                    {v.isBlocked && (
                      <span className="px-2 py-0.5 rounded-lg text-xs font-semibold"
                        style={{ background: "var(--danger-light)", color: "var(--danger)" }}>
                        Blocked
                      </span>
                    )}
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--fg-muted)" }}>
                  <span>{v.city}{v.area ? `, ${v.area}` : ""}</span>
                  <span>·</span>
                  <span>{v.hallCount} hall{v.hallCount !== 1 ? "s" : ""}</span>
                  <span>·</span>
                  <span>{new Date(v.createdAt).toLocaleDateString("en-PK", { month: "short", year: "numeric" })}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button onClick={() => openDrawer(v.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all border"
                    style={{ borderColor: "var(--border)", color: "var(--fg-muted)", background: "var(--bg-subtle)" }}>
                    <EyeIcon /> View
                  </button>
                  <button onClick={() => openModal("verify", v)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                    style={{
                      background: v.isVerified ? "var(--warning-light)" : "var(--success-light)",
                      color:      v.isVerified ? "var(--warning)"       : "var(--success)",
                    }}>
                    <ShieldIcon /> {v.isVerified ? "Unverify" : "Verify"}
                  </button>
                  <button onClick={() => openModal("block", v)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                    style={{
                      background: v.isBlocked ? "var(--warning-light)" : "#F3F4F6",
                      color:      v.isBlocked ? "var(--warning)"       : "#6B7280",
                    }}>
                    <BlockIcon /> {v.isBlocked ? "Unblock" : "Block"}
                  </button>
                  <button onClick={() => openModal("delete", v)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                    style={{ background: "var(--danger-light)", color: "var(--danger)" }}>
                    <TrashIcon /> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────────── */}
      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} vendors
          </p>
          <div className="flex items-center gap-1">
            {/* Prev */}
            <PageBtn onClick={() => goToPage(pagination.page - 1)} disabled={pagination.page <= 1 || loading}>
              <ChevronLeftIcon />
            </PageBtn>

            {/* Page numbers */}
            {buildPages(pagination.page, pagination.totalPages).map((p, i) =>
              p === "…" ? (
                <span key={`ellipsis-${i}`} className="w-8 text-center text-xs" style={{ color: "var(--fg-muted)" }}>…</span>
              ) : (
                <PageBtn key={p} onClick={() => goToPage(p as number)} active={p === pagination.page} disabled={loading}>
                  {p}
                </PageBtn>
              )
            )}

            {/* Next */}
            <PageBtn onClick={() => goToPage(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages || loading}>
              <ChevronRightIcon />
            </PageBtn>
          </div>
        </div>
      )}

      {/* ── Drawer ──────────────────────────────────────────────────────────── */}
      {drawerOpen && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => { setDrawer(null); setDrawerLoading(false); }} />

          {/* Panel */}
          <aside
            className="fixed top-0 right-0 h-full z-50 flex flex-col overflow-hidden"
            style={{ width: "min(480px, 100vw)", background: "#fff", boxShadow: "-4px 0 32px rgba(0,0,0,0.12)" }}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
              <p className="font-semibold text-base" style={{ color: "#111827" }}>Vendor Profile</p>
              <button onClick={() => { setDrawer(null); setDrawerLoading(false); }}
                className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-100"
                style={{ color: "var(--fg-muted)" }}>
                <CloseIcon />
              </button>
            </div>

            {drawerLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
              </div>
            ) : drawer ? (
              <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>

                {/* Hero */}
                <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center font-bold text-white text-xl"
                      style={{ background: "var(--primary)" }}>
                      {drawer.logoUrl
                        ? <img src={drawer.logoUrl} alt="" className="w-full h-full object-cover" />
                        : drawer.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-lg leading-tight" style={{ color: "#111827" }}>{drawer.name}</p>
                      {drawer.tagline && <p className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>{drawer.tagline}</p>}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <Badge label={drawer.businessType} />
                        <Badge label={drawer.isVerified ? "✓ Verified" : "Pending"}
                          bg={drawer.isVerified ? "var(--success-light)" : "var(--warning-light)"}
                          color={drawer.isVerified ? "var(--success)" : "var(--warning)"} />
                        {drawer.isBlocked && <Badge label="Blocked" bg="var(--danger-light)" color="var(--danger)" />}
                      </div>
                    </div>
                  </div>

                  {/* Quick actions in drawer */}
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => openModal("verify", drawer as unknown as Vendor)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                      style={{
                        background: drawer.isVerified ? "var(--warning-light)" : "var(--success-light)",
                        color:      drawer.isVerified ? "var(--warning)"       : "var(--success)",
                      }}>
                      <ShieldIcon /> {drawer.isVerified ? "Unverify" : "Verify"}
                    </button>
                    <button onClick={() => openModal("block", drawer as unknown as Vendor)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                      style={{
                        background: drawer.isBlocked ? "var(--warning-light)" : "#F3F4F6",
                        color:      drawer.isBlocked ? "var(--warning)"       : "#6B7280",
                      }}>
                      <BlockIcon /> {drawer.isBlocked ? "Unblock" : "Block"}
                    </button>
                    <button onClick={() => openModal("delete", drawer as unknown as Vendor)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                      style={{ background: "var(--danger-light)", color: "var(--danger)" }}>
                      <TrashIcon /> Delete
                    </button>
                  </div>
                </div>

                {/* Sections */}
                <div className="px-5 py-4 flex flex-col gap-5">

                  {/* Owner / Auth */}
                  <Section title="Owner Info">
                    <Row label="Owner Name"  value={drawer.ownerName} />
                    <Row label="Email"        value={drawer.email} />
                    <Row label="Phone"        value={drawer.phone} />
                    {drawer.whatsapp && <Row label="WhatsApp" value={drawer.whatsapp} />}
                    <Row label="CNIC"
                      value={drawer.cnic ?? "—"}
                      highlight={!drawer.cnic} />
                  </Section>

                  {/* Business */}
                  <Section title="Business">
                    <Row label="Business Type"  value={drawer.businessType} />
                    {drawer.established && <Row label="Established" value={String(drawer.established)} />}
                    {drawer.about && (
                      <div>
                        <p className="text-xs font-semibold mb-1" style={{ color: "var(--fg-muted)" }}>About</p>
                        <p className="text-sm" style={{ color: "#374151" }}>{drawer.about}</p>
                      </div>
                    )}
                    {drawer.services && drawer.services.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--fg-muted)" }}>Services</p>
                        <div className="flex flex-wrap gap-1.5">
                          {drawer.services.map(s => <Badge key={s} label={s} />)}
                        </div>
                      </div>
                    )}
                    {drawer.amenities && drawer.amenities.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--fg-muted)" }}>Amenities</p>
                        <div className="flex flex-wrap gap-1.5">
                          {drawer.amenities.map(a => <Badge key={a} label={a} />)}
                        </div>
                      </div>
                    )}
                  </Section>

                  {/* Location */}
                  <Section title="Location">
                    <Row label="City"    value={drawer.city} />
                    <Row label="Area"    value={drawer.area} />
                    <Row label="Address" value={drawer.address} />
                    {drawer.mapUrl && (
                      <a href={drawer.mapUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs font-semibold underline" style={{ color: "var(--primary)" }}>
                        View on Map
                      </a>
                    )}
                  </Section>

                  {/* Halls */}
                  {drawer.halls.length > 0 && (
                    <Section title={`Halls (${drawer.halls.length})`}>
                      <div className="flex flex-col gap-2">
                        {drawer.halls.map(h => (
                          <div key={h.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                            style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                            <div>
                              <p className="text-sm font-semibold" style={{ color: "#111827" }}>{h.name}</p>
                              <p className="text-xs" style={{ color: "var(--fg-muted)" }}>Capacity: {h.capacity}</p>
                            </div>
                            <p className="text-sm font-bold" style={{ color: "var(--primary)" }}>
                              Rs {h.price.toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Gallery */}
                  {drawer.galleryImages && drawer.galleryImages.length > 0 && (
                    <Section title={`Gallery (${drawer.galleryImages.length})`}>
                      <div className="grid grid-cols-3 gap-2">
                        {drawer.galleryImages.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                            className="aspect-square rounded-xl overflow-hidden block">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Joined */}
                  <Section title="Account">
                    <Row label="Joined" value={new Date(drawer.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })} />
                    <Row label="Slug"   value={`/profile/${drawer.slug}`} />
                  </Section>

                </div>
              </div>
            ) : null}
          </aside>
        </>
      )}

      {/* ── Confirm Modal ────────────────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/40">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background: modal.type === "delete" ? "var(--danger-light)"
                            : modal.type === "block"  ? (modal.vendor.isBlocked ? "var(--warning-light)" : "#FEE2E2")
                            : "var(--success-light)",
                  color: modal.type === "delete" ? "var(--danger)"
                       : modal.type === "block"  ? (modal.vendor.isBlocked ? "var(--warning)" : "var(--danger)")
                       : "var(--success)",
                }}>
                {modal.type === "delete" ? <TrashIcon /> : modal.type === "block" ? <BlockIcon /> : <ShieldIcon />}
              </div>
              <div>
                <p className="font-bold" style={{ color: "#111827" }}>
                  {modal.type === "delete" ? "Delete Vendor"
                   : modal.type === "block" ? (modal.vendor.isBlocked ? "Unblock Vendor" : "Block Vendor")
                   : (modal.vendor.isVerified ? "Remove Verification" : "Verify Vendor")}
                </p>
                <p className="text-sm" style={{ color: "var(--fg-muted)" }}>{modal.vendor.name}</p>
              </div>
            </div>

            <p className="text-sm mb-6" style={{ color: "#374151" }}>
              {modal.type === "delete"
                ? "This will permanently delete the vendor and all their data. This action cannot be undone."
                : modal.type === "block"
                ? modal.vendor.isBlocked
                  ? "This will unblock the vendor and restore their access to the platform."
                  : "This will block the vendor from accessing their account on the platform."
                : modal.vendor.isVerified
                ? "This will remove the verified badge from this vendor's profile."
                : "This will mark the vendor as verified and show the verified badge on their profile."}
            </p>

            <div className="flex gap-3">
              <button onClick={() => setModal(null)} disabled={modalBusy}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-colors border disabled:opacity-50"
                style={{ borderColor: "var(--border)", color: "var(--fg-muted)", background: "var(--bg-subtle)" }}>
                Cancel
              </button>
              <button onClick={confirmModal} disabled={modalBusy}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all disabled:opacity-50"
                style={{
                  background: modal.type === "delete" ? "var(--danger)"
                            : modal.type === "block"  ? (modal.vendor.isBlocked ? "var(--warning)" : "var(--danger)")
                            : "var(--success)",
                }}>
                {modalBusy ? "…"
                  : modal.type === "delete" ? "Delete"
                  : modal.type === "block"  ? (modal.vendor.isBlocked ? "Unblock" : "Block")
                  : (modal.vendor.isVerified ? "Remove Verification" : "Verify")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Small components ─────────────────────────────────────────────────────────
function ActionBtn({ children, title, onClick, bg, color, border }: {
  children: React.ReactNode; title: string; onClick: () => void;
  bg: string; color: string; border?: boolean;
}) {
  return (
    <button title={title} onClick={onClick}
      className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all hover:opacity-80"
      style={{ background: bg, color, border: border ? "1px solid var(--border)" : undefined }}>
      {children}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--fg-muted)" }}>{title}</p>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <p className="text-xs shrink-0" style={{ color: "var(--fg-muted)", minWidth: 90 }}>{label}</p>
      <p className="text-sm text-right font-medium" style={{ color: highlight ? "var(--danger)" : "#374151" }}>{value}</p>
    </div>
  );
}

function Badge({ label, bg = "var(--bg-hover)", color = "var(--fg-muted)" }: { label: string; bg?: string; color?: string }) {
  return (
    <span className="px-2 py-0.5 rounded-lg text-xs font-semibold" style={{ background: bg, color }}>
      {label}
    </span>
  );
}

// ─── Pagination helpers ───────────────────────────────────────────────────────
function buildPages(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [];
  pages.push(1);
  if (current > 3) pages.push("…");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push("…");
  pages.push(total);
  return pages;
}

function PageBtn({ children, onClick, disabled, active }: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; active?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold cursor-pointer transition-all disabled:opacity-40"
      style={{
        background: active ? "var(--primary)" : "var(--bg-subtle)",
        color:      active ? "#fff"           : "var(--fg-muted)",
        border:     active ? "none"           : "1px solid var(--border)",
      }}>
      {children}
    </button>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function EyeIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>; }
function ShieldIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function BlockIcon()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>; }
function TrashIcon()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>; }
function CloseIcon()       { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function ChevronLeftIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>; }
function ChevronRightIcon(){ return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>; }
