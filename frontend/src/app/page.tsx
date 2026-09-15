import Link from "next/link";
import { Suspense } from "react";
import HeroSearch from "./HeroSearch";
import HeroBanner from "./HeroBanner";
import SiteHeader from "./SiteHeader";
import BottomNav from "./BottomNav";
import CustomerReviews from "./CustomerReviews";
import SiteFooter from "./SiteFooter";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5510";
const PRIMARY  = "#FF3B6B";

type VendorCard = {
  id:           string;
  name:         string;
  slug:         string;
  businessType: string;
  tagline:      string | null;
  city:         string;
  area:         string;
  logoUrl:      string | null;
  isVerified:   boolean;
  minPrice:      number | null;
  maxCapacity:   number;
  hallCount:     number;
  galleryImages: string[] | null;
  isFeatured?:   boolean;
};

async function fetchVendors(): Promise<VendorCard[]> {
  try {
    const res = await fetch(`${API_BASE}/api/vendor/profile`, { cache: "no-store" });
    const data = await res.json();
    return data.success ? data.vendors : [];
  } catch {
    return [];
  }
}

async function fetchFeatured(): Promise<VendorCard[]> {
  try {
    const res = await fetch(`${API_BASE}/api/vendor/profile/featured`, { cache: "no-store" });
    const data = await res.json();
    return data.success ? data.vendors : [];
  } catch {
    return [];
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string; type?: string; cap?: string; verified?: string }>;
}) {
  const sp = await searchParams;
  const [vendors, featured] = await Promise.all([fetchVendors(), fetchFeatured()]);

  // Filter
  const q        = sp.q?.toLowerCase().trim()        ?? "";
  const cityF    = sp.city?.toLowerCase().trim()     ?? "";
  const typeF    = sp.type?.toLowerCase().trim()     ?? "";
  const capF     = sp.cap ? Number(sp.cap)           : 0;
  const verifiedF = sp.verified === "1";

  function filterVendor(v: VendorCard) {
    if (q        && !v.name.toLowerCase().includes(q))               return false;
    if (cityF    && !v.city.toLowerCase().includes(cityF))           return false;
    if (typeF    && v.businessType.toLowerCase() !== typeF)          return false;
    if (verifiedF && !v.isVerified)                                  return false;
    if (capF     && (v.maxCapacity ?? 0) > capF)                     return false;
    return true;
  }

  const isFiltering = q || cityF || typeF || capF || verifiedF;
  const featuredIds = new Set(featured.map(v => v.id));
  const allFiltered = vendors.filter(filterVendor);
  const featuredFiltered = isFiltering ? [] : featured;
  const rest = isFiltering
    ? allFiltered
    : allFiltered.filter(v => !featuredIds.has(v.id));

  return (
    <div className="min-h-screen" style={{ background: "#F8F8F8" }}>

      <SiteHeader />
      <BottomNav />

      {/* ── Hero Banner ── */}
      <HeroBanner>
        <Suspense fallback={null}>
          <HeroSearch />
        </Suspense>
      </HeroBanner>

      {/* ── What We Offer ── */}
      <WhatWeOffer />

      {/* ── Trust & Safety ── */}
      <TrustSection />

      {/* ── Why Event Ease ── */}
      <WhyEventEase />

      {/* ── Our Mission ── */}
      <MissionSection />

      {/* ── Customer Reviews ── */}
      <CustomerReviews />

      {/* ── CTA Banner ── */}
      <CTABanner />

      {/* Venue Cards */}
      <div className="px-4 lg:px-8 pt-8 pb-28 md:pb-16">

        {vendors.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#F3F4F6" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/></svg>
            </div>
            <p className="text-base font-semibold text-black mb-1">No venues listed yet</p>
            <p className="text-sm mb-6" style={{ color: "#9CA3AF" }}>Be the first to register your venue on Event Ease.</p>
            <Link href="/vendor/onboarding"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: PRIMARY }}>
              Register Your Venue
            </Link>
          </div>
        ) : (
          <>
            {/* Search results label */}
            {isFiltering && (
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm font-semibold text-black">
                  {allFiltered.length} result{allFiltered.length !== 1 ? "s" : ""} found
                </p>
                <Link href="/" className="text-xs font-medium" style={{ color: PRIMARY }}>Clear filters ×</Link>
              </div>
            )}

            {/* No results */}
            {isFiltering && allFiltered.length === 0 && (
              <div className="flex flex-col items-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: "#F3F4F6" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    <line x1="8" y1="8" x2="14" y2="14"/><line x1="14" y1="8" x2="8" y2="14"/>
                  </svg>
                </div>
                <p className="text-base font-bold text-black mb-1">No venues found</p>
                <p className="text-sm mb-6 max-w-xs" style={{ color: "#9CA3AF" }}>
                  No venues match your current filters. Try adjusting your search or browse all venues.
                </p>
                <Link href="/"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                  style={{ background: PRIMARY }}>
                  Clear Filters
                </Link>
              </div>
            )}

            {/* Featured section */}
            {featuredFiltered.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  <h2 className="text-lg font-bold text-black">Featured Venues</h2>
                  <span className="text-sm" style={{ color: "#9CA3AF" }}>{featured.length} venue{featured.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featured.map(v => <VenueCard key={v.id} v={v} featured />)}
                </div>
              </div>
            )}

            {/* All venues */}
            {rest.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-black">{isFiltering ? "Results" : featuredFiltered.length > 0 ? "All Venues" : "Registered Venues"}</h2>
                  <span className="text-sm" style={{ color: "#9CA3AF" }}>{rest.length} venue{rest.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rest.map(v => <VenueCard key={v.id} v={v} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}

// ─── Verified Badge (same as profile page) ────────────────────────────────────
function VerifiedBadge() {
  return (
    <div className="relative group shrink-0">
      <svg width="18" height="18" viewBox="0 0 24 24" className="cursor-default">
        <polygon points="12,1 13.76,3.17 16.21,1.84 17,4.52 19.78,4.22 19.48,7 22.16,7.79 20.83,10.24 23,12 20.83,13.76 22.16,16.21 19.48,17 19.78,19.78 17,19.48 16.21,22.16 13.76,20.83 12,23 10.24,20.83 7.79,22.16 7,19.48 4.22,19.78 4.52,17 1.84,16.21 3.17,13.76 1,12 3.17,10.24 1.84,7.79 4.52,7 4.22,4.22 7,4.52 7.79,1.84 10.24,3.17" fill="#FF3B6B"/>
        <polyline points="7.5,12.5 10.5,15.5 16.5,8.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg text-xs font-medium text-white whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg"
        style={{ background: "#1F2937" }}>
        Verified by Event Ease
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent" style={{ borderTopColor: "#1F2937" }}/>
      </div>
    </div>
  );
}

// ─── Venue Card ───────────────────────────────────────────────────────────────
const VENUE_TYPES = new Set([
  "Banquet Hall", "Marquee", "Ballroom", "Wedding Lawn",
  "Hotel Banquet", "Rooftop Venue", "Farm House",
]);

function VenueCard({ v, featured = false }: { v: VendorCard; featured?: boolean }) {
  const coverImage = v.galleryImages?.[0] ?? null;

  return (
    <Link
      href={`/profile/${v.slug}`}
      className="bg-white rounded-2xl overflow-hidden border transition-all duration-200 hover:-translate-y-0.5 cursor-pointer block"
      style={{ borderColor: "#E5E7EB" }}
    >
      {/* ── Cover image ── */}
      <div className="px-3 pt-3">
        <div className="relative h-44 rounded-xl overflow-hidden">
          {coverImage ? (
            <img
              src={coverImage}
              alt={v.name}
              className="w-full h-full object-cover transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: "#F3F4F6" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
          )}

          {/* Featured badge — top left */}
          {featured && (
            <span className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: "#F59E0B", color: "#fff" }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              Featured
            </span>
          )}

          {/* Business type — top right */}
          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)" }}>
            {v.businessType}
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-4">

        {/* Logo + name + location */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl shrink-0 overflow-hidden border-2 border-white shadow-sm"
            style={{ background: "linear-gradient(135deg, #FF3B6B, #FF8FA3)" }}>
            {v.logoUrl
              ? <img src={v.logoUrl} alt={v.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center font-black text-white text-base">{v.name[0]}</div>
            }
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-black leading-tight truncate">{v.name}</p>
              {v.isVerified && <VerifiedBadge />}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <p className="text-[11px] truncate" style={{ color: "#9CA3AF" }}>
                {[v.area, v.city].filter(Boolean).join(", ")}
              </p>
            </div>
          </div>
        </div>

        {/* Tagline */}
        {v.tagline && (
          <p className="text-xs mb-3 line-clamp-1 leading-relaxed" style={{ color: "#6B7280" }}>{v.tagline}</p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 py-3 border-y" style={{ borderColor: "#F3F4F6" }}>
          {v.maxCapacity > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "#F9FAFB" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                </svg>
              </div>
              <span className="text-[11px] font-medium" style={{ color: "#374151" }}>
                {v.maxCapacity >= 1000 ? `${(v.maxCapacity / 1000).toFixed(1)}K` : v.maxCapacity}
              </span>
            </div>
          )}
          {v.hallCount > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "#F9FAFB" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                </svg>
              </div>
              <span className="text-[11px] font-medium" style={{ color: "#374151" }}>
                {VENUE_TYPES.has(v.businessType)
                  ? `${v.hallCount} hall${v.hallCount !== 1 ? "s" : ""}`
                  : `${v.hallCount} service${v.hallCount !== 1 ? "s" : ""}`}
              </span>
            </div>
          )}
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide font-medium" style={{ color: "#9CA3AF" }}>Starting from</p>
            {v.minPrice != null
              ? <p className="text-sm font-bold mt-0.5" style={{ color: PRIMARY }}>
                  Rs. {v.minPrice.toLocaleString("en-PK")}
                </p>
              : <p className="text-sm font-semibold mt-0.5" style={{ color: PRIMARY }}>Contact for price</p>
            }
          </div>
          <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: PRIMARY }}>
            View
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </span>
        </div>

      </div>
    </Link>
  );
}

