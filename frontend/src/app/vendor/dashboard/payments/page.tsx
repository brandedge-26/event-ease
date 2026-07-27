"use client";

import { useState } from "react";
import { useStore, Payment, PaymentMethod, PaymentStatus } from "@/store/useStore";

const PAGE_SIZE = 6;

const STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; bg: string }> = {
  paid:     { label: "Paid",     color: "#16A34A", bg: "#F0FDF4" },
  partial:  { label: "Partial",  color: "var(--primary)", bg: "var(--primary-light)" },
  pending:  { label: "Pending",  color: "#D97706", bg: "#FFFBEB" },
  overdue:  { label: "Overdue",  color: "#DC2626", bg: "#FEF2F2" },
};

const HALL_COLOR: Record<string, string> = {
  "Hall A": "var(--primary)", "Hall B": "#2563EB", "Hall C": "#7C3AED",
};
const HALL_BG: Record<string, string> = {
  "Hall A": "var(--primary-light)", "Hall B": "#EFF6FF", "Hall C": "#F5F3FF",
};
const METHOD_CONFIG: Record<PaymentMethod, { color: string; bg: string }> = {
  "Cash":          { color: "#16A34A", bg: "#F0FDF4" },
  "Bank Transfer": { color: "#2563EB", bg: "#EFF6FF" },
  "Cheque":        { color: "#7C3AED", bg: "#F5F3FF" },
  "Online":        { color: "var(--primary)", bg: "var(--primary-light)" },
};

const FILTER_TABS: { label: string; value: "all" | PaymentStatus }[] = [
  { label: "All",     value: "all" },
  { label: "Paid",    value: "paid" },
  { label: "Partial", value: "partial" },
  { label: "Pending", value: "pending" },
  { label: "Overdue", value: "overdue" },
];

const HALLS       = ["Hall A", "Hall B", "Hall C"];
const EVENT_TYPES = ["Wedding", "Engagement", "Birthday Party", "Corporate Event", "Anniversary", "Conference", "Other"];

