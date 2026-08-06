import PublicProfile from "../PublicProfile";
import type { Vendor } from "@/lib/vendorData";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5510";

type DbHall = { id: string; name: string; capacity: number; price: number; desc: string | null };
type DbReview = { id: string; name: string; rating: number; text: string; createdAt: string };
type DbVendor = {
  id: string; name: string; slug: string; businessType: string;
  tagline: string | null; email: string; phone: string;
  whatsapp: string | null; city: string; area: string; address: string;
  about: string | null; services: string[] | null; amenities: string[] | null;
  established: number | null; isVerified: boolean;
  logoUrl: string | null; galleryImages: string[] | null; mapUrl: string | null;
};

export default async function VendorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let vendor: DbVendor | null = null;
  let dbHalls: DbHall[] = [];
  let dbReviews: DbReview[] = [];
  let totalEvents = 0;

  try {
    const res = await fetch(`${API_BASE}/api/vendor/profile/${slug}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (data.success) {
      vendor      = data.vendor;
      dbHalls     = data.halls    ?? [];
      dbReviews   = data.reviews  ?? [];
      totalEvents = data.totalEvents ?? 0;
    }
  } catch {
    // network error — show 404
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#F9FAFB" }}>
        <p className="text-5xl font-black text-black">404</p>
        <p className="text-base" style={{ color: "#6B7280" }}>Venue not found.</p>
        <Link href="/"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "#FF3B6B" }}>
          Browse Venues
        </Link>
      </div>
    );
  }

  const maxCapacity =
    dbHalls.length > 0 ? Math.max(...dbHalls.map((h) => h.capacity)) : 0;

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleString("en-US", { month: "short", year: "numeric" });
  }

  const reviewCount = dbReviews.length;
  const rating = reviewCount > 0
    ? Math.round((dbReviews.reduce((s, r) => s + r.rating, 0) / reviewCount) * 10) / 10
    : 0;

  // Map DB data → Vendor type (use sensible defaults for rich fields)
  const mappedVendor: Vendor = {
    slug:          vendor.slug,
    name:          vendor.name,
    tagline:       vendor.tagline ?? `${vendor.businessType} · ${vendor.city}`,
    location:      [vendor.city, vendor.area, vendor.address].filter(Boolean).join(", "),
    phone:         vendor.phone,
    email:         vendor.email,
    whatsapp:      vendor.whatsapp ?? vendor.phone,
    established:   vendor.established ?? new Date().getFullYear(),
    rating,
    reviewCount,
    totalEvents,
    maxCapacity,
    accentColor:   "#FF3B6B",
    accentLight:   "#FFF0F4",
    coverGradient: "linear-gradient(135deg, #FF3B6B 0%, #FF8FA3 50%, #FFB3C1 100%)",
    about:         vendor.about ?? "",
    logoUrl:       vendor.logoUrl ?? null,
    mapUrl:        vendor.mapUrl  ?? null,
    halls:         dbHalls.map((h) => ({
      name:     h.name,
      capacity: h.capacity,
      price:    h.price,
      desc:     h.desc ?? "",
    })),
    services:  vendor.services  ?? [],
    amenities: vendor.amenities ?? [],
    gallery:   (vendor.galleryImages ?? []).map((url, i) => ({
      label:    `Photo ${i + 1}`,
      sublabel: vendor.name,
      gradient: "linear-gradient(135deg, #FF3B6B 0%, #FF8FA3 100%)",
      icon:     "🖼️",
      imageUrl: url,
    })),
    reviews: dbReviews.map(r => ({ name: r.name, rating: r.rating, text: r.text, date: fmtDate(r.createdAt) })),
  };

  return <PublicProfile vendor={mappedVendor} vendorId={vendor.id} />;
}
