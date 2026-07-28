"use client";

import { useState } from "react";
import { useStore, Package, PackageCategory, PackageStatus } from "@/store/useStore";

// ─── PDF Helpers ──────────────────────────────────────────────────────────────
const CAT_BG: Record<string, [number,number,number]> = {
  Wedding:[255,240,244], Engagement:[245,243,255], Birthday:[255,247,237],
  Corporate:[239,246,255], Anniversary:[240,253,244], Other:[249,250,251],
};
const CAT_FG: Record<string, [number,number,number]> = {
  Wedding:[255,59,107], Engagement:[124,58,237], Birthday:[234,88,12],
  Corporate:[37,99,235], Anniversary:[22,163,74], Other:[107,114,128],
};

function pdfHeader(doc: InstanceType<Awaited<typeof import("jspdf")>["jsPDF"]>, rightLabel: string) {
  const PW = 210, M = 20;
  doc.setFont("helvetica","bold"); doc.setFontSize(12); doc.setTextColor(17,24,39);
  doc.text("EventEase", M, 15);
  doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(107,114,128);
  doc.text(rightLabel, PW - M, 15, {align:"right"});
  doc.setDrawColor(229,231,235); doc.setLineWidth(0.4);
  doc.line(M, 20, PW - M, 20);
}

function pdfFooter(doc: InstanceType<Awaited<typeof import("jspdf")>["jsPDF"]>, note: string) {
  const PW = 210, M = 20;
  doc.setDrawColor(229,231,235); doc.setLineWidth(0.4);
  doc.line(M, 281, PW - M, 281);
  doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(156,163,175);
  doc.text("EventEase", M, 287);
  doc.text(note, PW - M, 287, {align:"right"});
}

async function buildPackagePage(doc: InstanceType<Awaited<typeof import("jspdf")>["jsPDF"]>, pkg: Package, isFirst: boolean) {
  if (!isFirst) doc.addPage();
  const autoTable = (await import("jspdf-autotable")).default;
  const PW = 210, M = 20;
  const date = new Date().toLocaleDateString("en-PK",{day:"numeric",month:"short",year:"numeric"});

  pdfHeader(doc, date);

  // Package name + subtitle line
  let y = 32;
  doc.setFont("helvetica","bold"); doc.setFontSize(18); doc.setTextColor(17,24,39);
  doc.text(pkg.name, M, y); y += 7;

  doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(107,114,128);
  const statusLabel = pkg.status === "active" ? "Active" : "Inactive";
  doc.text(`${pkg.category}  ·  ${statusLabel}  ·  Rs. ${pkg.price.toLocaleString("en-PK")}`, M, y); y += 8;

  doc.setDrawColor(229,231,235); doc.setLineWidth(0.4);
  doc.line(M, y, PW - M, y); y += 8;

  // Details rows — label/value pairs like Booking.com
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    tableWidth: PW - M * 2,
    body: [
      ["Price",      `Rs. ${pkg.price.toLocaleString("en-PK")}`],
      ["Max Guests", `${pkg.maxGuests} guests`],
      ["Duration",   pkg.duration],
      ["Category",   pkg.category],
      ["Status",     statusLabel],
    ],
    styles: {
      font: "helvetica", fontSize: 10,
      textColor: [17,24,39],
      cellPadding: { top:5, bottom:5, left:4, right:4 },
    },
    columnStyles: {
      0: { cellWidth: 45, fontStyle:"normal", textColor:[107,114,128] },
      1: { cellWidth: "auto", fontStyle:"normal" },
    },
    theme: "plain",
    tableLineColor: [229,231,235],
    tableLineWidth: 0,
    didParseCell: (data) => {
      if (data.row.index % 2 === 0) data.cell.styles.fillColor = [250,250,251];
      else data.cell.styles.fillColor = [255,255,255];
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Description
  if (pkg.description) {
    doc.setDrawColor(229,231,235); doc.setLineWidth(0.4);
    doc.line(M, y, PW - M, y); y += 8;

    doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(17,24,39);
    doc.text("Description", M, y); y += 6;

    doc.setFont("helvetica","normal"); doc.setFontSize(9.5); doc.setTextColor(75,85,99);
    const lines = doc.splitTextToSize(pkg.description, PW - M * 2);
    doc.text(lines, M, y);
    y += lines.length * 5.5 + 10;
  }

  // What's included
  if (pkg.includes.length > 0) {
    doc.setDrawColor(229,231,235); doc.setLineWidth(0.4);
    doc.line(M, y, PW - M, y); y += 8;

    doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(17,24,39);
    doc.text("What's Included", M, y); y += 2;

    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      tableWidth: PW - M * 2,
      body: pkg.includes.map(item => [`${item}`]),
      styles: {
        font:"helvetica", fontSize:9.5,
        textColor:[17,24,39],
        cellPadding: { top:4, bottom:4, left:4, right:4 },
      },
      columnStyles: { 0: { cellWidth:"auto" } },
      theme:"plain",
      tableLineColor:[229,231,235], tableLineWidth:0,
      didParseCell: (data) => {
        data.cell.text = ["\u2013  " + data.cell.raw];
        if (data.row.index % 2 === 0) data.cell.styles.fillColor = [250,250,251];
        else data.cell.styles.fillColor = [255,255,255];
      },
    });
  }

  pdfFooter(doc, `ID: ${pkg.id}`);
}

