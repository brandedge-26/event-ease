import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "../../SiteHeader";
import BottomNav from "../../BottomNav";
import SiteFooter from "../../SiteFooter";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5510";
const PRIMARY  = "#FF3B6B";

// ─── Event Content Data ───────────────────────────────────────────────────────
const EVENTS: Record<string, {
  slug:          string;
  title:         string;
  subtitle:      string;
  description:   string;
  traditions:    { title: string; body: string }[];
  tips:          string[];
  suggestedTypes: string[];
}> = {
  barat: {
    slug: "barat",
    title: "Barat",
    subtitle: "The Grand Wedding Procession",
    description: "Barat is the most celebrated day of a Pakistani wedding — the day the groom's family escorts the groom in a grand procession. Marked by festive dhol beats, fireworks, and elaborate feasting, it is typically the longest and most lavish of all wedding events, often hosting hundreds to thousands of guests.",
    traditions: [
      { title: "Baraat Procession", body: "The groom arrives with family and friends in a grand motorcade or horse-drawn carriage, accompanied by dhol players and shehnai musicians." },
      { title: "Rukhsati", body: "The emotional send-off of the bride from her parents' home — one of the most heartfelt moments of Pakistani weddings." },
      { title: "Nikah Ceremony", body: "The formal Islamic marriage contract is signed in the presence of witnesses, the qazi, and family elders." },
      { title: "Waleema Announcement", body: "The groom's family formally announces the Waleema date during Barat celebrations." },
      { title: "Grand Feasting", body: "Multi-course meals are served — traditionally daig-style cooking with biryani, korma, and mutton dishes." },
    ],
    tips: [
      "Book your banquet hall at least 6–12 months in advance for peak wedding season (Oct–Feb).",
      "Hire a professional event coordinator to manage decor, catering, and guest seating.",
      "Arrange separate entrances for groom's baraat and bride's family for smooth flow.",
      "Consider valet parking for large guest lists above 500.",
      "Confirm backup power supply and generator with your venue.",
    ],
    suggestedTypes: ["Banquet Hall", "Marquee", "Ballroom", "Hotel Banquet"],
  },
  mehndi: {
    slug: "mehndi",
    title: "Mehndi & Mayo",
    subtitle: "Colorful Pre-Wedding Celebrations",
    description: "Mehndi and Mayo are vibrant pre-wedding celebrations in Pakistani culture. Mehndi involves intricate henna on the bride's hands and feet, while Mayo is a ritual where the bride stays home draped in yellow, symbolizing purity. Both events are filled with folk songs, dances, and the warmth of family togetherness.",
    traditions: [
      { title: "Henna Application", body: "Skilled mehndi artists apply elaborate floral patterns on the bride's hands and feet — the darker the mehndi, the more the groom's love." },
      { title: "Gidda & Dhamal", body: "Women perform traditional folk dances like Gidda while men join in with energetic Bhangra moves." },
      { title: "Mayo Ritual", body: "The bride is dressed in yellow and turmeric paste (ubtan) is applied to her skin for a natural glow before the wedding." },
      { title: "Holud Ceremony", body: "Turmeric is playfully applied by cousins and siblings to both bride and groom in separate gatherings." },
      { title: "Folk Songs", body: "Traditional wedding songs and poetry are sung by female family members throughout the night." },
    ],
    tips: [
      "Outdoor lawns and farmhouses create the best atmosphere for Mehndi with natural lighting.",
      "Hire a professional mehndi artist 2–3 months in advance — the best ones book quickly.",
      "Use a bright color palette for decor — yellows, oranges, and greens work best.",
      "Live dhol and folk musicians enhance the atmosphere far more than DJs for this event.",
      "Keep the guest list intimate for Mayun — it is traditionally a family-only affair.",
    ],
    suggestedTypes: ["Wedding Lawn", "Marquee", "Farm House", "Rooftop Venue"],
  },
  walima: {
    slug: "walima",
    title: "Walima",
    subtitle: "The Post-Wedding Reception Feast",
    description: "Walima is the reception dinner hosted by the groom's family after Barat, celebrating the completion of the marriage. In Islam, Walima is a Sunnah and a formal occasion for the newlyweds to appear together as a married couple. It is typically more elegant and formal than other wedding events.",
    traditions: [
      { title: "Sunnah of Walima", body: "The Prophet Muhammad (PBUH) encouraged Walima to publicly announce the marriage — it is considered a religious duty and blessing." },
      { title: "Newlyweds' First Appearance", body: "The couple appears together publicly for the first time on a decorated stage to greet guests." },
      { title: "Grand Feast", body: "Lavish dinner buffets are served — traditionally goat, beef, or whole roasted meats are the highlight." },
      { title: "Formal Dress Code", body: "Walima tends to have a more formal dress code compared to Mehndi — guests wear formal attire." },
      { title: "Gift Giving", body: "Guests present gifts and shagun (cash envelopes) to the newlyweds as blessings for their new life." },
    ],
    tips: [
      "Walima is typically smaller than Barat — a hall with 300–700 capacity is usually ideal.",
      "Keep the menu focused on high-quality dishes rather than quantity.",
      "A professional photographer is essential — this is the couple's first official event together.",
      "Evening timing (7–11 PM) works best for Walima events.",
      "Coordinate floral decor to complement the bride's Walima dress color.",
    ],
    suggestedTypes: ["Banquet Hall", "Hotel Banquet", "Ballroom"],
  },
  bridal: {
    slug: "bridal",
    title: "Bridal Shower",
    subtitle: "An Intimate Celebration for the Bride-to-Be",
    description: "The Bridal Shower is a modern pre-wedding celebration hosted by the bride's close friends and female family members. It is an intimate gathering focused entirely on celebrating the bride — complete with games, gifts, personalized decor, and memorable moments.",
    traditions: [
      { title: "Gift Opening", body: "The bride opens thoughtful gifts — kitchen items, lingerie, personalized keepsakes, and experiences are popular choices." },
      { title: "Bridal Games", body: "Fun games like 'How Well Do You Know the Bride', 'Bridal Bingo', and trivia keep guests entertained." },
      { title: "Personalized Decor", body: "Custom banners, photo walls with the bride's pictures, and a 'Bride to Be' theme create an Instagram-worthy setting." },
      { title: "High Tea or Brunch", body: "Bridal showers feature elegant spreads — high tea, macarons, themed cakes, and floral arrangements." },
      { title: "Memory Book", body: "Guests write messages and advice for the bride in a personalized memory book to treasure forever." },
    ],
    tips: [
      "Keep the guest count intimate — 15 to 40 guests is the sweet spot for bridal showers.",
      "Rooftop venues and garden spaces with natural light are perfect for photo-worthy bridal showers.",
      "Hire a professional decorator specializing in pastel or floral themes.",
      "Personalized favors (chocolates, candles, custom mugs) make guests feel special.",
      "Plan the bridal shower 2–4 weeks before the wedding for maximum excitement.",
    ],
    suggestedTypes: ["Farm House", "Rooftop Venue", "Beauty Parlor", "Wedding Lawn"],
  },
  engagement: {
    slug: "engagement",
    title: "Engagement",
    subtitle: "The Ring Ceremony & Formal Announcement",
    description: "The Engagement (Mangni) is the formal ceremony where rings are exchanged and the couple's upcoming marriage is officially announced. In Pakistani culture, the engagement is a significant milestone — the first formal event of the wedding journey that sets the tone for all celebrations to follow.",
    traditions: [
      { title: "Ring Exchange", body: "The couple exchanges engagement rings in front of family elders, often with prayers and blessings from parents." },
      { title: "Sheeringhan", body: "Sweets are distributed among family members and guests to celebrate the happy announcement." },
      { title: "Formal Photography", body: "The couple's first official photoshoot together, often with family portraits included." },
      { title: "Dastar Bandi", body: "In some traditions, a turban or dupatta is ceremonially placed on the groom by the bride's father or uncle." },
      { title: "Family Introduction", body: "Both families formally meet and the couple is introduced together in front of the extended family for the first time." },
    ],
    tips: [
      "Engagement events can range from intimate (50 guests) to grand (300+ guests).",
      "Hotel banquets and rooftop venues offer the most elegant settings for engagements.",
      "Coordinate the decor color scheme with the couple's engagement outfit colors.",
      "Hire a professional videographer — the ring exchange moment should be captured on video.",
      "A live vocalist or pianist adds a romantic touch to the engagement atmosphere.",
    ],
    suggestedTypes: ["Banquet Hall", "Hotel Banquet", "Rooftop Venue", "Ballroom"],
  },
  nikkah: {
    slug: "nikkah",
    title: "Nikkah",
    subtitle: "The Sacred Islamic Marriage Ceremony",
    description: "Nikkah is the sacred Islamic marriage contract — the spiritual and legal foundation of a Muslim wedding. Performed in the presence of a Qazi, two witnesses, and the families of both bride and groom, the Nikkah can be a simple religious ceremony or an elaborate event combining spiritual significance with celebratory traditions.",
    traditions: [
      { title: "Ijab-o-Qubool", body: "The most sacred moment — the groom says 'Qubool hai' three times, completing the marriage contract before Allah." },
      { title: "Mehr (Dower)", body: "The groom presents or commits to a Mehr — a mandatory gift of money or valuables to the bride as her Islamic right." },
      { title: "Dua & Prayers", body: "The Qazi leads prayers for the couple's happiness, prosperity, and a blessed life together." },
      { title: "Signing of Nikah Nama", body: "Both parties sign the official marriage certificate in front of witnesses — a legal and religious requirement." },
      { title: "Khutba-e-Nikah", body: "The Qazi delivers a religious sermon before the ceremony, educating the couple about the responsibilities of marriage in Islam." },
    ],
    tips: [
      "Choose a venue with a designated prayer area or prayer mat space for guests.",
      "Nikkah events can be as intimate as 50 guests or as grand as 500 — both are perfectly acceptable.",
      "Hire a reputable Qazi who can conduct the ceremony in both Arabic and the local language.",
      "Serene, elegant decor (white, cream, green) suits the spiritual nature of Nikkah.",
      "Consider live Naat recitation as background music to set a spiritual atmosphere.",
    ],
    suggestedTypes: ["Banquet Hall", "Marquee", "Hotel Banquet"],
  },
  qawali: {
    slug: "qawali",
    title: "Qawali Night",
    subtitle: "Soulful Sufi Music Evenings",
    description: "Qawali Night is a cherished tradition in Pakistani wedding culture — an evening of soul-stirring Sufi devotional music performed by renowned Qawwals with harmonium, tabla, and clapping. Qawali nights create an atmosphere of pure emotion, bringing together family and guests in spiritual harmony.",
    traditions: [
      { title: "Sufi Qawwali", body: "Professional Qawwals perform devotional compositions — from classic Nusrat Fateh Ali Khan pieces to traditional kalam celebrating love and the divine." },
      { title: "Intimate Sitting", body: "Guests sit on floor cushions in a circle around the Qawwals — an intimate setting that enhances the experience." },
      { title: "Haal (Spiritual State)", body: "As the music intensifies, some devotees enter a state of spiritual trance, swaying in deep emotion." },
      { title: "Nazrana", body: "Appreciative audience members place currency notes on the Qawwals as tokens of appreciation — a traditional custom." },
      { title: "Late Night Atmosphere", body: "Qawali Nights typically begin after Isha prayers (9 PM onwards) and can continue until dawn." },
    ],
    tips: [
      "Open-air venues like farmhouses and lawns create the most magical Qawali atmosphere.",
      "Hire Qawwals with a strong reputation — check their previous performance videos.",
      "Provide warm lighting (fairy lights, lanterns, candlelight) rather than bright stage lights.",
      "Offer traditional hot beverages (kahwa, chai) and dry fruits to guests.",
      "Keep seating arrangements intimate — avoid ballroom-style setups for authentic feel.",
    ],
    suggestedTypes: ["Farm House", "Marquee", "Wedding Lawn", "Rooftop Venue"],
  },
  birthday: {
    slug: "birthday",
    title: "Birthday Party",
    subtitle: "Memorable Birthday Celebrations",
    description: "Birthday parties in Pakistan have evolved into grand celebrations with themed decor, professional entertainment, gourmet catering, and elaborate photography. Whether it's a child's first birthday, a teenager's 18th, or an adult milestone — Event Ease connects you with venues that make every birthday unforgettable.",
    traditions: [
      { title: "Cake Cutting Ceremony", body: "The centerpiece of every birthday — a custom-designed cake matching the party theme, cut with family and friends." },
      { title: "Themed Decor", body: "Balloon arrangements, photo walls, customized banners, and themed table settings transform venues into immersive birthday worlds." },
      { title: "Entertainment", body: "From magicians and clowns for kids to live bands and DJs for adults — entertainment keeps the energy alive." },
      { title: "Return Gifts", body: "Personalized goody bags and return gifts for guests — especially popular at children's birthday parties." },
      { title: "Photography & Reels", body: "Professional photographers and videographers capture every moment for social media reels and lasting memories." },
    ],
    tips: [
      "Book your venue 4–8 weeks in advance, especially for weekend birthday parties.",
      "Match venue capacity to your guest list — overcrowded parties reduce enjoyment.",
      "Coordinate with a professional decorator to create a cohesive theme.",
      "For children's parties, ensure the venue has a safe, open play area.",
      "Surprise parties require extra coordination — designate a trusted person to manage logistics.",
    ],
    suggestedTypes: ["Banquet Hall", "Farm House", "Rooftop Venue", "Marquee"],
  },
};

