"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const PRIMARY = "#FF3B6B";

const CITIES = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta"];

// ─── Icons ────────────────────────────────────────────────────────────────────
function PinIcon({ color = "#9CA3AF" }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  );
}
function BuildingIcon({ color = "#9CA3AF" }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4"/>
      <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/>
    </svg>
  );
}
function TentIcon({ color = "#9CA3AF" }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 21 12 3l8.5 18"/><path d="M12 3v18"/><path d="M3.5 21h17"/>
    </svg>
  );
}
function StarIcon({ color = "#9CA3AF" }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}
function UsersIcon({ color = "#9CA3AF" }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  );
}
function UserIcon({ color = "#9CA3AF" }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
}
function GridIcon({ color = "#9CA3AF" }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: "transform 0.18s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

// ─── Option types ─────────────────────────────────────────────────────────────
type Option = { value: string; label: string; icon: React.ReactNode };

const CITY_OPTIONS: Option[] = [
  { value: "", label: "All Cities", icon: <GridIcon /> },
  ...CITIES.map(c => ({ value: c, label: c, icon: <PinIcon /> })),
];

const TYPE_OPTIONS: Option[] = [
  { value: "",             label: "All Types",    icon: <GridIcon /> },
  { value: "Banquet Hall", label: "Banquet Hall", icon: <BuildingIcon /> },
  { value: "Marquee",      label: "Marquee",      icon: <TentIcon /> },
  { value: "Ballroom",     label: "Ballroom",     icon: <StarIcon /> },
];

const CAP_OPTIONS: Option[] = [
  { value: "",     label: "Any Capacity",  icon: <UsersIcon /> },
  { value: "100",  label: "Up to 100",     icon: <UserIcon /> },
  { value: "300",  label: "100 – 300",     icon: <UsersIcon /> },
  { value: "600",  label: "300 – 600",     icon: <UsersIcon /> },
  { value: "1000", label: "600 – 1000",    icon: <UsersIcon /> },
  { value: "9999", label: "1000+",         icon: <UsersIcon /> },
];

// ─── Custom Select ─────────────────────────────────────────────────────────────
function CustomSelect({
  value, onChange, options, placeholder, minWidth = 180,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder: string;
  minWidth?: number;
}) {
  const [open, setOpen]   = useState(false);
  const [rect, setRect]   = useState<DOMRect | null>(null);
  const btnRef            = useRef<HTMLButtonElement>(null);
  const panelRef          = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        btnRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Recompute position on scroll/resize when open
  useEffect(() => {
    if (!open) return;
    function update() {
      if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
    }
    window.addEventListener("scroll",  update, true);
    window.addEventListener("resize",  update);
    return () => {
      window.removeEventListener("scroll",  update, true);
      window.removeEventListener("resize",  update);
    };
  }, [open]);

  function toggle() {
    if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
    setOpen(o => !o);
  }

  const selected = options.find(o => o.value === value);

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        className="w-full flex items-center justify-between gap-1.5 outline-none bg-transparent cursor-pointer"
      >
        <span className="text-sm font-medium truncate" style={{ color: selected?.value ? "#111827" : "#9CA3AF" }}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown open={open} />
      </button>

      {open && rect && (
        <div
          ref={panelRef}
          style={{
            position:  "fixed",
            top:       rect.bottom + 6,
            left:      rect.left,
            minWidth:  Math.max(rect.width, minWidth),
            zIndex:    9999,
          }}
        >
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background:  "#fff",
              border:      "1px solid #E5E7EB",
              boxShadow:   "0 8px 28px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            {/* Header hint */}
            <div className="px-3 pt-2.5 pb-1.5 border-b" style={{ borderColor: "#F3F4F6" }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#9CA3AF" }}>
                {placeholder}
              </p>
            </div>
            {/* Options */}
            <div className="py-1 max-h-64 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
              {options.map(opt => {
                const active = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => { onChange(opt.value); setOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-gray-50 text-left"
                    style={{ color: active ? PRIMARY : "#374151" }}
                  >
                    <span className="shrink-0">
                      {/* Re-render icon with active color */}
                      {active
                        ? (() => {
                            const el = opt.icon as React.ReactElement<{ color?: string }>;
                            return el.type ? { ...el, props: { ...el.props, color: PRIMARY } } as React.ReactNode : opt.icon;
                          })()
                        : opt.icon}
                    </span>
                    <span className="flex-1 font-medium">{opt.label}</span>
                    {active && <CheckIcon />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function HeroSearch() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [query,    setQuery]    = useState(searchParams.get("q")    ?? "");
  const [city,     setCity]     = useState(searchParams.get("city") ?? "");
  const [type,     setType]     = useState(searchParams.get("type") ?? "");
  const [capacity, setCapacity] = useState(searchParams.get("cap")  ?? "");
  const [verified, setVerified] = useState(searchParams.get("verified") === "1");

  function search(overrides: Record<string, string> = {}) {
    const params = new URLSearchParams();
    const q   = overrides.q    ?? query;
    const c   = overrides.city ?? city;
    const t   = overrides.type ?? type;
    const cap = overrides.cap  ?? capacity;
    const ver = overrides.verified ?? (verified ? "1" : "");

    if (q)   params.set("q",    q);
    if (c)   params.set("city", c);
    if (t)   params.set("type", t);
    if (cap) params.set("cap",  cap);
    if (ver) params.set("verified", ver);

    router.push(`/?${params.toString()}#venues`);
  }

  function pickCity(c: string) {
    setCity(c);
    search({ city: c });
  }

  return (
    <>
      {/* ── Search Panel ── */}
      <div
        className="w-full max-w-4xl rounded-2xl overflow-hidden"
        style={{
          background:  "rgba(255,255,255,0.97)",
          boxShadow:   "0 24px 64px rgba(0,0,0,0.28), 0 4px 16px rgba(0,0,0,0.12)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Main row */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1px_1fr_1px_1fr_1px_1fr_auto] items-stretch">

          {/* Venue Name */}
          <div className="flex items-center gap-3 px-5 py-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF3B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#9CA3AF" }}>Venue</p>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && search()}
                type="text"
                placeholder="Search venues…"
                className="w-full text-sm font-medium outline-none bg-transparent placeholder:text-gray-300"
                style={{ color: "#111827" }}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block self-stretch" style={{ background: "#F3F4F6" }} />

          {/* City */}
          <div className="flex items-center gap-3 px-5 py-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF3B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#9CA3AF" }}>City</p>
              <CustomSelect value={city} onChange={setCity} options={CITY_OPTIONS} placeholder="All Cities" minWidth={200} />
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block self-stretch" style={{ background: "#F3F4F6" }} />

          {/* Venue Type */}
          <div className="flex items-center gap-3 px-5 py-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF3B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4"/>
              <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/>
            </svg>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#9CA3AF" }}>Type</p>
              <CustomSelect value={type} onChange={setType} options={TYPE_OPTIONS} placeholder="All Types" minWidth={180} />
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block self-stretch" style={{ background: "#F3F4F6" }} />

          {/* Capacity */}
          <div className="flex items-center gap-3 px-5 py-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF3B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#9CA3AF" }}>Guests</p>
              <CustomSelect value={capacity} onChange={setCapacity} options={CAP_OPTIONS} placeholder="Any Size" minWidth={160} />
            </div>
          </div>

          {/* Search button */}
          <div className="flex items-center px-3 py-3">
            <button
              onClick={() => search()}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 cursor-pointer whitespace-nowrap"
              style={{ background: "linear-gradient(135deg, #FF3B6B, #FF6B8A)", boxShadow: "0 4px 16px rgba(255,59,107,0.35)" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Search Venues
            </button>
          </div>
        </div>

        {/* Bottom bar — verified toggle */}
        <div
          className="flex items-center gap-4 px-5 py-2.5 border-t"
          style={{ borderColor: "#F3F4F6", background: "#FAFAFA" }}
        >
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={verified}
              onChange={e => setVerified(e.target.checked)}
              className="w-3.5 h-3.5 rounded accent-pink-500"
            />
            <span className="text-xs font-medium" style={{ color: "#6B7280" }}>Verified venues only</span>
          </label>
          <span className="text-xs ml-auto" style={{ color: "#D1D5DB" }}>|</span>
          <span className="text-xs" style={{ color: "#9CA3AF" }}>Filter by city, type, and capacity</span>
        </div>
      </div>

      {/* ── City chips ── */}
      <div className="flex items-center gap-2 mt-5 flex-wrap justify-center">
        <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>Popular:</span>
        {["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Multan"].map(c => (
          <button key={c} onClick={() => pickCity(c)}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background:     city === c ? "#FF3B6B"                    : "rgba(255,255,255,0.12)",
              color:          city === c ? "#fff"                        : "rgba(255,255,255,0.85)",
              border:         city === c ? "1px solid #FF3B6B"           : "1px solid rgba(255,255,255,0.25)",
              backdropFilter: "blur(10px)",
            }}>
            {c}
          </button>
        ))}
      </div>
    </>
  );
}
