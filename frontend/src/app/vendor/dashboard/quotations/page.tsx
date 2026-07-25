"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type QuotationStatus = "draft" | "sent" | "accepted" | "rejected";

type LineItem = { description: string; qty: number; unitPrice: number };

type Quotation = {
  id: string;
  bookingId: string;
  customerName: string;
  phone: string;
  email: string;
  event: string;
  hall: string;
  date: string;
  guests: number;
  validUntil: string;
  status: QuotationStatus;
  items: LineItem[];
  notes: string;
  discount: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 6;

const HALLS       = ["Hall A", "Hall B", "Hall C"];
const EVENT_TYPES = ["Wedding", "Engagement", "Birthday Party", "Corporate Event", "Anniversary", "Conference", "Other"];

const STATUS_CONFIG: Record<QuotationStatus, { label: string; color: string; bg: string }> = {
  draft:    { label: "Draft",    color: "#6B7280", bg: "#F4F4F5" },
  sent:     { label: "Sent",     color: "#2563EB", bg: "#EFF6FF" },
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
  { label: "Draft",    value: "draft" },
  { label: "Sent",     value: "sent" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" },
];

// ─── Mock Data ────────────────────────────────────────────────────────────────
const INITIAL_QUOTATIONS: Quotation[] = [
  {
    id: "QT-001", bookingId: "BK-001", customerName: "Ahmed Khan", phone: "0300-1234567", email: "ahmed.khan@gmail.com",
    event: "Wedding", hall: "Hall A", date: "2026-08-02", guests: 350, validUntil: "2026-07-28", status: "accepted",
    items: [
      { description: "Hall Rental (Hall A – Full Day)", qty: 1, unitPrice: 250000 },
      { description: "Catering – Dinner Buffet", qty: 350, unitPrice: 650 },
      { description: "Stage & Floral Decoration", qty: 1, unitPrice: 85000 },
      { description: "Drink Service", qty: 350, unitPrice: 100 },
    ],
    notes: "Client has requested extra floral arrangements at entrance. Confirm decoration team one week prior.",
    discount: 15000,
  },
  {
    id: "QT-002", bookingId: "BK-002", customerName: "Sara Malik", phone: "0312-9876543", email: "sara.malik@hotmail.com",
    event: "Birthday Party", hall: "Hall B", date: "2026-08-05", guests: 80, validUntil: "2026-07-30", status: "accepted",
    items: [
      { description: "Hall Rental (Hall B – Half Day)", qty: 1, unitPrice: 60000 },
      { description: "Catering – Tea & Snacks", qty: 80, unitPrice: 350 },
      { description: "Birthday Decoration Package", qty: 1, unitPrice: 18000 },
      { description: "Music & Sound System", qty: 1, unitPrice: 12000 },
    ],
    notes: "Birthday theme: Pastel pink and gold.",
    discount: 0,
  },
  {
    id: "QT-003", bookingId: "—", customerName: "Nadia Shah", phone: "0321-4567890", email: "nadia.shah@yahoo.com",
    event: "Wedding", hall: "Hall A", date: "2026-08-10", guests: 400, validUntil: "2026-07-31", status: "sent",
    items: [
      { description: "Hall Rental (Hall A – Full Day)", qty: 1, unitPrice: 250000 },
      { description: "Catering – Lunch & Dinner Buffet", qty: 400, unitPrice: 850 },
      { description: "Premium Stage Decoration", qty: 1, unitPrice: 120000 },
      { description: "Lighting Package", qty: 1, unitPrice: 35000 },
      { description: "Drink Service", qty: 400, unitPrice: 100 },
    ],
    notes: "Menu tasting scheduled for 2 Aug. Client may request vegetarian options.",
    discount: 20000,
  },
  {
    id: "QT-004", bookingId: "BK-004", customerName: "Bilal Raza", phone: "0333-1122334", email: "bilal.raza@gmail.com",
    event: "Corporate Event", hall: "Hall C", date: "2026-08-14", guests: 120, validUntil: "2026-08-05", status: "accepted",
    items: [
      { description: "Hall Rental (Hall C – Full Day)", qty: 1, unitPrice: 70000 },
      { description: "Catering – Business Lunch", qty: 120, unitPrice: 500 },
      { description: "AV & Projector Setup", qty: 1, unitPrice: 15000 },
      { description: "Table & Chair Arrangement", qty: 10, unitPrice: 800 },
    ],
    notes: "Corporate branding banners to be set up. Client will bring their own standees.",
    discount: 5000,
  },
  {
    id: "QT-005", bookingId: "—", customerName: "Hina Baig", phone: "0345-6677889", email: "hina.baig@gmail.com",
    event: "Engagement", hall: "Hall B", date: "2026-08-18", guests: 200, validUntil: "2026-08-08", status: "sent",
    items: [
      { description: "Hall Rental (Hall B – Full Day)", qty: 1, unitPrice: 90000 },
      { description: "Catering – Dinner Buffet", qty: 200, unitPrice: 600 },
      { description: "Engagement Decoration", qty: 1, unitPrice: 55000 },
      { description: "Photography Package", qty: 1, unitPrice: 30000 },
    ],
    notes: "Guests travelling from Lahore. Require accommodation referrals.",
    discount: 10000,
  },
  {
    id: "QT-006", bookingId: "—", customerName: "Tariq Butt", phone: "0302-3344556", email: "tariq.butt@outlook.com",
    event: "Wedding", hall: "Hall A", date: "2026-08-22", guests: 500, validUntil: "2026-08-10", status: "draft",
    items: [
      { description: "Hall Rental (Hall A – Full Day)", qty: 1, unitPrice: 250000 },
      { description: "Catering – Dinner Buffet", qty: 500, unitPrice: 700 },
      { description: "Grand Stage Decoration", qty: 1, unitPrice: 150000 },
      { description: "Music & Live Band", qty: 1, unitPrice: 50000 },
      { description: "Valet Parking Service", qty: 1, unitPrice: 20000 },
    ],
    notes: "Draft pending confirmation of exact guest count and menu preferences.",
    discount: 0,
  },
  {
    id: "QT-007", bookingId: "—", customerName: "Usman Ali", phone: "0311-9988776", email: "usman.ali@gmail.com",
    event: "Anniversary", hall: "Hall B", date: "2026-09-05", guests: 60, validUntil: "2026-08-25", status: "rejected",
    items: [
      { description: "Hall Rental (Hall B – Half Day)", qty: 1, unitPrice: 55000 },
      { description: "Catering – Dinner for 60", qty: 60, unitPrice: 700 },
      { description: "Romantic Decoration Package", qty: 1, unitPrice: 25000 },
    ],
    notes: "Client rejected due to budget constraints. May revisit in future.",
    discount: 0,
  },
  {
    id: "QT-008", bookingId: "BK-008", customerName: "Fatima Malik", phone: "0321-5566778", email: "fatima.malik@gmail.com",
    event: "Wedding", hall: "Hall A", date: "2026-09-01", guests: 450, validUntil: "2026-08-20", status: "accepted",
    items: [
      { description: "Hall Rental (Hall A – Full Day)", qty: 1, unitPrice: 250000 },
      { description: "Catering – Full Day Buffet", qty: 450, unitPrice: 900 },
      { description: "Premium Floral Decoration", qty: 1, unitPrice: 130000 },
      { description: "Sound System & DJ", qty: 1, unitPrice: 40000 },
      { description: "Drink Service", qty: 450, unitPrice: 100 },
    ],
    notes: "VIP section required for 20 guests. Separate menu for VIP table.",
    discount: 25000,
  },
  {
    id: "QT-009", bookingId: "—", customerName: "Omar Sheikh", phone: "0300-8899001", email: "omar.sheikh@corp.pk",
    event: "Conference", hall: "Hall C", date: "2026-09-10", guests: 150, validUntil: "2026-08-28", status: "draft",
    items: [
      { description: "Hall Rental (Hall C – Full Day)", qty: 1, unitPrice: 70000 },
      { description: "Catering – High Tea & Lunch", qty: 150, unitPrice: 600 },
      { description: "AV Setup & Projectors (×2)", qty: 2, unitPrice: 12000 },
      { description: "Simultaneous Translation Equipment", qty: 1, unitPrice: 20000 },
    ],
    notes: "International speakers attending. Require proper AV testing 1 day prior.",
    discount: 0,
  },
  {
    id: "QT-010", bookingId: "—", customerName: "Zara Ahmed", phone: "0312-2233445", email: "zara.ahmed@hotmail.com",
    event: "Engagement", hall: "Hall B", date: "2026-09-15", guests: 180, validUntil: "2026-09-05", status: "sent",
    items: [
      { description: "Hall Rental (Hall B – Full Day)", qty: 1, unitPrice: 90000 },
      { description: "Catering – Dinner Buffet", qty: 180, unitPrice: 650 },
      { description: "Engagement Floral Setup", qty: 1, unitPrice: 45000 },
      { description: "Videography Package", qty: 1, unitPrice: 28000 },
    ],
    notes: "Family from Karachi arriving. Need to confirm catering headcount 3 days prior.",
    discount: 5000,
  },
  {
    id: "QT-011", bookingId: "—", customerName: "Ali Hassan", phone: "0333-7788990", email: "ali.hassan@gmail.com",
    event: "Wedding", hall: "Hall A", date: "2026-09-20", guests: 380, validUntil: "2026-09-08", status: "draft",
    items: [
      { description: "Hall Rental (Hall A – Full Day)", qty: 1, unitPrice: 250000 },
      { description: "Catering – Dinner Buffet", qty: 380, unitPrice: 750 },
      { description: "Stage & Aisle Decoration", qty: 1, unitPrice: 95000 },
      { description: "Drone Photography Add-on", qty: 1, unitPrice: 18000 },
    ],
    notes: "Awaiting family decision. Follow up scheduled for 1 Sep.",
    discount: 0,
  },
  {
    id: "QT-012", bookingId: "—", customerName: "Raza Corp", phone: "0302-1122334", email: "events@razacorp.pk",
    event: "Conference", hall: "Hall C", date: "2026-09-28", guests: 200, validUntil: "2026-09-15", status: "rejected",
    items: [
      { description: "Hall Rental (Hall C – Full Day)", qty: 1, unitPrice: 70000 },
      { description: "Catering – Lunch & Refreshments", qty: 200, unitPrice: 550 },
      { description: "Stage & Podium Setup", qty: 1, unitPrice: 30000 },
      { description: "Branding & Signage Setup", qty: 1, unitPrice: 15000 },
    ],
    notes: "Client chose a competitor venue. Keep in contact for future events.",
    discount: 0,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return "Rs. " + n.toLocaleString("en-PK");
}
function formatDate(d: string) {
  if (!d || d === "—") return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function calcSubtotal(items: LineItem[]) {
  return items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
}
function calcTotal(items: LineItem[], discount: number) {
  return Math.max(0, calcSubtotal(items) - discount);
}

// ─── Empty line item ──────────────────────────────────────────────────────────
const EMPTY_ITEM: LineItem = { description: "", qty: 1, unitPrice: 0 };

// ─── Shared form state type ───────────────────────────────────────────────────
type FormState = {
  customerName: string;
  phone: string;
  email: string;
  bookingId: string;
  event: string;
  hall: string;
  date: string;
  guests: string;
  validUntil: string;
  notes: string;
  discount: string;
  status: QuotationStatus;
  items: LineItem[];
};

const EMPTY_FORM: FormState = {
  customerName: "", phone: "", email: "", bookingId: "",
  event: EVENT_TYPES[0], hall: HALLS[0], date: "", guests: "",
  validUntil: "", notes: "", discount: "0", status: "draft",
  items: [{ ...EMPTY_ITEM }],
};

// ─── Quotation Form (shared by New + Edit modals) ─────────────────────────────
function QuotationForm({
  title,
  subtitle,
  initial,
  onClose,
  onSubmit,
}: {
  title: string;
  subtitle?: string;
  initial: FormState;
  onClose: () => void;
  onSubmit: (f: FormState) => void;
}) {
  const [f, setF]     = useState<FormState>(initial);
  const [items, setItems] = useState<LineItem[]>(initial.items.length > 0 ? initial.items : [{ ...EMPTY_ITEM }]);

  const subtotal = calcSubtotal(items);
  const disc     = Number(f.discount) || 0;
  const total    = Math.max(0, subtotal - disc);

  function setField<K extends keyof FormState>(k: K, v: FormState[K]) {
    setF(prev => ({ ...prev, [k]: v }));
  }
  function updateItem(i: number, patch: Partial<LineItem>) {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, ...patch } : it));
  }
  function addItem() { setItems(prev => [...prev, { ...EMPTY_ITEM }]); }
  function removeItem(i: number) {
    setItems(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ ...f, items });
  }

  const inp      = "px-4 py-3 rounded-xl border text-sm outline-none w-full";
  const inpStyle = { background: "var(--bg-subtle)", borderColor: "#D1D5DB", color: "var(--fg)" };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed z-50 bottom-0 left-0 right-0 rounded-t-3xl bg-white flex flex-col lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:right-auto lg:w-[440px] lg:rounded-3xl overflow-hidden"
        style={{ maxHeight: "92dvh", boxShadow: "0 -4px 40px rgba(0,0,0,0.14)" }}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 lg:hidden shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "#E5E7EB" }} />
        </div>

        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "#F4F4F5" }}>
          <div>
            <p className="text-sm font-bold text-black">{title}</p>
            {subtitle && <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer hover:bg-gray-100 transition-colors" style={{ color: "var(--fg-muted)" }}>
            <XIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">

          {/* Customer Info */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Customer Info</p>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Customer Name *</label>
                <input value={f.customerName} onChange={e => setField("customerName", e.target.value)} placeholder="e.g. Ahmed Khan" className={inp} style={inpStyle} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Phone</label>
                  <input value={f.phone} onChange={e => setField("phone", e.target.value)} placeholder="0300-1234567" className={inp} style={inpStyle} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Email</label>
                  <input type="email" value={f.email} onChange={e => setField("email", e.target.value)} placeholder="email@example.com" className={inp} style={inpStyle} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Booking ID (optional)</label>
                <input value={f.bookingId} onChange={e => setField("bookingId", e.target.value)} placeholder="BK-001" className={inp} style={inpStyle} />
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Event Details</p>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Event Type *</label>
                  <select value={f.event} onChange={e => setField("event", e.target.value)} className={inp} style={inpStyle} required>
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Hall *</label>
                  <select value={f.hall} onChange={e => setField("hall", e.target.value)} className={inp} style={inpStyle} required>
                    {HALLS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
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

          {/* Line Items */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Line Items</p>
            <div className="flex flex-col gap-2">
              {items.map((it, i) => {
                const amt = it.qty * it.unitPrice;
                return (
                  <div key={i} className="p-3 rounded-xl border flex flex-col gap-2" style={{ borderColor: "#E5E7EB", background: "var(--bg-subtle)" }}>
                    <div className="flex items-center gap-2">
                      <input
                        value={it.description}
                        onChange={e => updateItem(i, { description: e.target.value })}
                        placeholder="Description (e.g. Hall Rental)"
                        className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
                        style={{ background: "#fff", borderColor: "#D1D5DB", color: "var(--fg)" }}
                      />
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(i)} className="w-7 h-7 flex items-center justify-center rounded-lg shrink-0 cursor-pointer hover:bg-red-50 transition-colors" style={{ color: "#DC2626" }}>
                          <MinusIcon />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold" style={{ color: "var(--fg-subtle)" }}>Qty</label>
                        <input
                          type="number"
                          value={it.qty}
                          onChange={e => updateItem(i, { qty: Math.max(1, Number(e.target.value)) })}
                          min={1}
                          className="px-3 py-2 rounded-lg border text-sm outline-none text-center"
                          style={{ background: "#fff", borderColor: "#D1D5DB", color: "var(--fg)" }}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold" style={{ color: "var(--fg-subtle)" }}>Unit Price</label>
                        <input
                          type="number"
                          value={it.unitPrice}
                          onChange={e => updateItem(i, { unitPrice: Math.max(0, Number(e.target.value)) })}
                          min={0}
                          placeholder="0"
                          className="px-3 py-2 rounded-lg border text-sm outline-none"
                          style={{ background: "#fff", borderColor: "#D1D5DB", color: "var(--fg)" }}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold" style={{ color: "var(--fg-subtle)" }}>Amount</label>
                        <div className="px-3 py-2 rounded-lg text-sm font-semibold" style={{ background: "#F4F4F5", color: "var(--primary)" }}>
                          {fmt(amt)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={addItem}
                className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border border-dashed text-sm font-semibold cursor-pointer transition-colors hover:border-gray-400"
                style={{ borderColor: "#D1D5DB", color: "var(--fg-muted)" }}
              >
                <PlusIcon /> Add Item
              </button>
            </div>
          </div>

          {/* Discount & Valid Until */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Discount (Rs.)</label>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl border" style={{ background: "var(--bg-subtle)", borderColor: "#D1D5DB" }}>
                <span className="text-xs font-semibold shrink-0" style={{ color: "var(--fg-muted)" }}>Rs.</span>
                <input type="number" value={f.discount} onChange={e => setField("discount", e.target.value)} placeholder="0" min={0} className="flex-1 bg-transparent outline-none text-sm font-semibold text-black w-0" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Valid Until *</label>
              <input type="date" value={f.validUntil} onChange={e => setField("validUntil", e.target.value)} className={inp} style={inpStyle} required />
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Notes (optional)</label>
            <textarea
              value={f.notes}
              onChange={e => setField("notes", e.target.value)}
              placeholder="Add any special instructions or notes..."
              rows={3}
              className="px-4 py-3 rounded-xl border text-sm outline-none resize-none"
              style={{ background: "var(--bg-subtle)", borderColor: "#D1D5DB", color: "var(--fg)" }}
            />
          </div>

          {/* Totals summary */}
          <div className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: "var(--bg-subtle)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Subtotal</span>
              <span className="text-sm font-semibold text-black">{fmt(subtotal)}</span>
            </div>
            {disc > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Discount</span>
                <span className="text-sm font-semibold" style={{ color: "#DC2626" }}>− {fmt(disc)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "#E5E7EB" }}>
              <span className="text-sm font-bold text-black">Total</span>
              <span className="text-base font-bold" style={{ color: "var(--primary)" }}>{fmt(total)}</span>
            </div>
          </div>

          {/* Status toggle */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--fg-subtle)" }}>Save As</p>
            <div className="grid grid-cols-2 gap-2">
              {(["draft", "sent"] as QuotationStatus[]).map(s => {
                const cfg = STATUS_CONFIG[s];
                const active = f.status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setField("status", s)}
                    className="py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all"
                    style={{
                      background: active ? cfg.bg : "var(--bg-subtle)",
                      color: active ? cfg.color : "var(--fg-muted)",
                      border: `1.5px solid ${active ? cfg.color : "transparent"}`,
                    }}
                  >
                    {s === "draft" ? "Save as Draft" : "Send to Customer"}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl text-sm font-bold cursor-pointer transition-opacity hover:opacity-90 mt-1"
            style={{ background: "var(--primary)", color: "#ffffff" }}
          >
            {f.status === "sent" ? "Send Quotation" : "Save Draft"}
          </button>
        </form>
      </div>
    </>
  );
}

// ─── PDF Generator ────────────────────────────────────────────────────────────
function generatePDF(q: Quotation) {
  const subtotal = q.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const total    = subtotal - (q.discount || 0);
  const fmtRs    = (n: number) => "Rs. " + n.toLocaleString("en-PK");
  const fmtDate  = (d: string) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Quotation ${q.id} – Event Ease</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; background: #fff; padding: 40px; font-size: 13px; }
    @media print {
      body { padding: 24px; }
      .no-print { display: none !important; }
      @page { margin: 16mm; size: A4; }
    }

    /* Header */
    .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 24px; border-bottom: 2px solid #FF3B6B; margin-bottom: 28px; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-name { font-size: 22px; font-weight: 800; color: #111; letter-spacing: -0.5px; }
    .brand-sub { font-size: 11px; color: #888; margin-top: 1px; }
    .quote-meta { text-align: right; }
    .quote-id { font-size: 20px; font-weight: 700; color: #111; }
    .quote-status { display: inline-block; margin-top: 4px; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }

    /* Info grid */
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
    .info-block h3 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 8px; }
    .info-block p { font-size: 13px; color: #333; line-height: 1.6; }
    .info-block .name { font-size: 15px; font-weight: 700; color: #111; }

    /* Items table */
    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead tr { background: #FFF0F4; }
    thead th { padding: 10px 12px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #FF3B6B; }
    thead th.right { text-align: right; }
    tbody tr { border-bottom: 1px solid #F4F4F5; }
    tbody tr:last-child { border-bottom: none; }
    tbody td { padding: 10px 12px; font-size: 13px; color: #333; }
    tbody td.right { text-align: right; }
    tbody td.bold { font-weight: 600; color: #111; }

    /* Totals */
    .totals { margin-left: auto; width: 260px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #555; }
    .totals-row.divider { border-top: 1px solid #E5E7EB; margin-top: 4px; padding-top: 10px; }
    .totals-row.total { font-size: 15px; font-weight: 700; color: #111; }
    .totals-row.discount { color: #16A34A; }

    /* Notes */
    .notes-box { background: #F9F9F9; border-radius: 8px; padding: 14px 16px; margin-top: 24px; font-size: 12px; color: #555; line-height: 1.7; }
    .notes-box strong { display: block; margin-bottom: 4px; color: #111; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }

    /* Footer */
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #E5E7EB; display: flex; justify-content: space-between; font-size: 11px; color: #aaa; }

    /* Print button */
    .print-btn { display: block; margin: 0 auto 32px; padding: 10px 28px; background: #FF3B6B; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">Download / Print PDF</button>

  <!-- Header -->
  <div class="header">
    <div class="brand">
      <div>
        <div class="brand-name">Royal Banquet Hall</div>
        <div class="brand-sub">Event Ease</div>
      </div>
    </div>
    <div class="quote-meta">
      <div class="quote-id">${q.id}</div>
      <span class="quote-status" style="background:${
        q.status === "accepted" ? "#F0FDF4" : q.status === "sent" ? "#EFF6FF" : q.status === "rejected" ? "#FEF2F2" : "#F4F4F5"
      }; color:${
        q.status === "accepted" ? "#16A34A" : q.status === "sent" ? "#2563EB" : q.status === "rejected" ? "#DC2626" : "#6B7280"
      }">
        ${q.status.charAt(0).toUpperCase() + q.status.slice(1)}
      </span>
    </div>
  </div>

  <!-- Info Grid -->
  <div class="info-grid">
    <div class="info-block">
      <h3>Prepared For</h3>
      <p class="name">${q.customerName}</p>
      <p>${q.phone}</p>
      ${q.email ? `<p>${q.email}</p>` : ""}
      ${q.bookingId !== "—" ? `<p style="margin-top:4px;font-size:11px;color:#999;">Booking: ${q.bookingId}</p>` : ""}
    </div>
    <div class="info-block">
      <h3>Event Details</h3>
      <p><strong>${q.event}</strong> — ${q.hall}</p>
      <p>Date: ${fmtDate(q.date)}</p>
      <p>Guests: ${q.guests}</p>
      <p style="margin-top:6px;font-size:11px;color:#DC2626;font-weight:600;">Valid Until: ${fmtDate(q.validUntil)}</p>
    </div>
  </div>

  <!-- Line Items -->
  <p class="section-title">Line Items</p>
  <table>
    <thead>
      <tr>
        <th style="width:50%">Description</th>
        <th class="right" style="width:10%">Qty</th>
        <th class="right" style="width:20%">Unit Price</th>
        <th class="right" style="width:20%">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${q.items.map(item => `
        <tr>
          <td class="bold">${item.description}</td>
          <td class="right">${item.qty}</td>
          <td class="right">${fmtRs(item.unitPrice)}</td>
          <td class="right bold">${fmtRs(item.qty * item.unitPrice)}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals">
    <div class="totals-row"><span>Subtotal</span><span>${fmtRs(subtotal)}</span></div>
    ${q.discount ? `<div class="totals-row discount"><span>Discount</span><span>− ${fmtRs(q.discount)}</span></div>` : ""}
    <div class="totals-row divider total"><span>Total</span><span>${fmtRs(total)}</span></div>
  </div>

  ${q.notes ? `
  <div class="notes-box">
    <strong>Notes</strong>
    ${q.notes}
  </div>` : ""}

  <!-- Footer -->
  <div class="footer">
    <span>Generated by Event Ease · eventease.app</span>
    <span>Quotation valid until ${fmtDate(q.validUntil)}</span>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function QuotationDetailContent({
  q,
  onClose,
  onStatusChange,
}: {
  q: Quotation;
  onClose: () => void;
  onStatusChange: (id: string, status: QuotationStatus) => void;
}) {
  const subtotal = calcSubtotal(q.items);
  const total    = calcTotal(q.items, q.discount);
  const cfg      = STATUS_CONFIG[q.status];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "#F4F4F5" }}>
        <div>
          <p className="text-sm font-bold text-black">{q.id}</p>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
            {cfg.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => generatePDF(q)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80"
            style={{ background: "var(--primary-light)", color: "var(--primary)" }}
          >
            <PDFIcon /> PDF
          </button>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer hover:bg-gray-100 transition-colors" style={{ color: "var(--fg-muted)" }}>
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
          {q.bookingId !== "—" && (
            <span className="text-xs font-mono font-medium px-2 py-1 rounded-lg shrink-0" style={{ background: "#F4F4F5", color: "var(--fg-muted)" }}>
              {q.bookingId}
            </span>
          )}
        </div>

        {/* Event Details */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Event Details</p>
          <div className="flex flex-col">
            {[
              { label: "Event",       value: q.event,              badge: false },
              { label: "Hall",        value: q.hall,               badge: true  },
              { label: "Event Date",  value: formatDate(q.date),   badge: false },
              { label: "Valid Until", value: formatDate(q.validUntil), badge: false },
              { label: "Guests",      value: `${q.guests} guests`, badge: false },
            ].map((row, i) => (
              <div key={row.label} className={`flex items-center justify-between py-2.5 ${i !== 4 ? "border-b" : ""}`} style={{ borderColor: "#F4F4F5" }}>
                <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{row.label}</span>
                {row.badge
                  ? <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: HALL_BG[q.hall] || "var(--primary-light)", color: HALL_COLOR[q.hall] || "var(--primary)" }}>{row.value}</span>
                  : <span className="text-sm font-semibold text-black">{row.value}</span>
                }
              </div>
            ))}
          </div>
        </div>

        {/* Line Items */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Line Items</p>
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#E5E7EB" }}>
            {/* Table header */}
            <div className="grid grid-cols-12 px-3 py-2" style={{ background: "var(--bg-subtle)", borderBottom: "1px solid #E5E7EB" }}>
              <span className="col-span-6 text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--fg-subtle)" }}>Description</span>
              <span className="col-span-2 text-[10px] font-bold uppercase tracking-wide text-center" style={{ color: "var(--fg-subtle)" }}>Qty</span>
              <span className="col-span-2 text-[10px] font-bold uppercase tracking-wide text-right" style={{ color: "var(--fg-subtle)" }}>Rate</span>
              <span className="col-span-2 text-[10px] font-bold uppercase tracking-wide text-right" style={{ color: "var(--fg-subtle)" }}>Amt</span>
            </div>
            {q.items.map((it, i) => (
              <div key={i} className={`grid grid-cols-12 px-3 py-2.5 ${i !== q.items.length - 1 ? "border-b" : ""}`} style={{ borderColor: "#F4F4F5" }}>
                <span className="col-span-6 text-xs text-black leading-snug pr-2">{it.description}</span>
                <span className="col-span-2 text-xs text-center" style={{ color: "var(--fg-muted)" }}>{it.qty}</span>
                <span className="col-span-2 text-xs text-right" style={{ color: "var(--fg-muted)" }}>{it.unitPrice.toLocaleString("en-PK")}</span>
                <span className="col-span-2 text-xs font-semibold text-right text-black">{(it.qty * it.unitPrice).toLocaleString("en-PK")}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: "var(--bg-subtle)" }}>
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Subtotal</span>
            <span className="text-sm font-semibold text-black">{fmt(subtotal)}</span>
          </div>
          {q.discount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Discount</span>
              <span className="text-sm font-semibold" style={{ color: "#DC2626" }}>− {fmt(q.discount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "#E5E7EB" }}>
            <span className="text-sm font-bold text-black">Total</span>
            <span className="text-base font-bold" style={{ color: "var(--primary)" }}>{fmt(total)}</span>
          </div>
        </div>

        {/* Notes */}
        {q.notes && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--fg-subtle)" }}>Notes</p>
            <p className="text-sm rounded-xl p-3 leading-relaxed" style={{ background: "var(--bg-subtle)", color: "var(--fg-muted)" }}>
              {q.notes}
            </p>
          </div>
        )}

        {/* Status Actions */}
        <div className="flex flex-col gap-2 pt-1">
          {q.status === "draft" && (
            <button
              onClick={() => { onStatusChange(q.id, "sent"); onClose(); }}
              className="w-full py-3 rounded-2xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90"
              style={{ background: "#EFF6FF", color: "#2563EB" }}
            >
              Mark as Sent
            </button>
          )}
          {q.status === "sent" && (
            <>
              <button
                onClick={() => { onStatusChange(q.id, "accepted"); onClose(); }}
                className="w-full py-3 rounded-2xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90"
                style={{ background: "#F0FDF4", color: "#16A34A" }}
              >
                Mark Accepted
              </button>
              <button
                onClick={() => { onStatusChange(q.id, "rejected"); onClose(); }}
                className="w-full py-3 rounded-2xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-80"
                style={{ background: "#FEF2F2", color: "#DC2626" }}
              >
                Mark Rejected
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-80"
            style={{ background: "var(--bg-subtle)", color: "var(--fg)" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailModal({
  q,
  onClose,
  onStatusChange,
}: {
  q: Quotation;
  onClose: () => void;
  onStatusChange: (id: string, status: QuotationStatus) => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      {/* Mobile: bottom sheet */}
      <div
        className="fixed z-40 bottom-0 left-0 right-0 rounded-t-3xl bg-white flex flex-col lg:hidden overflow-hidden"
        style={{ maxHeight: "92dvh", boxShadow: "0 -4px 40px rgba(0,0,0,0.12)" }}
      >
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "#E5E7EB" }} />
        </div>
        <QuotationDetailContent q={q} onClose={onClose} onStatusChange={onStatusChange} />
      </div>
      {/* Desktop: centered modal */}
      <div
        className="hidden lg:flex fixed z-40 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] bg-white rounded-3xl flex-col overflow-hidden"
        style={{ height: "85vh", boxShadow: "0 8px 60px rgba(0,0,0,0.18)" }}
      >
        <QuotationDetailContent q={q} onClose={onClose} onStatusChange={onStatusChange} />
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>(INITIAL_QUOTATIONS);
  const [filter, setFilter]         = useState<"all" | QuotationStatus>("all");
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);

  const [newModalOpen, setNewModalOpen]   = useState(false);
  const [detailTarget, setDetailTarget]   = useState<Quotation | null>(null);
  const [editTarget, setEditTarget]       = useState<Quotation | null>(null);
  const [deleteTarget, setDeleteTarget]   = useState<Quotation | null>(null);

  // ── Filtering & pagination ────────────────────────────────────────────────
  const filtered = quotations.filter(q => {
    const matchFilter = filter === "all" || q.status === filter;
    const s = search.toLowerCase();
    const matchSearch = !s ||
      q.customerName.toLowerCase().includes(s) ||
      q.event.toLowerCase().includes(s) ||
      q.hall.toLowerCase().includes(s) ||
      q.id.toLowerCase().includes(s) ||
      q.bookingId.toLowerCase().includes(s);
    return matchFilter && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function changeFilter(v: "all" | QuotationStatus) { setFilter(v); setPage(1); }
  function changeSearch(v: string)                   { setSearch(v); setPage(1); }

  // ── Counts ────────────────────────────────────────────────────────────────
  const counts = {
    all:      quotations.length,
    draft:    quotations.filter(q => q.status === "draft").length,
    sent:     quotations.filter(q => q.status === "sent").length,
    accepted: quotations.filter(q => q.status === "accepted").length,
    rejected: quotations.filter(q => q.status === "rejected").length,
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalValue  = quotations.filter(q => q.status === "accepted").reduce((s, q) => s + calcTotal(q.items, q.discount), 0);
  const pendingCount = counts.sent + counts.draft;

  // ── CRUD handlers ─────────────────────────────────────────────────────────
  function handleCreate(f: FormState) {
    const newQ: Quotation = {
      id: "QT-" + String(quotations.length + 1).padStart(3, "0"),
      bookingId: f.bookingId || "—",
      customerName: f.customerName,
      phone: f.phone,
      email: f.email,
      event: f.event,
      hall: f.hall,
      date: f.date,
      guests: Number(f.guests) || 0,
      validUntil: f.validUntil,
      status: f.status,
      items: f.items,
      notes: f.notes,
      discount: Number(f.discount) || 0,
    };
    setQuotations(prev => [newQ, ...prev]);
    setNewModalOpen(false);
    setPage(1);
  }

  function handleEdit(f: FormState) {
    if (!editTarget) return;
    setQuotations(prev => prev.map(q => q.id === editTarget.id ? {
      ...q,
      bookingId: f.bookingId || "—",
      customerName: f.customerName,
      phone: f.phone,
      email: f.email,
      event: f.event,
      hall: f.hall,
      date: f.date,
      guests: Number(f.guests) || 0,
      validUntil: f.validUntil,
      status: f.status,
      items: f.items,
      notes: f.notes,
      discount: Number(f.discount) || 0,
    } : q));
    setEditTarget(null);
  }

  function handleStatusChange(id: string, status: QuotationStatus) {
    setQuotations(prev => prev.map(q => q.id === id ? { ...q, status } : q));
  }

  function handleDelete(id: string) {
    setQuotations(prev => prev.filter(q => q.id !== id));
    setDeleteTarget(null);
    if (detailTarget?.id === id) setDetailTarget(null);
  }

  function formFromQuotation(q: Quotation): FormState {
    return {
      customerName: q.customerName,
      phone: q.phone,
      email: q.email,
      bookingId: q.bookingId === "—" ? "" : q.bookingId,
      event: q.event,
      hall: q.hall,
      date: q.date,
      guests: String(q.guests),
      validUntil: q.validUntil,
      notes: q.notes,
      discount: String(q.discount),
      status: q.status,
      items: q.items.length > 0 ? q.items : [{ ...EMPTY_ITEM }],
    };
  }

  return (
    <>
      {/* New Quotation Modal */}
      {newModalOpen && (
        <QuotationForm
          title="New Quotation"
          initial={EMPTY_FORM}
          onClose={() => setNewModalOpen(false)}
          onSubmit={handleCreate}
        />
      )}

      {/* Edit Modal */}
      {editTarget && (
        <QuotationForm
          title="Edit Quotation"
          subtitle={editTarget.id}
          initial={formFromQuotation(editTarget)}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEdit}
        />
      )}

      {/* Detail Modal */}
      {detailTarget && (
        <DetailModal
          q={quotations.find(q => q.id === detailTarget.id) ?? detailTarget}
          onClose={() => setDetailTarget(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl p-6 w-[320px] shadow-2xl">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#FEF2F2" }}>
              <TrashIcon size={20} color="#DC2626" />
            </div>
            <p className="text-base font-bold text-black text-center">Delete Quotation?</p>
            <p className="text-sm text-center mt-1 mb-5" style={{ color: "var(--fg-muted)" }}>
              <span className="font-semibold text-black">{deleteTarget.id}</span> for{" "}
              <span className="font-semibold text-black">{deleteTarget.customerName}</span> will be permanently deleted.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer hover:opacity-80 transition-opacity"
                style={{ background: "var(--bg-subtle)", color: "var(--fg)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTarget.id)}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity"
                style={{ background: "#DC2626", color: "#fff" }}
              >
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
          <button
            onClick={() => setNewModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90"
            style={{ background: "var(--primary)", color: "#ffffff" }}
          >
            <PlusIcon /> New Quotation
          </button>
        </div>

        {/* Stats Bar */}
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
            <p className="text-2xl font-bold" style={{ color: "#D97706" }}>{pendingCount}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>Pending (Draft + Sent)</p>
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
              <button
                key={t.value}
                onClick={() => changeFilter(t.value)}
                className="flex-1 min-w-fit py-3 px-2 text-sm font-medium transition-colors cursor-pointer relative whitespace-nowrap"
                style={{ color: filter === t.value ? "var(--primary)" : "var(--fg-muted)" }}
              >
                {t.label}
                <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full" style={{
                  background: filter === t.value ? "var(--primary-light)" : "var(--bg-subtle)",
                  color: filter === t.value ? "var(--primary)" : "var(--fg-muted)",
                }}>
                  {counts[t.value]}
                </span>
                {filter === t.value && (
                  <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full" style={{ background: "var(--primary)" }} />
                )}
              </button>
            ))}
          </div>
          <div className="px-4 py-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--fg-subtle)" }}>
                <SearchIcon />
              </span>
              <input
                value={search}
                onChange={e => changeSearch(e.target.value)}
                placeholder="Search customer, event, hall, quotation ID..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none border"
                style={{ background: "var(--bg-subtle)", borderColor: "#E5E7EB", color: "var(--fg)" }}
              />
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-2">
          {paginated.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm py-16 flex flex-col items-center text-center">
              <EmptyIcon />
              <p className="text-sm font-medium mt-3 text-black">No quotations found</p>
              <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>Try changing the filter or search</p>
            </div>
          )}

          {paginated.map(q => {
            const cfg      = STATUS_CONFIG[q.status];
            const subtotal = calcSubtotal(q.items);
            const total    = calcTotal(q.items, q.discount);

            return (
              <div key={q.id} className="bg-white rounded-2xl shadow-sm p-4">

                {/* Row 1: Avatar + name + phone | status badge */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ background: HALL_COLOR[q.hall] || "var(--primary)" }}
                    >
                      {q.customerName[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-black truncate">{q.customerName}</p>
                      <p className="text-xs truncate" style={{ color: "var(--fg-muted)" }}>{q.phone}</p>
                    </div>
                  </div>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                </div>

                {/* Row 2: Hall badge + event type */}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: HALL_BG[q.hall] || "var(--primary-light)", color: HALL_COLOR[q.hall] || "var(--primary)" }}
                  >
                    {q.hall}
                  </span>
                  <span className="text-xs font-medium text-black">{q.event}</span>
                </div>

                {/* Row 3: Event date + valid until + guests */}
                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mb-3">
                  <div className="flex items-center gap-1.5">
                    <CalSmIcon />
                    <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{formatDate(q.date)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ClockSmIcon />
                    <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Valid: {formatDate(q.validUntil)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <GuestSmIcon />
                    <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{q.guests} guests</span>
                  </div>
                </div>

                {/* Row 4: items count + subtotal + discount + total */}
                <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mb-3">
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--bg-subtle)", color: "var(--fg-muted)" }}>
                    {q.items.length} item{q.items.length !== 1 ? "s" : ""}
                  </span>
                  <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
                    Sub: {fmt(subtotal)}
                  </span>
                  {q.discount > 0 && (
                    <span className="text-xs font-medium" style={{ color: "#DC2626" }}>
                      − {fmt(q.discount)}
                    </span>
                  )}
                  <span className="text-sm font-bold text-black ml-auto">
                    {fmt(total)}
                  </span>
                </div>

                {/* Row 5: Footer — quotation ID + action buttons */}
                <div className="flex items-center justify-between pt-2.5 border-t" style={{ borderColor: "#F4F4F5" }}>
                  <span className="text-[10px] font-mono font-medium" style={{ color: "var(--fg-subtle)" }}>{q.id}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setDetailTarget(q)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
                      style={{ color: "#2563EB" }}
                      title="View Details"
                    >
                      <EyeIcon />
                    </button>
                    <button
                      onClick={() => setEditTarget(q)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:bg-amber-50 transition-colors"
                      style={{ color: "#D97706" }}
                      title="Edit"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(q)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:bg-red-50 transition-colors"
                      style={{ color: "#DC2626" }}
                      title="Delete"
                    >
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
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-30 hover:bg-gray-100 transition-colors"
                style={{ color: "var(--fg-muted)" }}
              >
                <ChevLeftIcon />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  style={{
                    background: safePage === n ? "var(--primary)" : "transparent",
                    color: safePage === n ? "#fff" : "var(--fg-muted)",
                  }}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-30 hover:bg-gray-100 transition-colors"
                style={{ color: "var(--fg-muted)" }}
              >
                <ChevRightIcon />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function PlusIcon()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>; }
function MinusIcon()   { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>; }
function XIcon()       { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>; }
function PDFIcon()     { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>; }
function EyeIcon()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>; }
function EditIcon()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>; }
function TrashIcon({ size = 14, color = "currentColor" }: { size?: number; color?: string }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>; }
function SearchIcon()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>; }
function CalSmIcon()   { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fg-subtle)" }}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>; }
function ClockSmIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fg-subtle)" }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>; }
function GuestSmIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fg-subtle)" }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>; }
function EmptyIcon()   { return <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fg-subtle)" }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>; }
function ChevLeftIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>; }
function ChevRightIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>; }
