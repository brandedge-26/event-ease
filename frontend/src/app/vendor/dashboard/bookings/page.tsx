"use client";

import { useState, useEffect } from "react";
import { NewBookingModal, DatePicker, EMPTY_FORM } from "../_components/NewBookingModal";
import type { BookingStatus, ServiceEntry } from "../_components/NewBookingModal";
import type { Booking, PaymentRecord, PaymentMethod } from "@/store/useStore";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

// ─── DB response types ────────────────────────────────────────────────────────
type DbPayment = {
  id: string; bookingId: string; vendorId: string;
  amount: number; method: string; note: string | null;
  date: string | null; createdAt: string;
};
type DbBooking = {
  id: string; vendorId: string; customerId: string | null;
  customerName: string; phone: string; event: string; hall: string;
  date: string; timeFrom: string | null; timeTo: string | null;
  guests: number; amount: number; hallAmount: number; paid: number;
  status: BookingStatus | "blocked"; notes: string | null;
  services: { label: string; unit?: string; price?: string }[] | null;
  payments: DbPayment[]; createdAt: string; updatedAt: string;
};

function dbToLocal(b: DbBooking): Booking {
  return {
    id:           b.id,
    customerName: b.customerName,
    phone:        b.phone ?? "",
    event:        b.event,
    hall:         b.hall,
    date:         b.date,
    timeFrom:     b.timeFrom  ?? "",
    timeTo:       b.timeTo    ?? "",
    guests:       b.guests    ?? 0,
    amount:       b.amount    ?? 0,
    hallAmount:   b.hallAmount ?? 0,
    paid:         b.paid      ?? 0,
    status:       b.status    ?? "pending",
    notes:        b.notes     ?? "",
    services:     (b.services ?? []).map(s => ({ label: s.label, unit: s.unit ?? "", price: s.price ?? "" })),
    payments:     (b.payments ?? []).map(p => ({
      id:     p.id,
      amount: p.amount,
      date:   p.date ?? new Date().toISOString().slice(0, 10),
      note:   p.note ?? "",
      method: (p.method ?? "Cash") as PaymentMethod,
    })),
  };
}

type Status = BookingStatus;

