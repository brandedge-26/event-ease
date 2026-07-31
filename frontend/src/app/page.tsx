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
  minPrice:     number | null;
  maxCapacity:  number;
  hallCount:    number;
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

export default async function Home() {
  const vendors = await fetchVendors();

  return (
    <div className="min-h-screen" style={{ background: "#F8F8F8" }}>

      {/* Header */}
      <div className="border-b bg-white px-4 lg:px-10 py-4 flex items-center justify-between" style={{ borderColor: "#E5E7EB" }}>
        <div>
          <span className="text-lg font-black tracking-tight text-black">Event</span>
          <span className="text-lg font-black tracking-tight" style={{ color: PRIMARY }}>Ease</span>
        </div>
        <Link href="/vendor/login"
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ color: "#6B7280" }}>
          Vendor Login
        </Link>
      </div>

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
      <div className="max-w-5xl mx-auto px-4 lg:px-6 pb-16">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-black">
            {vendors.length > 0 ? "Registered Venues" : "Featured Venues"}
          </h2>
          <span className="text-sm" style={{ color: "#9CA3AF" }}>{vendors.length} venue{vendors.length !== 1 ? "s" : ""}</span>
        </div>

        {vendors.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🏛️</p>
            <p className="text-base font-semibold text-black mb-1">No venues listed yet</p>
            <p className="text-sm mb-6" style={{ color: "#9CA3AF" }}>Be the first to register your venue on Event Ease.</p>
            <Link href="/vendor/onboarding/business-info"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: PRIMARY }}>
              Register Your Venue
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors.map(v => (
              <Link
                key={v.id}
                href={`/profile/${v.slug}`}
                className="bg-white rounded-3xl shadow-sm overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer block"
              >
                {/* Cover */}
                <div className="relative h-36" style={{ background: "linear-gradient(135deg, #FF3B6B 0%, #FF8FA3 50%, #FFB3C1 100%)" }}>
                  <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
                  {/* Verified badge */}
                  {v.isVerified && (
                    <span className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}>
                      ✓ Verified
                    </span>
                  )}
                  {/* Business type badge */}
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                    style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(6px)" }}>
                    {v.businessType}
                  </span>
                </div>

                <div className="p-4">
                  {/* Avatar + name */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl shrink-0 -mt-8 shadow-lg border-2 border-white overflow-hidden"
                      style={{ background: "linear-gradient(135deg, #FF3B6B, #FF8FA3)" }}>
                      {v.logoUrl
                        ? <img src={v.logoUrl} alt={v.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center font-black text-white text-lg">{v.name[0]}</div>
                      }
                    </div>
                    <div className="min-w-0 mt-1">
                      <p className="text-sm font-bold text-black leading-tight truncate">{v.name}</p>
                      <p className="text-[11px] truncate" style={{ color: "#9CA3AF" }}>
                        {[v.area, v.city].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  </div>

                  {/* Tagline */}
                  {v.tagline && (
                    <p className="text-[11px] mb-3 line-clamp-1" style={{ color: "#6B7280" }}>{v.tagline}</p>
                  )}

                  {/* Capacity + halls */}
                  <div className="flex items-center gap-3 mb-4">
                    {v.maxCapacity > 0 && (
                      <div className="flex items-center gap-1 text-[11px]" style={{ color: "#9CA3AF" }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                        Up to {v.maxCapacity.toLocaleString()} guests
                      </div>
                    )}
                    {v.hallCount > 0 && (
                      <>
                        <div className="w-1 h-1 rounded-full" style={{ background: "#D1D5DB" }} />
                        <span className="text-[11px]" style={{ color: "#9CA3AF" }}>{v.hallCount} hall{v.hallCount !== 1 ? "s" : ""}</span>
                      </>
                    )}
                  </div>

                  {/* Starting price */}
                  <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "#F4F4F5" }}>
                    <div>
                      <p className="text-[10px]" style={{ color: "#9CA3AF" }}>Starting from</p>
                      {v.minPrice != null
                        ? <p className="text-sm font-bold" style={{ color: PRIMARY }}>Rs. {v.minPrice.toLocaleString("en-PK")}</p>
                        : <p className="text-sm font-semibold" style={{ color: PRIMARY }}>Contact for price</p>
                      }
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: PRIMARY }}>
                      View Profile
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
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
