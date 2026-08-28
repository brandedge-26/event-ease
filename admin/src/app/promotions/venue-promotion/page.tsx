"use client";

import { useEffect, useRef, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5510";
const PRIMARY  = "#FF3B6B";

const DURATION_PRESETS = [
  { label: "1 Day",     value: "1"      },
  { label: "3 Days",    value: "3"      },
  { label: "7 Days",    value: "7"      },
  { label: "14 Days",   value: "14"     },
  { label: "30 Days",   value: "30"     },
  { label: "Custom",    value: "custom" },
  { label: "No Expiry", value: "0"      },
];

type Banner = {
  id:        string;
  title:     string;
  subtitle:  string | null;
  ctaText:   string | null;
  ctaLink:   string;
  imageUrl:  string;
  height:    number;
  sortOrder: number;
  isActive:  boolean;
  expiresAt: string | null;
  createdAt: string;
};

function adminFetch(path: string, opts: RequestInit = {}) {
  return fetch(`${API_BASE}/api${path}`, { ...opts, credentials: "include" });
}

function formatExpiry(expiresAt: string | null): { label: string; expired: boolean } {
  if (!expiresAt) return { label: "No expiry", expired: false };
  const exp  = new Date(expiresAt);
  const now  = new Date();
  const diff = exp.getTime() - now.getTime();
  if (diff <= 0) return { label: "Expired", expired: true };
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return { label: `Expires in ${days}d ${hours}h`, expired: false };
  return { label: `Expires in ${hours}h`, expired: false };
}

type ConfirmModal = {
  title:    string;
  body:     string;
  accent:   string;
  label:    string;
  onOk:     () => void;
};

export default function VenuePromotionPage() {
  const [banners,    setBanners]    = useState<Banner[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [uploading,  setUploading]  = useState(false);
  const [toast,      setToast]      = useState<{ msg: string; ok: boolean } | null>(null);
  const [busyId,     setBusyId]     = useState<string | null>(null);
  const [editId,     setEditId]     = useState<string | null>(null);
  const [modal,      setModal]      = useState<ConfirmModal | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Form state
  const [preview,    setPreview]    = useState<string | null>(null);
  const [file,       setFile]       = useState<File | null>(null);
  const [title,      setTitle]      = useState("");
  const [subtitle,   setSubtitle]   = useState("");
  const [ctaText,    setCtaText]    = useState("");
  const [ctaLink,    setCtaLink]    = useState("/venues");
  const [duration,   setDuration]   = useState("7");
  const [customDate, setCustomDate] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res  = await adminFetch("/admin/promo-banners/all");
      const data = await res.json();
      if (data.success) setBanners(data.banners);
    } finally { setLoading(false); }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function startEdit(b: Banner) {
    setEditId(b.id);
    setTitle(b.title);
    setSubtitle(b.subtitle ?? "");
    setCtaText(b.ctaText ?? "");
    setCtaLink(b.ctaLink);
    setFile(null);
    setPreview(b.imageUrl);  // show existing image
    // resolve duration
    if (!b.expiresAt) {
      setDuration("0");
      setCustomDate("");
    } else {
      setDuration("custom");
      const d = new Date(b.expiresAt);
      setCustomDate(d.toISOString().slice(0, 16));
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditId(null);
    resetForm();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !ctaLink) return;
    if (!editId && !file) return;   // create requires image
    setUploading(true);
    try {
      const fd = new FormData();
      if (file) fd.append("image", file);
      fd.append("title",    title);
      fd.append("subtitle", subtitle);
      fd.append("ctaText",  ctaText);
      fd.append("ctaLink",  ctaLink);

      if (duration === "custom" && customDate) {
        fd.append("expiresAt", new Date(customDate).toISOString());
      } else if (duration === "0") {
        fd.append("expiresAt", "none");
      } else {
        fd.append("durationDays", duration);
      }

      const path   = editId ? `/admin/promo-banners/${editId}` : "/admin/promo-banners";
      const method = editId ? "PATCH" : "POST";
      const res    = await adminFetch(path, { method, body: fd });
      const data   = await res.json();

      if (data.success) {
        showToast(editId ? "Banner updated!" : "Banner uploaded!", true);
        setEditId(null);
        resetForm();
        load();
      } else {
        showToast(data.message ?? "Failed", false);
      }
    } catch {
      showToast("Request failed. Try again.", false);
    } finally { setUploading(false); }
  }

  function resetForm() {
    setFile(null); setPreview(null); setTitle(""); setSubtitle("");
    setCtaText(""); setCtaLink("/venues"); setDuration("7"); setCustomDate("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function confirmToggle(b: Banner) {
    const hiding = b.isActive;
    setModal({
      title:  hiding ? "Hide Banner?" : "Show Banner?",
      body:   hiding
        ? `"${b.title}" will be hidden from the venue page immediately.`
        : `"${b.title}" will go live on the venue page.`,
      accent: hiding ? "#F59E0B" : "#22C55E",
      label:  hiding ? "Yes, Hide" : "Yes, Show",
      onOk:   () => doToggle(b),
    });
  }

  async function doToggle(b: Banner) {
    setModal(null);
    setBusyId(b.id);
    try {
      await adminFetch(`/admin/promo-banners/${b.id}/toggle`, { method: "PATCH" });
      setBanners(prev => prev.map(x => x.id === b.id ? { ...x, isActive: !x.isActive } : x));
    } finally { setBusyId(null); }
  }

  function confirmDelete(b: Banner) {
    setModal({
      title:  "Delete Banner?",
      body:   `"${b.title}" will be permanently deleted and removed from the venue page.`,
      accent: "#EF4444",
      label:  "Yes, Delete",
      onOk:   () => doDelete(b),
    });
  }

  async function doDelete(b: Banner) {
    setModal(null);
    setBusyId(b.id);
    try {
      await adminFetch(`/admin/promo-banners/${b.id}`, { method: "DELETE" });
      setBanners(prev => prev.filter(x => x.id !== b.id));
      if (editId === b.id) { setEditId(null); resetForm(); }
      showToast("Banner deleted", true);
    } finally { setBusyId(null); }
  }

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  const isEditMode  = !!editId;
  const canSubmit   = title && ctaLink && (isEditMode || !!file) && !uploading && !(duration === "custom" && !customDate);
  const inputCls    = "w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-pink-200";
  const inputStyle  = { borderColor: "#E5E7EB", background: "#FAFAFA", color: "#111827" };

  return (
    <div className="p-6 min-h-screen" style={{ background: "#F9FAFB" }}>

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium text-white"
          style={{ background: toast.ok ? "#22C55E" : "#EF4444" }}>
          {toast.msg}
        </div>
      )}

      {/* Confirm Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
          onClick={() => setModal(null)}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: "#fff" }}
            onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <p className="text-base font-bold text-black mb-2">{modal.title}</p>
              <p className="text-sm mb-6" style={{ color: "#6B7280" }}>{modal.body}</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setModal(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50"
                  style={{ borderColor: "#E5E7EB", color: "#374151" }}>
                  Cancel
                </button>
                <button onClick={modal.onOk}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                  style={{ background: modal.accent }}>
                  {modal.label}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">Venue Page Banners</h1>
        <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
          Upload and manage promotional banners shown on the Venues page carousel
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* ── Form (create / edit) ── */}
        <div className="xl:col-span-2">
          <form onSubmit={handleSubmit} className="rounded-2xl border overflow-hidden" style={{ background: "#fff", borderColor: isEditMode ? PRIMARY : "#E5E7EB", boxShadow: isEditMode ? `0 0 0 2px ${PRIMARY}22` : "none" }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E5E7EB" }}>
              <div>
                <p className="text-sm font-bold text-black">{isEditMode ? "Edit Banner" : "Upload New Banner"}</p>
                <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                  {isEditMode ? "Change fields and save. Leave image as-is to keep existing." : "Recommended: 1400×300px · JPG, PNG, WebP"}
                </p>
              </div>
              {isEditMode && (
                <button type="button" onClick={cancelEdit}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50"
                  style={{ borderColor: "#E5E7EB", color: "#6B7280" }}>
                  Cancel
                </button>
              )}
            </div>

            <div className="p-5 flex flex-col gap-4">

              {/* Image drop zone */}
              <div
                onDrop={onDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="relative rounded-xl border-2 border-dashed cursor-pointer overflow-hidden flex items-center justify-center transition-colors hover:border-pink-300"
                style={{ borderColor: preview ? "transparent" : "#E5E7EB", height: 140, background: preview ? "#000" : "#FAFAFA" }}
              >
                {preview ? (
                  <>
                    <img src={preview} alt="preview" className="w-full h-full object-cover opacity-80" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-semibold text-white bg-black/50 px-3 py-1.5 rounded-lg">
                        {isEditMode ? "Click to change image" : "Click to change"}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-center px-4">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Drop image here or click to browse</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#374151" }}>Banner Title *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Grand Banquet Halls"
                  required className={inputCls} style={inputStyle} />
              </div>

              {/* Subtitle */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#374151" }}>Subtitle</label>
                <input value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Short description"
                  className={inputCls} style={inputStyle} />
              </div>

              {/* CTA */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#374151" }}>Button Text</label>
                  <input value={ctaText} onChange={e => setCtaText(e.target.value)} placeholder="Explore"
                    className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#374151" }}>Link URL *</label>
                  <input value={ctaLink} onChange={e => setCtaLink(e.target.value)} placeholder="/venues?type=..."
                    required className={inputCls} style={inputStyle} />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#374151" }}>Show Duration</label>
                <div className="flex flex-wrap gap-2">
                  {DURATION_PRESETS.map(p => (
                    <button key={p.value} type="button"
                      onClick={() => setDuration(p.value)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                      style={{
                        borderColor: duration === p.value ? PRIMARY : "#E5E7EB",
                        background:  duration === p.value ? "#FFF1F4" : "#FAFAFA",
                        color:       duration === p.value ? PRIMARY   : "#6B7280",
                      }}>
                      {p.label}
                    </button>
                  ))}
                </div>
                {duration === "custom" && (
                  <input type="datetime-local" value={customDate} onChange={e => setCustomDate(e.target.value)}
                    className={`${inputCls} mt-2`} style={inputStyle} required />
                )}
                {duration === "0" && (
                  <p className="text-[11px] mt-1.5" style={{ color: "#9CA3AF" }}>Banner will stay live until manually hidden or deleted.</p>
                )}
              </div>

              {/* Submit */}
              <button type="submit" disabled={!canSubmit}
                className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity"
                style={{ background: PRIMARY, opacity: canSubmit ? 1 : 0.45, cursor: canSubmit ? "pointer" : "not-allowed" }}>
                {uploading ? (
                  <>
                    <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round"/>
                    </svg>
                    {isEditMode ? "Saving…" : "Uploading…"}
                  </>
                ) : isEditMode ? (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v14a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                    </svg>
                    Save Changes
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Upload Banner
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ── Banner list ── */}
        <div className="xl:col-span-3">
          <div className="rounded-2xl border overflow-hidden" style={{ background: "#fff", borderColor: "#E5E7EB" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E5E7EB" }}>
              <div>
                <p className="text-sm font-bold text-black">All Banners</p>
                <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{banners.length} banner{banners.length !== 1 ? "s" : ""} total</p>
              </div>
              <button onClick={load} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Refresh">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round">
                  <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2.5">
                  <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round"/>
                </svg>
              </div>
            ) : banners.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#E5E7EB" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
                <p className="text-sm font-semibold text-black">No banners yet</p>
                <p className="text-xs" style={{ color: "#9CA3AF" }}>Upload your first banner using the form</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-gray-50">
                {banners.map(b => {
                  const expiry    = formatExpiry(b.expiresAt);
                  const isEditing = editId === b.id;
                  return (
                    <div key={b.id} className="p-4 flex gap-4 items-start transition-colors"
                      style={{ background: isEditing ? "#FFF8F9" : "transparent" }}>
                      {/* Thumbnail */}
                      <div className="rounded-xl overflow-hidden shrink-0" style={{ width: 120, height: 60 }}>
                        <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-bold text-black truncate">{b.title}</p>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                            style={{ background: b.isActive ? "#D1FAE5" : "#F3F4F6", color: b.isActive ? "#065F46" : "#6B7280" }}>
                            {b.isActive ? "Live" : "Hidden"}
                          </span>
                          {expiry.expired && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                              style={{ background: "#FEE2E2", color: "#DC2626" }}>
                              Expired
                            </span>
                          )}
                        </div>
                        {b.subtitle && <p className="text-xs truncate mb-1" style={{ color: "#9CA3AF" }}>{b.subtitle}</p>}
                        <div className="flex items-center gap-3 text-[11px]" style={{ color: "#9CA3AF" }}>
                          <span>→ {b.ctaLink}</span>
                          <span style={{ color: expiry.expired ? "#DC2626" : "#9CA3AF" }}>· {expiry.label}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Edit */}
                        <button onClick={() => isEditing ? cancelEdit() : startEdit(b)} disabled={busyId === b.id}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: isEditing ? PRIMARY : "#6B7280", background: isEditing ? "#FFF1F4" : "transparent" }}
                          title={isEditing ? "Cancel edit" : "Edit"}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        {/* Toggle */}
                        <button onClick={() => confirmToggle(b)} disabled={busyId === b.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
                          style={{ borderColor: "#E5E7EB", color: b.isActive ? "#374151" : PRIMARY, background: "#FAFAFA" }}>
                          {b.isActive ? "Hide" : "Show"}
                        </button>
                        {/* Delete */}
                        <button onClick={() => confirmDelete(b)} disabled={busyId === b.id}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          style={{ color: "#EF4444" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
