"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

// ─── Types ────────────────────────────────────────────────────────────────────
type PackageCategory = "Wedding" | "Engagement" | "Birthday" | "Corporate" | "Anniversary" | "Other";
type PackageStatus   = "active" | "inactive";

interface Package {
  id:          string;
  name:        string;
  category:    PackageCategory;
  description: string | null;
  price:       number;
  maxGuests:   number | null;
  duration:    string | null;
  includes:    string[];
  status:      PackageStatus;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 8;
const CATEGORIES: PackageCategory[] = ["Wedding", "Engagement", "Birthday", "Corporate", "Anniversary", "Other"];

const CATEGORY_COLOR: Record<PackageCategory, { bg: string; color: string }> = {
  Wedding:     { bg: "#FFF0F4", color: "#FF3B6B" },
  Engagement:  { bg: "#F5F3FF", color: "#7C3AED" },
  Birthday:    { bg: "#FFF7ED", color: "#EA580C" },
  Corporate:   { bg: "#EFF6FF", color: "#2563EB" },
  Anniversary: { bg: "#F0FDF4", color: "#16A34A" },
  Other:       { bg: "#F9FAFB", color: "#6B7280" },
};

const FILTER_TABS = [
  { label: "All",      value: "all"      },
  { label: "Active",   value: "active"   },
  { label: "Inactive", value: "inactive" },
] as const;

type FilterValue = "all" | PackageStatus;

type FormState = Omit<Package, "id">;

const EMPTY_FORM: FormState = {
  name: "", category: "Wedding", description: null,
  price: 0, maxGuests: null, duration: null, includes: [], status: "active",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) { return "Rs. " + n.toLocaleString("en-PK"); }
function displayId(id: string) { return "PKG-" + id.slice(0, 8).toUpperCase(); }

// ─── PDF ──────────────────────────────────────────────────────────────────────
function generatePackagePDF(pkg: Package) {
  const fmtRs = (n: number) => "Rs. " + n.toLocaleString("en-PK");
  const date  = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const cat   = CATEGORY_COLOR[pkg.category] ?? CATEGORY_COLOR.Other;

  const includesHTML = pkg.includes.length > 0
    ? `<p class="section-title">What's Included</p>
       <ul class="inc-list">${pkg.includes.map(i => `<li>${i}</li>`).join("")}</ul>`
    : "";

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<title>${pkg.name} – EventEase</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,sans-serif;color:#111;background:#fff;padding:40px;font-size:13px}
  @media print{body{padding:24px}.no-print{display:none!important}@page{margin:16mm;size:A4}}
  .header{display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:20px;border-bottom:2px solid ${cat.color};margin-bottom:28px}
  .brand{font-size:22px;font-weight:800;color:#111}.brand-sub{font-size:11px;color:#888;margin-top:2px}
  .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600}
  .pkg-name{font-size:26px;font-weight:800;color:#111;margin-bottom:8px}
  .cat-badge{display:inline-block;margin-bottom:16px;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:600;background:${cat.bg};color:${cat.color}}
  .desc{font-size:13px;color:#555;line-height:1.7;background:#f9f9f9;border-radius:10px;padding:14px 16px;margin-bottom:24px}
  .info-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-bottom:28px}
  .info-card{background:#f9f9f9;border-radius:10px;padding:16px}
  .info-card .lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:6px}
  .info-card .val{font-size:17px;font-weight:800;color:#111}
  .section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:12px}
  .inc-list{list-style:none;display:flex;flex-direction:column;gap:8px}
  .inc-list li{padding:10px 14px;background:#f9f9f9;border-radius:8px;font-size:13px;color:#333;display:flex;align-items:center;gap:10px}
  .inc-list li::before{content:"✓";color:${cat.color};font-weight:700}
  .footer{margin-top:40px;padding-top:16px;border-top:1px solid #E5E7EB;display:flex;justify-content:space-between;font-size:11px;color:#aaa}
  .print-btn{display:block;margin:0 auto 32px;padding:10px 28px;background:${cat.color};color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer}
</style></head><body>
<button class="print-btn no-print" onclick="window.print()">Download / Print PDF</button>
<div class="header">
  <div><div class="brand">EventEase</div><div class="brand-sub">Package Details</div></div>
  <div style="text-align:right">
    <div style="font-size:13px;font-weight:700;color:#111;margin-bottom:4px">${displayId(pkg.id)}</div>
    <span class="badge" style="background:${pkg.status==="active"?"#F0FDF4":"#F9FAFB"};color:${pkg.status==="active"?"#16A34A":"#9CA3AF"}">${pkg.status==="active"?"Active":"Inactive"}</span>
  </div>
</div>
<span class="cat-badge">${pkg.category}</span>
<div class="pkg-name">${pkg.name}</div>
${pkg.description ? `<div class="desc">${pkg.description}</div>` : ""}
<div class="info-grid">
  <div class="info-card"><div class="lbl">Package Price</div><div class="val" style="color:${cat.color}">${fmtRs(pkg.price)}</div></div>
  ${pkg.duration ? `<div class="info-card"><div class="lbl">Duration</div><div class="val" style="font-size:15px">${pkg.duration}</div></div>` : ""}
</div>
${includesHTML}
<div class="footer"><span>Generated by EventEase</span><span>${date}</span></div>
<script>window.onload=()=>{window.print()}</script>
</body></html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

function generateAllPackagesPDF(pkgs: Package[]) {
  if (!pkgs.length) return;
  const fmtRs  = (n: number) => "Rs. " + n.toLocaleString("en-PK");
  const date   = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const active = pkgs.filter(p => p.status === "active").length;

  const rowsHTML = pkgs.map((p, i) => {
    const c = CATEGORY_COLOR[p.category] ?? CATEGORY_COLOR.Other;
    return `<tr>
      <td style="text-align:center;color:#aaa">${i + 1}</td>
      <td><strong>${p.name}</strong>${p.description ? `<br/><span style="font-size:11px;color:#888">${p.description.slice(0,60)}${p.description.length>60?"…":""}</span>` : ""}</td>
      <td><span style="background:${c.bg};color:${c.color};padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600">${p.category}</span></td>
      <td><span style="color:${p.status==="active"?"#16A34A":"#9CA3AF"};font-weight:600">${p.status==="active"?"Active":"Inactive"}</span></td>
      <td style="text-align:right;font-weight:700">${fmtRs(p.price)}</td>
    </tr>`;
  }).join("");

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<title>Packages Catalog – EventEase</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,sans-serif;color:#111;background:#fff;padding:40px;font-size:13px}
  @media print{body{padding:24px}.no-print{display:none!important}@page{margin:16mm;size:A4}}
  .header{display:flex;align-items:center;justify-content:space-between;padding-bottom:20px;border-bottom:2px solid #FF3B6B;margin-bottom:28px}
  .brand{font-size:22px;font-weight:800;color:#111}.brand-sub{font-size:11px;color:#888;margin-top:2px}
  .title{font-size:26px;font-weight:800;color:#111;margin-bottom:6px}
  .subtitle{font-size:12px;color:#888;margin-bottom:24px}
  .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:28px}
  .stat{background:#f9f9f9;border-radius:10px;padding:16px}
  .stat .n{font-size:22px;font-weight:800}.stat .l{font-size:11px;color:#888;margin-top:3px}
  table{width:100%;border-collapse:collapse;margin-bottom:32px}
  thead tr{background:#FFF0F4}
  thead th{padding:10px 12px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#FF3B6B}
  thead th.r{text-align:right}
  tbody tr{border-bottom:1px solid #F4F4F5}
  tbody tr:last-child{border-bottom:none}
  tbody td{padding:10px 12px;font-size:13px;color:#333;vertical-align:top}
  .footer{margin-top:40px;padding-top:16px;border-top:1px solid #E5E7EB;display:flex;justify-content:space-between;font-size:11px;color:#aaa}
  .print-btn{display:block;margin:0 auto 32px;padding:10px 28px;background:#FF3B6B;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer}
</style></head><body>
<button class="print-btn no-print" onclick="window.print()">Download / Print PDF</button>
<div class="header">
  <div><div class="brand">EventEase</div><div class="brand-sub">Packages Catalog</div></div>
  <div style="font-size:12px;color:#aaa">${date}</div>
</div>
<div class="title">Packages Catalog</div>
<div class="subtitle">${pkgs.length} package${pkgs.length!==1?"s":""} · ${active} active · ${pkgs.length-active} inactive</div>
<div class="stats">
  <div class="stat"><div class="n">${pkgs.length}</div><div class="l">Total Packages</div></div>
  <div class="stat"><div class="n" style="color:#16A34A">${active}</div><div class="l">Active</div></div>
  <div class="stat"><div class="n" style="color:#9CA3AF">${pkgs.length-active}</div><div class="l">Inactive</div></div>
</div>
<table>
  <thead><tr>
    <th style="width:32px">#</th><th>Package Name</th><th>Category</th>
    <th>Status</th><th class="r">Price</th>
  </tr></thead>
  <tbody>${rowsHTML}</tbody>
</table>
<div class="footer"><span>Generated by EventEase</span><span>${date}</span></div>
<script>window.onload=()=>{window.print()}</script>
</body></html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PackagesPage() {
  const { accessToken } = useAuthStore();

  const [packages,  setPackages]  = useState<Package[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState(false);

  const [filter,   setFilter]   = useState<FilterValue>("all");
  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(1);

  const [formOpen,    setFormOpen]    = useState(false);
  const [editTarget,  setEditTarget]  = useState<Package | null>(null);
  const [detailTarget,setDetailTarget]= useState<Package | null>(null);
  const [deleteTarget,setDeleteTarget]= useState<Package | null>(null);

  async function fetchPackages() {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await api.get<{ packages: Package[] }>("/api/vendor/packages", accessToken);
      if (res.success) setPackages(res.packages ?? []);
    } finally { setLoading(false); }
  }
  useEffect(() => { fetchPackages(); }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = packages.filter(p => {
    const matchFilter = filter === "all" || p.status === filter;
    const s = search.toLowerCase();
    const matchSearch = !s || p.name.toLowerCase().includes(s) || p.category.toLowerCase().includes(s) || p.description?.toLowerCase().includes(s);
    return matchFilter && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function changeFilter(v: FilterValue) { setFilter(v); setPage(1); }
  function changeSearch(v: string)      { setSearch(v); setPage(1); }

  const counts = {
    all:      packages.length,
    active:   packages.filter(p => p.status === "active").length,
    inactive: packages.filter(p => p.status === "inactive").length,
  };

  const prices   = packages.map(p => p.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  async function handleCreate(f: FormState) {
    setSaving(true);
    try {
      const res = await api.post<{ id: string }>("/api/vendor/packages", f, accessToken ?? undefined);
      if (res.success) { setFormOpen(false); await fetchPackages(); setPage(1); }
    } finally { setSaving(false); }
  }

  async function handleEdit(f: FormState) {
    if (!editTarget) return;
    setSaving(true);
    try {
      const res = await api.patch(`/api/vendor/packages/${editTarget.id}`, f, accessToken ?? undefined);
      if (res.success) { setEditTarget(null); await fetchPackages(); }
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      const res = await api.delete(`/api/vendor/packages/${id}`, accessToken ?? undefined);
      if (res.success) {
        setDeleteTarget(null);
        if (detailTarget?.id === id) setDetailTarget(null);
        setPackages(prev => prev.filter(p => p.id !== id));
      }
    } finally { setDeleting(false); }
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-7 w-28 rounded-xl bg-gray-200 animate-pulse mb-2" />
            <div className="h-4 w-44 rounded-lg bg-gray-100 animate-pulse" />
          </div>
          <div className="h-10 w-32 rounded-2xl bg-gray-200 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
              <div className="h-8 w-10 rounded bg-gray-200 mb-2" />
              <div className="h-3 w-24 rounded bg-gray-100" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                <div><div className="h-4 w-36 rounded bg-gray-200 mb-1.5" /><div className="h-3 w-24 rounded bg-gray-100" /></div>
              </div>
              <div className="h-3 w-full rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {formOpen && (
        <PackageForm title="New Package" initial={EMPTY_FORM} submitting={saving} onClose={() => setFormOpen(false)} onSubmit={handleCreate} />
      )}
      {editTarget && (
        <PackageForm title="Edit Package" subtitle={displayId(editTarget.id)} initial={editTarget} submitting={saving} onClose={() => setEditTarget(null)} onSubmit={handleEdit} />
      )}
      {detailTarget && (
        <DetailDrawer
          pkg={packages.find(p => p.id === detailTarget.id) ?? detailTarget}
          onClose={() => setDetailTarget(null)}
          onEdit={() => { setEditTarget(detailTarget); setDetailTarget(null); }}
          onDelete={() => { setDeleteTarget(detailTarget); setDetailTarget(null); }}
          onDownload={() => generatePackagePDF(detailTarget)}
        />
      )}
      {deleteTarget && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl p-6 w-[320px] shadow-2xl">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#FEF2F2" }}>
              <TrashIcon size={20} color="#DC2626" />
            </div>
            <p className="text-base font-bold text-black text-center">Delete Package?</p>
            <p className="text-sm text-center mt-1 mb-5" style={{ color: "var(--fg-muted)" }}>
              <span className="font-semibold text-black">&quot;{deleteTarget.name}&quot;</span> will be permanently deleted.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer hover:opacity-80 disabled:opacity-50"
                style={{ background: "var(--bg-subtle)", color: "var(--fg)" }}>
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteTarget.id)} disabled={deleting}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer hover:opacity-90 disabled:opacity-70 flex items-center justify-center gap-2"
                style={{ background: "#DC2626", color: "#fff" }}>
                {deleting && <SpinIcon />}
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </>
      )}

      <div className="p-4 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl lg:text-2xl font-semibold text-black tracking-tight">Packages</h1>
            <p className="text-sm mt-1" style={{ color: "var(--fg-muted)" }}>Create and manage service packages</p>
          </div>
          <div className="flex items-center gap-2">
            {packages.length > 0 && (
              <button onClick={() => generateAllPackagesPDF(packages)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50"
                style={{ border: "1px solid #E5E7EB", color: "#374151", background: "#fff" }}>
                <DownloadIcon />
                <span className="hidden sm:inline">Download All</span>
              </button>
            )}
            <button onClick={() => setFormOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90"
              style={{ background: "var(--primary)", color: "#ffffff" }}>
              <PlusIcon /> New Package
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-black">{counts.all}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>Total {counts.all === 1 ? "Package" : "Packages"}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-2xl font-bold" style={{ color: "#16A34A" }}>{counts.active}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>Active</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-2xl font-bold" style={{ color: "#9CA3AF" }}>{counts.inactive}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>Inactive</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-base font-bold" style={{ color: "var(--primary)" }}>
              {packages.length ? `${(minPrice/1000).toFixed(0)}K – ${(maxPrice/1000).toFixed(0)}K` : "—"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>Price Range (PKR)</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          <div className="flex border-b overflow-x-auto" style={{ borderColor: "#F4F4F5" }}>
            {FILTER_TABS.map(t => (
              <button key={t.value} onClick={() => changeFilter(t.value)}
                className="flex-1 min-w-fit py-3 px-2 text-sm font-medium cursor-pointer relative whitespace-nowrap"
                style={{ color: filter === t.value ? "var(--primary)" : "var(--fg-muted)" }}>
                {t.label}
                <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full" style={{
                  background: filter === t.value ? "var(--primary-light)" : "var(--bg-subtle)",
                  color: filter === t.value ? "var(--primary)" : "var(--fg-muted)",
                }}>{counts[t.value]}</span>
                {filter === t.value && (
                  <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full" style={{ background: "var(--primary)" }} />
                )}
              </button>
            ))}
          </div>
          <div className="px-4 py-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--fg-subtle)" }}><SearchIcon /></span>
              <input value={search} onChange={e => changeSearch(e.target.value)}
                placeholder="Search by name, category, description..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none border"
                style={{ background: "var(--bg-subtle)", borderColor: "#E5E7EB", color: "var(--fg)" }} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {paginated.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm py-16 flex flex-col items-center text-center">
              <BoxIcon />
              <p className="text-sm font-medium mt-3 text-black">No packages found</p>
              <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>
                {packages.length === 0 ? "Create your first package to get started" : "Try changing the filter or search"}
              </p>
            </div>
          ) : paginated.map(pkg => (
            <PackageCard
              key={pkg.id} pkg={pkg}
              onView={() => setDetailTarget(pkg)}
              onEdit={() => setEditTarget(pkg)}
              onDelete={() => setDeleteTarget(pkg)}
              onDownload={() => generatePackagePDF(pkg)}
            />
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm px-4 py-3 mt-4">
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
              Showing {(safePage-1)*PAGE_SIZE+1}–{Math.min(safePage*PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={safePage===1}
                className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-30 hover:bg-gray-100"
                style={{ color: "var(--fg-muted)" }}><ChevLeftIcon /></button>
              {Array.from({length: totalPages},(_,i)=>i+1).map(n => (
                <button key={n} onClick={() => setPage(n)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold cursor-pointer"
                  style={{ background: safePage===n ? "var(--primary)" : "transparent", color: safePage===n ? "#fff" : "var(--fg-muted)" }}>
                  {n}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={safePage===totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-30 hover:bg-gray-100"
                style={{ color: "var(--fg-muted)" }}><ChevRightIcon /></button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Package Card ─────────────────────────────────────────────────────────────
function PackageCard({ pkg, onView, onEdit, onDelete, onDownload }: {
  pkg: Package; onView: () => void; onEdit: () => void;
  onDelete: () => void; onDownload: () => void;
}) {
  const cat = CATEGORY_COLOR[pkg.category] ?? CATEGORY_COLOR.Other;
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 cursor-pointer" onClick={onView}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
            style={{ background: cat.bg, color: cat.color }}>{pkg.category}</span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
            style={pkg.status === "active"
              ? { background: "#F0FDF4", color: "#16A34A" }
              : { background: "#F9FAFB", color: "#9CA3AF" }}>
            {pkg.status === "active" ? "Active" : "Inactive"}
          </span>
        </div>
        <span className="text-base font-bold text-black shrink-0">{fmt(pkg.price)}</span>
      </div>
      <p className="text-sm font-semibold text-black mb-1">{pkg.name}</p>
      {pkg.description && (
        <p className="text-xs mb-2 line-clamp-1" style={{ color: "var(--fg-muted)" }}>{pkg.description}</p>
      )}
      <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mb-3">
        {pkg.duration && (
          <div className="flex items-center gap-1.5">
            <ClockIcon />
            <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{pkg.duration}</span>
          </div>
        )}
        {pkg.includes.length > 0 && (
          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--bg-subtle)", color: "var(--fg-muted)" }}>
            {pkg.includes.length} item{pkg.includes.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between pt-2.5 border-t" style={{ borderColor: "#F4F4F5" }}
        onClick={e => e.stopPropagation()}>
        <span className="text-[10px] font-mono font-medium" style={{ color: "var(--fg-subtle)" }}>{displayId(pkg.id)}</span>
        <div className="flex items-center gap-1">
          <button onClick={e => { e.stopPropagation(); onDownload(); }}
            className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:bg-blue-50"
            style={{ color: "#2563EB" }} title="Download PDF">
            <DownloadIcon />
          </button>
          <button onClick={e => { e.stopPropagation(); onEdit(); }}
            className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:bg-amber-50"
            style={{ color: "#D97706" }} title="Edit">
            <EditIcon />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }}
            className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:bg-red-50"
            style={{ color: "#DC2626" }} title="Delete">
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────
function DetailDrawer({ pkg, onClose, onEdit, onDelete, onDownload }: {
  pkg: Package; onClose: () => void; onEdit: () => void; onDelete: () => void;
  onDownload: () => void;
}) {
  const cat = CATEGORY_COLOR[pkg.category] ?? CATEGORY_COLOR.Other;
  const content = (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "#F4F4F5" }}>
        <div>
          <p className="text-sm font-bold text-black">{pkg.name}</p>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: cat.bg, color: cat.color }}>{pkg.category}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80"
            style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
            <PDFIcon /> PDF
          </button>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer hover:bg-gray-100" style={{ color: "var(--fg-muted)" }}>
            <XIcon />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-5 flex flex-col gap-5">
        <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: "var(--bg-subtle)" }}>
          <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0"
            style={{ background: cat.color }}>
            {pkg.category[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-black">{pkg.name}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>
              {pkg.status === "active" ? "Active" : "Inactive"} · {pkg.category}
            </p>
          </div>
          <p className="text-base font-bold text-black shrink-0">{fmt(pkg.price)}</p>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Details</p>
          <div className="flex flex-col">
            {[
              { label: "Price",    value: fmt(pkg.price) },
              { label: "Duration", value: pkg.duration ?? "—" },
              { label: "Status",   value: pkg.status === "active" ? "Active" : "Inactive" },
            ].map((row, i) => (
              <div key={row.label} className={`flex items-center justify-between py-2.5 ${i < 2 ? "border-b" : ""}`} style={{ borderColor: "#F4F4F5" }}>
                <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{row.label}</span>
                <span className="text-sm font-semibold text-black">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {pkg.description && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--fg-subtle)" }}>Description</p>
            <p className="text-sm rounded-xl p-3 leading-relaxed" style={{ background: "var(--bg-subtle)", color: "var(--fg-muted)" }}>{pkg.description}</p>
          </div>
        )}

        {pkg.includes.length > 0 && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>What&apos;s Included</p>
            <div className="flex flex-col gap-2">
              {pkg.includes.map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: "var(--bg-subtle)", border: "1px solid #E5E7EB" }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "#E5E7EB" }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <span className="text-sm text-black">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button onClick={onEdit}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer transition-all"
            style={{ background: "var(--bg-subtle)", color: "var(--fg)" }}>
            Edit Package
          </button>
          <button onClick={onDelete}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer transition-all"
            style={{ background: "#FEF2F2", color: "#DC2626" }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed z-40 bottom-0 left-0 right-0 rounded-t-3xl bg-white flex flex-col lg:hidden overflow-hidden" style={{ maxHeight: "92dvh", boxShadow: "0 -4px 40px rgba(0,0,0,0.12)" }}>
        <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="w-10 h-1 rounded-full" style={{ background: "#E5E7EB" }} /></div>
        {content}
      </div>
      <div className="hidden lg:flex fixed z-40 right-0 top-0 bottom-0 w-[480px] bg-white flex-col overflow-hidden rounded-l-3xl" style={{ boxShadow: "-4px 0 40px rgba(0,0,0,0.12)" }}>
        {content}
      </div>
    </>
  );
}

// ─── Package Form ─────────────────────────────────────────────────────────────
function PackageForm({ title, subtitle, initial, submitting, onClose, onSubmit }: {
  title: string; subtitle?: string; initial: FormState;
  submitting?: boolean; onClose: () => void; onSubmit: (f: FormState) => void;
}) {
  const [f, setF]             = useState<FormState>(initial);
  const [includeInput, setII] = useState("");
  const [errors, setErrors]   = useState<Record<string, string>>({});

  function setField<K extends keyof FormState>(k: K, v: FormState[K]) { setF(p => ({ ...p, [k]: v })); }

  function addInclude() {
    const val = includeInput.trim();
    if (!val || f.includes.includes(val)) return;
    setField("includes", [...f.includes, val]);
    setII("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const e2: Record<string, string> = {};
    if (!f.name.trim())           e2.name  = "Package name required";
    if (!f.price || f.price <= 0) e2.price = "Enter a valid price";
    setErrors(e2);
    if (Object.keys(e2).length > 0) return;
    onSubmit({ ...f, maxGuests: null });
  }

  const inp      = "px-4 py-3 rounded-xl border text-sm outline-none w-full";
  const inpStyle = { background: "var(--bg-subtle)", borderColor: "#D1D5DB", color: "var(--fg)" };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed z-50 bottom-0 left-0 right-0 rounded-t-3xl bg-white flex flex-col overflow-hidden max-h-[92dvh] lg:bottom-0 lg:left-auto lg:right-0 lg:top-0 lg:w-[520px] lg:rounded-none lg:rounded-l-3xl lg:max-h-full"
        style={{ boxShadow: "0 -4px 40px rgba(0,0,0,0.14)" }}>
        <div className="flex justify-center pt-3 pb-1 lg:hidden shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "#E5E7EB" }} />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "#F4F4F5" }}>
          <div>
            <p className="text-sm font-bold text-black">{title}</p>
            {subtitle && <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer hover:bg-gray-100" style={{ color: "var(--fg-muted)" }}>
            <XIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto px-5 py-5 flex flex-col gap-5">

          {/* Package Info */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Package Info</p>
            <div className="flex flex-col gap-3">
              <div>
                <input value={f.name} onChange={e => setField("name", e.target.value)}
                  placeholder="Package name *" className={inp}
                  style={{ ...inpStyle, borderColor: errors.name ? "#DC2626" : "#D1D5DB" }} required />
                {errors.name && <p className="text-xs mt-1" style={{ color: "#DC2626" }}>{errors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={f.category} onChange={e => setField("category", e.target.value as PackageCategory)} className={inp} style={inpStyle}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={f.status} onChange={e => setField("status", e.target.value as PackageStatus)} className={inp} style={inpStyle}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <textarea value={f.description ?? ""} onChange={e => setField("description", e.target.value || null)}
                rows={3} placeholder="Brief description (optional)"
                className="px-4 py-3 rounded-xl border text-sm outline-none resize-none w-full"
                style={{ ...inpStyle, minHeight: "80px" }} />
            </div>
          </div>

          {/* Pricing */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Pricing</p>
            <div className="flex flex-col gap-3">
              <div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: "var(--fg-muted)" }}>Rs.</span>
                  <input type="number" placeholder="0" value={f.price || ""}
                    onChange={e => setField("price", Number(e.target.value))} min={0}
                    className={`${inp} pl-11`}
                    style={{ ...inpStyle, borderColor: errors.price ? "#DC2626" : "#D1D5DB" }} />
                </div>
                {errors.price && <p className="text-xs mt-1" style={{ color: "#DC2626" }}>{errors.price}</p>}
                <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>Price *</p>
              </div>
              <div>
                <input value={f.duration ?? ""} onChange={e => setField("duration", e.target.value || null)}
                  placeholder="e.g. 6 Hours, Full Day" className={inp} style={inpStyle} />
                <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>Duration</p>
              </div>
            </div>
          </div>

          {/* Includes */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>
              What&apos;s Included <span className="font-normal normal-case" style={{ letterSpacing: 0, color: "var(--fg-subtle)" }}>(optional)</span>
            </p>
            <div className="flex gap-2 mb-3">
              <input value={includeInput} onChange={e => setII(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addInclude(); } }}
                placeholder="Add a service or item..."
                className="flex-1 px-4 py-3 rounded-xl text-sm border outline-none"
                style={inpStyle} />
              <button type="button" onClick={addInclude}
                className="px-4 py-3 rounded-xl text-sm font-semibold shrink-0 cursor-pointer transition-colors hover:bg-gray-200"
                style={{ background: "#F3F4F6", color: "#374151" }}>Add</button>
            </div>
            {f.includes.length > 0 && (
              <div className="flex flex-col gap-2">
                {f.includes.map(item => (
                  <div key={item} className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: "var(--bg-subtle)", border: "1px solid #E5E7EB" }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: "#E5E7EB" }}>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <span className="text-sm text-black">{item}</span>
                    </div>
                    <button type="button" onClick={() => setField("includes", f.includes.filter(i => i !== item))}
                      className="w-6 h-6 flex items-center justify-center rounded-lg cursor-pointer hover:bg-red-50"
                      style={{ color: "#DC2626" }}>
                      <XSmIcon />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={submitting}
            className="w-full py-3.5 rounded-2xl text-sm font-bold cursor-pointer transition-opacity hover:opacity-90 mt-1 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: "var(--primary)", color: "#ffffff" }}>
            {submitting && <SpinIcon />}
            {submitting ? "Saving…" : title}
          </button>
        </form>
      </div>
    </>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function PlusIcon()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function XIcon()        { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function XSmIcon()      { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function EditIcon()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function TrashIcon({ size = 14, color = "currentColor" }: { size?: number; color?: string }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>; }
function PDFIcon()      { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>; }
function SearchIcon()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; }
function BoxIcon()      { return <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fg-subtle)" }}><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>; }
function ClockIcon()    { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fg-subtle)" }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function DownloadIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>; }
function SpinIcon()     { return <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>; }
function ChevLeftIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>; }
function ChevRightIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>; }
