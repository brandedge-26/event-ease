"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import SiteHeader from "../SiteHeader";
import BottomNav from "../BottomNav";

const PRIMARY = "#FF3B6B";

const CONTACT_INFO = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.69A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
      </svg>
    ),
    label: "Phone",
    value: "+92 300 1234567",
    href: "tel:+923001234567",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
    label: "Email",
    value: "hello@eventease.pk",
    href: "mailto:hello@eventease.pk",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
      </svg>
    ),
    label: "Location",
    value: "Karachi, Pakistan",
    href: "#",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    label: "Working Hours",
    value: "Mon – Sat, 9am – 6pm",
    href: "#",
  },
];

export default function ContactPage() {
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const isDisabled = !name || !email || !subject || !message || loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5510";
      const res  = await fetch(`${API}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (data.success) { setSent(true); }
      else setError(data.message ?? "Failed to send. Please try again.");
    } catch {
      setError("Could not connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#F8F8F8" }}>
      <SiteHeader />
      <BottomNav />

      {/* Page header */}
      <div className="bg-white border-b" style={{ borderColor: "#E5E7EB" }}>
        <div className="px-4 lg:px-8 py-5">
          <div className="flex items-center gap-1.5 mb-3">
            <Link href="/" className="text-xs font-medium hover:opacity-70" style={{ color: "#9CA3AF" }}>Home</Link>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            <span className="text-xs font-semibold" style={{ color: "#374151" }}>Contact</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-black mb-1">Get in Touch</h1>
          <p className="text-sm" style={{ color: "#6B7280" }}>We'd love to hear from you. Send us a message and we'll respond shortly.</p>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 lg:px-8 py-8 pb-28 md:pb-12">
        <div className="grid lg:grid-cols-[340px_1fr] gap-6 max-w-5xl mx-auto">

          {/* ── Left: contact info ─────────────────────────────────────────── */}
          <div className="flex flex-col gap-4">

            {/* Info card */}
            <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "#E5E7EB" }}>
              {/* Logo + brand */}
              <div className="flex items-center gap-3 mb-6">
                <Image src="/logo/logo-icon.svg" alt="Event Ease" width={40} height={40} className="rounded-xl" />
                <div>
                  <p className="text-base font-black tracking-tight">
                    <span className="text-black">Event</span>
                    <span style={{ color: PRIMARY }}>Ease</span>
                  </p>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>Pakistan's Venue Platform</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {CONTACT_INFO.map(item => (
                  <a key={item.label} href={item.href}
                    className="flex items-start gap-4 group">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "#FFF0F4" }}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: "#9CA3AF" }}>
                        {item.label}
                      </p>
                      <p className="text-sm font-semibold group-hover:underline" style={{ color: "#111827" }}>
                        {item.value}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Social links */}
            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E5E7EB" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#9CA3AF" }}>Follow Us</p>
              <div className="flex items-center gap-3">
                {[
                  { label: "Instagram", color: "#E1306C", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg> },
                  { label: "Facebook",  color: "#1877F2", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg> },
                  { label: "Twitter",   color: "#1DA1F2", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg> },
                  { label: "WhatsApp",  color: "#25D366", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg> },
                ].map(s => (
                  <button key={s.label}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
                    style={{ background: "#F9FAFB", color: s.color, border: "1px solid #E5E7EB" }}
                    title={s.label}>
                    {s.icon}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* ── Right: contact form ────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border p-6 lg:p-8" style={{ borderColor: "#E5E7EB" }}>

            {sent ? (
              /* Success state */
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: "#FFF0F4" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-black mb-2">Message Sent!</h2>
                <p className="text-sm max-w-xs" style={{ color: "#6B7280" }}>
                  Thank you for reaching out. Our team will get back to you within 24 hours.
                </p>
                <button onClick={() => { setSent(false); setName(""); setEmail(""); setSubject(""); setMessage(""); }}
                  className="mt-6 px-5 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer transition-opacity hover:opacity-90"
                  style={{ background: PRIMARY }}>
                  Send Another
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-black mb-1">Send a Message</h2>
                <p className="text-sm mb-6" style={{ color: "#6B7280" }}>
                  Fill out the form below and we&apos;ll get back to you as soon as possible.
                </p>

                {error && (
                  <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "#FEE2E2", color: "#B91C1C" }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                  {/* Name + Email row */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Full Name</label>
                      <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-all focus:ring-2 focus:ring-offset-1"
                        style={{ background: "#F9FAFB", borderColor: "#E5E7EB", color: "#111827" }} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Email Address</label>
                      <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-all focus:ring-2 focus:ring-offset-1"
                        style={{ background: "#F9FAFB", borderColor: "#E5E7EB", color: "#111827" }} />
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Subject</label>
                    <select value={subject} onChange={e => setSubject(e.target.value)} required
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none border appearance-none cursor-pointer transition-all"
                      style={{ background: "#F9FAFB", borderColor: "#E5E7EB", color: subject ? "#111827" : "#9CA3AF" }}>
                      <option value="">Select a topic…</option>
                      <option value="venue_listing">Venue Listing Enquiry</option>
                      <option value="booking">Booking Support</option>
                      <option value="partnership">Partnership / Collaboration</option>
                      <option value="technical">Technical Issue</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Message</label>
                    <textarea placeholder="Tell us how we can help…" value={message} onChange={e => setMessage(e.target.value)} required rows={5}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none border resize-none transition-all focus:ring-2 focus:ring-offset-1"
                      style={{ background: "#F9FAFB", borderColor: "#E5E7EB", color: "#111827" }} />
                    <p className="text-right text-[11px] mt-1" style={{ color: "#9CA3AF" }}>{message.length} / 500</p>
                  </div>

                  {/* Submit */}
                  <button type="submit" disabled={isDisabled}
                    className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-opacity"
                    style={{ background: PRIMARY, opacity: isDisabled ? 0.4 : 1, cursor: isDisabled ? "not-allowed" : "pointer" }}>
                    {loading ? "Sending…" : "Send Message"}
                  </button>

                </form>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t py-6 text-center" style={{ borderColor: "#E5E7EB" }}>
        <p className="text-xs" style={{ color: "#9CA3AF" }}>
          © {new Date().getFullYear()} <span className="font-semibold" style={{ color: PRIMARY }}>Event Ease</span> · Pakistan's Venue Discovery Platform
        </p>
      </div>
    </div>
  );
}
