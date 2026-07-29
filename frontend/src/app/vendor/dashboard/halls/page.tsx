"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useStore } from "@/store/useStore";
import type { Hall, GalleryItem } from "@/lib/vendorData";

type Tab = "basic" | "about" | "halls" | "gallery";

const ALL_SERVICES  = ["Wedding","Engagement","Mehndi Night","Corporate Event","Birthday Party","Anniversary","Conference","Walima","Other"];
const ALL_AMENITIES = ["Free Parking","Valet Parking","In-house Catering","Full Decoration","AV & Sound System","Bridal Room","Prayer Area","Generator Backup","Air Conditioning","WiFi","Live Kitchen","Stage & Lighting","Photo Booth","Cold Storage"];

const INP  = "w-full px-5 py-4 rounded-2xl text-sm outline-none transition-all duration-200 border border-[#D1D5DB] focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-1";
const INP_S = { background: "var(--bg-subtle)", color: "var(--fg)" };

// ─── Small helpers ────────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-semibold mb-2" style={{ color: "#374151" }}>{children}</label>;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl p-5 lg:p-6 border ${className}`} style={{ borderColor: "#E5E7EB" }}>
      {children}
    </div>
  );
}

function CardHead({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-base font-bold" style={{ color: "#111827" }}>{title}</h2>
      {subtitle && <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{subtitle}</p>}
    </div>
  );
}

function SaveBtn({ onClick, saved }: { onClick: () => void; saved: boolean }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold text-white transition-all"
      style={{ background: saved ? "#16A34A" : "var(--primary)" }}
    >
      {saved ? <><CheckIcon size={15}/> Saved</> : <><SaveIcon size={15}/> Save Changes</>}
    </button>
  );
}

// ─── Hall Modal ───────────────────────────────────────────────────────────────
function HallModal({ initial, onSave, onClose }: { initial?: Hall; onSave: (h: Hall) => void; onClose: () => void }) {
  const [form, setForm] = useState<Hall>(initial ?? { name: "", capacity: 0, price: 0, desc: "" });
  const f = (k: keyof Hall, v: string | number) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E5E7EB" }}>
          <h3 className="text-sm font-bold" style={{ color: "#111827" }}>{initial ? "Edit Hall" : "Add Hall"}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100" style={{ color: "#6B7280" }}><XIcon/></button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div>
            <Label>Hall Name</Label>
            <input className={INP} style={INP_S} value={form.name} onChange={e => f("name", e.target.value)} placeholder="e.g. Grand Hall" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Max Capacity</Label>
              <input className={INP} style={INP_S} type="number" value={form.capacity || ""} onChange={e => f("capacity", Number(e.target.value))} placeholder="500" />
            </div>
            <div>
              <Label>Price (Rs.)</Label>
              <input className={INP} style={INP_S} type="number" value={form.price || ""} onChange={e => f("price", Number(e.target.value))} placeholder="250000" />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <textarea className={INP} style={INP_S} rows={3} value={form.desc} onChange={e => f("desc", e.target.value)} placeholder="Describe this hall..." />
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl text-sm font-semibold border transition-colors hover:bg-gray-50" style={{ borderColor: "#E5E7EB", color: "#374151" }}>Cancel</button>
          <button onClick={() => { if (form.name.trim()) { onSave(form); onClose(); } }}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white" style={{ background: "var(--primary)" }}>
            {initial ? "Update Hall" : "Add Hall"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Gallery Image Upload ─────────────────────────────────────────────────────
function GalleryUploadItem({ item, onEdit, onDelete }: {
  item: GalleryItem & { imageUrl?: string };
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl border" style={{ borderColor: "#E5E7EB" }}>
      {item.imageUrl
        ? <img src={item.imageUrl} alt={item.label} className="w-14 h-14 rounded-xl object-cover shrink-0" />
        : <div className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center text-xl" style={{ background: item.gradient }}>{item.icon}</div>
      }
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "#111827" }}>{item.label}</p>
        {item.sublabel && <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>{item.sublabel}</p>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onEdit} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 transition-colors" style={{ color: "#2563EB" }}><EditIcon size={14}/></button>
        <button onClick={onDelete} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors" style={{ color: "#EF4444" }}><TrashIcon size={14}/></button>
      </div>
    </div>
  );
}

