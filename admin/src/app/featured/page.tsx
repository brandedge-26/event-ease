"use client";

import { useEffect, useRef, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5510";

function adminFetch(path: string, opts: RequestInit = {}) {
  return fetch(`${API_BASE}/api${path}`, {
    ...opts,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts.headers ?? {}) },
  });
}

type Vendor = {
  id:         string;
  name:       string;
  slug:       string;
  city:       string;
  area:       string;
  logoUrl:    string | null;
  isVerified: boolean;
  isBlocked:  boolean;
  isFeatured: boolean;
  featuredAt: string | null;
};

// ─── Icons ────────────────────────────────────────────────────────────────────
function StarFilledIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

function StarOutlineIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

// ─── Vendor Row ───────────────────────────────────────────────────────────────
function VendorRow({ vendor, isFeaturedRow, busy, onToggle }: {
  vendor: Vendor;
  isFeaturedRow: boolean;
  busy: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors group">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center font-bold text-sm overflow-hidden"
        style={{ background: "#FFF0F4", color: "#FF3B6B" }}>
        {vendor.logoUrl
          ? <img src={vendor.logoUrl} alt={vendor.name} className="w-full h-full object-cover" />
          : vendor.name.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-black truncate">{vendor.name}</p>
          {vendor.isVerified && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
              style={{ background: "#D1FAE5", color: "#065F46" }}>Verified</span>
          )}
          {vendor.isBlocked && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
              style={{ background: "#FEE2E2", color: "#991B1B" }}>Blocked</span>
          )}
        </div>
        <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>{vendor.area}, {vendor.city}</p>
      </div>

      {/* Featured since */}
      {isFeaturedRow && vendor.featuredAt && (
        <p className="text-xs shrink-0 hidden md:block" style={{ color: "#9CA3AF" }}>
          {new Date(vendor.featuredAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      )}

      {/* Toggle button */}
      <button
        onClick={onToggle}
        disabled={busy}
        title={isFeaturedRow ? "Remove from featured" : "Add to featured"}
        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
        style={{
          background:   isFeaturedRow ? "#FEF3C7" : "#fff",
          color:        isFeaturedRow ? "#92400E" : "#374151",
          borderColor:  isFeaturedRow ? "#FDE68A" : "#E5E7EB",
          opacity:      busy ? 0.5 : 1,
          cursor:       busy ? "not-allowed" : "pointer",
        }}>
        {busy ? (
          <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
            <path d="M12 2a10 10 0 0110 10" strokeOpacity="1"/>
          </svg>
        ) : isFeaturedRow ? (
          <><StarFilledIcon /><span>Remove</span></>
        ) : (
          <><StarOutlineIcon /><span>Feature</span></>
        )}
      </button>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-50 animate-pulse">
          <div className="w-9 h-9 rounded-xl shrink-0" style={{ background: "#F3F4F6" }} />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-36 rounded-md" style={{ background: "#F3F4F6" }} />
            <div className="h-3 w-24 rounded-md" style={{ background: "#F3F4F6" }} />
          </div>
          <div className="h-7 w-20 rounded-xl" style={{ background: "#F3F4F6" }} />
        </div>
      ))}
    </>
  );
}

type Pagination = { page: number; pageSize: number; total: number; totalPages: number };

