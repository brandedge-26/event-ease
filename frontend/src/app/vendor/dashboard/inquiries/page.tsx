"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

const PRIMARY  = "#FF3B6B";
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5510";

type Inquiry = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  eventDate: string | null;
  eventType: string | null;
  guests: number | null;
  status: "new" | "read" | "replied";
  createdAt: string;
};

type CreateForm = {
  name: string; phone: string; email: string;
  message: string; eventDate: string; eventType: string; guests: string;
};

const EMPTY_FORM: CreateForm = { name: "", phone: "", email: "", message: "", eventDate: "", eventType: "", guests: "" };

const STATUS_LABELS: Record<string, string> = { new: "New", read: "Read", replied: "Replied" };
const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  new:     { bg: "#FFF0F4", color: PRIMARY },
  read:    { bg: "#F3F4F6", color: "#6B7280" },
  replied: { bg: "#ECFDF5", color: "#059669" },
};

// Login-form–style input class
const INPUT = "w-full px-5 py-4 rounded-2xl text-base outline-none transition-all duration-200 border border-[#D1D5DB] focus:ring-2 focus:ring-[#FF3B6B] focus:ring-offset-2";
const INPUT_STYLE = { background: "var(--bg-subtle)", color: "var(--fg)" };

export default function InquiriesPage() {
  const { vendor, accessToken }             = useAuthStore();
  const [inquiries,  setInquiries]          = useState<Inquiry[]>([]);
  const [loading,    setLoading]            = useState(true);
  const [selected,   setSelected]           = useState<Inquiry | null>(null);
  const [filter,     setFilter]             = useState<"all" | "new" | "read" | "replied">("all");
  const [updating,   setUpdating]           = useState(false);

  // Create drawer
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [form,          setForm]          = useState<CreateForm>(EMPTY_FORM);
  const [formLoading,   setFormLoading]   = useState(false);
  const [formError,     setFormError]     = useState("");

  useEffect(() => {
    if (accessToken) loadInquiries();
  }, [accessToken]);

  async function loadInquiries() {
    setLoading(true);
    try {
      const res = await api.get<{ inquiries: Inquiry[] }>("/api/vendor/inquiry", accessToken ?? undefined);
      if (res.success) setInquiries(res.inquiries ?? []);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError("");
    setDrawerOpen(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!vendor?.id) return;
    setFormError("");
    setFormLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/vendor/inquiry/${vendor.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:      form.name,
          phone:     form.phone,
          email:     form.email   || undefined,
          message:   form.message,
          eventDate: form.eventDate || undefined,
          eventType: form.eventType || undefined,
          guests:    form.guests ? Number(form.guests) : undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) { setFormError(data.message ?? "Failed to save."); return; }
      await loadInquiries();
      setDrawerOpen(false);
    } catch {
      setFormError("Could not connect to server.");
    } finally {
      setFormLoading(false);
    }
  }

  async function markStatus(inquiry: Inquiry, status: Inquiry["status"]) {
    if (inquiry.status === status || updating) return;
    setUpdating(true);
    try {
      const res = await api.patch(`/api/vendor/inquiry/${inquiry.id}/status`, { status }, accessToken ?? undefined);
      if (res.success) {
        setInquiries(prev => prev.map(i => i.id === inquiry.id ? { ...i, status } : i));
        if (selected?.id === inquiry.id) setSelected({ ...inquiry, status });
      }
    } finally {
      setUpdating(false);
    }
  }

  function openDetail(inquiry: Inquiry) {
    setSelected(inquiry);
    if (inquiry.status === "new") markStatus(inquiry, "read");
  }

  const filtered = filter === "all" ? inquiries : inquiries.filter(i => i.status === filter);
  const newCount = inquiries.filter(i => i.status === "new").length;

  function fmt(iso: string) {
    return new Date(iso).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
  }

  // ── List View ────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-black">Inquiries</h1>
          <p className="text-sm mt-0.5" style={{ color: "#9CA3AF" }}>
            {newCount > 0 ? `${newCount} new` : "No new"} inquir{newCount !== 1 ? "ies" : "y"}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer transition-opacity hover:opacity-90"
          style={{ background: PRIMARY }}
        >
          <PlusIcon /> New Inquiry
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {(["all", "new", "read", "replied"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-1.5 rounded-xl text-sm font-semibold capitalize transition-colors cursor-pointer"
            style={{ background: filter === f ? PRIMARY : "#F3F4F6", color: filter === f ? "#fff" : "#6B7280" }}
          >
            {f === "all"
              ? `All (${inquiries.length})`
              : `${STATUS_LABELS[f]} (${inquiries.filter(i => i.status === f).length})`}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(n => (
            <div key={n} className="bg-white rounded-2xl p-5 animate-pulse" style={{ border: "1px solid #F3F4F6" }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-36 rounded bg-gray-200" />
                  <div className="h-3 w-24 rounded bg-gray-100" />
                </div>
              </div>
              <div className="h-3 w-full rounded bg-gray-100 mb-2" />
              <div className="h-3 w-3/4 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl mx-auto mb-4" style={{ background: "#FFF0F4" }}>
            <InboxIcon size={28} color={PRIMARY} />
          </div>
          <p className="text-base font-semibold text-black mb-1">
            {filter === "all" ? "No inquiries yet" : `No ${filter} inquiries`}
          </p>
          <p className="text-sm mb-6" style={{ color: "#9CA3AF" }}>
            {filter === "all" ? "Inquiries from your profile will appear here, or add one manually." : `You have no ${filter} inquiries.`}
          </p>
          {filter === "all" && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer transition-opacity hover:opacity-90"
              style={{ background: PRIMARY }}
            >
              <PlusIcon /> Add Inquiry
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(inquiry => {
            const st = STATUS_STYLES[inquiry.status];
            return (
              <div
                key={inquiry.id}
                onClick={() => openDetail(inquiry)}
                className="bg-white rounded-2xl p-4 lg:p-5 cursor-pointer transition-shadow hover:shadow-md"
                style={{ border: `1px solid ${inquiry.status === "new" ? "#FFD0DC" : "#F3F4F6"}` }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-bold text-white text-sm" style={{ background: PRIMARY }}>
                    {inquiry.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="text-sm font-bold text-black truncate">{inquiry.name}</p>
                        {inquiry.status === "new" && (
                          <span className="inline-flex w-2 h-2 rounded-full shrink-0" style={{ background: PRIMARY }} />
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px]" style={{ color: "#9CA3AF" }}>{fmt(inquiry.createdAt)}</span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={st}>{STATUS_LABELS[inquiry.status]}</span>
                      </div>
                    </div>
                    <p className="text-xs mb-1.5" style={{ color: "#9CA3AF" }}>
                      {inquiry.phone}{inquiry.email ? ` · ${inquiry.email}` : ""}
                    </p>
                    <p className="text-sm line-clamp-2" style={{ color: "#6B7280" }}>{inquiry.message}</p>
                    {(inquiry.eventType || inquiry.eventDate || inquiry.guests) && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {inquiry.eventType && <Chip icon={<TagIcon />}>{inquiry.eventType}</Chip>}
                        {inquiry.eventDate && <Chip icon={<CalendarIcon />}>{inquiry.eventDate}</Chip>}
                        {inquiry.guests    && <Chip icon={<GuestsIcon />}>{inquiry.guests} guests</Chip>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create Inquiry Drawer ── */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className={[
            "fixed z-50 bg-white overflow-hidden flex flex-col",
            "bottom-0 left-0 right-0 rounded-t-3xl max-h-[92dvh]",
            "lg:bottom-0 lg:top-0 lg:right-0 lg:left-auto lg:w-[480px] lg:max-h-full lg:rounded-none lg:rounded-l-3xl",
          ].join(" ")} style={{ boxShadow: "0 -4px 40px rgba(0,0,0,0.15)" }}>

            {/* Mobile handle */}
            <div className="flex justify-center pt-3 pb-1 lg:hidden shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ background: "#E5E7EB" }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "#F4F4F5" }}>
              <div>
                <p className="text-base font-bold text-black">New Inquiry</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>Log a phone or walk-in inquiry</p>
              </div>
              <button onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer hover:bg-gray-100"
                style={{ color: "var(--fg-muted)" }}>
                <CloseIcon />
              </button>
            </div>

            {/* Form — id so footer button can submit it */}
            <form id="inquiry-form" onSubmit={handleCreate} className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-2">
              {formError && (
                <div className="mb-1 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "#FEE2E2", color: "#B91C1C" }}>
                  {formError}
                </div>
              )}

              <input
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Customer name *"
                className={INPUT} style={INPUT_STYLE}
              />

              <input
                required
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="Phone number *"
                className={INPUT} style={INPUT_STYLE}
              />

              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="Email address (optional)"
                className={INPUT} style={INPUT_STYLE}
              />

              <select
                value={form.eventType}
                onChange={e => setForm(f => ({ ...f, eventType: e.target.value }))}
                className={INPUT}
                style={{ ...INPUT_STYLE, color: form.eventType ? "var(--fg)" : "#9CA3AF" }}
              >
                <option value="">Event type (optional)</option>
                <option>Wedding</option>
                <option>Engagement</option>
                <option>Birthday</option>
                <option>Corporate</option>
                <option>Other</option>
              </select>

              <input
                type="date"
                value={form.eventDate}
                onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))}
                className={INPUT} style={INPUT_STYLE}
              />

              <input
                type="number"
                min="1"
                value={form.guests}
                onChange={e => setForm(f => ({ ...f, guests: e.target.value }))}
                placeholder="Estimated guests (optional)"
                className={INPUT} style={INPUT_STYLE}
              />

              <textarea
                required
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Notes / message from customer *"
                className={`${INPUT} resize-none`}
                style={{ ...INPUT_STYLE, height: 120, minHeight: 120 }}
              />
            </form>

            {/* Footer */}
            <div className="shrink-0 px-5 py-4 border-t flex gap-3" style={{ borderColor: "#F4F4F5" }}>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="px-5 py-3 rounded-2xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-70"
                style={{ background: "var(--bg-subtle)", color: "var(--fg-muted)" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="inquiry-form"
                disabled={formLoading}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: PRIMARY, color: "#fff" }}
              >
                {formLoading ? "Saving…" : "Save Inquiry"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-0 lg:p-6"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div className="bg-white w-full lg:max-w-lg rounded-t-3xl lg:rounded-3xl" style={{ maxHeight: "90vh", overflowY: "auto" }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "#F3F4F6" }}>
              <h2 className="text-base font-bold text-black">Inquiry Details</h2>
              <button onClick={() => setSelected(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer"
                style={{ color: "#6B7280" }}>
                <CloseIcon />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center font-bold text-white text-base" style={{ background: PRIMARY }}>
                  {selected.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-base font-bold text-black">{selected.name}</p>
                  <p className="text-sm" style={{ color: "#6B7280" }}>{selected.phone}</p>
                  {selected.email && <p className="text-sm" style={{ color: "#6B7280" }}>{selected.email}</p>}
                </div>
              </div>

              {(selected.eventType || selected.eventDate || selected.guests) && (
                <div className="rounded-2xl p-4 space-y-2.5" style={{ background: "#F9FAFB" }}>
                  {selected.eventType && <Row label="Event Type" value={selected.eventType} />}
                  {selected.eventDate && <Row label="Event Date" value={selected.eventDate} />}
                  {selected.guests    && <Row label="Guests"     value={`${selected.guests} guests`} />}
                </div>
              )}

              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "#9CA3AF" }}>Message / Notes</p>
                <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{selected.message}</p>
              </div>

              <p className="text-xs" style={{ color: "#9CA3AF" }}>Received {fmt(selected.createdAt)}</p>

              <div className="flex gap-2 pt-2">
                <a href={`tel:${selected.phone}`}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                  style={{ background: PRIMARY }}>
                  <PhoneIcon /> Call
                </a>
                <a href={`https://wa.me/${selected.phone.replace(/\D/g, "")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border transition-colors hover:bg-gray-50"
                  style={{ background: "#fff", color: "#111", borderColor: "#E5E7EB" }}>
                  <WhatsAppIcon /> WhatsApp
                </a>
                {selected.status !== "replied" && (
                  <button
                    onClick={() => markStatus(selected, "replied")}
                    disabled={updating}
                    className="flex-1 py-3 rounded-xl text-sm font-bold border transition-colors hover:bg-emerald-50 cursor-pointer disabled:opacity-50"
                    style={{ background: "#ECFDF5", color: "#059669", borderColor: "#A7F3D0" }}>
                    Mark Replied
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: "#F3F4F6", color: "#6B7280" }}>
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm" style={{ color: "#6B7280" }}>{label}</span>
      <span className="text-sm font-semibold text-black">{value}</span>
    </div>
  );
}
function CloseIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
function InboxIcon({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>;
}
function CalendarIcon() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function TagIcon() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
}
function GuestsIcon() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
}
function PlusIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
function PhoneIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.03 2.18 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14v2.92z"/></svg>;
}
function WhatsAppIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.089.538 4.052 1.476 5.76L.057 23.998l6.369-1.409A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.822 9.822 0 01-5.006-1.369l-.358-.214-3.733.826.839-3.638-.234-.374A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>;
}
