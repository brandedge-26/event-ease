"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const PRIMARY = "#FF3B6B";

const CITIES = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta"];

export default function HeroSearch() {
  const router      = useRouter();
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
      {/* Search Panel */}
      <div className="w-full max-w-3xl rounded-2xl overflow-hidden bg-white"
        style={{
          border: "1px solid #E5E7EB",
          boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
        }}>
        {/* Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">

          {/* Venue name */}
          <div className="flex items-center gap-3 px-5 py-4">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Venue Name</p>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && search()}
                type="text"
                placeholder="Search venues…"
                className="w-full text-sm font-medium outline-none bg-transparent mt-0.5 placeholder:text-gray-400"
                style={{ color: "#111827" }}
              />
            </div>
          </div>

          {/* City */}
          <div className="flex items-center gap-3 px-5 py-4">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>City</p>
              <select value={city} onChange={e => setCity(e.target.value)}
                className="w-full text-sm font-medium outline-none bg-transparent mt-0.5 appearance-none cursor-pointer"
                style={{ color: city ? "#111827" : "#9CA3AF" }}>
                <option value="">All Cities</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Venue type */}
          <div className="flex items-center gap-3 px-5 py-4">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4"/>
              <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/>
            </svg>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Venue Type</p>
              <select value={type} onChange={e => setType(e.target.value)}
                className="w-full text-sm font-medium outline-none bg-transparent mt-0.5 appearance-none cursor-pointer"
                style={{ color: type ? "#111827" : "#9CA3AF" }}>
                <option value="">All Types</option>
                <option value="Banquet Hall">Banquet Hall</option>
                <option value="Marquee">Marquee</option>
                <option value="Ballroom">Ballroom</option>
              </select>
            </div>
          </div>
        </div>

        {/* Row 2 */}
        <div className="flex items-center gap-4 px-5 py-3 border-t border-gray-100 flex-wrap"
          style={{ background: "#FAFAFA" }}>
          {/* Capacity */}
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
            <select value={capacity} onChange={e => setCapacity(e.target.value)}
              className="text-xs font-medium outline-none bg-transparent appearance-none cursor-pointer"
              style={{ color: "#374151" }}>
              <option value="">Any Capacity</option>
              <option value="100">Up to 100</option>
              <option value="300">100 – 300</option>
              <option value="600">300 – 600</option>
              <option value="1000">600 – 1000</option>
              <option value="9999">1000+</option>
            </select>
          </div>

          {/* Verified toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={verified} onChange={e => setVerified(e.target.checked)}
              className="w-3.5 h-3.5 rounded accent-pink-500" />
            <span className="text-xs font-medium" style={{ color: "#374151" }}>Verified only</span>
          </label>

          {/* Search btn */}
          <button onClick={() => search()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 ml-auto cursor-pointer"
            style={{ background: PRIMARY }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Search
          </button>
        </div>
      </div>

      {/* City chips */}
      <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
        <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Popular:</span>
        {["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Multan"].map(c => (
          <button key={c} onClick={() => pickCity(c)}
            className="px-3 py-1 rounded-full text-xs font-medium transition-all"
            style={{
              background:  city === c ? "#FF3B6B"              : "rgba(255,255,255,0.7)",
              color:       city === c ? "#fff"                 : "#374151",
              border:      city === c ? "1px solid #FF3B6B"    : "1px solid rgba(209,213,219,0.8)",
              backdropFilter: "blur(8px)",
            }}>
            {c}
          </button>
        ))}
      </div>
    </>
  );
}
