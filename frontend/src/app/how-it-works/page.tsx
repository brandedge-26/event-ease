import SiteHeader from "../SiteHeader";
import BottomNav from "../BottomNav";
import Link from "next/link";

const PRIMARY = "#FF3B6B";

const CUSTOMER_STEPS = [
  {
    step: "01",
    title: "Search & Discover",
    desc: "Browse thousands of verified venues and event spaces across Pakistan. Filter by city, type, capacity, and price range to find exactly what you need.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
  {
    step: "02",
    title: "Compare Venues",
    desc: "View detailed profiles with photos, hall capacities, pricing, and customer reviews. Compare multiple venues side by side to make the best decision.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    step: "03",
    title: "Contact & Book",
    desc: "Reach out directly to venue owners via inquiry form. Discuss availability, pricing, and packages — then confirm your booking hassle-free.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
    ),
  },
  {
    step: "04",
    title: "Celebrate Your Event",
    desc: "Show up and enjoy your event! After the event, leave a review to help other customers find great venues.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
];

const BUSINESS_STEPS = [
  {
    step: "01",
    title: "Register Your Business",
    desc: "Sign up as a venue owner in minutes. Fill in your business details — name, city, contact info, and a short description of your venue.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
      </svg>
    ),
  },
  {
    step: "02",
    title: "Add Your Halls & Pricing",
    desc: "List all your halls with capacity, pricing, and amenities. Add multiple hall types — banquet halls, marquees, ballrooms — under one profile.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4"/>
        <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/>
      </svg>
    ),
  },
  {
    step: "03",
    title: "Create Your Account",
    desc: "Set up your login credentials and verify your email. Your venue profile goes live after our team reviews and approves your submission.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    step: "04",
    title: "Get Discovered & Grow",
    desc: "Your venue appears in search results for thousands of customers. Manage inquiries, get bookings, and grow your event business on EventEase.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
      </svg>
    ),
  },
];

const FAQS = [
  {
    q: "Is EventEase free to use for customers?",
    a: "Yes, completely free. Browse, compare, and contact venues at no cost.",
  },
  {
    q: "How do I list my venue on EventEase?",
    a: "Click \"List Your Business\" in the header, fill out the 4-step onboarding form, and our team will review and approve your listing.",
  },
  {
    q: "How long does venue approval take?",
    a: "Our team reviews all submissions within 24–48 hours. You'll receive an email once your venue is live.",
  },
  {
    q: "Can I list multiple halls under one account?",
    a: "Yes. You can add as many halls as you have, each with its own capacity, pricing, and details — all under one business account.",
  },
  {
    q: "How do customers contact my venue?",
    a: "Customers can send you an inquiry directly from your venue profile. You'll receive it via email and in your vendor dashboard.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen pb-28 md:pb-0" style={{ background: "#F9FAFB" }}>

        {/* Hero */}
        <section className="bg-white border-b" style={{ borderColor: "#E5E7EB" }}>
          <div className="max-w-4xl mx-auto px-4 py-16 text-center">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4"
              style={{ background: "#FFF0F4", color: PRIMARY }}>
              How It Works
            </span>
            <h1 className="text-4xl font-black text-black mb-4 leading-tight">
              Simple. Fast. Transparent.
            </h1>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "#6B7280" }}>
              Whether you&apos;re looking for the perfect venue or want to list your business — EventEase makes it easy for everyone.
            </p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 py-14 space-y-20">

          {/* ── For Customers ── */}
          <section>
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "#FFF0F4" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: PRIMARY }}>For Customers</p>
                <h2 className="text-2xl font-black text-black leading-tight">How to Find & Book a Venue</h2>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {CUSTOMER_STEPS.map((s, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border relative overflow-hidden"
                  style={{ borderColor: "#E5E7EB" }}>
                  {/* Step number watermark */}
                  <span className="absolute top-3 right-4 text-5xl font-black select-none"
                    style={{ color: "#FFF0F4", lineHeight: 1 }}>
                    {s.step}
                  </span>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: "#FFF0F4" }}>
                    {s.icon}
                  </div>
                  <h3 className="font-bold text-black mb-2">{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{s.desc}</p>
                  {/* Step connector line */}
                  {i < CUSTOMER_STEPS.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 z-10" style={{ background: "#E5E7EB" }} />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-center">
              <Link href="/venues"
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: PRIMARY }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                Browse Venues Now
              </Link>
            </div>
          </section>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
            <span className="text-xs font-semibold uppercase tracking-widest px-3" style={{ color: "#9CA3AF" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
          </div>

          {/* ── For Businesses ── */}
          <section>
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "#F5F3FF" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4"/>
                  <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/>
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#7C3AED" }}>For Businesses</p>
                <h2 className="text-2xl font-black text-black leading-tight">How to List Your Venue</h2>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {BUSINESS_STEPS.map((s, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border relative overflow-hidden"
                  style={{ borderColor: "#E5E7EB" }}>
                  <span className="absolute top-3 right-4 text-5xl font-black select-none"
                    style={{ color: "#F5F3FF", lineHeight: 1 }}>
                    {s.step}
                  </span>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: "#F5F3FF" }}>
                    {s.icon}
                  </div>
                  <h3 className="font-bold text-black mb-2">{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{s.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-center">
              <Link href="/vendor/onboarding/business-info"
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: "#7C3AED" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                List Your Business
              </Link>
            </div>
          </section>

          {/* ── FAQ ── */}
          <section>
            <h2 className="text-2xl font-black text-black mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-3 max-w-2xl mx-auto">
              {FAQS.map((faq, i) => (
                <details key={i} className="bg-white rounded-2xl border group" style={{ borderColor: "#E5E7EB" }}>
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none list-none">
                    <span className="font-semibold text-sm text-black">{faq.q}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round"
                      className="shrink-0 transition-transform group-open:rotate-180">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </summary>
                  <div className="px-5 pb-4 text-sm leading-relaxed" style={{ color: "#6B7280" }}>
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* ── CTA Banner ── */}
          <section className="rounded-2xl p-8 text-center" style={{ background: "linear-gradient(135deg, #FF3B6B 0%, #FF8FA3 100%)" }}>
            <h2 className="text-2xl font-black text-white mb-2">Ready to get started?</h2>
            <p className="text-white/80 text-sm mb-6">Join thousands of customers and businesses already using EventEase.</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href="/venues"
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-white transition-opacity hover:opacity-90"
                style={{ color: PRIMARY }}>
                Find a Venue
              </Link>
              <Link href="/vendor/onboarding/business-info"
                className="px-6 py-2.5 rounded-xl text-sm font-bold border-2 border-white text-white transition-opacity hover:opacity-80">
                List Your Business
              </Link>
            </div>
          </section>

        </div>
      </main>
      <BottomNav />
    </>
  );
}
