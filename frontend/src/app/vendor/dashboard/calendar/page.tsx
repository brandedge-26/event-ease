"use client";

import { useState, useEffect } from "react";
import { NewBookingModal } from "../_components/NewBookingModal";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";

type Booking = {
  id: string;
  customerName: string;
  event: string;
  hall: string;
  guests: number;
  time: string;
  status: "confirmed" | "pending" | "blocked";
};

type BookingMap = Record<string, Booking[]>;

type DbBooking = {
  id: string; customerName: string; event: string; hall: string;
  guests: number; timeFrom: string | null; status: "confirmed" | "pending" | "cancelled" | "blocked";
  date: string;
};

function fmt12h(t: string | null): string {
  if (!t) return "—";
  if (/[AP]M/i.test(t)) return t;
  const [h, m] = t.split(":").map(Number);
  if (isNaN(h)) return "—";
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_FULL = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function toKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function statusConfig(status: Booking["status"]) {
  switch (status) {
    case "confirmed": return { color: "#16A34A", bg: "#DCFCE7", label: "Confirmed" };
    case "pending":   return { color: "#D97706", bg: "#FEF3C7", label: "Pending" };
    case "blocked":   return { color: "#DC2626", bg: "#FEE2E2", label: "Blocked" };
  }
}

function hallColor(hall: string) {
  if (hall === "Hall A") return "var(--primary)";
  if (hall === "Hall B") return "#2563EB";
  return "#7C3AED";
}
function hallBg(hall: string) {
  if (hall === "Hall A") return "#FFF0F4";
  if (hall === "Hall B") return "#EFF6FF";
  return "#F5F3FF";
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DayDetailModal({ dateKey, bookings, onClose, onNewBooking, onCloseHall }: { dateKey: string; bookings: Booking[]; onClose: () => void; onNewBooking: () => void; onCloseHall: () => void }) {
  const dateLabel = new Date(dateKey + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={[
        "fixed z-50 bg-white flex flex-col overflow-hidden",
        "bottom-0 left-0 right-0 rounded-t-3xl max-h-[80dvh]",
        "lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2",
        "lg:right-auto lg:w-[440px] lg:rounded-3xl lg:max-h-[80vh]",
      ].join(" ")} style={{ boxShadow: "0 -4px 40px rgba(0,0,0,0.12)" }}>
        <div className="flex justify-center pt-3 pb-1 lg:hidden shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "#E5E7EB" }} />
        </div>
        <div className="flex items-start justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "#F4F4F5" }}>
          <div>
            <p className="text-base font-semibold text-black">{dateLabel}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>
              {bookings.length === 0 ? "No bookings — date is free" : `${bookings.length} booking${bookings.length > 1 ? "s" : ""}`}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer hover:bg-gray-100 transition-colors ml-4 shrink-0" style={{ color: "var(--fg-muted)" }}>
            <XIcon />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
          {bookings.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FreeIcon />
              <p className="text-sm font-semibold mt-3" style={{ color: "#16A34A" }}>Available</p>
              <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>No bookings on this date</p>
              <div className="flex items-center gap-2 mt-4">
                <button onClick={onNewBooking} className="px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-80" style={{ background: "var(--primary)", color: "#ffffff" }}>
                  + New Booking
                </button>
                <button onClick={onCloseHall} className="px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-80" style={{ background: "#FEE2E2", color: "#DC2626" }}>
                  Hall Close
                </button>
              </div>
            </div>
          )}
          {bookings.map((b) => {
            const cfg = statusConfig(b.status);
            return (
              <div key={b.id} className="rounded-2xl p-4" style={{ background: "#FAFAFA", border: "1px solid #F0F0F0" }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: hallBg(b.hall), color: hallColor(b.hall) }}>
                    {b.hall}
                  </span>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-sm font-semibold text-black">{b.event}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{b.customerName}</p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5"><ClockIcon /><span className="text-xs" style={{ color: "var(--fg-muted)" }}>{b.time}</span></div>
                  {b.guests > 0 && <div className="flex items-center gap-1.5"><GuestsIcon /><span className="text-xs" style={{ color: "var(--fg-muted)" }}>{b.guests} guests</span></div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CalendarPage() {
  const { accessToken } = useAuthStore();
  const today = new Date();
  const [year, setYear]     = useState(today.getFullYear());
  const [month, setMonth]   = useState(today.getMonth());
  const [modalKey, setModalKey] = useState<string | null>(null);
  const [bookingMap, setBookingMap] = useState<BookingMap>({});
  const [hallNames,  setHallNames]  = useState<string[]>([]);
  const [loading,    setLoading]    = useState(true);

  // Load real bookings from API
  useEffect(() => {
    if (!accessToken) return;
    (async () => {
      try {
        const [bRes, hRes] = await Promise.all([
          api.get<{ bookings: DbBooking[] }>("/api/vendor/bookings", accessToken),
          api.get<{ halls: { id: string; name: string }[] }>("/api/vendor/halls", accessToken),
        ]);
        if (bRes.success) {
          const map: BookingMap = {};
          bRes.bookings
            .filter(b => b.status !== "cancelled")
            .forEach(b => {
              const entry: Booking = {
                id:           b.id,
                customerName: b.customerName,
                event:        b.event,
                hall:         b.hall,
                guests:       b.guests ?? 0,
                time:         fmt12h(b.timeFrom),
                status:       b.status as "confirmed" | "pending",
              };
              if (!map[b.date]) map[b.date] = [];
              map[b.date].push(entry);
            });
          setBookingMap(map);
        }
        if (hRes.success && hRes.halls.length > 0)
          setHallNames(hRes.halls.map(h => h.name));
      } catch { /* silently ignore */ }
      finally { setLoading(false); }
    })();
  }, [accessToken]);

  function prevMonth() { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); }
  function goToday()   { setYear(today.getFullYear()); setMonth(today.getMonth()); }

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev  = new Date(year, month, 0).getDate();
  const totalCells  = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const weeks       = totalCells / 7;

  const cells: { day: number; currentMonth: boolean; key: string }[] = [];
  for (let i = 0; i < totalCells; i++) {
    if (i < firstDay) {
      const d = daysInPrev - firstDay + 1 + i;
      cells.push({ day: d, currentMonth: false, key: toKey(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1, d) });
    } else if (i < firstDay + daysInMonth) {
      cells.push({ day: i - firstDay + 1, currentMonth: true, key: toKey(year, month, i - firstDay + 1) });
    } else {
      const d = i - firstDay - daysInMonth + 1;
      cells.push({ day: d, currentMonth: false, key: toKey(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1, d) });
    }
  }

  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());
  const prefix   = `${year}-${String(month + 1).padStart(2, "0")}`;
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingDefaultDate, setBookingDefaultDate] = useState("");
  const [extraBookings, setExtraBookings] = useState<BookingMap>({});
  const allBookings = (key: string) => [...(bookingMap[key] || []), ...(extraBookings[key] || [])];

  const monthEntries     = Object.entries({ ...bookingMap, ...extraBookings }).filter(([k]) => k.startsWith(prefix));
  const allMonthBookings = monthEntries.flatMap(([, b]) => b);
  const confirmedCount   = allMonthBookings.filter(b => b.status === "confirmed").length;
  const pendingCount     = allMonthBookings.filter(b => b.status === "pending").length;
  const bookedDates      = new Set(Object.keys(bookingMap).filter(k => (bookingMap[k] ?? []).length > 0));

  const modalBookings = modalKey ? allBookings(modalKey) : [];

  async function handleCloseHall(key: string) {
    setModalKey(null);
    if (!accessToken) return;
    try {
      const res = await api.post<{ id: string }>("/api/vendor/bookings", {
        customerName: "Maintenance",
        event:        "Hall Closed",
        hall:         hallNames[0] || "Hall",
        date:         key,
        status:       "blocked",
        guests:       0,
        amount:       0,
      }, accessToken);
      if (res.success) {
        const entry: Booking = {
          id:           res.id,
          customerName: "Maintenance",
          event:        "Hall Closed",
          hall:         hallNames[0] || "Hall",
          guests:       0,
          time:         "All Day",
          status:       "blocked",
        };
        setBookingMap(prev => ({ ...prev, [key]: [...(prev[key] ?? []), entry] }));
      }
    } catch { /* ignore */ }
  }

  return (
    <>
      <style>{`
        @keyframes calPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 59, 107, 0.5); }
          50%       { box-shadow: 0 0 0 6px rgba(255, 59, 107, 0); }
        }
        .today-pulse { animation: calPulse 1.8s ease-in-out infinite; }
      `}</style>

      <NewBookingModal
        open={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        defaultDate={bookingDefaultDate}
        halls={hallNames}
        bookedDates={bookedDates}
        onSubmit={(_form, _status, _services) => {
          setBookingModalOpen(false);
        }}
      />

      {modalKey && (
        <DayDetailModal
          dateKey={modalKey}
          bookings={modalBookings}
          onClose={() => setModalKey(null)}
          onNewBooking={() => {
            setBookingDefaultDate(modalKey!);
            setModalKey(null);
            setBookingModalOpen(true);
          }}
          onCloseHall={() => handleCloseHall(modalKey!)}
        />
      )}

      <div className="p-3 lg:p-6 flex flex-col gap-4" style={{ minHeight: "calc(100vh - 60px)" }}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg lg:text-2xl font-semibold text-black tracking-tight">Calendar</h1>
            <p className="text-xs lg:text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>View and manage your bookings</p>
          </div>
          <button
            onClick={() => { setBookingDefaultDate(""); setBookingModalOpen(true); }}
            className="flex items-center gap-2 px-3 lg:px-4 py-2 lg:py-2.5 rounded-2xl text-xs lg:text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90"
            style={{ background: "var(--primary)", color: "#ffffff" }}
          >
            <PlusIcon /> New Booking
          </button>
        </div>

        {/* Month Summary */}
        <div className="grid grid-cols-3 gap-2 lg:gap-3">
          {loading ? (
            ["Booked Days", "Confirmed", "Pending"].map(label => (
              <div key={label} className="bg-white rounded-2xl p-3 lg:p-4 shadow-sm text-center">
                <div className="h-7 w-8 rounded-lg animate-pulse mx-auto mb-1.5" style={{ background: "#E5E7EB" }} />
                <div className="h-3 w-16 rounded animate-pulse mx-auto" style={{ background: "#F3F4F6" }} />
              </div>
            ))
          ) : (
            [
              { value: monthEntries.length, label: "Booked Days", color: "text-black" },
              { value: confirmedCount,      label: "Confirmed",   color: "#16A34A" },
              { value: pendingCount,        label: "Pending",     color: "#D97706" },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl p-3 lg:p-4 shadow-sm text-center">
                <p className="text-xl lg:text-2xl font-semibold" style={{ color: typeof s.color === "string" && s.color.startsWith("#") ? s.color : undefined }}>{s.value}</p>
                <p className="text-[10px] lg:text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{s.label}</p>
              </div>
            ))
          )}
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-2xl shadow-sm flex flex-col flex-1 overflow-hidden">

          {/* Nav */}
          <div className="flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4 border-b shrink-0" style={{ borderColor: "#EBEBEB" }}>
            <button onClick={prevMonth} className="w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center rounded-xl cursor-pointer hover:bg-gray-100 transition-colors" style={{ color: "var(--fg-muted)" }}>
              <ChevronLeftIcon />
            </button>
            <div className="flex items-center gap-2 lg:gap-3">
              <h2 className="text-sm lg:text-lg font-semibold text-black">{MONTHS[month]} {year}</h2>
              <button onClick={goToday} className="px-2.5 lg:px-3 py-1 rounded-lg text-[10px] lg:text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                Today
              </button>
            </div>
            <button onClick={nextMonth} className="w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center rounded-xl cursor-pointer hover:bg-gray-100 transition-colors" style={{ color: "var(--fg-muted)" }}>
              <ChevronRightIcon />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b shrink-0" style={{ borderColor: "#EBEBEB" }}>
            {DAYS_SHORT.map((d, i) => (
              <div key={d} className="py-2 lg:py-3 text-center font-semibold" style={{ color: "var(--fg-muted)", fontSize: 11 }}>
                <span className="hidden lg:inline">{DAYS_FULL[i].slice(0, 3)}</span>
                <span className="lg:hidden">{d.slice(0, 1)}</span>
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 flex-1" style={{ gridTemplateRows: `repeat(${weeks}, 1fr)` }}>
            {loading ? (
              // Skeleton cells — 35 placeholder tiles
              Array.from({ length: 35 }).map((_, i) => {
                const hasBar1 = [2, 5, 9, 14, 18, 22, 27, 30].includes(i);
                const hasBar2 = [5, 18].includes(i);
                return (
                  <div key={i} className="p-1.5 lg:p-2" style={{ border: "1px solid #F0F0F0", minHeight: 60 }}>
                    {/* Day number skeleton */}
                    <div className="w-6 h-6 rounded-full animate-pulse mb-1.5" style={{ background: "#E5E7EB" }} />
                    {/* Booking bar skeletons — desktop only */}
                    {hasBar1 && <div className="hidden lg:block h-3 rounded-md animate-pulse mb-1" style={{ background: "#E5E7EB", width: "80%" }} />}
                    {hasBar1 && <div className="hidden lg:block h-2.5 rounded-md animate-pulse" style={{ background: "#F3F4F6", width: "60%" }} />}
                    {hasBar2 && <div className="hidden lg:block h-2.5 rounded-md animate-pulse mt-1" style={{ background: "#F3F4F6", width: "50%" }} />}
                    {/* Mobile dot skeleton */}
                    {hasBar1 && <div className="flex justify-center gap-1 mt-1 lg:hidden"><div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#E5E7EB" }} /></div>}
                  </div>
                );
              })
            ) : cells.map((cell, i) => {
              const bookings     = allBookings(cell.key);
              const isToday      = cell.key === todayKey && cell.currentMonth;
              const isPast       = cell.currentMonth && cell.key < todayKey;
              const hasConfirmed = cell.currentMonth && !isPast && bookings.some(b => b.status === "confirmed");
              const hasPending   = cell.currentMonth && !isPast && bookings.some(b => b.status === "pending");
              const hasBlocked   = cell.currentMonth && !isPast && bookings.some(b => b.status === "blocked");
              const hasAny       = cell.currentMonth && !isPast && bookings.length > 0;
              const clickable    = cell.currentMonth && !isPast;

              // Today + any event → always full primary (even if pending)
              const isTodayEvent = isToday && (hasConfirmed || hasPending);

              let cellBg     = "transparent";
              let cellBorder = "transparent";
              if (isPast) {
                cellBg = "#FAFAFA"; cellBorder = "#F0F0F0";
              } else if (cell.currentMonth) {
                if (isTodayEvent)                          { cellBg = "var(--primary)";       cellBorder = "var(--primary-hover)"; }
                else if (hasConfirmed && !hasBlocked)      { cellBg = "var(--primary-light)"; cellBorder = "#F9A8C9"; }
                else if (hasPending && !hasBlocked)        { cellBg = "#FFFBEB";              cellBorder = "#FCD34D"; }
                else if (hasBlocked)                       { cellBg = "#EF4444";              cellBorder = "#DC2626"; }
                else                                       { cellBg = "#F0FDF4";              cellBorder = "#BBF7D0"; }
              }

              const onWhite = isTodayEvent;
              const dayColor = !cell.currentMonth
                ? "#D1D5DB"
                : isPast
                ? "#C4C4C4"
                : onWhite
                ? "#ffffff"
                : hasConfirmed
                ? "var(--primary)"
                : hasPending
                ? "#D97706"
                : hasBlocked
                ? "#ffffff"
                : "#16A34A";

              return (
                <div
                  key={i}
                  onClick={() => clickable && setModalKey(cell.key)}
                  className={`flex flex-col transition-colors${isTodayEvent ? " today-pulse" : ""}`}
                  style={{
                    cursor: clickable ? "pointer" : "default",
                    background: cellBg,
                    border: `1px solid ${cell.currentMonth ? cellBorder : "#F0F0F0"}`,
                    margin: cell.currentMonth ? 2 : 0,
                    borderRadius: cell.currentMonth ? 10 : 0,
                    minHeight: 60,
                    padding: "6px 4px 4px 6px",
                    opacity: isPast ? 0.5 : 1,
                  }}
                >
                  {/* Day number — centered on mobile, left on desktop */}
                  <div className="flex lg:block justify-center">
                    <div
                      className="flex items-center justify-center rounded-full shrink-0"
                      style={{
                        width: 26, height: 26,
                        background: onWhite ? "rgba(255,255,255,0.22)" : isToday ? "var(--primary)" : "transparent",
                        color: onWhite ? "#ffffff" : isToday ? "#ffffff" : dayColor,
                        fontWeight: isToday || hasAny ? 600 : 400,
                        fontSize: 13,
                      }}
                    >
                      {cell.day}
                    </div>
                  </div>

                  {/* Desktop: full booking detail */}
                  {hasAny && (
                    <div className="hidden lg:flex flex-col gap-0.5 mt-1 flex-1 overflow-hidden">
                      {bookings.slice(0, 2).map(b => (
                        <div key={b.id}>
                          <p className="text-[11px] font-semibold leading-tight truncate"
                            style={{ color: (onWhite || hasBlocked) ? "#ffffff" : b.status === "confirmed" ? "var(--primary)" : "#D97706" }}>
                            {b.event}
                          </p>
                          <p className="text-[10px] leading-tight truncate"
                            style={{ color: (onWhite || hasBlocked) ? "rgba(255,255,255,0.8)" : "var(--fg-muted)" }}>
                            {b.customerName}
                          </p>
                          {b.guests > 0 && (
                            <p className="text-[10px] leading-tight"
                              style={{ color: (onWhite || hasBlocked) ? "rgba(255,255,255,0.65)" : "var(--fg-subtle)" }}>
                              {b.guests} guests
                            </p>
                          )}
                        </div>
                      ))}
                      {bookings.length > 2 && (
                        <p className="text-[10px] font-medium mt-auto"
                          style={{ color: (onWhite || hasBlocked) ? "rgba(255,255,255,0.7)" : "var(--fg-muted)" }}>
                          +{bookings.length - 2} more
                        </p>
                      )}
                    </div>
                  )}

                  {/* Mobile: centered dots */}
                  {hasAny && (
                    <div className="flex justify-center gap-0.5 mt-1 lg:hidden">
                      {(hasConfirmed || isTodayEvent) && <span className="w-1.5 h-1.5 rounded-full" style={{ background: onWhite ? "rgba(255,255,255,0.8)" : "var(--primary)" }} />}
                      {hasPending && !isTodayEvent && <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#D97706" }} />}
                      {hasBlocked && <span className="w-1.5 h-1.5 rounded-full" style={{ background: onWhite ? "rgba(255,255,255,0.8)" : "#DC2626" }} />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center flex-wrap gap-3 lg:gap-5 px-4 lg:px-6 py-3 border-t shrink-0" style={{ borderColor: "#EBEBEB" }}>
            {[
              { color: "var(--primary)", bg: "var(--primary-light)", label: "Confirmed" },
              { color: "#D97706",        bg: "#FFFBEB",              label: "Pending" },
              { color: "#16A34A",        bg: "#F0FDF4",              label: "Available" },
              { color: "#DC2626",        bg: "#FEE2E2",              label: "Blocked" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm" style={{ background: l.bg, border: `1.5px solid ${l.color}` }} />
                <span style={{ color: "var(--fg-muted)", fontSize: 11 }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function ChevronLeftIcon()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>; }
function ChevronRightIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>; }
function PlusIcon()   { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>; }
function XIcon()      { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>; }
function ClockIcon()  { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fg-subtle)" }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>; }
function GuestsIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fg-subtle)" }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>; }
function FreeIcon()   { return <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="9 12 11 14 15 10" /></svg>; }
