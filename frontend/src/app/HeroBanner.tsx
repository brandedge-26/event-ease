"use client";

import { useEffect, useState } from "react";

const PRIMARY = "#FF3B6B";
const SLIDE_MS = 5000;

// ─── Category tabs — each swaps the hero background to art from our own content ──
const CATEGORIES = [
  { label: "Banquet Hall",  img: "/banners/Banquet Hall.png" },
  { label: "Photography",   img: "/banners/photographynew.png" },
  { label: "Bridal Makeup", img: "/banners/bridalnew.png" },
  { label: "Decoration",    img: "/banners/decorationnew.png" },
  { label: "Catering",      img: "/banners/cateringnew.png" },
  { label: "Mehndi & Henna",img: "/banners/mehndi.png" },
];

export default function HeroBanner({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(0);

  // Auto-advance to the next tab once the active tab's progress bar fills up
  useEffect(() => {
    const timer = setTimeout(() => {
      setActive(a => (a + 1) % CATEGORIES.length);
    }, SLIDE_MS);
    return () => clearTimeout(timer);
  }, [active]);

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

        {/* Category tabs — auto-advancing progress bar under the active tab */}
        <div className="flex items-center gap-5 sm:gap-7 mb-7 overflow-x-auto scrollbar-hide max-w-full">
          {CATEGORIES.map((c, i) => (
            <button
              key={c.label}
              onClick={() => setActive(i)}
              className="shrink-0 text-sm font-semibold whitespace-nowrap cursor-pointer text-left"
              style={{ color: i === active ? "#ffffff" : "rgba(255,255,255,0.55)" }}
            >
              <span className="block pb-2">{c.label}</span>
              <span
                className="block h-[3px] rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.25)" }}
              >
                {i === active && (
                  <span
                    key={active}
                    className="block h-full rounded-full"
                    style={{ background: PRIMARY, animation: `heroTabFill ${SLIDE_MS}ms linear forwards` }}
                  />
                )}
              </span>
            </button>
          ))}
        </div>

        {/* Headline */}
        <h1 className="font-black tracking-tight mb-10" style={{ lineHeight: 1.1 }}>
          <span
            className="inline-block text-4xl sm:text-5xl lg:text-6xl px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-md mb-1"
            style={{ background: PRIMARY, color: "#fff" }}>
            Your event starts
          </span>
          <span className="block text-4xl sm:text-5xl lg:text-6xl text-white mt-1">
            with the perfect
          </span>
          <span className="block text-4xl sm:text-5xl lg:text-6xl text-white">
            venue
          </span>
        </h1>

        {/* Search */}
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}