function fmt(n: number) { return "Rs. " + n.toLocaleString("en-PK"); }
function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Add Payment Modal ────────────────────────────────────────────────────────
function AddPaymentModal({ onClose, onAdd }: { onClose: () => void; onAdd: (p: Payment) => void }) {
  const [customerName, setCustomerName] = useState("");
  const [phone,        setPhone]        = useState("");
  const [bookingId,    setBookingId]    = useState("");
  const [event,        setEvent]        = useState(EVENT_TYPES[0]);
  const [hall,         setHall]         = useState(HALLS[0]);
  const [eventDate,    setEventDate]    = useState("");
  const [dueDate,      setDueDate]      = useState("");
  const [totalAmount,  setTotalAmount]  = useState("");
  const [paidNow,      setPaidNow]      = useState("");
  const [method,       setMethod]       = useState<PaymentMethod>("Cash");
  const [note,         setNote]         = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const total = Number(totalAmount);
    const paid  = Number(paidNow) || 0;
    if (!total || total <= 0) return;
    const safePaid = Math.min(paid, total);
    const status: PaymentStatus = safePaid >= total ? "paid" : safePaid > 0 ? "partial" : "pending";
    onAdd({
      id: "PAY-" + String(Date.now()).slice(-4),
      bookingId: bookingId || "—",
      customerName, phone, event, hall, eventDate, dueDate,
      totalAmount: total, paid: safePaid, status,
      transactions: safePaid > 0
        ? [{ date: new Date().toISOString().slice(0, 10), amount: safePaid, method, note }]
        : [],
    });
    onClose();
  }

  const inp = "px-4 py-3 rounded-xl border text-sm outline-none w-full";
  const inpStyle = { background: "var(--bg-subtle)", borderColor: "#D1D5DB", color: "var(--fg)" };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed z-50 bottom-0 left-0 right-0 rounded-t-3xl bg-white flex flex-col lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:right-auto lg:w-[480px] lg:rounded-3xl overflow-hidden" style={{ maxHeight: "92dvh", boxShadow: "0 -4px 40px rgba(0,0,0,0.12)" }}>
        <div className="flex justify-center pt-3 pb-1 lg:hidden shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "#E5E7EB" }} />
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "#F4F4F5" }}>
          <p className="text-sm font-bold text-black">Add Payment</p>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer hover:bg-gray-100" style={{ color: "var(--fg-muted)" }}><XIcon /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Customer Info</p>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Customer Name *</label>
                <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. Ahmed Khan" className={inp} style={inpStyle} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Phone</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0300-1234567" className={inp} style={inpStyle} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Booking ID</label>
                  <input value={bookingId} onChange={e => setBookingId(e.target.value)} placeholder="BK-001" className={inp} style={inpStyle} />
                </div>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Event Details</p>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Event Type *</label>
                  <select value={event} onChange={e => setEvent(e.target.value)} className={inp} style={inpStyle} required>
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Hall *</label>
                  <select value={hall} onChange={e => setHall(e.target.value)} className={inp} style={inpStyle} required>
                    {HALLS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Event Date</label>
                  <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className={inp} style={inpStyle} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Due Date</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inp} style={inpStyle} />
                </div>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Payment</p>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Total Amount *</label>
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl border" style={{ background: "var(--bg-subtle)", borderColor: "#D1D5DB" }}>
                    <span className="text-sm font-semibold shrink-0" style={{ color: "var(--fg-muted)" }}>Rs.</span>
                    <input type="number" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} placeholder="0" min={1} className="flex-1 bg-transparent outline-none text-sm font-semibold text-black w-0" required />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Paying Now</label>
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl border" style={{ background: "var(--bg-subtle)", borderColor: "#D1D5DB" }}>
                    <span className="text-sm font-semibold shrink-0" style={{ color: "var(--fg-muted)" }}>Rs.</span>
                    <input type="number" value={paidNow} onChange={e => setPaidNow(e.target.value)} placeholder="0" min={0} className="flex-1 bg-transparent outline-none text-sm font-semibold text-black w-0" />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Payment Method</label>
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
                <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Advance payment" className={inp} style={inpStyle} />
              </div>
            </div>
          </div>
          <button type="submit" className="w-full py-3.5 rounded-2xl text-sm font-bold cursor-pointer transition-opacity hover:opacity-90 mt-1" style={{ background: "var(--primary)", color: "#ffffff" }}>
            Add Payment
          </button>
        </form>
      </div>
    </>
  );
}

