import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "../../SiteHeader";
import BottomNav from "../../BottomNav";
import SiteFooter from "../../SiteFooter";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5510";
const PRIMARY  = "#FF3B6B";

// ─── Vendor Type Content ──────────────────────────────────────────────────────
const VENDORS: Record<string, {
  slug:         string;
  label:        string;
  businessType: string;
  subtitle:     string;
  description:  string;
  bannerImage:  string;
  services:     { title: string; body: string }[];
  tips:         string[];
}> = {
  "banquet-hall": {
    slug: "banquet-hall",
    label: "Banquet Hall",
    businessType: "Banquet Hall",
    subtitle: "Grand Halls for Every Occasion",
    bannerImage: "/home/vendors/banquet.png",
    description: "Banquet halls are the cornerstone of Pakistani event culture — grand, fully equipped spaces designed to host weddings, corporate events, and social gatherings at scale. From intimate dinners of 100 guests to lavish weddings of 2000+, Event Ease connects you with verified banquet halls across Pakistan with transparent pricing and real reviews.",
    services: [
      { title: "Hall & Seating Arrangements", body: "Flexible seating layouts from round tables to theatre style, with dedicated bridal stage and VIP seating sections." },
      { title: "In-House Catering", body: "Most banquet halls offer daig-style or buffet catering — traditional biryani, karahi, and multi-course meals." },
      { title: "Decor Packages", body: "Basic to premium decor packages including floral arrangements, centerpieces, draping, and stage decor." },
      { title: "Sound & Lighting Systems", body: "Professional PA systems, LED uplighting, and stage spotlights included or available as add-ons." },
      { title: "Parking & Valet", body: "Large banquet halls offer dedicated parking lots with optional valet service for premium events." },
    ],
    tips: [
      "Book at least 6–12 months ahead for peak wedding season (October to February).",
      "Confirm the exact guest capacity — overcrowding reduces comfort significantly.",
      "Ask about in-house catering vs. outside catering policies before signing.",
      "Inspect the backup power supply and generator capacity for long events.",
      "Negotiate a package deal combining hall, catering, and decor for better rates.",
    ],
  },
  "caterer": {
    slug: "caterer",
    label: "Caterer",
    businessType: "Catering",
    subtitle: "Exceptional Food & Beverage Packages",
    bannerImage: "/home/vendors/caterer.png",
    description: "Great food is the heart of every Pakistani celebration. Professional caterers bring years of culinary expertise, hygienic preparation, and presentation excellence to your event — ensuring your guests leave with unforgettable memories of the feast. From intimate family dinners to 3000-guest weddings, Event Ease connects you with top-rated catering services.",
    services: [
      { title: "Daig-Style Cooking", body: "Traditional large-pot cooking — biryani, korma, nihari, and mutton karahi — prepared fresh on-site for maximum flavor." },
      { title: "Buffet Setup & Management", body: "Complete buffet station setup with chafing dishes, serving staff, and live counters for tikka, BBQ, or desserts." },
      { title: "Dessert & Sweet Counters", body: "Dedicated dessert stations with gulab jamun, kheer, barfi, and wedding cakes as add-ons." },
      { title: "Beverages & Cold Drinks", body: "Unlimited soft drinks, juices, mineral water, and traditional sherbets served throughout the event." },
      { title: "Cleanup & Crockery", body: "Professional caterers handle complete setup, service, and post-event cleanup including crockery and linen." },
    ],
    tips: [
      "Do a food tasting session before finalizing any caterer — never book blind.",
      "Clarify per-head pricing and exactly what menu items are included.",
      "Ask about hygiene certifications and kitchen inspection records.",
      "Confirm how they handle last-minute guest count changes.",
      "Arrange a dedicated serving team ratio of at least 1 waiter per 25 guests.",
    ],
  },
  "florist": {
    slug: "florist",
    label: "Florist",
    businessType: "Florist",
    subtitle: "Fresh Flowers & Floral Arrangements",
    bannerImage: "/home/vendors/florist.png",
    description: "Flowers transform an ordinary event into a visual masterpiece. Pakistan's event florists specialize in elaborate bridal stages, floral arches, table centerpieces, car decorations, and mehndi setups — using fresh roses, jasmine, marigolds, and orchids to create breathtaking atmospheres that complement every event theme.",
    services: [
      { title: "Bridal Stage Decor", body: "Elaborate floral backdrops, petal arches, and garland-draped stages that serve as the focal point of your event." },
      { title: "Table Centerpieces", body: "Fresh floral centerpieces in vases, mirror bases, or custom stands tailored to your color scheme and theme." },
      { title: "Entrance Floral Arches", body: "Grand entrance arches with roses, orchids, or seasonal flowers creating a stunning first impression for guests." },
      { title: "Bridal Car Decoration", body: "Traditional car decoration with fresh flowers, ribbons, and custom arrangements for the bridal vehicle." },
      { title: "Mehndi & Mayo Setups", body: "Vibrant yellow-and-orange floral setups for mehndi events using marigolds, sunflowers, and tropical flowers." },
    ],
    tips: [
      "Book your florist 3–4 months before the event — premium florists fill quickly.",
      "Request a mood board or sample arrangement before finalizing the design.",
      "Confirm whether artificial or fresh flowers are being used — fresh costs more but looks better.",
      "Ask about delivery and setup time — florists need 4–8 hours for large setups.",
      "Coordinate the floral color scheme with the bride's outfit and venue lighting.",
    ],
  },
  "photographer": {
    slug: "photographer",
    label: "Photographer",
    businessType: "Photography",
    subtitle: "Professional Photo & Video Coverage",
    bannerImage: "/home/vendors/photographer.png",
    description: "Your wedding photographs and videos are the only things that last forever after the celebrations end. Pakistani wedding photographers specialize in candid storytelling, drone coverage, cinematic videography, and traditional portrait sessions — capturing every emotion, tradition, and moment with artistic precision.",
    services: [
      { title: "Full Event Photography", body: "Complete event coverage from getting-ready shots to rukhsati — capturing every detail and candid moment." },
      { title: "Cinematic Videography", body: "Cinematic wedding films with color grading, background music, and highlight reels for social media." },
      { title: "Drone Aerial Shots", body: "Spectacular aerial photography and video of the venue, baraat procession, and outdoor setups." },
      { title: "Photo Albums & Prints", body: "Premium printed albums, canvas prints, and digital galleries delivered within 4–8 weeks of the event." },
      { title: "Pre-Wedding Shoots", body: "Dedicated outdoor or studio pre-wedding sessions for engagement announcements and bridal portraits." },
    ],
    tips: [
      "Review the photographer's full portfolio — not just highlights — before booking.",
      "Confirm who exactly will shoot your event (many studios send junior photographers).",
      "Discuss the shot list in advance — family portraits, rituals, and key moments.",
      "Ask about the delivery timeline and format of photos and videos.",
      "Ensure backup equipment is available — camera failures do happen.",
    ],
  },
  "decorator": {
    slug: "decorator",
    label: "Decorator",
    businessType: "Decoration",
    subtitle: "Stunning Event Styling & Decor",
    bannerImage: "/home/vendors/decorators.png",
    description: "Event decorators transform raw venues into magical experiences. From minimalist modern themes to traditional Pakistani grandeur with gold, red, and florals — professional decorators handle draping, furniture, lighting, stage design, entrance arches, and every visual detail that creates the atmosphere your guests will remember.",
    services: [
      { title: "Stage & Backdrop Design", body: "Custom-designed bridal stages with fabric draping, LED panels, floral walls, or traditional carved wooden backdrops." },
      { title: "Venue Draping & Theming", body: "Full venue transformation with ceiling draping, fairy lights, chandeliers, and thematic color schemes." },
      { title: "Table & Chair Styling", body: "Elegant chair covers, sashes, table runners, and linen coordination matching the overall decor theme." },
      { title: "Entrance & Pathway Decor", body: "Grand entrance setups with flower-lined pathways, lanterns, fabric columns, and welcome signage." },
      { title: "Mehndi & Theme Decor", body: "Colorful mehndi setups with jhulas, macrame walls, pampas grass, neon signs, and boho-themed elements." },
    ],
    tips: [
      "Meet the decorator in person and visit a live event they've set up before booking.",
      "Finalize the theme board and color palette at least 2 months before the event.",
      "Confirm what's included — some decorators charge extra for installation labor.",
      "Ask about venue restrictions — many halls don't allow certain fixtures or adhesives.",
      "Request a post-setup walkthrough the evening before your event.",
    ],
  },
  "sound-lights": {
    slug: "sound-lights",
    label: "Sound & Lights",
    businessType: "Sound & Lights",
    subtitle: "Professional Audio & Lighting Setup",
    bannerImage: "/home/vendors/sound_lights.png",
    description: "Sound and lighting professionals are the unsung heroes of any event — they set the mood, amplify the performances, and ensure every guest can hear and see perfectly. From crystal-clear PA systems for large banquets to atmospheric LED lighting rigs for wedding stages, Event Ease connects you with Pakistan's top AV professionals.",
    services: [
      { title: "PA Systems & Live Sound", body: "High-powered speaker arrays, subwoofers, and mixing consoles for clear, distortion-free sound across large venues." },
      { title: "Stage Lighting & LED Walls", body: "Professional moving heads, LED uplights, gobos, and large LED screens for concert-quality stage production." },
      { title: "Laser & Effects", body: "Fog machines, laser shows, confetti cannons, and cold spark machines for dramatic event moments." },
      { title: "Wireless Mic Systems", body: "Lavalier and handheld wireless microphones for speeches, Qazi ceremonies, and live performances." },
      { title: "DJ Setup & Equipment", body: "Complete DJ booth setup including CDJs, mixers, and subwoofers for Mehndi and reception events." },
    ],
    tips: [
      "Do a sound check at the actual venue before the event — acoustics vary greatly.",
      "Confirm the generator capacity if the venue has unreliable power.",
      "Book a sound & lights team that has worked in your specific venue before.",
      "Discuss backup speaker systems — equipment failures can ruin an event.",
      "Coordinate lighting colors with your decor theme for a cohesive look.",
    ],
  },
  "beauty-parlor": {
    slug: "beauty-parlor",
    label: "Beauty Parlor",
    businessType: "Beauty Parlor",
    subtitle: "Bridal Makeup & Grooming Services",
    bannerImage: "/home/vendors/beauty_parlor.png",
    description: "Every bride deserves to look and feel extraordinary on her most important day. Pakistani bridal makeup artists and beauty parlors specialize in traditional bridal looks, modern glam, and everything in between — using premium international products and artistic techniques to ensure the bride is picture-perfect from mehndi to walima.",
    services: [
      { title: "Bridal Makeup & Hair", body: "Complete bridal transformation including foundation, contouring, eye makeup, and elaborate hair styling for all wedding events." },
      { title: "Mehndi & Mayun Looks", body: "Traditional and modern mehndi looks with natural, dewy makeup and flower-adorned hairstyles." },
      { title: "Airbrush Makeup", body: "Long-lasting, flawless airbrush foundation and contouring that looks perfect in photos and videos." },
      { title: "Family & Bridesmaid Packages", body: "Group makeup packages for the bride's family and bridesmaids at discounted group rates." },
      { title: "Pre-Bridal Treatments", body: "Facials, threading, waxing, and skin treatments in the weeks before the wedding for a glowing complexion." },
    ],
    tips: [
      "Do a full trial makeup session 2–4 weeks before the wedding — never on the day.",
      "Bring reference photos of your desired look to the trial session.",
      "Book the artist 4–6 months in advance — top bridal artists book out quickly.",
      "Confirm if the artist comes on-location or if you travel to the salon.",
      "Check that the products are hypoallergenic if you have sensitive skin.",
    ],
  },
  "car-rental": {
    slug: "car-rental",
    label: "Car Rental",
    businessType: "Car Rental",
    subtitle: "Luxury & Bridal Transport Services",
    bannerImage: "/home/vendors/car_rental.png",
    description: "The bridal car is a symbol of elegance and arrival — one of the most photographed elements of any Pakistani wedding. Event Ease connects you with premium car rental services offering luxury sedans, vintage classics, and decorated bridal vehicles with professional chauffeurs to ensure a grand, stress-free arrival.",
    services: [
      { title: "Bridal Car Decoration", body: "Full exterior decoration with fresh flowers, ribbons, and custom arrangements matching your wedding color scheme." },
      { title: "Luxury Vehicle Fleet", body: "Premium options including Mercedes S-Class, BMW 7-Series, Rolls Royce, and classic vintage cars." },
      { title: "Professional Chauffeurs", body: "Formally dressed, punctual chauffeurs with knowledge of local routes and contingency planning." },
      { title: "Multi-Vehicle Packages", body: "Packages for the full baraat motorcade — coordinated fleets for groom, family, and VIP guests." },
      { title: "Airport & Hotel Transfers", body: "Luxury transfers for out-of-town guests, honeymoon couples, and VIP arrivals." },
    ],
    tips: [
      "Book the bridal car 3–6 months in advance — luxury vehicles are in high demand.",
      "Inspect the vehicle in person before finalizing — photos can be misleading.",
      "Confirm the chauffeur's experience with wedding events specifically.",
      "Plan the route in advance, especially for large baraat processions in congested areas.",
      "Have a backup vehicle arrangement in case of mechanical issues on the day.",
    ],
  },
};

