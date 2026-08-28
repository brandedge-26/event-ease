"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";
import { saveToCache, loadFromCache, CACHE_KEYS } from "@/lib/bookingCache";
import { addPending, getAllPending } from "@/lib/offlineDB";

// ─── Types ────────────────────────────────────────────────────────────────────
type QuotationStatus = "pending" | "accepted" | "rejected";
type ServiceEntry = { name: string; price: string };

type Quotation = {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  event: string;
  date: string;
  totalAmount: number;
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

const FILTER_TABS: { label: string; value: "all" | QuotationStatus }[] = [
  { label: "All",      value: "all" },
  { label: "Pending",  value: "pending" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) { return "Rs. " + n.toLocaleString("en-PK"); }
function formatDate(d: string) {
  if (!d || d === "—") return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function calcTotal(q: Quotation) {
  return q.totalAmount + (q.services ?? []).reduce((s, sv) => s + (Number(sv.price) || 0), 0);
}
function displayId(id: string) {
  if (id.startsWith("offline-")) return "QT-DRAFT";
  return "QT-" + id.slice(0, 8).toUpperCase();
}

// ─── FormState ────────────────────────────────────────────────────────────────
type FormState = {
  customerName: string;
  phone: string;
  email: string;
  event: string;
  date: string;
  totalAmount: string;
  notes: string;
  status: QuotationStatus;
  services: ServiceEntry[];
};

const EMPTY_FORM: FormState = {
  customerName: "", phone: "", email: "",
  event: EVENT_TYPES[0], date: "",
  totalAmount: "", notes: "", status: "pending",
  services: [],
};

// ─── Quotation Form ───────────────────────────────────────────────────────────
function QuotationForm({ title, subtitle, initial, submitting, onClose, onSubmit }: {
  title: string;
  subtitle?: string;
  initial: FormState;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (f: FormState) => void;
}) {
  const [f, setF]         = useState<FormState>(initial);
  const [services, setSvcs] = useState<ServiceEntry[]>(initial.services);
  const [svcName, setSvcName] = useState("");
  const [svcPrice, setSvcPrice] = useState("");

  const baseAmt    = Number(f.totalAmount) || 0;
  const svcTotal   = services.reduce((s, sv) => s + (Number(sv.price) || 0), 0);
  const grandTotal = baseAmt + svcTotal;

  function setField<K extends keyof FormState>(k: K, v: FormState[K]) {
    setF(prev => ({ ...prev, [k]: v }));
  }

  function addService() {
    if (!svcName.trim()) return;
    setSvcs(prev => [...prev, { name: svcName.trim(), price: svcPrice }]);
    setSvcName(""); setSvcPrice("");
  }

  function removeService(i: number) {
    setSvcs(prev => prev.filter((_, idx) => idx !== i));
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

          {/* Event Details — no hall, no guests */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Event Details</p>
            <div className="flex flex-col gap-3">
              <select value={f.event} onChange={e => setField("event", e.target.value)} className={inp} style={inpStyle} required>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Event Date</label>
                <input type="date" value={f.date} onChange={e => setField("date", e.target.value)} className={inp} style={inpStyle} />
              </div>
            </div>
          </div>

          {/* Total Amount */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Total Amount</p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: "var(--fg-muted)" }}>Rs.</span>
              <input type="number" placeholder="0" value={f.totalAmount}
                onChange={e => setField("totalAmount", e.target.value)}
                min={0} className={`${inp} pl-11`} style={inpStyle} />
            </div>
          </div>

          {/* Services — simple name+price+Add */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>
              Services <span className="font-normal normal-case" style={{ color: "var(--fg-subtle)", letterSpacing: 0 }}>(optional)</span>
            </p>

            {/* Add row */}
            <div className="flex items-end gap-2 mb-3">
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Service Name</label>
                <input
                  value={svcName}
                  onChange={e => setSvcName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addService(); } }}
                  placeholder="e.g. Photography"
                  className={inp}
                  style={inpStyle}
                />
              </div>
              <div className="w-28 flex flex-col gap-1">
                <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Price (Rs.)</label>
                <input
                  type="number"
                  value={svcPrice}
                  onChange={e => setSvcPrice(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addService(); } }}
                  placeholder="0"
                  min={0}
                  className={inp}
                  style={inpStyle}
                />
              </div>
              <button
                type="button"
                onClick={addService}
                disabled={!svcName.trim()}
                className="flex items-center gap-1 px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-40 shrink-0"
                style={{ background: "var(--primary)", color: "#ffffff" }}
              >
                <PlusIcon /> Add
              </button>
            </div>

            {/* List */}
            {services.length > 0 ? (
              <div className="flex flex-col rounded-2xl overflow-hidden bg-white" style={{ border: "1px solid #F4F4F5" }}>
                {services.map((s, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: i < services.length - 1 ? "1px solid #F4F4F5" : "none" }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                        style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                        {i + 1}
                      </div>
                      <p className="text-sm font-semibold text-black truncate">{s.name}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <p className="text-sm font-bold" style={{ color: "var(--primary)" }}>
                        Rs. {Number(s.price || 0).toLocaleString("en-PK")}
                      </p>
                      <button type="button" onClick={() => removeService(i)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer hover:bg-red-50 transition-colors"
                        style={{ color: "#DC2626" }}>
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 text-center rounded-2xl" style={{ background: "var(--bg-subtle)" }}>
                <p className="text-sm font-medium text-black">No services added</p>
                <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>Add services above to include in quotation</p>
              </div>
            )}
          </div>

          {/* Amount breakdown */}
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#E5E7EB" }}>
            <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "var(--bg-subtle)" }}>
              <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Base Amount</span>
              <span className="text-xs font-medium text-black">Rs. {baseAmt.toLocaleString("en-PK")}</span>
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
            <textarea value={f.notes} onChange={e => setField("notes", e.target.value)}
              placeholder="Special instructions or notes..." rows={3}
              className="px-4 py-3 rounded-xl border text-sm outline-none resize-none"
              style={{ background: "var(--bg-subtle)", borderColor: "#D1D5DB", color: "var(--fg)", minHeight: "80px" }} />
          </div>

          <button type="submit" disabled={submitting}
            className="w-full py-3.5 rounded-2xl text-sm font-bold cursor-pointer transition-opacity hover:opacity-90 mt-1 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: "var(--primary)", color: "#ffffff" }}>
            {submitting && <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin inline-block" />}
            {submitting ? "Saving…" : "Save Quotation"}
          </button>
        </form>
      </div>
    </>
  );
}

// ─── PDF Generator ────────────────────────────────────────────────────────────
function generatePDF(q: Quotation, businessName: string) {
  const svcTotal = (q.services ?? []).reduce((s, sv) => s + (Number(sv.price) || 0), 0);
  const total    = q.totalAmount + svcTotal;
  const fmtRs    = (n: number) => "Rs. " + n.toLocaleString("en-PK");
  const fmtDate  = (d: string) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—";
  const qId      = displayId(q.id);

  const servicesHTML = (q.services?.length ?? 0) > 0
    ? `<table class="table">
        <thead><tr><th>Service</th><th class="right">Price</th></tr></thead>
        <tbody>
          ${q.services.map(s => `
            <tr>
              <td>${s.name}</td>
              <td class="right">${s.price ? fmtRs(Number(s.price)) : "—"}</td>
            </tr>`).join("")}
        </tbody>
      </table>`
    : `<p class="no-services">No additional services</p>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Quotation ${qId} – Event Ease</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Segoe UI',Arial,sans-serif;color:#111;background:#fff;padding:40px;font-size:13px;}
    @media print{body{padding:24px;}.no-print{display:none!important;}@page{margin:16mm;size:A4;}}
    .header{display:flex;align-items:center;justify-content:space-between;padding-bottom:24px;border-bottom:2px solid #FF3B6B;margin-bottom:28px;}
    .brand-name{font-size:22px;font-weight:800;color:#111;letter-spacing:-0.5px;}
    .brand-sub{font-size:11px;color:#888;margin-top:1px;}
    .quote-meta{text-align:right;}
    .quote-id{font-size:20px;font-weight:700;color:#111;}
    .quote-status{display:inline-block;margin-top:4px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:28px;}
    .info-block h3{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:8px;}
    .info-block p{font-size:13px;color:#333;line-height:1.6;}
    .info-block .name{font-size:15px;font-weight:700;color:#111;}
    .section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:10px;}
    table{width:100%;border-collapse:collapse;margin-bottom:20px;}
    thead tr{background:#FFF0F4;}
    thead th{padding:10px 12px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#FF3B6B;}
    thead th.right{text-align:right;}
    tbody tr{border-bottom:1px solid #F4F4F5;}
    tbody tr:last-child{border-bottom:none;}
    tbody td{padding:10px 12px;font-size:13px;color:#333;}
    tbody td.right{text-align:right;}
    .no-services{font-size:13px;color:#aaa;font-style:italic;padding:8px 0;}
    .payment-box{background:#f9f9f9;border-radius:12px;padding:16px;}
    .pay-row{display:flex;justify-content:space-between;padding:6px 0;font-size:13px;}
    .pay-row.total{border-top:1px solid #eee;margin-top:4px;padding-top:10px;font-size:15px;font-weight:700;}
    .notes-box{background:#f9f9f9;border-radius:8px;padding:14px 16px;margin-top:24px;font-size:12px;color:#555;line-height:1.7;}
    .notes-box strong{display:block;margin-bottom:4px;color:#111;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;}
    .footer{margin-top:40px;padding-top:16px;border-top:1px solid #E5E7EB;display:flex;justify-content:space-between;font-size:11px;color:#aaa;}
    .print-btn{display:block;margin:0 auto 32px;padding:10px 28px;background:#FF3B6B;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;}
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">Download / Print PDF</button>
  <div class="header">
    <div><div class="brand-name">${businessName}</div><div class="brand-sub">Vendor Quotation</div></div>
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
      <p><strong>${q.event}</strong></p>
      <p>Date: ${fmtDate(q.date)}</p>
    </div>
  </div>
  <p class="section-title">Services</p>
  ${servicesHTML}
  <p class="section-title">Payment Summary</p>
  <div class="payment-box">
    <div class="pay-row"><span>Base Amount</span><span>${fmtRs(q.totalAmount)}</span></div>
    ${svcTotal > 0 ? `<div class="pay-row"><span>Services Total</span><span>${fmtRs(svcTotal)}</span></div>` : ""}
    <div class="pay-row total"><span>Grand Total</span><span style="color:#FF3B6B">${fmtRs(total)}</span></div>
  </div>
  ${q.notes ? `<div class="notes-box"><strong>Notes</strong>${q.notes}</div>` : ""}
  <div class="footer">
    <span>Generated by Event Ease</span>
    <span>${new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</span>
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
function QuotationDetailContent({ q, onClose, onStatusChange }: {
  q: Quotation;
  onClose: () => void;
  onStatusChange: (id: string, status: QuotationStatus) => void;
}) {
  const { vendor } = useAuthStore();
  const businessName = vendor?.name ?? "My Business";
  const svcTotal = (q.services ?? []).reduce((s, sv) => s + (Number(sv.price) || 0), 0);
  const total    = q.totalAmount + svcTotal;
  const cfg      = STATUS_CONFIG[q.status];

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "#F4F4F5" }}>
        <div>
          <p className="text-sm font-bold text-black">{displayId(q.id)}</p>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => generatePDF(q, businessName)}
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
          <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0" style={{ background: "var(--primary)" }}>
            {q.customerName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-black">{q.customerName}</p>
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--fg-muted)" }}>{q.phone}{q.email ? ` · ${q.email}` : ""}</p>
          </div>
        </div>

        {/* Event Details — no hall, no guests */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Event Details</p>
          <div className="flex flex-col">
            {[
              { label: "Event",      value: q.event },
              { label: "Event Date", value: formatDate(q.date) },
            ].map((row, i, arr) => (
              <div key={row.label} className={`flex items-center justify-between py-2.5 ${i !== arr.length - 1 ? "border-b" : ""}`} style={{ borderColor: "#F4F4F5" }}>
                <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{row.label}</span>
                <span className="text-sm font-semibold text-black">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Services */}
        {(q.services?.length ?? 0) > 0 && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Services</p>
            <div className="flex flex-col rounded-2xl overflow-hidden" style={{ border: "1px solid #F4F4F5" }}>
              {(q.services ?? []).map((s, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 bg-white"
                  style={{ borderBottom: i < q.services.length - 1 ? "1px solid #F4F4F5" : "none" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                      {i + 1}
                    </div>
                    <p className="text-sm font-semibold text-black">{s.name}</p>
                  </div>
                  {s.price && <span className="text-sm font-semibold" style={{ color: "var(--primary)" }}>Rs. {Number(s.price).toLocaleString("en-PK")}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment breakdown */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Payment</p>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
            <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "var(--bg-subtle)" }}>
              <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Base Amount</span>
              <span className="text-xs font-semibold text-black">{fmt(q.totalAmount)}</span>
            </div>
            {svcTotal > 0 && (
              <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: "1px solid #F4F4F5", background: "var(--bg-subtle)" }}>
                <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Services Total</span>
                <span className="text-xs font-semibold text-black">+ {fmt(svcTotal)}</span>
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid #E5E7EB", background: "#fff" }}>
              <span className="text-xs font-bold text-black">Grand Total</span>
              <span className="text-sm font-bold" style={{ color: "var(--primary)" }}>{fmt(total)}</span>
            </div>
          </div>
        </div>

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
            <button onClick={() => onStatusChange(q.id, "accepted")} disabled={q.status === "accepted"}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer transition-all disabled:opacity-40"
              style={{ background: "#F0FDF4", color: "#16A34A", border: q.status === "accepted" ? "2px solid #16A34A" : "2px solid transparent" }}>
              {q.status === "accepted" ? "✓ Accepted" : "Accept"}
            </button>
            <button onClick={() => onStatusChange(q.id, "rejected")} disabled={q.status === "rejected"}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer transition-all disabled:opacity-40"
              style={{ background: "#FEF2F2", color: "#DC2626", border: q.status === "rejected" ? "2px solid #DC2626" : "2px solid transparent" }}>
              {q.status === "rejected" ? "✕ Rejected" : "Reject"}
            </button>
          </div>
          {(q.status === "accepted" || q.status === "rejected") && (
            <button onClick={() => onStatusChange(q.id, "pending")}
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

// ─── DB adapter ──────────────────────────────────────────────────────────────
type DbQuotation = {
  id: string; customerName: string; phone: string; email: string;
  event: string; hall?: string; date: string; guests?: number;
  hallAmount: number; status: QuotationStatus; notes: string;
  services?: { label?: string; name?: string; unit?: string; price?: string }[];
};

function dbToLocal(q: DbQuotation): Quotation {
  return {
    id:          q.id,
    customerName: q.customerName,
    phone:        q.phone ?? "",
    email:        q.email ?? "",
    event:        q.event,
    date:         q.date ?? "",
    totalAmount:  q.hallAmount ?? 0,
    status:       q.status ?? "pending",
    notes:        q.notes ?? "",
    services:     (q.services ?? []).map(s => ({ name: s.name ?? s.label ?? "", price: s.price ?? "" })),
  };
}

// ─── Offline helpers ──────────────────────────────────────────────────────────
async function applyQuotationMutations(quotations: Quotation[]): Promise<{ quotations: Quotation[]; pendingIds: Set<string> }> {
  const pending = await getAllPending();
  const ops = pending.filter(p => p.endpoint.includes("/quotations"));
  const pendingIds = new Set<string>();
  let result = [...quotations];

  for (const op of ops) {
    const method = op.method ?? "POST";
    if (method === "POST") continue;

    const match = op.endpoint.match(/\/quotations\/([^/]+)/);
    if (!match) continue;
    const qId = match[1];
    pendingIds.add(qId);

    if (method === "DELETE") {
      result = result.filter(q => q.id !== qId);
    } else if (method === "PATCH") {
      result = result.map(q => {
        if (q.id !== qId) return q;
        if (op.endpoint.endsWith("/status")) {
          return { ...q, status: (op.payload.status as QuotationStatus) ?? q.status };
        }
        return {
          ...q,
          customerName: (op.payload.customerName as string) ?? q.customerName,
          phone:        (op.payload.phone as string) ?? q.phone,
          email:        (op.payload.email as string) ?? q.email,
          event:        (op.payload.event as string) ?? q.event,
          date:         (op.payload.date as string) ?? q.date,
          totalAmount:  (op.payload.hallAmount as number) ?? q.totalAmount,
          notes:        (op.payload.notes as string) ?? q.notes,
          services:     (op.payload.services as ServiceEntry[]) ?? q.services,
        };
      });
    }
  }
  return { quotations: result, pendingIds };
}

async function pendingQuotationEntries(): Promise<{ quotations: Quotation[]; ids: Set<string> }> {
  const pending = await getAllPending();
  const posts = pending.filter(p => (p.method ?? "POST") === "POST" && p.endpoint === "/api/vendor/quotations");
  const ids = new Set<string>();
  const quotations: Quotation[] = posts.map(pb => {
    ids.add(pb.id);
    const svcs = ((pb.payload.services as { label?: string; name?: string; price?: string }[]) ?? [])
      .map(s => ({ name: s.name ?? s.label ?? "", price: s.price ?? "" }));
    return {
      id:           pb.id,
      customerName: (pb.payload.customerName as string) ?? "—",
      phone:        (pb.payload.phone as string) ?? "",
      email:        (pb.payload.email as string) ?? "",
      event:        (pb.payload.event as string) ?? "—",
      date:         (pb.payload.date as string) ?? "",
      totalAmount:  (pb.payload.hallAmount as number) ?? 0,
      status:       "pending" as QuotationStatus,
      services:     svcs,
      notes:        (pb.payload.notes as string) ?? "",
    };
  });
  return { quotations, ids };
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GeneralQuotationsPage() {
  const { accessToken } = useAuthStore();
  const [quotations,       setQuotations]       = useState<Quotation[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [formSubmitting,   setFormSubmitting]   = useState(false);
  const [filter,           setFilter]           = useState<"all" | QuotationStatus>("all");
  const [search,           setSearch]           = useState("");
  const [page,             setPage]             = useState(1);
  const [newModalOpen,     setNewModalOpen]     = useState(false);
  const [detailTarget,     setDetailTarget]     = useState<Quotation | null>(null);
  const [editTarget,       setEditTarget]       = useState<Quotation | null>(null);
  const [deleteTarget,     setDeleteTarget]     = useState<Quotation | null>(null);
  const [offlinePendingIds, setOfflinePendingIds] = useState<Set<string>>(new Set());

  const loadQuotations = useCallback(async () => {
    if (!accessToken) return;
    const isOffline = accessToken === "offline-session" || !navigator.onLine;

    if (isOffline) {
      const cached = loadFromCache<Quotation>(CACHE_KEYS.GENERAL_QUOTATIONS);
      const base = cached ?? [];
      const { quotations: mutated, pendingIds } = await applyQuotationMutations(base);
      const { quotations: newEntries, ids: newIds } = await pendingQuotationEntries();
      newIds.forEach(id => pendingIds.add(id));
      setQuotations([...newEntries, ...mutated]);
      setOfflinePendingIds(pendingIds);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get<{ quotations: DbQuotation[] }>("/api/vendor/quotations", accessToken);
      if (res.success) {
        const list = (res.quotations ?? []).map(dbToLocal);
        setQuotations(list);
        setOfflinePendingIds(new Set());
        saveToCache(CACHE_KEYS.GENERAL_QUOTATIONS, list);
      }
    } catch {
      const cached = loadFromCache<Quotation>(CACHE_KEYS.GENERAL_QUOTATIONS);
      if (cached) setQuotations(cached);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { loadQuotations(); }, [loadQuotations]);

  useEffect(() => {
    function onSynced() { loadQuotations(); }
    window.addEventListener("offline-synced", onSynced);
    return () => window.removeEventListener("offline-synced", onSynced);
  }, [loadQuotations]);

  const filtered = quotations.filter(q => {
    const matchFilter = filter === "all" || q.status === filter;
    const s = search.toLowerCase();
    const matchSearch = !s || q.customerName.toLowerCase().includes(s) || q.event.toLowerCase().includes(s) || displayId(q.id).toLowerCase().includes(s);
    return matchFilter && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const counts = {
    all:      quotations.length,
    pending:  quotations.filter(q => q.status === "pending").length,
    accepted: quotations.filter(q => q.status === "accepted").length,
    rejected: quotations.filter(q => q.status === "rejected").length,
  };
  const totalValue = quotations.filter(q => q.status === "accepted").reduce((s, q) => s + calcTotal(q), 0);

  async function handleCreate(f: FormState) {
    setFormSubmitting(true);
    const isOffline = accessToken === "offline-session" || !navigator.onLine;
    const payload = {
      customerName: f.customerName, phone: f.phone || "", email: f.email || "",
      event: f.event, hall: "", date: f.date || undefined,
      guests: 0, hallAmount: Number(f.totalAmount) || 0,
      notes: f.notes || undefined,
      services: f.services.map(s => ({ label: s.name, price: s.price })),
    };

    async function queueOffline() {
      const tempId = await addPending({
        method: "POST",
        endpoint: "/api/vendor/quotations",
        accessToken: accessToken ?? "offline-session",
        payload,
        createdAt: Date.now(),
      });
      setQuotations(prev => [{
        id: tempId, customerName: f.customerName, phone: f.phone, email: f.email,
        event: f.event, date: f.date, totalAmount: Number(f.totalAmount) || 0,
        status: "pending", services: f.services, notes: f.notes,
      }, ...prev]);
      setOfflinePendingIds(prev => new Set([...prev, tempId]));
      setNewModalOpen(false); setPage(1);
    }

    try {
      if (isOffline) { await queueOffline(); return; }
      const res = await api.post<{ id: string }>("/api/vendor/quotations", payload, accessToken ?? undefined);
      if (res.success && res.id) {
        setQuotations(prev => [{
          id: res.id, customerName: f.customerName, phone: f.phone, email: f.email,
          event: f.event, date: f.date, totalAmount: Number(f.totalAmount) || 0,
          status: "pending", services: f.services, notes: f.notes,
        }, ...prev]);
        setNewModalOpen(false); setPage(1);
      }
    } catch { await queueOffline(); }
    finally { setFormSubmitting(false); }
  }

  async function handleEdit(f: FormState) {
    if (!editTarget) return;
    setFormSubmitting(true);
    const isOffline = accessToken === "offline-session" || !navigator.onLine;
    const payload = {
      customerName: f.customerName, phone: f.phone, email: f.email,
      event: f.event, hall: "", date: f.date || undefined,
      guests: 0, hallAmount: Number(f.totalAmount) || 0,
      notes: f.notes || undefined,
      services: f.services.map(s => ({ label: s.name, price: s.price })),
    };
    const updated: Quotation = {
      ...editTarget, customerName: f.customerName, phone: f.phone, email: f.email,
      event: f.event, date: f.date, totalAmount: Number(f.totalAmount) || 0,
      services: f.services, notes: f.notes,
    };
    const id = editTarget.id;

    async function queueOffline() {
      await addPending({
        method: "PATCH",
        endpoint: `/api/vendor/quotations/${id}`,
        accessToken: accessToken ?? "offline-session",
        payload,
        createdAt: Date.now(),
      });
      setQuotations(prev => prev.map(q => q.id === id ? updated : q));
      setOfflinePendingIds(prev => new Set([...prev, id]));
      setEditTarget(null);
    }

    try {
      if (isOffline) { await queueOffline(); return; }
      const res = await api.patch(`/api/vendor/quotations/${id}`, payload, accessToken ?? undefined);
      if (res.success) {
        setQuotations(prev => prev.map(q => q.id === id ? updated : q));
        setEditTarget(null);
      }
    } catch { await queueOffline(); }
    finally { setFormSubmitting(false); }
  }

  function handleStatusChange(id: string, status: QuotationStatus) {
    setQuotations(prev => prev.map(q => q.id === id ? { ...q, status } : q));
    setOfflinePendingIds(prev => new Set([...prev, id]));
    const isOffline = accessToken === "offline-session" || !navigator.onLine;
    if (isOffline) {
      addPending({
        method: "PATCH",
        endpoint: `/api/vendor/quotations/${id}/status`,
        accessToken: accessToken ?? "offline-session",
        payload: { status },
        createdAt: Date.now(),
      });
      return;
    }
    api.patch(`/api/vendor/quotations/${id}/status`, { status }, accessToken ?? undefined)
      .then(res => { if (!res.success) setOfflinePendingIds(prev => { const n = new Set(prev); n.delete(id); return n; }); })
      .catch(() => {});
  }

  function handleDelete(id: string) {
    setQuotations(prev => prev.filter(q => q.id !== id));
    setDeleteTarget(null);
    if (detailTarget?.id === id) setDetailTarget(null);
    const isOffline = accessToken === "offline-session" || !navigator.onLine;
    if (isOffline) {
      addPending({
        method: "DELETE",
        endpoint: `/api/vendor/quotations/${id}`,
        accessToken: accessToken ?? "offline-session",
        payload: {},
        createdAt: Date.now(),
      });
      return;
    }
    api.delete(`/api/vendor/quotations/${id}`, accessToken ?? undefined);
  }

  function formFrom(q: Quotation): FormState {
    return { customerName: q.customerName, phone: q.phone, email: q.email, event: q.event, date: q.date, totalAmount: String(q.totalAmount), notes: q.notes, status: q.status, services: q.services };
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div><div className="h-7 w-32 rounded-xl bg-gray-200 animate-pulse mb-2" /><div className="h-4 w-52 rounded-lg bg-gray-100 animate-pulse" /></div>
          <div className="h-10 w-36 rounded-2xl bg-gray-200 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">{[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse"><div className="h-8 w-10 rounded bg-gray-200 mb-2" /><div className="h-3 w-24 rounded bg-gray-100" /></div>)}</div>
        <div className="flex flex-col gap-2">{[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl shadow-sm p-4 animate-pulse h-24" />)}</div>
      </div>
    );
  }

  return (
    <>
      {newModalOpen && <QuotationForm title="New Quotation" initial={EMPTY_FORM} submitting={formSubmitting} onClose={() => setNewModalOpen(false)} onSubmit={handleCreate} />}
      {editTarget && <QuotationForm title="Edit Quotation" subtitle={displayId(editTarget.id)} initial={formFrom(editTarget)} submitting={formSubmitting} onClose={() => setEditTarget(null)} onSubmit={handleEdit} />}
      {detailTarget && <DetailModal q={quotations.find(q => q.id === detailTarget.id) ?? detailTarget} onClose={() => setDetailTarget(null)} onStatusChange={handleStatusChange} />}
      {deleteTarget && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl p-6 w-[320px] shadow-2xl">
            <p className="text-base font-bold text-black text-center mb-2">Delete Quotation?</p>
            <p className="text-sm text-center mb-5" style={{ color: "var(--fg-muted)" }}>{displayId(deleteTarget.id)} for <span className="font-semibold text-black">{deleteTarget.customerName}</span> will be permanently deleted.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer hover:opacity-80" style={{ background: "var(--bg-subtle)", color: "var(--fg)" }}>Cancel</button>
              <button onClick={() => handleDelete(deleteTarget.id)} className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer hover:opacity-90" style={{ background: "#DC2626", color: "#fff" }}>Delete</button>
            </div>
          </div>
        </>
      )}

      <div className="p-4 lg:p-8">
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
          <div className="bg-white rounded-2xl p-4 shadow-sm"><p className="text-2xl font-bold text-black">{counts.all}</p><p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>Total Quotations</p></div>
          <div className="bg-white rounded-2xl p-4 shadow-sm"><p className="text-2xl font-bold" style={{ color: "#16A34A" }}>{counts.accepted}</p><p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>Accepted</p></div>
          <div className="bg-white rounded-2xl p-4 shadow-sm"><p className="text-2xl font-bold" style={{ color: "#D97706" }}>{counts.pending}</p><p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>Pending</p></div>
          <div className="bg-white rounded-2xl p-4 shadow-sm"><p className="text-base font-bold" style={{ color: "var(--primary)" }}>{fmt(totalValue)}</p><p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>Accepted Value</p></div>
        </div>

        {/* Filter + Search */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          <div className="flex border-b overflow-x-auto" style={{ borderColor: "#F4F4F5" }}>
            {FILTER_TABS.map(t => (
              <button key={t.value} onClick={() => { setFilter(t.value); setPage(1); }}
                className="flex-1 min-w-fit py-3 px-2 text-sm font-medium cursor-pointer relative whitespace-nowrap"
                style={{ color: filter === t.value ? "var(--primary)" : "var(--fg-muted)" }}>
                {t.label}
                <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full" style={{ background: filter === t.value ? "var(--primary-light)" : "var(--bg-subtle)", color: filter === t.value ? "var(--primary)" : "var(--fg-muted)" }}>{counts[t.value]}</span>
                {filter === t.value && <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full" style={{ background: "var(--primary)" }} />}
              </button>
            ))}
          </div>
          <div className="px-4 py-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--fg-subtle)" }}><SearchIcon /></span>
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search customer, event, quotation ID..."
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
              <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>{quotations.length === 0 ? "Create your first quotation" : "Try changing the filter or search"}</p>
            </div>
          )}
          {paginated.map(q => {
            const cfg       = STATUS_CONFIG[q.status];
            const total     = calcTotal(q);
            const isPending = offlinePendingIds.has(q.id);
            return (
              <div key={q.id} className="bg-white rounded-2xl shadow-sm p-4" style={isPending ? { border: "2px solid #D97706" } : undefined}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: "var(--primary)" }}>
                      {q.customerName[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-black truncate">{q.customerName}</p>
                      <p className="text-xs truncate" style={{ color: "var(--fg-muted)" }}>{q.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isPending && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#FFFBEB", color: "#D97706" }}>Pending sync</span>}
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>{q.event}</span>
                  {(q.services?.length ?? 0) > 0 && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--bg-subtle)", color: "var(--fg-muted)" }}>
                      {q.services.length} service{q.services.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mb-3">
                  <CalSmIcon />
                  <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{formatDate(q.date)}</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Total</span>
                  <span className="text-sm font-bold text-black">{fmt(total)}</span>
                </div>
                <div className="flex items-center justify-between pt-2.5 border-t" style={{ borderColor: "#F4F4F5" }}>
                  <span className="text-[10px] font-mono font-medium" style={{ color: "var(--fg-subtle)" }}>{displayId(q.id)}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setDetailTarget(q)} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:bg-blue-50" style={{ color: "#2563EB" }}><EyeIcon /></button>
                    <button onClick={() => setEditTarget(q)} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:bg-amber-50" style={{ color: "#D97706" }}><EditIcon /></button>
                    <button onClick={() => setDeleteTarget(q)} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:bg-red-50" style={{ color: "#DC2626" }}><TrashIcon /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm px-4 py-3 mt-4">
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-30 hover:bg-gray-100" style={{ color: "var(--fg-muted)" }}><ChevLeftIcon /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)} className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold cursor-pointer"
                  style={{ background: safePage === n ? "var(--primary)" : "transparent", color: safePage === n ? "#fff" : "var(--fg-muted)" }}>{n}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-30 hover:bg-gray-100" style={{ color: "var(--fg-muted)" }}><ChevRightIcon /></button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function PlusIcon()      { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function XIcon()         { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function TrashIcon()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>; }
function PDFIcon()       { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>; }
function EyeIcon()       { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>; }
function EditIcon()      { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function SearchIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; }
function CalSmIcon()     { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fg-subtle)" }}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function EmptyIcon()     { return <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fg-subtle)" }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>; }
function ChevLeftIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>; }
function ChevRightIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>; }