// ─── Record Payment Modal ─────────────────────────────────────────────────────
function RecordPaymentModal({ payment, onClose, onRecord }: {
  payment: Payment;
  onClose: () => void;
  onRecord: (id: string, amount: number, method: PaymentMethod, note: string) => void;
}) {
  const balance = payment.totalAmount - payment.paid;
  const [amount, setAmount] = useState(String(balance));
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [note,   setNote]   = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    onRecord(payment.id, Math.min(amt, balance), method, note);
    onClose();
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
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{payment.customerName} · {payment.bookingId}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer hover:bg-gray-100" style={{ color: "var(--fg-muted)" }}><XIcon /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
          <div className="flex items-center justify-between p-4 rounded-2xl" style={{ background: "#FFFBEB", border: "1px solid #FCD34D" }}>
            <div>
              <p className="text-xs font-medium" style={{ color: "#D97706" }}>Balance Due</p>
              <p className="text-lg font-bold text-black mt-0.5">{fmt(balance)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium" style={{ color: "var(--fg-muted)" }}>Total</p>
              <p className="text-sm font-semibold text-black mt-0.5">{fmt(payment.totalAmount)}</p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Amount *</label>
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl border" style={{ background: "var(--bg-subtle)", borderColor: "#D1D5DB" }}>
              <span className="text-sm font-semibold" style={{ color: "var(--fg-muted)" }}>Rs.</span>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="flex-1 bg-transparent outline-none text-sm font-semibold text-black" placeholder="0" min={1} max={balance} required />
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
          <button type="submit" className="w-full py-3.5 rounded-2xl text-sm font-bold cursor-pointer transition-opacity hover:opacity-90 mt-1" style={{ background: "var(--primary)", color: "#ffffff" }}>
            Record Payment
          </button>
        </form>
      </div>
    </>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function PaymentDetail({ p, onClose, onRecord, onEdit, onFullPaid }: {
  p: Payment;
  onClose: () => void;
  onRecord: (p: Payment) => void;
  onEdit: () => void;
  onFullPaid: (p: Payment) => void;
}) {
  const balance = p.totalAmount - p.paid;
  const paidPct = p.totalAmount > 0 ? Math.min(100, Math.round((p.paid / p.totalAmount) * 100)) : 0;
  const cfg     = STATUS_CONFIG[p.status];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "#F4F4F5" }}>
        <div>
          <p className="text-sm font-bold text-black">{p.id}</p>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer hover:bg-amber-50 transition-colors" style={{ color: "#D97706" }}><EditIcon /></button>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer hover:bg-gray-100" style={{ color: "var(--fg-muted)" }}><XIcon /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
        {/* Customer */}
        <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: "var(--bg-subtle)" }}>
          <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white shrink-0" style={{ background: HALL_COLOR[p.hall] || "var(--primary)" }}>
            {p.customerName[0]}
          </div>
          <div>
            <p className="text-sm font-semibold text-black">{p.customerName}</p>
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{p.phone}</p>
          </div>
          <span className="ml-auto text-xs font-mono font-medium px-2 py-1 rounded-lg" style={{ background: "#F4F4F5", color: "var(--fg-muted)" }}>{p.bookingId}</span>
        </div>

        {/* Event */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Event</p>
          <div className="flex flex-col gap-0">
            {[
              { label: "Event",      value: p.event, badge: false },
              { label: "Hall",       value: p.hall,  badge: true },
              { label: "Event Date", value: formatDate(p.eventDate), badge: false },
              { label: "Due Date",   value: formatDate(p.dueDate),   badge: false },
            ].map((row, i) => (
              <div key={row.label} className={`flex items-center justify-between py-2.5 ${i !== 3 ? "border-b" : ""}`} style={{ borderColor: "#F4F4F5" }}>
                <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{row.label}</span>
                {row.badge
                  ? <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: HALL_BG[p.hall], color: HALL_COLOR[p.hall] }}>{row.value}</span>
                  : <span className="text-sm font-semibold text-black">{row.value}</span>
                }
              </div>
            ))}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="rounded-2xl p-4" style={{ background: "var(--bg-subtle)" }}>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Payment Summary</p>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Progress</span>
            <span className="text-xs font-semibold" style={{ color: paidPct === 100 ? "#16A34A" : "var(--primary)" }}>{paidPct}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full mb-4" style={{ background: "#E5E7EB" }}>
            <div className="h-2.5 rounded-full transition-all" style={{ width: `${paidPct}%`, background: paidPct === 100 ? "#16A34A" : "var(--primary)" }} />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Total Amount</span>
              <span className="text-sm font-bold text-black">{fmt(p.totalAmount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Paid</span>
              <span className="text-sm font-semibold" style={{ color: "#16A34A" }}>{fmt(p.paid)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "#E5E7EB" }}>
              <span className="text-xs font-bold" style={{ color: "var(--fg-muted)" }}>Balance Due</span>
              <span className="text-sm font-bold" style={{ color: balance > 0 ? "#D97706" : "#16A34A" }}>{fmt(balance)}</span>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--fg-subtle)" }}>Transaction History</p>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: p.transactions.length > 0 ? "var(--primary-light)" : "var(--bg-subtle)", color: p.transactions.length > 0 ? "var(--primary)" : "var(--fg-muted)" }}>
              {p.transactions.length}
            </span>
          </div>
          {p.transactions.length === 0 ? (
            <p className="text-xs text-center py-4 rounded-xl" style={{ color: "var(--fg-muted)", background: "var(--bg-subtle)" }}>No transactions yet</p>
          ) : (
            <div className="flex flex-col gap-2">
              {p.transactions.map((t, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-3 rounded-xl" style={{ background: "var(--bg-subtle)", border: "1px solid #E5E7EB" }}>
                  <div>
                    <p className="text-sm font-semibold text-black">{fmt(t.amount)}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{formatDate(t.date)}{t.note ? ` · ${t.note}` : ""}</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: METHOD_CONFIG[t.method].bg, color: METHOD_CONFIG[t.method].color }}>
                    {t.method}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {p.status !== "paid" && (
          <div className="flex gap-2">
            <button
              onClick={() => onFullPaid(p)}
              className="flex-1 py-3.5 rounded-2xl text-sm font-bold cursor-pointer transition-opacity hover:opacity-90"
              style={{ background: "#16A34A", color: "#ffffff" }}
            >
              Full Paid
            </button>
            <button
              onClick={() => onRecord(p)}
              className="flex-1 py-3.5 rounded-2xl text-sm font-bold cursor-pointer transition-opacity hover:opacity-90"
              style={{ background: "var(--primary)", color: "#ffffff" }}
            >
              + Add Payment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Edit Panel ───────────────────────────────────────────────────────────────
function PaymentEditPanel({ payment, onClose, onSave }: { payment: Payment; onClose: () => void; onSave: (p: Payment) => void }) {
  const [customerName, setCustomerName] = useState(payment.customerName);
  const [phone,        setPhone]        = useState(payment.phone);
  const [bookingId,    setBookingId]    = useState(payment.bookingId);
  const [event,        setEvent]        = useState(payment.event);
  const [hall,         setHall]         = useState(payment.hall);
  const [eventDate,    setEventDate]    = useState(payment.eventDate);
  const [dueDate,      setDueDate]      = useState(payment.dueDate);
  const [totalAmount,  setTotalAmount]  = useState(String(payment.totalAmount));

  const inp = "px-4 py-3 rounded-xl border text-sm outline-none w-full";
  const inpStyle = { background: "var(--bg-subtle)", borderColor: "#D1D5DB", color: "var(--fg)" };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const total = Number(totalAmount);
    if (!total || total <= 0) return;
    const newStatus: PaymentStatus = payment.paid >= total ? "paid" : payment.paid > 0 ? "partial" : payment.status === "overdue" ? "overdue" : "pending";
    onSave({ ...payment, customerName, phone, bookingId, event, hall, eventDate, dueDate, totalAmount: total, status: newStatus });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "#F4F4F5" }}>
        <div>
          <p className="text-sm font-bold text-black">Edit Payment</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{payment.id}</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer hover:bg-gray-100" style={{ color: "var(--fg-muted)" }}><XIcon /></button>
      </div>
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Customer Info</p>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Customer Name *</label>
              <input value={customerName} onChange={e => setCustomerName(e.target.value)} className={inp} style={inpStyle} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Phone</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} className={inp} style={inpStyle} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Booking ID</label>
                <input value={bookingId} onChange={e => setBookingId(e.target.value)} className={inp} style={inpStyle} />
              </div>
            </div>
          </div>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Event Details</p>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Event Type</label>
                <select value={event} onChange={e => setEvent(e.target.value)} className={inp} style={inpStyle}>
                  {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Hall</label>
                <select value={hall} onChange={e => setHall(e.target.value)} className={inp} style={inpStyle}>
                  {HALLS.map(h => <option key={h}>{h}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Event Date</label>
                <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className={inp} style={inpStyle} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Due Date</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inp} style={inpStyle} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Total Amount *</label>
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border" style={{ background: "var(--bg-subtle)", borderColor: "#D1D5DB" }}>
            <span className="text-sm font-semibold" style={{ color: "var(--fg-muted)" }}>Rs.</span>
            <input type="number" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} min={1} className="flex-1 bg-transparent outline-none text-sm font-semibold text-black" required />
          </div>
        </div>
        <button type="submit" className="w-full py-3.5 rounded-2xl text-sm font-bold cursor-pointer transition-opacity hover:opacity-90" style={{ background: "var(--primary)", color: "#ffffff" }}>
          Save Changes
        </button>
      </form>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PaymentsPage() {
  const { payments, recordPayment: storeRecordPayment, addStandalonePayment, updatePaymentDetails, deletePayment: storeDeletePayment } = useStore();
  const [filter,       setFilter]       = useState<"all" | PaymentStatus>("all");
  const [search,       setSearch]       = useState("");
  const [page,         setPage]         = useState(1);
  const [selectedId,   setSelectedId]   = useState<string | null>(null);
  const [sidebarMode,  setSidebarMode]  = useState<"detail" | "edit" | null>(null);
  const [recordTargetId, setRecordTargetId] = useState<string | null>(null);
  const [addModalOpen,   setAddModalOpen]   = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const selected     = selectedId     ? payments.find(p => p.id === selectedId)     ?? null : null;
  const recordTarget = recordTargetId ? payments.find(p => p.id === recordTargetId) ?? null : null;
  const deleteTarget = deleteTargetId ? payments.find(p => p.id === deleteTargetId) ?? null : null;

  const filtered = payments.filter(p => {
    const matchFilter = filter === "all" || p.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      p.customerName.toLowerCase().includes(q) ||
      p.event.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.bookingId.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function changeFilter(v: "all" | PaymentStatus) { setFilter(v); setPage(1); }
  function changeSearch(v: string) { setSearch(v); setPage(1); }

  const counts = {
    all:     payments.length,
    paid:    payments.filter(p => p.status === "paid").length,
    partial: payments.filter(p => p.status === "partial").length,
    pending: payments.filter(p => p.status === "pending").length,
    overdue: payments.filter(p => p.status === "overdue").length,
  };

  const totalRevenue   = payments.reduce((s, p) => s + p.totalAmount, 0);
  const totalCollected = payments.reduce((s, p) => s + p.paid, 0);
  const totalBalance   = totalRevenue - totalCollected;
  const overdueAmt     = payments.filter(p => p.status === "overdue").reduce((s, p) => s + (p.totalAmount - p.paid), 0);

  function openDetail(p: Payment) { setSelectedId(p.id); setSidebarMode("detail"); }
  function openEdit(p: Payment)   { setSelectedId(p.id); setSidebarMode("edit"); }
  function closeSidebar()         { setSidebarMode(null); setSelectedId(null); }

  function handleRecord(id: string, amount: number, method: PaymentMethod, note: string) {
    storeRecordPayment(id, amount, method, note);
  }
  function handleAdd(p: Payment)        { addStandalonePayment(p); setPage(1); }
  function handleEdit(updated: Payment) { updatePaymentDetails(updated); setSidebarMode("detail"); }
  function handleDelete(id: string)     {
    storeDeletePayment(id);
    setDeleteTargetId(null);
    if (selectedId === id) closeSidebar();
  }

  const sidebarOpen = !!selected && !!sidebarMode;

  return (
    <>
      {/* Add Payment Modal */}
      {addModalOpen && <AddPaymentModal onClose={() => setAddModalOpen(false)} onAdd={handleAdd} />}

      {/* Record Payment Modal */}
      {recordTarget && <RecordPaymentModal payment={recordTarget} onClose={() => setRecordTargetId(null)} onRecord={handleRecord} />}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTargetId(null)} />
          <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl p-6 w-[320px] shadow-2xl">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#FEF2F2" }}>
              <TrashIcon size={20} color="#DC2626" />
            </div>
            <p className="text-base font-bold text-black text-center">Delete Payment?</p>
            <p className="text-sm text-center mt-1 mb-5" style={{ color: "var(--fg-muted)" }}>
              <span className="font-semibold text-black">{deleteTarget.customerName}</span> ka payment record hamesha k liye delete ho jayega.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTargetId(null)} className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer hover:opacity-80" style={{ background: "var(--bg-subtle)", color: "var(--fg)" }}>
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteTarget.id)} className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer hover:opacity-90" style={{ background: "#DC2626", color: "#fff" }}>
                Delete
              </button>
            </div>
          </div>
        </>
      )}

      {/* Drawer (detail / edit) */}
      {sidebarOpen && selected && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={closeSidebar} />
          {/* Mobile: bottom sheet */}
          <div className="fixed z-50 bottom-0 left-0 right-0 rounded-t-3xl bg-white flex flex-col overflow-hidden lg:hidden" style={{ maxHeight: "92dvh", boxShadow: "0 -4px 40px rgba(0,0,0,0.12)" }}>
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ background: "#E5E7EB" }} />
            </div>
            {sidebarMode === "detail"
              ? <PaymentDetail p={selected} onClose={closeSidebar} onRecord={p => { closeSidebar(); setRecordTargetId(p.id); }} onEdit={() => setSidebarMode("edit")} onFullPaid={p => { storeRecordPayment(p.id, p.totalAmount - p.paid, "Cash", "Full payment"); closeSidebar(); }} />
              : <PaymentEditPanel payment={selected} onClose={closeSidebar} onSave={handleEdit} />
            }
          </div>
          {/* Desktop: right drawer */}
          <div className="hidden lg:flex fixed z-50 right-0 top-0 bottom-0 w-[480px] bg-white flex-col overflow-hidden rounded-l-3xl" style={{ boxShadow: "-4px 0 40px rgba(0,0,0,0.12)" }}>
            {sidebarMode === "detail"
              ? <PaymentDetail p={selected} onClose={closeSidebar} onRecord={p => setRecordTargetId(p.id)} onEdit={() => setSidebarMode("edit")} onFullPaid={p => { storeRecordPayment(p.id, p.totalAmount - p.paid, "Cash", "Full payment"); }} />
              : <PaymentEditPanel payment={selected} onClose={closeSidebar} onSave={handleEdit} />
            }
          </div>
        </>
      )}

      <div className="p-4 lg:p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl lg:text-2xl font-semibold text-black tracking-tight">Payments</h1>
            <p className="text-sm mt-1" style={{ color: "var(--fg-muted)" }}>Track and record all payments</p>
          </div>
          <button onClick={() => setAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90" style={{ background: "var(--primary)", color: "#ffffff" }}>
            <PlusIcon /> Add Payment
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Revenue",  value: fmt(totalRevenue),   color: "#000", icon: <RevenueIcon /> },
            { label: "Collected",      value: fmt(totalCollected), color: "#16A34A", icon: <CollectedIcon /> },
            { label: "Balance Due",    value: fmt(totalBalance),   color: "#D97706", icon: <BalanceIcon /> },
            { label: "Overdue",        value: fmt(overdueAmt),     color: "#DC2626", icon: <OverdueIcon /> },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: "var(--fg-muted)" }}>{s.icon}</span>
              </div>
              <p className="text-base lg:text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4">

          {/* List */}
          <div className="flex flex-col gap-4">

            {/* Filter + Search */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex border-b overflow-x-auto" style={{ borderColor: "#F4F4F5" }}>
                {FILTER_TABS.map(t => (
                  <button key={t.value} onClick={() => changeFilter(t.value)}
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
                  <input value={search} onChange={e => changeSearch(e.target.value)} placeholder="Search customer, event, payment ID..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none border"
                    style={{ background: "var(--bg-subtle)", borderColor: "#E5E7EB", color: "var(--fg)" }} />
                </div>
              </div>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-2">
              {paginated.length === 0 && (
                <div className="bg-white rounded-2xl shadow-sm py-16 flex flex-col items-center">
                  <EmptyIcon />
                  <p className="text-sm font-medium mt-3 text-black">No payments found</p>
                  <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>Try changing the filter or search</p>
                </div>
              )}
              {paginated.map(p => {
                const cfg     = STATUS_CONFIG[p.status];
                const balance = p.totalAmount - p.paid;
                const paidPct = p.totalAmount > 0 ? Math.min(100, Math.round((p.paid / p.totalAmount) * 100)) : 0;
                return (
                  <div key={p.id} className="bg-white rounded-2xl shadow-sm p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: HALL_COLOR[p.hall] || "var(--primary)" }}>
                          {p.customerName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-black truncate">{p.customerName}</p>
                          <p className="text-xs truncate" style={{ color: "var(--fg-muted)" }}>{p.phone}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: HALL_BG[p.hall] || "var(--primary-light)", color: HALL_COLOR[p.hall] || "var(--primary)" }}>{p.hall}</span>
                      <span className="text-xs font-medium text-black">{p.event}</span>
                    </div>

                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mb-3">
                      <div className="flex items-center gap-1.5">
                        <CalSmIcon />
                        <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Event: {formatDate(p.eventDate)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DueIcon />
                        <span className="text-xs" style={{ color: p.status === "overdue" ? "#DC2626" : "var(--fg-muted)", fontWeight: p.status === "overdue" ? 600 : 400 }}>
                          Due: {formatDate(p.dueDate)}
                        </span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px]" style={{ color: "var(--fg-subtle)" }}>Paid {paidPct}%</span>
                        <span className="text-[10px]" style={{ color: "var(--fg-subtle)" }}>{fmt(p.paid)} / {fmt(p.totalAmount)}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full" style={{ background: "#E5E7EB" }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${paidPct}%`, background: paidPct === 100 ? "#16A34A" : "var(--primary)" }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t" style={{ borderColor: "#F4F4F5" }}>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono font-medium" style={{ color: "var(--fg-subtle)" }}>{p.id}</span>
                        <span className="text-xs font-semibold" style={{ color: balance > 0 ? (p.status === "overdue" ? "#DC2626" : "#D97706") : "#16A34A" }}>
                          {balance > 0 ? `Due: ${fmt(balance)}` : "Fully Paid"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openDetail(p)} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:bg-blue-50 transition-colors" style={{ color: "#2563EB" }}>
                          <EyeIcon />
                        </button>
                        <button onClick={() => openEdit(p)} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:bg-amber-50 transition-colors" style={{ color: "#D97706" }}>
                          <EditIcon />
                        </button>
                        <button onClick={() => setDeleteTargetId(p.id)} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:bg-red-50 transition-colors" style={{ color: "#DC2626" }}>
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
              <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm px-4 py-3">
                <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                  Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-30 hover:bg-gray-100"
                    style={{ color: "var(--fg-muted)" }}><ChevLeftIcon /></button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <button key={n} onClick={() => setPage(n)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold cursor-pointer transition-colors"
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

        </div>
      </div>
    </>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function PlusIcon()      { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>; }
function XIcon()         { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>; }
function EyeIcon()       { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>; }
function EditIcon()      { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>; }
function TrashIcon({ size = 14, color = "currentColor" }: { size?: number; color?: string }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>; }
function SearchIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>; }
function CalSmIcon()     { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--fg-subtle)" }}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>; }
function DueIcon()       { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--fg-subtle)" }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>; }
function EmptyIcon()     { return <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: "var(--fg-subtle)" }}><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>; }
function ChevLeftIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>; }
function ChevRightIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>; }
function RevenueIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>; }
function CollectedIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>; }
function BalanceIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>; }
function OverdueIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>; }
