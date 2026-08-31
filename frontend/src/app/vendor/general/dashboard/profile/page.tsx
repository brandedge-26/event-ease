"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";

const API_BASE  = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5510";

// Encode/decode "Name|Price" in the services string array
function encodeSvc(name: string, price: string) { return `${name.trim()}|${price.trim()}`; }
function decodeSvc(s: string) {
  const idx = s.lastIndexOf("|");
  if (idx === -1) return { name: s, price: "" };
  return { name: s.slice(0, idx), price: s.slice(idx + 1) };
}

const INP   = "w-full px-5 py-4 rounded-2xl text-base outline-none transition-all duration-200 border border-[#D1D5DB] focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-1";
const INP_S = { background: "var(--bg-subtle)", color: "var(--fg)" };

type Tab     = "basic" | "about" | "services" | "gallery" | "branches";
// Reuse halls API but treat each entry as a service (capacity=0)
type Service = { id: string; name: string; price: number; desc: string | null };

type ProfileData = {
  name: string; tagline: string; phone: string; whatsapp: string;
  city: string; area: string; address: string; about: string;
  established: number | null; logoUrl: string | null; galleryImages: string[];
  mapUrl: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-semibold mb-2" style={{ color: "#374151" }}>{children}</label>;
}
function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl p-4 sm:p-5 lg:p-6 border" style={{ borderColor: "#E5E7EB" }}>{children}</div>;
}
function CardHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4 sm:mb-5">
      <h2 className="text-sm sm:text-base font-bold" style={{ color: "#111827" }}>{title}</h2>
      {sub && <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{sub}</p>}
    </div>
  );
}

