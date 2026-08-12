"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";

const PRIMARY = "#FF3B6B";

const CITIES = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta"];
const VENUE_TYPES = ["Banquet Hall", "Marquee", "Ballroom"];

const CAPACITY_OPTIONS = [
  { label: "Any Capacity", value: "" },
  { label: "Up to 100",    value: "100"  },
  { label: "100 – 300",    value: "300"  },
  { label: "300 – 600",    value: "600"  },
  { label: "600 – 1000",   value: "1000" },
  { label: "1000+",        value: "9999" },
];

const PRICE_OPTIONS = [
  { label: "Any Price",        min: "",       max: ""       },
  { label: "Under Rs. 50k",    min: "",       max: "50000"  },
  { label: "Rs. 50k – 100k",   min: "50000",  max: "100000" },
  { label: "Rs. 100k – 200k",  min: "100000", max: "200000" },
  { label: "Rs. 200k+",        min: "200000", max: ""       },
];

function Label({ children }: { children: string }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "#9CA3AF" }}>
      {children}
    </p>
  );
}

// ─── Shared filter form ───────────────────────────────────────────────────────
function FilterForm({
  localQ, onSearchChange, currentCity, currentType, currentCap,
  currentVerified, selectedPrice, push,
}: {
  localQ: string;
  onSearchChange: (v: string) => void;
  currentCity: string;
  currentType: string;
  currentCap: string;
  currentVerified: string;
  selectedPrice: typeof PRICE_OPTIONS[number];
  push: (o: Record<string, string>) => void;
}) {
  return (
    <div className="divide-y divide-gray-100">

      {/* Search */}
      <div className="px-4 py-4">
        <Label>Search</Label>
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
          style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={localQ}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Venue name…"
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-300"
            style={{ color: "#111827" }}
          />
          {localQ && (
            <button type="button" onClick={() => onSearchChange("")}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* City */}
      <div className="px-4 py-4">
        <Label>City</Label>
        <div className="flex items-center px-3 py-2.5 rounded-xl"
          style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}>
          <select value={currentCity} onChange={e => push({ city: e.target.value })}
            className="w-full text-sm bg-transparent outline-none appearance-none cursor-pointer"
            style={{ color: currentCity ? "#111827" : "#9CA3AF" }}>
            <option value="">All Cities</option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Venue Type */}
      <div className="px-4 py-4">
        <Label>Venue Type</Label>
        <div className="flex flex-col gap-2.5">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="radio" name="type" value="" checked={currentType === ""}
              onChange={() => push({ type: "" })}
              className="w-4 h-4 accent-pink-500 cursor-pointer" />
            <span className="text-sm" style={{ color: currentType === "" ? "#111827" : "#6B7280", fontWeight: currentType === "" ? 600 : 400 }}>
              Any Type
            </span>
          </label>
          {VENUE_TYPES.map(t => (
            <label key={t} className="flex items-center gap-2.5 cursor-pointer">
              <input type="radio" name="type" value={t} checked={currentType === t}
                onChange={() => push({ type: t })}
                className="w-4 h-4 accent-pink-500 cursor-pointer" />
              <span className="text-sm" style={{ color: currentType === t ? "#111827" : "#6B7280", fontWeight: currentType === t ? 600 : 400 }}>
                {t}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Capacity */}
      <div className="px-4 py-4">
        <Label>Capacity</Label>
        <div className="flex items-center px-3 py-2.5 rounded-xl"
          style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}>
          <select value={currentCap} onChange={e => push({ cap: e.target.value })}
            className="w-full text-sm bg-transparent outline-none appearance-none cursor-pointer"
            style={{ color: currentCap ? "#111827" : "#9CA3AF" }}>
            {CAPACITY_OPTIONS.map(o => <option key={o.label} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Price Range */}
      <div className="px-4 py-4">
        <Label>Price Range</Label>
        <div className="flex flex-col gap-2.5">
          {PRICE_OPTIONS.map(o => {
            const active = selectedPrice.label === o.label;
            return (
              <label key={o.label} className="flex items-center gap-2.5 cursor-pointer">
                <input type="radio" name="price" checked={active}
                  onChange={() => push({ minPrice: o.min, maxPrice: o.max })}
                  className="w-4 h-4 accent-pink-500 cursor-pointer" />
                <span className="text-sm" style={{ color: active ? "#111827" : "#6B7280", fontWeight: active ? 600 : 400 }}>
                  {o.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Verified */}
      <div className="px-4 py-4">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input type="checkbox" checked={currentVerified === "1"}
            onChange={e => push({ verified: e.target.checked ? "1" : "" })}
            className="w-4 h-4 rounded accent-pink-500 cursor-pointer" />
          <div>
            <p className="text-sm font-medium" style={{ color: "#111827" }}>Verified only</p>
            <p className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>Event Ease verified venues</p>
          </div>
        </label>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function VenueFilters() {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);

  const currentQ        = searchParams.get("q")        ?? "";
  const currentCity     = searchParams.get("city")     ?? "";
  const currentType     = searchParams.get("type")     ?? "";
  const currentCap      = searchParams.get("cap")      ?? "";
  const currentVerified = searchParams.get("verified") ?? "";
  const currentMinPrice = searchParams.get("minPrice") ?? "";
  const currentMaxPrice = searchParams.get("maxPrice") ?? "";

  const [localQ, setLocalQ] = useState(currentQ);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setLocalQ(currentQ); }, [currentQ]);

  // Close sheet on route change (filter applied)
  useEffect(() => { setSheetOpen(false); }, [searchParams]);

  // Prevent body scroll when sheet open
  useEffect(() => {
    document.body.style.overflow = sheetOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sheetOpen]);

  const selectedPrice = PRICE_OPTIONS.find(
    o => o.min === currentMinPrice && o.max === currentMaxPrice
  ) ?? PRICE_OPTIONS[0];

  const activeCount = [
    currentQ, currentCity, currentType, currentCap, currentVerified,
    currentMinPrice || currentMaxPrice,
  ].filter(Boolean).length;

  function buildParams(overrides: Record<string, string>) {
    const base: Record<string, string> = {
      q: currentQ, city: currentCity, type: currentType,
      cap: currentCap, verified: currentVerified,
      minPrice: currentMinPrice, maxPrice: currentMaxPrice,
    };
    const merged = { ...base, ...overrides };
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    return params.toString();
  }

  function push(overrides: Record<string, string>) {
    const qs = buildParams(overrides);
    router.push(`/venues${qs ? `?${qs}` : ""}`);
  }

  function handleSearchChange(value: string) {
    setLocalQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => push({ q: value }), 350);
  }

  const formProps = { localQ, onSearchChange: handleSearchChange, currentCity, currentType, currentCap, currentVerified, selectedPrice, push };

  // ── Desktop sidebar ──────────────────────────────────────────────────────────
  return (
    <>
      <div className="hidden md:block bg-white rounded-2xl overflow-hidden border" style={{ borderColor: "#E5E7EB" }}>
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3.5 border-b" style={{ borderColor: "#F3F4F6" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
          <span className="text-sm font-bold text-black flex-1">Filters</span>
          {activeCount > 0 && (
            <span className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ background: PRIMARY }}>
              {activeCount}
            </span>
          )}
          {activeCount > 0 && (
            <a href="/venues" className="text-xs font-medium" style={{ color: PRIMARY }}>Clear all</a>
          )}
        </div>
        <FilterForm {...formProps} />
      </div>

      {/* ── Mobile trigger button ──────────────────────────────────────────────── */}
      <button
        onClick={() => setSheetOpen(true)}
        className="md:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border text-sm font-semibold cursor-pointer transition-colors hover:bg-gray-50 w-full"
        style={{ borderColor: "#E5E7EB", color: "#374151" }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
        </svg>
        Filters
        {activeCount > 0 && (
          <span className="ml-auto flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white" style={{ background: PRIMARY }}>
            {activeCount}
          </span>
        )}
      </button>

      {/* ── Mobile bottom sheet ────────────────────────────────────────────────── */}
      {sheetOpen && (
        <>
          {/* Backdrop */}
          <div
            className="backdrop-animate fixed inset-0 z-40 md:hidden"
            style={{ background: "rgba(0,0,0,0.45)" }}
            onClick={() => setSheetOpen(false)}
          />

          {/* Sheet */}
          <div className="sheet-animate fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white rounded-t-3xl overflow-hidden flex flex-col"
            style={{ maxHeight: "88vh" }}>

            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ background: "#E5E7EB" }} />
            </div>

            {/* Sheet header */}
            <div className="flex items-center justify-between px-5 py-3 border-b shrink-0" style={{ borderColor: "#F3F4F6" }}>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-black">Filters</span>
                {activeCount > 0 && (
                  <span className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ background: PRIMARY }}>
                    {activeCount}
                  </span>
                )}
              </div>
              <button onClick={() => setSheetOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-gray-100 cursor-pointer"
                style={{ color: "#6B7280" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Scrollable filter content */}
            <div className="overflow-y-auto flex-1">
              <FilterForm {...formProps} />
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t shrink-0" style={{ borderColor: "#F3F4F6", paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
              <div className="flex gap-3">
                {activeCount > 0 && (
                  <a href="/venues"
                    className="flex-1 py-3 rounded-2xl text-sm font-bold text-center border transition-colors hover:bg-gray-50"
                    style={{ borderColor: "#E5E7EB", color: "#374151" }}>
                    Clear all
                  </a>
                )}
                <button onClick={() => setSheetOpen(false)}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-90 cursor-pointer"
                  style={{ background: PRIMARY }}>
                  Show Results
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
