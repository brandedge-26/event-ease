import type { MetadataRoute } from "next";

const SITE_URL = "https://geteventease.com";
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5510";

const EVENT_SLUGS = ["barat", "mehndi", "walima", "bridal", "engagement", "nikkah", "qawali", "birthday"];
const VENDOR_TYPE_SLUGS = [
  "banquet-hall", "caterer", "florist", "photographer",
  "decorator", "sound-lights", "beauty-parlor", "car-rental",
];

type VendorCard = { slug: string };

async function fetchVendorSlugs(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/api/vendor/profile`, { cache: "no-store" });
    const data = await res.json();
    if (!data.success) return [];
    return (data.vendors as VendorCard[]).map(v => v.slug);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const vendorSlugs = await fetchVendorSlugs();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`,                  changeFrequency: "daily",   priority: 1.0 },
    { url: `${SITE_URL}/venues`,            changeFrequency: "daily",   priority: 0.9 },
    { url: `${SITE_URL}/events`,            changeFrequency: "weekly",  priority: 0.7 },
    { url: `${SITE_URL}/how-it-works`,      changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/contact`,           changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/vendor/onboarding`, changeFrequency: "monthly", priority: 0.7 },
  ];

  const eventRoutes: MetadataRoute.Sitemap = EVENT_SLUGS.map(slug => ({
    url: `${SITE_URL}/events/${slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const vendorTypeRoutes: MetadataRoute.Sitemap = VENDOR_TYPE_SLUGS.map(slug => ({
    url: `${SITE_URL}/vendors/${slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const vendorProfileRoutes: MetadataRoute.Sitemap = vendorSlugs.map(slug => ({
    url: `${SITE_URL}/profile/${slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...eventRoutes, ...vendorTypeRoutes, ...vendorProfileRoutes];
}