// ─── Event banner images ──────────────────────────────────────────────────────
const EVENT_BANNERS: Record<string, string> = {
  barat:      "/home/events/barat.png",
  mehndi:     "/home/events/mehndi.png",
  walima:     "/home/events/walima.png",
  bridal:     "/home/events/bridal_shower.png",
  engagement: "/home/events/engagement.png",
  nikkah:     "/home/events/nikah.png",
  qawali:     "/home/events/qawali.png",
  birthday:   "/home/events/birthday.png",
};

// ─── Other events list (for the sidebar strip) ────────────────────────────────
const ALL_EVENT_SLUGS = ["barat","mehndi","walima","bridal","engagement","nikkah","qawali","birthday"];

// ─── Fetch vendors filtered by types ─────────────────────────────────────────
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

// ─── Venue Card (matches venues page exactly) ─────────────────────────────────
function VenueCard({ v }: { v: VendorCard }) {
  const coverImage = v.galleryImages?.[0] ?? null;
  return (
    <Link href={`/profile/${v.slug}`}
      className="bg-white rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 cursor-pointer block"
      style={{ border: "1px solid #E5E7EB" }}>
      {/* Cover image */}
      <div className="px-3 pt-3">
        <div className="relative h-44 rounded-xl overflow-hidden">
          {coverImage ? (
            <img src={coverImage} alt={v.name} className="w-full h-full object-cover transition-transform duration-300" />
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
              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              Featured
            </span>
          )}
          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)" }}>
            {v.businessType}
          </span>
        </div>
      </div>
      {/* Body */}
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

async function fetchVendorsByTypes(types: string[]): Promise<VendorCard[]> {
  try {
    const res  = await fetch(`${API_BASE}/api/vendor/profile`, { cache: "no-store" });
    const data = await res.json();
    if (!data.success) return [];
    return (data.vendors as VendorCard[]).filter(v => types.includes(v.businessType)).slice(0, 6);
  } catch { return []; }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ev = EVENTS[slug];
  if (!ev) notFound();

  const suggested = await fetchVendorsByTypes(ev.suggestedTypes);
  const otherEvents = ALL_EVENT_SLUGS.filter(s => s !== slug).map(s => EVENTS[s]);

  return (
    <div className="min-h-screen" style={{ background: "#F8F8F8" }}>
      <SiteHeader />
      <BottomNav />

      <div className="px-4 lg:px-8 pt-6 pb-28 md:pb-16 max-w-6xl mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs mb-4" style={{ color: "#9CA3AF" }}>
          <Link href="/" className="hover:underline">Home</Link>
          <span>›</span>
          <Link href="/events/barat" className="hover:underline">Events</Link>
          <span>›</span>
          <span style={{ color: "#374151" }}>{ev.title}</span>
        </div>

        {/* Page title */}
        <h1 className="text-3xl font-black text-black mb-1">{ev.title}</h1>
        <p className="text-sm mb-5" style={{ color: "#6B7280" }}>{ev.subtitle}</p>

        {/* Event banner */}
        {EVENT_BANNERS[slug] && (
          <div className="relative w-full rounded-2xl overflow-hidden mb-7" style={{ height: 270 }}>
            <img
              src={EVENT_BANNERS[slug]}
              alt={ev.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.10) 60%, transparent 100%)" }} />
            <div className="absolute bottom-5 left-6">
              <p className="text-xl font-black text-white drop-shadow-sm">{ev.title}</p>
              <p className="text-sm text-white/75 mt-0.5 drop-shadow-sm">{ev.subtitle}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0 order-2 lg:order-1">

            {/* About */}
            <div className="rounded-2xl p-6 mb-6" style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
              <h2 className="text-base font-bold text-black mb-3">About {ev.title}</h2>
              <p className="text-sm leading-relaxed" style={{ color: "#4B5563" }}>{ev.description}</p>
            </div>

            {/* Traditions */}
            <div className="rounded-2xl p-6 mb-6" style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
              <h2 className="text-base font-bold text-black mb-4">Traditions & Customs</h2>
              <div className="flex flex-col gap-4">
                {ev.traditions.map((t, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "#FFF0F4" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={PRIMARY}
                        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-black mb-0.5">{t.title}</p>
                      <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{t.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Planning tips */}
            <div className="rounded-2xl p-6 mb-6" style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
              <h2 className="text-base font-bold text-black mb-4">Planning Tips</h2>
              <div className="flex flex-col gap-3">
                {ev.tips.map((tip, i) => (
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

            {/* Suggested Venues */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-black">Suggested Venues for {ev.title}</h2>
                  <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                    {ev.suggestedTypes.join(" · ")}
                  </p>
                </div>
                <Link href={`/venues?type=${encodeURIComponent(ev.suggestedTypes[0])}`}
                  className="text-xs font-bold flex items-center gap-1 transition-opacity hover:opacity-70"
                  style={{ color: PRIMARY }}>
                  View All
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </Link>
              </div>

              {suggested.length === 0 ? (
                <div className="rounded-2xl p-10 text-center" style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
                  <p className="text-sm font-semibold text-black mb-1">No venues listed yet</p>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>Check back soon — venues are being added.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {suggested.map(v => <VenueCard key={v.id} v={v} />)}
                </div>
              )}
            </div>
          </div>

          {/* ── Sidebar: other events ── */}
          <div className="lg:w-60 shrink-0 order-1 lg:order-2">

            {/* Mobile: horizontal scroll strip */}
            <div className="lg:hidden mb-6">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#9CA3AF" }}>Other Events</p>
              <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4" style={{ scrollbarWidth: "none" }}>
                {otherEvents.map(other => (
                  <Link key={other.slug} href={`/events/${other.slug}`}
                    className="flex-shrink-0 flex flex-col items-center gap-2 rounded-2xl p-3 text-center transition-colors hover:bg-pink-50"
                    style={{ background: "#fff", border: "1px solid #E5E7EB", minWidth: 96 }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: "#FFF0F4" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </div>
                    <p className="text-[11px] font-bold text-black leading-tight">{other.title}</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Desktop: vertical sticky list */}
            <div className="hidden lg:block rounded-2xl overflow-hidden sticky top-24" style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
              <div className="px-4 py-3" style={{ borderBottom: "1px solid #F3F4F6" }}>
                <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#9CA3AF" }}>Other Events</p>
              </div>
              <div>
                {otherEvents.map((other, i) => (
                  <Link key={other.slug} href={`/events/${other.slug}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 group"
                    style={{ borderBottom: i < otherEvents.length - 1 ? "1px solid #F3F4F6" : "none" }}
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "#FFF0F4" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-black truncate">{other.title}</p>
                      <p className="text-[11px] leading-snug mt-0.5" style={{ color: "#9CA3AF" }}>{other.subtitle}</p>
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
  return Object.keys(EVENTS).map(slug => ({ slug }));
}
