"use client";

import Link from "next/link";
import Image from "next/image";

const PRIMARY = "#FF3B6B";

const VENUES = [
  { label: "Banquet Halls",   href: "/venues?type=Banquet+Hall" },
  { label: "Marquees",        href: "/venues?type=Marquee" },
  { label: "Ballrooms",       href: "/venues?type=Ballroom" },
  { label: "Wedding Lawns",   href: "/venues?type=Wedding+Lawn" },
  { label: "Hotel Banquets",  href: "/venues?type=Hotel+Banquet" },
  { label: "Rooftop Venues",  href: "/venues?type=Rooftop" },
];

const EVENTS = [
  { label: "Barat Planning",    href: "/venues?event=barat" },
  { label: "Mehndi & Mayo",     href: "/venues?event=mehndi" },
  { label: "Walima Reception",  href: "/venues?event=walima" },
  { label: "Bridal Shower",     href: "/venues?event=bridal" },
  { label: "Engagement",        href: "/venues?event=engagement" },
  { label: "Qawali Night",      href: "/venues?event=qawali" },
];

const COMPANY = [
  { label: "How it Works",   href: "/how-it-works" },
  { label: "About Us",       href: "/about" },
  { label: "Contact Us",     href: "/contact" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Use",   href: "/terms" },
];

const CITIES = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar"];

const SOCIALS = [
  {
    label: "Instagram",
    href: "#",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "#",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
      </svg>
    ),
  },
  {
    label: "WhatsApp",
    href: "#",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
      </svg>
    ),
  },
];

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ background: "#111827" }}>

      {/* ── Main footer grid ── */}
      <div className="px-6 lg:px-12 pt-14 pb-10">
        <div className="grid grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-10">

          {/* Brand column */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <Image src="/logo/logo-icon.svg" alt="Event Ease" width={32} height={32} className="rounded-xl" />
              <span className="text-lg font-black tracking-tight">
                <span className="text-white">Event</span>
                <span style={{ color: PRIMARY }}>Ease</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-6 max-w-xs" style={{ color: "#9CA3AF" }}>
              Pakistan&apos;s #1 venue discovery platform. Find, compare and book banquet halls, marquees &amp; wedding venues with confidence.
            </p>

            {/* Socials */}
            <div className="flex items-center gap-2">
              {SOCIALS.map(s => (
                <a key={s.label} href={s.href} aria-label={s.label}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: "rgba(255,255,255,0.07)", color: "#9CA3AF" }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = PRIMARY;
                    (e.currentTarget as HTMLElement).style.color = "#fff";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
                    (e.currentTarget as HTMLElement).style.color = "#9CA3AF";
                  }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Venue Types */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] mb-4" style={{ color: "#4B5563" }}>Venues</p>
            <ul className="flex flex-col gap-2.5">
              {VENUES.map(v => (
                <li key={v.label}>
                  <Link href={v.href}
                    className="text-sm transition-colors"
                    style={{ color: "#9CA3AF" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#fff"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#9CA3AF"}
                  >
                    {v.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Events */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] mb-4" style={{ color: "#4B5563" }}>Events</p>
            <ul className="flex flex-col gap-2.5">
              {EVENTS.map(e => (
                <li key={e.label}>
                  <Link href={e.href}
                    className="text-sm transition-colors"
                    style={{ color: "#9CA3AF" }}
                    onMouseEnter={ev => (ev.currentTarget as HTMLElement).style.color = "#fff"}
                    onMouseLeave={ev => (ev.currentTarget as HTMLElement).style.color = "#9CA3AF"}
                  >
                    {e.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] mb-4" style={{ color: "#4B5563" }}>Company</p>
            <ul className="flex flex-col gap-2.5">
              {COMPANY.map(c => (
                <li key={c.label}>
                  <Link href={c.href}
                    className="text-sm transition-colors"
                    style={{ color: "#9CA3AF" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#fff"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#9CA3AF"}
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Cities row ── */}
        <div className="mt-12 pt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-xs font-bold uppercase tracking-[0.18em] mb-3" style={{ color: "#4B5563" }}>
            Popular Cities
          </p>
          <div className="flex flex-wrap gap-2">
            {CITIES.map(city => (
              <Link key={city} href={`/venues?city=${city}`}
                className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                style={{ background: "rgba(255,255,255,0.05)", color: "#6B7280", border: "1px solid rgba(255,255,255,0.07)" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,59,107,0.12)";
                  (e.currentTarget as HTMLElement).style.color = PRIMARY;
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,59,107,0.3)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLElement).style.color = "#6B7280";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
                }}
              >
                {city}
              </Link>
            ))}
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-xs" style={{ color: "#4B5563" }}>
            © {year} <span className="font-semibold" style={{ color: "#6B7280" }}>Event Ease</span> · All rights reserved · Made in Pakistan 🇵🇰
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-xs transition-colors"
              style={{ color: "#4B5563" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#9CA3AF"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#4B5563"}>
              Privacy
            </Link>
            <Link href="/terms" className="text-xs transition-colors"
              style={{ color: "#4B5563" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#9CA3AF"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#4B5563"}>
              Terms
            </Link>
            <Link href="/contact" className="text-xs transition-colors"
              style={{ color: "#4B5563" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#9CA3AF"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#4B5563"}>
              Contact
            </Link>
          </div>
        </div>
      </div>

    </footer>
  );
}
