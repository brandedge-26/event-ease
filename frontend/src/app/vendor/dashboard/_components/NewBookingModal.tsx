"use client";

import { useState } from "react";

export type BookingStatus = "confirmed" | "pending" | "cancelled";

export const HALLS = ["Hall A", "Hall B", "Hall C"];
export const EVENT_TYPES = ["Wedding", "Engagement", "Birthday Party", "Corporate Event", "Conference", "Anniversary", "Other"];

export const EMPTY_FORM = {
  customerName: "", phone: "", event: "", hall: HALLS[0],
  date: "", timeFrom: "", timeTo: "", guests: "", amount: "", paid: "", notes: "",
};

const STATUS_CONFIG: Record<"confirmed" | "pending", { label: string; color: string; bg: string }> = {
  confirmed: { label: "Confirmed", color: "#16A34A", bg: "#F0FDF4" },
  pending:   { label: "Pending",   color: "#D97706", bg: "#FFFBEB" },
};

type PresetService = { id: string; label: string; icon: React.ReactNode };

type ServiceEntry = {
  id: string;
  label: string;
  icon: React.ReactNode;
  customName: string;
  unit: string;
  price: string;
};

// ─── Custom Time Picker ───────────────────────────────────────────────────────
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
        {/* Hour */}
        <select value={value.h} onChange={e => onChange({ ...value, h: e.target.value })} className={sel} style={selStyle}>
          {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
        <span className="text-sm font-semibold" style={{ color: "var(--fg-muted)" }}>:</span>
        {/* Minute */}
        <select value={value.m} onChange={e => onChange({ ...value, m: e.target.value })} className={sel} style={selStyle}>
          {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        {/* AM/PM */}
        <div className="flex rounded-lg overflow-hidden border ml-1" style={{ borderColor: "#D1D5DB" }}>
          {(["AM", "PM"] as const).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => onChange({ ...value, ampm: p })}
              className="px-2 py-1 text-xs font-semibold cursor-pointer transition-colors"
              style={{
                background: value.ampm === p ? "var(--primary)" : "var(--bg-subtle)",
                color: value.ampm === p ? "#ffffff" : "var(--fg-muted)",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function NewBookingModal({
  open,
  onClose,
  onSubmit,
  defaultDate,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: typeof EMPTY_FORM, status: BookingStatus, services: ServiceEntry[]) => void;
  defaultDate?: string;
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM, date: defaultDate || "" });
  const [formStatus, setFormStatus] = useState<"confirmed" | "pending">("pending");
  const [timeFrom, setTimeFrom] = useState<{ h: string; m: string; ampm: "AM" | "PM" }>({ h: "06", m: "00", ampm: "PM" });
  const [timeTo,   setTimeTo]   = useState<{ h: string; m: string; ampm: "AM" | "PM" }>({ h: "11", m: "00", ampm: "PM" });
  const [services, setServices] = useState<ServiceEntry[]>([]);

  function reset() {
    setForm({ ...EMPTY_FORM, date: defaultDate || "" });
    setFormStatus("pending");
    setTimeFrom({ h: "06", m: "00", ampm: "PM" });
    setTimeTo({ h: "11", m: "00", ampm: "PM" });
    setServices([]);
  }

  function handleClose() { reset(); onClose(); }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function toggleService(preset: typeof PRESET_SERVICES[0]) {
    setServices(prev => {
      const exists = prev.find(s => s.id === preset.id);
      if (exists) return prev.filter(s => s.id !== preset.id);
      return [...prev, { id: preset.id, label: preset.label, icon: preset.icon, customName: "", unit: "", price: "" }];
    });
  }

  function updateService(id: string, field: keyof ServiceEntry, value: string) {
    setServices(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const timeFromStr = `${timeFrom.h}:${timeFrom.m} ${timeFrom.ampm}`;
    const timeToStr   = `${timeTo.h}:${timeTo.m} ${timeTo.ampm}`;
    onSubmit({ ...form, timeFrom: timeFromStr, timeTo: timeToStr }, formStatus, services);
    reset();
  }

  const canSubmit = form.customerName && form.event && form.hall && form.date && form.guests;

  if (!open) return null;

  const inputCls = "w-full px-4 py-3 rounded-xl text-sm outline-none border focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-1 transition-all";
  const inputStyle = { background: "var(--bg-subtle)", borderColor: "#D1D5DB", color: "var(--fg)" };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      <div
        className={[
          "fixed z-50 bg-white overflow-hidden flex flex-col",
          "bottom-0 left-0 right-0 rounded-t-3xl max-h-[92dvh]",
          "lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2",
          "lg:right-auto lg:rounded-3xl lg:w-[540px] lg:max-h-[90vh]",
        ].join(" ")}
        style={{ boxShadow: "0 -4px 40px rgba(0,0,0,0.12)" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 lg:hidden shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "#E5E7EB" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "#F4F4F5" }}>
          <div>
            <p className="text-base font-semibold text-black">New Booking</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>Fill in the details to create a booking</p>
          </div>
          <button type="button" onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer hover:bg-gray-100 transition-colors" style={{ color: "var(--fg-muted)" }}>
            <XIcon />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6">

          {/* ── Customer ── */}
          <section className="flex flex-col gap-3">
            <SectionLabel>Customer</SectionLabel>
            <input name="customerName" placeholder="Customer name *" value={form.customerName} onChange={handleChange} required className={inputCls} style={inputStyle} />
            <input name="phone" placeholder="Phone number" value={form.phone} onChange={handleChange} className={inputCls} style={inputStyle} />
          </section>

          {/* ── Event Details ── */}
          <section className="flex flex-col gap-3">
            <SectionLabel>Event Details</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              <select name="event" value={form.event} onChange={handleChange} required className={inputCls} style={{ ...inputStyle, color: form.event ? "var(--fg)" : "var(--fg-muted)" }}>
                <option value="" disabled>Event type *</option>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select name="hall" value={form.hall} onChange={handleChange} className={inputCls} style={inputStyle}>
                {HALLS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <input name="date" type="date" value={form.date} onChange={handleChange} required className={inputCls} style={inputStyle} />
            <input name="guests" type="number" placeholder="Number of guests *" value={form.guests} onChange={handleChange} required min={1} className={inputCls} style={inputStyle} />
          </section>

          {/* ── Timing ── */}
          <section className="flex flex-col gap-3">
            <SectionLabel>Timing</SectionLabel>
            <div className="flex items-start gap-3">
              <TimePicker label="From" value={timeFrom} onChange={setTimeFrom} />
              <div className="flex items-center pt-7" style={{ color: "var(--fg-muted)" }}>
                <ArrowRightIcon />
              </div>
              <TimePicker label="To" value={timeTo} onChange={setTimeTo} />
            </div>
          </section>

          {/* ── Services ── */}
          <section className="flex flex-col gap-3">
            <SectionLabel>Services <span className="font-normal normal-case" style={{ color: "var(--fg-subtle)", letterSpacing: 0 }}>(optional)</span></SectionLabel>

            {/* Toggle buttons */}
            <div className="grid grid-cols-2 gap-2">
              {PRESET_SERVICES.map(p => {
                const active = services.some(s => s.id === p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleService(p)}
                    className="flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-medium cursor-pointer transition-all text-left"
                    style={{
                      background: active ? "var(--primary-light)" : "var(--bg-subtle)",
                      color: active ? "var(--primary)" : "var(--fg-muted)",
                      border: `1.5px solid ${active ? "var(--primary-muted)" : "transparent"}`,
                    }}
                  >
                    <span className="shrink-0">{p.icon}</span>
                    {p.label}
                    {active && <span className="ml-auto"><CheckIcon /></span>}
                  </button>
                );
              })}
            </div>

            {/* Selected service detail rows */}
            {services.length > 0 && (
              <div className="flex flex-col gap-3 mt-1">
                {services.map(s => (
                  <div key={s.id} className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: "var(--bg-subtle)", border: "1px solid #E5E7EB" }}>
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="shrink-0" style={{ color: "var(--primary)" }}>{s.icon}</span>
                        <p className="text-sm font-semibold text-black">{s.id === "custom" ? (s.customName || "Custom Service") : s.label}</p>
                      </div>
                      <button type="button" onClick={() => setServices(prev => prev.filter(x => x.id !== s.id))}
                        className="w-6 h-6 flex items-center justify-center rounded-lg cursor-pointer hover:bg-red-50 transition-colors"
                        style={{ color: "#DC2626" }}>
                        <XSmIcon />
                      </button>
                    </div>

                    {/* Custom name field — always visible for custom service */}
                    {s.id === "custom" && (
                      <input
                        placeholder="Enter service name *"
                        value={s.customName}
                        onChange={e => updateService(s.id, "customName", e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none border focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-1"
                        style={{ background: "#ffffff", borderColor: "#D1D5DB", color: "var(--fg)" }}
                        autoFocus
                      />
                    )}

                    {/* Unit + Price */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs mb-1.5" style={{ color: "var(--fg-muted)" }}>Unit</p>
                        <input
                          placeholder="e.g. per person"
                          value={s.unit}
                          onChange={e => updateService(s.id, "unit", e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none border focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-1"
                          style={{ background: "#ffffff", borderColor: "#D1D5DB", color: "var(--fg)" }}
                        />
                      </div>
                      <div>
                        <p className="text-xs mb-1.5" style={{ color: "var(--fg-muted)" }}>Price</p>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none" style={{ color: "var(--fg-muted)" }}>Rs.</span>
                          <input
                            type="number"
                            placeholder="0"
                            value={s.price}
                            onChange={e => updateService(s.id, "price", e.target.value)}
                            min={0}
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none border focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-1"
                            style={{ background: "#ffffff", borderColor: "#D1D5DB", color: "var(--fg)" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Payment ── */}
          <section className="flex flex-col gap-3">
            <SectionLabel>Payment</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: "var(--fg-muted)" }}>Rs.</span>
                <input name="amount" type="number" placeholder="Total amount" value={form.amount} onChange={handleChange} min={0} className={`${inputCls} pl-11`} style={inputStyle} />
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: "var(--fg-muted)" }}>Rs.</span>
                <input name="paid" type="number" placeholder="Advance paid" value={form.paid} onChange={handleChange} min={0} className={`${inputCls} pl-11`} style={inputStyle} />
              </div>
            </div>
          </section>

          {/* ── Status ── */}
          <section className="flex flex-col gap-3">
            <SectionLabel>Status</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              {(["pending", "confirmed"] as const).map(s => (
                <button key={s} type="button" onClick={() => setFormStatus(s)} className="py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all"
                  style={{
                    background: formStatus === s ? STATUS_CONFIG[s].bg : "var(--bg-subtle)",
                    color: formStatus === s ? STATUS_CONFIG[s].color : "var(--fg-muted)",
                    border: `1.5px solid ${formStatus === s ? STATUS_CONFIG[s].color : "transparent"}`,
                  }}>
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </section>

          {/* ── Notes ── */}
          <section>
            <textarea name="notes" placeholder="Notes (optional)" value={form.notes} onChange={handleChange} rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none border resize-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-1 transition-all"
              style={inputStyle} />
          </section>

          {/* ── Submit ── */}
          <div className="sticky bottom-0 pt-2 pb-1 bg-white">
            <button type="submit" disabled={!canSubmit} className="w-full py-4 rounded-2xl text-sm font-semibold transition-all"
              style={{
                background: canSubmit ? "var(--primary)" : "#E5E7EB",
                color: canSubmit ? "#ffffff" : "var(--fg-muted)",
                cursor: canSubmit ? "pointer" : "not-allowed",
              }}>
              Create Booking
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--fg-subtle)" }}>
      {children}
    </p>
  );
}

function XIcon()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function XSmIcon()  { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function CheckIcon(){ return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function ArrowRightIcon(){ return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>; }

// ─── Preset services list (after icons so JSX resolves) ──────────────────────
const PRESET_SERVICES: PresetService[] = [
  { id: "drink",  label: "Drink Service", icon: <DrinkIcon /> },
  { id: "music",  label: "Music",         icon: <MusicIcon /> },
  { id: "table",  label: "Table Service", icon: <TableIcon /> },
  { id: "custom", label: "Custom",        icon: <CustomIcon /> },
];

// Service icons
function DrinkIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>;
}
function MusicIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
}
function TableIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M3 12h18"/><path d="M8 6v12"/><path d="M16 6v12"/></svg>;
}
function CustomIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>;
}
