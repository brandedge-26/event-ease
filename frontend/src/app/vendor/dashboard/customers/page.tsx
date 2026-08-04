"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
type DbBooking = {
  id: string;
  customerName: string;
  phone: string;
  event: string;
  hall: string;
  date: string;
  timeFrom: string;
  timeTo: string;
  guests: number;
  amount: number;
  paid: number;
  notes: string;
  status: "confirmed" | "pending" | "cancelled" | "blocked";
};

type Customer = {
  name: string;
  phone: string;
  bookings: DbBooking[];
  totalSpent: number;
  totalPaid: number;
  lastEvent: string;
  lastDate: string;
  eventTypes: string[];
};

const PAGE_SIZE = 8;

// ─── Constants ────────────────────────────────────────────────────────────────
const INP   = "w-full px-4 py-3 rounded-2xl text-sm outline-none transition-all duration-200 border border-[#D1D5DB] focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-1";
const INP_S = { background: "var(--bg-subtle)", color: "var(--fg)" };

const STATUS_CFG = {
  confirmed: { label: "Confirmed", color: "#16A34A", bg: "#F0FDF4" },
  pending:   { label: "Pending",   color: "#D97706", bg: "#FFFBEB" },
  cancelled: { label: "Cancelled", color: "#DC2626", bg: "#FEF2F2" },
  blocked:   { label: "Blocked",   color: "#DC2626", bg: "#FEF2F2" },
} as const;

const EVENT_COLOR: Record<string, { color: string; bg: string }> = {
  Wedding:           { color: "#FF3B6B", bg: "#FFF0F4" },
  Engagement:        { color: "#7C3AED", bg: "#F5F3FF" },
  "Birthday Party":  { color: "#EA580C", bg: "#FFF7ED" },
  "Corporate Event": { color: "#2563EB", bg: "#EFF6FF" },
  Conference:        { color: "#0891B2", bg: "#F0F9FF" },
  Anniversary:       { color: "#16A34A", bg: "#F0FDF4" },
  Other:             { color: "#6B7280", bg: "#F9FAFB" },
};

function eventStyle(ev: string) {
  return EVENT_COLOR[ev] ?? { color: "#6B7280", bg: "#F9FAFB" };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function initials(name: string) {
  return name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
}

function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}

