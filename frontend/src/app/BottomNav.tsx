"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

const PRIMARY  = "#FF3B6B";
const MUTED    = "#FF6B8A";
const BACKING  = "#FFE1EA";
const PILL_BG  = "#F3F4F6";

// ─── Floating pill geometry — fixed pixel values so the notch math stays exact ──
const PILL_W      = 340;
const PILL_H      = 64;
const CORNER_R    = 18;
const SIDE_PAD    = 26;
const SLOT_W      = (PILL_W - SIDE_PAD * 2) / 4;
const NOTCH_HALF  = 28;   // half-width of the cut-out at the flat edge
const NOTCH_DEPTH = 28;   // how far the cut-out dips into the bar
const NOTCH_CTRL  = 14;   // bezier control offset (half of NOTCH_HALF/DEPTH)
const BUBBLE_SIZE  = 46;
const BACKING_SIZE = 58;
const BUBBLE_TOP   = -(BUBBLE_SIZE * 0.4) + 10;   // less pop-out — leaves margin above the bubble
const BACKING_TOP  = -(BACKING_SIZE * 0.4) + 10;

function slotCenter(i: number) {
  return SIDE_PAD + SLOT_W * i + SLOT_W / 2;
}

// Rounded-rect pill outline; when cx is a number, a smooth bowl-shaped notch
// is cut into the top edge centered at that x — this is what the active tab's
// bubble sits inside. When cx is null, the top edge is left flat.
function pillPath(cx: number | null) {
  const top = cx == null
    ? `L ${PILL_W - CORNER_R} 0`
    : `L ${cx - NOTCH_HALF} 0
       C ${cx - NOTCH_CTRL} 0, ${cx - NOTCH_CTRL} ${NOTCH_DEPTH}, ${cx} ${NOTCH_DEPTH}
       C ${cx + NOTCH_CTRL} ${NOTCH_DEPTH}, ${cx + NOTCH_CTRL} 0, ${cx + NOTCH_HALF} 0
       L ${PILL_W - CORNER_R} 0`;

  return `
    M ${CORNER_R} 0
    ${top}
    A ${CORNER_R} ${CORNER_R} 0 0 1 ${PILL_W} ${CORNER_R}
    L ${PILL_W} ${PILL_H - CORNER_R}
    A ${CORNER_R} ${CORNER_R} 0 0 1 ${PILL_W - CORNER_R} ${PILL_H}
    L ${CORNER_R} ${PILL_H}
    A ${CORNER_R} ${CORNER_R} 0 0 1 0 ${PILL_H - CORNER_R}
    L 0 ${CORNER_R}
    A ${CORNER_R} ${CORNER_R} 0 0 1 ${CORNER_R} 0
    Z
  `;
}

// ─── Bottom Tabs ──────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    label: "Home",
    href: "/",
    icon: (color: string) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    label: "Venues",
    href: "/venues",
    icon: (color: string) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="1"/>
        <path d="M9 22v-4h6v4"/>
        <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/>
      </svg>
    ),
  },
  {
    label: "Events",
    href: "/events",
    matchPrefix: "/events",
    icon: (color: string) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
];

// ─── More Sheet Sections ───────────────────────────────────────────────────────
const ICON_COLOR = "#6B7280";

