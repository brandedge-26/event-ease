"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const inputClass =
  "w-full px-5 py-4 rounded-2xl text-base outline-none transition-all duration-200 border border-[#D1D5DB] focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2";

const inputStyle = {
  background: "var(--bg-subtle)",
  color: "var(--fg)",
};

const MAX_IMAGES = 10;

export default function HallDetailsPage() {
  const router = useRouter();
  const logoRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    numberOfHalls: "",
    maxCapacity: "",
    startingPrice: "",
    description: "",
  });

  const [logo, setLogo] = useState<string | null>(null);
  const [hallImages, setHallImages] = useState<string[]>([]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogo(URL.createObjectURL(file));
  }

  function handleHallImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = MAX_IMAGES - hallImages.length;
    const toAdd = files.slice(0, remaining).map((f) => URL.createObjectURL(f));
    setHallImages((prev) => [...prev, ...toAdd]);
    e.target.value = "";
  }

  function removeImage(index: number) {
    setHallImages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push("/vendor/onboarding/account");
  }

  return (
    <div className="w-full max-w-lg">

      {/* Heading */}
      <h1 className="text-4xl font-semibold text-black mb-1 tracking-tight">
        Hall Details.
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--fg-muted)" }}>
        Step 2 of 3 — Add your hall and business details.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">

        {/* Halls & Capacity */}
        <div className="flex gap-3">
          <input
            name="numberOfHalls"
            type="number"
            placeholder="Number of halls *"
            value={form.numberOfHalls}
            onChange={handleChange}
            required
            min={1}
            className={inputClass}
            style={inputStyle}
          />
          <input
            name="maxCapacity"
            type="number"
            placeholder="Max capacity *"
            value={form.maxCapacity}
            onChange={handleChange}
            required
            min={1}
            className={inputClass}
            style={inputStyle}
          />
        </div>

        {/* Starting Price */}
        <div className="relative">
          <span
            className="absolute left-5 top-1/2 -translate-y-1/2 text-base font-medium"
            style={{ color: "var(--fg-muted)" }}
          >
            Rs.
          </span>
          <input
            name="startingPrice"
            type="number"
            placeholder="Starting price *"
            value={form.startingPrice}
            onChange={handleChange}
            required
            min={0}
            className={`${inputClass} pl-12`}
            style={inputStyle}
          />
        </div>

        {/* Description */}
        <textarea
          name="description"
          placeholder="Business description"
          value={form.description}
          onChange={handleChange}
          rows={4}
          className="w-full px-5 py-4 rounded-2xl text-base outline-none transition-all duration-200 border border-[#D1D5DB] focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 resize-none"
          style={inputStyle}
        />

        {/* Logo Upload */}
        <div
          onClick={() => logoRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 py-5 rounded-2xl border border-dashed border-[#D1D5DB] cursor-pointer transition-colors hover:border-[var(--primary)]"
          style={{ background: "var(--bg-subtle)" }}
        >
          {logo ? (
            <Image src={logo} alt="Logo" width={48} height={48} className="rounded-xl object-cover" />
          ) : (
            <>
              <UploadIcon />
              <span className="text-xs font-medium" style={{ color: "var(--fg-muted)" }}>
                Business Logo
              </span>
            </>
          )}
          <input
            ref={logoRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogo}
          />
        </div>

        {/* Hall Images Upload */}
        <div className="rounded-2xl border border-dashed border-[#D1D5DB] p-4" style={{ background: "var(--bg-subtle)" }}>

          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>Hall Images</p>
              <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                {hallImages.length}/{MAX_IMAGES} images uploaded
              </p>
            </div>
            {hallImages.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => imagesRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80"
                style={{ background: "var(--primary)", color: "#ffffff" }}
              >
                <PlusIcon /> Add Images
              </button>
            )}
          </div>

          {/* Grid */}
          {hallImages.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {hallImages.map((src, i) => (
                <div key={i} className="relative group aspect-square">
                  <Image
                    src={src}
                    alt={`Hall ${i + 1}`}
                    fill
                    className="rounded-xl object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}
                  >
                    <XIcon />
                  </button>
                </div>
              ))}
              {hallImages.length < MAX_IMAGES && (
                <div
                  onClick={() => imagesRef.current?.click()}
                  className="aspect-square rounded-xl border border-dashed border-[#D1D5DB] flex items-center justify-center cursor-pointer hover:border-[var(--primary)] transition-colors"
                >
                  <PlusIcon color="var(--fg-subtle)" />
                </div>
              )}
            </div>
          ) : (
            <div
              onClick={() => imagesRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 py-6 cursor-pointer"
            >
              <UploadIcon />
              <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
                Click to upload hall images (max 10)
              </span>
            </div>
          )}

          <input
            ref={imagesRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleHallImages}
          />
        </div>

        {/* Back & Submit */}
        <div className="flex gap-3 mt-1">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full py-4 rounded-2xl text-base font-semibold cursor-pointer transition-opacity hover:opacity-70"
            style={{ background: "var(--bg-subtle)", color: "var(--fg)" }}
          >
            Back
          </button>
          <button
            type="submit"
            className="w-full py-4 rounded-2xl text-base font-semibold cursor-pointer transition-opacity hover:opacity-90 active:opacity-80"
            style={{ background: "var(--primary)", color: "#ffffff" }}
          >
            Continue
          </button>
        </div>

      </form>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fg-subtle)" }}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function PlusIcon({ color }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
