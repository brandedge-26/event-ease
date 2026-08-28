"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { addPending, getAllPending } from "@/lib/offlineDB";
import type { PendingBooking } from "@/lib/offlineDB";
import { saveToCache, loadFromCache, CACHE_KEYS } from "@/lib/bookingCache";
import { NewBookingModal, EditBookingModal, EMPTY_FORM } from "../_components/NewBookingModal";
import type { BookingStatus, ServiceEntry, EditableBooking } from "../_components/NewBookingModal";

// ─── Types ────────────────────────────────────────────────────────────────────
type PaymentMethod = "Cash" | "Bank Transfer" | "Cheque" | "Online";

type BookingService = { label: string; unit: string; price: number };

type Booking = {
  id: string;
  customerName: string;
  phone: string;
  event: string;
  date: string;
  timeFrom: string;
  timeTo: string;
  amount: number;
  paid: number;
  status: BookingStatus;
  notes: string;
  payments: PaymentRecord[];
  services: BookingService[];
};

type PaymentRecord = {
  id: string;
  amount: number;
  method: PaymentMethod;
  note: string;
  date: string;
};

type DbPayment = {
  id: string; bookingId: string; vendorId: string;
  amount: number; method: string; note: string | null;
  date: string | null; createdAt: string;
};

type DbBooking = {
  id: string; customerName: string; phone: string; event: string;
  hall: string; date: string; timeFrom: string | null; timeTo: string | null;
  guests: number; amount: number; hallAmount: number; paid: number;
  status: BookingStatus | "blocked"; notes: string | null;
  payments: DbPayment[];
  services?: { label: string; unit: string; price: number }[];
};

function dbToLocal(b: DbBooking): Booking {
  return {
    id:           b.id,
    customerName: b.customerName,
    phone:        b.phone ?? "",
    event:        b.event,
    date:         b.date,
    timeFrom:     b.timeFrom ?? "",
    timeTo:       b.timeTo   ?? "",
    amount:       b.amount   ?? 0,
    paid:         b.paid     ?? 0,
    status:       b.status   ?? "pending",
    notes:        b.notes    ?? "",
    payments:     (b.payments ?? []).map(p => ({
      id:     p.id,
      amount: p.amount,
      date:   p.date ?? new Date().toISOString().slice(0, 10),
      note:   p.note ?? "",
      method: (p.method ?? "Cash") as PaymentMethod,
    })),
    services: (b.services ?? []).map(s => ({ label: s.label, unit: s.unit ?? "", price: s.price })),
  };
}

function pendingToBooking(p: PendingBooking): Booking {
  const pl = p.payload;
  return {
    id:           p.id,
    customerName: String(pl.customerName ?? ""),
    phone:        String(pl.phone ?? ""),
    event:        String(pl.event ?? ""),
    date:         String(pl.date ?? ""),
    timeFrom:     String(pl.timeFrom ?? ""),
    timeTo:       String(pl.timeTo ?? ""),
    amount:       Number(pl.amount) || 0,
    paid:         Number(pl.paid) || 0,
    status:       (pl.status ?? "pending") as BookingStatus,
    notes:        String(pl.notes ?? ""),
    payments:     [],
    services:     ((pl.services ?? []) as { label: string; unit: string; price: string }[])
                    .map(s => ({ label: s.label, unit: s.unit || "", price: Number(s.price) || 0 })),
  };
}

// ─── Config ───────────────────────────────────────────────────────────────────
const PAGE_SIZE = 6;

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  confirmed: { label: "Confirmed", color: "#16A34A", bg: "#F0FDF4" },
  pending:   { label: "Pending",   color: "#D97706", bg: "#FFFBEB" },
  cancelled: { label: "Cancelled", color: "#DC2626", bg: "#FEF2F2" },
  blocked:   { label: "Blocked",   color: "#6B7280", bg: "#F3F4F6" },
};