const ALL_VENDOR_SLUGS = ["banquet-hall","caterer","florist","photographer","decorator","sound-lights","beauty-parlor","car-rental"];

// ─── Vendor type card ─────────────────────────────────────────────────────────
type VendorCard = {
  id:            string;
  name:          string;
  slug:          string;
  businessType:  string;
  tagline:       string | null;
  city:          string;
  area:          string;
  logoUrl:       string | null;
  isVerified:    boolean;
  minPrice:      number | null;
  maxCapacity:   number;
  hallCount:     number;
  galleryImages: string[] | null;
  isFeatured?:   boolean;
};

async function fetchVendorsByType(businessType: string): Promise<VendorCard[]> {
  try {
    const res  = await fetch(`${API_BASE}/api/vendor/profile`, { cache: "no-store" });
    const data = await res.json();
    if (!data.success) return [];
    return (data.vendors as VendorCard[]).filter(v => v.businessType === businessType).slice(0, 6);
  } catch { return []; }
}

// ─── Vendor listing card (same as venues page) ────────────────────────────────
function VendorCard({ v }: { v: VendorCard }) {
  const coverImage = v.galleryImages?.[0] ?? null;
  return (
    <Link href={`/profile/${v.slug}`}
      className="bg-white rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 cursor-pointer block"
      style={{ border: "1px solid #E5E7EB" }}>
      <div className="px-3 pt-3">
        <div className="relative h-44 rounded-xl overflow-hidden">
          {coverImage ? (
            <img src={coverImage} alt={v.name} className="w-full h-full object-cover"/>
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: "#F3F4F6" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
          )}
          {v.isFeatured && (
            <span className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "#F59E0B", color: "#fff" }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              Featured
            </span>
          )}
          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)" }}>
            {v.businessType}
          </span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl shrink-0 overflow-hidden border-2 border-white shadow-sm"
            style={{ background: "linear-gradient(135deg, #FF3B6B, #FF8FA3)" }}>
            {v.logoUrl ? (
              <img src={v.logoUrl} alt={v.name} className="w-full h-full object-cover"/>
            ) : (
              <div className="w-full h-full flex items-center justify-center font-black text-white text-base">{v.name[0]}</div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-black leading-tight truncate">{v.name}</p>
              {v.isVerified && (
                <svg width="15" height="15" viewBox="0 0 24 24">
                  <polygon points="12,1 13.76,3.17 16.21,1.84 17,4.52 19.78,4.22 19.48,7 22.16,7.79 20.83,10.24 23,12 20.83,13.76 22.16,16.21 19.48,17 19.78,19.78 17,19.48 16.21,22.16 13.76,20.83 12,23 10.24,20.83 7.79,22.16 7,19.48 4.22,19.78 4.52,17 1.84,16.21 3.17,13.76 1,12 3.17,10.24 1.84,7.79 4.52,7 4.22,4.22 7,4.52 7.79,1.84 10.24,3.17" fill={PRIMARY}/>
                  <polyline points="7.5,12.5 10.5,15.5 16.5,8.5" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
                </svg>
              )}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <p className="text-[11px] truncate" style={{ color: "#9CA3AF" }}>{[v.area, v.city].filter(Boolean).join(", ")}</p>
            </div>
          </div>
        </div>
        {v.tagline && (
          <p className="text-xs mb-3 line-clamp-1 leading-relaxed" style={{ color: "#6B7280" }}>{v.tagline}</p>
        )}
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
              <span className="text-[11px] font-medium" style={{ color: "#374151" }}>{v.hallCount} hall{v.hallCount !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between mt-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide font-medium" style={{ color: "#9CA3AF" }}>Starting from</p>
            {v.minPrice != null ? (
              <p className="text-sm font-bold mt-0.5" style={{ color: PRIMARY }}>Rs. {v.minPrice.toLocaleString("en-PK")}</p>
            ) : (
              <p className="text-sm font-semibold mt-0.5" style={{ color: PRIMARY }}>Contact for price</p>
            )}
          </div>
          <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white" style={{ background: PRIMARY }}>
            View
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function VendorDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const vd = VENDORS[slug];
  if (!vd) notFound();

  const vendors     = await fetchVendorsByType(vd.businessType);
  const otherVendors = ALL_VENDOR_SLUGS.filter(s => s !== slug).map(s => VENDORS[s]);

  return (
    <div className="min-h-screen" style={{ background: "#F8F8F8" }}>
      <SiteHeader />
      <BottomNav />

      <div className="px-4 lg:px-8 pt-6 pb-28 md:pb-16 max-w-6xl mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs mb-4" style={{ color: "#9CA3AF" }}>
          <Link href="/" className="hover:underline">Home</Link>
          <span>›</span>
          <Link href="/vendors/banquet-hall" className="hover:underline">Vendors</Link>
          <span>›</span>
          <span style={{ color: "#374151" }}>{vd.label}</span>
        </div>

        {/* Page title */}
        <h1 className="text-3xl font-black text-black mb-1">{vd.label}</h1>
        <p className="text-sm mb-5" style={{ color: "#6B7280" }}>{vd.subtitle}</p>

        {/* Banner image */}
        <div className="relative w-full rounded-2xl overflow-hidden mb-7" style={{ height: 300 }}>
          <img src={vd.bannerImage} alt={vd.label} className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.50) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)" }} />
          <div className="absolute bottom-5 left-6">
            <p className="text-xl font-black text-white drop-shadow-sm">{vd.label}</p>
            <p className="text-sm text-white/75 mt-0.5 drop-shadow-sm">{vd.subtitle}</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0 order-2 lg:order-1">

            {/* About */}
            <div className="rounded-2xl p-6 mb-6" style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
              <h2 className="text-base font-bold text-black mb-3">About {vd.label}</h2>
              <p className="text-sm leading-relaxed" style={{ color: "#4B5563" }}>{vd.description}</p>
            </div>

            {/* Services */}
            <div className="rounded-2xl p-6 mb-6" style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
              <h2 className="text-base font-bold text-black mb-4">Key Services</h2>
              <div className="flex flex-col gap-4">
                {vd.services.map((s, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "#FFF0F4" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={PRIMARY}
                        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-black mb-0.5">{s.title}</p>
                      <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{s.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Planning tips */}
            <div className="rounded-2xl p-6 mb-6" style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
              <h2 className="text-base font-bold text-black mb-4">Hiring Tips</h2>
              <div className="flex flex-col gap-3">
                {vd.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={PRIMARY}
                      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Listed Vendors */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-black">Browse {vd.label}s</h2>
                  <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>Verified vendors on Event Ease</p>
                </div>
                <Link href={`/venues?type=${encodeURIComponent(vd.businessType)}`}
                  className="text-xs font-bold flex items-center gap-1 transition-opacity hover:opacity-70"
                  style={{ color: PRIMARY }}>
                  View All
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </Link>
              </div>

              {vendors.length === 0 ? (
                <div className="rounded-2xl p-10 text-center" style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
                  <p className="text-sm font-semibold text-black mb-1">No {vd.label}s listed yet</p>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>Check back soon — vendors are being added.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {vendors.map(v => <VendorCard key={v.id} v={v} />)}
                </div>
              )}
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="lg:w-60 shrink-0 order-1 lg:order-2">

            {/* Mobile: horizontal scroll */}
            <div className="lg:hidden mb-6">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#9CA3AF" }}>Other Vendors</p>
              <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4" style={{ scrollbarWidth: "none" }}>
                {otherVendors.map(ov => (
                  <Link key={ov.slug} href={`/vendors/${ov.slug}`}
                    className="flex-shrink-0 flex flex-col items-center gap-2 rounded-2xl p-3 text-center transition-colors hover:bg-pink-50"
                    style={{ background: "#fff", border: "1px solid #E5E7EB", minWidth: 96 }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: "#FFF0F4" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                      </svg>
                    </div>
                    <p className="text-[11px] font-bold text-black leading-tight">{ov.label}</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Desktop: vertical sticky */}
            <div className="hidden lg:block rounded-2xl overflow-hidden sticky top-24" style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
              <div className="px-4 py-3" style={{ borderBottom: "1px solid #F3F4F6" }}>
                <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#9CA3AF" }}>Other Vendors</p>
              </div>
              <div>
                {otherVendors.map((ov, i) => (
                  <Link key={ov.slug} href={`/vendors/${ov.slug}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 group"
                    style={{ borderBottom: i < otherVendors.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "#FFF0F4" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-black">{ov.label}</p>
                      <p className="text-[11px] leading-snug mt-0.5" style={{ color: "#9CA3AF" }}>{ov.subtitle}</p>
                    </div>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" className="shrink-0 group-hover:stroke-pink-400 transition-colors">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      <SiteFooter />
    </div>
  );
}

export function generateStaticParams() {
  return Object.keys(VENDORS).map(slug => ({ slug }));
}
