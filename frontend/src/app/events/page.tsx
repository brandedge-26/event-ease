import Link from "next/link";
import type { Metadata } from "next";
import SiteHeader from "../SiteHeader";
import BottomNav from "../BottomNav";
import SiteFooter from "../SiteFooter";
import { EVENTS, EVENT_BANNERS } from "./[slug]/page";

export const metadata: Metadata = { title: "Events — Event Ease" };

const PRIMARY = "#FF3B6B";
const ALL_EVENT_SLUGS = ["barat", "mehndi", "walima", "bridal", "engagement", "nikkah", "qawali", "birthday"];

export default function EventsIndexPage() {
  const events = ALL_EVENT_SLUGS.map(slug => EVENTS[slug]);

  return (
    <div className="min-h-screen" style={{ background: "#F8F8F8" }}>
      <SiteHeader />
      <BottomNav />

      <div className="px-4 lg:px-8 pt-8 pb-28 md:pb-16 max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] mb-4 px-3.5 py-1.5 rounded-full"
            style={{ background: "#FFF0F4", color: PRIMARY }}>
            Plan Your Event
          </span>
          <h1 className="text-3xl lg:text-4xl font-black text-black tracking-tight mb-3">
            Every Occasion, Beautifully Planned
          </h1>
          <p className="text-sm max-w-md mx-auto leading-relaxed" style={{ color: "#6B7280" }}>
            From grand Barats to intimate bridal showers — explore traditions, planning tips,
            and the perfect venues for every Pakistani celebration.
          </p>
        </div>

        {/* Event cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {events.map(ev => (
            <Link
              key={ev.slug}
              href={`/events/${ev.slug}`}
              className="group rounded-2xl overflow-hidden bg-white transition-all duration-200 hover:-translate-y-1"
              style={{ border: "1px solid #E5E7EB" }}
            >
              <div className="relative h-40 overflow-hidden">
                {EVENT_BANNERS[ev.slug] ? (
                  <img
                    src={EVENT_BANNERS[ev.slug]}
                    alt={ev.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full" style={{ background: "#FFF0F4" }} />
                )}
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)" }} />
              </div>
              <div className="p-4">
                <h3 className="text-base font-black text-black mb-1">{ev.title}</h3>
                <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "#6B7280" }}>{ev.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
