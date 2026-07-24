"use client";

import { useState } from "react";
import { NewBookingModal, EMPTY_FORM } from "../_components/NewBookingModal";
import type { BookingStatus } from "../_components/NewBookingModal";

type Status = BookingStatus;

type Booking = {
  id: string;
  customerName: string;
  phone: string;
  event: string;
  hall: string;
  date: string;
  time: string;
  guests: number;
  amount: number;
  paid: number;
  status: Status;
  notes: string;
};

const INITIAL_BOOKINGS: Booking[] = [
  { id: "BK-001", customerName: "Ahmed Khan",  phone: "0300-1234567", event: "Wedding",        hall: "Hall A", date: "2026-08-02", time: "18:00", guests: 350, amount: 450000, paid: 200000, status: "confirmed", notes: "Requires stage decoration" },
  { id: "BK-002", customerName: "Sara Malik",  phone: "0312-9876543", event: "Birthday Party", hall: "Hall B", date: "2026-08-05", time: "16:00", guests: 80,  amount: 85000,  paid: 85000,  status: "confirmed", notes: "" },
  { id: "BK-003", customerName: "Nadia Shah",  phone: "0321-4567890", event: "Wedding",        hall: "Hall A", date: "2026-08-10", time: "17:00", guests: 400, amount: 520000, paid: 0,      status: "pending",   notes: "Menu tasting scheduled" },
  { id: "BK-004", customerName: "Bilal Raza",  phone: "0333-1122334", event: "Corporate Event",hall: "Hall C", date: "2026-08-14", time: "10:00", guests: 120, amount: 95000,  paid: 50000,  status: "confirmed", notes: "" },
  { id: "BK-005", customerName: "Hina Baig",   phone: "0345-6677889", event: "Engagement",     hall: "Hall B", date: "2026-08-18", time: "19:00", guests: 200, amount: 180000, paid: 100000, status: "pending",   notes: "Guest from Lahore" },
  { id: "BK-006", customerName: "Tariq Butt",  phone: "0302-3344556", event: "Wedding",        hall: "Hall A", date: "2026-07-28", time: "18:00", guests: 450, amount: 600000, paid: 600000, status: "confirmed", notes: "" },
  { id: "BK-007", customerName: "Usman Ali",   phone: "0311-9988776", event: "Anniversary",    hall: "Hall B", date: "2026-07-05", time: "19:30", guests: 60,  amount: 55000,  paid: 0,      status: "cancelled", notes: "Client cancelled — refund processed" },
];

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