function fmt12h(t: string) {
  if (!t) return "—";
  if (/[AP]M/i.test(t)) return t;
  const [h, m] = t.split(":").map(Number);
  if (isNaN(h)) return "—";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function fmtRs(n: number) {
  return "Rs. " + n.toLocaleString("en-PK");
}

const AVATAR_PALETTES = [
  { bg: "#FFF0F4", color: "#FF3B6B" },
  { bg: "#EFF6FF", color: "#2563EB" },
  { bg: "#F5F3FF", color: "#7C3AED" },
  { bg: "#FFF7ED", color: "#EA580C" },
  { bg: "#F0FDF4", color: "#16A34A" },
  { bg: "#F0F9FF", color: "#0891B2" },
  { bg: "#FFFBEB", color: "#D97706" },
  { bg: "#FEF2F2", color: "#DC2626" },
];

function avatarPalette(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_PALETTES[h % AVATAR_PALETTES.length];
}

// ─── Date Filter Calendar ─────────────────────────────────────────────────────
const CAL_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const CAL_DAYS   = ["S","M","T","W","T","F","S"];

function toKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function DateFilterCalendar({
  selected, bookedDates, onSelect, onClear,
}: {
  selected: string | null;
  bookedDates: Set<string>;
  onSelect: (d: string) => void;
  onClear: () => void;
}) {
  const now = new Date();
  const [year,  setYear]  = useState(selected ? +selected.slice(0, 4) : now.getFullYear());
  const [month, setMonth] = useState(selected ? +selected.slice(5, 7) - 1 : now.getMonth());

  function prev() { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); }
  function next() { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); }

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev  = new Date(year, month, 0).getDate();
  const totalCells  = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const todayKey    = toKey(now.getFullYear(), now.getMonth(), now.getDate());

  const cells: { day: number; current: boolean; key: string }[] = [];
  for (let i = 0; i < totalCells; i++) {
    if (i < firstDay) {
      const d = daysInPrev - firstDay + 1 + i;
      cells.push({ day: d, current: false, key: toKey(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1, d) });
    } else if (i < firstDay + daysInMonth) {
      cells.push({ day: i - firstDay + 1, current: true, key: toKey(year, month, i - firstDay + 1) });
    } else {
      const d = i - firstDay - daysInMonth + 1;
      cells.push({ day: d, current: false, key: toKey(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1, d) });
    }
  }

  return (
    <div className="p-4 w-72">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer transition-colors" style={{ color: "#6B7280" }}>
          <ChevLeftIcon />
        </button>
        <span className="text-sm font-semibold" style={{ color: "#111827" }}>{CAL_MONTHS[month].slice(0, 3)} {year}</span>
        <button onClick={next} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer transition-colors" style={{ color: "#6B7280" }}>
          <ChevRightIcon />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {CAL_DAYS.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-bold py-1" style={{ color: "#9CA3AF" }}>{d}</div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((cell, i) => {
          const isSelected = cell.current && cell.key === selected;
          const isToday    = cell.current && cell.key === todayKey;
          const isBooked   = cell.current && bookedDates.has(cell.key);

          let bg        = "transparent";
          let textColor = cell.current ? "#111827" : "#D1D5DB";
          let fw: number | string = 400;

          if (isSelected)     { bg = "var(--primary)"; textColor = "#fff"; fw = 700; }
          else if (isToday)   { bg = "var(--primary-light)"; textColor = "var(--primary)"; fw = 700; }
          else if (isBooked)  { bg = "#F0FDF4"; textColor = "#16A34A"; fw = 600; }

          return (
            <div key={i} className="flex flex-col items-center py-0.5">
              <button
                onClick={() => cell.current && (isSelected ? onClear() : onSelect(cell.key))}
                disabled={!cell.current}
                className="w-7 h-7 flex items-center justify-center rounded-full text-[12px] transition-colors"
                style={{ background: bg, color: textColor, fontWeight: fw, cursor: cell.current ? "pointer" : "default" }}
              >
                {cell.day}
              </button>
              {isBooked && !isSelected && !isToday && (
                <span className="w-1 h-1 rounded-full mt-0.5" style={{ background: "#16A34A" }} />
              )}
              {!isBooked && <div className="h-1.5" />}
            </div>
          );
        })}
      </div>

      {/* Legend + Clear */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: "#F3F4F6" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: "#16A34A" }} />
            <span className="text-[10px]" style={{ color: "#9CA3AF" }}>Has bookings</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: "var(--primary)" }} />
            <span className="text-[10px]" style={{ color: "#9CA3AF" }}>Selected</span>
          </div>
        </div>
        {selected && (
          <button onClick={onClear} className="text-[11px] font-semibold cursor-pointer hover:opacity-70" style={{ color: "#DC2626" }}>
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────
function StatSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 lg:p-5 flex items-center gap-4 border animate-pulse" style={{ borderColor: "#E5E7EB" }}>
      <div className="w-11 h-11 rounded-2xl shrink-0" style={{ background: "#E5E7EB" }} />
      <div>
        <div className="h-6 w-20 rounded mb-1" style={{ background: "#E5E7EB" }} />
        <div className="h-3 w-28 rounded" style={{ background: "#F3F4F6" }} />
      </div>
    </div>
  );
}
function CustomerCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 flex items-center gap-4 border animate-pulse" style={{ borderColor: "#E5E7EB" }}>
      <div className="w-11 h-11 rounded-2xl shrink-0" style={{ background: "#E5E7EB" }} />
      <div className="flex-1">
        <div className="h-4 w-32 rounded mb-1.5" style={{ background: "#E5E7EB" }} />
        <div className="h-3 w-24 rounded mb-2" style={{ background: "#F3F4F6" }} />
        <div className="h-3 w-16 rounded" style={{ background: "#F3F4F6" }} />
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-4 lg:p-5 flex items-center gap-4 border" style={{ borderColor: "#E5E7EB" }}>
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold truncate" style={{ color: "#111827" }}>{value}</p>
        <p className="text-xs font-medium truncate" style={{ color: "#6B7280" }}>{label}</p>
      </div>
    </div>
  );
}

