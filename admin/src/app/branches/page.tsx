"use client";

import { useEffect, useState, useMemo } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5510";
const PRIMARY  = "#FF3B6B";

type Branch = {
  id:          string;
  name:        string;
  city:        string;
  area:        string;
  address:     string;
  isDefault:   boolean;
  isActive:    boolean;
  isApproved:  boolean;
  createdAt:   string;
  vendorId:    string;
  vendorName:  string;
  vendorEmail: string;
  vendorPhone: string;
  vendorSlug:  string;
  vendorCity:  string;
};

type Pagination = { page: number; pageSize: number; total: number; totalPages: number };

type VendorDetail = {
  id:           string;
  name:         string;
  email:        string;
  phone:        string;
  city:         string;
  slug:         string;
  businessType: string;
  about:        string;
  logoUrl:      string | null;
  isActive:     boolean;
  isSuspended:  boolean;
  createdAt:    string;
};

export default function AdminBranchesPage() {
  const [branches,      setBranches]      = useState<Branch[]>([]);
  const [pagination,    setPagination]    = useState<Pagination | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [page,          setPage]          = useState(1);
  const [statusFilter,  setStatusFilter]  = useState<"pending" | "all">("pending");
  const [toggling,      setToggling]      = useState<string | null>(null);
  const [deleting,      setDeleting]      = useState<string | null>(null);
  const [confirmId,     setConfirmId]     = useState<string | null>(null);
  const [search,        setSearch]        = useState("");

  // Vendor drawer
  const [drawerBranch,  setDrawerBranch]  = useState<Branch | null>(null);
  const [vendorDetail,  setVendorDetail]  = useState<VendorDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  async function fetchBranches(p = page, s = statusFilter) {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/admin/branches?page=${p}&status=${s}`, { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setBranches(data.branches);
        setPagination(data.pagination);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchBranches(page, statusFilter); }, [page, statusFilter]);

  // Client-side search filter
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return branches;
    return branches.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.vendorName.toLowerCase().includes(q) ||
      b.city.toLowerCase().includes(q) ||
      b.area.toLowerCase().includes(q)
    );
  }, [branches, search]);

  async function openDrawer(branch: Branch) {
    setDrawerBranch(branch);
    setVendorDetail(null);
    setDrawerLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/admin/vendors/${branch.vendorId}`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setVendorDetail(data.vendor);
    } finally {
      setDrawerLoading(false);
    }
  }

  function closeDrawer() {
    setDrawerBranch(null);
    setVendorDetail(null);
  }

  async function handleApprove(id: string) {
    setToggling(id);
    try {
      const res  = await fetch(`${API_BASE}/api/admin/branches/${id}/approve`, { method: "PATCH", credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setBranches(prev => prev.map(b => b.id === id ? { ...b, isApproved: data.isApproved } : b));
      }
    } finally {
      setToggling(null);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res  = await fetch(`${API_BASE}/api/admin/branches/${id}`, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setBranches(prev => prev.filter(b => b.id !== id));
        if (pagination) setPagination(p => p ? { ...p, total: p.total - 1 } : null);
        if (drawerBranch?.id === id) closeDrawer();
      }
    } finally {
      setDeleting(null);
      setConfirmId(null);
    }
  }

  function fmt(iso: string) {
    return new Date(iso).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-black">Branches</h1>
          <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
            {pagination ? `${pagination.total} branch${pagination.total !== 1 ? "es" : ""}` : ""}
            {statusFilter === "pending" ? " awaiting approval" : " total"}
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2">
          {(["pending", "all"] as const).map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); setSearch(""); }}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer capitalize"
              style={statusFilter === s
                ? { background: PRIMARY, color: "#fff", borderColor: PRIMARY }
                : { background: "#fff", color: "#374151", borderColor: "#E5E7EB" }
              }>
              {s === "pending" ? "Pending" : "All Branches"}
            </button>
          ))}
        </div>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by branch name, vendor, or city…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ border: "1px solid #E5E7EB", background: "#fff", color: "#111827" }}
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: "#9CA3AF" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2.5" strokeLinecap="round" className="animate-spin">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: "#F3F4F6" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <p className="text-sm font-semibold text-black">No branches found</p>
            <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
              {search ? "Try a different search term" : statusFilter === "pending" ? "All branches are approved" : "No branches exist yet"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #F3F4F6", background: "#FAFAFA" }}>
                  {["Branch", "Vendor", "Location", "Status", "Created", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((branch, i) => (
                  <tr key={branch.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                    {/* Branch */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-semibold text-black text-sm">{branch.name}</p>
                          {branch.isDefault && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: "#F0FDF4", color: "#16A34A" }}>Default</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Vendor */}
                    <td className="px-4 py-3">
                      <p className="font-semibold text-black text-xs">{branch.vendorName}</p>
                      <p className="text-xs" style={{ color: "#9CA3AF" }}>{branch.vendorEmail}</p>
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-black">{branch.city}</p>
                      <p className="text-xs" style={{ color: "#9CA3AF" }}>{branch.area}</p>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit"
                          style={branch.isApproved
                            ? { background: "#F0FDF4", color: "#16A34A" }
                            : { background: "#FEF3C7", color: "#D97706" }
                          }>
                          <span className="w-1.5 h-1.5 rounded-full inline-block"
                            style={{ background: branch.isApproved ? "#16A34A" : "#D97706" }} />
                          {branch.isApproved ? "Approved" : "Pending"}
                        </span>
                        {!branch.isActive && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit" style={{ background: "#FEE2E2", color: "#DC2626" }}>
                            Deactivated
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Created */}
                    <td className="px-4 py-3">
                      <p className="text-xs" style={{ color: "#6B7280" }}>{fmt(branch.createdAt)}</p>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">

                        {/* Eye — view vendor profile */}
                        <button
                          onClick={() => openDrawer(branch)}
                          className="p-1.5 rounded-xl cursor-pointer transition-colors"
                          style={{ color: "#6B7280" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#F3F4F6")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                          title="View vendor profile">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>

                        {/* Approve / Revoke */}
                        <button
                          onClick={() => handleApprove(branch.id)}
                          disabled={toggling === branch.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all disabled:opacity-50"
                          style={branch.isApproved
                            ? { background: "#F3F4F6", color: "#374151" }
                            : { background: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0" }
                          }>
                          {toggling === branch.id ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                          ) : branch.isApproved ? (
                            <>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              Revoke
                            </>
                          ) : (
                            <>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                              Approve
                            </>
                          )}
                        </button>

                        {/* Delete */}
                        {confirmId === branch.id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-medium" style={{ color: "#DC2626" }}>Delete?</span>
                            <button
                              onClick={() => handleDelete(branch.id)}
                              disabled={deleting === branch.id}
                              className="px-2 py-1 rounded-lg text-xs font-semibold text-white cursor-pointer disabled:opacity-50"
                              style={{ background: "#DC2626" }}>
                              {deleting === branch.id ? "…" : "Yes"}
                            </button>
                            <button onClick={() => setConfirmId(null)}
                              className="px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer"
                              style={{ background: "#F3F4F6", color: "#374151" }}>
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmId(branch.id)}
                            className="p-1.5 rounded-xl cursor-pointer hover:bg-red-50 transition-colors"
                            style={{ color: "#EF4444" }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs" style={{ color: "#6B7280" }}>
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer disabled:opacity-40"
              style={{ borderColor: "#E5E7EB", color: "#374151" }}>
              ← Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer disabled:opacity-40"
              style={{ borderColor: "#E5E7EB", color: "#374151" }}>
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Vendor Profile Drawer */}
      {drawerBranch && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.3)" }}
            onClick={closeDrawer}
          />

          {/* Panel */}
          <div
            className="fixed top-0 right-0 h-full z-50 flex flex-col overflow-hidden"
            style={{ width: "min(420px, 100vw)", background: "#fff", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)" }}>

            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
              <div>
                <h2 className="text-sm font-bold text-black">Vendor Profile</h2>
                <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>Branch: {drawerBranch.name}</p>
              </div>
              <button onClick={closeDrawer} className="p-1.5 rounded-xl cursor-pointer transition-colors hover:bg-gray-100" style={{ color: "#6B7280" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {drawerLoading ? (
                <div className="flex items-center justify-center py-20">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2.5" strokeLinecap="round" className="animate-spin">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                </div>
              ) : (
                <>
                  {/* Logo + name */}
                  <div className="flex items-center gap-4 mb-6">
                    {vendorDetail?.logoUrl ? (
                      <img src={vendorDetail.logoUrl} alt="logo" className="w-16 h-16 rounded-2xl object-cover" style={{ border: "1px solid #E5E7EB" }} />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
                        style={{ background: PRIMARY }}>
                        {(vendorDetail?.name ?? drawerBranch.vendorName).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-black text-base">{vendorDetail?.name ?? drawerBranch.vendorName}</p>
                      {vendorDetail?.businessType && (
                        <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{vendorDetail.businessType}</p>
                      )}
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        {vendorDetail && !vendorDetail.isActive && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#DC2626" }}>Deactivated</span>
                        )}
                        {vendorDetail?.isSuspended && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "#FEF3C7", color: "#D97706" }}>Suspended</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Info rows */}
                  <div className="flex flex-col gap-3">
                    <InfoRow icon={
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    } label="Email" value={vendorDetail?.email ?? drawerBranch.vendorEmail} />

                    <InfoRow icon={
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
                    } label="Phone" value={vendorDetail?.phone ?? drawerBranch.vendorPhone ?? "—"} />

                    <InfoRow icon={
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    } label="City" value={vendorDetail?.city ?? drawerBranch.vendorCity ?? "—"} />

                    <InfoRow icon={
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                    } label="Profile Slug" value={vendorDetail?.slug ?? drawerBranch.vendorSlug ?? "—"} mono />

                    {vendorDetail?.createdAt && (
                      <InfoRow icon={
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      } label="Joined" value={fmt(vendorDetail.createdAt)} />
                    )}
                  </div>

                  {/* About */}
                  {vendorDetail?.about && (
                    <div className="mt-5">
                      <p className="text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>About</p>
                      <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>{vendorDetail.about}</p>
                    </div>
                  )}

                  {/* Branch this vendor added */}
                  <div className="mt-5 p-4 rounded-xl" style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: "#374151" }}>Branch Details</p>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between">
                        <span className="text-xs" style={{ color: "#6B7280" }}>Name</span>
                        <span className="text-xs font-medium text-black">{drawerBranch.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs" style={{ color: "#6B7280" }}>City</span>
                        <span className="text-xs font-medium text-black">{drawerBranch.city}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs" style={{ color: "#6B7280" }}>Area</span>
                        <span className="text-xs font-medium text-black">{drawerBranch.area}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs" style={{ color: "#6B7280" }}>Status</span>
                        <span className="text-xs font-semibold" style={{ color: drawerBranch.isApproved ? "#16A34A" : "#D97706" }}>
                          {drawerBranch.isApproved ? "Approved" : "Pending"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs" style={{ color: "#6B7280" }}>Added</span>
                        <span className="text-xs font-medium text-black">{fmt(drawerBranch.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Drawer footer actions */}
            {!drawerLoading && (
              <div className="px-5 py-4 flex gap-2" style={{ borderTop: "1px solid #F3F4F6" }}>
                <button
                  onClick={() => handleApprove(drawerBranch.id)}
                  disabled={toggling === drawerBranch.id}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all disabled:opacity-50"
                  style={drawerBranch.isApproved
                    ? { background: "#F3F4F6", color: "#374151" }
                    : { background: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0" }
                  }>
                  {toggling === drawerBranch.id ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                  ) : drawerBranch.isApproved ? "Revoke Approval" : "Approve Branch"}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3 py-2.5 px-3 rounded-xl" style={{ background: "#F9FAFB" }}>
      <span className="mt-0.5 shrink-0" style={{ color: "#6B7280" }}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-medium mb-0.5" style={{ color: "#9CA3AF" }}>{label}</p>
        <p className={`text-xs font-medium text-black break-all ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
    </div>
  );
}
