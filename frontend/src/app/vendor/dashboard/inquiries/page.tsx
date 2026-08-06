"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

// ─── Types ────────────────────────────────────────────────────────────────────
type InquiryStatus = "new" | "read" | "replied";

type Inquiry = {
  id:        string;
  name:      string;
  phone:     string;
  email:     string | null;
  message:   string;
  eventDate: string | null;
  eventType: string | null;
  guests:    number | null;
  status:    InquiryStatus;
  createdAt: string;
};

type CreateForm = {
  name: string; phone: string; email: string;
  message: string; eventDate: string; eventType: string; guests: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 8;
const API_BASE  = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5510";

const STATUS_CONFIG: Record<InquiryStatus, { label: string; color: string; bg: string }> = {
  new:     { label: "New",     color: "#FF3B6B", bg: "#FFF0F4" },
  read:    { label: "Read",    color: "#6B7280", bg: "#F3F4F6" },
  replied: { label: "Replied", color: "#059669", bg: "#ECFDF5" },
};

const FILTER_TABS = [
  { label: "All",     value: "all"     },
  { label: "New",     value: "new"     },
  { label: "Read",    value: "read"    },
  { label: "Replied", value: "replied" },
] as const;

type FilterValue = "all" | InquiryStatus;

const EMPTY_FORM: CreateForm = {
  name: "", phone: "", email: "", message: "", eventDate: "", eventType: "", guests: "",
};

const EVENT_TYPES = ["Wedding", "Engagement", "Birthday", "Corporate", "Anniversary", "Other"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function fmtEventDate(d: string) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function displayId(id: string) { return "INQ-" + id.slice(0, 8).toUpperCase(); }

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InquiriesPage() {
  const { vendor, accessToken } = useAuthStore();

  const [inquiries,    setInquiries]    = useState<Inquiry[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState<FilterValue>("all");
  const [search,       setSearch]       = useState("");
  const [page,         setPage]         = useState(1);

  const [detailTarget, setDetailTarget] = useState<Inquiry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Inquiry | null>(null);
  const [formOpen,     setFormOpen]     = useState(false);

  const [updating,  setUpdating]  = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [formError, setFormError] = useState("");
  const [form,      setForm]      = useState<CreateForm>(EMPTY_FORM);

  // ── Fetch ──
  async function loadInquiries() {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await api.get<{ inquiries: Inquiry[] }>("/api/vendor/inquiry", accessToken);
      if (res.success) setInquiries(res.inquiries ?? []);
    } finally { setLoading(false); }
  }
  useEffect(() => { loadInquiries(); }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived ──
  const filtered = inquiries.filter(i => {
    const matchFilter = filter === "all" || i.status === filter;
    const s = search.toLowerCase();
    const matchSearch = !s ||
      i.name.toLowerCase().includes(s) ||
      i.phone.includes(s) ||
      i.message.toLowerCase().includes(s) ||
      i.eventType?.toLowerCase().includes(s) ||
      displayId(i.id).toLowerCase().includes(s);
    return matchFilter && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function changeFilter(v: FilterValue) { setFilter(v); setPage(1); }
  function changeSearch(v: string)      { setSearch(v); setPage(1); }

  const counts = {
    all:     inquiries.length,
    new:     inquiries.filter(i => i.status === "new").length,
    read:    inquiries.filter(i => i.status === "read").length,
    replied: inquiries.filter(i => i.status === "replied").length,
  };

  // ── Status update ──
  async function markStatus(inquiry: Inquiry, status: InquiryStatus) {
    if (inquiry.status === status || updating) return;
    setUpdating(true);
    // optimistic
    setInquiries(prev => prev.map(i => i.id === inquiry.id ? { ...i, status } : i));
    if (detailTarget?.id === inquiry.id) setDetailTarget({ ...inquiry, status });
    try {
      await api.patch(`/api/vendor/inquiry/${inquiry.id}/status`, { status }, accessToken ?? undefined);
    } finally { setUpdating(false); }
  }

  // ── Delete ──
  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      const res = await api.delete(`/api/vendor/inquiry/${id}`, accessToken ?? undefined);
      if (res.success) {
        setInquiries(prev => prev.filter(i => i.id !== id));
        setDeleteTarget(null);
        if (detailTarget?.id === id) setDetailTarget(null);
      }
    } finally { setDeleting(false); }
  }

  // ── Open detail (auto-mark read) ──
  function openDetail(inquiry: Inquiry) {
    setDetailTarget(inquiry);
    if (inquiry.status === "new") markStatus(inquiry, "read");
  }

  // ── Create ──
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!vendor?.id) return;
    setFormError("");
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/vendor/inquiry/${vendor.id}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:      form.name,
          phone:     form.phone,
          email:     form.email     || undefined,
          message:   form.message,
          eventDate: form.eventDate || undefined,
          eventType: form.eventType || undefined,
          guests:    form.guests ? Number(form.guests) : undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) { setFormError(data.message ?? "Failed to save."); return; }
      await loadInquiries();
      setFormOpen(false);
      setForm(EMPTY_FORM);
      setPage(1);
    } catch {
      setFormError("Could not connect to server.");
    } finally { setSaving(false); }
  }

  // ── Loading skeleton ──
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
      {/* ── Create Drawer ── */}
      {formOpen && (
        <InquiryForm
          form={form} setForm={setForm}
          saving={saving} error={formError}
          onClose={() => { setFormOpen(false); setFormError(""); }}
          onSubmit={handleCreate}
        />
      )}

      {/* ── Detail Drawer ── */}
      {detailTarget && (
        <DetailDrawer
          inquiry={inquiries.find(i => i.id === detailTarget.id) ?? detailTarget}
          updating={updating}
          onClose={() => setDetailTarget(null)}
          onStatus={(s) => markStatus(detailTarget, s)}
          onDelete={() => { setDeleteTarget(detailTarget); setDetailTarget(null); }}
        />
      )}

      {/* ── Delete Confirm ── */}
      {deleteTarget && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl p-6 w-[320px] shadow-2xl">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#FEF2F2" }}>
              <TrashIcon size={20} color="#DC2626" />
            </div>
            <p className="text-base font-bold text-black text-center">Delete Inquiry?</p>
            <p className="text-sm text-center mt-1 mb-5" style={{ color: "var(--fg-muted)" }}>
              Inquiry from <span className="font-semibold text-black">{deleteTarget.name}</span> will be permanently deleted.
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
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl lg:text-2xl font-semibold text-black tracking-tight">Inquiries</h1>
            <p className="text-sm mt-1" style={{ color: "var(--fg-muted)" }}>
              {counts.new > 0
                ? `${counts.new} new ${counts.new === 1 ? "inquiry" : "inquiries"} waiting`
                : "Manage customer inquiries"}
            </p>
          </div>
          <button onClick={() => { setForm(EMPTY_FORM); setFormError(""); setFormOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90"
            style={{ background: "var(--primary)", color: "#fff" }}>
            <PlusIcon /> New Inquiry
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-black">{counts.all}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>Total {counts.all === 1 ? "Inquiry" : "Inquiries"}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-2xl font-bold" style={{ color: "#FF3B6B" }}>{counts.new}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>New</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-2xl font-bold" style={{ color: "#6B7280" }}>{counts.read}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>Read</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-2xl font-bold" style={{ color: "#059669" }}>{counts.replied}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>Replied</p>
          </div>
        </div>

        {/* ── Filter tabs + Search ── */}
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
                placeholder="Search by name, phone, message, event type..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none border"
                style={{ background: "var(--bg-subtle)", borderColor: "#E5E7EB", color: "var(--fg)" }} />
            </div>
          </div>
        </div>

        {/* ── List ── */}
        <div className="flex flex-col gap-2">
          {paginated.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm py-16 flex flex-col items-center text-center">
              <InboxIcon />
              <p className="text-sm font-medium mt-3 text-black">No inquiries found</p>
              <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>
                {inquiries.length === 0
                  ? "Inquiries from your profile will appear here"
                  : "Try changing the filter or search"}
              </p>
            </div>
          ) : paginated.map(inquiry => {
            const cfg = STATUS_CONFIG[inquiry.status];
            return (
              <div key={inquiry.id} className="bg-white rounded-2xl shadow-sm p-4 cursor-pointer"
                style={{ borderLeft: inquiry.status === "new" ? "3px solid #FF3B6B" : "3px solid transparent" }}
                onClick={() => openDetail(inquiry)}>

                {/* Row 1: avatar + name + status */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ background: "var(--primary)" }}>
                      {inquiry.name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-black truncate">{inquiry.name}</p>
                        {inquiry.status === "new" && (
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#FF3B6B" }} />
                        )}
                      </div>
                      <p className="text-xs truncate" style={{ color: "var(--fg-muted)" }}>
                        {inquiry.phone}{inquiry.email ? ` · ${inquiry.email}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                    style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                </div>

                {/* Row 2: event type badge */}
                {inquiry.eventType && (
                  <div className="mb-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: "var(--bg-subtle)", color: "var(--fg-muted)" }}>
                      {inquiry.eventType}
                    </span>
                  </div>
                )}

                {/* Row 3: message preview */}
                <p className="text-xs mb-3 line-clamp-2 leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                  {inquiry.message}
                </p>

                {/* Row 4: meta + date + actions */}
                <div className="flex items-center justify-between pt-2.5 border-t" style={{ borderColor: "#F4F4F5" }}
                  onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-3 flex-wrap">
                    {inquiry.eventDate && (
                      <div className="flex items-center gap-1.5">
                        <CalSmIcon />
                        <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{fmtEventDate(inquiry.eventDate)}</span>
                      </div>
                    )}
                    {inquiry.guests && (
                      <div className="flex items-center gap-1.5">
                        <GuestSmIcon />
                        <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{inquiry.guests} guests</span>
                      </div>
                    )}
                    <span className="text-[10px] font-mono" style={{ color: "var(--fg-subtle)" }}>{fmtDate(inquiry.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={e => { e.stopPropagation(); setDeleteTarget(inquiry); }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:bg-red-50"
                      style={{ color: "#DC2626" }}>
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Pagination ── */}
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

// ─── Detail Drawer ────────────────────────────────────────────────────────────
function DetailDrawer({ inquiry, updating, onClose, onStatus, onDelete }: {
  inquiry: Inquiry; updating: boolean;
  onClose: () => void; onStatus: (s: InquiryStatus) => void; onDelete: () => void;
}) {
  const cfg = STATUS_CONFIG[inquiry.status];

  const content = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "#F4F4F5" }}>
        <div>
          <p className="text-sm font-bold text-black">{displayId(inquiry.id)}</p>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onDelete}
            className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer hover:bg-red-50"
            style={{ color: "#DC2626" }}>
            <TrashIcon />
          </button>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer hover:bg-gray-100" style={{ color: "var(--fg-muted)" }}>
            <XIcon />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">

        {/* Customer */}
        <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: "var(--bg-subtle)" }}>
          <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0"
            style={{ background: "var(--primary)" }}>
            {inquiry.name[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-black">{inquiry.name}</p>
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--fg-muted)" }}>
              {inquiry.phone}{inquiry.email ? ` · ${inquiry.email}` : ""}
            </p>
          </div>
        </div>

        {/* Event Details */}
        {(inquiry.eventType || inquiry.eventDate || inquiry.guests) && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Event Details</p>
            <div className="flex flex-col">
              {[
                inquiry.eventType && { label: "Event Type", value: inquiry.eventType },
                inquiry.eventDate && { label: "Event Date", value: fmtEventDate(inquiry.eventDate) },
                inquiry.guests    && { label: "Guests",     value: `${inquiry.guests} guests` },
              ].filter(Boolean).map((row, i, arr) => (
                <div key={(row as {label:string}).label} className={`flex items-center justify-between py-2.5 ${i < arr.length-1 ? "border-b" : ""}`} style={{ borderColor: "#F4F4F5" }}>
                  <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{(row as {label:string;value:string}).label}</span>
                  <span className="text-sm font-semibold text-black">{(row as {label:string;value:string}).value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--fg-subtle)" }}>Message / Notes</p>
          <p className="text-sm rounded-xl p-3 leading-relaxed" style={{ background: "var(--bg-subtle)", color: "var(--fg-muted)" }}>
            {inquiry.message}
          </p>
        </div>

        {/* Received date */}
        <p className="text-xs" style={{ color: "var(--fg-subtle)" }}>Received {fmtDate(inquiry.createdAt)}</p>

        {/* Contact Actions */}
        <div className="flex gap-2">
          <a href={`tel:${inquiry.phone}`}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90"
            style={{ background: "var(--primary)", color: "#fff" }}>
            <PhoneIcon /> Call
          </a>
          <a href={`https://wa.me/${inquiry.phone.replace(/\D/g, "")}`}
            target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold border transition-colors hover:bg-gray-50"
            style={{ background: "#fff", color: "#111", borderColor: "#E5E7EB" }}>
            <WhatsAppIcon /> WhatsApp
          </a>
        </div>

        {/* Status Actions */}
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--fg-subtle)" }}>Update Status</p>
          <div className="flex gap-2">
            <button onClick={() => onStatus("read")} disabled={inquiry.status === "read" || updating}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer transition-all disabled:opacity-40"
              style={{
                background: "#F3F4F6", color: "#6B7280",
                border: inquiry.status === "read" ? "2px solid #6B7280" : "2px solid transparent",
              }}>
              {inquiry.status === "read" ? "✓ Read" : "Mark Read"}
            </button>
            <button onClick={() => onStatus("replied")} disabled={inquiry.status === "replied" || updating}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer transition-all disabled:opacity-40"
              style={{
                background: "#ECFDF5", color: "#059669",
                border: inquiry.status === "replied" ? "2px solid #059669" : "2px solid transparent",
              }}>
              {inquiry.status === "replied" ? "✓ Replied" : "Mark Replied"}
            </button>
          </div>
          {inquiry.status !== "new" && (
            <button onClick={() => onStatus("new")}
              className="w-full py-2.5 rounded-2xl text-xs font-semibold cursor-pointer hover:opacity-80"
              style={{ background: "var(--bg-subtle)", color: "var(--fg-muted)" }}>
              Reset to New
            </button>
          )}
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

// ─── Create Form Drawer ───────────────────────────────────────────────────────
function InquiryForm({ form, setForm, saving, error, onClose, onSubmit }: {
  form: CreateForm;
  setForm: React.Dispatch<React.SetStateAction<CreateForm>>;
  saving: boolean; error: string;
  onClose: () => void; onSubmit: (e: React.FormEvent) => void;
}) {
  const inp      = "px-4 py-3 rounded-xl border text-sm outline-none w-full";
  const inpStyle = { background: "var(--bg-subtle)", borderColor: "#D1D5DB", color: "var(--fg)" };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed z-50 bottom-0 left-0 right-0 rounded-t-3xl bg-white flex flex-col overflow-hidden max-h-[92dvh] lg:bottom-0 lg:left-auto lg:right-0 lg:top-0 lg:w-[520px] lg:rounded-none lg:rounded-l-3xl lg:max-h-full"
        style={{ boxShadow: "0 -4px 40px rgba(0,0,0,0.14)" }}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 lg:hidden shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "#E5E7EB" }} />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "#F4F4F5" }}>
          <div>
            <p className="text-sm font-bold text-black">New Inquiry</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>Log a phone or walk-in inquiry</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer hover:bg-gray-100" style={{ color: "var(--fg-muted)" }}>
            <XIcon />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "#FEE2E2", color: "#B91C1C" }}>{error}</div>
          )}

          {/* Customer Info */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Customer Info</p>
            <div className="flex flex-col gap-3">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Customer name *" className={inp} style={inpStyle} required />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="Phone *" className={inp} style={inpStyle} required />
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="Email" className={inp} style={inpStyle} />
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Event Details <span className="font-normal normal-case" style={{ letterSpacing:0, color:"var(--fg-subtle)" }}>(optional)</span></p>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <select value={form.eventType} onChange={e => setForm(f => ({ ...f, eventType: e.target.value }))}
                  className={inp} style={{ ...inpStyle, color: form.eventType ? "var(--fg)" : "#9CA3AF" }}>
                  <option value="">Event type</option>
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input type="number" min="1" value={form.guests} onChange={e => setForm(f => ({ ...f, guests: e.target.value }))}
                  placeholder="Guests" className={inp} style={inpStyle} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Event Date</label>
                <input type="date" value={form.eventDate} onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))}
                  className={inp} style={inpStyle} />
              </div>
            </div>
          </div>

          {/* Message */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Message / Notes</p>
            <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Notes or message from customer *" rows={4} required
              className="px-4 py-3 rounded-xl border text-sm outline-none resize-none w-full"
              style={{ ...inpStyle, minHeight: "100px" }} />
          </div>

          <button type="submit" disabled={saving}
            className="w-full py-3.5 rounded-2xl text-sm font-bold cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: "var(--primary)", color: "#fff" }}>
            {saving && <SpinIcon />}
            {saving ? "Saving…" : "Save Inquiry"}
          </button>
        </form>
      </div>
    </>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function PlusIcon()      { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function XIcon()         { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function SearchIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; }
function InboxIcon()     { return <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fg-subtle)" }}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>; }
function TrashIcon({ size = 14, color = "currentColor" }: { size?: number; color?: string }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>; }
function PhoneIcon()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.03 2.18 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14v2.92z"/></svg>; }
function WhatsAppIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.089.538 4.052 1.476 5.76L.057 23.998l6.369-1.409A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.822 9.822 0 01-5.006-1.369l-.358-.214-3.733.826.839-3.638-.234-.374A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>; }
function SpinIcon()      { return <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>; }
function CalSmIcon()     { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fg-subtle)" }}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function GuestSmIcon()   { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fg-subtle)" }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function ChevLeftIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>; }
function ChevRightIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>; }