// ─── About Tab ───────────────────────────────────────────────────────────────
function AboutTab({ profile, setProfile, eventServices, setEventServices, amenities, setAmenities, saving, saved, tab, saveAbout }: {
  profile: { about: string };
  setProfile: (fn: (p: any) => any) => void;
  eventServices: string[];
  setEventServices: React.Dispatch<React.SetStateAction<string[]>>;
  amenities: string[];
  setAmenities: React.Dispatch<React.SetStateAction<string[]>>;
  saving: boolean;
  saved: string | null;
  tab: string;
  saveAbout: () => void;
}) {
  const INP_SM = "px-4 py-3 rounded-xl border text-sm outline-none w-full";
  const INP_ST = { background: "var(--bg-subtle)", borderColor: "#D1D5DB", color: "var(--fg)" };

  // Services offered (name + price)
  const [svcName,  setSvcName]  = useState("");
  const [svcPrice, setSvcPrice] = useState("");

  function addSvc() {
    if (!svcName.trim()) return;
    setEventServices(prev => [...prev, encodeSvc(svcName, svcPrice)]);
    setSvcName(""); setSvcPrice("");
  }
  function removeSvc(i: number) { setEventServices(prev => prev.filter((_, idx) => idx !== i)); }

  // Amenities (text only)
  const [amenInput, setAmenInput] = useState("");
  function addAmen() {
    const val = amenInput.trim();
    if (!val || amenities.includes(val)) return;
    setAmenities(prev => [...prev, val]);
    setAmenInput("");
  }
  function removeAmen(i: number) { setAmenities(prev => prev.filter((_, idx) => idx !== i)); }

  const isSaved = saved === tab;

  return (
    <div className="flex flex-col gap-4">
      {/* Description */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 lg:p-6 border" style={{ borderColor: "#E5E7EB" }}>
        <div className="mb-4 sm:mb-5">
          <h2 className="text-sm sm:text-base font-bold" style={{ color: "#111827" }}>Business Description</h2>
          <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>Shown in the About section of your profile</p>
        </div>
        <textarea
          className="w-full px-5 py-4 rounded-2xl text-base outline-none transition-all duration-200 border border-[#D1D5DB] focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-1"
          style={{ background: "var(--bg-subtle)", color: "var(--fg)", minHeight: 140 }}
          value={profile.about}
          onChange={e => setProfile((p: any) => ({ ...p, about: e.target.value }))}
          placeholder="Tell clients about your business, experience, and what makes you special..."
        />
      </div>

      {/* Services Offered — name + price inputs */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 lg:p-6 border" style={{ borderColor: "#E5E7EB" }}>
        <div className="mb-4">
          <h2 className="text-sm sm:text-base font-bold" style={{ color: "#111827" }}>Services Offered</h2>
          <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>What services do you provide and at what price</p>
        </div>
        {/* Add row */}
        <div className="flex items-end gap-2 mb-3">
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Service Name</label>
            <input value={svcName} onChange={e => setSvcName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSvc(); } }}
              placeholder="e.g. Wedding Photography"
              className={INP_SM} style={INP_ST} />
          </div>
          <div className="w-32 flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Price (Rs.)</label>
            <input type="number" value={svcPrice} onChange={e => setSvcPrice(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSvc(); } }}
              placeholder="0" min={0}
              className={INP_SM} style={INP_ST} />
          </div>
          <button type="button" onClick={addSvc} disabled={!svcName.trim()}
            className="flex items-center gap-1 px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-40 shrink-0"
            style={{ background: "var(--primary)", color: "#ffffff" }}>
            <PlusIcon /> Add
          </button>
        </div>
        {/* List */}
        {eventServices.length > 0 ? (
          <div className="flex flex-col rounded-2xl overflow-hidden" style={{ border: "1px solid #F4F4F5" }}>
            {eventServices.map((s, i) => {
              const { name, price } = decodeSvc(s);
              return (
                <div key={i} className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: i < eventServices.length - 1 ? "1px solid #F4F4F5" : "none" }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                      style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                      {i + 1}
                    </div>
                    <p className="text-sm font-semibold text-black truncate">{name}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    {price && <p className="text-sm font-bold" style={{ color: "var(--primary)" }}>Rs. {Number(price).toLocaleString("en-PK")}</p>}
                    <button type="button" onClick={() => removeSvc(i)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer hover:bg-red-50"
                      style={{ color: "#DC2626" }}>
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center py-5 text-center rounded-2xl" style={{ background: "var(--bg-subtle)" }}>
            <p className="text-sm font-medium text-black">No services added</p>
            <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>Add the services you offer with their pricing</p>
          </div>
        )}
      </div>

      {/* Amenities & Facilities — free-form text */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 lg:p-6 border" style={{ borderColor: "#E5E7EB" }}>
        <div className="mb-4">
          <h2 className="text-sm sm:text-base font-bold" style={{ color: "#111827" }}>Amenities & Facilities</h2>
          <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>Features and facilities you offer</p>
        </div>
        {/* Add row */}
        <div className="flex gap-2 mb-3">
          <input value={amenInput} onChange={e => setAmenInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addAmen(); } }}
            placeholder="e.g. Free Parking, WiFi, Equipment Provided…"
            className="flex-1 px-4 py-3 rounded-xl border text-sm outline-none"
            style={INP_ST} />
          <button type="button" onClick={addAmen} disabled={!amenInput.trim()}
            className="flex items-center gap-1 px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-40 shrink-0"
            style={{ background: "var(--primary)", color: "#ffffff" }}>
            <PlusIcon /> Add
          </button>
        </div>
        {/* Tags */}
        {amenities.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {amenities.map((a, i) => (
              <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold border"
                style={{ background: "#FFF0F4", borderColor: "var(--primary)", color: "var(--primary)" }}>
                {a}
                <button type="button" onClick={() => removeAmen(i)}
                  className="cursor-pointer hover:opacity-70 transition-opacity ml-0.5"
                  style={{ lineHeight: 1 }}>
                  <XSmIcon />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-5 text-center rounded-2xl" style={{ background: "var(--bg-subtle)" }}>
            <p className="text-sm font-medium text-black">No amenities added</p>
            <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>Add facilities you offer to clients</p>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button onClick={saveAbout} disabled={saving}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-60"
          style={{ background: isSaved ? "#16A34A" : "var(--primary)" }}>
          {isSaved ? <><CheckIcon /> Saved</> : saving ? "Saving…" : <><SaveIcon /> Save Changes</>}
        </button>
      </div>
    </div>
  );
}

// ─── Service Drawer ───────────────────────────────────────────────────────────
function ServiceDrawer({ initial, onSave, onClose, loading }: {
  initial?: Service;
  onSave: (data: Omit<Service, "id">) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({
    name:  initial?.name  ?? "",
    price: initial?.price ?? "",
    desc:  initial?.desc  ?? "",
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
          <p className="text-base font-bold text-black">{initial ? "Edit Service" : "Add Service"}</p>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 cursor-pointer" style={{ color: "#6B7280" }}><XIcon /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-3">
          <div>
            <Label>Service Name</Label>
            <input className={INP} style={INP_S} value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Photography, Decoration" />
          </div>
          <div>
            <Label>Price (Rs.)</Label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: "#9CA3AF" }}>Rs.</span>
              <input className={INP} style={{ ...INP_S, paddingLeft: "3rem" }} type="number" min="0"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="0" />
            </div>
          </div>
          <div>
            <Label>Description <span className="font-normal" style={{ color: "#9CA3AF" }}>(optional)</span></Label>
            <textarea className={INP} style={{ ...INP_S, height: 90 }}
              value={form.desc}
              onChange={e => setForm(f => ({ ...f, desc: e.target.value }))}
              placeholder="Brief description of this service..." />
          </div>
        </div>
        <div className="shrink-0 px-5 py-4 border-t flex gap-3" style={{ borderColor: "#F4F4F5" }}>
          <button onClick={onClose}
            className="px-5 py-3 rounded-2xl text-sm font-semibold cursor-pointer hover:opacity-70 transition-opacity"
            style={{ background: "var(--bg-subtle)", color: "var(--fg-muted)" }}>
            Cancel
          </button>
          <button
            onClick={() => {
              if (!form.name.trim() || !form.price) return;
              onSave({ name: form.name.trim(), price: Number(form.price), desc: form.desc.trim() || null });
            }}
            disabled={loading || !form.name.trim() || !form.price}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--primary)" }}>
            {loading ? "Saving…" : initial ? "Update Service" : "Add Service"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Branches Tab ─────────────────────────────────────────────────────────────
function BranchesTab({ accessToken }: { accessToken: string }) {
  const { branches, activeBranchId, setBranches, setBranch } = useAuthStore();
  const [adding,          setAdding]          = useState(false);
  const [editId,          setEditId]          = useState<string | null>(null);
  const [deleting,        setDeleting]        = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteError,     setDeleteError]     = useState("");
  const [saving,          setSaving]          = useState(false);
  const [form,     setForm]     = useState({ name: "", city: "", area: "", address: "" });
  const [editForm, setEditForm] = useState({ name: "", city: "", area: "", address: "" });

  async function handleAdd() {
    if (!form.name || !form.city || !form.area || !form.address) return;
    setSaving(true);
    try {
      const res = await api.post<{ branch: any }>("/api/vendor/branches", form, accessToken);
      if (res.success && res.branch) {
        const updated = [...branches, res.branch];
        setBranches(updated, activeBranchId ?? undefined);
      }
      setAdding(false);
      setForm({ name: "", city: "", area: "", address: "" });
    } finally { setSaving(false); }
  }

  async function handleEdit(id: string) {
    setSaving(true);
    try {
      const res = await api.patch<{ branch: any }>(`/api/vendor/branches/${id}`, editForm, accessToken);
      if (res.success && res.branch) {
        const updated = branches.map(b => b.id === id ? res.branch : b);
        setBranches(updated, activeBranchId ?? undefined);
      }
      setEditId(null);
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    setDeleteError("");
    try {
      const res = await api.delete<{ message?: string }>(`/api/vendor/branches/${id}`, accessToken);
      if (res.success) {
        // Re-fetch from server to ensure UI is in sync
        const fresh = await api.get<{ branches: any[] }>("/api/vendor/branches", accessToken);
        if (fresh.success && fresh.branches) {
          const newActive = id === activeBranchId
            ? (fresh.branches[0]?.id ?? null)
            : activeBranchId;
          setBranches(fresh.branches, newActive ?? undefined);
          if (newActive && newActive !== activeBranchId) setBranch(newActive);
        }
      } else {
        setDeleteError(res.message ?? "Failed to delete branch.");
      }
    } catch {
      setDeleteError("Something went wrong. Please try again.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #E5E7EB", background: "#fff" }}>
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#F3F4F6" }}>
        <div>
          <h2 className="text-sm font-bold" style={{ color: "#111827" }}>Your Branches</h2>
          <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>Manage your business locations</p>
        </div>
        <button
          onClick={() => { setAdding(true); setEditId(null); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer"
          style={{ background: "var(--primary)" }}
        >
          <PlusIcon /> Add Branch
        </button>
      </div>

      {/* Add Branch Form */}
      {adding && (
        <div className="px-5 py-4 border-b" style={{ borderColor: "#F3F4F6", background: "#FAFAFA" }}>
          <p className="text-xs font-semibold mb-3" style={{ color: "#374151" }}>New Branch Details</p>
          <div className="flex flex-col gap-2">
            <input className={INP} style={INP_S} placeholder="Branch name *" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <input className={INP} style={INP_S} placeholder="City *" value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
              <input className={INP} style={INP_S} placeholder="Area *" value={form.area}
                onChange={e => setForm(f => ({ ...f, area: e.target.value }))} />
            </div>
            <input className={INP} style={INP_S} placeholder="Address *" value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            <div className="flex gap-2 mt-1">
              <button onClick={() => setAdding(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                style={{ background: "#F3F4F6", color: "#374151" }}>
                Cancel
              </button>
              <button onClick={handleAdd} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer disabled:opacity-50"
                style={{ background: "var(--primary)" }}>
                {saving ? "Saving…" : "Save Branch"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete error */}
      {deleteError && (
        <div className="mx-5 mt-3 px-4 py-2.5 rounded-xl text-xs font-medium" style={{ background: "#FEE2E2", color: "#DC2626" }}>
          {deleteError}
        </div>
      )}

      {/* Branch List */}
      <div className="divide-y divide-[#F3F4F6]">
        {branches.length === 0 && (
          <div className="px-5 py-8 text-center">
            <p className="text-sm font-semibold" style={{ color: "#374151" }}>No branches yet</p>
            <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>Add your first branch above</p>
          </div>
        )}
        {branches.map(branch => (
          <div key={branch.id} className="px-5 py-4">
            {editId === branch.id ? (
              <div className="flex flex-col gap-2">
                <input className={INP} style={INP_S} placeholder="Branch name" value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                <div className="grid grid-cols-2 gap-2">
                  <input className={INP} style={INP_S} placeholder="City" value={editForm.city}
                    onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} />
                  <input className={INP} style={INP_S} placeholder="Area" value={editForm.area}
                    onChange={e => setEditForm(f => ({ ...f, area: e.target.value }))} />
                </div>
                <input className={INP} style={INP_S} placeholder="Address" value={editForm.address}
                  onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} />
                <div className="flex gap-2 mt-1">
                  <button onClick={() => setEditId(null)}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold cursor-pointer"
                    style={{ background: "#F3F4F6", color: "#374151" }}>Cancel</button>
                  <button onClick={() => handleEdit(branch.id)} disabled={saving}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer disabled:opacity-50"
                    style={{ background: "var(--primary)" }}>
                    {saving ? "Saving…" : "Update"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-2 shrink-0"
                    style={{ background: branch.id === activeBranchId ? "var(--primary)" : "#D1D5DB" }} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: "#111827" }}>{branch.name}</span>
                      {branch.isDefault && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#F0FDF4", color: "#16A34A" }}>Default</span>
                      )}
                      {branch.id === activeBranchId && !branch.isDefault && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#FFF1F3", color: "var(--primary)" }}>Active</span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{branch.city} · {branch.area}</p>
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>{branch.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {confirmDeleteId === branch.id ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
                      <span className="text-xs font-medium mr-1" style={{ color: "#DC2626" }}>Delete?</span>
                      <button
                        onClick={() => { handleDelete(branch.id); setConfirmDeleteId(null); }}
                        disabled={deleting === branch.id}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white cursor-pointer disabled:opacity-50"
                        style={{ background: "#DC2626" }}>
                        {deleting === branch.id ? "…" : "Yes"}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer"
                        style={{ background: "#F3F4F6", color: "#374151" }}>
                        No
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => { setEditId(branch.id); setEditForm({ name: branch.name, city: branch.city, area: branch.area, address: branch.address }); setAdding(false); setConfirmDeleteId(null); }}
                        className="p-2 rounded-xl cursor-pointer transition-colors hover:bg-gray-100"
                        style={{ color: "#6B7280" }}>
                        <EditIcon />
                      </button>
                      {branches.length > 1 && (
                        <button
                          onClick={() => setConfirmDeleteId(branch.id)}
                          className="p-2 rounded-xl cursor-pointer transition-colors hover:bg-red-50"
                          style={{ color: "#EF4444" }}>
                          <TrashIcon />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
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

  const [profile, setProfile] = useState<ProfileData>({
    name: "", tagline: "", phone: "", whatsapp: "",
    city: "", area: "", address: "", about: "",
    established: null, logoUrl: null, galleryImages: [], mapUrl: "",
  });
  const [eventServices, setEventServices] = useState<string[]>([]);
  const [amenities,     setAmenities]     = useState<string[]>([]);
  const [services,      setServices]      = useState<Service[]>([]);

  const [svcDrawer,  setSvcDrawer]  = useState<{ open: boolean; svc?: Service }>({ open: false });
  const [svcSaving,  setSvcSaving]  = useState(false);

  const logoRef    = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [logoUploading,    setLogoUploading]    = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    loadProfile();
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadProfile() {
    setLoading(true);
    try {
      // halls endpoint reused for services
      const res = await api.get<{ vendor: any; halls: any[] }>("/api/vendor/profile/me", accessToken!);
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
          mapUrl:        v.mapUrl        ?? "",
        });
        setEventServices(v.services   ?? []);
        setAmenities(v.amenities ?? []);
        // halls used as service entries (capacity field ignored)
        setServices((res.halls ?? []).map((h: any) => ({ id: h.id, name: h.name, price: h.price, desc: h.desc ?? null })));
      }
    } finally { setLoading(false); }
  }

  function flash(t: Tab) { setSaved(t); setTimeout(() => setSaved(null), 2500); }

  async function saveBasic() {
    setSaving(true); setError("");
    try {
      const res = await api.patch("/api/vendor/profile/me", {
        name: profile.name, tagline: profile.tagline, phone: profile.phone,
        whatsapp: profile.whatsapp, city: profile.city, area: profile.area,
        address: profile.address, established: profile.established,
        mapUrl: profile.mapUrl || null,
      }, accessToken!);
      if (res.success) flash("basic"); else setError((res as any).message ?? "Failed to save.");
    } finally { setSaving(false); }
  }

  async function saveAbout() {
    setSaving(true); setError("");
    try {
      const res = await api.patch("/api/vendor/profile/me", { about: profile.about, services: eventServices, amenities }, accessToken!);
      if (res.success) flash("about"); else setError((res as any).message ?? "Failed to save.");
    } finally { setSaving(false); }
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true); setError("");
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
      else setError(data.message ?? "Logo upload failed.");
    } catch { setError("Network error uploading logo."); }
    finally { setLogoUploading(false); if (logoRef.current) logoRef.current.value = ""; }
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setGalleryUploading(true); setError("");
    try {
      const fd = new FormData();
      files.forEach(f => fd.append("images", f));
      const res = await fetch(`${API_BASE}/api/vendor/upload/gallery`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: fd,
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.galleryImages)) {
        setProfile(p => ({ ...p, galleryImages: data.galleryImages }));
      } else { setError(data.message ?? "Upload failed."); }
    } catch { setError("Network error."); }
    finally { setGalleryUploading(false); if (galleryRef.current) galleryRef.current.value = ""; }
  }

  async function deleteGalleryImage(url: string) {
    const updated = profile.galleryImages.filter(u => u !== url);
    setProfile(p => ({ ...p, galleryImages: updated }));
    await api.patch("/api/vendor/profile/me", { galleryImages: updated }, accessToken!);
  }

  // ── Service CRUD (uses halls API, capacity=0) ─────────────────────────────
  async function saveService(data: Omit<Service, "id">) {
    setSvcSaving(true);
    try {
      const payload = { name: data.name, price: data.price, capacity: 0, desc: data.desc };
      if (svcDrawer.svc) {
        const res = await fetch(`${API_BASE}/api/vendor/halls/${svcDrawer.svc.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
          setServices(prev => prev.map(s => s.id === svcDrawer.svc!.id ? { ...s, ...data } : s));
          setSvcDrawer({ open: false });
        }
      } else {
        const res = await fetch(`${API_BASE}/api/vendor/halls`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
          setServices(prev => [...prev, { id: json.hall.id, name: data.name, price: data.price, desc: data.desc }]);
          setSvcDrawer({ open: false });
        }
      }
    } finally { setSvcSaving(false); }
  }

  async function deleteService(id: string) {
    if (!confirm("Delete this service?")) return;
    const res = await fetch(`${API_BASE}/api/vendor/halls/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const json = await res.json();
    if (json.success) setServices(prev => prev.filter(s => s.id !== id));
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const TABS: { key: Tab; label: string }[] = [
    { key: "basic",    label: "Basic Info" },
    { key: "about",    label: "About" },
    { key: "services", label: `Services (${services.length})` },
    { key: "gallery",  label: `Gallery (${profile.galleryImages.length})` },
    { key: "branches", label: "Branches" },
  ];

  function SaveBtn({ onClick }: { onClick: () => void }) {
    const isSaved = saved === tab;
    return (
      <button onClick={onClick} disabled={saving}
        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-60"
        style={{ background: isSaved ? "#16A34A" : "var(--primary)" }}>
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
      <div className="flex items-start justify-between gap-3 mb-5 sm:mb-6">
        <div>
          <h1 className="text-lg sm:text-xl font-bold" style={{ color: "#111827" }}>Manage Profile</h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: "#6B7280" }}>Edit your public profile page</p>
        </div>
        {authVendor?.slug && (
          <a href={`/profile/${authVendor.slug}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-semibold border transition-colors hover:bg-white shrink-0"
            style={{ borderColor: "#E5E7EB", color: "#374151", background: "#fff" }}>
            <EyeIcon />
            <span className="hidden sm:inline">Preview Profile</span>
          </a>
        )}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "#FEE2E2", color: "#B91C1C" }}>
          {error}
        </div>
      )}

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 rounded-2xl mb-4 sm:mb-5 overflow-x-auto scrollbar-hide" style={{ background: "#E5E7EB" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="shrink-0 flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer"
            style={{
              background: tab === t.key ? "#fff" : "transparent",
              color:      tab === t.key ? "#111827" : "#6B7280",
              boxShadow:  tab === t.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Basic Info ── */}
      {tab === "basic" && (
        <Card>
          <CardHead title="Basic Information" sub="Core details shown at the top of your profile" />
          <div className="flex flex-col gap-4 max-w-2xl">
            <div>
              <Label>Logo / Profile Photo</Label>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shrink-0 overflow-hidden flex items-center justify-center font-black text-white text-xl sm:text-2xl"
                  style={{ background: "linear-gradient(135deg,#FF3B6B,#FF8FA3)" }}>
                  {profile.logoUrl
                    ? <img src={profile.logoUrl} alt="logo" className="w-full h-full object-cover" />
                    : (profile.name[0] ?? "?")}
                </div>
                <div>
                  <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  <button onClick={() => logoRef.current?.click()} disabled={logoUploading}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-colors hover:bg-gray-50 cursor-pointer disabled:opacity-50"
                    style={{ borderColor: "#D1D5DB", color: "#374151" }}>
                    <UploadIcon /> {logoUploading ? "Uploading…" : "Change Logo"}
                  </button>
                  <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>JPG, PNG, WEBP — max 5MB</p>
                </div>
              </div>
            </div>
            <div>
              <Label>Business Name</Label>
              <input className={INP} style={INP_S} value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="The Memory Keeper" />
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
            <div>
              <Label>Google Maps Embed URL</Label>
              <input className={INP} style={INP_S}
                value={profile.mapUrl}
                onChange={e => {
                  let val = e.target.value;
                  const match = val.match(/src="([^"]+)"/);
                  if (match) val = match[1];
                  setProfile(p => ({ ...p, mapUrl: val }));
                }}
                placeholder="https://www.google.com/maps/embed?pb=…" />
              <p className="text-xs mt-1.5" style={{ color: "#9CA3AF" }}>Google Maps → Share → Embed a map → copy & paste the full iframe code or just the URL.</p>
            </div>
            <div className="flex justify-end pt-2">
              <div className="w-full sm:w-auto"><SaveBtn onClick={saveBasic} /></div>
            </div>
          </div>
        </Card>
      )}

      {/* ── About ── */}
      {tab === "about" && (
        <AboutTab
          profile={profile} setProfile={setProfile}
          eventServices={eventServices} setEventServices={setEventServices}
          amenities={amenities} setAmenities={setAmenities}
          saving={saving} saved={saved} tab={tab} saveAbout={saveAbout}
        />
      )}

      {/* ── Services ── */}
      {tab === "services" && (
        <Card>
          <CardHead title="Services & Pricing" sub="List the services you offer and their starting prices" />
          <div className="flex flex-col gap-3 mb-4">
            {services.length === 0 && (
              <div className="py-12 text-center rounded-2xl" style={{ background: "#F9FAFB" }}>
                <p className="text-sm font-semibold" style={{ color: "#374151" }}>No services added yet</p>
                <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>Click "Add Service" to list what you offer</p>
              </div>
            )}
            {services.map(s => (
              <div key={s.id} className="flex items-start justify-between gap-3 p-3 sm:p-4 rounded-2xl border" style={{ borderColor: "#F3F4F6", background: "#FAFAFA" }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: "#111827" }}>{s.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold" style={{ color: "var(--primary)" }}>Rs. {s.price.toLocaleString("en-PK")}</span>
                  </div>
                  {s.desc && <p className="text-xs mt-1.5 line-clamp-2" style={{ color: "#9CA3AF" }}>{s.desc}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setSvcDrawer({ open: true, svc: s })}
                    className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-blue-50 transition-colors cursor-pointer" style={{ color: "#2563EB" }}>
                    <EditIcon />
                  </button>
                  <button onClick={() => deleteService(s.id)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-red-50 transition-colors cursor-pointer" style={{ color: "#EF4444" }}>
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setSvcDrawer({ open: true })}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold border-2 border-dashed transition-colors hover:bg-gray-50 cursor-pointer"
            style={{ borderColor: "#D1D5DB", color: "#374151" }}>
            <PlusIcon /> Add Service
          </button>
        </Card>
      )}

      {/* ── Gallery ── */}
      {tab === "gallery" && (
        <Card>
          <CardHead title="Work & Portfolio" sub="Showcase your work — upload photos of past projects and events" />
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "#FEE2E2", color: "#B91C1C" }}>
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {profile.galleryImages.map((url, i) => (
              <div key={i} className="relative group rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
                <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                <button onClick={() => deleteGalleryImage(url)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  style={{ background: "#EF4444", color: "#fff" }}>
                  <TrashIcon />
                </button>
              </div>
            ))}
            <button onClick={() => galleryRef.current?.click()} disabled={galleryUploading}
              className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors hover:bg-gray-50 cursor-pointer disabled:opacity-50"
              style={{ borderColor: "#D1D5DB", aspectRatio: "4/3" }}>
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
            <div className="text-center py-4 sm:py-6 rounded-2xl mb-3 sm:mb-4" style={{ background: "#F9FAFB" }}>
              <p className="text-sm font-semibold" style={{ color: "#374151" }}>No photos yet</p>
              <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>Upload your work photos to showcase your portfolio</p>
            </div>
          )}
          <p className="text-xs" style={{ color: "#9CA3AF" }}>{profile.galleryImages.length}/30 photos · JPG, PNG, WEBP</p>
        </Card>
      )}

      {/* ── Branches ── */}
      {tab === "branches" && (
        <BranchesTab accessToken={accessToken!} />
      )}

      {/* Service Drawer */}
      {svcDrawer.open && (
        <ServiceDrawer
          initial={svcDrawer.svc}
          onSave={saveService}
          onClose={() => setSvcDrawer({ open: false })}
          loading={svcSaving}
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
function XSmIcon()    { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function XIcon()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function EyeIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>; }
function UploadIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>; }
function Spinner()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>; }
