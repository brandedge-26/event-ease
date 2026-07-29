"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/store/useStore";
import type { Booking } from "@/store/useStore";

// ─── Types ────────────────────────────────────────────────────────────────────
type Customer = {
  name: string;
  phone: string;
  bookings: Booking[];
  totalSpent: number;
  totalPaid: number;
  lastEvent: string;
  lastDate: string;
  eventTypes: string[];
};

// ─── Constants ────────────────────────────────────────────────────────────────
const INP   = "w-full px-4 py-3 rounded-2xl text-sm outline-none transition-all duration-200 border border-[#D1D5DB] focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-1";
const INP_S = { background: "var(--bg-subtle)", color: "var(--fg)" };

const STATUS_CFG = {
  confirmed: { label: "Confirmed", color: "#16A34A", bg: "#F0FDF4" },
  pending:   { label: "Pending",   color: "#D97706", bg: "#FFFBEB" },
  cancelled: { label: "Cancelled", color: "#DC2626", bg: "#FEF2F2" },
} as const;

const EVENT_COLOR: Record<string, { color: string; bg: string }> = {
  Wedding:        { color: "#FF3B6B", bg: "#FFF0F4" },
  Engagement:     { color: "#7C3AED", bg: "#F5F3FF" },
  "Birthday Party": { color: "#EA580C", bg: "#FFF7ED" },
  "Corporate Event": { color: "#2563EB", bg: "#EFF6FF" },
  Conference:     { color: "#0891B2", bg: "#F0F9FF" },
  Anniversary:    { color: "#16A34A", bg: "#F0FDF4" },
  Other:          { color: "#6B7280", bg: "#F9FAFB" },
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
  const date = new Date(d);
  return date.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
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

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon }: { label: string; value: string | number; sub?: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-4 lg:p-5 flex items-center gap-4 border" style={{ borderColor: "#E5E7EB" }}>
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold truncate" style={{ color: "#111827" }}>{value}</p>
        <p className="text-xs font-medium truncate" style={{ color: "#6B7280" }}>{label}</p>
        {sub && <p className="text-[11px] truncate" style={{ color: "#9CA3AF" }}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── Customer Row (list item) ─────────────────────────────────────────────────
function CustomerCard({ customer, onClick }: { customer: Customer; onClick: () => void }) {
  const pal = avatarPalette(customer.name);
  const due  = customer.totalSpent - customer.totalPaid;
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-4 flex items-center gap-4 border cursor-pointer transition-shadow hover:shadow-md"
      style={{ borderColor: "#E5E7EB" }}
    >
      {/* Avatar */}
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold shrink-0" style={{ background: pal.bg, color: pal.color }}>
        {initials(customer.name)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold truncate" style={{ color: "#111827" }}>{customer.name}</p>
          {customer.bookings.length > 1 && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
              {customer.bookings.length}x
            </span>
          )}
        </div>
        <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{customer.phone}</p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {customer.eventTypes.slice(0, 2).map(ev => {
            const s = eventStyle(ev);
            return (
              <span key={ev} className="text-[10px] font-semibold px-2 py-0.5 rounded-lg" style={{ background: s.bg, color: s.color }}>{ev}</span>
            );
          })}
          {customer.eventTypes.length > 2 && (
            <span className="text-[10px]" style={{ color: "#9CA3AF" }}>+{customer.eventTypes.length - 2}</span>
          )}
        </div>
      </div>

      {/* Right */}
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
          <div className="px-5 py-5 border-b" style={{ borderColor: "#F3F4F6" }}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0" style={{ background: pal.bg, color: pal.color }}>
                {initials(customer.name)}
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold" style={{ color: "#111827" }}>{customer.name}</p>
                <a href={`tel:${customer.phone}`} className="text-sm hover:underline" style={{ color: "#6B7280" }}>{customer.phone}</a>
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex gap-2 mt-4">
              <a
                href={`tel:${customer.phone}`}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold border transition-colors hover:bg-gray-50"
                style={{ borderColor: "#E5E7EB", color: "#374151" }}
              >
                <PhoneIcon size={14} /> Call
              </a>
              <a
                href={`https://wa.me/${customer.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold text-white"
                style={{ background: "#25D366" }}
              >
                <WhatsAppIcon size={14} /> WhatsApp
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 divide-x" style={{ borderBottom: "1px solid #F3F4F6" }}>
            {[
              { label: "Bookings",  value: customer.bookings.length },
              { label: "Paid",      value: fmtRs(customer.totalPaid), green: customer.totalPaid > 0 },
              { label: "Remaining", value: due > 0 ? fmtRs(due) : "—", red: due > 0 },
            ].map(s => (
              <div key={s.label} className="py-4 flex flex-col items-center gap-0.5">
                <p className="text-base font-bold" style={{ color: s.red ? "#DC2626" : (s as {green?: boolean}).green ? "#16A34A" : "#111827" }}>{s.value}</p>
                <p className="text-[11px]" style={{ color: "#9CA3AF" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Booking History */}
          <div className="px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#9CA3AF" }}>Booking History</p>
            <div className="flex flex-col gap-3">
              {[...customer.bookings].sort((a, b) => b.date.localeCompare(a.date)).map(bk => {
                const st  = STATUS_CFG[bk.status];
                const evS = eventStyle(bk.event);
                const bal = bk.amount - bk.paid;
                return (
                  <div key={bk.id} className="rounded-2xl border p-4" style={{ borderColor: "#E5E7EB" }}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: evS.bg, color: evS.color }}>{bk.event}</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-lg" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                        </div>
                        <p className="text-xs mt-1.5 font-medium" style={{ color: "#6B7280" }}>{bk.hall} · {fmtDate(bk.date)}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>{bk.timeFrom} – {bk.timeTo} · {bk.guests} guests</p>
                      </div>
                      <p className="text-xs font-bold shrink-0" style={{ color: "#111827" }}>{fmtRs(bk.amount)}</p>
                    </div>
                    {/* Payment bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[11px] mb-1">
                        <span style={{ color: "#9CA3AF" }}>Paid: {fmtRs(bk.paid)}</span>
                        {bal > 0 && <span style={{ color: "#DC2626" }}>Due: {fmtRs(bal)}</span>}
                        {bal <= 0 && <span style={{ color: "#16A34A" }}>Fully Paid</span>}
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, bk.amount > 0 ? (bk.paid / bk.amount) * 100 : 0)}%`, background: bal <= 0 ? "#16A34A" : "var(--primary)" }}
                        />
                      </div>
                    </div>
                    {bk.notes && <p className="text-[11px] mt-2 italic" style={{ color: "#9CA3AF" }}>"{bk.notes}"</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CustomersPage() {
  const { bookings } = useStore();
  const [search,   setSearch]   = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);

  // Derive customers from bookings
  const customers = useMemo<Customer[]>(() => {
    const map = new Map<string, Customer>();
    for (const bk of bookings) {
      const key = `${bk.customerName.trim().toLowerCase()}__${bk.phone.trim()}`;
      if (!map.has(key)) {
        map.set(key, {
          name: bk.customerName,
          phone: bk.phone,
          bookings: [],
          totalSpent: 0,
          totalPaid: 0,
          lastEvent: "",
          lastDate: "",
          eventTypes: [],
        });
      }
      const c = map.get(key)!;
      c.bookings.push(bk);
      c.totalSpent += bk.amount;
      c.totalPaid  += bk.paid;
      if (!c.lastDate || bk.date > c.lastDate) {
        c.lastDate  = bk.date;
        c.lastEvent = bk.event;
      }
      if (!c.eventTypes.includes(bk.event)) c.eventTypes.push(bk.event);
    }
    return [...map.values()].sort((a, b) => b.lastDate.localeCompare(a.lastDate));
  }, [bookings]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return customers;
    return customers.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.eventTypes.some(e => e.toLowerCase().includes(q)));
  }, [customers, search]);

  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
  const totalDue     = customers.reduce((s, c) => s + (c.totalSpent - c.totalPaid), 0);

  return (
    <div className="p-4 lg:p-6 min-h-screen" style={{ background: "var(--bg-subtle, #F4F4F5)" }}>

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold" style={{ color: "#111827" }}>Customers</h1>
        <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>{customers.length} total customers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <StatCard label="Total Customers" value={customers.length} icon={<UsersIcon />} />
        <StatCard label="Total Revenue" value={fmtRs(totalRevenue)} icon={<RevenueIcon />} />
        <StatCard label="Total Due" value={fmtRs(totalDue)} icon={<DueIcon />} />
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }}><SearchIcon /></div>
        <input
          className={INP + " pl-10"}
          style={INP_S}
          placeholder="Search by name, phone or event type..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:opacity-70" style={{ color: "#9CA3AF" }}>
            <XIcon size={15} />
          </button>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border" style={{ borderColor: "#E5E7EB" }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "#F3F4F6", color: "#9CA3AF" }}><UsersIcon /></div>
          <p className="text-sm font-semibold" style={{ color: "#374151" }}>No customers found</p>
          <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>Try a different search</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map(c => (
            <CustomerCard key={`${c.name}__${c.phone}`} customer={c} onClick={() => setSelected(c)} />
          ))}
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
function RepeatIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>;
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
function ChevronIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>;
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
