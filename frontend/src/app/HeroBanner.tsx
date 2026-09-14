"use client";

import { useState } from "react";

const PRIMARY = "#FF3B6B";

// ─── Category tabs — each swaps the hero background to art from our own content ──
const CATEGORIES = [
  { label: "Banquet Hall",  img: "/home/banner.webp" },
  { label: "Photography",   img: "/home/banners/a_professional_wedding_photographer_in_action_holding_a_high_end_camera_focused.png" },
  { label: "Bridal Makeup", img: "/home/banners/an_elegant_bride_receiving_professional_makeup_application_close_up_on_the.png" },
  { label: "Decoration",    img: "/home/banners/premium_floral_wedding_stage_decoration_lush_white_and_pink_roses_elegant.png" },
  { label: "Catering",      img: "/home/banners/beautiful_premium_wedding_catering_arrangement_gourmet_appetizers_elegantly.png" },
  { label: "Mehndi & Henna",img: "/home/banners/elegant_bridal_henna_mehndi_application_intricate_patterns_on_hands_traditional.png" },
];

export default function HeroBanner({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(0);

  return (
    <div className="relative -mt-16 overflow-hidden" style={{ minHeight: 660 }}>
      {/* Background image — crossfades on category change */}
      <img
        key={CATEGORIES[active].img}
        src={CATEGORIES[active].img}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ animation: "fadeIn 0.5s ease" }}
      />
      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.82) 100%)" }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-start px-4 lg:px-8 pt-32 pb-16 max-w-5xl mx-auto w-full">
        {/* Eyebrow */}
        <span className="text-xs font-semibold uppercase tracking-[0.2em] mb-5" style={{ color: "#FF8FA3" }}>
          Pakistan&apos;s No. 1 Venue Platform
        </span>

        {/* Category tabs */}
        <div className="flex items-center gap-5 sm:gap-7 mb-7 overflow-x-auto scrollbar-hide max-w-full">
          {CATEGORIES.map((c, i) => (
            <button
              key={c.label}
              onClick={() => setActive(i)}
              className="shrink-0 pb-2 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer"
              style={{
                color:       i === active ? "#ffffff" : "rgba(255,255,255,0.55)",
                borderColor: i === active ? PRIMARY   : "transparent",
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Headline */}
        <h1 className="font-black tracking-tight mb-10" style={{ lineHeight: 1.1 }}>
          <span
            className="inline-block text-3xl sm:text-5xl lg:text-6xl px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-md mb-1"
            style={{ background: PRIMARY, color: "#fff" }}>
            Your event starts
          </span>
          <span className="block text-3xl sm:text-5xl lg:text-6xl text-white mt-1">
            with the perfect
          </span>
          <span className="block text-3xl sm:text-5xl lg:text-6xl text-white">
            venue
          </span>
        </h1>

        {/* Search */}
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}