const FILTER_TABS: { label: string; value: "all" | BookingStatus }[] = [
  { label: "All",       value: "all" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Pending",   value: "pending" },
  { label: "Cancelled", value: "cancelled" },
];

const METHOD_CONFIG: Record<PaymentMethod, { color: string; bg: string }> = {
  "Cash":          { color: "#16A34A", bg: "#F0FDF4" },
  "Bank Transfer": { color: "#2563EB", bg: "#EFF6FF" },
  "Cheque":        { color: "#7C3AED", bg: "#F5F3FF" },
  "Online":        { color: "var(--primary)", bg: "var(--primary-light)" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) { return "Rs. " + n.toLocaleString("en-PK"); }
function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function fmt12h(t: string): string {
  if (!t) return "—";
  if (/[AP]M/i.test(t)) return t;
  const [h, m] = t.split(":").map(Number);
  if (isNaN(h)) return "—";
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}
function toTimeInput(t: string): string {
  if (!t) return "";
  if (/[AP]M/i.test(t)) {
    const [timePart, ampm] = t.split(" ");
    const [hStr, mStr] = timePart.split(":");
    let h = parseInt(hStr);
    if (ampm.toUpperCase() === "PM" && h !== 12) h += 12;
    if (ampm.toUpperCase() === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${mStr || "00"}`;
  }
  return t;
}

// ─── Record Payment Modal ─────────────────────────────────────────────────────
function RecordPaymentModal({ booking, onClose, onSuccess }: {
  booking: Booking;
  onClose: () => void;
  onSuccess: (tx: PaymentRecord, newPaid: number) => void;
}) {
  const { accessToken } = useAuthStore();
  const balance = booking.amount - booking.paid;
  const [amount, setAmount] = useState(String(balance > 0 ? balance : ""));
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [note,   setNote]   = useState("");
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");
  const today = new Date().toISOString().slice(0, 10);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    setSaving(true); setErr("");
    try {
      const res = await api.post<{ id: string; newPaid: number }>(
        `/api/vendor/bookings/${booking.id}/payments`,
        { amount: amt, method, note: note || undefined, date: today },
        accessToken ?? undefined,
      );
      if (!res.success) { setErr((res as { message?: string }).message ?? "Failed"); return; }
      onSuccess({ id: res.id, amount: amt, method, note: note ?? "", date: today }, res.newPaid);
      onClose();
    } catch { setErr("Network error"); }
    finally { setSaving(false); }
  }

  return (
    <>
      <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed z-60 bottom-0 left-0 right-0 rounded-t-3xl bg-white flex flex-col lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:right-auto lg:w-[420px] lg:rounded-3xl overflow-hidden" style={{ maxHeight: "90dvh", boxShadow: "0 -4px 40px rgba(0,0,0,0.12)" }}>
        <div className="flex justify-center pt-3 pb-1 lg:hidden shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "#E5E7EB" }} />
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "#F4F4F5" }}>
          <div>
            <p className="text-sm font-bold text-black">Record Payment</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{booking.customerName} · {booking.event}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer hover:bg-gray-100" style={{ color: "var(--fg-muted)" }}><XIcon /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
          {booking.amount > 0 && (
            <div className="flex items-center justify-between p-4 rounded-2xl" style={{ background: "#FFFBEB", border: "1px solid #FCD34D" }}>
              <div>
                <p className="text-xs font-medium" style={{ color: "#D97706" }}>Balance Due</p>
                <p className="text-lg font-bold text-black mt-0.5">{fmt(balance)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium" style={{ color: "var(--fg-muted)" }}>Total</p>
                <p className="text-sm font-semibold text-black mt-0.5">{fmt(booking.amount)}</p>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Amount *</label>
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl border" style={{ background: "var(--bg-subtle)", borderColor: "#D1D5DB" }}>
              <span className="text-sm font-semibold" style={{ color: "var(--fg-muted)" }}>Rs.</span>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="flex-1 bg-transparent outline-none text-sm font-semibold text-black" placeholder="0" min={1} required />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Payment Method *</label>
            <div className="grid grid-cols-2 gap-2">
              {(["Cash", "Bank Transfer", "Cheque", "Online"] as PaymentMethod[]).map(m => (
                <button key={m} type="button" onClick={() => setMethod(m)}
                  className="py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all"
                  style={{ background: method === m ? METHOD_CONFIG[m].bg : "var(--bg-subtle)", color: method === m ? METHOD_CONFIG[m].color : "var(--fg-muted)", border: `1.5px solid ${method === m ? METHOD_CONFIG[m].color : "transparent"}` }}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Note (optional)</label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. 2nd installment" className="px-4 py-3 rounded-xl border text-sm outline-none" style={{ background: "var(--bg-subtle)", borderColor: "#D1D5DB", color: "var(--fg)" }} />
          </div>
          {err && <p className="text-xs text-red-600 font-medium">{err}</p>}
          <button type="submit" disabled={saving} className="w-full py-3.5 rounded-2xl text-sm font-bold cursor-pointer transition-opacity hover:opacity-90 mt-1 disabled:opacity-60" style={{ background: "var(--primary)", color: "#ffffff" }}>
            {saving ? "Recording…" : "Record Payment"}
          </button>
        </form>
      </div>
    </>
  );
}


// ─── PDF Generator ────────────────────────────────────────────────────────────
function generateBookingPDF(b: Booking, vendorName: string) {
  const balance      = b.amount - b.paid;
  const paidPct      = b.amount > 0 ? Math.min(100, Math.round((b.paid / b.amount) * 100)) : 0;
  const fmtAmt       = (n: number) => "Rs. " + n.toLocaleString("en-PK");
  const servicesTotal = (b.services ?? []).reduce((s, sv) => s + (Number(sv.price) || 0), 0);

  const servicesHTML = (b.services?.length ?? 0) > 0
    ? `<table class="table"><thead><tr><th>Service</th><th>Description</th><th class="right">Price</th></tr></thead><tbody>
        ${b.services.map(s => `<tr><td>${s.label}</td><td style="color:#888">${s.unit || "—"}</td><td class="right">${s.price ? fmtAmt(Number(s.price)) : "—"}</td></tr>`).join("")}
        <tr class="total-row"><td colspan="2"><strong>Services Total</strong></td><td class="right"><strong>${fmtAmt(servicesTotal)}</strong></td></tr>
      </tbody></table>`
    : `<p class="no-services">No additional services</p>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>Booking ${b.id}</title>
  <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;color:#111;background:#fff;padding:40px;max-width:700px;margin:0 auto}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid #f0f0f0}
  .brand-name{font-size:22px;font-weight:800;color:#e91e63}.brand-sub{font-size:11px;color:#888;margin-top:2px}
  .doc-id{font-size:18px;font-weight:700}.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;margin-top:4px;background:${b.status==="confirmed"?"#F0FDF4":"#FFFBEB"};color:${b.status==="confirmed"?"#16A34A":"#D97706"}}
  .section{margin-bottom:24px}.section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#999;margin-bottom:10px}
  .customer-card{display:flex;align-items:center;gap:14px;background:#f9f9f9;border-radius:12px;padding:14px 16px;margin-bottom:24px}
  .avatar{width:44px;height:44px;border-radius:50%;background:#e91e63;color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700}
  .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f4f4f4}.row:last-child{border-bottom:none}
  .row .label{font-size:12px;color:#888}.row .value{font-size:13px;font-weight:600}
  .table{width:100%;border-collapse:collapse}.table th{text-align:left;font-size:11px;font-weight:600;color:#888;text-transform:uppercase;padding:6px 0;border-bottom:1px solid #eee}
  .table td{padding:9px 0;font-size:13px;border-bottom:1px solid #f4f4f4}.right{text-align:right}.total-row td{padding-top:10px;border-bottom:none}
  .no-services{font-size:13px;color:#aaa;font-style:italic}.payment-box{background:#f9f9f9;border-radius:12px;padding:16px}
  .pay-row{display:flex;justify-content:space-between;padding:6px 0;font-size:13px}.pay-row.total{border-top:1px solid #eee;margin-top:4px;padding-top:10px;font-size:14px;font-weight:700}
  .balance-val{color:${balance>0?"#D97706":"#16A34A"};font-weight:700}
  .progress-bar{height:6px;border-radius:3px;background:#e5e7eb;margin:10px 0 4px}.progress-fill{height:6px;border-radius:3px;background:${paidPct===100?"#16A34A":"#e91e63"};width:${paidPct}%}
  .table{width:100%;border-collapse:collapse}.table th{text-align:left;font-size:11px;font-weight:600;color:#888;text-transform:uppercase;padding:6px 0;border-bottom:1px solid #eee}
  .table td{padding:9px 0;font-size:13px;border-bottom:1px solid #f4f4f4}.right{text-align:right}.total-row td{padding-top:10px;border-bottom:none}
  .no-services{font-size:13px;color:#aaa;font-style:italic}
  .notes-box{background:#f9f9f9;border-radius:10px;padding:12px 14px;font-size:13px;color:#555;line-height:1.6}
  .footer{margin-top:36px;padding-top:16px;border-top:1px solid #f0f0f0;display:flex;justify-content:space-between;font-size:11px;color:#bbb}
  @media print{body{padding:20px}}</style></head><body>
  <div class="header"><div><div class="brand-name">${vendorName}</div><div class="brand-sub">Event Ease · Booking Invoice</div></div>
  <div style="text-align:right"><span class="badge">${b.status.charAt(0).toUpperCase()+b.status.slice(1)}</span><div style="font-size:11px;color:#bbb;margin-top:4px">${new Date(b.date+"T00:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</div></div></div>
  <div class="customer-card"><div class="avatar">${b.customerName[0].toUpperCase()}</div><div><div style="font-size:15px;font-weight:700">${b.customerName}</div><div style="font-size:12px;color:#888">${b.phone||"—"}</div></div></div>
  <div class="section"><div class="section-title">Event Details</div>
  <div class="row"><span class="label">Event</span><span class="value">${b.event}</span></div>
  <div class="row"><span class="label">Date</span><span class="value">${formatDate(b.date)}</span></div>
  <div class="row"><span class="label">Time</span><span class="value">${b.timeFrom ? fmt12h(b.timeFrom) + (b.timeTo ? " – " + fmt12h(b.timeTo) : "") : "—"}</span></div></div>
  <div class="section"><div class="section-title">Services</div>${servicesHTML}</div>
  <div class="section"><div class="section-title">Payment Summary</div><div class="payment-box">
  <div class="pay-row"><span>Total Amount</span><span><strong>${fmtAmt(b.amount)}</strong></span></div>
  <div class="progress-bar"><div class="progress-fill"></div></div>
  <div style="font-size:11px;color:#888;text-align:right">${paidPct}% paid</div>
  <div class="pay-row"><span>Total Paid</span><span style="color:#16A34A;font-weight:600">${fmtAmt(b.paid)}</span></div>
  <div class="pay-row total"><span>Balance Due</span><span class="balance-val">${fmtAmt(balance)}</span></div></div></div>
  ${b.notes?`<div class="section"><div class="section-title">Notes</div><div class="notes-box">${b.notes}</div></div>`:""}
  <div class="footer"><span>Generated by Event Ease</span><span>${new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</span></div>
  <script>window.onload=()=>{window.print()}</script></body></html>`);
  win.document.close();
}

// ─── Booking Detail Drawer ────────────────────────────────────────────────────
function BookingDetail({ booking, vendorName, onClose, onEdit, onCancel, onDelete, onRecordPayment }: {
  booking: Booking;
  vendorName: string;
  onClose: () => void;
  onEdit: (b: Booking) => void;
  onCancel: (b: Booking) => void;
  onDelete: (b: Booking) => void;
  onRecordPayment: (b: Booking) => void;
}) {
  const cfg = STATUS_CONFIG[booking.status];
  const balance = booking.amount - booking.paid;
  const paidPct = booking.amount > 0 ? Math.min(100, Math.round((booking.paid / booking.amount) * 100)) : 0;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "#F4F4F5" }}>
        <div>
          <p className="text-sm font-bold text-black">{booking.customerName}</p>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => generateBookingPDF(booking, vendorName)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer hover:opacity-80"
            style={{ background: "var(--primary-light)", color: "var(--primary)", border: "1px solid var(--primary-muted)" }}>
            <PdfIcon /> PDF
          </button>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer hover:bg-gray-100" style={{ color: "var(--fg-muted)" }}><XIcon /></button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-5 flex flex-col gap-5">
        <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: "var(--bg-subtle)" }}>
          <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white shrink-0" style={{ background: "var(--primary)" }}>
            {booking.customerName[0]}
          </div>
          <div>
            <p className="text-sm font-semibold text-black">{booking.customerName}</p>
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{booking.phone || "—"}</p>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Event Details</p>
          <div className="flex flex-col gap-0">
            {[
              { label: "Event", value: booking.event },
              { label: "Date",  value: formatDate(booking.date) },
              { label: "Time",  value: booking.timeFrom ? `${fmt12h(booking.timeFrom)}${booking.timeTo ? " – " + fmt12h(booking.timeTo) : ""}` : "—" },
            ].map((row, i, arr) => (
              <div key={row.label} className={`flex items-center justify-between py-2.5 ${i !== arr.length - 1 ? "border-b" : ""}`} style={{ borderColor: "#F4F4F5" }}>
                <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{row.label}</span>
                <span className="text-sm font-semibold text-black">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {booking.amount > 0 && (
          <div className="rounded-2xl p-4" style={{ background: "var(--bg-subtle)" }}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Payment</p>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Progress</span>
              <span className="text-xs font-semibold" style={{ color: paidPct === 100 ? "#16A34A" : "var(--primary)" }}>{paidPct}%</span>
            </div>
            <div className="w-full h-2 rounded-full mb-3" style={{ background: "#E5E7EB" }}>
              <div className="h-2 rounded-full" style={{ width: `${paidPct}%`, background: paidPct === 100 ? "#16A34A" : "var(--primary)" }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Paid</span>
              <span className="text-sm font-semibold" style={{ color: "#16A34A" }}>{fmt(booking.paid)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t mt-2" style={{ borderColor: "#E5E7EB" }}>
              <span className="text-xs font-bold" style={{ color: "var(--fg-muted)" }}>Balance</span>
              <span className="text-sm font-bold" style={{ color: balance > 0 ? "#D97706" : "#16A34A" }}>{fmt(balance)}</span>
            </div>
          </div>
        )}

        {booking.payments.length > 0 && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Payment History</p>
            <div className="flex flex-col gap-2">
              {booking.payments.map(tx => (
                <div key={tx.id} className="flex items-center justify-between px-3 py-3 rounded-xl" style={{ background: "var(--bg-subtle)" }}>
                  <div>
                    <p className="text-sm font-semibold text-black">{fmt(tx.amount)}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{formatDate(tx.date)}{tx.note ? ` · ${tx.note}` : ""}</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: METHOD_CONFIG[tx.method]?.bg ?? "#F4F4F5", color: METHOD_CONFIG[tx.method]?.color ?? "var(--fg)" }}>
                    {tx.method}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {booking.notes && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--fg-subtle)" }}>Notes</p>
            <p className="text-sm rounded-xl p-3" style={{ color: "var(--fg-muted)", background: "var(--bg-subtle)" }}>{booking.notes}</p>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-1">
          {booking.status !== "cancelled" && booking.amount > 0 && booking.paid < booking.amount && (
            <button onClick={() => onRecordPayment(booking)} className="w-full py-3 rounded-2xl text-sm font-bold cursor-pointer transition-opacity hover:opacity-90" style={{ background: "var(--primary)", color: "#fff" }}>
              + Record Payment
            </button>
          )}
          <div className="flex gap-2">
            {booking.status !== "cancelled" && (
              <button onClick={() => onEdit(booking)} className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer hover:opacity-80" style={{ background: "var(--bg-subtle)", color: "var(--fg)" }}>
                Edit
              </button>
            )}
            {booking.status !== "cancelled" && (
              <button onClick={() => onCancel(booking)} className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer hover:opacity-80" style={{ background: "#FEF2F2", color: "#DC2626" }}>
                Cancel
              </button>
            )}
            <button onClick={() => onDelete(booking)} className="py-3 px-4 rounded-2xl text-sm font-semibold cursor-pointer hover:bg-red-50 transition-colors" style={{ color: "#DC2626", background: "transparent", border: "1px solid #FECACA" }}>
              <TrashIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GeneralBookingsPage() {
  const { accessToken, vendor } = useAuthStore();
  const [bookings,          setBookings]          = useState<Booking[]>([]);
  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState<string | null>(null);
  const [fromCache,         setFromCache]         = useState(false);
  const [offlinePendingIds, setOfflinePendingIds] = useState<Set<string>>(new Set());
  const [filter,        setFilter]        = useState<"all" | BookingStatus>("all");
  const [search,        setSearch]        = useState("");
  const [page,          setPage]          = useState(1);
  const [addOpen,       setAddOpen]       = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [editTarget,    setEditTarget]    = useState<EditableBooking | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [detailId,      setDetailId]      = useState<string | null>(null);
  const [payTarget,     setPayTarget]     = useState<Booking | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<Booking | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Booking | null>(null);
  const [actionSaving,  setActionSaving]  = useState(false);

  const loadBookings = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);

    // Only POST pending items become new booking cards; DELETE/PATCH mutate existing records
    function newPendingCards(pending: PendingBooking[]) {
      return pending.filter(p => !p.method || p.method === "POST").map(pendingToBooking);
    }

    // Apply queued PATCH/DELETE mutations to base bookings; return mutated list + affected IDs
    function applyMutations(base: Booking[], pending: PendingBooking[]): { list: Booking[]; mutatedIds: Set<string> } {
      const mutatedIds = new Set<string>();
      let list = [...base];
      for (const p of pending) {
        if (!p.method || p.method === "POST") continue;
        const match = p.endpoint.match(/\/bookings\/([^/]+)/);
        if (!match) continue;
        const bid = match[1];
        if (p.method === "DELETE") {
          list = list.filter(b => b.id !== bid);
        } else if (p.method === "PATCH") {
          list = list.map(b => {
            if (b.id !== bid) return b;
            mutatedIds.add(bid);
            const pl = p.payload;
            return {
              ...b,
              ...(pl.status        !== undefined ? { status:       pl.status as BookingStatus }        : {}),
              ...(pl.customerName  !== undefined ? { customerName: String(pl.customerName) }            : {}),
              ...(pl.phone         !== undefined ? { phone:        String(pl.phone) }                  : {}),
              ...(pl.event         !== undefined ? { event:        String(pl.event) }                  : {}),
              ...(pl.date          !== undefined ? { date:         String(pl.date) }                   : {}),
              ...(pl.timeFrom      !== undefined ? { timeFrom:     String(pl.timeFrom) }               : {}),
              ...(pl.timeTo        !== undefined ? { timeTo:       String(pl.timeTo) }                 : {}),
              ...(pl.amount        !== undefined ? { amount:       Number(pl.amount) }                 : {}),
              ...(pl.paid          !== undefined ? { paid:         Number(pl.paid) }                   : {}),
              ...(pl.notes         !== undefined ? { notes:        String(pl.notes) }                  : {}),
            };
          });
        }
      }
      return { list, mutatedIds };
    }

    function mergeWithPending(base: Booking[], pending: PendingBooking[]) {
      const { list, mutatedIds } = applyMutations(base, pending);
      const postIds = new Set(pending.filter(p => !p.method || p.method === "POST").map(p => p.id));
      const pendingIds = new Set([...postIds, ...mutatedIds]);
      return { bookings: [...newPendingCards(pending), ...list], pendingIds };
    }

    // Offline (session-restored OR mid-session): skip API, load from cache
    if (accessToken === "offline-session" || !navigator.onLine) {
      const cached = loadFromCache<Booking>(CACHE_KEYS.GENERAL_BOOKINGS);
      const pending = await getAllPending().catch(() => [] as PendingBooking[]);
      if (cached) {
        const { bookings, pendingIds } = mergeWithPending(cached, pending);
        setBookings(bookings);
        setOfflinePendingIds(pendingIds);
        setFromCache(true);
      } else {
        setError("Offline — no cached data available.");
      }
      setLoading(false);
      return;
    }

    try {
      const res = await api.get<{ bookings: DbBooking[] }>("/api/vendor/bookings", accessToken);
      if (res.success) {
        const mapped = (res.bookings ?? []).map(dbToLocal);
        const pending = await getAllPending().catch(() => [] as PendingBooking[]);
        const { bookings, pendingIds } = mergeWithPending(mapped, pending);
        setBookings(bookings);
        setOfflinePendingIds(pendingIds);
        setFromCache(false);
        saveToCache(CACHE_KEYS.GENERAL_BOOKINGS, mapped);
      } else {
        setError("Failed to load bookings");
      }
    } catch {
      const cached = loadFromCache<Booking>(CACHE_KEYS.GENERAL_BOOKINGS);
      const pending = await getAllPending().catch(() => [] as PendingBooking[]);
      if (cached) {
        const { bookings, pendingIds } = mergeWithPending(cached, pending);
        setBookings(bookings);
        setOfflinePendingIds(pendingIds);
        setFromCache(true);
      } else {
        setError("Offline — no cached data available.");
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  // Reload when layout's useOfflineSync completes a sync
  useEffect(() => {
    window.addEventListener("offline-synced", loadBookings);
    return () => window.removeEventListener("offline-synced", loadBookings);
  }, [loadBookings]);

  const selected = detailId ? bookings.find(b => b.id === detailId) ?? null : null;

  const filtered = bookings.filter(b => {
    if (b.status === "blocked") return false;
    const matchFilter = filter === "all" || b.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || b.customerName.toLowerCase().includes(q) || b.event.toLowerCase().includes(q) || b.phone.includes(q);
    return matchFilter && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const counts: Record<string, number> = {
    all:       bookings.filter(b => b.status !== "blocked").length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    pending:   bookings.filter(b => b.status === "pending").length,
    cancelled: bookings.filter(b => b.status === "cancelled").length,
  };

  async function handleAdd(form: typeof EMPTY_FORM, status: BookingStatus, services: ServiceEntry[]) {
    setAddSubmitting(true);
    try {
      const tfFrom  = toTimeInput(form.timeFrom);
      const tfTo    = toTimeInput(form.timeTo);
      const payload = {
        customerName: form.customerName, phone: form.phone, event: form.event,
        hall: "", date: form.date,
        ...(tfFrom ? { timeFrom: tfFrom } : {}),
        ...(tfTo   ? { timeTo:   tfTo   } : {}),
        guests: 0,
        hallAmount: Number(form.amount) || 0,
        amount: Number(form.amount) || 0,
        paid: Number(form.paid) || 0, status,
        notes: form.notes || undefined,
        services: services.map(s => ({ label: s.name, unit: s.description || "", price: String(s.price || 0) })),
      };

      // Helper: save to IndexedDB queue and show optimistically
      async function queueOffline() {
        const tempId = await addPending({
          endpoint:    "/api/vendor/bookings",
          accessToken: accessToken!,
          payload,
          createdAt:   Date.now(),
        });
        const optimistic: Booking = {
          id: tempId, customerName: form.customerName, phone: form.phone,
          event: form.event, date: form.date,
          timeFrom: tfFrom, timeTo: tfTo,
          amount: Number(form.amount) || 0,
          paid: Number(form.paid) || 0,
          status, notes: form.notes || "", payments: [],
          services: services.map(s => ({ label: s.name, unit: s.description || "", price: Number(s.price) || 0 })),
        };
        setBookings(prev => [optimistic, ...prev]);
        setOfflinePendingIds(prev => new Set([...prev, tempId]));
        setAddOpen(false);
        setPage(1);
      }

      // If offline (either session-restored-offline or lost connection mid-session), skip API entirely
      if (accessToken === "offline-session" || !navigator.onLine) {
        await queueOffline();
        return;
      }

      // Online path — try API; if network fails, fall back to offline queue
      let res: { success: boolean; booking?: DbBooking; id?: string; message?: string } | null = null;
      try {
        res = await api.post<{ booking?: DbBooking; id?: string }>(
          "/api/vendor/bookings", payload, accessToken ?? undefined,
        );
      } catch {
        await queueOffline();
        return;
      }

      if (!res.success) { setError(res.message ?? "Failed to create booking."); return; }
      if (res.booking) { setBookings(prev => [dbToLocal(res.booking!), ...prev]); }
      else { const r2 = await api.get<{ bookings: DbBooking[] }>("/api/vendor/bookings", accessToken ?? undefined); if (r2.success) setBookings((r2.bookings ?? []).map(dbToLocal)); }
      setAddOpen(false);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally { setAddSubmitting(false); }
  }

  async function handleEdit(form: typeof EMPTY_FORM, status: BookingStatus, services: ServiceEntry[]) {
    if (!editTarget) return;
    setEditSubmitting(true);
    try {
      const tfFrom = toTimeInput(form.timeFrom);
      const tfTo   = toTimeInput(form.timeTo);
      const payload = {
        customerName: form.customerName, phone: form.phone, event: form.event,
        date: form.date,
        ...(tfFrom ? { timeFrom: tfFrom } : {}),
        ...(tfTo   ? { timeTo:   tfTo   } : {}),
        guests: 0,
        hallAmount: Number(form.amount) || 0,
        amount: Number(form.amount) || 0,
        paid: Number(form.paid) || 0,
        status,
        notes: form.notes || undefined,
        services: services.map(s => ({ label: s.name, unit: s.description || "", price: String(s.price || 0) })),
      };
      const optimistic: Booking = {
        ...editTarget,
        customerName: form.customerName, phone: form.phone, event: form.event,
        date: form.date, timeFrom: tfFrom, timeTo: tfTo,
        amount: Number(form.amount) || 0, paid: Number(form.paid) || 0, status,
        notes: form.notes || "",
        payments: bookings.find(b => b.id === editTarget.id)?.payments ?? [],
        services: services.map(s => ({ label: s.name, unit: s.description || "", price: Number(s.price) || 0 })),
      };
      if (accessToken === "offline-session" || !navigator.onLine) {
        setBookings(prev => prev.map(b => b.id === editTarget.id ? optimistic : b));
        await addPending({ method: "PATCH", endpoint: `/api/vendor/bookings/${editTarget.id}`, accessToken: accessToken!, payload, createdAt: Date.now() });
        setOfflinePendingIds(prev => new Set([...prev, editTarget.id]));
        setEditTarget(null); setDetailId(null);
        return;
      }
      const res = await api.patch<{ booking?: DbBooking }>(`/api/vendor/bookings/${editTarget.id}`, payload, accessToken ?? undefined);
      if (!res.success) throw new Error((res as { message?: string }).message ?? "Failed to save");
      setBookings(prev => prev.map(b => b.id === editTarget.id ? (res.booking ? dbToLocal(res.booking) : optimistic) : b));
      setEditTarget(null); setDetailId(null);
    } finally { setEditSubmitting(false); }
  }

  async function handleCancel() {
    if (!cancelConfirm) return;
    setActionSaving(true);
    try {
      setBookings(prev => prev.map(b => b.id === cancelConfirm.id ? { ...b, status: "cancelled" } : b));
      if (accessToken === "offline-session" || !navigator.onLine) {
        await addPending({ method: "PATCH", endpoint: `/api/vendor/bookings/${cancelConfirm.id}`, accessToken: accessToken!, payload: { status: "cancelled" }, createdAt: Date.now() });
        setOfflinePendingIds(prev => new Set([...prev, cancelConfirm.id]));
        setCancelConfirm(null); setDetailId(null);
        return;
      }
      const res = await api.patch(`/api/vendor/bookings/${cancelConfirm.id}`, { status: "cancelled" }, accessToken ?? undefined);
      if (res.success) { setCancelConfirm(null); setDetailId(null); }
    } finally { setActionSaving(false); }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    setActionSaving(true);
    try {
      setBookings(prev => prev.filter(b => b.id !== deleteConfirm.id));
      if (accessToken === "offline-session" || !navigator.onLine) {
        await addPending({ method: "DELETE", endpoint: `/api/vendor/bookings/${deleteConfirm.id}`, accessToken: accessToken!, payload: {}, createdAt: Date.now() });
        setDeleteConfirm(null); setDetailId(null);
        return;
      }
      const res = await api.delete(`/api/vendor/bookings/${deleteConfirm.id}`, accessToken ?? undefined);
      if (res.success) { setDeleteConfirm(null); setDetailId(null); }
    } finally { setActionSaving(false); }
  }

  function handlePaymentSuccess(tx: PaymentRecord, newPaid: number) {
    if (!payTarget) return;
    setBookings(prev => prev.map(b => b.id === payTarget.id ? { ...b, paid: newPaid, payments: [...b.payments, tx] } : b));
  }

  return (
    <>
      {/* New Booking Stepper */}
      <NewBookingModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
        submitting={addSubmitting}
      />

      {/* Edit Modal */}
      {editTarget && (
        <EditBookingModal
          booking={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleEdit}
          submitting={editSubmitting}
        />
      )}

      {/* Payment Modal */}
      {payTarget && (
        <RecordPaymentModal booking={payTarget} onClose={() => setPayTarget(null)} onSuccess={handlePaymentSuccess} />
      )}

      {/* Cancel Confirm */}
      {cancelConfirm && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setCancelConfirm(null)} />
          <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl p-6 w-[320px] shadow-2xl">
            <p className="text-base font-bold text-black text-center mb-2">Cancel Booking?</p>
            <p className="text-sm text-center mb-5" style={{ color: "var(--fg-muted)" }}>{cancelConfirm.customerName} — {cancelConfirm.event}</p>
            <div className="flex gap-2">
              <button onClick={() => setCancelConfirm(null)} className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer" style={{ background: "var(--bg-subtle)", color: "var(--fg)" }}>Back</button>
              <button onClick={handleCancel} disabled={actionSaving} className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer disabled:opacity-60" style={{ background: "#DC2626", color: "#fff" }}>
                {actionSaving ? "Cancelling…" : "Cancel Booking"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl p-6 w-[320px] shadow-2xl">
            <p className="text-base font-bold text-black text-center mb-2">Delete Booking?</p>
            <p className="text-sm text-center mb-5" style={{ color: "var(--fg-muted)" }}>This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer" style={{ background: "var(--bg-subtle)", color: "var(--fg)" }}>Back</button>
              <button onClick={handleDelete} disabled={actionSaving} className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer disabled:opacity-60" style={{ background: "#DC2626", color: "#fff" }}>
                {actionSaving ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Detail Drawer */}
      {selected && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setDetailId(null)} />
          <div className="fixed z-50 bottom-0 left-0 right-0 rounded-t-3xl bg-white flex flex-col overflow-hidden lg:hidden" style={{ maxHeight: "92dvh", boxShadow: "0 -4px 40px rgba(0,0,0,0.12)" }}>
            <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="w-10 h-1 rounded-full" style={{ background: "#E5E7EB" }} /></div>
            <BookingDetail booking={selected} vendorName={vendor?.name ?? ""} onClose={() => setDetailId(null)} onEdit={b => { setDetailId(null); setEditTarget({ ...b, services: b.services.map(s => ({ name: s.label, price: String(s.price), description: s.unit || undefined })) }); }} onCancel={b => { setDetailId(null); setCancelConfirm(b); }} onDelete={b => { setDetailId(null); setDeleteConfirm(b); }} onRecordPayment={b => { setDetailId(null); setPayTarget(b); }} />
          </div>
          <div className="hidden lg:flex fixed z-50 right-0 top-0 bottom-0 w-[480px] bg-white flex-col overflow-hidden rounded-l-3xl" style={{ boxShadow: "-4px 0 40px rgba(0,0,0,0.12)" }}>
            <BookingDetail booking={selected} vendorName={vendor?.name ?? ""} onClose={() => setDetailId(null)} onEdit={b => { setDetailId(null); setEditTarget({ ...b, services: b.services.map(s => ({ name: s.label, price: String(s.price), description: s.unit || undefined })) }); }} onCancel={b => { setDetailId(null); setCancelConfirm(b); }} onDelete={b => { setDetailId(null); setDeleteConfirm(b); }} onRecordPayment={b => { setDetailId(null); setPayTarget(b); }} />
          </div>
        </>
      )}



      <div className="p-4 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl lg:text-2xl font-semibold text-black tracking-tight">Bookings</h1>
            <p className="text-sm mt-1" style={{ color: "var(--fg-muted)" }}>Manage all your bookings</p>
          </div>
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90" style={{ background: "var(--primary)", color: "#ffffff" }}>
            <PlusIcon /> New Booking
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-2xl text-sm font-medium flex items-center justify-between" style={{ background: "#FEF2F2", color: "#DC2626" }}>
            {error}
            <button onClick={() => setError(null)} className="ml-2 cursor-pointer"><XIcon /></button>
          </div>
        )}

        {/* Filter + Search */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          <div className="flex border-b overflow-x-auto" style={{ borderColor: "#F4F4F5" }}>
            {FILTER_TABS.map(t => (
              <button key={t.value} onClick={() => { setFilter(t.value); setPage(1); }}
                className="flex-1 min-w-fit py-3 px-2 text-sm font-medium transition-colors cursor-pointer relative whitespace-nowrap"
                style={{ color: filter === t.value ? "var(--primary)" : "var(--fg-muted)" }}>
                {t.label}
                <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full" style={{ background: filter === t.value ? "var(--primary-light)" : "var(--bg-subtle)", color: filter === t.value ? "var(--primary)" : "var(--fg-muted)" }}>
                  {counts[t.value]}
                </span>
                {filter === t.value && <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full" style={{ background: "var(--primary)" }} />}
              </button>
            ))}
          </div>
          <div className="px-4 py-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--fg-subtle)" }}><SearchIcon /></span>
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search customer or event…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none border"
                style={{ background: "var(--bg-subtle)", borderColor: "#E5E7EB", color: "var(--fg)" }} />
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full" style={{ background: "#E5E7EB" }} />
                  <div className="flex-1">
                    <div className="h-3.5 w-32 rounded mb-1" style={{ background: "#E5E7EB" }} />
                    <div className="h-3 w-20 rounded" style={{ background: "#E5E7EB" }} />
                  </div>
                </div>
                <div className="h-3 w-24 rounded" style={{ background: "#E5E7EB" }} />
              </div>
            ))
          ) : paginated.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm py-16 flex flex-col items-center">
              <EmptyIcon />
              <p className="text-sm font-medium mt-3 text-black">No bookings found</p>
              <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>Try changing the filter or search</p>
            </div>
          ) : paginated.map(b => {
            const cfg       = STATUS_CONFIG[b.status];
            const balance   = b.amount - b.paid;
            const paidPct   = b.amount > 0 ? Math.min(100, Math.round((b.paid / b.amount) * 100)) : 0;
            const isPending = offlinePendingIds.has(b.id);
            return (
              <div key={b.id}
                className="bg-white rounded-2xl shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
                style={{ border: `1.5px solid ${isPending ? "#FCD34D" : "transparent"}` }}
                onClick={() => !isPending && setDetailId(b.id)}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: "var(--primary)" }}>
                      {b.customerName[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-black truncate">{b.customerName}</p>
                      <p className="text-xs truncate" style={{ color: "var(--fg-muted)" }}>{b.phone || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isPending && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "#FFFBEB", color: "#D97706" }}>Queued</span>
                    )}
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>{b.event}</span>
                </div>

                <div className="flex items-center gap-1.5 mb-2">
                  <CalSmIcon />
                  <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{formatDate(b.date)}{b.timeFrom ? ` · ${fmt12h(b.timeFrom)}` : ""}</span>
                </div>

                {b.amount > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px]" style={{ color: "var(--fg-subtle)" }}>Paid {paidPct}%</span>
                      <span className="text-[10px]" style={{ color: "var(--fg-subtle)" }}>{fmt(b.paid)} / {fmt(b.amount)}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full" style={{ background: "#E5E7EB" }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${paidPct}%`, background: paidPct === 100 ? "#16A34A" : "var(--primary)" }} />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "#F4F4F5" }}>
                  <span className="text-xs font-semibold" style={{ color: balance > 0 ? "#D97706" : "#16A34A" }}>
                    {b.amount > 0 ? (balance > 0 ? `Due: ${fmt(balance)}` : "Fully Paid") : "—"}
                  </span>
                  <span style={{ color: "var(--fg-subtle)" }}><ChevRightIcon /></span>
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

// ─── Icons ────────────────────────────────────────────────────────────────────
function PlusIcon()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>; }
function PdfIcon()      { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>; }
function XIcon()        { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>; }
function TrashIcon()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>; }
function SearchIcon()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>; }
function CalSmIcon()    { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--fg-subtle)" }}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>; }
function EmptyIcon()    { return <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: "var(--fg-subtle)" }}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>; }
function ChevLeftIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>; }
function ChevRightIcon(){ return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>; }