// ─── Gallery Modal ────────────────────────────────────────────────────────────
function GalleryModal({ initial, onSave, onClose }: {
  initial?: GalleryItem;
  onSave: (g: GalleryItem) => void;
  onClose: () => void;
}) {
  const [title, setTitle]    = useState(initial?.label ?? "");
  const [imgUrl, setImgUrl]  = useState(initial?.imageUrl ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setImgUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleSave() {
    if (!title.trim() || !imgUrl) return;
    onSave({
      label: title,
      sublabel: "",
      gradient: "linear-gradient(135deg,#FF3B6B,#FF8FA3)",
      icon: "📷",
      imageUrl: imgUrl,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E5E7EB" }}>
          <h3 className="text-sm font-bold" style={{ color: "#111827" }}>{initial ? "Edit Photo" : "Add Photo"}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100" style={{ color: "#6B7280" }}><XIcon/></button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          {/* Image Upload Zone */}
          <div>
            <Label>Photo</Label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            {imgUrl
              ? (
                <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                  <img src={imgUrl} alt="preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => { setImgUrl(""); if (fileRef.current) fileRef.current.value = ""; }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white"
                    style={{ background: "rgba(0,0,0,0.55)" }}
                  ><XIcon size={13}/></button>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute bottom-2 right-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
                    style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
                  >
                    <UploadIcon size={12}/> Change
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors hover:bg-gray-50"
                  style={{ borderColor: "#D1D5DB", height: 140 }}
                >
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "#F3F4F6" }}>
                    <UploadIcon size={18} color="#9CA3AF" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold" style={{ color: "#374151" }}>Click to upload photo</p>
                    <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>JPG, PNG, WEBP</p>
                  </div>
                </button>
              )
            }
          </div>
          {/* Title */}
          <div>
            <Label>Title</Label>
            <input className={INP} style={INP_S} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Wedding Reception" />
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl text-sm font-semibold border hover:bg-gray-50 transition-colors" style={{ borderColor: "#E5E7EB", color: "#374151" }}>Cancel</button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || !imgUrl}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
            style={{ background: "var(--primary)" }}
          >{initial ? "Update" : "Add Photo"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HallManagementPage() {
  const { vendorProfile, updateVendorProfile } = useStore();
  const [tab, setTab]   = useState<Tab>("basic");
  const [saved, setSaved] = useState<Tab | null>(null);

  const [basic, setBasic] = useState({
    name:        vendorProfile.name,
    tagline:     vendorProfile.tagline,
    phone:       vendorProfile.phone,
    email:       vendorProfile.email,
    whatsapp:    vendorProfile.whatsapp,
    location:    vendorProfile.location,
    established: vendorProfile.established,
  });
  const [about,     setAbout]     = useState(vendorProfile.about);
  const [services,  setServices]  = useState<string[]>(vendorProfile.services);
  const [amenities, setAmenities] = useState<string[]>(vendorProfile.amenities);
  const [halls,     setHalls]     = useState<Hall[]>(vendorProfile.halls);
  const [gallery,   setGallery]   = useState<GalleryItem[]>(vendorProfile.gallery);
  const [hallModal,    setHallModal]    = useState<{ open: boolean; editIdx?: number }>({ open: false });
  const [galleryModal, setGalleryModal] = useState<{ open: boolean; editIdx?: number }>({ open: false });

  function flash(t: Tab) { setSaved(t); setTimeout(() => setSaved(null), 2000); }

  function saveBasic()   { updateVendorProfile({ ...basic, established: Number(basic.established) }); flash("basic"); }
  function saveAbout()   { updateVendorProfile({ about, services, amenities }); flash("about"); }
  function saveHalls()   { updateVendorProfile({ halls }); flash("halls"); }
  function saveGallery() { updateVendorProfile({ gallery }); flash("gallery"); }

  const TABS: { key: Tab; label: string }[] = [
    { key: "basic",   label: "Basic Info" },
    { key: "about",   label: "About" },
    { key: "halls",   label: `Halls (${halls.length})` },
    { key: "gallery", label: `Gallery (${gallery.length})` },
  ];

  return (
    <div className="p-4 lg:p-6 min-h-screen" style={{ background: "var(--bg-subtle, #F4F4F5)" }}>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#111827" }}>Hall Management</h1>
          <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>Edit your public profile page</p>
        </div>
        <Link
          href="/profile"
          target="_blank"
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold border transition-colors hover:bg-white shrink-0"
          style={{ borderColor: "#E5E7EB", color: "#374151", background: "#fff" }}
        >
          <EyeIcon size={15}/> Preview Profile
        </Link>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 rounded-2xl mb-5 overflow-x-auto" style={{ background: "#E5E7EB" }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 min-w-fit px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap"
            style={{
              background: tab === t.key ? "#ffffff" : "transparent",
              color: tab === t.key ? "#111827" : "#6B7280",
              boxShadow: tab === t.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* ── Basic Info ── */}
      {tab === "basic" && (
        <Card>
          <CardHead title="Basic Information" subtitle="Core details shown at the top of your profile" />
          <div className="flex flex-col gap-4 max-w-2xl">
            <div>
              <Label>Business Name</Label>
              <input className={INP} style={INP_S} value={basic.name} onChange={e => setBasic(b => ({ ...b, name: e.target.value }))} placeholder="Royal Banquet Hall" />
            </div>
            <div>
              <Label>Tagline</Label>
              <input className={INP} style={INP_S} value={basic.tagline} onChange={e => setBasic(b => ({ ...b, tagline: e.target.value }))} placeholder="Where Every Moment Becomes a Memory" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Phone Number</Label>
                <input className={INP} style={INP_S} value={basic.phone} onChange={e => setBasic(b => ({ ...b, phone: e.target.value }))} placeholder="0300-1234567" />
              </div>
              <div>
                <Label>WhatsApp Number</Label>
                <input className={INP} style={INP_S} value={basic.whatsapp} onChange={e => setBasic(b => ({ ...b, whatsapp: e.target.value }))} placeholder="923001234567" />
              </div>
            </div>
            <div>
              <Label>Email Address</Label>
              <input className={INP} style={INP_S} value={basic.email} onChange={e => setBasic(b => ({ ...b, email: e.target.value }))} placeholder="info@yourvenue.pk" />
            </div>
            <div>
              <Label>Location / Address</Label>
              <input className={INP} style={INP_S} value={basic.location} onChange={e => setBasic(b => ({ ...b, location: e.target.value }))} placeholder="Gulshan-e-Iqbal, Block 13, Karachi" />
            </div>
            <div>
              <Label>Established Year</Label>
              <input className={INP} style={INP_S} type="number" value={basic.established || ""} onChange={e => setBasic(b => ({ ...b, established: Number(e.target.value) }))} placeholder="2010" />
            </div>
            <div className="flex justify-end pt-2">
              <SaveBtn onClick={saveBasic} saved={saved === "basic"} />
            </div>
          </div>
        </Card>
      )}

      {/* ── About ── */}
      {tab === "about" && (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHead title="Business Description" subtitle="Shown in the About section of your profile" />
            <textarea
              className={INP}
              style={INP_S}
              rows={6}
              value={about}
              onChange={e => setAbout(e.target.value)}
              placeholder="Tell clients about your venue..."
            />
          </Card>

          <Card>
            <CardHead title="Services Offered" subtitle="Event types your venue caters to" />
            <div className="flex flex-wrap gap-2">
              {ALL_SERVICES.map(s => {
                const on = services.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => setServices(p => on ? p.filter(x => x !== s) : [...p, s])}
                    className="px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all"
                    style={{ background: on ? "#FFF0F4" : "#F9FAFB", borderColor: on ? "var(--primary)" : "#E5E7EB", color: on ? "var(--primary)" : "#6B7280" }}
                  >{s}</button>
                );
              })}
            </div>
          </Card>

          <Card>
            <CardHead title="Amenities & Facilities" subtitle="Features available at your venue" />
            <div className="flex flex-wrap gap-2">
              {ALL_AMENITIES.map(a => {
                const on = amenities.includes(a);
                return (
                  <button
                    key={a}
                    onClick={() => setAmenities(p => on ? p.filter(x => x !== a) : [...p, a])}
                    className="px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all"
                    style={{ background: on ? "#FFF0F4" : "#F9FAFB", borderColor: on ? "var(--primary)" : "#E5E7EB", color: on ? "var(--primary)" : "#6B7280" }}
                  >{a}</button>
                );
              })}
            </div>
          </Card>

          <div className="flex justify-end">
            <SaveBtn onClick={saveAbout} saved={saved === "about"} />
          </div>
        </div>
      )}

      {/* ── Halls ── */}
      {tab === "halls" && (
        <Card>
          <CardHead title="Halls & Pricing" subtitle="Add and manage your venue's halls" />
          <div className="flex flex-col gap-3 mb-4">
            {halls.length === 0 && (
              <div className="py-12 text-center rounded-2xl" style={{ background: "#F9FAFB" }}>
                <p className="text-sm font-semibold" style={{ color: "#374151" }}>No halls added yet</p>
                <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>Click "Add Hall" to get started</p>
              </div>
            )}
            {halls.map((h, i) => (
              <div key={i} className="flex items-start justify-between gap-3 p-4 rounded-2xl border" style={{ borderColor: "#F3F4F6", background: "#FAFAFA" }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: "#111827" }}>{h.name}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs" style={{ color: "#6B7280" }}>Up to {h.capacity.toLocaleString()} guests</span>
                    <span className="text-xs font-bold" style={{ color: "var(--primary)" }}>Rs. {h.price.toLocaleString()}</span>
                  </div>
                  {h.desc && <p className="text-xs mt-1.5 line-clamp-2" style={{ color: "#9CA3AF" }}>{h.desc}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setHallModal({ open: true, editIdx: i })} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-blue-50 transition-colors" style={{ color: "#2563EB" }}><EditIcon size={14}/></button>
                  <button onClick={() => setHalls(p => p.filter((_, j) => j !== i))} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-50 transition-colors" style={{ color: "#EF4444" }}><TrashIcon size={14}/></button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setHallModal({ open: true })}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold border-2 border-dashed transition-colors hover:bg-gray-50"
              style={{ borderColor: "#D1D5DB", color: "#374151" }}
            ><PlusIcon size={15}/> Add Hall</button>
            <SaveBtn onClick={saveHalls} saved={saved === "halls"} />
          </div>
        </Card>
      )}

      {/* ── Gallery ── */}
      {tab === "gallery" && (
        <Card>
          <CardHead title="Gallery Photos" subtitle="Upload event photos shown on your profile" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {gallery.map((g, i) => (
              <div key={i} className="relative group rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
                {g.imageUrl
                  ? <img src={g.imageUrl} alt={g.label} className="w-full h-full object-cover" />
                  : <div className="w-full h-full" style={{ background: g.gradient }} />
                }
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)" }} />
                <p className="absolute bottom-2 left-2 right-2 text-white text-xs font-semibold truncate">{g.label}</p>
                {/* Actions on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button onClick={() => setGalleryModal({ open: true, editIdx: i })} className="w-8 h-8 bg-white rounded-xl flex items-center justify-center transition-transform hover:scale-110" style={{ color: "#2563EB" }}><EditIcon size={13}/></button>
                  <button onClick={() => setGallery(p => p.filter((_, j) => j !== i))} className="w-8 h-8 bg-white rounded-xl flex items-center justify-center transition-transform hover:scale-110" style={{ color: "#EF4444" }}><TrashIcon size={13}/></button>
                </div>
              </div>
            ))}

            {/* Add new photo tile */}
            <button
              onClick={() => setGalleryModal({ open: true })}
              className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors hover:bg-gray-50"
              style={{ borderColor: "#D1D5DB", aspectRatio: "4/3" }}
            >
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "#F3F4F6" }}>
                <PlusIcon size={18} color="#9CA3AF" />
              </div>
              <p className="text-xs font-semibold" style={{ color: "#9CA3AF" }}>Add Photo</p>
            </button>
          </div>
          <div className="flex justify-end">
            <SaveBtn onClick={saveGallery} saved={saved === "gallery"} />
          </div>
        </Card>
      )}

      {/* Modals */}
      {hallModal.open && (
        <HallModal
          initial={hallModal.editIdx !== undefined ? halls[hallModal.editIdx] : undefined}
          onSave={h => hallModal.editIdx !== undefined ? setHalls(p => p.map((x, i) => i === hallModal.editIdx ? h : x)) : setHalls(p => [...p, h])}
          onClose={() => setHallModal({ open: false })}
        />
      )}
      {galleryModal.open && (
        <GalleryModal
          initial={galleryModal.editIdx !== undefined ? gallery[galleryModal.editIdx] : undefined}
          onSave={g => galleryModal.editIdx !== undefined ? setGallery(p => p.map((x, i) => i === galleryModal.editIdx ? g : x)) : setGallery(p => [...p, g])}
          onClose={() => setGalleryModal({ open: false })}
        />
      )}
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function SaveIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
}
function CheckIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
function EditIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
function TrashIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
}
function PlusIcon({ size = 16, color }: { size?: number; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? "currentColor"} strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
function XIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
function EyeIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}
function UploadIcon({ size = 16, color }: { size?: number; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>;
}
