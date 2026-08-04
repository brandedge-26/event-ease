"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";

type PaymentMethod = "Cash" | "Bank Transfer" | "Cheque" | "Online";
type PaymentStatus = "paid" | "partial" | "pending" | "overdue";

type Transaction = {
  id: string;
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  note: string;
  date: string;
};

type PaymentEntry = {
  bookingId: string;
  customerName: string;
  phone: string;
  event: string;
  hall: string;
  eventDate: string;
  totalAmount: number;
  paid: number;
  status: PaymentStatus;
  transactions: Transaction[];
};

type DbBooking = {
  id: string; vendorId: string; customerName: string; phone: string;
  event: string; hall: string; date: string; amount: number; hallAmount: number;
  paid: number; status: string; notes: string; payments: { id: string; bookingId: string; amount: number; method: PaymentMethod; note: string; date: string; }[];
};

const PAGE_SIZE = 6;

const STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; bg: string }> = {
  paid:    { label: "Paid",    color: "#16A34A", bg: "#F0FDF4" },
  partial: { label: "Partial", color: "var(--primary)", bg: "var(--primary-light)" },
  pending: { label: "Pending", color: "#D97706", bg: "#FFFBEB" },
  overdue: { label: "Overdue", color: "#DC2626", bg: "#FEF2F2" },
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

const today = new Date().toISOString().slice(0, 10);

function deriveStatus(amount: number, paid: number, eventDate: string): PaymentStatus {
  if (amount > 0 && paid >= amount) return "paid";
  const isPast = eventDate < today;
  if (paid > 0 && isPast) return "overdue";
  if (paid > 0) return "partial";
  if (isPast && amount > 0) return "overdue";
  return "pending";
}

function dbToEntry(b: DbBooking): PaymentEntry {
  return {
    bookingId:   b.id,
    customerName: b.customerName,
    phone:        b.phone,
    event:        b.event,
    hall:         b.hall,
    eventDate:    b.date,
    totalAmount:  b.amount,
    paid:         b.paid,
    status:       deriveStatus(b.amount, b.paid, b.date),
    transactions: (b.payments ?? []).map(p => ({
      id:        p.id,
      bookingId: p.bookingId,
      amount:    p.amount,
      method:    p.method,
      note:      p.note ?? "",
      date:      p.date ?? "",
    })),
  };
}

function fmt(n: number) { return "Rs. " + n.toLocaleString("en-PK"); }
function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Record Payment Modal ─────────────────────────────────────────────────────
function RecordPaymentModal({ entry, onClose, onSuccess }: {
  entry: PaymentEntry;
  onClose: () => void;
  onSuccess: (tx: Transaction, newPaid: number) => void;
}) {
  const { accessToken } = useAuthStore();
  const balance  = entry.totalAmount - entry.paid;
  const [amount, setAmount] = useState(String(balance > 0 ? balance : ""));
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [note,   setNote]   = useState("");
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    setSaving(true); setErr("");
    try {
      const payDate = today;
      const res = await api.post<{ id: string; newPaid: number }>(
        `/api/vendor/bookings/${entry.bookingId}/payments`,
        { amount: amt, method, note: note || undefined, date: payDate },
        accessToken ?? undefined,
      );
      if (!res.success) { setErr((res as { message?: string }).message ?? "Failed"); return; }
      onSuccess(
        { id: res.id, bookingId: entry.bookingId, amount: amt, method, note: note ?? "", date: payDate },
        res.newPaid,
      );
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
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{entry.customerName} · {entry.event}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer hover:bg-gray-100" style={{ color: "var(--fg-muted)" }}><XIcon /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
          {entry.totalAmount > 0 && (
            <div className="flex items-center justify-between p-4 rounded-2xl" style={{ background: "#FFFBEB", border: "1px solid #FCD34D" }}>
              <div>
                <p className="text-xs font-medium" style={{ color: "#D97706" }}>Balance Due</p>
                <p className="text-lg font-bold text-black mt-0.5">{fmt(balance)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium" style={{ color: "var(--fg-muted)" }}>Total</p>
                <p className="text-sm font-semibold text-black mt-0.5">{fmt(entry.totalAmount)}</p>
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

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function PaymentDetail({ p, onClose, onRecord, onFullPaid, onDeleteTx }: {
  p: PaymentEntry;
  onClose: () => void;
  onRecord: (p: PaymentEntry) => void;
  onFullPaid: (p: PaymentEntry) => void;
  onDeleteTx: (bookingId: string, txId: string) => void;
}) {
  const balance = p.totalAmount - p.paid;
  const paidPct = p.totalAmount > 0 ? Math.min(100, Math.round((p.paid / p.totalAmount) * 100)) : 0;
  const cfg     = STATUS_CONFIG[p.status];
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "#F4F4F5" }}>
        <div>
          <p className="text-sm font-bold text-black">{p.customerName}</p>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer hover:bg-gray-100" style={{ color: "var(--fg-muted)" }}><XIcon /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
        {/* Customer */}
        <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: "var(--bg-subtle)" }}>
          <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white shrink-0" style={{ background: "var(--primary)" }}>
            {p.customerName[0]}
          </div>
          <div>
            <p className="text-sm font-semibold text-black">{p.customerName}</p>
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{p.phone || "—"}</p>
          </div>
        </div>

        {/* Event Info */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-subtle)" }}>Event</p>
          <div className="flex flex-col gap-0">
            {[
              { label: "Event",      value: p.event },
              { label: "Hall",       value: p.hall },
              { label: "Event Date", value: formatDate(p.eventDate) },
            ].map((row, i) => (
              <div key={row.label} className={`flex items-center justify-between py-2.5 ${i !== 2 ? "border-b" : ""}`} style={{ borderColor: "#F4F4F5" }}>
                <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{row.label}</span>
                <span className="text-sm font-semibold text-black">{row.value}</span>
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
              {p.transactions.map(t => (
                <div key={t.id} className="flex items-center justify-between px-3 py-3 rounded-xl" style={{ background: "var(--bg-subtle)", border: "1px solid #E5E7EB" }}>
                  <div>
                    <p className="text-sm font-semibold text-black">{fmt(t.amount)}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{formatDate(t.date)}{t.note ? ` · ${t.note}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: METHOD_CONFIG[t.method]?.bg ?? "#F4F4F5", color: METHOD_CONFIG[t.method]?.color ?? "var(--fg)" }}>
                      {t.method}
                    </span>
                    {deletingTxId === t.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => { onDeleteTx(p.bookingId, t.id); setDeletingTxId(null); }} className="text-[10px] font-bold px-2 py-1 rounded-lg cursor-pointer" style={{ background: "#DC2626", color: "#fff" }}>Yes</button>
                        <button onClick={() => setDeletingTxId(null)} className="text-[10px] font-bold px-2 py-1 rounded-lg cursor-pointer" style={{ background: "#F4F4F5", color: "var(--fg)" }}>No</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeletingTxId(t.id)} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer hover:bg-red-50 transition-colors" style={{ color: "#DC2626" }}><TrashIcon size={12} /></button>
                    )}
                  </div>
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PaymentsPage() {
  const { accessToken } = useAuthStore();
  const [entries,      setEntries]      = useState<PaymentEntry[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [filter,       setFilter]       = useState<"all" | PaymentStatus>("all");
  const [search,       setSearch]       = useState("");
  const [page,         setPage]         = useState(1);
  const [selectedId,   setSelectedId]   = useState<string | null>(null);
  const [recordTarget, setRecordTarget] = useState<PaymentEntry | null>(null);
  const [fullPaidConfirm, setFullPaidConfirm] = useState<PaymentEntry | null>(null);
  const [savingFullPaid,  setSavingFullPaid]  = useState(false);

  // Fetch bookings → derive payment entries
  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    api.get<{ bookings: DbBooking[] }>("/api/vendor/bookings", accessToken)
      .then(res => {
        if (res.success) {
          const mapped = (res.bookings ?? [])
            .filter(b => b.status !== "blocked")
            .map(dbToEntry);
          setEntries(mapped);
        } else {
          setError("Failed to load payments");
        }
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const selected = selectedId ? entries.find(e => e.bookingId === selectedId) ?? null : null;

  const filtered = entries.filter(e => {
    const matchFilter = filter === "all" || e.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      e.customerName.toLowerCase().includes(q) ||
      e.event.toLowerCase().includes(q) ||
      e.hall.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function changeFilter(v: "all" | PaymentStatus) { setFilter(v); setPage(1); }
  function changeSearch(v: string) { setSearch(v); setPage(1); }

  const counts = {
    all:     entries.length,
    paid:    entries.filter(e => e.status === "paid").length,
    partial: entries.filter(e => e.status === "partial").length,
    pending: entries.filter(e => e.status === "pending").length,
    overdue: entries.filter(e => e.status === "overdue").length,
  };

  const totalRevenue   = entries.reduce((s, e) => s + e.totalAmount, 0);
  const totalCollected = entries.reduce((s, e) => s + e.paid, 0);
  const totalBalance   = totalRevenue - totalCollected;
  const overdueAmt     = entries.filter(e => e.status === "overdue").reduce((s, e) => s + (e.totalAmount - e.paid), 0);

  function openDetail(e: PaymentEntry) { setSelectedId(e.bookingId); }
  function closeSidebar()              { setSelectedId(null); }

  function handleRecordSuccess(tx: Transaction, newPaid: number) {
    setEntries(prev => prev.map(e => {
      if (e.bookingId !== tx.bookingId) return e;
      const updated: PaymentEntry = { ...e, paid: newPaid, transactions: [...e.transactions, tx] };
      updated.status = deriveStatus(updated.totalAmount, updated.paid, updated.eventDate);
      return updated;
    }));
  }

  async function handleFullPaid(entry: PaymentEntry) {
    const balance = entry.totalAmount - entry.paid;
    if (balance <= 0) return;
    setSavingFullPaid(true);
    try {
      const res = await api.post<{ id: string; newPaid: number }>(
        `/api/vendor/bookings/${entry.bookingId}/payments`,
        { amount: balance, method: "Cash", note: "Full payment", date: today },
        accessToken ?? undefined,
      );
      if (res.success) {
        const tx: Transaction = { id: res.id, bookingId: entry.bookingId, amount: balance, method: "Cash", note: "Full payment", date: today };
        handleRecordSuccess(tx, res.newPaid);
      }
    } catch { /* ignore */ }
    finally { setSavingFullPaid(false); setFullPaidConfirm(null); }
  }

  async function handleDeleteTx(bookingId: string, txId: string) {
    const snap = entries;
    // Optimistic
    setEntries(prev => prev.map(e => {
      if (e.bookingId !== bookingId) return e;
      const tx = e.transactions.find(t => t.id === txId);
      if (!tx) return e;
      const newPaid = Math.max(0, e.paid - tx.amount);
      const updated: PaymentEntry = { ...e, paid: newPaid, transactions: e.transactions.filter(t => t.id !== txId) };
      updated.status = deriveStatus(updated.totalAmount, updated.paid, updated.eventDate);
      return updated;
    }));
    try {
      const res = await api.delete(`/api/vendor/bookings/${bookingId}/payments/${txId}`, accessToken ?? undefined);
      if (!res.success) setEntries(snap);
    } catch { setEntries(snap); }
  }

  const sidebarOpen = !!selected;

  return (
    <>
      {/* Record Payment Modal */}
      {recordTarget && (
        <RecordPaymentModal
          entry={recordTarget}
          onClose={() => setRecordTarget(null)}
          onSuccess={handleRecordSuccess}
        />
      )}

      {/* Full Paid Confirmation */}
      {fullPaidConfirm && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setFullPaidConfirm(null)} />
          <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl p-6 w-[320px] shadow-2xl">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#F0FDF4" }}>
              <CollectedIcon />
            </div>
            <p className="text-base font-bold text-black text-center">Mark as Full Paid?</p>
            <p className="text-sm text-center mt-1 mb-5" style={{ color: "var(--fg-muted)" }}>
              <span className="font-semibold text-black">{fmt(fullPaidConfirm.totalAmount - fullPaidConfirm.paid)}</span> remaining balance record hoga.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setFullPaidConfirm(null)} className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer hover:opacity-80" style={{ background: "var(--bg-subtle)", color: "var(--fg)" }}>
                Cancel
              </button>
              <button onClick={() => handleFullPaid(fullPaidConfirm)} disabled={savingFullPaid} className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer hover:opacity-90 disabled:opacity-60" style={{ background: "#16A34A", color: "#fff" }}>
                {savingFullPaid ? "Saving…" : "Confirm"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Detail Drawer */}
      {sidebarOpen && selected && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={closeSidebar} />
          {/* Mobile: bottom sheet */}
          <div className="fixed z-50 bottom-0 left-0 right-0 rounded-t-3xl bg-white flex flex-col overflow-hidden lg:hidden" style={{ maxHeight: "92dvh", boxShadow: "0 -4px 40px rgba(0,0,0,0.12)" }}>
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ background: "#E5E7EB" }} />
            </div>
            <PaymentDetail
              p={selected}
              onClose={closeSidebar}
              onRecord={e => { closeSidebar(); setRecordTarget(e); }}
              onFullPaid={e => { closeSidebar(); setFullPaidConfirm(e); }}
              onDeleteTx={handleDeleteTx}
            />
          </div>
          {/* Desktop: right drawer */}
          <div className="hidden lg:flex fixed z-50 right-0 top-0 bottom-0 w-[480px] bg-white flex-col overflow-hidden rounded-l-3xl" style={{ boxShadow: "-4px 0 40px rgba(0,0,0,0.12)" }}>
            <PaymentDetail
              p={selected}
              onClose={closeSidebar}
              onRecord={e => setRecordTarget(e)}
              onFullPaid={e => setFullPaidConfirm(e)}
              onDeleteTx={handleDeleteTx}
            />
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
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-2xl text-sm font-medium flex items-center justify-between" style={{ background: "#FEF2F2", color: "#DC2626" }}>
            {error}
            <button onClick={() => setError(null)} className="ml-2 cursor-pointer" style={{ color: "#DC2626" }}><XIcon /></button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
                <div className="h-5 w-24 rounded mb-2" style={{ background: "#E5E7EB" }} />
                <div className="h-3 w-16 rounded" style={{ background: "#E5E7EB" }} />
              </div>
            ))
          ) : (
            [
              { label: "Total Sales",  value: fmt(totalRevenue),   color: "#000",    icon: <RevenueIcon /> },
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
            ))
          )}
        </div>

        <div className="flex flex-col gap-4">
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
                  <input value={search} onChange={e => changeSearch(e.target.value)} placeholder="Search customer, event, hall…"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none border"
                    style={{ background: "var(--bg-subtle)", borderColor: "#E5E7EB", color: "var(--fg)" }} />
                </div>
              </div>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-2">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-sm p-4 animate-pulse">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full" style={{ background: "#E5E7EB" }} />
                      <div className="flex-1">
                        <div className="h-3.5 w-32 rounded mb-1" style={{ background: "#E5E7EB" }} />
                        <div className="h-3 w-20 rounded" style={{ background: "#E5E7EB" }} />
                      </div>
                    </div>
                    <div className="h-2 rounded-full w-full" style={{ background: "#E5E7EB" }} />
                  </div>
                ))
              ) : paginated.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm py-16 flex flex-col items-center">
                  <EmptyIcon />
                  <p className="text-sm font-medium mt-3 text-black">No payments found</p>
                  <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>Try changing the filter or search</p>
                </div>
              ) : (
                paginated.map(e => {
                  const cfg     = STATUS_CONFIG[e.status];
                  const balance = e.totalAmount - e.paid;
                  const paidPct = e.totalAmount > 0 ? Math.min(100, Math.round((e.paid / e.totalAmount) * 100)) : 0;
                  return (
                    <div key={e.bookingId} className="bg-white rounded-2xl shadow-sm p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: "var(--primary)" }}>
                            {e.customerName[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-black truncate">{e.customerName}</p>
                            <p className="text-xs truncate" style={{ color: "var(--fg-muted)" }}>{e.phone || "—"}</p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>{e.hall}</span>
                        <span className="text-xs font-medium text-black">{e.event}</span>
                      </div>

                      <div className="flex items-center gap-1.5 mb-3">
                        <CalSmIcon />
                        <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Event: {formatDate(e.eventDate)}</span>
                      </div>

                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px]" style={{ color: "var(--fg-subtle)" }}>Paid {paidPct}%</span>
                          <span className="text-[10px]" style={{ color: "var(--fg-subtle)" }}>{fmt(e.paid)} / {fmt(e.totalAmount)}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full" style={{ background: "#E5E7EB" }}>
                          <div className="h-1.5 rounded-full" style={{ width: `${paidPct}%`, background: paidPct === 100 ? "#16A34A" : "var(--primary)" }} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2.5 border-t" style={{ borderColor: "#F4F4F5" }}>
                        <span className="text-xs font-semibold" style={{ color: balance > 0 ? (e.status === "overdue" ? "#DC2626" : "#D97706") : "#16A34A" }}>
                          {balance > 0 ? `Due: ${fmt(balance)}` : "Fully Paid"}
                        </span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openDetail(e)} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:bg-blue-50 transition-colors" style={{ color: "#2563EB" }}>
                            <EyeIcon />
                          </button>
                          {e.status !== "paid" && (
                            <button onClick={() => setRecordTarget(e)} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:bg-green-50 transition-colors" style={{ color: "#16A34A" }}>
                              <PlusIcon />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
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
function TrashIcon({ size = 14 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>; }
function SearchIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>; }
function CalSmIcon()     { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--fg-subtle)" }}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>; }
function EmptyIcon()     { return <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: "var(--fg-subtle)" }}><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>; }
function ChevLeftIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>; }
function ChevRightIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>; }
function RevenueIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>; }
function CollectedIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>; }
function BalanceIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>; }
function OverdueIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>; }
