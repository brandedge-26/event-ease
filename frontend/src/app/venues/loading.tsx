import SiteHeader from "../SiteHeader";
import BottomNav from "../BottomNav";

// ─── Shimmer block helper ─────────────────────────────────────────────────────
function Sk({ className }: { className: string }) {
  return <div className={`skeleton rounded-xl ${className}`} />;
}

// ─── Card Skeleton ────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border" style={{ borderColor: "#E5E7EB" }}>
      {/* Cover image */}
      <div className="px-3 pt-3">
        <Sk className="h-44 w-full" />
      </div>

      <div className="p-4">
        {/* Logo + name row */}
        <div className="flex items-center gap-3 mb-3">
          <Sk className="w-10 h-10 shrink-0 !rounded-xl" />
          <div className="flex-1 space-y-2">
            <Sk className="h-4 w-3/4" />
            <Sk className="h-3 w-2/5" />
          </div>
        </div>

        {/* Tagline */}
        <Sk className="h-3 w-full mb-3" />

        {/* Stats row */}
        <div className="flex gap-3 py-3 border-y" style={{ borderColor: "#F3F4F6" }}>
          <Sk className="h-6 w-16" />
          <Sk className="h-6 w-16" />
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-3">
          <div className="space-y-1.5">
            <Sk className="h-2.5 w-16" />
            <Sk className="h-4 w-24" />
          </div>
          <Sk className="h-8 w-20 !rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar Skeleton ─────────────────────────────────────────────────────────
function SidebarSkeleton() {
  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b" style={{ borderColor: "#F3F4F6" }}>
        <Sk className="w-4 h-4 !rounded-lg" />
        <Sk className="h-4 w-14" />
      </div>

      {/* Filter sections */}
      <div className="divide-y divide-gray-100">
        {["Search", "City", "Venue Type", "Capacity", "Price Range", "Verified"].map(label => (
          <div key={label} className="px-4 py-4 space-y-3">
            <Sk className="h-2.5 w-16" />
            {label === "Venue Type" || label === "Price Range" ? (
              <div className="space-y-2.5">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-2.5">
                    <Sk className="w-4 h-4 !rounded-full" />
                    <Sk className="h-3.5 w-24" />
                  </div>
                ))}
              </div>
            ) : (
              <Sk className="h-9 w-full" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Loading Page ─────────────────────────────────────────────────────────────
export default function VenuesLoading() {
  return (
    <div className="min-h-screen" style={{ background: "#F8F8F8" }}>
      <SiteHeader />
      <BottomNav />

      {/* Title bar skeleton */}
      <div className="bg-white border-b" style={{ borderColor: "#E5E7EB" }}>
        <div className="px-4 lg:px-8 py-5 space-y-3">
          <Sk className="h-3 w-24" />
          <Sk className="h-8 w-52" />
          <Sk className="h-4 w-80" />
        </div>
      </div>

      {/* Body */}
      <div className="px-4 lg:px-8 py-6 pb-28 md:pb-8">
        <div className="grid md:grid-cols-[220px_1fr] lg:grid-cols-[256px_1fr] gap-5 lg:gap-6 items-start">

          {/* Sidebar */}
          <aside className="sticky top-20">
            <SidebarSkeleton />
          </aside>

          {/* Main */}
          <main>
            {/* Sort bar */}
            <div className="flex items-center justify-between">
              <Sk className="h-5 w-28" />
              <Sk className="h-9 w-44 !rounded-xl" />
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
