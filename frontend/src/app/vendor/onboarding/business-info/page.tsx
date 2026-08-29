"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const inputClass =
  "w-full px-5 py-4 rounded-2xl text-base outline-none transition-all duration-200 border border-[#D1D5DB] focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2";

const inputStyle = {
  background: "var(--bg-subtle)",
  color: "var(--fg)",
};

const businessTypes = [
  // Venue Types
  "Banquet Hall",
  "Marquee",
  "Ballroom",
  "Wedding Lawn",
  "Hotel Banquet",
  "Rooftop Venue",
  "Farm House",
  // Services
  "Beauty Parlor",
  "Florist",
  "Catering",
  "Decoration",
  "Photography",
  "Sound & Lights",
  "Car Rental",
  "Fireworks",
];

export default function BusinessInfoPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    businessName: "", businessType: "", mobile: "", whatsapp: "", city: "", area: "", address: "", cnic: "",
  });

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("ob_step1");
      if (saved) setForm(prev => ({ ...prev, ...JSON.parse(saved) }));
    } catch {}
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sessionStorage.setItem("ob_step1", JSON.stringify(form));
    router.push("/vendor/onboarding/halls");
  }

  return (
    <div className="w-full max-w-lg">

      {/* Heading */}
      <h1 className="text-4xl font-semibold text-black mb-1 tracking-tight">
        Register Your Business.
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--fg-muted)" }}>
        Step 1 of 4 — Tell us about your business.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">

        {/* Business Name */}
        <input
          name="businessName"
          type="text"
          placeholder="Business name *"
          value={form.businessName}
          onChange={handleChange}
          required
          className={inputClass}
          style={inputStyle}
        />

        {/* Business Type */}
        <select
          name="businessType"
          value={form.businessType}
          onChange={handleChange}
          required
          className={inputClass}
          style={{
            ...inputStyle,
            color: form.businessType ? "var(--fg)" : "var(--fg-subtle)",
          }}
        >
          <option value="" disabled>Business type *</option>
          {businessTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        {/* Mobile & WhatsApp */}
        <div className="flex gap-3">
          <input
            name="mobile"
            type="tel"
            placeholder="Mobile number *"
            value={form.mobile}
            onChange={handleChange}
            required
            className={inputClass}
            style={inputStyle}
          />
          <input
            name="whatsapp"
            type="tel"
            placeholder="WhatsApp number"
            value={form.whatsapp}
            onChange={handleChange}
            className={inputClass}
            style={inputStyle}
          />
        </div>

        {/* City & Area */}
        <div className="flex gap-3">
          <input
            name="city"
            type="text"
            placeholder="City *"
            value={form.city}
            onChange={handleChange}
            required
            className={inputClass}
            style={inputStyle}
          />
          <input
            name="area"
            type="text"
            placeholder="Area *"
            value={form.area}
            onChange={handleChange}
            required
            className={inputClass}
            style={inputStyle}
          />
        </div>

        {/* Address */}
        <input
          name="address"
          type="text"
          placeholder="Business address *"
          value={form.address}
          onChange={handleChange}
          required
          className={inputClass}
          style={inputStyle}
        />

        {/* CNIC */}
        <input
          name="cnic"
          type="text"
          placeholder="CNIC (optional)"
          value={form.cnic}
          onChange={handleChange}
          className={inputClass}
          style={inputStyle}
        />

        {/* Next */}
        <button
          type="submit"
          className="w-full mt-1 py-4 rounded-2xl text-base font-semibold cursor-pointer transition-opacity hover:opacity-90 active:opacity-80"
          style={{ background: "var(--primary)", color: "#ffffff" }}
        >
          Continue
        </button>

      </form>
    </div>
  );
}
