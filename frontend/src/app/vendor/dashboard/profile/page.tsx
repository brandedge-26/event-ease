"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";

const PRIMARY   = "var(--primary)";
const API_BASE  = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5510";

const ALL_SERVICES  = ["Wedding","Engagement","Mehndi Night","Corporate Event","Birthday Party","Anniversary","Conference","Walima","Other"];
const ALL_AMENITIES = ["Free Parking","Valet Parking","In-house Catering","Full Decoration","AV & Sound System","Bridal Room","Prayer Area","Generator Backup","Air Conditioning","WiFi","Live Kitchen","Stage & Lighting","Photo Booth","Cold Storage"];

const INP   = "w-full px-5 py-4 rounded-2xl text-base outline-none transition-all duration-200 border border-[#D1D5DB] focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-1";
const INP_S = { background: "var(--bg-subtle)", color: "var(--fg)" };

type Tab  = "basic" | "about" | "halls" | "gallery";
type Hall = { id: string; name: string; capacity: number; price: number; desc: string | null };

type ProfileData = {
  name: string; tagline: string; phone: string; whatsapp: string;
  city: string; area: string; address: string; about: string;
  established: number | null; logoUrl: string | null; galleryImages: string[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-semibold mb-2" style={{ color: "#374151" }}>{children}</label>;
}
function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl p-5 lg:p-6 border" style={{ borderColor: "#E5E7EB" }}>{children}</div>;
}
function CardHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-base font-bold" style={{ color: "#111827" }}>{title}</h2>
      {sub && <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{sub}</p>}
    </div>
  );
}