// ─── Our Mission — torn-edge banner ─────────────────────────────────────────────
function MissionSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="relative w-full">
        <img
          src="/pattern.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "top", opacity: 0.85 }}
        />
        <div className="relative z-10 flex flex-col items-center text-center px-4 pt-72 sm:pt-[26rem] lg:pt-[30rem] pb-16 sm:pb-20 max-w-3xl mx-auto">
          <h2 className="font-black tracking-tight text-white mb-6" style={{ lineHeight: 1.18 }}>
            <span className="block text-3xl sm:text-4xl lg:text-5xl">Our Mission:</span>
            <span className="block text-3xl sm:text-4xl lg:text-5xl">empowering vendors, not just bookings</span>
          </h2>
          <p className="text-sm sm:text-base leading-relaxed mb-8 max-w-xl" style={{ color: "rgba(255,255,255,0.90)" }}>
            We don&apos;t just process bookings — we empower vendors. Event Ease replaces paper
            diaries, Excel sheets, and WhatsApp chaos with one simple system that helps banquet
            halls and event businesses across Pakistan save time and grow revenue.
          </p>
          <Link
            href="/how-it-works"
            className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: "#111827" }}
          >
            Learn More
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Trust & Safety ─────────────────────────────────────────────────────────────
function TrustSection() {
  return (
    <section className="px-4 lg:px-8 py-16" style={{ background: "#fff" }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] mb-4 px-3.5 py-1.5 rounded-full"
            style={{ background: "#FFF0F4", color: PRIMARY }}>
            Trust &amp; Safety
          </span>
          <h2 className="text-3xl lg:text-5xl font-black text-black tracking-tight">
            Your trust is our priority
          </h2>
        </div>

        {/* Card */}
        <div className="relative rounded-3xl overflow-hidden" style={{ background: "#FFE1EA" }}>
          {/* Watermark logo */}
          <img
            src="/logo/logo-icon.png"
            alt=""
            className="absolute left-4 top-1/2 -translate-y-1/2 w-[300px] sm:w-[360px] opacity-40 pointer-events-none select-none"
          />

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-stretch">
            {/* Person image */}
            <div className="w-full sm:w-[36%] flex items-end justify-center shrink-0 pt-8">
              <img
                src="/home/fav_section/new_user.png"
                alt=""
                className="h-[260px] sm:h-[420px] w-auto object-contain"
              />
            </div>

            {/* Text */}
            <div className="flex-1 flex flex-col justify-center px-6 sm:pl-2 sm:pr-14 py-8 sm:py-14">
              <h3 className="text-2xl sm:text-3xl font-black text-black mb-4 tracking-tight">
                Verification is non-negotiable.
              </h3>
              <p className="text-sm sm:text-base leading-relaxed mb-7 max-w-md" style={{ color: "#4B5563" }}>
                Every vendor on Event Ease is verified before they go live — real businesses, real
                reviews, and secure advance payments. Book your venue with confidence, every time.
              </p>
              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center w-fit px-6 py-3.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: PRIMARY }}
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── What We Offer ─────────────────────────────────────────────────────────────
// ─── Why Event Ease ───────────────────────────────────────────────────────────
const WHY_STATS = [
  {
    value: "10,000+",
    label: "Happy Users",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF3B6B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M8 13s1.5 2 4 2 4-2 4-2"/>
        <line x1="9" y1="9" x2="9.01" y2="9"/>
        <line x1="15" y1="9" x2="15.01" y2="9"/>
      </svg>
    ),
  },
  {
    value: "50+",
    label: "Verified Venues",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF3B6B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
      </svg>
    ),
  },
  {
    value: "100%",
    label: "Secure Booking",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF3B6B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0110 0v4"/>
      </svg>
    ),
  },
  {
    value: "500+",
    label: "Events Planned",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF3B6B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
      </svg>
    ),
  },
];