const EVENTS_ITEMS = [
  { label: "Barat",          href: "/events/barat",      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg> },
  { label: "Mehndi & Mayo",  href: "/events/mehndi",     icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="2" strokeLinecap="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z"/></svg> },
  { label: "Walima",         href: "/events/walima",     icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="2" strokeLinecap="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 15V2s-5 0-5 7v6a2 2 0 002 2h3zm0 0v7"/></svg> },
  { label: "Bridal Shower",  href: "/events/bridal",     icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="5"/><path d="M12 13v9"/><path d="M8 18h8"/></svg> },
  { label: "Engagement",     href: "/events/engagement", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="15" r="6"/><path d="M9.5 8l2.5-5 2.5 5"/><path d="M9.5 8h5"/><circle cx="12" cy="15" r="2.5"/></svg> },
  { label: "Nikkah",         href: "/events/nikkah",     icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="2" strokeLinecap="round"><path d="M3 21V10l9-7 9 7v11"/><path d="M9 21v-6h6v6"/></svg> },
  { label: "Birthday Party", href: "/events/birthday",   icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><path d="M9 3h6"/><path d="M12 3v4"/><rect x="3" y="11" width="18" height="10" rx="2"/></svg> },
  { label: "Qawali Night",   href: "/events/qawali",     icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="2" strokeLinecap="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg> },
];

const VENUE_TYPE_ITEMS = [
  { label: "Banquet Hall",   href: "/venues?type=Banquet+Hall",  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { label: "Marquee",        href: "/venues?type=Marquee",       icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="2" strokeLinecap="round"><path d="M3.5 21L12 4l8.5 17"/><path d="M12 4v17"/><path d="M3.5 21h17"/></svg> },
  { label: "Ballroom",       href: "/venues?type=Ballroom",      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="2" strokeLinecap="round"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg> },
  { label: "Wedding Lawn",   href: "/venues?type=Wedding+Lawn",  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="2" strokeLinecap="round"><path d="M12 22V12"/><path d="M5 12H2a10 10 0 0017 7.16"/><path d="M14.5 9.5A4.5 4.5 0 007 9.5V12h7.5z"/></svg> },
  { label: "Hotel Banquet",  href: "/venues?type=Hotel+Banquet", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M2 9h20"/><rect x="6" y="13" width="3" height="3"/><rect x="12" y="13" width="3" height="3"/></svg> },
  { label: "Rooftop Venue",  href: "/venues?type=Rooftop",       icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="2" strokeLinecap="round"><path d="M2 12h20"/><path d="M2 12l10-9 10 9"/><rect x="5" y="12" width="14" height="9"/></svg> },
  { label: "Farm House",     href: "/venues?type=Farm+House",    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="2" strokeLinecap="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-4h6v4"/></svg> },
];

const SERVICE_ITEMS = [
  { label: "Catering",       href: "/venues?q=catering",    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="2" strokeLinecap="round"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg> },
  { label: "Decoration",     href: "/venues?q=decoration",  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="2" strokeLinecap="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z"/></svg> },
  { label: "Photography",    href: "/venues?q=photography", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="2" strokeLinecap="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg> },
  { label: "Sound & Lights", href: "/venues?q=sound",       icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07"/></svg> },
  { label: "Car Rental",     href: "/venues?q=car+rental",  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="2" strokeLinecap="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 4v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> },
  { label: "Bridal Makeup",  href: "/venues?q=makeup",      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="2" strokeLinecap="round"><path d="M20.24 12.24a6 6 0 00-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/></svg> },
];

const VENDOR_ITEMS = [
  { label: "Banquet Halls",  href: "/vendors/banquet-hall",  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { label: "Caterers",       href: "/vendors/caterer",       icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="2" strokeLinecap="round"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/></svg> },
  { label: "Photographers",  href: "/vendors/photographer",  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="2" strokeLinecap="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg> },
  { label: "Decorators",     href: "/vendors/decorator",     icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="2" strokeLinecap="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z"/></svg> },
  { label: "Beauty Parlors", href: "/vendors/beauty-parlor", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="2" strokeLinecap="round"><path d="M20.24 12.24a6 6 0 00-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/></svg> },
  { label: "Car Rentals",    href: "/vendors/car-rental",    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="2" strokeLinecap="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 4v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> },
];

const COMPANY_ITEMS = [
  { label: "How it Works",     href: "/how-it-works",       icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg> },
  { label: "Contact",          href: "/contact",            icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
  { label: "List Your Business", href: "/vendor/onboarding", highlight: true, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg> },
];

function isActive(href: string, pathname: string, matchPrefix?: string) {
  if (href === "/") return pathname === "/";
  if (matchPrefix) return pathname.startsWith(matchPrefix);
  return pathname === href || pathname.startsWith(href + "/");
}

// ─── Collapsible Section ──────────────────────────────────────────────────────
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b" style={{ borderColor: "#F3F4F6" }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 cursor-pointer"
      >
        <span className="text-sm font-bold" style={{ color: "#111827" }}>{label}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round"
          style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div className="pb-2">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Sheet Link ───────────────────────────────────────────────────────────────
function SheetLink({ href, icon, label, highlight = false, onClose }: {
  href: string; icon: React.ReactNode; label: string; highlight?: boolean; onClose: () => void;
}) {
  return (
    <Link href={href} onClick={onClose}
      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors"
      style={{ color: highlight ? PRIMARY : "#374151" }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = highlight ? "#FFF0F4" : "#F9FAFB"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
      <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: highlight ? "#FFF0F4" : "#F3F4F6" }}>
        {icon}
      </span>
      <span>{label}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" className="ml-auto shrink-0">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </Link>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function BottomNav() {
  const pathname  = usePathname();
  const router    = useRouter();
  const navRef    = useRef<HTMLElement>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => { setMoreOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = moreOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [moreOpen]);

  const close = () => setMoreOpen(false);

  // Which of the 4 slots (Home, Venues, Events, More) is active — drives the notch position
  const navActiveIndex = NAV_ITEMS.findIndex(item => isActive(item.href, pathname, item.matchPrefix));
  const activeIndex = moreOpen ? 3 : navActiveIndex;
  const notchCx = activeIndex === -1 ? null : slotCenter(activeIndex);

  // ── Live drag: the active bubble follows the finger while swiping ──────────────
  const [dragCx, setDragCx]               = useState<number | null>(null);
  const [dragStartIndex, setDragStartIndex] = useState<number | null>(null);
  const activeIndexRef = useRef(activeIndex);
  useEffect(() => { activeIndexRef.current = activeIndex; }, [activeIndex]);

  useEffect(() => {
    const startX = { current: 0 };
    const startY = { current: 0 };
    const scale = { current: 1 };
    const baseCx = { current: 0 };
    const baseIndex = { current: 0 };
    const liveCx = { current: 0 };
    let tracking = false;
    let dragging = false;

    function onStart(e: TouchEvent) {
      const t = e.touches[0];
      startX.current = t.clientX;
      startY.current = t.clientY;
      tracking = true;
      dragging = false;
      const rect = navRef.current?.getBoundingClientRect();
      scale.current = rect && rect.width ? PILL_W / rect.width : 1;
      const i = activeIndexRef.current === -1 ? 0 : activeIndexRef.current;
      baseIndex.current = i;
      baseCx.current = slotCenter(i);
    }

    function onMove(e: TouchEvent) {
      if (!tracking) return;
      const t = e.touches[0];
      const dxReal = t.clientX - startX.current;
      const dyReal = t.clientY - startY.current;

      if (!dragging) {
        // Only start following once the gesture is clearly a horizontal drag —
        // keeps normal vertical scrolling and taps unaffected.
        if (Math.abs(dxReal) < 8 || Math.abs(dxReal) < Math.abs(dyReal) * 1.3) return;
        dragging = true;
        setDragStartIndex(baseIndex.current);
      }

      const cx = Math.max(slotCenter(0), Math.min(slotCenter(3), baseCx.current + dxReal * scale.current));
      liveCx.current = cx;
      setDragCx(cx);
    }

    function onEnd() {
      tracking = false;
      if (!dragging) return;
      dragging = false;

      const nearest = Math.round((liveCx.current - SIDE_PAD - SLOT_W / 2) / SLOT_W);
      const target = Math.max(0, Math.min(3, nearest));

      setDragCx(null);
      setDragStartIndex(null);

      if (target !== baseIndex.current) {
        if (target === 3) {
          setMoreOpen(true);
        } else {
          setMoreOpen(false);
          router.push(NAV_ITEMS[target].href);
        }
      }
    }

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [router]);

  // What the floating bubble currently shows: mid-drag it sticks to the tab the
  // drag started from; once released it reflects the real route/More state.
  const bubbleIndex = dragStartIndex ?? activeIndex;
  const displayCx   = dragCx ?? notchCx;
  const bubbleTransition = dragCx != null ? "none" : "left 0.25s ease";

  const moreIcon = (color: string) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke={color}>
      <circle cx="5"  cy="12" r="1.3" fill={color}/>
      <circle cx="12" cy="12" r="1.3" fill={color}/>
      <circle cx="19" cy="12" r="1.3" fill={color}/>
    </svg>
  );

  return (
    <>
      {/* ── Bottom nav bar — floating pill with a real cut-out notch around the active tab ── */}
      <nav
        ref={navRef}
        className="md:hidden"
        style={{
          position:   "fixed",
          left:       "50%",
          bottom:     "calc(env(safe-area-inset-bottom) + 16px)",
          transform:  "translateX(-50%)",
          zIndex:     40,
          width:      PILL_W,
          maxWidth:   "92vw",
          height:     PILL_H,
          touchAction: "pan-y",
        }}
      >
        {/* Pill shape with notch, drawn precisely as an SVG path */}
        <svg
          width="100%" height="100%" viewBox={`0 0 ${PILL_W} ${PILL_H}`} preserveAspectRatio="none"
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
        >
          <path d={pillPath(displayCx)} fill={PILL_BG} stroke="#E5E7EB" strokeWidth="1.5" />
        </svg>

        {/* Floating active bubble — tracks the finger 1:1 while dragging, snaps when settled */}
        {displayCx != null && (
          <>
            <span style={{
              position: "absolute", top: BACKING_TOP,
              left: `${(displayCx / PILL_W) * 100}%`, transform: "translateX(-50%)",
              width: BACKING_SIZE, height: BACKING_SIZE, borderRadius: "50%", background: BACKING,
              zIndex: 1, transition: bubbleTransition, pointerEvents: "none",
            }} />
            <span style={{
              position: "absolute", top: BUBBLE_TOP,
              left: `${(displayCx / PILL_W) * 100}%`, transform: "translateX(-50%)",
              width: BUBBLE_SIZE, height: BUBBLE_SIZE, borderRadius: "50%", background: PRIMARY,
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 2, transition: bubbleTransition, pointerEvents: "none",
            }}>
              {bubbleIndex === 3 ? moreIcon("#ffffff") : NAV_ITEMS[bubbleIndex].icon("#ffffff")}
            </span>
          </>
        )}

        {/* Icon row */}
        <div style={{ position: "relative", display: "flex", height: "100%", paddingLeft: SIDE_PAD, paddingRight: SIDE_PAD }}>
          {NAV_ITEMS.map((item, i) => (
            <Link key={item.label} href={item.href}
              style={{ position: "relative", flex: 1, height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {i !== bubbleIndex && item.icon(MUTED)}
            </Link>
          ))}

          {/* More button */}
          <button onClick={() => setMoreOpen(o => !o)}
            style={{ position: "relative", flex: 1, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "transparent", border: "none" }}>
            {bubbleIndex !== 3 && moreIcon(MUTED)}
          </button>
        </div>
      </nav>

      {/* ── More bottom sheet ─────────────────────────────────────────────────── */}
      {moreOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 md:hidden"
            style={{ background: "rgba(0,0,0,0.4)" }}
            onClick={close} />

          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white rounded-t-3xl overflow-hidden flex flex-col"
            style={{ maxHeight: "88vh", paddingBottom: "env(safe-area-inset-bottom)" }}>

            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ background: "#E5E7EB" }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-2.5 border-b shrink-0" style={{ borderColor: "#F3F4F6" }}>
              <span className="text-base font-bold text-black">Explore</span>
              <button onClick={close}
                className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                style={{ color: "#6B7280", background: "#F3F4F6" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1">

              <Section label="Events">
                {EVENTS_ITEMS.map(item => (
                  <SheetLink key={item.label} href={item.href} icon={item.icon} label={item.label} onClose={close} />
                ))}
              </Section>

              <Section label="Venue Types">
                {VENUE_TYPE_ITEMS.map(item => (
                  <SheetLink key={item.label} href={item.href} icon={item.icon} label={item.label} onClose={close} />
                ))}
              </Section>

              <Section label="Services">
                {SERVICE_ITEMS.map(item => (
                  <SheetLink key={item.label} href={item.href} icon={item.icon} label={item.label} onClose={close} />
                ))}
              </Section>

              <Section label="Vendors">
                {VENDOR_ITEMS.map(item => (
                  <SheetLink key={item.label} href={item.href} icon={item.icon} label={item.label} onClose={close} />
                ))}
              </Section>

              <Section label="Company">
                {COMPANY_ITEMS.map(item => (
                  <SheetLink key={item.label} href={item.href} icon={item.icon} label={item.label} highlight={item.highlight} onClose={close} />
                ))}
              </Section>

            </div>

            {/* Branding */}
            <div className="shrink-0 px-5 py-3 border-t" style={{ borderColor: "#F3F4F6" }}>
              <p className="text-center text-xs" style={{ color: "#D1D5DB" }}>
                &copy; {new Date().getFullYear()} <span style={{ color: PRIMARY }}>Event Ease</span> · Pakistan&apos;s Venue Platform
              </p>
            </div>

          </div>
        </>
      )}
    </>
  );
}
