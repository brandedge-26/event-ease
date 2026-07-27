import Link from "next/link";
import { VENDORS } from "@/lib/vendorData";

export default function Home() {
  const venues = Object.values(VENDORS);

  return (
    <div className="min-h-screen" style={{ background: "#F8F8F8" }}>

      {/* Header */}
      <div className="border-b bg-white px-4 lg:px-10 py-4 flex items-center justify-between" style={{ borderColor: "#E5E7EB" }}>
        <div>
          <span className="text-lg font-black tracking-tight text-black">Event</span>
          <span className="text-lg font-black tracking-tight" style={{ color: "#FF3B6B" }}>Ease</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/vendor/dashboard"
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ color: "#6B7280" }}>
            Vendor Login
          </Link>
          <Link href="/vendor/dashboard"
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: "#FF3B6B", color: "#fff" }}>
            List Your Venue
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="text-center px-4 py-14 lg:py-20">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5" style={{ background: "#FFF0F4", color: "#FF3B6B" }}>
          ✨ Pakistan&apos;s Premier Venue Discovery Platform
        </div>
        <h1 className="text-3xl lg:text-5xl font-black text-black tracking-tight mb-4 leading-tight">
          Find the Perfect<br />
          <span style={{ color: "#FF3B6B" }}>Event Venue</span>
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
          <h2 className="text-lg font-bold text-black">Featured Venues</h2>
          <span className="text-sm" style={{ color: "#9CA3AF" }}>{venues.length} venues</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {venues.map(v => (
            <a
              key={v.slug}
              href={`http://${v.slug}.localhost:3000`}
              className="bg-white rounded-3xl shadow-sm overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer block"
            >
              {/* Cover */}
              <div className="relative h-36" style={{ background: v.coverGradient }}>
                <div className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
                {/* Gallery preview dots */}
                <div className="absolute bottom-3 right-3 flex gap-1">
                  {v.gallery.slice(0,3).map((g, i) => (
                    <div key={i} className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: "rgba(255,255,255,0.25)", backdropFilter: "blur(4px)" }}>
                      {g.icon}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4">
                {/* Avatar + name */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-lg shrink-0 -mt-8 shadow-lg border-2 border-white"
                    style={{ background: v.coverGradient }}>
                    {v.name[0]}
                  </div>
                  <div className="min-w-0 mt-1">
                    <p className="text-sm font-bold text-black leading-tight">{v.name}</p>
                    <p className="text-[11px] truncate" style={{ color: "#9CA3AF" }}>{v.location}</p>
                  </div>
                </div>

                {/* Rating + capacity */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-1">
                    <span style={{ color: "#D97706", fontSize: 12 }}>★</span>
                    <span className="text-xs font-semibold text-black">{v.rating}</span>
                    <span className="text-[10px]" style={{ color: "#9CA3AF" }}>({v.reviewCount})</span>
                  </div>
                  <div className="w-1 h-1 rounded-full" style={{ background: "#D1D5DB" }} />
                  <span className="text-[11px]" style={{ color: "#9CA3AF" }}>Up to {v.maxCapacity} guests</span>
                  <div className="w-1 h-1 rounded-full" style={{ background: "#D1D5DB" }} />
                  <span className="text-[11px]" style={{ color: "#9CA3AF" }}>{v.halls.length} halls</span>
                </div>

                {/* Services */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {v.services.slice(0, 3).map(s => (
                    <span key={s} className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: v.accentLight, color: v.accentColor }}>
                      {s}
                    </span>
                  ))}
                  {v.services.length > 3 && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "#F3F4F6", color: "#9CA3AF" }}>
                      +{v.services.length - 3} more
                    </span>
                  )}
                </div>

                {/* Starting price */}
                <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "#F4F4F5" }}>
                  <div>
                    <p className="text-[10px]" style={{ color: "#9CA3AF" }}>Starting from</p>
                    <p className="text-sm font-bold" style={{ color: v.accentColor }}>
                      Rs. {Math.min(...v.halls.map(h => h.price)).toLocaleString("en-PK")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: v.accentColor }}>
                    View Profile
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t py-6 text-center" style={{ borderColor: "#E5E7EB" }}>
        <p className="text-xs" style={{ color: "#9CA3AF" }}>
          © {new Date().getFullYear()} <span className="font-semibold" style={{ color: "#FF3B6B" }}>Event Ease</span> · Pakistan&apos;s Venue Discovery Platform
        </p>
      </div>
    </div>
  );
}
