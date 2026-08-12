import Link from "next/link";
import { Suspense } from "react";
import SiteHeader from "../SiteHeader";
import BottomNav from "../BottomNav";
import VenueFilters from "./VenueFilters";
import VenueSortBar from "./VenueSortBar";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5510";
const PRIMARY = "#FF3B6B";

type VendorCard = {
  id: string;
  name: string;
  slug: string;
  businessType: string;
  tagline: string | null;
  city: string;
  area: string;
  logoUrl: string | null;
  isVerified: boolean;
  minPrice: number | null;
  maxCapacity: number;
  hallCount: number;
  galleryImages: string[] | null;
  isFeatured?: boolean;
};

async function fetchVendors(): Promise<VendorCard[]> {
  try {
    const res = await fetch(`${API_BASE}/api/vendor/profile`, {
      cache: "no-store",
    });
    const data = await res.json();
    return data.success ? data.vendors : [];
  } catch {
    return [];
  }
}

async function fetchFeatured(): Promise<VendorCard[]> {
  try {
    const res = await fetch(`${API_BASE}/api/vendor/profile/featured`, {
      cache: "no-store",
    });
    const data = await res.json();
    return data.success ? data.vendors : [];
  } catch {
    return [];
  }
}

function filterVendor(
  v: VendorCard,
  {
    q,
    cityF,
    typeF,
    capF,
    verifiedF,
    minPriceF,
    maxPriceF,
  }: {
    q: string;
    cityF: string;
    typeF: string;
    capF: number;
    verifiedF: boolean;
    minPriceF: number;
    maxPriceF: number;
  }
): boolean {
  if (q && !v.name.toLowerCase().includes(q)) return false;
  if (cityF && !v.city.toLowerCase().includes(cityF)) return false;
  if (typeF && v.businessType.toLowerCase() !== typeF.toLowerCase()) return false;
  if (verifiedF && !v.isVerified) return false;
  if (capF && (v.maxCapacity ?? 0) > capF) return false;
  if (minPriceF && (v.minPrice ?? 0) < minPriceF) return false;
  if (maxPriceF && (v.minPrice ?? 999999) > maxPriceF) return false;
  return true;
}

function sortVendors(arr: VendorCard[], sort: string): VendorCard[] {
  switch (sort) {
    case "price_asc":
      return [...arr].sort(
        (a, b) => (a.minPrice ?? 999999) - (b.minPrice ?? 999999)
      );
    case "price_desc":
      return [...arr].sort((a, b) => (b.minPrice ?? 0) - (a.minPrice ?? 0));
    case "name_asc":
      return [...arr].sort((a, b) => a.name.localeCompare(b.name));
    case "capacity":
      return [...arr].sort((a, b) => b.maxCapacity - a.maxCapacity);
    default:
      return [...arr].sort(
        (a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0)
      );
  }
}

// ─── Verified Badge ───────────────────────────────────────────────────────────
function VerifiedBadge() {
  return (
    <div className="relative group shrink-0">
      <svg width="18" height="18" viewBox="0 0 24 24" className="cursor-default">
        <polygon
          points="12,1 13.76,3.17 16.21,1.84 17,4.52 19.78,4.22 19.48,7 22.16,7.79 20.83,10.24 23,12 20.83,13.76 22.16,16.21 19.48,17 19.78,19.78 17,19.48 16.21,22.16 13.76,20.83 12,23 10.24,20.83 7.79,22.16 7,19.48 4.22,19.78 4.52,17 1.84,16.21 3.17,13.76 1,12 3.17,10.24 1.84,7.79 4.52,7 4.22,4.22 7,4.52 7.79,1.84 10.24,3.17"
          fill="#FF3B6B"
        />
        <polyline
          points="7.5,12.5 10.5,15.5 16.5,8.5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <div
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg text-xs font-medium text-white whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg"
        style={{ background: "#1F2937" }}
      >
        Verified by Event Ease
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent"
          style={{ borderTopColor: "#1F2937" }}
        />
      </div>
    </div>
  );
}

