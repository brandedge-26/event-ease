import SiteHeader from "./SiteHeader";
import BottomNav from "./BottomNav";

function Sk({ className }: { className: string }) {
  return <div className={`skeleton rounded-xl ${className}`} />;
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border" style={{ borderColor: "#E5E7EB" }}>
      <div className="px-3 pt-3">
        <Sk className="h-44 w-full" />
      </div>
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Sk className="w-10 h-10 shrink-0 !rounded-xl" />
          <div className="flex-1 space-y-2">
            <Sk className="h-4 w-3/4" />
            <Sk className="h-3 w-2/5" />
          </div>
        </div>
        <Sk className="h-3 w-full mb-3" />
        <div className="flex gap-3 py-3 border-y" style={{ borderColor: "#F3F4F6" }}>
          <Sk className="h-6 w-16" />
          <Sk className="h-6 w-16" />
        </div>
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

export default function HomeLoading() {
  return (
    <div className="min-h-screen" style={{ background: "#F8F8F8" }}>
      <SiteHeader />
      <BottomNav />

      {/* Hero skeleton */}
      <div className="flex flex-col items-center px-4 pt-14 pb-10 text-center">
        <Sk className="h-10 w-64 mb-3" />
        <Sk className="h-6 w-52 mb-8" />
        {/* Search bar skeleton */}
        <div className="w-full max-w-3xl bg-white rounded-2xl overflow-hidden border" style={{ borderColor: "#E5E7EB" }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 px-5 py-4">
                <Sk className="w-4 h-4 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Sk className="h-2.5 w-16" />
                  <Sk className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 px-5 py-3 border-t border-gray-100">
            <Sk className="h-7 w-28 !rounded-lg" />
            <Sk className="h-7 w-28 !rounded-lg" />
            <Sk className="h-8 w-24 !rounded-xl ml-auto" />
          </div>
        </div>
        {/* City chips skeleton */}
        <div className="flex items-center gap-2 mt-4">
          {["w-16", "w-14", "w-20", "w-16", "w-12"].map((w, i) => (
            <Sk key={i} className={`h-7 !rounded-full ${w}`} />
          ))}
        </div>
      </div>

      {/* Cards section */}
      <div className="px-4 lg:px-8 pb-28 md:pb-16">

        {/* Featured section skeleton */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <Sk className="w-5 h-5 !rounded-lg" />
            <Sk className="h-6 w-36" />
            <Sk className="h-4 w-16" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
          </div>
        </div>

        {/* All venues section skeleton */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <Sk className="h-6 w-40" />
            <Sk className="h-4 w-20" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <CardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