async function downloadPackagePDF(pkg: Package) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit:"mm", format:"a4" });
  await buildPackagePage(doc, pkg, true);
  doc.save(`${pkg.name.replace(/\s+/g, "-")}.pdf`);
}

async function downloadAllPackagesPDF(pkgs: Package[]) {
  if (!pkgs.length) return;
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ unit:"mm", format:"a4" });
  const PW = 210, M = 20;
  const date = new Date().toLocaleDateString("en-PK",{day:"numeric",month:"short",year:"numeric"});

  // ── Cover page ──
  pdfHeader(doc, date);

  let y = 32;
  doc.setFont("helvetica","bold"); doc.setFontSize(20); doc.setTextColor(17,24,39);
  doc.text("Packages Catalog", M, y); y += 7;

  const active = pkgs.filter(p => p.status==="active").length;
  doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(107,114,128);
  doc.text(`${pkgs.length} packages  ·  ${active} active  ·  ${pkgs.length - active} inactive`, M, y); y += 8;

  doc.setDrawColor(229,231,235); doc.setLineWidth(0.4);
  doc.line(M, y, PW - M, y); y += 8;

  // Summary row
  const avgPrice = Math.round(pkgs.reduce((s,p)=>s+p.price,0)/pkgs.length);
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    tableWidth: PW - M * 2,
    body: [
      ["Total Packages", `${pkgs.length}`, "Active", `${active}`],
      ["Inactive", `${pkgs.length - active}`, "Avg Price", `Rs. ${avgPrice.toLocaleString("en-PK")}`],
    ],
    styles: { font:"helvetica", fontSize:10, textColor:[17,24,39], cellPadding:{top:5,bottom:5,left:6,right:4} },
    columnStyles: {
      0:{cellWidth:45, textColor:[107,114,128]},
      1:{cellWidth:45, fontStyle:"bold"},
      2:{cellWidth:45, textColor:[107,114,128]},
      3:{cellWidth:"auto", fontStyle:"bold"},
    },
    theme:"plain",
    tableLineWidth:0,
    didParseCell: (data) => {
      if (data.row.index % 2 === 0) data.cell.styles.fillColor=[250,250,251];
      else data.cell.styles.fillColor=[255,255,255];
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;
  doc.setDrawColor(229,231,235); doc.setLineWidth(0.4);
  doc.line(M, y, PW - M, y); y += 8;

  doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(17,24,39);
  doc.text("All Packages", M, y); y += 2;

  // Packages list table
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    tableWidth: PW - M * 2,
    head: [["#", "Package Name", "Category", "Status", "Price", "Guests"]],
    body: pkgs.map((p, i) => [
      `${i+1}`,
      p.name,
      p.category,
      p.status === "active" ? "Active" : "Inactive",
      `Rs. ${p.price.toLocaleString("en-PK")}`,
      `${p.maxGuests}`,
    ]),
    styles: { font:"helvetica", fontSize:9, textColor:[17,24,39], cellPadding:{top:5,bottom:5,left:5,right:4} },
    headStyles: { fillColor:[17,24,39], textColor:[255,255,255], fontStyle:"bold", fontSize:8.5, cellPadding:{top:6,bottom:6,left:5,right:4} },
    columnStyles: {
      0:{cellWidth:10, halign:"center"},
      1:{cellWidth:52},
      2:{cellWidth:28},
      3:{cellWidth:22},
      4:{cellWidth:38, halign:"right"},
      5:{cellWidth:20, halign:"right"},
    },
    alternateRowStyles:{ fillColor:[250,250,251] },
    theme:"striped",
    tableLineColor:[229,231,235], tableLineWidth:0.2,
    didParseCell: (data) => {
      if (data.column.index===3 && data.section==="body") {
        data.cell.styles.textColor = String(data.cell.raw)==="Active" ? [22,163,74] : [156,163,175];
      }
    },
  });

  pdfFooter(doc, `Generated ${date}`);

  // Individual package pages
  for (let i = 0; i < pkgs.length; i++) {
    await buildPackagePage(doc, pkgs[i], false);
  }

  doc.save(`event-ease-packages-${Date.now()}.pdf`);
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES: PackageCategory[] = ["Wedding", "Engagement", "Birthday", "Corporate", "Anniversary", "Other"];

