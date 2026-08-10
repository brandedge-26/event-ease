import Image from "next/image";
import Link from "next/link";

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

export default async function Home() {
  const [vendors, featured] = await Promise.all([fetchVendors(), fetchFeatured()]);
  const featuredIds = new Set(featured.map(v => v.id));
  const rest = vendors.filter(v => !featuredIds.has(v.id));

  return (
    <div className="min-h-screen" style={{ background: "#F8F8F8" }}>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b" style={{ borderColor: "#E5E7EB" }}>
        <div className="px-4 lg:px-8 h-16 flex items-center justify-between gap-6">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image src="/logo/logo-icon.svg" alt="Event Ease" width={28} height={28} className="rounded-lg" />
            <span className="text-base font-black tracking-tight">
              <span className="text-black">Event</span>
              <span style={{ color: PRIMARY }}>Ease</span>
            </span>
          </Link>

          {/* Nav links — hidden on mobile */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { label: "Venues",    href: "#venues"   },
              { label: "How it Works", href: "#how"  },
              { label: "Pricing",   href: "#pricing"  },
              { label: "Contact",   href: "#contact"  },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="px-3.5 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-gray-50"
                style={{ color: "#374151" }}>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/vendor/login"
              className="hidden sm:flex px-4 py-2 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50"
              style={{ borderColor: "#E5E7EB", color: "#374151" }}>
              Login
            </Link>
            <Link href="/vendor/onboarding/business-info"
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: PRIMARY }}>
              List Your Venue
            </Link>
          </div>

        </div>
      </header>

      {/* Hero */}
      <div className="text-center px-4 py-14 lg:py-20">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
          style={{ background: "#FFF0F4", color: PRIMARY }}>
          ✨ Pakistan&apos;s Premier Venue Discovery Platform
        </div>
        <h1 className="text-3xl lg:text-5xl font-black text-black tracking-tight mb-4 leading-tight">
          Find the Perfect<br />
          <span style={{ color: PRIMARY }}>Event Venue</span>
        </h1>
        <p className="text-base lg:text-lg max-w-xl mx-auto mb-8" style={{ color: "#6B7280" }}>
          Browse top-rated banquet halls, compare pricing, and book your dream venue — all in one place.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-5 py-3 bg-white rounded-2xl shadow-sm border text-sm" style={{ borderColor: "#E5E7EB" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <span style={{ color: "#9CA3AF" }}>Search venues in your city...</span>
          </div>
        </div>
      </div>

      {/* Venue Cards */}
      <div className="px-4 lg:px-8 pb-16">

        {vendors.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#F3F4F6" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/></svg>
            </div>
            <p className="text-base font-semibold text-black mb-1">No venues listed yet</p>
            <p className="text-sm mb-6" style={{ color: "#9CA3AF" }}>Be the first to register your venue on Event Ease.</p>
            <Link href="/vendor/onboarding/business-info"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: PRIMARY }}>
              Register Your Venue
            </Link>
          </div>
        ) : (
          <>
            {/* Featured section */}
            {featured.length > 0 && (
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
                  <h2 className="text-lg font-bold text-black">{featured.length > 0 ? "All Venues" : "Registered Venues"}</h2>
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

      {/* Footer */}
      <div className="border-t py-6 text-center" style={{ borderColor: "#E5E7EB" }}>
        <p className="text-xs" style={{ color: "#9CA3AF" }}>
          © {new Date().getFullYear()} <span className="font-semibold" style={{ color: PRIMARY }}>Event Ease</span> · Pakistan&apos;s Venue Discovery Platform
        </p>
      </div>
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
                {v.hallCount} hall{v.hallCount !== 1 ? "s" : ""}
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