const FILTER_TABS: { label: string; value: "all" | Status }[] = [
  { label: "All",       value: "all" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Pending",   value: "pending" },
  { label: "Cancelled", value: "cancelled" },
];

function fmt(n: number) {
  return "Rs. " + n.toLocaleString("en-PK");
}
function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function formatTime(t: string) {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [filter, setFilter]     = useState<"all" | Status>("all");
  const [search, setSearch]     = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected]  = useState<Booking | null>(null);

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

  const counts = {
    all:       bookings.length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    pending:   bookings.filter(b => b.status === "pending").length,
    cancelled: bookings.filter(b => b.status === "cancelled").length,
  };

  const totalRevenue = bookings.filter(b => b.status !== "cancelled").reduce((s, b) => s + b.amount, 0);
  const collected    = bookings.filter(b => b.status !== "cancelled").reduce((s, b) => s + b.paid, 0);

  function handleCreate(form: typeof EMPTY_FORM, status: Status, _services: unknown[]) {
    const newBooking: Booking = {
      id: "BK-" + String(bookings.length + 1).padStart(3, "0"),
      customerName: form.customerName,
      phone: form.phone,
      event: form.event,
      hall: form.hall,
      date: form.date,
      time: form.time,
      guests: Number(form.guests) || 0,
      amount: Number(form.amount) || 0,
      paid: Number(form.paid) || 0,
      notes: form.notes,
      status,
    };
    setBookings(prev => [newBooking, ...prev]);
    setModalOpen(false);
    setSelected(newBooking);
  }

  function cancelBooking(id: string) {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: "cancelled" } : b));
    setSelected(prev => prev?.id === id ? { ...prev, status: "cancelled" } : prev);
  }

  return (
    <>
      <NewBookingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />

      <div className="p-4 lg:p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl lg:text-2xl font-semibold text-black tracking-tight">Bookings</h1>
            <p className="text-sm mt-1" style={{ color: "var(--fg-muted)" }}>Manage all event bookings</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90 active:opacity-80"
            style={{ background: "var(--primary)", color: "#ffffff" }}
          >
            <PlusIcon /> New Booking
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-2xl font-semibold text-black">{counts.all}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>Total Bookings</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-2xl font-semibold" style={{ color: "#16A34A" }}>{counts.confirmed}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>Confirmed</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-lg font-semibold text-black">{fmt(totalRevenue)}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>Total Revenue</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-lg font-semibold" style={{ color: "#16A34A" }}>{fmt(collected)}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>Collected</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">

          {/* Booking List */}
          <div className="flex-1 min-w-0">

            {/* Filter + Search */}
            <div className="bg-white rounded-2xl shadow-sm mb-4 overflow-hidden">
              <div className="flex border-b" style={{ borderColor: "#F4F4F5" }}>
                {FILTER_TABS.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setFilter(t.value)}
                    className="flex-1 py-3 text-sm font-medium transition-colors cursor-pointer relative"
                    style={{ color: filter === t.value ? "var(--primary)" : "var(--fg-muted)" }}
                  >
                    {t.label}
                    <span
                      className="ml-1 text-xs px-1.5 py-0.5 rounded-full"
                      style={{
                        background: filter === t.value ? "var(--primary-light)" : "var(--bg-subtle)",
                        color: filter === t.value ? "var(--primary)" : "var(--fg-muted)",
                      }}
                    >
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
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by customer, event, or booking ID..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none border"
                    style={{ background: "var(--bg-subtle)", borderColor: "#E5E7EB", color: "var(--fg)" }}
                  />
                </div>
              </div>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-2">
              {filtered.length === 0 && (
                <div className="bg-white rounded-2xl shadow-sm py-16 flex flex-col items-center text-center">
                  <EmptyIcon />
                  <p className="text-sm font-medium mt-3 text-black">No bookings found</p>
                  <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>Try changing the filter or search</p>
                </div>
              )}
              {filtered.map(b => {
                const cfg = STATUS_CONFIG[b.status];
                const balance = b.amount - b.paid;
                const isActive = selected?.id === b.id;
                return (
                  <div
                    key={b.id}
                    onClick={() => setSelected(b)}
                    className="bg-white rounded-2xl shadow-sm p-4 cursor-pointer transition-all hover:shadow-md"
                    style={{ border: `1.5px solid ${isActive ? "var(--primary)" : "transparent"}` }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 text-white"
                          style={{ background: HALL_COLOR[b.hall] || "var(--primary)" }}
                        >
                          {b.customerName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-black truncate">{b.customerName}</p>
                          <p className="text-xs truncate" style={{ color: "var(--fg-muted)" }}>{b.event} · {b.hall}</p>
                        </div>
                      </div>
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <CalendarSmIcon />
                        <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{formatDate(b.date)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ClockSmIcon />
                        <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{formatTime(b.time)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <GuestSmIcon />
                        <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{b.guests} guests</span>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-sm font-semibold text-black">{fmt(b.amount)}</p>
                        {b.status !== "cancelled" && (
                          balance > 0
                            ? <p className="text-xs" style={{ color: "#D97706" }}>Due: {fmt(balance)}</p>
                            : <p className="text-xs" style={{ color: "#16A34A" }}>Fully Paid</p>
                        )}
                      </div>
                    </div>

                    <p className="text-xs font-mono mt-2" style={{ color: "var(--fg-subtle)" }}>{b.id}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail Panel */}
          {selected && (
            <div
              className="w-full lg:w-80 bg-white rounded-2xl shadow-sm flex flex-col overflow-hidden shrink-0"
              style={{ maxHeight: "calc(100vh - 120px)", position: "sticky", top: 76 }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "#F4F4F5" }}>
                <p className="text-sm font-semibold text-black">{selected.id}</p>
                <button
                  onClick={() => setSelected(null)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  style={{ color: "var(--fg-muted)" }}
                >
                  <XIcon />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--fg-subtle)" }}>Status</span>
                  <span
                    className="text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ background: STATUS_CONFIG[selected.status].bg, color: STATUS_CONFIG[selected.status].color }}
                  >
                    {STATUS_CONFIG[selected.status].label}
                  </span>
                </div>

                {/* Customer */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--fg-subtle)" }}>Customer</p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white text-sm"
                      style={{ background: HALL_COLOR[selected.hall] || "var(--primary)" }}
                    >
                      {selected.customerName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-black">{selected.customerName}</p>
                      <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{selected.phone || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Event */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--fg-subtle)" }}>Event Details</p>
                  <div className="flex flex-col gap-2.5">
                    {[
                      { label: "Event Type", value: selected.event },
                      { label: "Hall",       value: selected.hall },
                      { label: "Date",       value: formatDate(selected.date) },
                      { label: "Time",       value: formatTime(selected.time) },
                      { label: "Guests",     value: `${selected.guests}` },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{row.label}</span>
                        <span className="text-sm font-medium text-black">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment */}
                <div className="rounded-2xl p-4" style={{ background: "var(--bg-subtle)" }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--fg-subtle)" }}>Payment</p>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Total Amount</span>
                      <span className="text-sm font-semibold text-black">{fmt(selected.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Paid</span>
                      <span className="text-sm font-semibold" style={{ color: "#16A34A" }}>{fmt(selected.paid)}</span>
                    </div>
                    <div className="border-t pt-2 mt-1 flex items-center justify-between" style={{ borderColor: "#E5E7EB" }}>
                      <span className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Balance Due</span>
                      <span
                        className="text-sm font-semibold"
                        style={{ color: selected.amount - selected.paid > 0 ? "#D97706" : "#16A34A" }}
                      >
                        {fmt(selected.amount - selected.paid)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selected.notes && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--fg-subtle)" }}>Notes</p>
                    <p
                      className="text-sm rounded-xl p-3 leading-relaxed"
                      style={{ background: "var(--bg-subtle)", color: "var(--fg-muted)" }}
                    >
                      {selected.notes}
                    </p>
                  </div>
                )}

                {/* Actions */}
                {selected.status !== "cancelled" && (
                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      className="w-full py-3 rounded-2xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90"
                      style={{ background: "var(--primary)", color: "#ffffff" }}
                    >
                      Record Payment
                    </button>
                    <button
                      className="w-full py-3 rounded-2xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-80"
                      style={{ background: "var(--bg-subtle)", color: "var(--fg)" }}
                    >
                      Edit Booking
                    </button>
                    <button
                      onClick={() => cancelBooking(selected.id)}
                      className="w-full py-3 rounded-2xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-80"
                      style={{ background: "#FEF2F2", color: "#DC2626" }}
                    >
                      Cancel Booking
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function PlusIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
}
function XIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}
function SearchIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
}
function CalendarSmIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fg-subtle)" }}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
}
function ClockSmIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fg-subtle)" }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
}
function GuestSmIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fg-subtle)" }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
}
function EmptyIcon() {
  return <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fg-subtle)" }}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>;
}