const CATEGORY_COLOR: Record<PackageCategory, { bg: string; color: string }> = {
  Wedding:     { bg: "#FFF0F4", color: "#FF3B6B" },
  Engagement:  { bg: "#F5F3FF", color: "#7C3AED" },
  Birthday:    { bg: "#FFF7ED", color: "#EA580C" },
  Corporate:   { bg: "#EFF6FF", color: "#2563EB" },
  Anniversary: { bg: "#F0FDF4", color: "#16A34A" },
  Other:       { bg: "#F9FAFB", color: "#6B7280" },
};

const EMPTY_FORM: Omit<Package, "id"> = {
  name: "",
  category: "Wedding",
  description: "",
  price: 0,
  maxGuests: 0,
  duration: "",
  includes: [],
  status: "active",
};

type DrawerMode = "add" | "edit" | "detail" | null;

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PackagesPage() {
  const { packages, addPackage, updatePackage, deletePackage } = useStore();

  const [drawerMode, setDrawerMode]   = useState<DrawerMode>(null);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [filterCat, setFilterCat]     = useState<PackageCategory | "All">("All");
  const [filterStatus, setFilterStatus] = useState<PackageStatus | "All">("All");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [includeInput, setIncludeInput] = useState("");
  const [form, setForm]               = useState<Omit<Package, "id">>(EMPTY_FORM);
  const [formErrors, setFormErrors]   = useState<Record<string, string>>({});
  const [pdfLoading, setPdfLoading]   = useState<string | null>(null); // "all" | pkg.id

  const selected = selectedId ? packages.find(p => p.id === selectedId) ?? null : null;

  // Filtered list
  const visible = packages.filter(p => {
    if (filterCat !== "All" && p.category !== filterCat) return false;
    if (filterStatus !== "All" && p.status !== filterStatus) return false;
    return true;
  });

  // Stats
  const activeCount   = packages.filter(p => p.status === "active").length;
  const inactiveCount = packages.filter(p => p.status === "inactive").length;
  const minPrice      = packages.length ? Math.min(...packages.map(p => p.price)) : 0;
  const maxPrice      = packages.length ? Math.max(...packages.map(p => p.price)) : 0;

  // ── Handlers ──
  function openAdd() {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setIncludeInput("");
    setSelectedId(null);
    setDrawerMode("add");
  }

  function openEdit(pkg: Package) {
    setForm({ name: pkg.name, category: pkg.category, description: pkg.description, price: pkg.price, maxGuests: pkg.maxGuests, duration: pkg.duration, includes: [...pkg.includes], status: pkg.status });
    setFormErrors({});
    setIncludeInput("");
    setSelectedId(pkg.id);
    setDrawerMode("edit");
  }

  function openDetail(pkg: Package) {
    setSelectedId(pkg.id);
    setDrawerMode("detail");
  }

  function closeDrawer() {
    setDrawerMode(null);
    setSelectedId(null);
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim())       e.name     = "Package name required";
    if (!form.price || form.price <= 0) e.price = "Enter a valid price";
    if (!form.maxGuests || form.maxGuests <= 0) e.maxGuests = "Enter guest count";
    if (!form.duration.trim())   e.duration = "Duration required";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    if (drawerMode === "add") {
      addPackage({ ...form, id: `PKG-${Date.now()}` });
    } else if (drawerMode === "edit" && selectedId) {
      updatePackage({ ...form, id: selectedId });
    }
    closeDrawer();
  }

  function handleDelete(id: string) {
    deletePackage(id);
    setDeleteConfirmId(null);
    if (selectedId === id) closeDrawer();
  }

  function addInclude() {
    const val = includeInput.trim();
    if (!val || form.includes.includes(val)) return;
    setForm(f => ({ ...f, includes: [...f.includes, val] }));
    setIncludeInput("");
  }

  function removeInclude(item: string) {
    setForm(f => ({ ...f, includes: f.includes.filter(i => i !== item) }));
  }

  const drawerOpen = drawerMode !== null;

  return (
    <div className="p-4 lg:p-6 min-h-screen" style={{ background: "var(--bg-subtle, #F4F4F5)" }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-black">Packages</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>Manage your service packages</p>
        </div>
        <div className="flex items-center gap-2">
          {packages.length > 0 && (
            <button
              onClick={async () => { setPdfLoading("all"); await downloadAllPackagesPDF(packages); setPdfLoading(null); }}
              disabled={pdfLoading === "all"}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50 disabled:opacity-60"
              style={{ border: "1px solid #E5E7EB", color: "#374151", background: "#fff" }}>
              {pdfLoading === "all"
                ? <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0110 10" strokeLinecap="round"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              }
              Download All
            </button>
          )}
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: "var(--primary)", color: "#fff" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Package
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Packages", value: packages.length,  sub: "all packages" },
          { label: "Active",         value: activeCount,       sub: "available" },
          { label: "Inactive",       value: inactiveCount,     sub: "hidden" },
          { label: "Price Range",    value: `${(minPrice/1000).toFixed(0)}K–${(maxPrice/1000).toFixed(0)}K`, sub: "PKR" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl px-4 py-4" style={{ border: "1px solid #F0F0F0" }}>
            <p className="text-xl font-bold text-black">{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2 mb-5">
        {/* Category filter */}
        <div className="flex gap-1.5 flex-wrap">
          {(["All", ...CATEGORIES] as (PackageCategory | "All")[]).map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={filterCat === c
                ? { background: "#111", color: "#fff" }
                : { background: "#fff", color: "var(--fg-muted)", border: "1px solid #E5E7EB" }
              }>
              {c}
            </button>
          ))}
        </div>
        {/* Status filter */}
        <div className="flex gap-1.5 ml-auto">
          {(["All", "active", "inactive"] as (PackageStatus | "All")[]).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize"
              style={filterStatus === s
                ? { background: "#111", color: "#fff" }
                : { background: "#fff", color: "var(--fg-muted)", border: "1px solid #E5E7EB" }
              }>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Package Grid ── */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#F3F4F6" }}>
            <BoxIcon />
          </div>
          <p className="text-sm font-medium text-black mb-1">No packages found</p>
          <p className="text-xs" style={{ color: "var(--fg-muted)" }}>Try adjusting filters or add a new package</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map(pkg => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              onView={() => openDetail(pkg)}
              onEdit={() => openEdit(pkg)}
              onDelete={() => setDeleteConfirmId(pkg.id)}
              onDownload={async () => { setPdfLoading(pkg.id); await downloadPackagePDF(pkg); setPdfLoading(null); }}
              isDownloading={pdfLoading === pkg.id}
            />
          ))}
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirmId && (
        <>
          <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="fixed z-60 inset-0 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: "#FEF2F2" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </div>
              <p className="text-base font-bold text-black mb-1">Delete Package?</p>
              <p className="text-sm mb-5" style={{ color: "var(--fg-muted)" }}>
                "{packages.find(p => p.id === deleteConfirmId)?.name}" will be permanently deleted.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
                  style={{ border: "1px solid #E5E7EB", color: "var(--fg-muted)" }}>
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirmId)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "#DC2626" }}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Drawer Backdrop ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:bg-black/20" onClick={closeDrawer} />
      )}

      {/* ── Drawer ── */}
      {drawerOpen && (
        <>
          {/* Mobile: bottom sheet */}
          <div className="lg:hidden fixed z-50 bottom-0 left-0 right-0 rounded-t-3xl bg-white flex flex-col overflow-hidden"
            style={{ maxHeight: "92dvh", boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}>
            <DrawerContent
              mode={drawerMode!}
              pkg={selected}
              form={form} setForm={setForm}
              formErrors={formErrors}
              includeInput={includeInput} setIncludeInput={setIncludeInput}
              onAddInclude={addInclude} onRemoveInclude={removeInclude}
              onSave={handleSave}
              onEdit={() => selected && openEdit(selected)}
              onDelete={() => selected && setDeleteConfirmId(selected.id)}
              onDownload={async () => { if (selected) { setPdfLoading(selected.id); await downloadPackagePDF(selected); setPdfLoading(null); } }}
              isDownloading={selected ? pdfLoading === selected.id : false}
              onClose={closeDrawer}
            />
          </div>
          {/* Desktop: right drawer */}
          <div className="hidden lg:flex fixed z-50 right-0 top-0 bottom-0 w-[500px] bg-white flex-col overflow-hidden rounded-l-3xl"
            style={{ boxShadow: "-4px 0 40px rgba(0,0,0,0.12)" }}>
            <DrawerContent
              mode={drawerMode!}
              pkg={selected}
              form={form} setForm={setForm}
              formErrors={formErrors}
              includeInput={includeInput} setIncludeInput={setIncludeInput}
              onAddInclude={addInclude} onRemoveInclude={removeInclude}
              onSave={handleSave}
              onEdit={() => selected && openEdit(selected)}
              onDelete={() => selected && setDeleteConfirmId(selected.id)}
              onDownload={async () => { if (selected) { setPdfLoading(selected.id); await downloadPackagePDF(selected); setPdfLoading(null); } }}
              isDownloading={selected ? pdfLoading === selected.id : false}
              onClose={closeDrawer}
            />
          </div>
        </>
      )}
    </div>
  );
}