// ─── Venue Card ───────────────────────────────────────────────────────────────
function VenueCard({ v }: { v: VendorCard }) {
  const coverImage = v.galleryImages?.[0] ?? null;

  return (
    <Link
      href={`/profile/${v.slug}`}
      className="bg-white rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 cursor-pointer block"
      style={{ border: "1px solid #E5E7EB" }}
    >
      {/* Cover image */}
      <div className="px-3 pt-3">
        <div className="relative h-44 rounded-xl overflow-hidden">
          {coverImage ? (
            <img
              src={coverImage}
              alt={v.name}
              className="w-full h-full object-cover transition-transform duration-300"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: "#F3F4F6" }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#D1D5DB"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
          )}

          {/* Featured badge — top left */}
          {v.isFeatured && (
            <span
              className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: "#F59E0B", color: "#fff" }}
            >
              <svg
                width="9"
                height="9"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="1"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Featured
            </span>
          )}

          {/* Business type — top right */}
          <span
            className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
            style={{
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(8px)",
            }}
          >
            {v.businessType}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Logo + name + location */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl shrink-0 overflow-hidden border-2 border-white shadow-sm"
            style={{
              background: "linear-gradient(135deg, #FF3B6B, #FF8FA3)",
            }}
          >
            {v.logoUrl ? (
              <img
                src={v.logoUrl}
                alt={v.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-black text-white text-base">
                {v.name[0]}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-black leading-tight truncate">
                {v.name}
              </p>
              {v.isVerified && <VerifiedBadge />}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9CA3AF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <p className="text-[11px] truncate" style={{ color: "#9CA3AF" }}>
                {[v.area, v.city].filter(Boolean).join(", ")}
              </p>
            </div>
          </div>
        </div>

        {/* Tagline */}
        {v.tagline && (
          <p
            className="text-xs mb-3 line-clamp-1 leading-relaxed"
            style={{ color: "#6B7280" }}
          >
            {v.tagline}
          </p>
        )}

        {/* Stats row */}
        <div
          className="flex items-center gap-3 py-3 border-y"
          style={{ borderColor: "#F3F4F6" }}
        >
          {v.maxCapacity > 0 && (
            <div className="flex items-center gap-1.5">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: "#F9FAFB" }}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#6B7280"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87" />
                  <path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
              </div>
              <span
                className="text-[11px] font-medium"
                style={{ color: "#374151" }}
              >
                {v.maxCapacity >= 1000
                  ? `${(v.maxCapacity / 1000).toFixed(1)}K`
                  : v.maxCapacity}
              </span>
            </div>
          )}
          {v.hallCount > 0 && (
            <div className="flex items-center gap-1.5">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: "#F9FAFB" }}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#6B7280"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
              </div>
              <span
                className="text-[11px] font-medium"
                style={{ color: "#374151" }}
              >
                {v.hallCount} hall{v.hallCount !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-3">
          <div>
            <p
              className="text-[10px] uppercase tracking-wide font-medium"
              style={{ color: "#9CA3AF" }}
            >
              Starting from
            </p>
            {v.minPrice != null ? (
              <p
                className="text-sm font-bold mt-0.5"
                style={{ color: PRIMARY }}
              >
                Rs. {v.minPrice.toLocaleString("en-PK")}
              </p>
            ) : (
              <p
                className="text-sm font-semibold mt-0.5"
                style={{ color: PRIMARY }}
              >
                Contact for price
              </p>
            )}
          </div>
          <span
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: PRIMARY }}
          >
            View
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({
  page,
  totalPages,
  sp,
}: {
  page: number;
  totalPages: number;
  sp: Record<string, string | undefined>;
}) {
  function buildHref(p: number) {
    const params = new URLSearchParams();
    const keys = ["q", "city", "type", "cap", "verified", "sort", "minPrice", "maxPrice"] as const;
    for (const k of keys) {
      if (sp[k]) params.set(k, sp[k]!);
    }
    if (p > 1) params.set("page", String(p));
    else params.delete("page");
    return `/venues${params.toString() ? `?${params.toString()}` : ""}`;
  }

  // Show up to 5 page numbers centered around current page
  const delta = 2;
  const start = Math.max(1, page - delta);
  const end   = Math.min(totalPages, page + delta);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const btnBase = "flex items-center justify-center w-9 h-9 rounded-xl text-sm font-semibold transition-all";

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      {/* Prev */}
      {page > 1 ? (
        <Link href={buildHref(page - 1)}
          className={`${btnBase} hover:bg-white border`}
          style={{ borderColor: "#E5E7EB", color: "#374151" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
      ) : (
        <span className={`${btnBase} opacity-30 cursor-not-allowed border`} style={{ borderColor: "#E5E7EB", color: "#9CA3AF" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </span>
      )}

      {/* First page + ellipsis */}
      {start > 1 && (
        <>
          <Link href={buildHref(1)} className={`${btnBase} hover:bg-white border`} style={{ borderColor: "#E5E7EB", color: "#374151" }}>1</Link>
          {start > 2 && <span className="text-sm px-1" style={{ color: "#9CA3AF" }}>…</span>}
        </>
      )}

      {/* Page numbers */}
      {pages.map(p => (
        p === page ? (
          <span key={p} className={`${btnBase} text-white`} style={{ background: "#FF3B6B" }}>{p}</span>
        ) : (
          <Link key={p} href={buildHref(p)}
            className={`${btnBase} hover:bg-white border`}
            style={{ borderColor: "#E5E7EB", color: "#374151" }}>
            {p}
          </Link>
        )
      ))}

      {/* Last page + ellipsis */}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-sm px-1" style={{ color: "#9CA3AF" }}>…</span>}
          <Link href={buildHref(totalPages)} className={`${btnBase} hover:bg-white border`} style={{ borderColor: "#E5E7EB", color: "#374151" }}>{totalPages}</Link>
        </>
      )}

      {/* Next */}
      {page < totalPages ? (
        <Link href={buildHref(page + 1)}
          className={`${btnBase} hover:bg-white border`}
          style={{ borderColor: "#E5E7EB", color: "#374151" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </Link>
      ) : (
        <span className={`${btnBase} opacity-30 cursor-not-allowed border`} style={{ borderColor: "#E5E7EB", color: "#9CA3AF" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </span>
      )}
    </div>
  );
}

// ─── No Results ───────────────────────────────────────────────────────────────
function NoResults() {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "#F3F4F6" }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#D1D5DB"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="8" y1="8" x2="14" y2="14" />
          <line x1="14" y1="8" x2="8" y2="14" />
        </svg>
      </div>
      <p className="text-base font-bold text-black mb-1">
        No venues match your filters
      </p>
      <p className="text-sm mb-6 max-w-xs" style={{ color: "#9CA3AF" }}>
        Try clearing some filters.
      </p>
      <Link
        href="/venues"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
        style={{ background: PRIMARY }}
      >
        Clear Filters
      </Link>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="text-center py-20">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ background: "#F3F4F6" }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9CA3AF"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="4" y="2" width="16" height="20" rx="1" />
          <path d="M9 22v-4h6v4" />
          <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
        </svg>
      </div>
      <p className="text-base font-semibold text-black mb-1">
        No venues listed yet
      </p>
      <p className="text-sm mb-6" style={{ color: "#9CA3AF" }}>
        Be the first to register your venue on Event Ease.
      </p>
      <Link
        href="/vendor/onboarding/business-info"
        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
        style={{ background: PRIMARY }}
      >
        Register Your Venue
      </Link>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <div
      className="border-t py-6 text-center"
      style={{ borderColor: "#E5E7EB" }}
    >
      <p className="text-xs" style={{ color: "#9CA3AF" }}>
        &copy; {new Date().getFullYear()}{" "}
        <span className="font-semibold" style={{ color: PRIMARY }}>
          Event Ease
        </span>{" "}
        &middot; Pakistan&apos;s Venue Discovery Platform
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function VenuesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    city?: string;
    type?: string;
    cap?: string;
    verified?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const [allVendors, featuredVendors] = await Promise.all([
    fetchVendors(),
    fetchFeatured(),
  ]);

  // Mark featured
  const featuredIds = new Set(featuredVendors.map((v) => v.id));
  const vendors = allVendors.map((v) => ({
    ...v,
    isFeatured: featuredIds.has(v.id),
  }));

  // Parse filter params
  const q = sp.q?.toLowerCase().trim() ?? "";
  const cityF = sp.city?.toLowerCase().trim() ?? "";
  const typeF = sp.type?.trim() ?? "";
  const capF = sp.cap ? Number(sp.cap) : 0;
  const verifiedF = sp.verified === "1";
  const minPriceF = sp.minPrice ? Number(sp.minPrice) : 0;
  const maxPriceF = sp.maxPrice ? Number(sp.maxPrice) : 0;
  const sort = sp.sort ?? "featured";

  const isFiltering =
    q ||
    cityF ||
    typeF ||
    capF ||
    verifiedF ||
    minPriceF ||
    maxPriceF;

  const PAGE_SIZE = 12;
  const page      = Math.max(1, parseInt(sp.page ?? "1") || 1);

  const filtered   = vendors.filter((v) =>
    filterVendor(v, { q, cityF, typeF, capF, verifiedF, minPriceF, maxPriceF })
  );
  const sorted     = sortVendors(filtered, sort);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated  = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Build remove-chip helpers
  function removeParam(key: string, extraKeys: string[] = []) {
    const params = new URLSearchParams();
    const current: Record<string, string> = {
      q: sp.q ?? "",
      city: sp.city ?? "",
      type: sp.type ?? "",
      cap: sp.cap ?? "",
      verified: sp.verified ?? "",
      sort: sp.sort ?? "",
      minPrice: sp.minPrice ?? "",
      maxPrice: sp.maxPrice ?? "",
    };
    const toRemove = new Set([key, ...extraKeys]);
    for (const [k, v] of Object.entries(current)) {
      if (!toRemove.has(k) && v) params.set(k, v);
    }
    return `/venues${params.toString() ? `?${params.toString()}` : ""}`;
  }

  const activeChips: { label: string; href: string }[] = [];
  if (sp.q) activeChips.push({ label: `Search: ${sp.q}`, href: removeParam("q") });
  if (sp.city) activeChips.push({ label: `City: ${sp.city}`, href: removeParam("city") });
  if (sp.type) activeChips.push({ label: `Type: ${sp.type}`, href: removeParam("type") });
  if (sp.cap) {
    const capLabel =
      sp.cap === "9999"
        ? "1000+"
        : sp.cap === "100"
        ? "Up to 100"
        : sp.cap === "300"
        ? "100–300"
        : sp.cap === "600"
        ? "300–600"
        : "600–1000";
    activeChips.push({ label: `Capacity: ${capLabel}`, href: removeParam("cap") });
  }
  if (sp.verified === "1")
    activeChips.push({ label: "Verified only", href: removeParam("verified") });
  if (sp.minPrice || sp.maxPrice) {
    const priceLabel =
      !sp.minPrice && sp.maxPrice === "50000"
        ? "Under 50k"
        : sp.minPrice === "50000" && sp.maxPrice === "100000"
        ? "50k–100k"
        : sp.minPrice === "100000" && sp.maxPrice === "200000"
        ? "100k–200k"
        : sp.minPrice === "200000" && !sp.maxPrice
        ? "200k+"
        : "Custom range";
    activeChips.push({
      label: `Price: ${priceLabel}`,
      href: removeParam("minPrice", ["maxPrice"]),
    });
  }

  return (
    <div className="min-h-screen" style={{ background: "#F8F8F8" }}>
      <SiteHeader />
      <BottomNav />

      {/* Page title bar */}
      <div className="bg-white" style={{ borderBottom: "1px solid #E5E7EB" }}>
        <div className="px-4 lg:px-8 py-5">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 mb-3">
            <Link
              href="/"
              className="text-xs font-medium transition-colors hover:opacity-70"
              style={{ color: "#9CA3AF" }}
            >
              Home
            </Link>
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#D1D5DB"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="text-xs font-semibold" style={{ color: "#374151" }}>
              Venues
            </span>
          </div>

          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-black mb-1">
            Browse All Venues
          </h1>
          <p className="text-sm" style={{ color: "#6B7280" }}>
            Discover top-rated banquet halls, marquees and ballrooms across
            Pakistan
          </p>

          {/* Active filter chips */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {activeChips.map((chip) => (
                <Link
                  key={chip.label}
                  href={chip.href}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-opacity hover:opacity-75"
                  style={{ background: "#F3F4F6", color: "#111827" }}
                >
                  {chip.label}
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </Link>
              ))}
              <Link
                href="/venues"
                className="text-xs font-medium transition-opacity hover:opacity-70"
                style={{ color: PRIMARY }}
              >
                Clear all
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 lg:px-8 py-6 pb-28 md:pb-8">
        <div className="grid md:grid-cols-[220px_1fr] lg:grid-cols-[256px_1fr] gap-5 lg:gap-6 items-start">
          {/* Sidebar — desktop only */}
          <aside className="sticky top-20 hidden md:block">
            <Suspense fallback={null}>
              <VenueFilters />
            </Suspense>
          </aside>

          {/* Main */}
          <main>
            {/* Filter trigger (mobile) + Sort bar — in one row on mobile */}
            <div className="flex items-center gap-2">
              <div className="md:hidden shrink-0">
                <Suspense fallback={null}>
                  <VenueFilters />
                </Suspense>
              </div>
              <div className="flex-1">
                <Suspense fallback={null}>
                  <VenueSortBar count={sorted.length} />
                </Suspense>
              </div>
            </div>

            {/* No results */}
            {sorted.length === 0 && isFiltering && <NoResults />}

            {/* Empty (no vendors at all) */}
            {allVendors.length === 0 && <EmptyState />}

            {/* Grid */}
            {paginated.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
                {paginated.map((v) => (
                  <VenueCard key={v.id} v={v} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                sp={sp}
              />
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
