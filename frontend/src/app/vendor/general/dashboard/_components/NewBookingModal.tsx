"use client";

import { useState, useEffect } from "react";

export type BookingStatus = "confirmed" | "pending" | "cancelled" | "blocked";

export type ServiceEntry = {
  name: string;
  price: string;
  description?: string;
};

export const EVENT_TYPES = ["Wedding", "Engagement", "Birthday Party", "Corporate Event", "Conference", "Anniversary", "Other"];

export const EMPTY_FORM = {
  customerName: "", phone: "", event: "",
  date: "", timeFrom: "", timeTo: "", amount: "", paid: "", notes: "",
};

const STATUS_CONFIG: Record<"confirmed" | "pending", { label: string; color: string; bg: string }> = {
  confirmed: { label: "Confirmed", color: "#16A34A", bg: "#F0FDF4" },
  pending:   { label: "Pending",   color: "#D97706", bg: "#FFFBEB" },
};

// ─── Steps ────────────────────────────────────────────────────────────────────
const STEPS = [
  { num: 1, label: "Customer" },
  { num: 2, label: "Event"    },
  { num: 3, label: "Services" },
  { num: 4, label: "Payment"  },
];

// ─── Date Picker ──────────────────────────────────────────────────────────────
const CAL_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const CAL_DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function dateKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function DatePicker({ value, onChange, hasError }: {
  value: string;
  onChange: (v: string) => void;
  hasError?: boolean;
}) {
  const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0);
  const todayKey  = dateKey(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());

  const initDate  = value ? new Date(value + "T00:00:00") : todayDate;
  const [year, setYear]   = useState(initDate.getFullYear());
  const [month, setMonth] = useState(initDate.getMonth());

  function prev() { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); }
  function next() { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); }

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev  = new Date(year, month, 0).getDate();
  const totalCells  = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  const cells: { day: number; key: string; current: boolean }[] = [];
  for (let i = 0; i < totalCells; i++) {
    if (i < firstDay) {
      const d = daysInPrev - firstDay + 1 + i;
      cells.push({ day: d, key: dateKey(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1, d), current: false });
    } else if (i < firstDay + daysInMonth) {
      cells.push({ day: i - firstDay + 1, key: dateKey(year, month, i - firstDay + 1), current: true });
    } else {
      const d = i - firstDay - daysInMonth + 1;
      cells.push({ day: d, key: dateKey(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1, d), current: false });
    }
  }

  const isPrevDisabled = year < todayDate.getFullYear() || (year === todayDate.getFullYear() && month <= todayDate.getMonth());
  const borderColor = hasError ? "#FCA5A5" : "#E5E7EB";

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${borderColor}`, background: "var(--bg-subtle)" }}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: "#E5E7EB", background: "#fff" }}>
        <span className="text-xs font-medium" style={{ color: value ? "var(--fg)" : "var(--fg-muted)" }}>
          {value
            ? new Date(value + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" })
            : "Select a date"}
        </span>
        {value && (
          <button type="button" onClick={() => onChange("")}
            className="text-xs px-2 py-0.5 rounded-lg cursor-pointer"
            style={{ color: "var(--fg-muted)", background: "var(--bg-subtle)" }}>
            Clear
          </button>
        )}
      </div>
      <div className="flex items-center justify-between px-4 py-2.5">
        <button type="button" onClick={prev} disabled={isPrevDisabled}
          className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition-colors disabled:opacity-30"
          style={{ color: "var(--fg-muted)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span className="text-sm font-semibold text-black">{CAL_MONTHS[month].slice(0, 3)} {year}</span>
        <button type="button" onClick={next}
          className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition-colors hover:bg-gray-100"
          style={{ color: "var(--fg-muted)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 px-2">
        {CAL_DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold py-1" style={{ color: "var(--fg-muted)" }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 px-2 pb-3 gap-y-0.5">
        {cells.map((cell, i) => {
          const isPast     = cell.current && cell.key < todayKey;
          const isToday    = cell.key === todayKey && cell.current;
          const isSelected = cell.key === value && cell.current;
          const isOther    = !cell.current;
          const clickable  = cell.current && !isPast;

          let bg = "transparent", textColor = "var(--fg)", opacity = 1, cursor = "pointer";
          if (isSelected)                   { bg = "var(--primary)"; textColor = "#fff"; }
          else if (isToday)                 { bg = "var(--primary-light)"; textColor = "var(--primary)"; }
          else if (cell.current && !isPast) { bg = "#F0FDF4"; textColor = "#16A34A"; }
          else if (isPast || isOther)       { bg = "transparent"; textColor = "#D1D5DB"; opacity = 0.6; cursor = "default"; }

          return (
            <div key={i} className="flex items-center justify-center py-0.5">
              <button type="button" disabled={!clickable} onClick={() => clickable && onChange(cell.key)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium transition-all"
                style={{ background: bg, color: textColor, opacity, cursor: !cell.current ? "default" : cursor, fontWeight: isSelected || isToday ? 700 : 400 }}>
                {cell.day}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Time Picker ──────────────────────────────────────────────────────────────
const HOURS   = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

function TimePicker({ label, value, onChange }: {
  label: string;
  value: { h: string; m: string; ampm: "AM" | "PM" };
  onChange: (v: { h: string; m: string; ampm: "AM" | "PM" }) => void;
}) {
  const sel = "px-2 py-2 rounded-lg text-sm outline-none border cursor-pointer";
  const selStyle = { background: "var(--bg-subtle)", borderColor: "#D1D5DB", color: "var(--fg)" };
  return (
    <div className="flex flex-col gap-1.5 flex-1">
      <p className="text-xs font-medium" style={{ color: "var(--fg-muted)" }}>{label}</p>
      <div className="flex items-center gap-1.5 p-2.5 rounded-xl border" style={{ background: "var(--bg-subtle)", borderColor: "#D1D5DB" }}>
        <select value={value.h} onChange={e => onChange({ ...value, h: e.target.value })} className={sel} style={selStyle}>
          {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
        <span className="text-sm font-semibold" style={{ color: "var(--fg-muted)" }}>:</span>
        <select value={value.m} onChange={e => onChange({ ...value, m: e.target.value })} className={sel} style={selStyle}>
          {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <div className="flex rounded-lg overflow-hidden border ml-1" style={{ borderColor: "#D1D5DB" }}>
          {(["AM", "PM"] as const).map(p => (
            <button key={p} type="button" onClick={() => onChange({ ...value, ampm: p })}
              className="px-2 py-1 text-xs font-semibold cursor-pointer transition-colors"
              style={{ background: value.ampm === p ? "var(--primary)" : "var(--bg-subtle)", color: value.ampm === p ? "#ffffff" : "var(--fg-muted)" }}>
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center px-5 py-4 shrink-0">
      {STEPS.map((s, i) => {
        const done   = current > s.num;
        const active = current === s.num;
        return (
          <div key={s.num} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  background: done ? "#16A34A" : active ? "var(--primary)" : "var(--bg-subtle)",
                  color: done || active ? "#fff" : "var(--fg-muted)",
                  border: active ? "2px solid var(--primary)" : "2px solid transparent",
                }}>
                {done ? <CheckIcon /> : s.num}
              </div>
              <span className="text-[10px] font-medium whitespace-nowrap hidden sm:block"
                style={{ color: active ? "var(--primary)" : done ? "#16A34A" : "var(--fg-muted)" }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-0.5 mx-1 mb-4 rounded-full transition-all"
                style={{ background: current > s.num ? "#16A34A" : "#E5E7EB" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FieldError({ msg }: { msg: string }) {
  return <p className="text-xs font-medium mt-0.5" style={{ color: "#DC2626" }}>{msg}</p>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--fg-subtle)" }}>{children}</p>;
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function NewBookingModal({ open, onClose, onSubmit, defaultDate, submitting = false }: {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: typeof EMPTY_FORM, status: BookingStatus, services: ServiceEntry[]) => void;
  defaultDate?: string;
  submitting?: boolean;
}) {
  const [step,       setStep]       = useState(1);
  const [form,       setForm]       = useState({ ...EMPTY_FORM, date: defaultDate || "" });
  const [formStatus, setFormStatus] = useState<"confirmed" | "pending">("pending");
  const [timeFrom,   setTimeFrom]   = useState<{ h: string; m: string; ampm: "AM" | "PM" }>({ h: "06", m: "00", ampm: "PM" });
  const [timeTo,     setTimeTo]     = useState<{ h: string; m: string; ampm: "AM" | "PM" }>({ h: "11", m: "00", ampm: "PM" });
  const [services,   setServices]   = useState<ServiceEntry[]>([]);
  const [svcName,    setSvcName]    = useState("");
  const [svcPrice,   setSvcPrice]   = useState("");
  const [svcDesc,    setSvcDesc]    = useState("");
  const [errors,     setErrors]     = useState<Record<string, string>>({});

  function reset() {
    setStep(1);
    setForm({ ...EMPTY_FORM, date: defaultDate || "" });
    setFormStatus("pending");
    setTimeFrom({ h: "06", m: "00", ampm: "PM" });
    setTimeTo({ h: "11", m: "00", ampm: "PM" });
    setServices([]);
    setSvcName("");
    setSvcPrice("");
    setSvcDesc("");
    setErrors({});
  }

  useEffect(() => { if (!open) reset(); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  }

  function validate(s: number): boolean {
    const errs: Record<string, string> = {};
    if (s === 1) {
      if (!form.customerName.trim()) errs.customerName = "Customer name is required";
      if (form.phone && !/^[0-9\-+\s]{7,15}$/.test(form.phone)) errs.phone = "Enter a valid phone number";
    }
    if (s === 2) {
      if (!form.event) errs.event = "Please select an event type";
      if (!form.date)  errs.date  = "Event date is required";
    }
    if (s === 4) {
      if (form.amount && Number(form.amount) < 0) errs.amount = "Amount cannot be negative";
      if (form.paid && Number(form.paid) < 0)     errs.paid   = "Advance cannot be negative";
      if (form.paid && form.amount && Number(form.paid) > Number(form.amount)) errs.paid = "Advance cannot exceed total";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() { if (validate(step)) setStep(s => s + 1); }
  function back() { setStep(s => s - 1); setErrors({}); }

  function addService() {
    if (!svcName.trim()) return;
    setServices(prev => [...prev, { name: svcName.trim(), price: svcPrice, description: svcDesc.trim() || undefined }]);
    setSvcName("");
    setSvcPrice("");
    setSvcDesc("");
  }

  function removeService(i: number) {
    setServices(prev => prev.filter((_, idx) => idx !== i));
  }

  function handleSubmit() {
    if (!validate(4)) return;
    const timeFromStr   = `${timeFrom.h}:${timeFrom.m} ${timeFrom.ampm}`;
    const timeToStr     = `${timeTo.h}:${timeTo.m} ${timeTo.ampm}`;
    const servicesTotal = services.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
    const grandTotal    = (Number(form.amount) || 0) + servicesTotal;
    onSubmit({ ...form, timeFrom: timeFromStr, timeTo: timeToStr, amount: String(grandTotal) }, formStatus, services);
  }

  if (!open) return null;

  const inp      = "w-full px-4 py-3 rounded-xl text-sm outline-none border transition-all";
  const inpStyle = { background: "var(--bg-subtle)", borderColor: "#D1D5DB", color: "var(--fg)" };
  const inpErr   = { background: "#FFF5F5", borderColor: "#FCA5A5", color: "var(--fg)" };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={[
        "fixed z-50 bg-white overflow-hidden flex flex-col",
        "bottom-0 left-0 right-0 rounded-t-3xl max-h-[92dvh]",
        "lg:bottom-0 lg:top-0 lg:right-0 lg:left-auto lg:w-[580px] lg:max-h-full lg:rounded-none lg:rounded-l-3xl",
      ].join(" ")} style={{ boxShadow: "0 -4px 40px rgba(0,0,0,0.15)" }}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 lg:hidden shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "#E5E7EB" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-0 shrink-0">
          <div>
            <p className="text-base font-bold text-black">New Booking</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>
              Step {step} of {STEPS.length} — {STEPS[step - 1].label}
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer hover:bg-gray-100"
            style={{ color: "var(--fg-muted)" }}>
            <XIcon />
          </button>
        </div>

        {/* Step Indicator */}
        <StepIndicator current={step} />

        {/* Divider */}
        <div className="shrink-0 border-b" style={{ borderColor: "#F4F4F5" }} />

        {/* Step Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 flex flex-col gap-4">

          {/* ── Step 1: Customer ── */}
          {step === 1 && (
            <>
              <SectionLabel>Customer Information</SectionLabel>
              <div className="flex flex-col gap-3">
                <div>
                  <input name="customerName" placeholder="Customer name *" value={form.customerName}
                    onChange={handleChange} className={inp} style={errors.customerName ? inpErr : inpStyle} />
                  {errors.customerName && <FieldError msg={errors.customerName} />}
                </div>
                <div>
                  <input name="phone" placeholder="Phone number" value={form.phone}
                    onChange={handleChange} className={inp} style={errors.phone ? inpErr : inpStyle} />
                  {errors.phone && <FieldError msg={errors.phone} />}
                </div>
              </div>
            </>
          )}

          {/* ── Step 2: Event ── */}
          {step === 2 && (
            <>
              <SectionLabel>Event Details</SectionLabel>
              <div className="flex flex-col gap-3">
                <div>
                  <select name="event" value={form.event} onChange={handleChange}
                    className={inp} style={errors.event ? inpErr : { ...inpStyle, color: form.event ? "var(--fg)" : "var(--fg-muted)" }}>
                    <option value="" disabled>Select event type *</option>
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {errors.event && <FieldError msg={errors.event} />}
                </div>

                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "var(--fg-muted)" }}>Event Date *</label>
                  <DatePicker
                    value={form.date}
                    onChange={v => { setForm(f => ({ ...f, date: v })); if (errors.date) setErrors(p => ({ ...p, date: "" })); }}
                    hasError={!!errors.date}
                  />
                  {errors.date && <FieldError msg={errors.date} />}
                </div>

                <SectionLabel>Timing</SectionLabel>
                <div className="flex flex-col sm:flex-row items-start gap-3">
                  <TimePicker label="From" value={timeFrom} onChange={setTimeFrom} />
                  <div className="hidden sm:flex items-center pt-7" style={{ color: "var(--fg-muted)" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </div>
                  <TimePicker label="To" value={timeTo} onChange={setTimeTo} />
                </div>
              </div>
            </>
          )}

          {/* ── Step 3: Services ── */}
          {step === 3 && (
            <>
              <SectionLabel>Services <span className="font-normal normal-case" style={{ color: "var(--fg-subtle)", letterSpacing: 0 }}>(optional)</span></SectionLabel>

              {/* Add row */}
              <div className="flex flex-col gap-2">
                <div className="flex items-end gap-2">
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
                <input
                  value={svcDesc}
                  onChange={e => setSvcDesc(e.target.value)}
                  placeholder="Description (optional) — e.g. Full day coverage with 2 photographers"
                  className={inp}
                  style={inpStyle}
                />
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
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-black truncate">{s.name}</p>
                          {s.description && <p className="text-xs truncate mt-0.5" style={{ color: "var(--fg-muted)" }}>{s.description}</p>}
                        </div>
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
                <div className="flex flex-col items-center py-8 text-center rounded-2xl" style={{ background: "var(--bg-subtle)" }}>
                  <p className="text-sm font-medium text-black">No services added</p>
                  <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>Add services above to include them in this booking</p>
                </div>
              )}
            </>
          )}

          {/* ── Step 4: Payment & Status ── */}
          {step === 4 && (() => {
            const baseAmt       = Number(form.amount) || 0;
            const servicesTotal = services.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
            const grandTotal    = baseAmt + servicesTotal;
            const paidAmt       = Number(form.paid) || 0;
            const balanceDue    = Math.max(0, grandTotal - paidAmt);
            return (
              <>
                <SectionLabel>Payment</SectionLabel>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: "var(--fg-muted)" }}>Total Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: "var(--fg-muted)" }}>Rs.</span>
                      <input name="amount" type="number" placeholder="0" value={form.amount} onChange={handleChange}
                        min={0} className={`${inp} pl-11`} style={errors.amount ? inpErr : inpStyle} />
                    </div>
                    {errors.amount && <FieldError msg={errors.amount} />}
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: "var(--fg-muted)" }}>Advance Paid</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: "var(--fg-muted)" }}>Rs.</span>
                      <input name="paid" type="number" placeholder="0" value={form.paid} onChange={handleChange}
                        min={0} className={`${inp} pl-11`} style={errors.paid ? inpErr : inpStyle} />
                    </div>
                    {errors.paid && <FieldError msg={errors.paid} />}
                  </div>
                </div>

                <div className="rounded-xl" style={{ border: "1px solid #E5E7EB" }}>
                  <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "var(--bg-subtle)", borderRadius: "12px 12px 0 0" }}>
                    <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Base Amount</span>
                    <span className="text-xs font-semibold text-black">Rs. {baseAmt.toLocaleString("en-PK")}</span>
                  </div>
                  {servicesTotal > 0 && (
                    <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: "1px solid #F4F4F5", background: "var(--bg-subtle)" }}>
                      <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Services ({services.length})</span>
                      <span className="text-xs font-semibold text-black">+ Rs. {servicesTotal.toLocaleString("en-PK")}</span>
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

                <SectionLabel>Status</SectionLabel>
                <div className="grid grid-cols-2 gap-2">
                  {(["pending", "confirmed"] as const).map(s => (
                    <button key={s} type="button" onClick={() => setFormStatus(s)}
                      className="py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all"
                      style={{
                        background: formStatus === s ? STATUS_CONFIG[s].bg : "var(--bg-subtle)",
                        color: formStatus === s ? STATUS_CONFIG[s].color : "var(--fg-muted)",
                        border: `1.5px solid ${formStatus === s ? STATUS_CONFIG[s].color : "transparent"}`,
                      }}>
                      {STATUS_CONFIG[s].label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-1.5">
                  <SectionLabel>Notes</SectionLabel>
                  <textarea name="notes" placeholder="Any special instructions or notes..." value={form.notes}
                    onChange={handleChange} rows={3}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none border resize-none leading-relaxed"
                    style={{ ...inpStyle }} />
                </div>
              </>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-4 border-t flex items-center gap-3" style={{ borderColor: "#F4F4F5" }}>
          {step > 1 && (
            <button type="button" onClick={back}
              className="flex items-center gap-1.5 px-4 py-3 rounded-2xl text-sm font-semibold cursor-pointer hover:opacity-80 transition-opacity"
              style={{ background: "var(--bg-subtle)", color: "var(--fg-muted)" }}>
              <ChevLeftIcon /> Back
            </button>
          )}
          {step < STEPS.length ? (
            <button type="button" onClick={next}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90"
              style={{ background: "var(--primary)", color: "#ffffff" }}>
              Next <ChevRightIcon />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={submitting}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-70 flex items-center justify-center gap-2"
              style={{ background: "var(--primary)", color: "#ffffff" }}>
              {submitting ? (
                <>
                  <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                  Creating…
                </>
              ) : "Create Booking"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Edit Booking Modal ───────────────────────────────────────────────────────
export type EditableBooking = {
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
  services: ServiceEntry[];
};

function parseTime(t: string): { h: string; m: string; ampm: "AM" | "PM" } {
  if (!t) return { h: "06", m: "00", ampm: "PM" };
  if (/[AP]M/i.test(t)) {
    const [tp, ap] = t.trim().split(" ");
    const [h, m] = tp.split(":");
    return { h: String(parseInt(h)).padStart(2, "0"), m: m || "00", ampm: ap.toUpperCase() as "AM" | "PM" };
  }
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr);
  return { h: String(h % 12 || 12).padStart(2, "0"), m: mStr || "00", ampm: h >= 12 ? "PM" : "AM" };
}

export function EditBookingModal({ booking, onClose, onSave, submitting = false }: {
  booking: EditableBooking;
  onClose: () => void;
  onSave: (form: typeof EMPTY_FORM, status: "confirmed" | "pending", services: ServiceEntry[]) => Promise<void>;
  submitting?: boolean;
}) {
  const initSvcTotal   = booking.services.reduce((s, sv) => s + (Number(sv.price) || 0), 0);
  const initBaseAmount = Math.max(0, booking.amount - initSvcTotal);

  const [step,       setStep]       = useState(1);
  const [form,       setForm]       = useState({
    ...EMPTY_FORM,
    customerName: booking.customerName,
    phone:        booking.phone,
    event:        booking.event,
    date:         booking.date,
    amount:       String(initBaseAmount),
    paid:         String(booking.paid),
    notes:        booking.notes,
  });
  const [formStatus, setFormStatus] = useState<"confirmed" | "pending">(
    booking.status === "confirmed" ? "confirmed" : "pending"
  );
  const [timeFrom,   setTimeFrom]   = useState(parseTime(booking.timeFrom));
  const [timeTo,     setTimeTo]     = useState(parseTime(booking.timeTo));
  const [services,   setServices]   = useState<ServiceEntry[]>([...booking.services]);
  const [svcName,    setSvcName]    = useState("");
  const [svcPrice,   setSvcPrice]   = useState("");
  const [svcDesc,    setSvcDesc]    = useState("");
  const [errors,     setErrors]     = useState<Record<string, string>>({});
  const [saveError,  setSaveError]  = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: "" }));
  }

  function validate(s: number): boolean {
    const errs: Record<string, string> = {};
    if (s === 1) {
      if (!form.customerName.trim()) errs.customerName = "Customer name is required";
      if (form.phone && !/^[0-9\-+\s]{7,15}$/.test(form.phone)) errs.phone = "Enter a valid phone number";
    }
    if (s === 2) {
      if (!form.event) errs.event = "Please select an event type";
      if (!form.date)  errs.date  = "Event date is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() { if (validate(step)) setStep(s => s + 1); }
  function back() { setStep(s => s - 1); setErrors({}); }

  function addSvc() {
    if (!svcName.trim()) return;
    setServices(p => [...p, { name: svcName.trim(), price: svcPrice, description: svcDesc.trim() || undefined }]);
    setSvcName(""); setSvcPrice(""); setSvcDesc("");
  }
  function removeSvc(i: number) { setServices(p => p.filter((_, idx) => idx !== i)); }

  async function handleSubmit() {
    setSaveError("");
    const svcTotal   = services.reduce((s, sv) => s + (Number(sv.price) || 0), 0);
    const grandTotal = (Number(form.amount) || 0) + svcTotal;
    const tfFrom = `${timeFrom.h}:${timeFrom.m} ${timeFrom.ampm}`;
    const tfTo   = `${timeTo.h}:${timeTo.m} ${timeTo.ampm}`;
    try {
      await onSave({ ...form, timeFrom: tfFrom, timeTo: tfTo, amount: String(grandTotal) }, formStatus, services);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save booking");
    }
  }

  const inp      = "w-full px-4 py-3 rounded-xl text-sm outline-none border transition-all";
  const inpStyle = { background: "var(--bg-subtle)", borderColor: "#D1D5DB", color: "var(--fg)" };
  const inpErr   = { background: "#FFF5F5", borderColor: "#FCA5A5", color: "var(--fg)" };

  const inner = (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between px-5 pt-3 pb-0 shrink-0">
        <div>
          <p className="text-base font-bold text-black">Edit Booking</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>Step {step} of {STEPS.length} — {STEPS[step - 1].label}</p>
        </div>
        <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer hover:bg-gray-100" style={{ color: "var(--fg-muted)" }}><XIcon /></button>
      </div>
      <StepIndicator current={step} />
      <div className="shrink-0 border-b" style={{ borderColor: "#F4F4F5" }} />

      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 flex flex-col gap-4">
        {/* Step 1 */}
        {step === 1 && (
          <>
            <SectionLabel>Customer Information</SectionLabel>
            <div className="flex flex-col gap-3">
              <div>
                <input name="customerName" placeholder="Customer name *" value={form.customerName} onChange={handleChange} className={inp} style={errors.customerName ? inpErr : inpStyle} />
                {errors.customerName && <FieldError msg={errors.customerName} />}
              </div>
              <div>
                <input name="phone" placeholder="Phone number" value={form.phone} onChange={handleChange} className={inp} style={errors.phone ? inpErr : inpStyle} />
                {errors.phone && <FieldError msg={errors.phone} />}
              </div>
            </div>
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            <SectionLabel>Event Details</SectionLabel>
            <div className="flex flex-col gap-3">
              <div>
                <select name="event" value={form.event} onChange={handleChange} className={inp} style={errors.event ? inpErr : { ...inpStyle, color: form.event ? "var(--fg)" : "var(--fg-muted)" }}>
                  <option value="" disabled>Select event type *</option>
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {errors.event && <FieldError msg={errors.event} />}
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--fg-muted)" }}>Event Date *</label>
                <DatePicker value={form.date} onChange={v => { setForm(f => ({ ...f, date: v })); if (errors.date) setErrors(p => ({ ...p, date: "" })); }} hasError={!!errors.date} />
                {errors.date && <FieldError msg={errors.date} />}
              </div>
              <SectionLabel>Timing</SectionLabel>
              <div className="flex flex-col sm:flex-row items-start gap-3">
                <TimePicker label="From" value={timeFrom} onChange={setTimeFrom} />
                <div className="hidden sm:flex items-center pt-7" style={{ color: "var(--fg-muted)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </div>
                <TimePicker label="To" value={timeTo} onChange={setTimeTo} />
              </div>
            </div>
          </>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <>
            <SectionLabel>Services <span className="font-normal normal-case" style={{ color: "var(--fg-subtle)", letterSpacing: 0 }}>(optional)</span></SectionLabel>
            <div className="flex flex-col gap-2">
              <div className="flex items-end gap-2">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Service Name</label>
                  <input value={svcName} onChange={e => setSvcName(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSvc(); } }} placeholder="e.g. Photography" className={inp} style={inpStyle} />
                </div>
                <div className="w-28 flex flex-col gap-1">
                  <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Price (Rs.)</label>
                  <input type="number" value={svcPrice} onChange={e => setSvcPrice(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSvc(); } }} placeholder="0" min={0} className={inp} style={inpStyle} />
                </div>
                <button type="button" onClick={addSvc} disabled={!svcName.trim()} className="flex items-center gap-1 px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-40 shrink-0" style={{ background: "var(--primary)", color: "#ffffff" }}>
                  <PlusIcon /> Add
                </button>
              </div>
              <input value={svcDesc} onChange={e => setSvcDesc(e.target.value)} placeholder="Description (optional) — e.g. Full day coverage with 2 photographers" className={inp} style={inpStyle} />
            </div>
            {services.length > 0 ? (
              <div className="flex flex-col rounded-2xl overflow-hidden bg-white" style={{ border: "1px solid #F4F4F5" }}>
                {services.map((s, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: i < services.length - 1 ? "1px solid #F4F4F5" : "none" }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>{i + 1}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-black truncate">{s.name}</p>
                        {s.description && <p className="text-xs truncate mt-0.5" style={{ color: "var(--fg-muted)" }}>{s.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <p className="text-sm font-bold" style={{ color: "var(--primary)" }}>Rs. {Number(s.price || 0).toLocaleString("en-PK")}</p>
                      <button type="button" onClick={() => removeSvc(i)} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer hover:bg-red-50 transition-colors" style={{ color: "#DC2626" }}><TrashIcon /></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-center rounded-2xl" style={{ background: "var(--bg-subtle)" }}>
                <p className="text-sm font-medium text-black">No services added</p>
                <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>Add services above to include them in this booking</p>
              </div>
            )}
          </>
        )}

        {/* Step 4 */}
        {step === 4 && (() => {
          const baseAmt    = Number(form.amount) || 0;
          const svcTotal   = services.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
          const grandTotal = baseAmt + svcTotal;
          const paidAmt    = Number(form.paid) || 0;
          const balanceDue = Math.max(0, grandTotal - paidAmt);
          return (
            <>
              <SectionLabel>Payment</SectionLabel>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "var(--fg-muted)" }}>Total Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: "var(--fg-muted)" }}>Rs.</span>
                    <input name="amount" type="number" placeholder="0" value={form.amount} onChange={handleChange} min={0} className={`${inp} pl-11`} style={inpStyle} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "var(--fg-muted)" }}>Advance Paid</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: "var(--fg-muted)" }}>Rs.</span>
                    <input name="paid" type="number" placeholder="0" value={form.paid} onChange={handleChange} min={0} className={`${inp} pl-11`} style={inpStyle} />
                  </div>
                </div>
              </div>
              <div className="rounded-xl" style={{ border: "1px solid #E5E7EB" }}>
                <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "var(--bg-subtle)", borderRadius: "12px 12px 0 0" }}>
                  <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Base Amount</span>
                  <span className="text-xs font-semibold text-black">Rs. {baseAmt.toLocaleString("en-PK")}</span>
                </div>
                {svcTotal > 0 && (
                  <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: "1px solid #F4F4F5", background: "var(--bg-subtle)" }}>
                    <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Services ({services.length})</span>
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
              <SectionLabel>Status</SectionLabel>
              <div className="grid grid-cols-2 gap-2">
                {(["pending", "confirmed"] as const).map(s => (
                  <button key={s} type="button" onClick={() => setFormStatus(s)}
                    className="py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all"
                    style={{ background: formStatus === s ? STATUS_CONFIG[s].bg : "var(--bg-subtle)", color: formStatus === s ? STATUS_CONFIG[s].color : "var(--fg-muted)", border: `1.5px solid ${formStatus === s ? STATUS_CONFIG[s].color : "transparent"}` }}>
                    {STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-1.5">
                <SectionLabel>Notes</SectionLabel>
                <textarea name="notes" placeholder="Any special instructions or notes..." value={form.notes} onChange={handleChange} rows={3} className="w-full px-4 py-3 rounded-xl text-sm outline-none border resize-none leading-relaxed" style={inpStyle} />
              </div>
            </>
          );
        })()}
      </div>

      {saveError && (
        <div className="shrink-0 mx-5 mb-1 px-3 py-2 rounded-xl text-xs font-medium" style={{ background: "#FEF2F2", color: "#DC2626" }}>
          {saveError}
        </div>
      )}
      <div className="shrink-0 px-5 py-4 border-t flex items-center gap-3" style={{ borderColor: "#F4F4F5" }}>
        {step > 1 && (
          <button type="button" onClick={back} className="flex items-center gap-1.5 px-4 py-3 rounded-2xl text-sm font-semibold cursor-pointer hover:opacity-80 transition-opacity" style={{ background: "var(--bg-subtle)", color: "var(--fg-muted)" }}>
            <ChevLeftIcon /> Back
          </button>
        )}
        {step < STEPS.length ? (
          <button type="button" onClick={next} className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90" style={{ background: "var(--primary)", color: "#ffffff" }}>
            Next <ChevRightIcon />
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={submitting} className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-70 flex items-center justify-center gap-2" style={{ background: "var(--primary)", color: "#ffffff" }}>
            {submitting ? (
              <><svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg> Saving…</>
            ) : "Save Changes"}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="hidden lg:flex fixed z-50 right-0 top-0 bottom-0 w-[580px] bg-white flex-col overflow-hidden rounded-l-3xl" style={{ boxShadow: "-4px 0 40px rgba(0,0,0,0.12)" }}>
        {inner}
      </div>
      <div className="fixed z-50 bottom-0 left-0 right-0 rounded-t-3xl bg-white flex flex-col overflow-hidden lg:hidden" style={{ maxHeight: "92dvh", boxShadow: "0 -4px 40px rgba(0,0,0,0.12)" }}>
        <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="w-10 h-1 rounded-full" style={{ background: "#E5E7EB" }} /></div>
        {inner}
      </div>
    </>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function XIcon()        { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function PlusIcon()     { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function TrashIcon()    { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>; }
function CheckIcon()    { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function ChevLeftIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>; }
function ChevRightIcon(){ return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>; }
