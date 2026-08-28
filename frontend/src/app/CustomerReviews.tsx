"use client";

import { useState } from "react";

const PRIMARY = "#FF3B6B";

const REVIEWS = [
  {
    name: "Fatima Waseem",
    location: "Lahore",
    event: "Barat Ceremony",
    review:
      "I would've never made it if it weren't for Event Ease. I love how cooperative they were to my silly questions and till the day I got married they were here. LOVED THEM — if I could get married a thousand times I'd choose Event Ease to be my planner.",
  },
  {
    name: "Sara Khan",
    location: "Karachi",
    event: "Walima Reception",
    review:
      "Event Ease made our Walima so special. Found the perfect marquee in just two days — the venue photos were accurate, pricing was transparent, and the booking was seamless. Highly recommended to every bride!",
  },
  {
    name: "Zainab Ahmed",
    location: "Islamabad",
    event: "Mehndi & Barat",
    review:
      "From Mehndi to Barat, Event Ease had everything covered. We shortlisted four venues and visited two — ended up booking our dream hall at half the price we expected. The team was always just a message away.",
  },
  {
    name: "Nadia Hussain",
    location: "Rawalpindi",
    event: "Engagement",
    review:
      "What I loved most was the transparency — no hidden fees, real photos, and verified reviews. Our engagement ceremony turned out exactly as we imagined. Event Ease is a blessing for Pakistani families.",
  },
];

export default function CustomerReviews() {
  const [active, setActive] = useState(0);

  function prev() {
    setActive(i => (i === 0 ? REVIEWS.length - 1 : i - 1));
  }
  function next() {
    setActive(i => (i === REVIEWS.length - 1 ? 0 : i + 1));
  }

  const review = REVIEWS[active];

  return (
    <section className="px-4 lg:px-8 py-16" style={{ background: "#FAFAFA" }}>
      {/* Section header */}
      <div className="text-center mb-12">
        <span
          className="inline-block text-xs font-bold uppercase tracking-[0.22em] mb-3 px-3 py-1 rounded-full"
          style={{ background: "#FFF0F4", color: PRIMARY }}
        >
          Testimonials
        </span>
        <h2 className="text-3xl lg:text-4xl font-black text-black tracking-tight">
          What Our Couples <span style={{ color: PRIMARY }}>Say</span>
        </h2>
      </div>

      {/* Main card */}
      <div className="max-w-3xl mx-auto">
        <div
          className="relative rounded-3xl p-8 lg:p-12"
          style={{
            background: "#fff",
            border: "1.5px solid #E5E7EB",
          }}
        >
          {/* Big decorative quote */}
          <div
            className="absolute top-6 right-8 text-8xl font-black leading-none select-none pointer-events-none"
            style={{ color: "#FFE4EA", fontFamily: "Georgia, serif" }}
          >
            &ldquo;
          </div>

          {/* Stars */}
          <div className="flex items-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill={PRIMARY} stroke={PRIMARY} strokeWidth="0.5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
            <span className="ml-2 text-xs font-semibold" style={{ color: "#9CA3AF" }}>5.0</span>
          </div>

          {/* Review text */}
          <blockquote
            className="text-base lg:text-xl leading-relaxed font-medium mb-8 relative z-10"
            style={{ color: "#111827" }}
          >
            {review.review}
          </blockquote>

          {/* Divider */}
          <div className="h-px mb-5" style={{ background: "#F3F4F6" }} />

          {/* Bottom — stacked on mobile, row on desktop */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            {/* Reviewer info */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0"
                style={{
                  background: "linear-gradient(135deg, #FF3B6B 0%, #FF8FA3 100%)",
                  border: "2.5px solid #FFE4EA",
                  outline: "1.5px solid #FF3B6B",
                }}
              >
                {review.name[0]}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-black leading-tight truncate">{review.name}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>{review.location}</p>
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: "#FFF0F4", color: PRIMARY }}
                  >
                    {review.event}
                  </span>
                </div>
              </div>
            </div>

            {/* Dots + arrows */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                {REVIEWS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width:      i === active ? 22 : 6,
                      height:     6,
                      background: i === active ? PRIMARY : "#F9C6CE",
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={prev}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95"
                  style={{ border: "1.5px solid #E5E7EB", background: "#fff" }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  onClick={next}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:opacity-90 active:scale-95"
                  style={{ background: PRIMARY }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Counter */}
        <p className="text-center text-xs mt-5" style={{ color: "#9CA3AF" }}>
          {active + 1} of {REVIEWS.length} reviews
        </p>
      </div>
    </section>
  );
}
