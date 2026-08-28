"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5510";

type Banner = {
  id:       string;
  title:    string;
  subtitle: string | null;
  ctaText:  string | null;
  ctaLink:  string;
  imageUrl: string;
  height:   number;
};

export default function PromoBanners() {
  const [banners,  setBanners]  = useState<Banner[]>([]);
  const [active,   setActive]   = useState(0);
  const scrollRef  = useRef<HTMLDivElement>(null);
  const touchStart = useRef(0);

  useEffect(() => {
    fetch(`${API_BASE}/api/admin/promo-banners`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.success && d.banners.length > 0) setBanners(d.banners); })
      .catch(() => {});
  }, []);

  function scroll(dir: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "right" ? el.clientWidth : -el.clientWidth, behavior: "smooth" });
  }

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  }

  function onTouchStart(e: React.TouchEvent) { touchStart.current = e.touches[0].clientX; }
  function onTouchEnd(e: React.TouchEvent) {
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) scroll(diff > 0 ? "right" : "left");
  }

  if (banners.length === 0) return null;

  const BANNER_HEIGHT = 300;

  return (
    <div className="relative mt-5 -mx-4 lg:-mx-8 px-4 lg:px-8 overflow-hidden">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="flex overflow-x-auto"
        style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        {banners.map((b, i) => (
          <Link key={i} href={b.ctaLink}
            className="relative block overflow-hidden rounded-2xl shrink-0"
            style={{ width: "100%", minWidth: "100%", height: BANNER_HEIGHT, scrollSnapAlign: "start", touchAction: "pan-x" }}>
            <img src={b.imageUrl} alt={b.title} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0"
              style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.28) 55%, transparent 100%)" }} />
            <div className="absolute inset-0 flex flex-col justify-center px-7 lg:px-12" style={{ maxWidth: "52%" }}>
              <p className="text-white font-black text-xl lg:text-2xl leading-tight mb-1.5 drop-shadow" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{b.title}</p>
              {b.subtitle && (
                <p className="text-sm lg:text-base mb-5 drop-shadow" style={{ color: "rgba(255,255,255,0.82)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{b.subtitle}</p>
              )}
              {b.ctaText && (
                <span className="self-start inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: "#FF3B6B" }}>
                  {b.ctaText}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {banners.length > 1 && (
        <>
          <button onClick={() => scroll("left")}
            className="absolute left-7 lg:left-11 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-100 opacity-60"
            style={{ background: "rgba(0,0,0,0.40)", backdropFilter: "blur(6px)", top: BANNER_HEIGHT / 2 - 18 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          <button onClick={() => scroll("right")}
            className="absolute right-7 lg:right-11 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-100 opacity-60"
            style={{ background: "rgba(0,0,0,0.40)", backdropFilter: "blur(6px)", top: BANNER_HEIGHT / 2 - 18 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </>
      )}

      {banners.length > 1 && (
        <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {banners.map((_, i) => (
            <button key={i}
              onClick={() => {
                scrollRef.current?.scrollTo({ left: i * (scrollRef.current?.clientWidth ?? 0), behavior: "smooth" });
                setActive(i);
              }}
              className="rounded-full transition-all duration-300"
              style={{ width: active === i ? 22 : 6, height: 6, background: active === i ? "#FF3B6B" : "rgba(255,255,255,0.55)" }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