const PAGE_SIZE = 6;

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string }> = {
  confirmed: { label: "Confirmed", color: "#16A34A", bg: "#F0FDF4" },
  pending:   { label: "Pending",   color: "#D97706", bg: "#FFFBEB" },
  cancelled: { label: "Cancelled", color: "#DC2626", bg: "#FEF2F2" },
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

const FILTER_TABS: { label: string; value: "all" | Status }[] = [
  { label: "All",       value: "all" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Pending",   value: "pending" },
  { label: "Cancelled", value: "cancelled" },
];

const HALLS_FALLBACK = ["Hall A", "Hall B", "Hall C"];
const EVENT_TYPES    = ["Wedding", "Engagement", "Birthday Party", "Corporate Event", "Conference", "Anniversary", "Other"];

const METHOD_CONFIG: Record<PaymentMethod, { color: string; bg: string }> = {
  "Cash":          { color: "#16A34A", bg: "#F0FDF4" },
  "Bank Transfer": { color: "#2563EB", bg: "#EFF6FF" },
  "Cheque":        { color: "#7C3AED", bg: "#F5F3FF" },
  "Online":        { color: "var(--primary)", bg: "var(--primary-light)" },
};

/** Convert any time string ("18:00" or "06:00 PM") → "HH:MM" for <input type="time"> */
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
/** Convert "HH:MM" → "06:00 PM" */
function fromTimeInput(t: string): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return t;
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
}

// ─── Edit Booking Modal ───────────────────────────────────────────────────────
function EditBookingModal({ booking, onClose, onSave, halls = HALLS_FALLBACK, bookedDates }: {
  booking: Booking;
  onClose: () => void;
  onSave: (b: Booking) => void;
  halls?: string[];
  bookedDates?: Set<string>;
}) {
  const [form, setForm] = useState({
    customerName: booking.customerName,
    phone:        booking.phone,
    event:        booking.event,
    hall:         booking.hall,
    date:         booking.date,
    timeFrom:     toTimeInput(booking.timeFrom),
    timeTo:       toTimeInput(booking.timeTo),
    guests:       String(booking.guests),
    hallAmount:   String(booking.hallAmount ?? (booking.amount - (booking.services ?? []).reduce((s, sv) => s + (Number(sv.price) || 0), 0))),
    paid:         String(booking.paid),
    notes:        booking.notes,
    status:       booking.status as "confirmed" | "pending" | "cancelled",
  });
  const [services, setServices] = useState<{ label: string; unit: string; price: string }[]>(booking.services ?? []);
  const [errors, setErrors]     = useState<Record<string, string>>({});

  const inp    = "w-full px-4 py-3 rounded-xl text-sm outline-none border transition-all";
  const inpSt  = { background: "var(--bg-subtle)", borderColor: "#D1D5DB", color: "var(--fg)" };
  const inpErr = { background: "#FFF5F5", borderColor: "#FCA5A5", color: "var(--fg)" };

  function set(name: string, value: string) {
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: "" }));
  }
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    set(e.target.name, e.target.value);
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.customerName.trim()) errs.customerName = "Name is required";
    if (form.phone && !/^[0-9\-+\s]{7,15}$/.test(form.phone)) errs.phone = "Invalid phone number";
    if (!form.event)  errs.event  = "Event type is required";
    if (!form.date)   errs.date   = "Date is required";
    if (!form.guests || Number(form.guests) < 1) errs.guests = "Guests required";
    if (form.hallAmount && Number(form.hallAmount) < 0) errs.hallAmount = "Cannot be negative";
    if (form.paid && Number(form.paid) < 0) errs.paid = "Cannot be negative";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const svcTotal   = services.reduce((s, sv) => s + (Number(sv.price) || 0), 0);
    const hallAmt    = Number(form.hallAmount) || 0;
    const grandTotal = hallAmt + svcTotal;
    onSave({
      ...booking,
      customerName: form.customerName.trim(),
      phone:        form.phone.trim(),
      event:        form.event,
      hall:         form.hall,
      date:         form.date,
      timeFrom:     fromTimeInput(form.timeFrom),
      timeTo:       fromTimeInput(form.timeTo),
      guests:       Number(form.guests) || 0,
      amount:       grandTotal,
      hallAmount:   hallAmt,
      paid:         Number(form.paid) || 0,
      notes:        form.notes,
      status:       form.status,
      services,
    });
  }

  function addService() { setServices(prev => [...prev, { label: "", unit: "", price: "" }]); }
  function updateService(i: number, field: string, value: string) {
    setServices(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  }
  function removeService(i: number) { setServices(prev => prev.filter((_, idx) => idx !== i)); }

  const svcTotal   = services.reduce((s, sv) => s + (Number(sv.price) || 0), 0);
  const hallAmt    = Number(form.hallAmount) || 0;
  const grandTotal = hallAmt + svcTotal;
  const balanceDue = Math.max(0, grandTotal - (Number(form.paid) || 0));

  const formContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "#F4F4F5" }}>
        <div>
          <p className="text-sm font-bold text-black">Edit Booking</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{booking.customerName} · {booking.event}</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer hover:bg-gray-100" style={{ color: "var(--fg-muted)" }}><XIcon /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--fg-subtle)" }}>Customer</p>
        <div className="flex flex-col gap-3">
          <div>
            <input name="customerName" placeholder="Customer name *" value={form.customerName} onChange={handleChange}
              className={inp} style={errors.customerName ? inpErr : inpSt} />
            {errors.customerName && <p className="text-xs font-medium mt-0.5" style={{ color: "#DC2626" }}>{errors.customerName}</p>}
          </div>
          <input name="phone" placeholder="Phone number" value={form.phone} onChange={handleChange} className={inp} style={inpSt} />
        </div>

        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--fg-subtle)" }}>Event Details</p>
        <div className="flex flex-col gap-3">
          <div>
            <select name="event" value={form.event} onChange={handleChange}
              className={inp} style={errors.event ? inpErr : { ...inpSt, color: form.event ? "var(--fg)" : "var(--fg-muted)" }}>
              <option value="" disabled>Select event type *</option>
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {errors.event && <p className="text-xs font-medium mt-0.5" style={{ color: "#DC2626" }}>{errors.event}</p>}
          </div>
          <select name="hall" value={form.hall} onChange={handleChange} className={inp} style={inpSt}>
            {halls.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--fg-muted)" }}>Event Date *</label>
            <DatePicker value={form.date} onChange={v => { set("date", v); }} hasError={!!errors.date} bookedDates={bookedDates} />
            {errors.date && <p className="text-xs font-medium mt-0.5" style={{ color: "#DC2626" }}>{errors.date}</p>}
          </div>
          <div>
            <input name="guests" type="number" placeholder="Number of guests *" value={form.guests} onChange={handleChange}
              min={1} className={inp} style={errors.guests ? inpErr : inpSt} />
            {errors.guests && <p className="text-xs font-medium mt-0.5" style={{ color: "#DC2626" }}>{errors.guests}</p>}
          </div>
        </div>

        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--fg-subtle)" }}>Timing</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--fg-muted)" }}>From</label>
            <input name="timeFrom" type="time" value={form.timeFrom} onChange={handleChange} className={inp} style={inpSt} />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--fg-muted)" }}>To</label>
            <input name="timeTo" type="time" value={form.timeTo} onChange={handleChange} className={inp} style={inpSt} />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--fg-subtle)" }}>Services</p>
          <button type="button" onClick={addService}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg cursor-pointer"
            style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
            <PlusIcon /> Add
          </button>
        </div>
        {services.length === 0 && (
          <p className="text-xs py-3 text-center rounded-xl" style={{ background: "var(--bg-subtle)", color: "var(--fg-muted)" }}>No services — click Add to include one</p>
        )}
        {services.map((s, i) => (
          <div key={i} className="rounded-2xl p-3 flex flex-col gap-2" style={{ background: "var(--bg-subtle)", border: "1px solid #E5E7EB" }}>
            <div className="flex items-center gap-2">
              <input placeholder="Service name" value={s.label} onChange={e => updateService(i, "label", e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none border" style={{ background: "#fff", borderColor: "#D1D5DB", color: "var(--fg)" }} />
              <button type="button" onClick={() => removeService(i)}
                className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer hover:bg-red-50 shrink-0"
                style={{ color: "#DC2626" }}><XSmIcon /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Unit / Qty" value={s.unit} onChange={e => updateService(i, "unit", e.target.value)}
                className="px-3 py-2 rounded-xl text-sm outline-none border" style={{ background: "#fff", borderColor: "#D1D5DB", color: "var(--fg)" }} />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none" style={{ color: "var(--fg-muted)" }}>Rs.</span>
                <input type="number" placeholder="Price" value={s.price} onChange={e => updateService(i, "price", e.target.value)}
                  min={0} className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none border" style={{ background: "#fff", borderColor: "#D1D5DB", color: "var(--fg)" }} />
              </div>
            </div>
          </div>
        ))}

        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--fg-subtle)" }}>Payment</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--fg-muted)" }}>Hall Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: "var(--fg-muted)" }}>Rs.</span>
              <input name="hallAmount" type="number" placeholder="0" value={form.hallAmount} onChange={handleChange}
                min={0} className={`${inp} pl-11`} style={errors.hallAmount ? inpErr : inpSt} />
            </div>
            {errors.hallAmount && <p className="text-xs font-medium mt-0.5" style={{ color: "#DC2626" }}>{errors.hallAmount}</p>}
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--fg-muted)" }}>Advance Paid</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: "var(--fg-muted)" }}>Rs.</span>
              <input name="paid" type="number" placeholder="0" value={form.paid} onChange={handleChange}
                min={0} className={`${inp} pl-11`} style={errors.paid ? inpErr : inpSt} />
            </div>
            {errors.paid && <p className="text-xs font-medium mt-0.5" style={{ color: "#DC2626" }}>{errors.paid}</p>}
          </div>
        </div>

        <button type="button" onClick={() => set("paid", String(grandTotal))}
          className="w-full py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80"
          style={{ background: "#F0FDF4", color: "#16A34A", border: "1.5px solid #BBF7D0" }}>
          Mark as Fully Paid — Rs. {grandTotal.toLocaleString("en-PK")}
        </button>

        <div className="rounded-xl" style={{ border: "1px solid #E5E7EB" }}>
          <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "var(--bg-subtle)", borderRadius: "12px 12px 0 0" }}>
            <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Hall Amount</span>
            <span className="text-xs font-semibold text-black">Rs. {hallAmt.toLocaleString("en-PK")}</span>
          </div>
          {svcTotal > 0 && (
            <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: "1px solid #F4F4F5", background: "var(--bg-subtle)" }}>
              <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Services ({services.filter(s => Number(s.price) > 0).length})</span>
              <span className="text-xs font-semibold text-black">+ Rs. {svcTotal.toLocaleString("en-PK")}</span>
            </div>
          )}
          <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: "1px solid #E5E7EB", background: "#fff" }}>
            <span className="text-xs font-bold text-black">Grand Total</span>
            <span className="text-sm font-bold" style={{ color: "var(--primary)" }}>Rs. {grandTotal.toLocaleString("en-PK")}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: "1px solid #F4F4F5", background: "var(--bg-subtle)", borderRadius: "0 0 12px 12px" }}>
            <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Balance Due</span>
            <span className="text-sm font-bold" style={{ color: balanceDue > 0 ? "#D97706" : "#16A34A" }}>Rs. {balanceDue.toLocaleString("en-PK")}</span>
          </div>
        </div>

        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--fg-subtle)" }}>Status</p>
        <div className="grid grid-cols-3 gap-2">
          {(["pending", "confirmed", "cancelled"] as const).map(s => (
            <button key={s} type="button" onClick={() => set("status", s)}
              className="py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all capitalize"
              style={{
                background: form.status === s ? STATUS_CONFIG[s].bg : "var(--bg-subtle)",
                color:      form.status === s ? STATUS_CONFIG[s].color : "var(--fg-muted)",
                border:     `1.5px solid ${form.status === s ? STATUS_CONFIG[s].color : "transparent"}`,
              }}>
              {STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>

        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--fg-subtle)" }}>Notes</p>
        <textarea name="notes" placeholder="Any special instructions..." value={form.notes} onChange={handleChange}
          rows={4} className="w-full px-4 py-3 rounded-xl text-sm outline-none border resize-none leading-relaxed"
          style={{ ...inpSt, minHeight: "100px" }} />
      </div>

      <div className="shrink-0 px-5 py-4 border-t flex gap-3" style={{ borderColor: "#F4F4F5" }}>
        <button type="button" onClick={onClose}
          className="px-5 py-3 rounded-2xl text-sm font-semibold cursor-pointer hover:opacity-80"
          style={{ background: "var(--bg-subtle)", color: "var(--fg-muted)" }}>
          Cancel
        </button>
        <button type="button" onClick={handleSave}
          className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity"
          style={{ background: "var(--primary)", color: "#ffffff" }}>
          Save Changes
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed z-50 bottom-0 left-0 right-0 rounded-t-3xl bg-white flex flex-col overflow-hidden lg:hidden" style={{ maxHeight: "92dvh", boxShadow: "0 -4px 40px rgba(0,0,0,0.12)" }}>
        <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="w-10 h-1 rounded-full" style={{ background: "#E5E7EB" }} /></div>
        {formContent}
      </div>
      <div className="hidden lg:flex fixed z-50 right-0 top-0 bottom-0 w-[560px] bg-white flex-col overflow-hidden rounded-l-3xl" style={{ boxShadow: "-4px 0 40px rgba(0,0,0,0.12)" }}>
        {formContent}
      </div>
    </>
  );
}

function fmt(n: number) { return "Rs. " + n.toLocaleString("en-PK"); }
function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function formatTime(t: string) {
  if (!t) return "—";
  if (/[AP]M/i.test(t)) return t.toUpperCase();
  const [h, m] = t.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return "—";
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

function generateBookingPDF(b: Booking) {
  const balance  = b.amount - b.paid;
  const paidPct  = b.amount > 0 ? Math.min(100, Math.round((b.paid / b.amount) * 100)) : 0;
  const fmtAmt   = (n: number) => "Rs. " + n.toLocaleString("en-PK");
  const servicesTotal = (b.services ?? []).reduce((s, sv) => s + (Number(sv.price) || 0), 0);

  const servicesHTML = (b.services?.length ?? 0) > 0
    ? `<table class="table"><thead><tr><th>Service</th><th>Qty / Unit</th><th class="right">Price</th></tr></thead><tbody>
        ${b.services.map(s => `<tr><td>${s.label}</td><td>${s.unit || "—"}</td><td class="right">${s.price ? fmtAmt(Number(s.price)) : "—"}</td></tr>`).join("")}
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
  .notes-box{background:#f9f9f9;border-radius:10px;padding:12px 14px;font-size:13px;color:#555;line-height:1.6}
  .footer{margin-top:36px;padding-top:16px;border-top:1px solid #f0f0f0;display:flex;justify-content:space-between;font-size:11px;color:#bbb}
  @media print{body{padding:20px}}</style></head><body>
  <div class="header"><div><div class="brand-name">Royal Banquet Hall</div><div class="brand-sub">Event Ease</div></div>
  <div style="text-align:right"><span class="badge">${b.status.charAt(0).toUpperCase()+b.status.slice(1)}</span><div style="font-size:11px;color:#bbb;margin-top:4px">${new Date(b.date+"T00:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</div></div></div>
  <div class="customer-card"><div class="avatar">${b.customerName[0].toUpperCase()}</div><div><div style="font-size:15px;font-weight:700">${b.customerName}</div><div style="font-size:12px;color:#888">${b.phone||"—"}</div></div></div>
  <div class="section"><div class="section-title">Event Details</div>
  <div class="row"><span class="label">Event</span><span class="value">${b.event}</span></div>
  <div class="row"><span class="label">Hall</span><span class="value">${b.hall}</span></div>
  <div class="row"><span class="label">Date</span><span class="value">${formatDate(b.date)}</span></div>
  <div class="row"><span class="label">Time</span><span class="value">${formatTime(b.timeFrom)} – ${formatTime(b.timeTo)}</span></div>
  <div class="row"><span class="label">Guests</span><span class="value">${b.guests} guests</span></div></div>
  <div class="section"><div class="section-title">Services</div>${servicesHTML}</div>
  <div class="section"><div class="section-title">Payment Summary</div><div class="payment-box">
  <div class="pay-row"><span>Total Amount</span><span><strong>${fmtAmt(b.amount)}</strong></span></div>
  <div class="progress-bar"><div class="progress-fill"></div></div>
  <div style="font-size:11px;color:#888;text-align:right">${paidPct}% paid</div>
  <div class="pay-row"><span>Total Paid</span><span style="color:#16A34A;font-weight:600">${fmtAmt(b.paid)}</span></div>
  <div class="pay-row total"><span>Balance Due</span><span class="balance-val">${fmtAmt(balance)}</span></div></div></div>
  ${b.notes?`<div class="section"><div class="section-title">Notes</div><div class="notes-box">${b.notes}</div></div>`:""}
  <div class="footer"><span>Generated by Event Ease · Royal Banquet Hall</span><span>${new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</span></div>
  <script>window.onload=()=>{window.print()}</script></body></html>`);
  win.document.close();
}

// ─── Booking Detail ───────────────────────────────────────────────────────────
function BookingDetail({ b, onClose, onCancel, onEdit, onAddPayment, onEditPayment, onDeletePayment, onDeleteBooking }: {
  b: Booking;
  onClose: () => void;
  onCancel: (id: string) => void;
  onEdit: () => void;
  onAddPayment:    (bookingId: string, amount: number, note: string, method: PaymentMethod) => void;
  onEditPayment:   (bookingId: string, paymentId: string, amount: number, note: string, method: PaymentMethod) => void;
  onDeletePayment: (bookingId: string, paymentId: string) => void;
  onDeleteBooking: (id: string) => void;
}) {
  const [showPayForm, setShowPayForm] = useState(false);
  const [payAmt, setPayAmt]           = useState("");
  const [payNote, setPayNote]         = useState("");
  const [payMethod, setPayMethod]     = useState<PaymentMethod>("Cash");

  // Edit-payment state (tracks which payment is being edited)
  const [editPayId,     setEditPayId]     = useState<string | null>(null);
  const [editPayAmt,    setEditPayAmt]    = useState("");
  const [editPayNote,   setEditPayNote]   = useState("");
  const [editPayMethod, setEditPayMethod] = useState<PaymentMethod>("Cash");
  const [deleteConfirm,        setDeleteConfirm]        = useState<string | null>(null); // paymentId awaiting confirm
  const [deleteBookingConfirm, setDeleteBookingConfirm] = useState(false);

  function openEditPay(p: PaymentRecord) {
    setEditPayId(p.id);
    setEditPayAmt(String(p.amount));
    setEditPayNote(p.note ?? "");
    setEditPayMethod(p.method ?? "Cash");
    setDeleteConfirm(null);
  }
  function cancelEditPay() { setEditPayId(null); }
  function saveEditPay() {
    const amt = Number(editPayAmt);
    if (!amt || amt <= 0 || !editPayId) return;
    onEditPayment(b.id, editPayId, amt, editPayNote, editPayMethod);
    setEditPayId(null);
  }

  const servicesTotal = (b.services ?? []).reduce((s, sv) => s + (Number(sv.price) || 0), 0);
  const hallAmount    = b.hallAmount ?? (b.amount - servicesTotal);
  const balance       = b.amount - b.paid;
  const paidPct       = b.amount > 0 ? Math.min(100, Math.round((b.paid / b.amount) * 100)) : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "#F4F4F5" }}>
        <div>
          <p className="text-sm font-bold text-black">Booking Details</p>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: STATUS_CONFIG[b.status].bg, color: STATUS_CONFIG[b.status].color }}>
            {STATUS_CONFIG[b.status].label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => generateBookingPDF(b)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer hover:opacity-80"
            style={{ background: "var(--primary-light)", color: "var(--primary)", border: "1px solid var(--primary-muted)" }}>
            <PdfIcon /> PDF
          </button>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer hover:bg-gray-100" style={{ color: "var(--fg-muted)" }}>
            <XIcon />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
        {/* Customer */}
        <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: "var(--bg-subtle)" }}>
          <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white shrink-0" style={{ background: HALL_COLOR[b.hall] || "var(--primary)" }}>
            {b.customerName[0]}
          </div>
          <div>
            <p className="text-sm font-semibold text-black">{b.customerName}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{b.phone || "—"}</p>
          </div>
        </div>

        {/* Event Details */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Event Details</p>
          <div className="flex flex-col gap-0">
            {[
              { label: "Event Type", value: b.event },
              { label: "Hall",       value: b.hall, badge: true },
              { label: "Date",       value: formatDate(b.date) },
              { label: "Time",       value: `${formatTime(b.timeFrom)} – ${formatTime(b.timeTo)}` },
              { label: "Guests",     value: `${b.guests} guests` },
            ].map((row, i) => (
              <div key={row.label} className={`flex items-center justify-between py-2.5 ${i !== 4 ? "border-b" : ""}`} style={{ borderColor: "#F4F4F5" }}>
                <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{row.label}</span>
                {row.badge
                  ? <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: HALL_BG[b.hall] || "var(--primary-light)", color: HALL_COLOR[b.hall] || "var(--primary)" }}>{row.value}</span>
                  : <span className="text-sm font-semibold text-black">{row.value}</span>
                }
              </div>
            ))}
          </div>
        </div>

        {/* Services */}
        {(b.services?.length ?? 0) > 0 && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Services</p>
            <div className="flex flex-col gap-2">
              {(b.services ?? []).map((s, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: "var(--bg-subtle)", border: "1px solid #E5E7EB" }}>
                  <div>
                    <p className="text-sm font-semibold text-black">{s.label}</p>
                    {s.unit && <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>Qty: {s.unit}</p>}
                  </div>
                  {s.price && <span className="text-sm font-semibold" style={{ color: "var(--primary)" }}>Rs. {Number(s.price).toLocaleString("en-PK")}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Payment</p>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Paid {paidPct}%</span>
            {paidPct === 100 && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#F0FDF4", color: "#16A34A" }}>Fully Paid</span>}
          </div>
          <div className="w-full h-2 rounded-full mb-4" style={{ background: "#E5E7EB" }}>
            <div className="h-2 rounded-full" style={{ width: `${paidPct}%`, background: paidPct === 100 ? "#16A34A" : "var(--primary)" }} />
          </div>

          {/* Breakdown */}
          <div className="rounded-2xl" style={{ border: "1px solid #E5E7EB" }}>
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Hall Amount</span>
              <span className="text-xs font-semibold text-black">{fmt(hallAmount)}</span>
            </div>
            {(b.services ?? []).filter(s => Number(s.price) > 0).map((s, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: "1px solid #F4F4F5" }}>
                <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{s.label}</span>
                <span className="text-xs font-semibold text-black">+ {fmt(Number(s.price))}</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid #E5E7EB", background: "var(--bg-subtle)", borderRadius: "0 0 16px 16px" }}>
              <span className="text-xs font-bold text-black">Grand Total</span>
              <span className="text-sm font-bold" style={{ color: "var(--primary)" }}>{fmt(b.amount)}</span>
            </div>
          </div>

          {/* Paid / Due */}
          <div className="mt-3 rounded-2xl" style={{ border: "1px solid #E5E7EB" }}>
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Total Paid</span>
              <span className="text-xs font-semibold" style={{ color: "#16A34A" }}>{fmt(b.paid)}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid #F4F4F5" }}>
              <span className="text-xs font-semibold text-black">Balance Due</span>
              <span className="text-sm font-bold" style={{ color: balance > 0 ? "#D97706" : "#16A34A" }}>{fmt(balance)}</span>
            </div>
          </div>

          {/* Payment History */}
          {(b.payments ?? []).length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--fg-subtle)" }}>Payment History</p>
              <div className="flex flex-col gap-1.5">
                {(b.payments ?? []).map(p => (
                  <div key={p.id}>
                    {/* Normal row */}
                    {editPayId !== p.id && deleteConfirm !== p.id && (
                      <div className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: "var(--bg-subtle)", border: "1px solid #E5E7EB" }}>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-black truncate">{p.note || "—"}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: "var(--fg-muted)" }}>{formatDate(p.date)}{p.method ? ` · ${p.method}` : ""}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="text-xs font-semibold" style={{ color: "#16A34A" }}>+ {fmt(p.amount)}</span>
                          {b.status !== "cancelled" && (
                            <>
                              <button type="button" onClick={() => openEditPay(p)}
                                className="w-6 h-6 flex items-center justify-center rounded-lg cursor-pointer hover:bg-gray-200"
                                style={{ color: "var(--fg-muted)" }}>
                                <EditSmIcon />
                              </button>
                              <button type="button" onClick={() => { setDeleteConfirm(p.id); setEditPayId(null); }}
                                className="w-6 h-6 flex items-center justify-center rounded-lg cursor-pointer hover:bg-red-50"
                                style={{ color: "#DC2626" }}>
                                <TrashSmIcon />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Delete confirmation */}
                    {deleteConfirm === p.id && (
                      <div className="rounded-xl px-3 py-3 flex flex-col gap-2" style={{ background: "#FEF2F2", border: "1px solid #FCA5A5" }}>
                        <p className="text-xs font-semibold" style={{ color: "#DC2626" }}>Delete this payment of {fmt(p.amount)}?</p>
                        <div className="flex gap-2">
                          <button onClick={() => setDeleteConfirm(null)}
                            className="flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                            style={{ background: "#fff", color: "var(--fg-muted)", border: "1px solid #E5E7EB" }}>
                            Keep
                          </button>
                          <button onClick={() => { onDeletePayment(b.id, p.id); setDeleteConfirm(null); }}
                            className="flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                            style={{ background: "#DC2626", color: "#fff" }}>
                            Delete
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Inline edit form */}
                    {editPayId === p.id && (
                      <div className="rounded-xl p-3 flex flex-col gap-2" style={{ background: "var(--bg-subtle)", border: "1.5px solid var(--primary)" }}>
                        <p className="text-xs font-bold text-black">Edit Payment</p>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none" style={{ color: "var(--fg-muted)" }}>Rs.</span>
                          <input type="number" placeholder="Amount *" value={editPayAmt} onChange={e => setEditPayAmt(e.target.value)}
                            min={1} className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none border"
                            style={{ background: "#fff", borderColor: "#D1D5DB", color: "var(--fg)" }} autoFocus />
                        </div>
                        <input type="text" placeholder="Note" value={editPayNote} onChange={e => setEditPayNote(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl text-sm outline-none border"
                          style={{ background: "#fff", borderColor: "#D1D5DB", color: "var(--fg)" }} />
                        <div className="grid grid-cols-2 gap-2">
                          {(["Cash", "Bank Transfer", "Cheque", "Online"] as PaymentMethod[]).map(m => (
                            <button key={m} type="button" onClick={() => setEditPayMethod(m)}
                              className="py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                              style={{
                                background: editPayMethod === m ? METHOD_CONFIG[m].bg : "#fff",
                                color: editPayMethod === m ? METHOD_CONFIG[m].color : "var(--fg-muted)",
                                border: `1.5px solid ${editPayMethod === m ? METHOD_CONFIG[m].color : "#E5E7EB"}`,
                              }}>
                              {m}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={cancelEditPay}
                            className="flex-1 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                            style={{ background: "#fff", color: "var(--fg-muted)", border: "1px solid #E5E7EB" }}>
                            Cancel
                          </button>
                          <button onClick={saveEditPay}
                            className="flex-1 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                            style={{ background: "var(--primary)", color: "#fff" }}>
                            Save
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Payment */}
          {b.status !== "cancelled" && (
            <div className="mt-3">
              {!showPayForm ? (
                <button onClick={() => setShowPayForm(true)}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold cursor-pointer hover:opacity-80"
                  style={{ background: "var(--primary-light)", color: "var(--primary)", border: "1.5px solid var(--primary-muted)" }}>
                  + Add Payment
                </button>
              ) : (
                <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: "var(--bg-subtle)", border: "1.5px solid #E5E7EB" }}>
                  <p className="text-xs font-bold text-black">Record Payment</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none" style={{ color: "var(--fg-muted)" }}>Rs.</span>
                    <input type="number" placeholder="Amount *" value={payAmt} onChange={e => setPayAmt(e.target.value)}
                      min={1} className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none border"
                      style={{ background: "#fff", borderColor: "#D1D5DB", color: "var(--fg)" }} autoFocus />
                  </div>
                  <input type="text" placeholder="Note (e.g. Second installment)" value={payNote} onChange={e => setPayNote(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none border"
                    style={{ background: "#fff", borderColor: "#D1D5DB", color: "var(--fg)" }} />
                  {/* Method */}
                  <div className="grid grid-cols-2 gap-2">
                    {(["Cash", "Bank Transfer", "Cheque", "Online"] as PaymentMethod[]).map(m => (
                      <button key={m} type="button" onClick={() => setPayMethod(m)}
                        className="py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                        style={{
                          background: payMethod === m ? METHOD_CONFIG[m].bg : "#fff",
                          color: payMethod === m ? METHOD_CONFIG[m].color : "var(--fg-muted)",
                          border: `1.5px solid ${payMethod === m ? METHOD_CONFIG[m].color : "#E5E7EB"}`,
                        }}>
                        {m}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setShowPayForm(false); setPayAmt(""); setPayNote(""); setPayMethod("Cash"); }}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                      style={{ background: "#fff", color: "var(--fg-muted)", border: "1px solid #E5E7EB" }}>
                      Cancel
                    </button>
                    <button onClick={() => {
                        const amt = Number(payAmt);
                        if (!amt || amt <= 0) return;
                        onAddPayment(b.id, amt, payNote, payMethod);
                        setShowPayForm(false); setPayAmt(""); setPayNote(""); setPayMethod("Cash");
                      }}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                      style={{ background: "var(--primary)", color: "#fff" }}>
                      Record Payment
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        {b.notes && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--fg-subtle)" }}>Notes</p>
            <p className="text-sm rounded-xl p-3 leading-relaxed" style={{ background: "var(--bg-subtle)", color: "var(--fg-muted)" }}>{b.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-1">
          {b.status !== "cancelled" && (
            <>
              <button onClick={onEdit} className="w-full py-3 rounded-2xl text-sm font-semibold cursor-pointer hover:opacity-80" style={{ background: "var(--bg-subtle)", color: "var(--fg)" }}>
                Edit Booking
              </button>
              <button onClick={() => { onCancel(b.id); onClose(); }} className="w-full py-3 rounded-2xl text-sm font-semibold cursor-pointer hover:opacity-80" style={{ background: "#FEF2F2", color: "#DC2626" }}>
                Cancel Booking
              </button>
            </>
          )}

          {/* Delete booking */}
          {!deleteBookingConfirm ? (
            <button onClick={() => setDeleteBookingConfirm(true)}
              className="w-full py-3 rounded-2xl text-sm font-semibold cursor-pointer hover:opacity-80 flex items-center justify-center gap-2"
              style={{ background: "var(--bg-subtle)", color: "#6B7280" }}>
              <TrashSmIcon /> Delete Booking
            </button>
          ) : (
            <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: "#FEF2F2", border: "1px solid #FCA5A5" }}>
              <p className="text-sm font-semibold text-center" style={{ color: "#DC2626" }}>Permanently delete this booking?</p>
              <p className="text-xs text-center" style={{ color: "#6B7280" }}>All payments linked to it will also be deleted. This cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteBookingConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                  style={{ background: "#fff", color: "var(--fg-muted)", border: "1px solid #E5E7EB" }}>
                  Cancel
                </button>
                <button onClick={() => { onDeleteBooking(b.id); onClose(); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                  style={{ background: "#DC2626", color: "#fff" }}>
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailModal({ b, onClose, onCancel, onEdit, onAddPayment, onEditPayment, onDeletePayment, onDeleteBooking }: {
  b: Booking; onClose: () => void; onCancel: (id: string) => void; onEdit: () => void;
  onAddPayment:    (bookingId: string, amount: number, note: string, method: PaymentMethod) => void;
  onEditPayment:   (bookingId: string, paymentId: string, amount: number, note: string, method: PaymentMethod) => void;
  onDeletePayment: (bookingId: string, paymentId: string) => void;
  onDeleteBooking: (id: string) => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed z-50 bottom-0 left-0 right-0 rounded-t-3xl bg-white flex flex-col overflow-hidden lg:hidden" style={{ maxHeight: "92dvh", boxShadow: "0 -4px 40px rgba(0,0,0,0.12)" }}>
        <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="w-10 h-1 rounded-full" style={{ background: "#E5E7EB" }} /></div>
        <BookingDetail b={b} onClose={onClose} onCancel={onCancel} onEdit={onEdit} onAddPayment={onAddPayment} onEditPayment={onEditPayment} onDeletePayment={onDeletePayment} onDeleteBooking={onDeleteBooking} />
      </div>
      <div className="hidden lg:flex fixed z-50 right-0 top-0 bottom-0 w-[560px] bg-white flex-col overflow-hidden rounded-l-3xl" style={{ boxShadow: "-4px 0 40px rgba(0,0,0,0.12)" }}>
        <BookingDetail b={b} onClose={onClose} onCancel={onCancel} onEdit={onEdit} onAddPayment={onAddPayment} onEditPayment={onEditPayment} onDeletePayment={onDeletePayment} onDeleteBooking={onDeleteBooking} />
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BookingsPage() {
  const { accessToken } = useAuthStore();

  const [bookings,   setBookings]   = useState<Booking[]>([]);
  const [hallNames,  setHallNames]  = useState<string[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [apiError,   setApiError]   = useState<string | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  const [filter,     setFilter]     = useState<"all" | Status>("all");
  const [search,     setSearch]     = useState("");
  const [page,       setPage]       = useState(1);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen,   setEditOpen]   = useState(false);

  // Always derive selected from live local state
  const selected = selectedId ? bookings.find(b => b.id === selectedId) ?? null : null;

  // Load bookings + halls from API on mount
  useEffect(() => {
    if (!accessToken) return;
    (async () => {
      try {
        const [bookingsRes, hallsRes] = await Promise.all([
          api.get<{ bookings: DbBooking[] }>("/api/vendor/bookings", accessToken),
          api.get<{ halls: { id: string; name: string }[] }>("/api/vendor/halls", accessToken),
        ]);
        if (bookingsRes.success) setBookings(bookingsRes.bookings.filter(b => b.status !== "blocked").map(dbToLocal));
        else setApiError(bookingsRes.message ?? "Failed to load bookings.");
        if (hallsRes.success && hallsRes.halls.length > 0)
          setHallNames(hallsRes.halls.map(h => h.name));
      } catch {
        setApiError("Network error — could not reach the server.");
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken]);

  const filtered = bookings.filter(b => {
    const matchFilter = filter === "all" || b.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      b.customerName.toLowerCase().includes(q) ||
      b.event.toLowerCase().includes(q) ||
      b.hall.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function changeFilter(v: "all" | Status) { setFilter(v); setPage(1); }
  function changeSearch(v: string)          { setSearch(v); setPage(1); }

  const counts = {
    all:       bookings.length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    pending:   bookings.filter(b => b.status === "pending").length,
    cancelled: bookings.filter(b => b.status === "cancelled").length,
  };

  const totalRevenue = bookings.filter(b => b.status !== "cancelled").reduce((s, b) => s + b.amount, 0);
  const collected    = bookings.filter(b => b.status !== "cancelled").reduce((s, b) => s + b.paid, 0);

  async function handleCreate(form: typeof EMPTY_FORM, status: Status, services: ServiceEntry[]) {
    if (!accessToken || saving) return;
    setSaving(true);
    try {
      const servicesTotal = services.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
      const grandTotal    = Number(form.amount) || 0;
      const hallAmt       = grandTotal - servicesTotal;
      const advancePaid   = Number(form.paid) || 0;
      const today         = new Date().toISOString().slice(0, 10);

      const payload = {
        customerName: form.customerName,
        phone:        form.phone || "",
        event:        form.event,
        hall:         form.hall,
        date:         form.date,
        ...(toTimeInput(form.timeFrom) ? { timeFrom: toTimeInput(form.timeFrom) } : {}),
        ...(toTimeInput(form.timeTo)   ? { timeTo:   toTimeInput(form.timeTo)   } : {}),
        guests:     Number(form.guests) || 0,
        amount:     grandTotal,
        hallAmount: hallAmt,
        paid:       advancePaid,
        status,
        notes:    form.notes || undefined,
        services: services.map(s => ({ label: s.customName || s.label, unit: s.unit, price: s.price })),
      };

      const res = await api.post<{ id: string }>("/api/vendor/bookings", payload, accessToken);
      if (!res.success) { setApiError(res.message ?? "Failed to create booking."); return; }

      const initialPayments: PaymentRecord[] = advancePaid > 0
        ? [{ id: `pr-${Date.now()}`, amount: advancePaid, date: today, note: "Advance", method: "Cash" }]
        : [];

      const newBooking: Booking = {
        id:           res.id,
        customerName: form.customerName,
        phone:        form.phone || "",
        event:        form.event,
        hall:         form.hall,
        date:         form.date,
        timeFrom:     toTimeInput(form.timeFrom),
        timeTo:       toTimeInput(form.timeTo),
        guests:       Number(form.guests) || 0,
        amount:       grandTotal,
        hallAmount:   hallAmt,
        paid:         advancePaid,
        notes:        form.notes || "",
        status,
        services:     services.map(s => ({ label: s.customName || s.label, unit: s.unit, price: s.price })),
        payments:     initialPayments,
      };

      setBookings(prev => [newBooking, ...prev]);
      setModalOpen(false);
      setSelectedId(newBooking.id);
      setDetailOpen(true);
      setPage(1);
      showToast("Booking created successfully!");
    } catch {
      setApiError("Network error — booking was not saved.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCancelBooking(id: string) {
    if (!accessToken) return;
    const snapshot = bookings;
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: "cancelled" as Status } : b));
    try {
      const res = await api.patch(`/api/vendor/bookings/${id}/cancel`, {}, accessToken);
      if (!res.success) {
        setBookings(snapshot);
        setApiError(res.message ?? "Failed to cancel booking.");
      }
    } catch {
      setBookings(snapshot);
      setApiError("Network error — cancellation was not saved.");
    }
  }

  async function handleSaveEdit(updated: Booking) {
    if (!accessToken) return;
    setSaving(true);
    try {
      const services = updated.services ?? [];
      const payload = {
        customerName: updated.customerName,
        phone:        updated.phone,
        event:        updated.event,
        hall:         updated.hall,
        date:         updated.date,
        ...(toTimeInput(updated.timeFrom) ? { timeFrom: toTimeInput(updated.timeFrom) } : { timeFrom: "" }),
        ...(toTimeInput(updated.timeTo)   ? { timeTo:   toTimeInput(updated.timeTo)   } : { timeTo:   "" }),
        guests:     updated.guests,
        amount:     updated.amount,
        hallAmount: updated.hallAmount ?? 0,
        paid:       updated.paid,
        status:     updated.status,
        notes:      updated.notes || undefined,
        services,
      };

      const res = await api.patch(`/api/vendor/bookings/${updated.id}`, payload, accessToken);
      if (!res.success) { setApiError(res.message ?? "Failed to save changes."); return; }

      // Normalise times back to 24h for local state
      const normalised: Booking = {
        ...updated,
        timeFrom: toTimeInput(updated.timeFrom),
        timeTo:   toTimeInput(updated.timeTo),
      };
      setBookings(prev => prev.map(b => b.id === normalised.id ? normalised : b));
      setEditOpen(false);
    } catch {
      setApiError("Network error — changes were not saved.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddPayment(id: string, amount: number, note: string, method: PaymentMethod) {
    if (!accessToken) return;
    try {
      const today  = new Date().toISOString().slice(0, 10);
      const res    = await api.post<{ id: string; newPaid: number }>(
        `/api/vendor/bookings/${id}/payments`,
        { amount, method, note: note || undefined, date: today },
        accessToken,
      );
      if (!res.success) { setApiError(res.message ?? "Failed to record payment."); return; }

      const record: PaymentRecord = { id: res.id, amount, date: today, note: note || "Payment", method };
      setBookings(prev => prev.map(b => {
        if (b.id !== id) return b;
        return { ...b, paid: res.newPaid, payments: [...(b.payments ?? []), record] };
      }));
    } catch {
      setApiError("Network error — payment was not recorded.");
    }
  }

  async function handleEditPayment(bookingId: string, paymentId: string, amount: number, note: string, method: PaymentMethod) {
    if (!accessToken) return;
    try {
      const res = await api.patch<{ newPaid?: number }>(
        `/api/vendor/bookings/${bookingId}/payments/${paymentId}`,
        { amount, method, note: note || undefined },
        accessToken,
      );
      if (!res.success) { setApiError(res.message ?? "Failed to edit payment."); return; }

      setBookings(prev => prev.map(b => {
        if (b.id !== bookingId) return b;
        const updatedPayments = (b.payments ?? []).map(p =>
          p.id === paymentId ? { ...p, amount, note, method } : p
        );
        return { ...b, paid: res.newPaid ?? b.paid, payments: updatedPayments };
      }));
    } catch {
      setApiError("Network error — payment was not updated.");
    }
  }

  async function handleDeletePayment(bookingId: string, paymentId: string) {
    if (!accessToken) return;
    const snapshot = bookings;
    // Optimistic: remove payment and recalculate paid
    setBookings(prev => prev.map(b => {
      if (b.id !== bookingId) return b;
      const removed  = (b.payments ?? []).find(p => p.id === paymentId);
      const newPaid  = Math.max(0, b.paid - (removed?.amount ?? 0));
      return { ...b, paid: newPaid, payments: (b.payments ?? []).filter(p => p.id !== paymentId) };
    }));
    try {
      const res = await api.delete<{ newPaid: number }>(
        `/api/vendor/bookings/${bookingId}/payments/${paymentId}`,
        accessToken,
      );
      if (!res.success) {
        setBookings(snapshot);
        setApiError(res.message ?? "Failed to delete payment.");
      }
    } catch {
      setBookings(snapshot);
      setApiError("Network error — payment was not deleted.");
    }
  }

  async function handleDeleteBooking(id: string) {
    if (!accessToken) return;
    // Optimistic: remove instantly so list updates before API responds
    const snapshot = bookings;
    setBookings(prev => prev.filter(b => b.id !== id));
    setSelectedId(null);
    setDetailOpen(false);
    try {
      const res = await api.delete(`/api/vendor/bookings/${id}`, accessToken);
      if (!res.success) {
        setBookings(snapshot); // revert on failure
        setApiError(res.message ?? "Failed to delete booking.");
      }
    } catch {
      setBookings(snapshot); // revert on network error
      setApiError("Network error — booking was not deleted.");
    }
  }

  function openDetail(b: Booking) { setSelectedId(b.id); setDetailOpen(true); }

  if (loading) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>Loading bookings…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <NewBookingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
        submitting={saving}
        halls={hallNames}
        bookedDates={new Set(bookings.filter(b => b.status !== "cancelled").map(b => b.date))}
      />

      {selected && detailOpen && !editOpen && (
        <DetailModal
          b={selected}
          onClose={() => setDetailOpen(false)}
          onCancel={(id) => { handleCancelBooking(id); setDetailOpen(false); }}
          onEdit={() => setEditOpen(true)}
          onAddPayment={handleAddPayment}
          onEditPayment={handleEditPayment}
          onDeletePayment={handleDeletePayment}
          onDeleteBooking={handleDeleteBooking}
        />
      )}

      {selected && editOpen && (
        <EditBookingModal
          booking={selected}
          onClose={() => setEditOpen(false)}
          onSave={handleSaveEdit}
          halls={hallNames.length ? hallNames : HALLS_FALLBACK}
          bookedDates={new Set(bookings.filter(b => b.status !== "cancelled" && b.id !== selected.id).map(b => b.date))}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-4 lg:right-8 z-[200] flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-xl"
          style={{ background: "#16A34A", color: "#fff", maxWidth: "340px", animation: "slideUp 0.25s ease" }}>
          <CheckCircleIcon />
          <span className="text-sm font-semibold flex-1">{toast}</span>
          <button onClick={() => setToast(null)} className="shrink-0 opacity-70 hover:opacity-100 cursor-pointer">
            <XIcon />
          </button>
        </div>
      )}

      <div className="p-4 lg:p-8">
        {apiError && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between"
            style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FCA5A5" }}>
            <span>{apiError}</span>
            <button onClick={() => setApiError(null)} className="ml-3 text-xs underline cursor-pointer">Dismiss</button>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl lg:text-2xl font-semibold text-black tracking-tight">Bookings</h1>
            <p className="text-sm mt-1" style={{ color: "var(--fg-muted)" }}>Manage all event bookings</p>
          </div>
          <button onClick={() => setModalOpen(true)} disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold cursor-pointer hover:opacity-90 disabled:opacity-60"
            style={{ background: "var(--primary)", color: "#ffffff" }}>
            <PlusIcon /> New Booking
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm"><p className="text-2xl font-bold text-black">{counts.all}</p><p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>Total Bookings</p></div>
          <div className="bg-white rounded-2xl p-4 shadow-sm"><p className="text-2xl font-bold" style={{ color: "#16A34A" }}>{counts.confirmed}</p><p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>Confirmed</p></div>
          <div className="bg-white rounded-2xl p-4 shadow-sm"><p className="text-base font-bold text-black">{fmt(totalRevenue)}</p><p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>Total Revenue</p></div>
          <div className="bg-white rounded-2xl p-4 shadow-sm"><p className="text-base font-bold" style={{ color: "#16A34A" }}>{fmt(collected)}</p><p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>Collected</p></div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex border-b" style={{ borderColor: "#F4F4F5" }}>
                {FILTER_TABS.map(t => (
                  <button key={t.value} onClick={() => changeFilter(t.value)}
                    className="flex-1 py-3 text-sm font-medium cursor-pointer relative"
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
                  <input value={search} onChange={e => changeSearch(e.target.value)} placeholder="Search customer, event, hall, ID..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none border"
                    style={{ background: "var(--bg-subtle)", borderColor: "#E5E7EB", color: "var(--fg)" }} />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {paginated.length === 0 && (
                <div className="bg-white rounded-2xl shadow-sm py-16 flex flex-col items-center text-center">
                  <EmptyIcon />
                  <p className="text-sm font-medium mt-3 text-black">{bookings.length === 0 ? "No bookings yet" : "No bookings found"}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>
                    {bookings.length === 0 ? "Click \"New Booking\" to create your first booking" : "Try changing the filter or search"}
                  </p>
                </div>
              )}
              {paginated.map(b => {
                const cfg     = STATUS_CONFIG[b.status];
                const balance = b.amount - b.paid;
                const paidPct = b.amount > 0 ? Math.min(100, Math.round((b.paid / b.amount) * 100)) : 0;
                const isActive = selectedId === b.id;
                return (
                  <div key={b.id} onClick={() => openDetail(b)}
                    className="bg-white rounded-2xl shadow-sm p-4 cursor-pointer hover:shadow-md"
                    style={{ border: `1.5px solid ${isActive ? "var(--primary)" : "transparent"}` }}>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 text-white" style={{ background: HALL_COLOR[b.hall] || "var(--primary)" }}>
                          {b.customerName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-black truncate">{b.customerName}</p>
                          <p className="text-xs truncate" style={{ color: "var(--fg-muted)" }}>{b.phone}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: HALL_BG[b.hall] || "var(--primary-light)", color: HALL_COLOR[b.hall] || "var(--primary)" }}>{b.hall}</span>
                      <span className="text-xs font-medium text-black">{b.event}</span>
                    </div>
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mb-3">
                      <div className="flex items-center gap-1.5"><CalendarSmIcon /><span className="text-xs" style={{ color: "var(--fg-muted)" }}>{formatDate(b.date)}</span></div>
                      <div className="flex items-center gap-1.5"><ClockSmIcon /><span className="text-xs" style={{ color: "var(--fg-muted)" }}>{formatTime(b.timeFrom)} – {formatTime(b.timeTo)}</span></div>
                      <div className="flex items-center gap-1.5"><GuestSmIcon /><span className="text-xs" style={{ color: "var(--fg-muted)" }}>{b.guests} guests</span></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px]" style={{ color: "var(--fg-subtle)" }}>Payment</span>
                          <span className="text-[10px] font-medium" style={{ color: paidPct === 100 ? "#16A34A" : "#D97706" }}>{paidPct}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full" style={{ background: "#E5E7EB" }}>
                          <div className="h-1.5 rounded-full" style={{ width: `${paidPct}%`, background: paidPct === 100 ? "#16A34A" : "var(--primary)" }} />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-black">{fmt(b.amount)}</p>
                        {b.status !== "cancelled" && (
                          balance > 0
                            ? <p className="text-[10px]" style={{ color: "#D97706" }}>Due: {fmt(balance)}</p>
                            : <p className="text-[10px]" style={{ color: "#16A34A" }}>Fully Paid</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t flex items-center justify-between" style={{ borderColor: "#F4F4F5" }}>
                      <span className="text-[10px] shrink-0" style={{ color: "var(--fg-subtle)" }}>View details →</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm px-4 py-3">
                <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                  Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-30 hover:bg-gray-100"
                    style={{ color: "var(--fg-muted)" }}><ChevLeftIcon /></button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold cursor-pointer"
                      style={{ background: safePage === p ? "var(--primary)" : "transparent", color: safePage === p ? "#fff" : "var(--fg-muted)" }}>
                      {p}
                    </button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-30 hover:bg-gray-100"
                    style={{ color: "var(--fg-muted)" }}><ChevRightIcon /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function PlusIcon()       { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>; }
function XIcon()          { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>; }
function XSmIcon()        { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function SearchIcon()     { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>; }
function CalendarSmIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fg-subtle)" }}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>; }
function ClockSmIcon()    { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fg-subtle)" }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>; }
function GuestSmIcon()    { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fg-subtle)" }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>; }
function EmptyIcon()      { return <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fg-subtle)" }}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>; }
function ChevLeftIcon()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>; }
function ChevRightIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>; }
function PdfIcon()        { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>; }
function EditSmIcon()     { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function TrashSmIcon()      { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>; }
function CheckCircleIcon()  { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>; }
