"use client";

import { useState } from "react";
import type { Vendor } from "@/lib/vendorData";

type Tab = "about" | "gallery" | "halls" | "reviews";

const TAB_LABELS: Record<Tab, string> = {
  about: "About",
  gallery: "Gallery",
  halls: "Halls & Pricing",
  reviews: "Reviews",
};

const PRIMARY       = "#FF3B6B";
const PRIMARY_LIGHT = "#FFF0F4";

export default function PublicProfile({ vendor }: { vendor: Vendor }) {
  const [tab, setTab] = useState<Tab>("about");
  const minPrice = Math.min(...vendor.halls.map(h => h.price));

  return (
    <div className="min-h-screen" style={{ background: "#F9FAFB" }}>

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-20 bg-white" style={{ borderBottom: "1px solid #E5E7EB" }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-10 h-15 flex items-center justify-between" style={{ height: 56 }}>
          <div className="flex items-center gap-2">
            <a href="/" className="flex items-center gap-0.5">
              <span className="text-base font-black text-black">Event</span>
              <span className="text-base font-black" style={{ color: PRIMARY }}>Ease</span>
            </a>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            <span className="text-sm" style={{ color: "#6B7280" }}>{vendor.name}</span>
          </div>
          <a href="/"
            className="flex items-center gap-1.5 text-sm font-medium px-3.5 py-1.5 rounded-lg border transition-colors hover:bg-gray-50"
            style={{ color: "#374151", borderColor: "#E5E7EB" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            All Venues
          </a>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-5 lg:px-10 py-8">

        {/* ── Venue Header ── */}
        <div className="mb-6 lg:mb-8">
          <div className="flex items-start gap-4 mb-5 lg:mb-6">
            <div className="w-14 h-14 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center text-xl lg:text-3xl font-black text-white shrink-0"
              style={{ background: vendor.coverGradient }}>
              {vendor.name[0]}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl lg:text-3xl font-bold tracking-tight text-black leading-tight">{vendor.name}</h1>
                <span className="inline-flex items-center gap-1 text-[10px] lg:text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: PRIMARY_LIGHT, color: PRIMARY }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Verified
                </span>
              </div>
              <p className="text-sm lg:text-base mb-2" style={{ color: "#6B7280" }}>{vendor.tagline}</p>
              <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs lg:text-sm" style={{ color: "#6B7280" }}>
                <span className="flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {vendor.location}
                </span>
                <span className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(n => (
                    <svg key={n} width="11" height="11" viewBox="0 0 24 24" fill={n <= Math.round(vendor.rating) ? PRIMARY : "#E5E7EB"} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  ))}
                  <strong className="text-black ml-1">{vendor.rating}</strong>
                  <span className="ml-0.5">({vendor.reviewCount})</span>
                </span>
                <span>Est. {vendor.established}</span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Rating",        value: vendor.rating.toString(),             suffix: "/5"   },
              { label: "Reviews",       value: vendor.reviewCount.toString(),         suffix: ""     },
              { label: "Events Hosted", value: vendor.totalEvents.toLocaleString(),  suffix: "+"    },
              { label: "Max Capacity",  value: vendor.maxCapacity.toString(),        suffix: " pax" },
            ].map(s => (
              <div key={s.label} className="text-center py-4 px-3 rounded-2xl bg-white" style={{ border: "1px solid #F0F0F0" }}>
                <p className="text-xl lg:text-2xl font-bold leading-tight" style={{ color: PRIMARY }}>
                  {s.value}<span className="text-xs font-normal ml-0.5" style={{ color: "#9CA3AF" }}>{s.suffix}</span>
                </p>
                <p className="text-[11px] mt-1" style={{ color: "#9CA3AF" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="flex gap-8 items-start">

          {/* ── Left: Content ── */}
          <div className="flex-1 min-w-0">

            {/* Tabs */}
            <div className="flex gap-1 mb-6 p-1 rounded-xl overflow-x-auto" style={{ background: "#F3F4F6" }}>
              {(["about", "gallery", "halls", "reviews"] as Tab[]).map(t => {
                const mobileLabel: Record<Tab, string> = { about: "About", gallery: "Gallery", halls: "Pricing", reviews: "Reviews" };
                return (
                  <button key={t} onClick={() => setTab(t)}
                    className="flex-1 py-2 px-2 lg:px-3 text-xs lg:text-sm font-medium rounded-lg transition-all whitespace-nowrap min-w-0"
                    style={tab === t
                      ? { background: "#fff", color: PRIMARY, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }
                      : { color: "#6B7280" }
                    }>
                    <span className="lg:hidden">{mobileLabel[t]}</span>
                    <span className="hidden lg:inline">{TAB_LABELS[t]}</span>
                  </button>
                );
              })}
            </div>

            {/* ── About ── */}
            {tab === "about" && (
              <div className="space-y-5">

                <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #F0F0F0" }}>
                  <Label>About</Label>
                  <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{vendor.about}</p>
                </div>

                <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #F0F0F0" }}>
                  <Label>Services</Label>
                  <div className="flex flex-wrap gap-2">
                    {vendor.services.map(s => (
                      <span key={s} className="text-xs font-semibold px-3 py-1.5 rounded-full border"
                        style={{ background: PRIMARY_LIGHT, color: PRIMARY, borderColor: PRIMARY + "28" }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #F0F0F0" }}>
                  <Label>Amenities & Facilities</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {vendor.amenities.map(a => (
                      <div key={a} className="flex items-center gap-2.5 py-2 px-3 rounded-xl" style={{ background: "#F9FAFB" }}>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: PRIMARY_LIGHT }}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <span className="text-sm" style={{ color: "#374151" }}>{a}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #F0F0F0" }}>
                  <Label>Contact Information</Label>
                  <div className="space-y-3">
                    {[
                      { label: "Phone",   value: vendor.phone,    icon: <PhoneIcon2 />,    href: `tel:${vendor.phone}` },
                      { label: "Email",   value: vendor.email,    icon: <EmailIcon />,     href: `mailto:${vendor.email}` },
                      { label: "Address", value: vendor.location, icon: <LocationIcon />,  href: undefined },
                    ].map(row => (
                      <div key={row.label} className="flex items-center gap-3 py-3 px-4 rounded-xl" style={{ background: "#F9FAFB" }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: PRIMARY_LIGHT, color: PRIMARY }}>
                          {row.icon}
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "#9CA3AF" }}>{row.label}</p>
                          {row.href
                            ? <a href={row.href} className="text-sm font-medium text-black hover:underline">{row.value}</a>
                            : <p className="text-sm font-medium text-black">{row.value}</p>
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Gallery ── */}
            {tab === "gallery" && (
              <div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {vendor.gallery.map((g, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden relative group cursor-pointer" style={{ aspectRatio: "4/3" }}>
                      <div className="absolute inset-0" style={{ background: g.gradient }} />
                      {/* Subtle noise */}
                      <div className="absolute inset-0 opacity-[0.07]"
                        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-200" />
                      {/* Bottom gradient */}
                      <div className="absolute bottom-0 left-0 right-0 h-2/3" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)" }} />
                      {/* Icon badge */}
                      <div className="absolute top-3 left-3 w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)" }}>
                        <GalleryTypeIcon index={i} />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-3.5">
                        <p className="text-white font-semibold text-sm leading-tight">{g.label}</p>
                        <p className="text-white/65 text-xs mt-0.5">{g.sublabel}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs mt-4" style={{ color: "#9CA3AF" }}>{vendor.gallery.length} event highlights</p>
              </div>
            )}

            {/* ── Halls & Pricing ── */}
            {tab === "halls" && (
              <div className="space-y-4">
                {vendor.halls.map((hall, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #F0F0F0" }}>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h4 className="text-base font-bold text-black">{hall.name}</h4>
                          <p className="text-xs mt-1 flex items-center gap-1.5" style={{ color: "#6B7280" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                            Up to {hall.capacity} guests
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xl font-bold" style={{ color: PRIMARY }}>
                            Rs. {hall.price.toLocaleString("en-PK")}
                          </p>
                          <p className="text-[10px]" style={{ color: "#9CA3AF" }}>per event</p>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed mb-4" style={{ color: "#6B7280" }}>{hall.desc}</p>
                      <div className="flex flex-col sm:flex-row gap-2.5 pt-4" style={{ borderTop: "1px solid #F3F4F6" }}>
                        <a href={`tel:${vendor.phone}`}
                          className="flex-1 py-2.5 rounded-xl text-sm font-bold text-center transition-opacity hover:opacity-90"
                          style={{ background: PRIMARY, color: "#fff" }}>
                          Book This Hall
                        </a>
                        <a href={`https://wa.me/${vendor.whatsapp}?text=Hi! I'm interested in ${hall.name} at ${vendor.name}.`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex-1 py-2.5 rounded-xl text-sm font-bold text-center border transition-colors hover:bg-gray-50"
                          style={{ background: "#fff", color: "#111", borderColor: "#E5E7EB" }}>
                          WhatsApp Enquiry
                        </a>
                      </div>
                    </div>
                  </div>
                ))}

                {/* CTA banner */}
                <div className="rounded-2xl p-6 text-center" style={{ background: vendor.coverGradient }}>
                  <p className="text-white font-bold text-base mb-1">Not sure which hall fits your event?</p>
                  <p className="text-white/80 text-sm mb-4">Our team is happy to help you choose the perfect space.</p>
                  <a href={`tel:${vendor.phone}`}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold"
                    style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.35)" }}>
                    <PhoneIcon /> {vendor.phone}
                  </a>
                </div>
              </div>
            )}

            {/* ── Reviews ── */}
            {tab === "reviews" && (
              <div className="space-y-4">
                {/* Rating summary */}
                <div className="bg-white rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-5 sm:gap-8" style={{ border: "1px solid #F0F0F0" }}>
                  <div className="text-center shrink-0">
                    <p className="text-5xl font-black leading-none" style={{ color: PRIMARY }}>{vendor.rating}</p>
                    <div className="flex justify-center gap-0.5 my-2">
                      {[1,2,3,4,5].map(n => (
                        <svg key={n} width="14" height="14" viewBox="0 0 24 24" fill={n <= Math.round(vendor.rating) ? PRIMARY : "#E5E7EB"} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      ))}
                    </div>
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>{vendor.reviewCount} reviews</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5,4,3,2,1].map(star => {
                      const pct = star === 5 ? 72 : star === 4 ? 20 : star === 3 ? 5 : star === 2 ? 2 : 1;
                      return (
                        <div key={star} className="flex items-center gap-2.5">
                          <span className="text-xs w-2 text-right" style={{ color: "#9CA3AF" }}>{star}</span>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill={PRIMARY} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                          <div className="flex-1 h-1.5 rounded-full" style={{ background: "#F3F4F6" }}>
                            <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: PRIMARY }} />
                          </div>
                          <span className="text-[10px] w-5 text-right" style={{ color: "#9CA3AF" }}>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Review cards */}
                {vendor.reviews.map((r, i) => (
                  <div key={i} className="bg-white rounded-2xl p-5" style={{ border: "1px solid #F0F0F0" }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0"
                          style={{ background: vendor.coverGradient }}>
                          {r.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-black">{r.name}</p>
                          <p className="text-[10px]" style={{ color: "#9CA3AF" }}>{r.date}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(n => (
                          <svg key={n} width="12" height="12" viewBox="0 0 24 24" fill={n <= r.rating ? PRIMARY : "#E5E7EB"} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{r.text}</p>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* ── Right: Sticky Sidebar (desktop only) ── */}
          <div className="hidden lg:block w-72 xl:w-80 shrink-0">
            <div className="sticky top-20 rounded-2xl overflow-hidden" style={{ border: "1px solid #E5E7EB", background: "#fff" }}>
              <div className="p-5">
                <p className="text-[11px] font-medium mb-1" style={{ color: "#9CA3AF" }}>Starting from</p>
                <p className="text-3xl font-black leading-tight" style={{ color: PRIMARY }}>
                  Rs. {minPrice.toLocaleString("en-PK")}
                </p>
                <p className="text-xs mt-0.5 mb-5" style={{ color: "#9CA3AF" }}>
                  per event · {vendor.halls.length} hall{vendor.halls.length > 1 ? "s" : ""} available
                </p>

                <a href={`tel:${vendor.phone}`}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold mb-2.5 transition-opacity hover:opacity-90"
                  style={{ background: PRIMARY, color: "#fff" }}>
                  <PhoneIcon /> Call Now
                </a>
                <a href={`https://wa.me/${vendor.whatsapp}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold border transition-colors hover:bg-gray-50"
                  style={{ background: "#fff", color: "#111", borderColor: "#E5E7EB" }}>
                  <WhatsAppIcon /> WhatsApp
                </a>

                <div className="mt-5 pt-5 space-y-3" style={{ borderTop: "1px solid #F3F4F6" }}>
                  {[
                    { k: "Max Guests",      v: `${vendor.maxCapacity} pax` },
                    { k: "Events Hosted",   v: `${vendor.totalEvents.toLocaleString()}+` },
                    { k: "Rating",          v: `${vendor.rating} / 5` },
                    { k: "Established",     v: `${vendor.established}` },
                  ].map(row => (
                    <div key={row.k} className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: "#6B7280" }}>{row.k}</span>
                      <span className="text-sm font-semibold text-black">{row.v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-5 py-3 text-center" style={{ borderTop: "1px solid #F9FAFB", background: "#FAFAFA" }}>
                <p className="text-[10px]" style={{ color: "#9CA3AF" }}>
                  Powered by{" "}
                  <span className="font-semibold" style={{ color: PRIMARY }}>Event Ease</span>
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Mobile bottom padding */}
        <div className="h-24 lg:hidden" />
      </div>

      {/* ── Mobile Sticky Bottom CTA ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white" style={{ borderTop: "1px solid #E5E7EB", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="flex items-center gap-2.5 px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px]" style={{ color: "#9CA3AF" }}>Starting from</p>
            <p className="text-base font-bold leading-tight truncate" style={{ color: PRIMARY }}>
              Rs. {minPrice.toLocaleString("en-PK")}
            </p>
          </div>
          <a href={`tel:${vendor.phone}`}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 shrink-0"
            style={{ background: PRIMARY, color: "#fff" }}>
            <PhoneIcon /> Call Now
          </a>
          <a href={`https://wa.me/${vendor.whatsapp}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center w-11 h-11 rounded-xl border transition-colors hover:bg-gray-50 shrink-0"
            style={{ background: "#fff", color: "#111", borderColor: "#E5E7EB" }}>
            <WhatsAppIcon />
          </a>
        </div>
      </div>

    </div>
  );
}

// ─── Small helpers ─────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "#9CA3AF" }}>
      {children}
    </p>
  );
}

// Gallery icon set (SVG only, no emojis)
function GalleryTypeIcon({ index }: { index: number }) {
  const icons = [
    <svg key={0} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    <svg key={1} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="18" rx="1"/><line x1="8" y1="21" x2="8" y2="3"/><line x1="16" y1="21" x2="16" y2="3"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="2" y1="15" x2="22" y2="15"/></svg>,
    <svg key={2} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
    <svg key={3} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>,
    <svg key={4} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8C8 10 5.9 16.17 3.82 19.42A2 2 0 003 21h18a8 8 0 00-4-13z"/></svg>,
    <svg key={5} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0014 0"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>,
  ];
  return icons[index % icons.length];
}

// ─── Icons ─────────────────────────────────────────────────────────────────────
function PhoneIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .84h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.64a16 16 0 006.29 6.29l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>;
}
function PhoneIcon2() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .84h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.64a16 16 0 006.29 6.29l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>;
}
function EmailIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
}
function LocationIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
}
function WhatsAppIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>;
}
