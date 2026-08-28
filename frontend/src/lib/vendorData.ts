export type GalleryItem = {
  label: string;
  sublabel: string;
  gradient: string;
  icon: string;
  imageUrl?: string;
};

export type Hall = {
  name: string;
  capacity: number;
  price: number;
  desc: string;
};

export type Vendor = {
  slug: string;
  name: string;
  businessType: string;
  tagline: string;
  location: string;
  phone: string;
  email: string;
  whatsapp: string;
  established: number;
  rating: number;
  reviewCount: number;
  totalEvents: number;
  maxCapacity: number;
  accentColor: string;
  accentLight: string;
  coverGradient: string;
  about: string;
  logoUrl?: string | null;
  mapUrl?: string | null;
  isVerified?: boolean;
  halls: Hall[];
  services: string[];
  amenities: string[];
  gallery: GalleryItem[];
  reviews: { name: string; rating: number; text: string; date: string }[];
};

export const VENDORS: Record<string, Vendor> = {
  royalbanquet: {
    slug: "royalbanquet",
    name: "Royal Banquet Hall",
    businessType: "Banquet Hall",
    tagline: "Where Every Moment Becomes a Memory",
    location: "Gulshan-e-Iqbal, Block 13-D, Karachi",
    phone: "0300-1234567",
    email: "info@royalbanquet.pk",
    whatsapp: "923001234567",
    established: 2010,
    rating: 4.8,
    reviewCount: 234,
    totalEvents: 1400,
    maxCapacity: 800,
    accentColor: "#FF3B6B",
    accentLight: "#FFF0F4",
    coverGradient: "linear-gradient(135deg, #FF3B6B 0%, #FF8FA3 50%, #FFB3C1 100%)",
    about:
      "Royal Banquet Hall has been Karachi's most trusted event venue since 2010. With over 1,400 successful events and a team of dedicated professionals, we transform your vision into an unforgettable experience. From grand weddings to intimate corporate dinners, our state-of-the-art facilities and personalized service ensure every occasion is flawlessly executed.",
    halls: [
      { name: "Grand Hall",       capacity: 500, price: 250000, desc: "Our flagship hall with crystal chandeliers, a grand stage, and a dedicated bridal room." },
      { name: "Crystal Room",     capacity: 200, price: 120000, desc: "An elegant mid-sized hall perfect for engagements and intimate gatherings." },
      { name: "Garden Terrace",   capacity: 100, price:  80000, desc: "An open-air terrace with lush greenery, ideal for daytime events and photoshoots." },
    ],
    services: ["Wedding", "Engagement", "Corporate Event", "Birthday Party", "Anniversary", "Conference"],
    amenities: ["Free Parking (200 cars)", "In-house Catering", "Full Decoration", "AV & Sound System", "Bridal Room", "Prayer Area", "Generator Backup", "Air Conditioning"],
    gallery: [
      { label: "Wedding Reception",    sublabel: "Grand Hall · 450 guests",  gradient: "linear-gradient(135deg,#FF3B6B,#FF8FA3)", icon: "💍" },
      { label: "Corporate Gala",       sublabel: "Crystal Room · 180 guests", gradient: "linear-gradient(135deg,#2563EB,#60A5FA)", icon: "🏢" },
      { label: "Engagement Night",     sublabel: "Grand Hall · 300 guests",  gradient: "linear-gradient(135deg,#7C3AED,#A78BFA)", icon: "💐" },
      { label: "Birthday Celebration", sublabel: "Crystal Room · 120 guests",gradient: "linear-gradient(135deg,#D97706,#FCD34D)", icon: "🎂" },
      { label: "Garden Brunch",        sublabel: "Terrace · 80 guests",      gradient: "linear-gradient(135deg,#16A34A,#6EE7B7)", icon: "🌿" },
      { label: "Annual Conference",    sublabel: "Grand Hall · 500 guests",  gradient: "linear-gradient(135deg,#0891B2,#67E8F9)", icon: "🎤" },
    ],
    reviews: [
      { name: "Ahmed Khan",   rating: 5, text: "Absolutely stunning venue. Our wedding was a dream come true. Staff was incredibly helpful and the decoration exceeded our expectations!", date: "Aug 2026" },
      { name: "Sara Malik",   rating: 5, text: "We hosted our daughter's birthday here. The team was professional and the setup was perfect. Highly recommended!", date: "Jul 2026" },
      { name: "Bilal Corp",   rating: 4, text: "Great for corporate events. AV system was top notch. Parking could be slightly better but overall excellent service.", date: "Jun 2026" },
    ],
  },

  goldenpalm: {
    slug: "goldenpalm",
    name: "Golden Palm Events",
    businessType: "Banquet Hall",
    tagline: "Luxury Redefined, Memories Forever",
    location: "DHA Phase 6, Lahore",
    phone: "0321-9876543",
    email: "events@goldenpalm.pk",
    whatsapp: "923219876543",
    established: 2015,
    rating: 4.6,
    reviewCount: 178,
    totalEvents: 890,
    maxCapacity: 600,
    accentColor: "#B45309",
    accentLight: "#FFFBEB",
    coverGradient: "linear-gradient(135deg, #B45309 0%, #D97706 50%, #FCD34D 100%)",
    about:
      "Golden Palm Events is Lahore's premier luxury venue, nestled in the heart of DHA Phase 6. Since 2015, we have hosted nearly 900 events with a commitment to opulence and perfection. Our gold-themed interiors, world-class catering, and attentive staff make us the first choice for families who want nothing but the best for their special occasions.",
    halls: [
      { name: "Palm Ballroom",  capacity: 400, price: 200000, desc: "Our signature gold-themed ballroom with a sweeping entrance staircase and ambient lighting." },
      { name: "Ivory Suite",    capacity: 150, price:  95000, desc: "A sophisticated suite for smaller, more intimate events with premium furnishings." },
      { name: "Rooftop Lounge", capacity:  80, price:  65000, desc: "A stylish rooftop with city views, perfect for cocktail evenings and small gatherings." },
    ],
    services: ["Wedding", "Engagement", "Mehndi Night", "Corporate Dinner", "Anniversary", "Birthday Party"],
    amenities: ["Valet Parking", "Gourmet Catering", "Floral Decoration", "Stage & Lighting", "Bridal Suite", "Backup Power", "WiFi", "Separate Gents & Ladies Areas"],
    gallery: [
      { label: "Royal Wedding",     sublabel: "Palm Ballroom · 380 guests", gradient: "linear-gradient(135deg,#B45309,#D97706)", icon: "👑" },
      { label: "Mehndi Night",      sublabel: "Rooftop Lounge · 70 guests", gradient: "linear-gradient(135deg,#16A34A,#84CC16)", icon: "🌸" },
      { label: "Golden Engagement", sublabel: "Palm Ballroom · 250 guests", gradient: "linear-gradient(135deg,#D97706,#FCD34D)", icon: "💎" },
      { label: "Corporate Awards",  sublabel: "Ivory Suite · 140 guests",  gradient: "linear-gradient(135deg,#1E3A8A,#3B82F6)", icon: "🏆" },
      { label: "Anniversary Gala",  sublabel: "Palm Ballroom · 200 guests", gradient: "linear-gradient(135deg,#9D174D,#EC4899)", icon: "✨" },
      { label: "Rooftop Dinner",    sublabel: "Rooftop · 60 guests",        gradient: "linear-gradient(135deg,#0F766E,#2DD4BF)", icon: "🌙" },
    ],
    reviews: [
      { name: "Fatima Riaz",  rating: 5, text: "Golden Palm made our wedding truly magical. The decor was breathtaking and the food was out of this world. 10/10!", date: "Sep 2026" },
      { name: "Omar Sheikh",  rating: 4, text: "Excellent venue with beautiful ambiance. The staff was courteous and responsive. Will definitely return.", date: "Aug 2026" },
      { name: "Hina Butt",    rating: 5, text: "Our mehndi night at the rooftop was absolutely beautiful! Perfect setting and impeccable service.", date: "Jul 2026" },
    ],
  },

  grandmarquee: {
    slug: "grandmarquee",
    name: "Grand Marquee",
    businessType: "Marquee",
    tagline: "Extraordinary Events, Extraordinary Spaces",
    location: "F-7 Markaz, Islamabad",
    phone: "0333-4567890",
    email: "hello@grandmarquee.pk",
    whatsapp: "923334567890",
    established: 2012,
    rating: 4.7,
    reviewCount: 312,
    totalEvents: 1850,
    maxCapacity: 1200,
    accentColor: "#6D28D9",
    accentLight: "#F5F3FF",
    coverGradient: "linear-gradient(135deg, #4C1D95 0%, #7C3AED 50%, #A78BFA 100%)",
    about:
      "Grand Marquee is Islamabad's largest and most versatile event space, operating since 2012 with over 1,850 events to our name. Situated in the prestigious F-7 Markaz, our expansive venue accommodates everything from grand weddings of 1,000+ guests to intimate corporate retreats. Our award-winning team is dedicated to flawless execution every single time.",
    halls: [
      { name: "Imperial Hall",  capacity: 800, price: 350000, desc: "Islamabad's biggest banquet hall with a retractable roof, grand chandeliers, and a 50-foot stage." },
      { name: "Marquee Garden", capacity: 400, price: 180000, desc: "A stunning outdoor marquee with manicured lawns and fairy light canopies." },
      { name: "Executive Suite", capacity: 120, price:  90000, desc: "A premium boardroom-style suite for high-profile corporate meetings and private dinners." },
    ],
    services: ["Wedding", "Walima", "Engagement", "Conference", "Corporate Event", "Birthday Party", "Anniversary"],
    amenities: ["Multi-level Parking", "Fine Dining Catering", "Premium Decoration", "Professional Lighting", "Bridal Suite & Groom Room", "Backup Generator", "High-speed WiFi", "Live Kitchen", "Cold Storage"],
    gallery: [
      { label: "Grand Wedding",     sublabel: "Imperial Hall · 900 guests",  gradient: "linear-gradient(135deg,#4C1D95,#7C3AED)", icon: "🕌" },
      { label: "Garden Walima",     sublabel: "Marquee Garden · 350 guests", gradient: "linear-gradient(135deg,#065F46,#34D399)", icon: "🌺" },
      { label: "Tech Conference",   sublabel: "Imperial Hall · 700 guests",  gradient: "linear-gradient(135deg,#1E3A8A,#60A5FA)", icon: "💻" },
      { label: "Engagement Soiree", sublabel: "Imperial Hall · 500 guests",  gradient: "linear-gradient(135deg,#7C3AED,#C084FC)", icon: "💍" },
      { label: "Corporate Awards",  sublabel: "Executive Suite · 110 guests",gradient: "linear-gradient(135deg,#92400E,#F59E0B)", icon: "🎖️" },
      { label: "Night Wedding",     sublabel: "Garden Marquee · 400 guests", gradient: "linear-gradient(135deg,#1E1B4B,#6366F1)", icon: "🌠" },
    ],
    reviews: [
      { name: "Zara Qureshi",  rating: 5, text: "Grand Marquee hosted our wedding for 800 guests flawlessly. The Imperial Hall is absolutely stunning. Highly recommend!", date: "Oct 2026" },
      { name: "Raza Corp",     rating: 5, text: "We have held 3 conferences here. Always professional, always perfect. The AV setup is world-class.", date: "Sep 2026" },
      { name: "Aisha Mirza",   rating: 4, text: "Beautiful venue with amazing decor. Food was excellent. Minor delay in setup but overall a wonderful experience.", date: "Aug 2026" },
    ],
  },
};

export const DEFAULT_VENDOR = VENDORS.royalbanquet;

export function getVendor(slug: string): Vendor {
  return VENDORS[slug] ?? DEFAULT_VENDOR;
}