// ─── Package Card ─────────────────────────────────────────────────────────────
function PackageCard({ pkg, onView, onEdit, onDelete, onDownload, isDownloading }: {
  pkg: Package;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDownload: () => void;
  isDownloading: boolean;
}) {
  const cat = CATEGORY_COLOR[pkg.category];
  return (
    <div className="bg-white rounded-2xl overflow-hidden flex flex-col cursor-pointer group transition-shadow hover:shadow-md"
      style={{ border: "1px solid #F0F0F0" }}
      onClick={onView}>

      {/* Top section */}
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: cat.bg, color: cat.color }}>
                {pkg.category}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={pkg.status === "active"
                  ? { background: "#F0FDF4", color: "#16A34A" }
                  : { background: "#F9FAFB", color: "#9CA3AF" }}>
                {pkg.status === "active" ? "Active" : "Inactive"}
              </span>
            </div>
            <h3 className="text-base font-bold text-black leading-snug">{pkg.name}</h3>
          </div>
          {/* Action buttons */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            onClick={e => e.stopPropagation()}>
            <button onClick={onDownload} disabled={isDownloading}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-blue-50 disabled:opacity-50"
              style={{ color: "#2563EB" }} title="Download PDF">
              {isDownloading
                ? <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0110 10" strokeLinecap="round"/></svg>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              }
            </button>
            <button onClick={onEdit}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-100"
              style={{ color: "var(--fg-muted)" }}>
              <EditIcon />
            </button>
            <button onClick={onDelete}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50"
              style={{ color: "#DC2626" }}>
              <TrashIcon />
            </button>
          </div>
        </div>

        <p className="text-sm leading-relaxed mb-4 line-clamp-2" style={{ color: "var(--fg-muted)" }}>
          {pkg.description}
        </p>

        {/* Meta pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          <MetaPill icon={<GuestsIcon />} label={`${pkg.maxGuests} guests`} />
          <MetaPill icon={<ClockIcon />}  label={pkg.duration} />
          <MetaPill icon={<ListIcon />}   label={`${pkg.includes.length} items`} />
        </div>

        {/* Includes preview */}
        {pkg.includes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {pkg.includes.slice(0, 3).map(item => (
              <span key={item} className="text-[11px] px-2 py-0.5 rounded-md"
                style={{ background: "#F3F4F6", color: "#6B7280" }}>
                {item}
              </span>
            ))}
            {pkg.includes.length > 3 && (
              <span className="text-[11px] px-2 py-0.5 rounded-md" style={{ background: "#F3F4F6", color: "#6B7280" }}>
                +{pkg.includes.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom price bar */}
      <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: "1px solid #F4F4F5", background: "#FAFAFA" }}>
        <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Package Price</span>
        <span className="text-base font-bold text-black">Rs. {pkg.price.toLocaleString("en-PK")}</span>
      </div>
    </div>
  );
}

// ─── Drawer Content ───────────────────────────────────────────────────────────
function DrawerContent({ mode, pkg, form, setForm, formErrors, includeInput, setIncludeInput, onAddInclude, onRemoveInclude, onSave, onEdit, onDelete, onDownload, isDownloading, onClose }: {
  mode: DrawerMode;
  pkg: Package | null;
  form: Omit<Package, "id">;
  setForm: React.Dispatch<React.SetStateAction<Omit<Package, "id">>>;
  formErrors: Record<string, string>;
  includeInput: string;
  setIncludeInput: (v: string) => void;
  onAddInclude: () => void;
  onRemoveInclude: (item: string) => void;
  onSave: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDownload: () => void;
  isDownloading: boolean;
  onClose: () => void;
}) {
  if (mode === "detail" && pkg) {
    return <PackageDetail pkg={pkg} onEdit={onEdit} onDelete={onDelete} onDownload={onDownload} isDownloading={isDownloading} onClose={onClose} />;
  }
  return (
    <PackageForm
      mode={mode === "add" ? "add" : "edit"}
      form={form} setForm={setForm}
      errors={formErrors}
      includeInput={includeInput} setIncludeInput={setIncludeInput}
      onAddInclude={onAddInclude} onRemoveInclude={onRemoveInclude}
      onSave={onSave} onClose={onClose}
    />
  );
}

// ─── Package Detail ───────────────────────────────────────────────────────────
function PackageDetail({ pkg, onEdit, onDelete, onDownload, isDownloading, onClose }: {
  pkg: Package; onEdit: () => void; onDelete: () => void;
  onDownload: () => void; isDownloading: boolean; onClose: () => void;
}) {
  const cat = CATEGORY_COLOR[pkg.category];
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0" style={{ borderBottom: "1px solid #F4F4F5" }}>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors" style={{ color: "var(--fg-muted)" }}>
            <CloseIcon />
          </button>
          <span className="text-sm font-semibold text-black">Package Detail</span>
        </div>
        <div className="flex gap-2">
          <button onClick={onDownload} disabled={isDownloading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors hover:bg-blue-50 disabled:opacity-50"
            style={{ border: "1px solid #DBEAFE", color: "#2563EB" }}>
            {isDownloading
              ? <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0110 10" strokeLinecap="round"/></svg>
              : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            }
            PDF
          </button>
          <button onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors hover:bg-gray-50"
            style={{ border: "1px solid #E5E7EB", color: "var(--fg-muted)" }}>
            <EditIcon /> Edit
          </button>
          <button onClick={onDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-red-50"
            style={{ color: "#DC2626" }}>
            <TrashIcon /> Delete
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Name + badges */}
        <div>
          <div className="flex gap-2 mb-2 flex-wrap">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: cat.bg, color: cat.color }}>{pkg.category}</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={pkg.status === "active" ? { background: "#F0FDF4", color: "#16A34A" } : { background: "#F9FAFB", color: "#9CA3AF" }}>
              {pkg.status === "active" ? "Active" : "Inactive"}
            </span>
          </div>
          <h2 className="text-xl font-bold text-black">{pkg.name}</h2>
          <p className="text-sm mt-1.5 leading-relaxed" style={{ color: "var(--fg-muted)" }}>{pkg.description}</p>
        </div>

        {/* Price highlight */}
        <div className="rounded-2xl p-4 flex items-center justify-between" style={{ background: "#F9FAFB", border: "1px solid #F0F0F0" }}>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>Package Price</p>
            <p className="text-2xl font-black text-black">
              Rs. {pkg.price.toLocaleString("en-PK")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>Max Guests</p>
            <p className="text-xl font-bold text-black">{pkg.maxGuests}</p>
          </div>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-3.5" style={{ background: "#F9FAFB", border: "1px solid #F0F0F0" }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>Duration</p>
            <p className="text-sm font-semibold text-black">{pkg.duration}</p>
          </div>
          <div className="rounded-xl p-3.5" style={{ background: "#F9FAFB", border: "1px solid #F0F0F0" }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>Items Included</p>
            <p className="text-sm font-semibold text-black">{pkg.includes.length} services</p>
          </div>
        </div>

        {/* Includes list */}
        {pkg.includes.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: "#F9FAFB", border: "1px solid #F0F0F0" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "#9CA3AF" }}>What's Included</p>
            <div className="space-y-2">
              {pkg.includes.map(item => (
                <div key={item} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "#E5E7EB" }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <span className="text-sm text-black">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Package Form ─────────────────────────────────────────────────────────────
function PackageForm({ mode, form, setForm, errors, includeInput, setIncludeInput, onAddInclude, onRemoveInclude, onSave, onClose }: {
  mode: "add" | "edit";
  form: Omit<Package, "id">;
  setForm: React.Dispatch<React.SetStateAction<Omit<Package, "id">>>;
  errors: Record<string, string>;
  includeInput: string;
  setIncludeInput: (v: string) => void;
  onAddInclude: () => void;
  onRemoveInclude: (item: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  function field(key: keyof Omit<Package, "id" | "includes" | "status" | "category">, value: string | number) {
    setForm(f => ({ ...f, [key]: value }));
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 shrink-0" style={{ borderBottom: "1px solid #F4F4F5" }}>
        <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors" style={{ color: "var(--fg-muted)" }}>
          <CloseIcon />
        </button>
        <span className="text-sm font-semibold text-black">{mode === "add" ? "New Package" : "Edit Package"}</span>
      </div>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* Package Name */}
        <div>
          <Label>Package Name *</Label>
          <input
            value={form.name}
            onChange={e => field("name", e.target.value)}
            placeholder="e.g. Premium Wedding Package"
            className="w-full px-3.5 py-3 rounded-xl text-sm border outline-none transition-colors"
            style={{ border: errors.name ? "1.5px solid #DC2626" : "1.5px solid #E5E7EB", background: "#fff" }}
          />
          {errors.name && <p className="text-xs mt-1" style={{ color: "#DC2626" }}>{errors.name}</p>}
        </div>

        {/* Category + Status */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Category</Label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value as PackageCategory }))}
              className="w-full px-3.5 py-3 rounded-xl text-sm border outline-none bg-white"
              style={{ border: "1.5px solid #E5E7EB" }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <Label>Status</Label>
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value as PackageStatus }))}
              className="w-full px-3.5 py-3 rounded-xl text-sm border outline-none bg-white"
              style={{ border: "1.5px solid #E5E7EB" }}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <Label>Description</Label>
          <textarea
            value={form.description}
            onChange={e => field("description", e.target.value)}
            rows={3}
            placeholder="Brief description of what this package offers..."
            className="w-full px-3.5 py-3 rounded-xl text-sm border outline-none resize-none"
            style={{ border: "1.5px solid #E5E7EB" }}
          />
        </div>

        {/* Price + Max Guests */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Price (Rs.) *</Label>
            <input
              type="number" min={0}
              value={form.price || ""}
              onChange={e => field("price", Number(e.target.value))}
              placeholder="150000"
              className="w-full px-3.5 py-3 rounded-xl text-sm border outline-none"
              style={{ border: errors.price ? "1.5px solid #DC2626" : "1.5px solid #E5E7EB" }}
            />
            {errors.price && <p className="text-xs mt-1" style={{ color: "#DC2626" }}>{errors.price}</p>}
          </div>
          <div>
            <Label>Max Guests *</Label>
            <input
              type="number" min={0}
              value={form.maxGuests || ""}
              onChange={e => field("maxGuests", Number(e.target.value))}
              placeholder="250"
              className="w-full px-3.5 py-3 rounded-xl text-sm border outline-none"
              style={{ border: errors.maxGuests ? "1.5px solid #DC2626" : "1.5px solid #E5E7EB" }}
            />
            {errors.maxGuests && <p className="text-xs mt-1" style={{ color: "#DC2626" }}>{errors.maxGuests}</p>}
          </div>
        </div>

        {/* Duration */}
        <div>
          <Label>Duration *</Label>
          <input
            value={form.duration}
            onChange={e => field("duration", e.target.value)}
            placeholder="e.g. 6 Hours, Full Day, 4 Hours"
            className="w-full px-3.5 py-3 rounded-xl text-sm border outline-none"
            style={{ border: errors.duration ? "1.5px solid #DC2626" : "1.5px solid #E5E7EB" }}
          />
          {errors.duration && <p className="text-xs mt-1" style={{ color: "#DC2626" }}>{errors.duration}</p>}
        </div>

        {/* What's Included */}
        <div>
          <Label>What&apos;s Included</Label>
          {/* Input + Add */}
          <div className="flex gap-2 mb-2">
            <input
              value={includeInput}
              onChange={e => setIncludeInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onAddInclude(); } }}
              placeholder="Add a service or item..."
              className="flex-1 px-3.5 py-3 rounded-xl text-sm border outline-none"
              style={{ border: "1.5px solid #E5E7EB" }}
            />
            <button onClick={onAddInclude}
              className="px-4 py-3 rounded-xl text-sm font-semibold shrink-0 transition-colors hover:bg-gray-200"
              style={{ background: "#F3F4F6", color: "#374151" }}>
              Add
            </button>
          </div>
          {/* Tags */}
          {form.includes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 p-3 rounded-xl" style={{ background: "#F9FAFB", border: "1px solid #F0F0F0" }}>
              {form.includes.map(item => (
                <span key={item} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-medium"
                  style={{ background: "#fff", border: "1px solid #E5E7EB", color: "#374151" }}>
                  {item}
                  <button onClick={() => onRemoveInclude(item)} className="ml-0.5 hover:opacity-70" style={{ color: "#9CA3AF" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </span>
              ))}
            </div>
          )}
          {form.includes.length === 0 && (
            <p className="text-xs" style={{ color: "#9CA3AF" }}>Press Enter or click Add after typing each item</p>
          )}
        </div>

      </div>

      {/* ── Bottom save bar ── */}
      <div className="shrink-0 px-5 py-4" style={{ borderTop: "1px solid #F4F4F5" }}>
        <div className="flex gap-2.5">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50"
            style={{ border: "1px solid #E5E7EB", color: "#6B7280" }}>
            Cancel
          </button>
          <button onClick={onSave}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--primary)" }}>
            {mode === "add" ? "Save Package" : "Update Package"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Small Components ─────────────────────────────────────────────────────────
function MetaPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg" style={{ background: "#F3F4F6", color: "#6B7280" }}>
      {icon} {label}
    </span>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--fg-muted)" }}>{children}</p>;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function CloseIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function EditIcon()  { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function TrashIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>; }
function BoxIcon()   { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>; }
function GuestsIcon(){ return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>; }
function ClockIcon() { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function ListIcon()  { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>; }