function buildPages(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (page > 3) pages.push("…");
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
  if (page < totalPages - 2) pages.push("…");
  pages.push(totalPages);
  return pages;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function FeaturedPage() {
  const [featured,   setFeatured]   = useState<Vendor[]>([]);
  const [unfeatured, setUnfeatured] = useState<Vendor[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [loadingFeatured,   setLoadingFeatured]   = useState(true);
  const [loadingUnfeatured, setLoadingUnfeatured] = useState(true);
  const [busyId,     setBusyId]     = useState<string | null>(null);
  const [search,     setSearch]     = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { loadAll(1, ""); }, []);

  // Initial load — fetches both panels together
  async function loadAll(page: number, q: string) {
    setLoadingFeatured(true);
    setLoadingUnfeatured(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (q) params.set("search", q);
      const res  = await adminFetch(`/admin/featured?${params}`);
      const data = await res.json();
      if (data.success) {
        setFeatured(data.featured);
        setUnfeatured(data.unfeatured);
        setPagination(data.pagination);
      }
    } finally {
      setLoadingFeatured(false);
      setLoadingUnfeatured(false);
    }
  }

  // Search / page change — ONLY updates unfeatured panel, featured stays frozen
  async function loadUnfeatured(page: number, q: string) {
    setLoadingUnfeatured(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (q) params.set("search", q);
      const res  = await adminFetch(`/admin/featured?${params}`);
      const data = await res.json();
      if (data.success) {
        setUnfeatured(data.unfeatured);
        setPagination(data.pagination);
      }
    } finally { setLoadingUnfeatured(false); }
  }

  function handleSearch(val: string) {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadUnfeatured(1, val), 350);
  }

  function goPage(p: number) { loadUnfeatured(p, search); }

  async function toggle(vendor: Vendor) {
    setBusyId(vendor.id);
    try {
      const res  = await adminFetch(`/admin/featured/${vendor.id}/toggle`, { method: "PATCH" });
      const data = await res.json();
      if (data.success) {
        // Update featured list optimistically, refresh unfeatured for accurate count
        if (data.isFeatured) {
          setFeatured(prev => [{ ...vendor, isFeatured: true, featuredAt: new Date().toISOString() }, ...prev]);
        } else {
          setFeatured(prev => prev.filter(v => v.id !== vendor.id));
        }
        await loadUnfeatured(pagination.page, search);
      }
    } finally { setBusyId(null); }
  }

  return (
    <div className="p-6 min-h-screen" style={{ background: "#F9FAFB" }}>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">Featured Listings</h1>
        <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
          Featured vendors appear at the top of the home page with a highlighted badge
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Left: Currently Featured ───────────────────────────────────────── */}
        <div className="rounded-2xl border overflow-hidden flex flex-col" style={{ background: "#fff", borderColor: "#E5E7EB" }}>

          {/* Card header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "#E5E7EB" }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#FFFBEB" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-black">Featured Vendors</p>
              <p className="text-xs" style={{ color: "#9CA3AF" }}>
                {loadingFeatured ? "—" : `${featured.length} vendor${featured.length !== 1 ? "s" : ""} on home page`}
              </p>
            </div>
            {/* Count badge */}
            {!loadingFeatured && featured.length > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: "#FEF3C7", color: "#92400E" }}>
                {featured.length}
              </span>
            )}
          </div>

          {/* Body */}
          <div className="flex-1">
            {loadingFeatured ? (
              <Skeleton />
            ) : featured.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 px-6 text-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "#F9FAFB" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-black">No featured vendors</p>
                  <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>Feature vendors from the list on the right</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {featured.map(v => (
                  <VendorRow key={v.id} vendor={v} isFeaturedRow busy={busyId === v.id} onToggle={() => toggle(v)} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: All Vendors ─────────────────────────────────────────────── */}
        <div className="rounded-2xl border overflow-hidden flex flex-col" style={{ background: "#fff", borderColor: "#E5E7EB" }}>

          {/* Card header */}
          <div className="px-5 py-4 border-b" style={{ borderColor: "#E5E7EB" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#F3F4F6" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="2" width="16" height="20" rx="1"/>
                  <path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-black">All Vendors</p>
                <p className="text-xs" style={{ color: "#9CA3AF" }}>
                  {loadingUnfeatured ? "—" : `${pagination.total} not featured`}
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border" style={{ borderColor: "#E5E7EB" }}>
              <SearchIcon />
              <input
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search by name or city…"
                className="flex-1 text-sm outline-none bg-transparent"
                style={{ color: "#111827" }} />
              {search && (
                <button onClick={() => { setSearch(""); loadUnfeatured(1, ""); }} style={{ color: "#9CA3AF" }}>
                  <XIcon />
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1">
            {loadingUnfeatured ? (
              <Skeleton />
            ) : unfeatured.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 px-6 text-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "#F9FAFB" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="2" width="16" height="20" rx="1"/>
                    <path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-black">
                    {search ? "No vendors found" : "All vendors are featured"}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                    {search ? "Try a different search term" : "Every vendor is already on the home page"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {unfeatured.map(v => (
                  <VendorRow key={v.id} vendor={v} isFeaturedRow={false} busy={busyId === v.id} onToggle={() => toggle(v)} />
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {!loadingUnfeatured && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: "#E5E7EB" }}>
              <p className="text-xs" style={{ color: "#6B7280" }}>
                {pagination.total} vendors · Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => goPage(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium border"
                  style={{ borderColor: "#E5E7EB", color: pagination.page <= 1 ? "#D1D5DB" : "#374151", background: "#fff", cursor: pagination.page <= 1 ? "not-allowed" : "pointer" }}>
                  ←
                </button>
                {buildPages(pagination.page, pagination.totalPages).map((p, i) =>
                  p === "…" ? (
                    <span key={`e${i}`} className="px-1 text-xs" style={{ color: "#9CA3AF" }}>…</span>
                  ) : (
                    <button key={p}
                      onClick={() => goPage(p as number)}
                      className="w-7 h-7 rounded-lg text-xs font-medium"
                      style={{
                        background: p === pagination.page ? "#FF3B6B" : "#fff",
                        color:      p === pagination.page ? "#fff" : "#374151",
                        border:     p === pagination.page ? "none" : "1px solid #E5E7EB",
                      }}>
                      {p}
                    </button>
                  )
                )}
                <button
                  onClick={() => goPage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium border"
                  style={{ borderColor: "#E5E7EB", color: pagination.page >= pagination.totalPages ? "#D1D5DB" : "#374151", background: "#fff", cursor: pagination.page >= pagination.totalPages ? "not-allowed" : "pointer" }}>
                  →
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
