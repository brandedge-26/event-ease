"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
type QuotationStatus = "pending" | "accepted" | "rejected";

type ServiceEntry = { id: string; label: string; unit: string; price: string };

type Quotation = {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  event: string;
  hall: string;
  date: string;
  guests: number;
  hallAmount: number;
  status: QuotationStatus;
  services: ServiceEntry[];
  notes: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 6;

const EVENT_TYPES = ["Wedding", "Engagement", "Birthday Party", "Corporate Event", "Anniversary", "Conference", "Other"];

const STATUS_CONFIG: Record<QuotationStatus, { label: string; color: string; bg: string }> = {
  pending:  { label: "Pending",  color: "#D97706", bg: "#FFFBEB" },
  accepted: { label: "Accepted", color: "#16A34A", bg: "#F0FDF4" },
  rejected: { label: "Rejected", color: "#DC2626", bg: "#FEF2F2" },
};

const HALL_COLOR: Record<string, string> = {
  "Hall A": "var(--primary)",
  "Hall B": "#2563EB",
  "Hall C": "#7C3AED",
};
const HALL_BG: Record<string, string> = {
  "Hall A": "var(--primary-light)",
  "Hall B": "#EFF6FF",
  "Hall C": "#F5F3FF",
};

const FILTER_TABS: { label: string; value: "all" | QuotationStatus }[] = [
  { label: "All",      value: "all" },
  { label: "Pending",  value: "pending" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" },
];

type PresetSvc = { id: string; label: string };
const PRESET_SVCS: PresetSvc[] = [
  { id: "drink",  label: "Drink Service" },
  { id: "music",  label: "Music" },
  { id: "table",  label: "Table Service" },
  { id: "custom", label: "Custom" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return "Rs. " + n.toLocaleString("en-PK");
}
function formatDate(d: string) {
  if (!d || d === "—") return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function calcTotal(q: Quotation) {
  return q.hallAmount + (q.services ?? []).reduce((s, sv) => s + (Number(sv.price) || 0), 0);
}
function displayId(id: string) {
  return "QT-" + id.slice(0, 8).toUpperCase();
}

// ─── FormState ────────────────────────────────────────────────────────────────
type FormState = {
  customerName: string;
  phone: string;
  email: string;
  event: string;
  hall: string;
  date: string;
  guests: string;
  hallAmount: string;
  notes: string;
  status: QuotationStatus;
  services: ServiceEntry[];
};

const EMPTY_FORM: FormState = {
  customerName: "", phone: "", email: "",
  event: EVENT_TYPES[0], hall: "", date: "", guests: "",
  hallAmount: "", notes: "", status: "pending",
  services: [],
};

// ─── Quotation Form ───────────────────────────────────────────────────────────
function QuotationForm({
  title,
  subtitle,
  initial,
  halls,
  submitting,
  onClose,
  onSubmit,
}: {
  title: string;
  subtitle?: string;
  initial: FormState;
  halls: string[];
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (f: FormState) => void;
}) {
  const [f, setF]           = useState<FormState>(initial);
  const [services, setSvcs] = useState<ServiceEntry[]>(initial.services);

  const hallAmt    = Number(f.hallAmount) || 0;
  const svcTotal   = services.reduce((s, sv) => s + (Number(sv.price) || 0), 0);
  const grandTotal = hallAmt + svcTotal;

  function setField<K extends keyof FormState>(k: K, v: FormState[K]) {
    setF(prev => ({ ...prev, [k]: v }));
  }

  function togglePreset(p: PresetSvc) {
    setSvcs(prev => {
      const exists = prev.find(s => s.id === p.id);
      if (exists) return prev.filter(s => s.id !== p.id);
      return [...prev, { id: p.id, label: p.label, unit: "", price: "" }];
    });
  }

  function updateSvc(id: string, field: keyof ServiceEntry, value: string) {
    setSvcs(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }

  function removeSvc(id: string) {
    setSvcs(prev => prev.filter(s => s.id !== id));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ ...f, services });
  }

  const inp      = "px-4 py-3 rounded-xl border text-sm outline-none w-full";
  const inpStyle = { background: "var(--bg-subtle)", borderColor: "#D1D5DB", color: "var(--fg)" };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed z-50 bottom-0 left-0 right-0 rounded-t-3xl bg-white flex flex-col overflow-hidden max-h-[92dvh] lg:bottom-0 lg:left-auto lg:right-0 lg:top-0 lg:w-[560px] lg:rounded-none lg:rounded-l-3xl lg:max-h-full"
        style={{ boxShadow: "0 -4px 40px rgba(0,0,0,0.14)" }}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 lg:hidden shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "#E5E7EB" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "#F4F4F5" }}>
          <div>
            <p className="text-sm font-bold text-black">{title}</p>
            {subtitle && <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer hover:bg-gray-100" style={{ color: "var(--fg-muted)" }}>
            <XIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">

          {/* Customer Info */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Customer Info</p>
            <div className="flex flex-col gap-3">
              <input value={f.customerName} onChange={e => setField("customerName", e.target.value)} placeholder="Customer name *" className={inp} style={inpStyle} required />
              <div className="grid grid-cols-2 gap-3">
                <input value={f.phone} onChange={e => setField("phone", e.target.value)} placeholder="Phone" className={inp} style={inpStyle} />
                <input type="email" value={f.email} onChange={e => setField("email", e.target.value)} placeholder="Email" className={inp} style={inpStyle} />
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Event Details</p>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <select value={f.event} onChange={e => setField("event", e.target.value)} className={inp} style={inpStyle} required>
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={f.hall} onChange={e => setField("hall", e.target.value)} className={inp} style={inpStyle} required>
                  {halls.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Event Date</label>
                  <input type="date" value={f.date} onChange={e => setField("date", e.target.value)} className={inp} style={inpStyle} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Guests</label>
                  <input type="number" value={f.guests} onChange={e => setField("guests", e.target.value)} placeholder="0" min={1} className={inp} style={inpStyle} />
                </div>
              </div>
            </div>
          </div>

          {/* Hall Amount */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Hall Amount</p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: "var(--fg-muted)" }}>Rs.</span>
              <input
                type="number" placeholder="0" value={f.hallAmount}
                onChange={e => setField("hallAmount", e.target.value)}
                min={0} className={`${inp} pl-11`} style={inpStyle}
              />
            </div>
          </div>

          {/* Services */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Services <span className="font-normal normal-case" style={{ color: "var(--fg-subtle)", letterSpacing: 0 }}>(optional)</span></p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {PRESET_SVCS.map(p => {
                const active = services.some(s => s.id === p.id);
                return (
                  <button key={p.id} type="button" onClick={() => togglePreset(p)}
                    className="flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-medium cursor-pointer transition-all text-left"
                    style={{
                      background: active ? "var(--primary-light)" : "var(--bg-subtle)",
                      color: active ? "var(--primary)" : "var(--fg-muted)",
                      border: `1.5px solid ${active ? "var(--primary-muted)" : "transparent"}`,
                    }}>
                    <SvcIcon id={p.id} />
                    {p.label}
                    {active && <span className="ml-auto"><CheckIcon /></span>}
                  </button>
                );
              })}
            </div>
            {services.length > 0 && (
              <div className="flex flex-col gap-3">
                {services.map(s => (
                  <div key={s.id} className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: "var(--bg-subtle)", border: "1px solid #E5E7EB" }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <SvcIcon id={s.id} color="var(--primary)" />
                        <p className="text-sm font-semibold text-black">
                          {s.id === "custom" ? (s.label !== "Custom" ? s.label : "Custom Service") : s.label}
                        </p>
                      </div>
                      <button type="button" onClick={() => removeSvc(s.id)}
                        className="w-6 h-6 flex items-center justify-center rounded-lg cursor-pointer hover:bg-red-50"
                        style={{ color: "#DC2626" }}>
                        <XSmIcon />
                      </button>
                    </div>
                    {s.id === "custom" && (
                      <input placeholder="Service name *" value={s.label === "Custom" ? "" : s.label}
                        onChange={e => updateSvc(s.id, "label", e.target.value || "Custom")}
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none border"
                        style={{ background: "#fff", borderColor: "#D1D5DB", color: "var(--fg)" }} autoFocus />
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs mb-1.5" style={{ color: "var(--fg-muted)" }}>Unit / Qty</p>
                        <input placeholder="e.g. 350 pax" value={s.unit} onChange={e => updateSvc(s.id, "unit", e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none border"
                          style={{ background: "#fff", borderColor: "#D1D5DB", color: "var(--fg)" }} />
                      </div>
                      <div>
                        <p className="text-xs mb-1.5" style={{ color: "var(--fg-muted)" }}>Price</p>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none" style={{ color: "var(--fg-muted)" }}>Rs.</span>
                          <input type="number" placeholder="0" value={s.price} onChange={e => updateSvc(s.id, "price", e.target.value)}
                            min={0} className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none border"
                            style={{ background: "#fff", borderColor: "#D1D5DB", color: "var(--fg)" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Amount breakdown */}
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#E5E7EB" }}>
            <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "var(--bg-subtle)" }}>
              <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Hall Amount</span>
              <span className="text-xs font-medium text-black">Rs. {hallAmt.toLocaleString("en-PK")}</span>
            </div>
            {svcTotal > 0 && (
              <div className="flex items-center justify-between px-4 py-2.5 border-t" style={{ background: "var(--bg-subtle)", borderColor: "#E5E7EB" }}>
                <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Services ({services.length})</span>
                <span className="text-xs font-medium text-black">+ Rs. {svcTotal.toLocaleString("en-PK")}</span>
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-3 border-t" style={{ background: "#fff", borderColor: "#E5E7EB" }}>
              <span className="text-xs font-bold text-black">Grand Total</span>
              <span className="text-sm font-bold" style={{ color: "var(--primary)" }}>Rs. {grandTotal.toLocaleString("en-PK")}</span>
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Notes (optional)</label>
            <textarea
              value={f.notes}
              onChange={e => setField("notes", e.target.value)}
              placeholder="Special instructions or notes..."
              rows={3}
              className="px-4 py-3 rounded-xl border text-sm outline-none resize-none"
              style={{ background: "var(--bg-subtle)", borderColor: "#D1D5DB", color: "var(--fg)", minHeight: "80px" }}
            />
          </div>

          <button type="submit" disabled={submitting}
            className="w-full py-3.5 rounded-2xl text-sm font-bold cursor-pointer transition-opacity hover:opacity-90 mt-1 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: "var(--primary)", color: "#ffffff" }}>
            {submitting && (
              <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin inline-block" />
            )}
            {submitting ? "Saving…" : "Save Quotation"}
          </button>
        </form>
      </div>
    </>
  );
}

// ─── PDF Generator ────────────────────────────────────────────────────────────
function generatePDF(q: Quotation) {
  const svcTotal = (q.services ?? []).reduce((s, sv) => s + (Number(sv.price) || 0), 0);
  const total    = q.hallAmount + svcTotal;
  const fmtRs    = (n: number) => "Rs. " + n.toLocaleString("en-PK");
  const fmtDate  = (d: string) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—";
  const qId      = displayId(q.id);

  const servicesHTML = (q.services?.length ?? 0) > 0
    ? `<table class="table">
        <thead><tr><th>Service</th><th>Qty / Unit</th><th class="right">Price</th></tr></thead>
        <tbody>
          ${q.services.map(s => `
            <tr>
              <td>${s.label}</td>
              <td>${s.unit || "—"}</td>
              <td class="right">${s.price ? fmtRs(Number(s.price)) : "—"}</td>
            </tr>`).join("")}
        </tbody>
      </table>`
    : `<p class="no-services">No additional services</p>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Quotation ${qId} – Event Ease</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; background: #fff; padding: 40px; font-size: 13px; }
    @media print { body { padding: 24px; } .no-print { display: none !important; } @page { margin: 16mm; size: A4; } }
    .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 24px; border-bottom: 2px solid #FF3B6B; margin-bottom: 28px; }
    .brand-name { font-size: 22px; font-weight: 800; color: #111; letter-spacing: -0.5px; }
    .brand-sub { font-size: 11px; color: #888; margin-top: 1px; }
    .quote-meta { text-align: right; }
    .quote-id { font-size: 20px; font-weight: 700; color: #111; }
    .quote-status { display: inline-block; margin-top: 4px; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
    .info-block h3 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 8px; }
    .info-block p { font-size: 13px; color: #333; line-height: 1.6; }
    .info-block .name { font-size: 15px; font-weight: 700; color: #111; }
    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead tr { background: #FFF0F4; }
    thead th { padding: 10px 12px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #FF3B6B; }
    thead th.right { text-align: right; }
    tbody tr { border-bottom: 1px solid #F4F4F5; }
    tbody tr:last-child { border-bottom: none; }
    tbody td { padding: 10px 12px; font-size: 13px; color: #333; }
    tbody td.right { text-align: right; }
    .no-services { font-size: 13px; color: #aaa; font-style: italic; padding: 8px 0; }
    .payment-box { background: #f9f9f9; border-radius: 12px; padding: 16px; }
    .pay-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
    .pay-row.total { border-top: 1px solid #eee; margin-top: 4px; padding-top: 10px; font-size: 15px; font-weight: 700; }
    .notes-box { background: #f9f9f9; border-radius: 8px; padding: 14px 16px; margin-top: 24px; font-size: 12px; color: #555; line-height: 1.7; }
    .notes-box strong { display: block; margin-bottom: 4px; color: #111; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #E5E7EB; display: flex; justify-content: space-between; font-size: 11px; color: #aaa; }
    .print-btn { display: block; margin: 0 auto 32px; padding: 10px 28px; background: #FF3B6B; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">Download / Print PDF</button>
  <div class="header">
    <div><div class="brand-name">Royal Banquet Hall</div><div class="brand-sub">Event Ease</div></div>
    <div class="quote-meta">
      <div class="quote-id">${qId}</div>
      <span class="quote-status" style="background:${q.status==="accepted"?"#F0FDF4":q.status==="rejected"?"#FEF2F2":"#FFFBEB"};color:${q.status==="accepted"?"#16A34A":q.status==="rejected"?"#DC2626":"#D97706"}">
        ${q.status.charAt(0).toUpperCase()+q.status.slice(1)}
      </span>
    </div>
  </div>
  <div class="info-grid">
    <div class="info-block">
      <h3>Prepared For</h3>
      <p class="name">${q.customerName}</p>
      <p>${q.phone}</p>
      ${q.email ? `<p>${q.email}</p>` : ""}
    </div>
    <div class="info-block">
      <h3>Event Details</h3>
      <p><strong>${q.event}</strong> — ${q.hall}</p>
      <p>Date: ${fmtDate(q.date)}</p>
      <p>Guests: ${q.guests}</p>
    </div>
  </div>
  <p class="section-title">Services</p>
  ${servicesHTML}
  <p class="section-title">Payment Summary</p>
  <div class="payment-box">
    <div class="pay-row"><span>Hall Amount</span><span>${fmtRs(q.hallAmount)}</span></div>
    ${svcTotal > 0 ? `<div class="pay-row"><span>Services Total</span><span>${fmtRs(svcTotal)}</span></div>` : ""}
    <div class="pay-row total"><span>Grand Total</span><span style="color:#FF3B6B">${fmtRs(total)}</span></div>
  </div>
  ${q.notes ? `<div class="notes-box"><strong>Notes</strong>${q.notes}</div>` : ""}
  <div class="footer">
    <span>Generated by Event Ease · Royal Banquet Hall</span>
    <span>${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
  </div>
  <script>window.onload=()=>{window.print()}</script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

// ─── Detail Content ───────────────────────────────────────────────────────────
function QuotationDetailContent({
  q, onClose, onStatusChange,
}: {
  q: Quotation;
  onClose: () => void;
  onStatusChange: (id: string, status: QuotationStatus) => void;
}) {
  const svcTotal = (q.services ?? []).reduce((s, sv) => s + (Number(sv.price) || 0), 0);
  const total    = q.hallAmount + svcTotal;
  const cfg      = STATUS_CONFIG[q.status];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "#F4F4F5" }}>
        <div>
          <p className="text-sm font-bold text-black">{displayId(q.id)}</p>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => generatePDF(q)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80"
            style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
            <PDFIcon /> PDF
          </button>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer hover:bg-gray-100" style={{ color: "var(--fg-muted)" }}>
            <XIcon />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">

        {/* Customer */}
        <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: "var(--bg-subtle)" }}>
          <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0" style={{ background: HALL_COLOR[q.hall] || "var(--primary)" }}>
            {q.customerName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-black">{q.customerName}</p>
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--fg-muted)" }}>{q.phone}{q.email ? ` · ${q.email}` : ""}</p>
          </div>
        </div>

        {/* Event Details */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Event Details</p>
          <div className="flex flex-col">
            {[
              { label: "Event",      value: q.event,              badge: false },
              { label: "Hall",       value: q.hall,               badge: true  },
              { label: "Event Date", value: formatDate(q.date),   badge: false },
              { label: "Guests",     value: `${q.guests} guests`, badge: false },
            ].map((row, i) => (
              <div key={row.label} className={`flex items-center justify-between py-2.5 ${i !== 3 ? "border-b" : ""}`} style={{ borderColor: "#F4F4F5" }}>
                <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{row.label}</span>
                {row.badge
                  ? <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: HALL_BG[q.hall] || "var(--primary-light)", color: HALL_COLOR[q.hall] || "var(--primary)" }}>{row.value}</span>
                  : <span className="text-sm font-semibold text-black">{row.value}</span>
                }
              </div>
            ))}
          </div>
        </div>

        {/* Services */}
        {(q.services?.length ?? 0) > 0 && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Services</p>
            <div className="flex flex-col gap-2">
              {(q.services ?? []).map((s, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: "var(--bg-subtle)", border: "1px solid #E5E7EB" }}>
                  <div>
                    <p className="text-sm font-semibold text-black">{s.label}</p>
                    {s.unit && <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{s.unit}</p>}
                  </div>
                  {s.price && <span className="text-sm font-semibold" style={{ color: "var(--primary)" }}>Rs. {Number(s.price).toLocaleString("en-PK")}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Amount breakdown */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Payment</p>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
            <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "var(--bg-subtle)" }}>
              <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Hall Amount</span>
              <span className="text-xs font-semibold text-black">{fmt(q.hallAmount)}</span>
            </div>
            {(q.services ?? []).filter(s => Number(s.price) > 0).map((s, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: "1px solid #F4F4F5", background: "var(--bg-subtle)" }}>
                <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{s.label}</span>
                <span className="text-xs font-semibold text-black">+ {fmt(Number(s.price))}</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid #E5E7EB", background: "#fff" }}>
              <span className="text-xs font-bold text-black">Grand Total</span>
              <span className="text-sm font-bold" style={{ color: "var(--primary)" }}>{fmt(total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {q.notes && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--fg-subtle)" }}>Notes</p>
            <p className="text-sm rounded-xl p-3 leading-relaxed" style={{ background: "var(--bg-subtle)", color: "var(--fg-muted)" }}>{q.notes}</p>
          </div>
        )}

        {/* Status Actions */}
        <div className="flex flex-col gap-2 pt-1">
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--fg-subtle)" }}>Update Status</p>
          <div className="flex gap-2">
            <button
              onClick={() => onStatusChange(q.id, "accepted")}
              disabled={q.status === "accepted"}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer transition-all disabled:opacity-40"
              style={{
                background: "#F0FDF4",
                color: "#16A34A",
                border: q.status === "accepted" ? "2px solid #16A34A" : "2px solid transparent",
              }}>
              {q.status === "accepted" ? "✓ Accepted" : "Accept"}
            </button>
            <button
              onClick={() => onStatusChange(q.id, "rejected")}
              disabled={q.status === "rejected"}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer transition-all disabled:opacity-40"
              style={{
                background: "#FEF2F2",
                color: "#DC2626",
                border: q.status === "rejected" ? "2px solid #DC2626" : "2px solid transparent",
              }}>
              {q.status === "rejected" ? "✕ Rejected" : "Reject"}
            </button>
          </div>
          {(q.status === "accepted" || q.status === "rejected") && (
            <button
              onClick={() => onStatusChange(q.id, "pending")}
              className="w-full py-2.5 rounded-2xl text-xs font-semibold cursor-pointer hover:opacity-80"
              style={{ background: "var(--bg-subtle)", color: "var(--fg-muted)" }}>
              Reset to Pending
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailModal({ q, onClose, onStatusChange }: { q: Quotation; onClose: () => void; onStatusChange: (id: string, status: QuotationStatus) => void }) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed z-40 bottom-0 left-0 right-0 rounded-t-3xl bg-white flex flex-col lg:hidden overflow-hidden" style={{ maxHeight: "92dvh", boxShadow: "0 -4px 40px rgba(0,0,0,0.12)" }}>
        <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="w-10 h-1 rounded-full" style={{ background: "#E5E7EB" }} /></div>
        <QuotationDetailContent q={q} onClose={onClose} onStatusChange={onStatusChange} />
      </div>
      <div className="hidden lg:flex fixed z-40 right-0 top-0 bottom-0 w-[560px] bg-white flex-col overflow-hidden rounded-l-3xl" style={{ boxShadow: "-4px 0 40px rgba(0,0,0,0.12)" }}>
        <QuotationDetailContent q={q} onClose={onClose} onStatusChange={onStatusChange} />
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function QuotationsPage() {
  const { accessToken } = useAuthStore();

  const [quotations, setQuotations]   = useState<Quotation[]>([]);
  const [halls, setHalls]             = useState<string[]>([]);
  const [loading, setLoading]         = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [filter, setFilter]           = useState<"all" | QuotationStatus>("all");
  const [search, setSearch]           = useState("");
  const [page, setPage]               = useState(1);
  const [newModalOpen, setNewModalOpen]   = useState(false);
  const [detailTarget, setDetailTarget]   = useState<Quotation | null>(null);
  const [editTarget, setEditTarget]       = useState<Quotation | null>(null);
  const [deleteTarget, setDeleteTarget]   = useState<Quotation | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    Promise.all([
      api.get<{ quotations: Quotation[] }>("/api/vendor/quotations", accessToken),
      api.get<{ halls: { id: string; name: string }[] }>("/api/vendor/halls", accessToken),
    ]).then(([qRes, hRes]) => {
      if (qRes.success) setQuotations(qRes.quotations ?? []);
      if (hRes.success && hRes.halls?.length) setHalls(hRes.halls.map(h => h.name));
    }).finally(() => setLoading(false));
  }, [accessToken]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const filtered = quotations.filter(q => {
    const matchFilter = filter === "all" || q.status === filter;
    const s = search.toLowerCase();
    const matchSearch = !s ||
      q.customerName.toLowerCase().includes(s) ||
      q.event.toLowerCase().includes(s) ||
      q.hall.toLowerCase().includes(s) ||
      displayId(q.id).toLowerCase().includes(s);
    return matchFilter && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function changeFilter(v: "all" | QuotationStatus) { setFilter(v); setPage(1); }
  function changeSearch(v: string)                   { setSearch(v); setPage(1); }

  const counts = {
    all:      quotations.length,
    pending:  quotations.filter(q => q.status === "pending").length,
    accepted: quotations.filter(q => q.status === "accepted").length,
    rejected: quotations.filter(q => q.status === "rejected").length,
  };

  const totalValue = quotations.filter(q => q.status === "accepted").reduce((s, q) => s + calcTotal(q), 0);

  // ── Handlers ───────────────────────────────────────────────────────────────
  async function handleCreate(f: FormState) {
    setFormSubmitting(true);
    try {
      const res = await api.post<{ id: string }>("/api/vendor/quotations", {
        customerName: f.customerName,
        phone:        f.phone || "",
        email:        f.email || "",
        event:        f.event,
        hall:         f.hall,
        date:         f.date || undefined,
        guests:       Number(f.guests) || 0,
        hallAmount:   Number(f.hallAmount) || 0,
        notes:        f.notes || undefined,
        services:     f.services,
      }, accessToken ?? undefined);

      if (res.success && res.id) {
        const newQ: Quotation = {
          id:           res.id,
          customerName: f.customerName,
          phone:        f.phone,
          email:        f.email,
          event:        f.event,
          hall:         f.hall,
          date:         f.date,
          guests:       Number(f.guests) || 0,
          hallAmount:   Number(f.hallAmount) || 0,
          status:       "pending",
          services:     f.services,
          notes:        f.notes,
        };
        setQuotations(prev => [newQ, ...prev]);
        setNewModalOpen(false);
        setPage(1);
      }
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleEdit(f: FormState) {
    if (!editTarget) return;
    setFormSubmitting(true);
    try {
      const res = await api.patch(`/api/vendor/quotations/${editTarget.id}`, {
        customerName: f.customerName,
        phone:        f.phone,
        email:        f.email,
        event:        f.event,
        hall:         f.hall,
        date:         f.date || undefined,
        guests:       Number(f.guests) || 0,
        hallAmount:   Number(f.hallAmount) || 0,
        notes:        f.notes || undefined,
        services:     f.services,
      }, accessToken ?? undefined);

      if (res.success) {
        setQuotations(prev => prev.map(q => q.id === editTarget.id ? {
          ...q,
          customerName: f.customerName,
          phone:        f.phone,
          email:        f.email,
          event:        f.event,
          hall:         f.hall,
          date:         f.date,
          guests:       Number(f.guests) || 0,
          hallAmount:   Number(f.hallAmount) || 0,
          services:     f.services,
          notes:        f.notes,
        } : q));
        setEditTarget(null);
      }
    } finally {
      setFormSubmitting(false);
    }
  }

  function handleStatusChange(id: string, status: QuotationStatus) {
    // optimistic update
    setQuotations(prev => prev.map(q => q.id === id ? { ...q, status } : q));
    api.patch(`/api/vendor/quotations/${id}/status`, { status }, accessToken ?? undefined);
  }

  function handleDelete(id: string) {
    setQuotations(prev => prev.filter(q => q.id !== id));
    setDeleteTarget(null);
    if (detailTarget?.id === id) setDetailTarget(null);
    api.delete(`/api/vendor/quotations/${id}`, accessToken ?? undefined);
  }

  function formFromQuotation(q: Quotation): FormState {
    return {
      customerName: q.customerName,
      phone:        q.phone,
      email:        q.email,
      event:        q.event,
      hall:         q.hall,
      date:         q.date,
      guests:       String(q.guests),
      hallAmount:   String(q.hallAmount),
      notes:        q.notes,
      status:       q.status,
      services:     q.services,
    };
  }

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-7 w-32 rounded-xl bg-gray-200 animate-pulse mb-2" />
            <div className="h-4 w-52 rounded-lg bg-gray-100 animate-pulse" />
          </div>
          <div className="h-10 w-36 rounded-2xl bg-gray-200 animate-pulse" />
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
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                <div>
                  <div className="h-4 w-32 rounded bg-gray-200 mb-1.5" />
                  <div className="h-3 w-24 rounded bg-gray-100" />
                </div>
              </div>
              <div className="h-3 w-40 rounded bg-gray-100 mb-2" />
              <div className="h-3 w-full rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {newModalOpen && (
        <QuotationForm title="New Quotation" initial={{ ...EMPTY_FORM, hall: halls[0] ?? "" }} halls={halls} submitting={formSubmitting} onClose={() => setNewModalOpen(false)} onSubmit={handleCreate} />
      )}
      {editTarget && (
        <QuotationForm title="Edit Quotation" subtitle={displayId(editTarget.id)} initial={formFromQuotation(editTarget)} halls={halls} submitting={formSubmitting} onClose={() => setEditTarget(null)} onSubmit={handleEdit} />
      )}
      {detailTarget && (
        <DetailModal q={quotations.find(q => q.id === detailTarget.id) ?? detailTarget} onClose={() => setDetailTarget(null)} onStatusChange={handleStatusChange} />
      )}
      {deleteTarget && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl p-6 w-[320px] shadow-2xl">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#FEF2F2" }}>
              <TrashIcon size={20} color="#DC2626" />
            </div>
            <p className="text-base font-bold text-black text-center">Delete Quotation?</p>
            <p className="text-sm text-center mt-1 mb-5" style={{ color: "var(--fg-muted)" }}>
              <span className="font-semibold text-black">{displayId(deleteTarget.id)}</span> for{" "}
              <span className="font-semibold text-black">{deleteTarget.customerName}</span> will be permanently deleted.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer hover:opacity-80"
                style={{ background: "var(--bg-subtle)", color: "var(--fg)" }}>
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteTarget.id)}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer hover:opacity-90"
                style={{ background: "#DC2626", color: "#fff" }}>
                Delete
              </button>
            </div>
          </div>
        </>
      )}

      <div className="p-4 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl lg:text-2xl font-semibold text-black tracking-tight">Quotations</h1>
            <p className="text-sm mt-1" style={{ color: "var(--fg-muted)" }}>Create and manage event quotations</p>
          </div>
          <button onClick={() => setNewModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90"
            style={{ background: "var(--primary)", color: "#ffffff" }}>
            <PlusIcon /> New Quotation
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-black">{counts.all}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>Total Quotations</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-2xl font-bold" style={{ color: "#16A34A" }}>{counts.accepted}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>Accepted</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-2xl font-bold" style={{ color: "#D97706" }}>{counts.pending}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>Pending</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-base font-bold" style={{ color: "var(--primary)" }}>{fmt(totalValue)}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>Accepted Value</p>
          </div>
        </div>

        {/* Filter + Search */}
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
                {filter === t.value && <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full" style={{ background: "var(--primary)" }} />}
              </button>
            ))}
          </div>
          <div className="px-4 py-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--fg-subtle)" }}><SearchIcon /></span>
              <input value={search} onChange={e => changeSearch(e.target.value)}
                placeholder="Search customer, event, hall, quotation ID..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none border"
                style={{ background: "var(--bg-subtle)", borderColor: "#E5E7EB", color: "var(--fg)" }} />
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-2">
          {paginated.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm py-16 flex flex-col items-center text-center">
              <EmptyIcon />
              <p className="text-sm font-medium mt-3 text-black">No quotations found</p>
              <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>
                {quotations.length === 0 ? "Create your first quotation" : "Try changing the filter or search"}
              </p>
            </div>
          )}
          {paginated.map(q => {
            const cfg      = STATUS_CONFIG[q.status];
            const total    = calcTotal(q);
            const svcTotal = (q.services ?? []).reduce((s, sv) => s + (Number(sv.price) || 0), 0);
            return (
              <div key={q.id} className="bg-white rounded-2xl shadow-sm p-4">
                {/* Row 1: avatar + name + status */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: HALL_COLOR[q.hall] || "var(--primary)" }}>
                      {q.customerName[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-black truncate">{q.customerName}</p>
                      <p className="text-xs truncate" style={{ color: "var(--fg-muted)" }}>{q.phone}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                </div>
                {/* Row 2: hall + event */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: HALL_BG[q.hall] || "var(--primary-light)", color: HALL_COLOR[q.hall] || "var(--primary)" }}>{q.hall}</span>
                  <span className="text-xs font-medium text-black">{q.event}</span>
                </div>
                {/* Row 3: date + guests */}
                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mb-3">
                  <div className="flex items-center gap-1.5">
                    <CalSmIcon />
                    <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{formatDate(q.date)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <GuestSmIcon />
                    <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{q.guests} guests</span>
                  </div>
                  {(q.services?.length ?? 0) > 0 && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--bg-subtle)", color: "var(--fg-muted)" }}>
                      {q.services.length} service{q.services.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                {/* Row 4: amounts */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs" style={{ color: "var(--fg-muted)" }}>
                    <span>Hall: {fmt(q.hallAmount)}</span>
                    {svcTotal > 0 && <span>+ Svcs: {fmt(svcTotal)}</span>}
                  </div>
                  <span className="text-sm font-bold text-black">{fmt(total)}</span>
                </div>
                {/* Row 5: ID + actions */}
                <div className="flex items-center justify-between pt-2.5 border-t" style={{ borderColor: "#F4F4F5" }}>
                  <span className="text-[10px] font-mono font-medium" style={{ color: "var(--fg-subtle)" }}>{displayId(q.id)}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setDetailTarget(q)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:bg-blue-50"
                      style={{ color: "#2563EB" }} title="View">
                      <EyeIcon />
                    </button>
                    <button onClick={() => setEditTarget(q)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:bg-amber-50"
                      style={{ color: "#D97706" }} title="Edit">
                      <EditIcon />
                    </button>
                    <button onClick={() => setDeleteTarget(q)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:bg-red-50"
                      style={{ color: "#DC2626" }} title="Delete">
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm px-4 py-3 mt-4">
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-30 hover:bg-gray-100"
                style={{ color: "var(--fg-muted)" }}><ChevLeftIcon /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold cursor-pointer"
                  style={{ background: safePage === n ? "var(--primary)" : "transparent", color: safePage === n ? "#fff" : "var(--fg-muted)" }}>
                  {n}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-30 hover:bg-gray-100"
                style={{ color: "var(--fg-muted)" }}><ChevRightIcon /></button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Service icon helper ──────────────────────────────────────────────────────
function SvcIcon({ id, color = "currentColor" }: { id: string; color?: string }) {
  if (id === "drink")  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>;
  if (id === "music")  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
  if (id === "table")  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M3 12h18"/><path d="M8 6v12"/><path d="M16 6v12"/></svg>;
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function PlusIcon()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>; }
function XIcon()       { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>; }
function XSmIcon()     { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function CheckIcon()   { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function PDFIcon()     { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>; }
function EyeIcon()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>; }
function EditIcon()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>; }
function TrashIcon({ size = 14, color = "currentColor" }: { size?: number; color?: string }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>; }
function SearchIcon()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>; }
function CalSmIcon()   { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fg-subtle)" }}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>; }
function GuestSmIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fg-subtle)" }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>; }
function EmptyIcon()   { return <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fg-subtle)" }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>; }
function ChevLeftIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>; }
function ChevRightIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>; }