// ─── Hall Drawer ──────────────────────────────────────────────────────────────
function HallDrawer({ initial, onSave, onClose, loading }: {
  initial?: Hall;
  onSave: (data: Omit<Hall, "id">) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({
    name:     initial?.name     ?? "",
    capacity: initial?.capacity ?? "",
    price:    initial?.price    ?? "",
    desc:     initial?.desc     ?? "",
  });

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={[
        "fixed z-50 bg-white flex flex-col",
        "bottom-0 left-0 right-0 rounded-t-3xl max-h-[90dvh]",
        "lg:bottom-0 lg:top-0 lg:right-0 lg:left-auto lg:w-[440px] lg:max-h-full lg:rounded-none lg:rounded-l-3xl",
      ].join(" ")} style={{ boxShadow: "0 -4px 40px rgba(0,0,0,0.15)" }}>
        <div className="flex justify-center pt-3 pb-1 lg:hidden shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "#E5E7EB" }} />
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "#F4F4F5" }}>
          <p className="text-base font-bold text-black">{initial ? "Edit Hall" : "Add Hall"}</p>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 cursor-pointer" style={{ color: "#6B7280" }}><XIcon /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-3">
          <div>
            <Label>Hall Name</Label>
            <input className={INP} style={INP_S} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Grand Hall" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Max Capacity</Label>
              <input className={INP} style={INP_S} type="number" min="1" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} placeholder="500" />
            </div>
            <div>
              <Label>Price (Rs.)</Label>
              <input className={INP} style={INP_S} type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="250000" />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <textarea className={INP} style={{ ...INP_S, height: 100 }} value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} placeholder="Describe this hall..." />
          </div>
        </div>
        <div className="shrink-0 px-5 py-4 border-t flex gap-3" style={{ borderColor: "#F4F4F5" }}>
          <button onClick={onClose} className="px-5 py-3 rounded-2xl text-sm font-semibold cursor-pointer hover:opacity-70 transition-opacity" style={{ background: "var(--bg-subtle)", color: "var(--fg-muted)" }}>Cancel</button>
          <button
            onClick={() => {
              if (!form.name.trim() || !form.capacity || !form.price) return;
              onSave({ name: form.name.trim(), capacity: Number(form.capacity), price: Number(form.price), desc: form.desc.trim() || null });
            }}
            disabled={loading || !form.name.trim() || !form.capacity || !form.price}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--primary)" }}
          >
            {loading ? "Saving…" : initial ? "Update Hall" : "Add Hall"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ManageProfilePage() {
  const { accessToken, vendor: authVendor } = useAuthStore();
  const [tab,     setTab]     = useState<Tab>("basic");
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState<Tab | null>(null);
  const [error,   setError]   = useState("");

  // Profile fields
  const [profile, setProfile] = useState<ProfileData>({
    name: "", tagline: "", phone: "", whatsapp: "",
    city: "", area: "", address: "", about: "",
    established: null, logoUrl: null, galleryImages: [],
  });
  const [services,  setServices]  = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [halls,     setHalls]     = useState<Hall[]>([]);

  // Hall drawer
  const [hallDrawer, setHallDrawer] = useState<{ open: boolean; hall?: Hall }>({ open: false });
  const [hallSaving, setHallSaving] = useState(false);

  // Logo upload
  const logoRef = useRef<HTMLInputElement>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  // Gallery upload
  const galleryRef = useRef<HTMLInputElement>(null);
  const [galleryUploading, setGalleryUploading] = useState(false);

  // ── Load data ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) return;
    loadProfile();
  }, [accessToken]);

  async function loadProfile() {
    setLoading(true);
    try {
      const res = await api.get<{ vendor: any; halls: Hall[] }>("/api/vendor/profile/me", accessToken!);
      if (res.success) {
        const v = res.vendor;
        setProfile({
          name:          v.name          ?? "",
          tagline:       v.tagline       ?? "",
          phone:         v.phone         ?? "",
          whatsapp:      v.whatsapp      ?? "",
          city:          v.city          ?? "",
          area:          v.area          ?? "",
          address:       v.address       ?? "",
          about:         v.about         ?? "",
          established:   v.established   ?? null,
          logoUrl:       v.logoUrl       ?? null,
          galleryImages: v.galleryImages ?? [],
        });
        setServices(v.services   ?? []);
        setAmenities(v.amenities ?? []);
        setHalls(res.halls ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  function flash(t: Tab) { setSaved(t); setTimeout(() => setSaved(null), 2500); }

  // ── Save basic info ──────────────────────────────────────────────────────────
  async function saveBasic() {
    setSaving(true); setError("");
    try {
      const res = await api.patch("/api/vendor/profile/me", {
        name:        profile.name,
        tagline:     profile.tagline,
        phone:       profile.phone,
        whatsapp:    profile.whatsapp,
        city:        profile.city,
        area:        profile.area,
        address:     profile.address,
        established: profile.established,
      }, accessToken!);
      if (res.success) flash("basic"); else setError((res as any).message ?? "Failed to save.");
    } finally { setSaving(false); }
  }

  // ── Save about ───────────────────────────────────────────────────────────────
  async function saveAbout() {
    setSaving(true); setError("");
    try {
      const res = await api.patch("/api/vendor/profile/me", { about: profile.about, services, amenities }, accessToken!);
      if (res.success) flash("about"); else setError((res as any).message ?? "Failed to save.");
    } finally { setSaving(false); }
  }

  // ── Logo upload ──────────────────────────────────────────────────────────────
  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const fd = new FormData();
      fd.append("logo", file);
      const res = await fetch(`${API_BASE}/api/vendor/upload/logo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: fd,
      });
      const data = await res.json();
      if (data.success) setProfile(p => ({ ...p, logoUrl: data.logoUrl }));
    } finally {
      setLogoUploading(false);
      if (logoRef.current) logoRef.current.value = "";
    }
  }

  // ── Gallery upload ───────────────────────────────────────────────────────────
  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setGalleryUploading(true);
    try {
      const fd = new FormData();
      files.forEach(f => fd.append("images", f));
      const res = await fetch(`${API_BASE}/api/vendor/upload/gallery`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: fd,
      });
      const data = await res.json();
      if (data.success) setProfile(p => ({ ...p, galleryImages: data.galleryImages ?? p.galleryImages }));
    } finally {
      setGalleryUploading(false);
      if (galleryRef.current) galleryRef.current.value = "";
    }
  }

  // ── Gallery delete ───────────────────────────────────────────────────────────
  async function deleteGalleryImage(url: string) {
    const updated = profile.galleryImages.filter(u => u !== url);
    setProfile(p => ({ ...p, galleryImages: updated }));
    await api.patch("/api/vendor/profile/me", { galleryImages: updated }, accessToken!);
  }

  // ── Hall CRUD ────────────────────────────────────────────────────────────────
  async function saveHall(data: Omit<Hall, "id">) {
    setHallSaving(true);
    try {
      if (hallDrawer.hall) {
        // Update
        const res = await fetch(`${API_BASE}/api/vendor/halls/${hallDrawer.hall.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (json.success) {
          setHalls(prev => prev.map(h => h.id === hallDrawer.hall!.id ? { ...h, ...data } : h));
          setHallDrawer({ open: false });
        }
      } else {
        // Create
        const res = await fetch(`${API_BASE}/api/vendor/halls`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (json.success) {
          setHalls(prev => [...prev, json.hall]);
          setHallDrawer({ open: false });
        }
      }
    } finally { setHallSaving(false); }
  }

  async function deleteHall(id: string) {
    if (!confirm("Delete this hall?")) return;
    const res = await fetch(`${API_BASE}/api/vendor/halls/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const json = await res.json();
    if (json.success) setHalls(prev => prev.filter(h => h.id !== id));
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  const TABS: { key: Tab; label: string }[] = [
    { key: "basic",   label: "Basic Info" },
    { key: "about",   label: "About" },
    { key: "halls",   label: `Halls (${halls.length})` },
    { key: "gallery", label: `Gallery (${profile.galleryImages.length})` },
  ];

  function SaveBtn({ onClick }: { onClick: () => void }) {
    const isSaved = saved === tab;
    return (
      <button
        onClick={onClick}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-60"
        style={{ background: isSaved ? "#16A34A" : "var(--primary)" }}
      >
        {isSaved ? <><CheckIcon /> Saved</> : saving ? "Saving…" : <><SaveIcon /> Save Changes</>}
      </button>
    );
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-4">
        {[1,2,3].map(n => <div key={n} className="bg-white rounded-2xl h-24 animate-pulse" style={{ border: "1px solid #E5E7EB" }} />)}
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto min-h-screen" style={{ background: "var(--bg-subtle, #F4F4F5)" }}>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#111827" }}>Manage Profile</h1>
          <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>Edit your public profile page</p>
        </div>
        {authVendor?.slug && (
          <a href={`/profile/${authVendor.slug}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold border transition-colors hover:bg-white shrink-0"
            style={{ borderColor: "#E5E7EB", color: "#374151", background: "#fff" }}>
            <EyeIcon /> Preview Profile
          </a>
        )}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "#FEE2E2", color: "#B91C1C" }}>
          {error}
        </div>
      )}

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 rounded-2xl mb-5 overflow-x-auto" style={{ background: "#E5E7EB" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex-1 min-w-fit px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer"
            style={{
              background: tab === t.key ? "#fff" : "transparent",
              color:      tab === t.key ? "#111827" : "#6B7280",
              boxShadow:  tab === t.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* ── Basic Info ── */}
      {tab === "basic" && (
        <Card>
          <CardHead title="Basic Information" sub="Core details shown at the top of your profile" />
          <div className="flex flex-col gap-4 max-w-2xl">

            {/* Logo */}
            <div>
              <Label>Logo / Profile Photo</Label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl shrink-0 overflow-hidden flex items-center justify-center font-black text-white text-2xl"
                  style={{ background: "linear-gradient(135deg,#FF3B6B,#FF8FA3)" }}>
                  {profile.logoUrl
                    ? <img src={profile.logoUrl} alt="logo" className="w-full h-full object-cover" />
                    : (profile.name[0] ?? "?")}
                </div>
                <div>
                  <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  <button
                    onClick={() => logoRef.current?.click()}
                    disabled={logoUploading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50 cursor-pointer disabled:opacity-50"
                    style={{ borderColor: "#D1D5DB", color: "#374151" }}
                  >
                    <UploadIcon /> {logoUploading ? "Uploading…" : "Change Logo"}
                  </button>
                  <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>JPG, PNG, WEBP — max 5MB</p>
                </div>
              </div>
            </div>

            <div>
              <Label>Business Name</Label>
              <input className={INP} style={INP_S} value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="Royal Banquet Hall" />
            </div>
            <div>
              <Label>Tagline</Label>
              <input className={INP} style={INP_S} value={profile.tagline} onChange={e => setProfile(p => ({ ...p, tagline: e.target.value }))} placeholder="Where Every Moment Becomes a Memory" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Phone Number</Label>
                <input className={INP} style={INP_S} value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="0300-1234567" />
              </div>
              <div>
                <Label>WhatsApp</Label>
                <input className={INP} style={INP_S} value={profile.whatsapp} onChange={e => setProfile(p => ({ ...p, whatsapp: e.target.value }))} placeholder="923001234567" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>City</Label>
                <input className={INP} style={INP_S} value={profile.city} onChange={e => setProfile(p => ({ ...p, city: e.target.value }))} placeholder="Karachi" />
              </div>
              <div>
                <Label>Area</Label>
                <input className={INP} style={INP_S} value={profile.area} onChange={e => setProfile(p => ({ ...p, area: e.target.value }))} placeholder="Gulshan-e-Iqbal" />
              </div>
            </div>
            <div>
              <Label>Full Address</Label>
              <input className={INP} style={INP_S} value={profile.address} onChange={e => setProfile(p => ({ ...p, address: e.target.value }))} placeholder="Block 13, Main University Road" />
            </div>
            <div>
              <Label>Established Year</Label>
              <input className={INP} style={INP_S} type="number" value={profile.established ?? ""} onChange={e => setProfile(p => ({ ...p, established: e.target.value ? Number(e.target.value) : null }))} placeholder="2010" />
            </div>
            <div className="flex justify-end pt-2">
              <SaveBtn onClick={saveBasic} />
            </div>
          </div>
        </Card>
      )}

      {/* ── About ── */}
      {tab === "about" && (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHead title="Business Description" sub="Shown in the About section of your profile" />
            <textarea
              className={INP} style={{ ...INP_S, minHeight: 140 }}
              value={profile.about}
              onChange={e => setProfile(p => ({ ...p, about: e.target.value }))}
              placeholder="Tell clients about your venue, its history, and what makes it special..."
            />
          </Card>

          <Card>
            <CardHead title="Services Offered" sub="Event types your venue caters to" />
            <div className="flex flex-wrap gap-2">
              {ALL_SERVICES.map(s => {
                const on = services.includes(s);
                return (
                  <button key={s} onClick={() => setServices(p => on ? p.filter(x => x !== s) : [...p, s])}
                    className="px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer"
                    style={{ background: on ? "#FFF0F4" : "#F9FAFB", borderColor: on ? "var(--primary)" : "#E5E7EB", color: on ? "var(--primary)" : "#6B7280" }}>
                    {s}
                  </button>
                );
              })}
            </div>
          </Card>

          <Card>
            <CardHead title="Amenities & Facilities" sub="Features available at your venue" />
            <div className="flex flex-wrap gap-2">
              {ALL_AMENITIES.map(a => {
                const on = amenities.includes(a);
                return (
                  <button key={a} onClick={() => setAmenities(p => on ? p.filter(x => x !== a) : [...p, a])}
                    className="px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer"
                    style={{ background: on ? "#FFF0F4" : "#F9FAFB", borderColor: on ? "var(--primary)" : "#E5E7EB", color: on ? "var(--primary)" : "#6B7280" }}>
                    {a}
                  </button>
                );
              })}
            </div>
          </Card>

          <div className="flex justify-end">
            <SaveBtn onClick={saveAbout} />
          </div>
        </div>
      )}

      {/* ── Halls ── */}
      {tab === "halls" && (
        <Card>
          <CardHead title="Halls & Pricing" sub="Manage your venue's halls and pricing" />
          <div className="flex flex-col gap-3 mb-4">
            {halls.length === 0 && (
              <div className="py-12 text-center rounded-2xl" style={{ background: "#F9FAFB" }}>
                <p className="text-sm font-semibold" style={{ color: "#374151" }}>No halls added yet</p>
                <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>Click "Add Hall" to get started</p>
              </div>
            )}
            {halls.map(h => (
              <div key={h.id} className="flex items-start justify-between gap-3 p-4 rounded-2xl border" style={{ borderColor: "#F3F4F6", background: "#FAFAFA" }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: "#111827" }}>{h.name}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs" style={{ color: "#6B7280" }}>Up to {h.capacity.toLocaleString()} guests</span>
                    <span className="text-xs font-bold" style={{ color: "var(--primary)" }}>Rs. {h.price.toLocaleString("en-PK")}</span>
                  </div>
                  {h.desc && <p className="text-xs mt-1.5 line-clamp-2" style={{ color: "#9CA3AF" }}>{h.desc}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setHallDrawer({ open: true, hall: h })}
                    className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-blue-50 transition-colors cursor-pointer" style={{ color: "#2563EB" }}>
                    <EditIcon />
                  </button>
                  <button onClick={() => deleteHall(h.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-50 transition-colors cursor-pointer" style={{ color: "#EF4444" }}>
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setHallDrawer({ open: true })}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold border-2 border-dashed transition-colors hover:bg-gray-50 cursor-pointer"
            style={{ borderColor: "#D1D5DB", color: "#374151" }}>
            <PlusIcon /> Add Hall
          </button>
        </Card>
      )}

      {/* ── Gallery ── */}
      {tab === "gallery" && (
        <Card>
          <CardHead title="Gallery Photos" sub="Event photos shown on your public profile" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {profile.galleryImages.map((url, i) => (
              <div key={i} className="relative group rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
                <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                <button
                  onClick={() => deleteGalleryImage(url)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  style={{ background: "#EF4444", color: "#fff" }}>
                  <TrashIcon />
                </button>
              </div>
            ))}

            {/* Upload tile */}
            <button
              onClick={() => galleryRef.current?.click()}
              disabled={galleryUploading}
              className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors hover:bg-gray-50 cursor-pointer disabled:opacity-50"
              style={{ borderColor: "#D1D5DB", aspectRatio: "4/3" }}
            >
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "#F3F4F6" }}>
                {galleryUploading ? <Spinner /> : <UploadIcon />}
              </div>
              <p className="text-xs font-semibold" style={{ color: "#9CA3AF" }}>
                {galleryUploading ? "Uploading…" : "Add Photos"}
              </p>
            </button>
          </div>
          <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} />
          {profile.galleryImages.length === 0 && !galleryUploading && (
            <div className="text-center py-6 rounded-2xl mb-4" style={{ background: "#F9FAFB" }}>
              <p className="text-sm font-semibold" style={{ color: "#374151" }}>No photos yet</p>
              <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>Upload event photos to showcase your venue</p>
            </div>
          )}
          <p className="text-xs" style={{ color: "#9CA3AF" }}>
            {profile.galleryImages.length}/30 photos · JPG, PNG, WEBP
          </p>
        </Card>
      )}

      {/* Hall Drawer */}
      {hallDrawer.open && (
        <HallDrawer
          initial={hallDrawer.hall}
          onSave={saveHall}
          onClose={() => setHallDrawer({ open: false })}
          loading={hallSaving}
        />
      )}
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function SaveIcon()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>; }
function CheckIcon()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function EditIcon()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function TrashIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>; }
function PlusIcon()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function XIcon()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function EyeIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>; }
function UploadIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>; }
function Spinner()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>; }