// ─── Customer Card ────────────────────────────────────────────────────────────
function CustomerCard({ customer, onClick }: { customer: Customer; onClick: () => void }) {
  const pal = avatarPalette(customer.name);
  const due = customer.totalSpent - customer.totalPaid;
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-4 flex items-center gap-4 border cursor-pointer transition-shadow hover:shadow-md"
      style={{ borderColor: "#E5E7EB" }}
    >
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold shrink-0" style={{ background: pal.bg, color: pal.color }}>
        {initials(customer.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold truncate" style={{ color: "#111827" }}>{customer.name}</p>
          {customer.bookings.length > 1 && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
              {customer.bookings.length}x
            </span>
          )}
        </div>
        <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{customer.phone || "—"}</p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {customer.eventTypes.slice(0, 2).map(ev => {
            const s = eventStyle(ev);
            return <span key={ev} className="text-[10px] font-semibold px-2 py-0.5 rounded-lg" style={{ background: s.bg, color: s.color }}>{ev}</span>;
          })}
          {customer.eventTypes.length > 2 && (
            <span className="text-[10px]" style={{ color: "#9CA3AF" }}>+{customer.eventTypes.length - 2}</span>
          )}
        </div>
      </div>
      <div className="text-right shrink-0 hidden sm:block">
        <p className="text-sm font-bold" style={{ color: "#111827" }}>{fmtRs(customer.totalSpent)}</p>
        {due > 0
          ? <p className="text-xs mt-0.5 font-medium" style={{ color: "#DC2626" }}>Due: {fmtRs(due)}</p>
          : <p className="text-xs mt-0.5 font-medium" style={{ color: "#16A34A" }}>Fully Paid</p>
        }
        <p className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>{fmtDate(customer.lastDate)}</p>
      </div>
      <ChevronIcon />
    </div>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────
function CustomerDrawer({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const pal = avatarPalette(customer.name);
  const due = customer.totalSpent - customer.totalPaid;

  // Filter out blocked bookings from history view
  const visibleBookings = customer.bookings.filter(b => b.status !== "blocked");

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <aside
        className="fixed top-0 right-0 h-full z-50 flex flex-col bg-white overflow-hidden"
        style={{ width: "min(460px, 100vw)", boxShadow: "-4px 0 24px rgba(0,0,0,0.10)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "#E5E7EB" }}>
          <h2 className="text-sm font-bold" style={{ color: "#111827" }}>Customer Profile</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors" style={{ color: "#6B7280" }}>
            <XIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {/* Profile Section */}
          <div className="px-5 py-6 border-b" style={{ borderColor: "#F3F4F6" }}>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0" style={{ background: pal.bg, color: pal.color }}>
                {initials(customer.name)}
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold" style={{ color: "#111827" }}>{customer.name}</p>
                <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>{customer.phone || "No phone"}</p>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {customer.eventTypes.slice(0, 3).map(ev => {
                    const s = eventStyle(ev);
                    return <span key={ev} className="text-[10px] font-semibold px-2 py-0.5 rounded-lg" style={{ background: s.bg, color: s.color }}>{ev}</span>;
                  })}
                </div>
              </div>
            </div>
            {customer.phone && (
              <div className="flex gap-2">
                <a href={`tel:${customer.phone}`}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold border transition-colors hover:bg-gray-50"
                  style={{ borderColor: "#E5E7EB", color: "#374151" }}>
                  <PhoneIcon size={14} /> Call
                </a>
                <a href={`https://wa.me/${customer.phone.replace(/\D/g, "")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold text-white"
                  style={{ background: "#25D366" }}>
                  <WhatsAppIcon size={14} /> WhatsApp
                </a>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="px-5 py-4 border-b" style={{ borderColor: "#F3F4F6" }}>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Bookings",  value: String(visibleBookings.length), color: "#111827",  bg: "#F9FAFB",  border: "#E5E7EB" },
                { label: "Paid",      value: fmtRs(customer.totalPaid),      color: "#16A34A",  bg: "#F0FDF4",  border: "#BBF7D0" },
                { label: "Balance",   value: due > 0 ? fmtRs(due) : "—",    color: due > 0 ? "#DC2626" : "#9CA3AF", bg: due > 0 ? "#FEF2F2" : "#F9FAFB", border: due > 0 ? "#FECACA" : "#E5E7EB" },
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-3 text-center" style={{ background: s.bg, border: `1.5px solid ${s.border}` }}>
                  <p className="text-sm font-bold leading-tight" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[11px] mt-1" style={{ color: "#9CA3AF" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Booking History */}
          <div className="px-5 py-5">
            <div className="flex items-center gap-2 mb-4">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Booking History</p>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>{visibleBookings.length}</span>
            </div>
            {visibleBookings.length === 0 ? (
              <p className="text-sm text-center py-8 rounded-2xl" style={{ color: "#9CA3AF", background: "#F9FAFB" }}>No bookings yet</p>
            ) : (
              <div className="flex flex-col gap-3">
                {[...visibleBookings].sort((a, b) => b.date.localeCompare(a.date)).map(bk => {
                  const st  = STATUS_CFG[bk.status] ?? STATUS_CFG.pending;
                  const evS = eventStyle(bk.event);
                  const bal = bk.amount - bk.paid;
                  const pct = bk.amount > 0 ? Math.min(100, Math.round((bk.paid / bk.amount) * 100)) : 0;
                  return (
                    <div key={bk.id} className="rounded-2xl p-4" style={{ background: "#FAFAFA", border: "1.5px solid #F0F0F0" }}>
                      {/* Top row: badges + amount */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-xl" style={{ background: evS.bg, color: evS.color }}>{bk.event}</span>
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-xl" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                        </div>
                        {bk.amount > 0 && (
                          <p className="text-sm font-bold shrink-0" style={{ color: "#111827" }}>{fmtRs(bk.amount)}</p>
                        )}
                      </div>

                      {/* Meta row */}
                      <div className="flex items-center gap-3 flex-wrap mb-3">
                        <div className="flex items-center gap-1">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          <span className="text-xs font-medium" style={{ color: "#6B7280" }}>{fmtDate(bk.date)}</span>
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-lg" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>{bk.hall}</span>
                        {bk.guests > 0 && (
                          <span className="text-xs" style={{ color: "#9CA3AF" }}>{bk.guests} guests</span>
                        )}
                        {bk.timeFrom && (
                          <span className="text-xs" style={{ color: "#9CA3AF" }}>{fmt12h(bk.timeFrom)}{bk.timeTo ? ` – ${fmt12h(bk.timeTo)}` : ""}</span>
                        )}
                      </div>

                      {/* Payment bar */}
                      {bk.amount > 0 && (
                        <div className="rounded-xl px-3 py-2.5" style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
                          <div className="flex justify-between text-[11px] font-medium mb-1.5">
                            <span style={{ color: "#6B7280" }}>Paid: <span style={{ color: "#16A34A" }}>{fmtRs(bk.paid)}</span></span>
                            {bal > 0
                              ? <span style={{ color: "#DC2626" }}>Due: {fmtRs(bal)}</span>
                              : <span style={{ color: "#16A34A" }}>✓ Fully Paid</span>
                            }
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: bal <= 0 ? "#16A34A" : "var(--primary)" }} />
                          </div>
                        </div>
                      )}

                      {bk.notes && (
                        <p className="text-[11px] mt-2.5 italic px-1" style={{ color: "#9CA3AF" }}>"{bk.notes}"</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CustomersPage() {
  const { accessToken } = useAuthStore();
  const [bookings, setBookings] = useState<DbBooking[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,     setSearch]     = useState("");
  const [page,       setPage]       = useState(1);
  const [selected,   setSelected]   = useState<Customer | null>(null);
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [calOpen,    setCalOpen]    = useState(false);
  const calRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accessToken) return;
    api.get<{ bookings: DbBooking[] }>("/api/vendor/bookings", accessToken)
      .then(res => { if (res.success) setBookings(res.bookings ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken]);

  // Close calendar dropdown on outside click (desktop)
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setCalOpen(false);
    }
    if (calOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [calOpen]);

  // All unique booked dates (for calendar highlights)
  const bookedDates = useMemo(() => {
    const s = new Set<string>();
    for (const b of bookings) {
      if (b.status !== "cancelled" && b.status !== "blocked") s.add(b.date);
    }
    return s;
  }, [bookings]);

  // Derive customers from real bookings (exclude blocked)
  const customers = useMemo<Customer[]>(() => {
    const map = new Map<string, Customer>();
    for (const bk of bookings) {
      if (bk.status === "blocked" || bk.status === "cancelled") continue;
      const key = `${bk.customerName.trim().toLowerCase()}__${(bk.phone ?? "").trim()}`;
      if (!map.has(key)) {
        map.set(key, { name: bk.customerName, phone: bk.phone ?? "", bookings: [], totalSpent: 0, totalPaid: 0, lastEvent: "", lastDate: "", eventTypes: [] });
      }
      const c = map.get(key)!;
      c.bookings.push(bk);
      c.totalSpent += bk.amount;
      c.totalPaid  += bk.paid;
      if (!c.lastDate || bk.date > c.lastDate) { c.lastDate = bk.date; c.lastEvent = bk.event; }
      if (!c.eventTypes.includes(bk.event)) c.eventTypes.push(bk.event);
    }
    return [...map.values()].sort((a, b) => b.lastDate.localeCompare(a.lastDate));
  }, [bookings]);

  const filtered = useMemo(() => {
    let list = customers;
    if (filterDate) {
      list = list.filter(c => c.bookings.some(b => b.date === filterDate && b.status !== "cancelled" && b.status !== "blocked"));
    }
    const q = search.toLowerCase();
    if (!q) return list;
    return list.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.eventTypes.some(e => e.toLowerCase().includes(q))
    );
  }, [customers, search, filterDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function changeSearch(v: string) { setSearch(v); setPage(1); }
  function changeDate(d: string)  { setFilterDate(d); setPage(1); setCalOpen(false); }
  function clearDate()            { setFilterDate(null); setPage(1); setCalOpen(false); }

  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
  const totalDue     = customers.reduce((s, c) => s + Math.max(0, c.totalSpent - c.totalPaid), 0);

  return (
    <div className="p-4 lg:p-6 min-h-screen" style={{ background: "var(--bg-subtle, #F4F4F5)" }}>

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold" style={{ color: "#111827" }}>Customers</h1>
        <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
          {loading ? "Loading…" : `${customers.length} total customer${customers.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {loading ? (
          <>
            <StatSkeleton /><StatSkeleton /><StatSkeleton />
          </>
        ) : (
          <>
            <StatCard label="Total Customers" value={customers.length}    icon={<UsersIcon />} />
            <StatCard label="Total Sales"      value={fmtRs(totalRevenue)} icon={<RevenueIcon />} />
            <StatCard label="Total Due"       value={fmtRs(totalDue)}     icon={<DueIcon />} />
          </>
        )}
      </div>

      {/* Search + Date Filter */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }}><SearchIcon /></div>
          <input
            className={INP + " pl-10"}
            style={INP_S}
            placeholder="Search by name, phone or event type..."
            value={search}
            onChange={e => changeSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => changeSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:opacity-70" style={{ color: "#9CA3AF" }}>
              <XIcon size={15} />
            </button>
          )}
        </div>

        {/* Calendar filter button */}
        <div className="relative shrink-0" ref={calRef}>
          <button
            onClick={() => setCalOpen(o => !o)}
            className="w-12 h-12 flex items-center justify-center rounded-2xl border transition-colors cursor-pointer"
            style={{
              background: filterDate ? "var(--primary)" : "var(--bg-subtle)",
              borderColor: filterDate ? "var(--primary)" : "#D1D5DB",
              color: filterDate ? "#fff" : "#6B7280",
            }}
            title={filterDate ? `Filtered: ${filterDate}` : "Filter by date"}
          >
            <CalendarFilterIcon />
          </button>

          {/* Desktop dropdown */}
          {calOpen && (
            <div className="hidden lg:block absolute right-0 top-14 z-50 bg-white rounded-2xl shadow-xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
              <DateFilterCalendar
                selected={filterDate}
                bookedDates={bookedDates}
                onSelect={changeDate}
                onClear={clearDate}
              />
            </div>
          )}
        </div>
      </div>

      {/* Active date filter badge */}
      {filterDate && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl" style={{ background: "var(--primary-light)" }}>
          <CalendarFilterIcon />
          <span className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
            Filtered by: {new Date(filterDate + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          <button onClick={clearDate} className="ml-auto cursor-pointer hover:opacity-70" style={{ color: "var(--primary)" }}>
            <XIcon size={13} />
          </button>
        </div>
      )}

      {/* Mobile bottom sheet calendar */}
      {calOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setCalOpen(false)} />
          <div className="fixed z-50 bottom-0 left-0 right-0 bg-white rounded-t-3xl overflow-hidden" style={{ boxShadow: "0 -4px 40px rgba(0,0,0,0.12)" }}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: "#E5E7EB" }} />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "#F3F4F6" }}>
              <p className="text-sm font-bold" style={{ color: "#111827" }}>Filter by Date</p>
              <button onClick={() => setCalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 cursor-pointer" style={{ color: "#6B7280" }}>
                <XIcon size={15} />
              </button>
            </div>
            <div className="flex justify-center pb-6">
              <DateFilterCalendar
                selected={filterDate}
                bookedDates={bookedDates}
                onSelect={changeDate}
                onClear={clearDate}
              />
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: 5 }).map((_, i) => <CustomerCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border" style={{ borderColor: "#E5E7EB" }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "#F3F4F6", color: "#9CA3AF" }}><UsersIcon /></div>
          <p className="text-sm font-semibold" style={{ color: "#374151" }}>
            {search ? "No customers found" : "No customers yet"}
          </p>
          <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
            {search ? "Try a different search" : "Customers appear here once you add bookings"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {paginated.map(c => (
            <CustomerCard key={`${c.name}__${c.phone}`} customer={c} onClick={() => setSelected(c)} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl border px-4 py-3 mt-3" style={{ borderColor: "#E5E7EB" }}>
          <p className="text-xs" style={{ color: "#9CA3AF" }}>
            Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-30 hover:bg-gray-100 transition-colors"
              style={{ color: "#6B7280" }}
            >
              <ChevLeftIcon />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                style={{ background: safePage === n ? "var(--primary)" : "transparent", color: safePage === n ? "#fff" : "#6B7280" }}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-30 hover:bg-gray-100 transition-colors"
              style={{ color: "#6B7280" }}
            >
              <ChevRightIcon />
            </button>
          </div>
        </div>
      )}

      {/* Drawer */}
      {selected && <CustomerDrawer customer={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function UsersIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function RevenueIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
}
function DueIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
function SearchIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}
function CalendarFilterIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function ChevronIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>;
}
function ChevLeftIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>;
}
function ChevRightIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>;
}
function XIcon({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
function PhoneIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.39 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
}
function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>;
}