function WhyEventEase() {
  return (
    <section className="px-4 lg:px-8 py-16" style={{ background: "#fff" }}>
      {/* Title */}
      <h2 className="text-3xl lg:text-4xl font-black text-center tracking-tight mb-10" style={{ color: "#111827" }}>
        Why <span style={{ color: "#FF3B6B" }}>Event Ease</span>?
      </h2>

      {/* Stats pill */}
      <div
        className="max-w-4xl mx-auto rounded-3xl px-6 py-10"
        style={{ background: "#FFF5F7" }}
      >
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {WHY_STATS.map((s, i) => (
            <div key={s.label} className="flex flex-col items-center text-center px-4 py-2 relative">

              {/* Vertical divider — between items */}
              {i > 0 && (
                <span
                  className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 h-16 w-px"
                  style={{ background: "#F9C6CE" }}
                />
              )}
              {/* Mobile divider — between rows */}
              {i === 2 && (
                <span
                  className="lg:hidden absolute -top-2 left-1/4 right-1/4 h-px"
                  style={{ background: "#F9C6CE" }}
                />
              )}

              {/* Icon circle */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                style={{ background: "#FFE4EA" }}
              >
                {s.icon}
              </div>

              {/* Number */}
              <p className="text-3xl lg:text-4xl font-black mb-1" style={{ color: "#111827" }}>
                {s.value}
              </p>

              {/* Label */}
              <p className="text-sm" style={{ color: "#9CA3AF" }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const SERVICES = [
  {
    label: "Venue Halls",
    desc:  "Grand banquet halls, marquees & ballrooms for every celebration.",
    img:   "/home/services/venuehalls.png",
    browseHref:  "/venues?type=Banquet+Hall",
    browseLabel: "Browse Venues",
  },
  {
    label: "Photography",
    desc:  "Professional wedding photographers & cinematic videographers.",
    img:   "/home/services/photographey.png",
    browseHref:  "/venues?type=Photography",
    browseLabel: "Browse Photographers",
  },
  {
    label: "Bridal Makeup",
    desc:  "Glamorous bridal makeup & grooming artists for your big day.",
    img:   "/home/services/bradial.png",
    browseHref:  "/venues?type=Beauty+Parlor",
    browseLabel: "Browse Makeup Artists",
  },
  {
    label: "Decoration",
    desc:  "Stunning floral arrangements & stage decoration setups.",
    img:   "/home/services/decoration.png",
    browseHref:  "/venues?type=Decoration",
    browseLabel: "Browse Decorators",
  },
  {
    label: "Catering",
    desc:  "Gourmet menus & elegant catering for every occasion.",
    img:   "/home/services/catering.png",
    browseHref:  "/venues?type=Catering",
    browseLabel: "Browse Caterers",
  },
  {
    label: "Mehndi & Henna",
    desc:  "Intricate traditional henna art from skilled mehndi artists.",
    img:   "/home/services/mehndi_hena.png",
    browseHref:  "/venues?q=mehndi",
    browseLabel: "Browse Mehndi Artists",
  },
];

function ServiceLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm font-bold group/link w-fit"
      style={{ color: "#111827" }}
    >
      {label}
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
        className="transition-transform group-hover/link:translate-x-0.5">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </Link>
  );
}

function WhatWeOffer() {
  return (
    <section className="px-4 lg:px-8 py-16" style={{ background: "#F8F8F8" }}>
      {/* Section header */}
      <div className="text-center mb-10">
        <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] mb-4 px-3.5 py-1.5 rounded-full"
          style={{ background: "#FFF0F4", color: PRIMARY }}>
          Event Ease
        </span>
        <h2 className="text-3xl lg:text-5xl font-black text-black tracking-tight">
          One platform, every event service
        </h2>
      </div>

      {/* Service cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl mx-auto">
        {SERVICES.map((s) => (
          <div
            key={s.label}
            className="group rounded-3xl bg-white overflow-hidden flex flex-col sm:flex-row transition-shadow duration-300 hover:shadow-xl"
            style={{ border: "1.5px solid #E5E7EB" }}
          >
            {/* Illustration */}
            <div className="w-full sm:w-[44%] shrink-0 p-3 h-52 sm:h-auto">
              <img
                src={s.img}
                alt={s.label}
                className="w-full h-full object-cover rounded-2xl transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>

            {/* Text */}
            <div className="flex-1 p-6 sm:p-7 flex flex-col justify-center">
              <h3 className="text-xl sm:text-2xl font-black text-black mb-2 tracking-tight">
                {s.label}
              </h3>
              <p className="text-sm mb-5 leading-relaxed" style={{ color: "#6B7280" }}>
                {s.desc}
              </p>
              <div className="flex flex-col gap-2.5">
                <ServiceLink href={s.browseHref} label={s.browseLabel} />
                <ServiceLink href="/vendor/onboarding" label="List Your Business" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────
const BENEFITS = [
  { icon: "M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z M13 2v7h7", label: "Free listing setup" },
  { icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 7a4 4 0 100 8 4 4 0 000-8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75", label: "Reach 10,000+ couples" },
  { icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", label: "Verified badge included" },
  { icon: "M12 2v20 M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6", label: "Zero commission on bookings" },
];

function CTABanner() {
  return (
    <section
      className="mx-4 lg:mx-8 my-12 rounded-3xl overflow-hidden relative"
      style={{ background: "#FFE1EA" }}
    >
      {/* Watermark logo */}
      <img
        src="/logo/logo-icon.png"
        alt=""
        className="absolute right-4 top-1/2 -translate-y-1/2 w-[300px] sm:w-[360px] opacity-40 pointer-events-none select-none"
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col-reverse sm:flex-row items-center">

        {/* Text */}
        <div className="flex-1 flex flex-col items-start text-left px-8 sm:pl-14 sm:pr-6 py-12 sm:py-16 w-full">

          {/* Eyebrow */}
          <span
            className="inline-block text-xs font-bold uppercase tracking-[0.22em] mb-5 px-3 py-1 rounded-full"
            style={{ background: "#fff", color: PRIMARY }}
          >
            For Business Owners
          </span>

          <h2
            className="text-3xl lg:text-4xl font-black tracking-tight"
            style={{ color: "#111827", lineHeight: 1.15 }}
          >
            Grow your business with{" "}
            <span style={{ color: PRIMARY }}>Event Ease.</span>
          </h2>

          <p className="text-sm leading-relaxed mt-4 mb-7 max-w-md" style={{ color: "#4B5563" }}>
            Join hundreds of venues, photographers &amp; decorators already listed on Pakistan&apos;s fastest-growing event marketplace. Get discovered by couples planning their big day.
          </p>

          {/* Benefits */}
          <ul className="flex flex-col gap-2.5 mb-8 w-full max-w-xs">
            {BENEFITS.map(b => (
              <li key={b.label} className="flex items-center gap-3">
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "#fff" }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={b.icon} />
                  </svg>
                </span>
                <span className="text-sm font-semibold" style={{ color: "#374151" }}>{b.label}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/vendor/onboarding"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: "linear-gradient(135deg, #FF3B6B, #FF6B8A)" }}
          >
            <img src="/logo/white_icon.png" alt="" width={14} height={14} className="shrink-0" />
            List Your Business
          </Link>
        </div>

        {/* Person image — hidden on mobile */}
        <div className="hidden sm:flex sm:w-[36%] items-end justify-center shrink-0 sm:pt-10">
          <img
            src="/home/fav_section/new_user.png"
            alt=""
            className="h-[220px] sm:h-[380px] w-auto object-contain"
          />
        </div>
      </div>
    </section>
  );
}
