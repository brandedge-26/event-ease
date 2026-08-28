"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
type StaffRole = "Manager" | "Waiter" | "Chef" | "Security" | "Cleaner" | "Decorator" | "DJ" | "Receptionist" | "Photographer" | "Driver" | "Other";
type StaffStatus = "active" | "on-leave" | "inactive";

type StaffMember = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  department: string;
  salary: number;
  joinDate: string;
  status: StaffStatus;
  address: string;
  notes: string;
  avatarColor: string;
  avatarUrl: string;
};

type FormState = Omit<StaffMember, "id">;

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

const ROLES: StaffRole[] = ["Manager", "Receptionist", "Chef", "Waiter", "Decorator", "Photographer", "DJ", "Security", "Cleaner", "Driver", "Other"];

const DEPARTMENTS: Record<StaffRole, string> = {
  Manager: "Operations", Receptionist: "Front Desk", Chef: "Kitchen",
  Waiter: "Service", Decorator: "Events", Photographer: "Events",
  DJ: "Events", Security: "Security", Cleaner: "Housekeeping",
  Driver: "Transport", Other: "General",
};

const AVATAR_COLORS = [
  "#E0E7FF", "#FCE7F3", "#D1FAE5", "#FEF3C7",
  "#EDE9FE", "#CFFAFE", "#FEE2E2", "#F3F4F6",
];

const ROLE_COLOR: Record<StaffRole, { bg: string; color: string }> = {
  Manager:      { bg: "#EFF6FF", color: "#2563EB" },
  Receptionist: { bg: "#F5F3FF", color: "#7C3AED" },
  Chef:         { bg: "#FFF7ED", color: "#EA580C" },
  Waiter:       { bg: "#F0FDF4", color: "#16A34A" },
  Decorator:    { bg: "#FFF0F4", color: "#FF3B6B" },
  Photographer: { bg: "#FFFBEB", color: "#D97706" },
  DJ:           { bg: "#F0FDFA", color: "#0D9488" },
  Security:     { bg: "#F9FAFB", color: "#374151" },
  Cleaner:      { bg: "#F0FDF4", color: "#15803D" },
  Driver:       { bg: "#EFF6FF", color: "#1D4ED8" },
  Other:        { bg: "#F9FAFB", color: "#6B7280" },
};

const STATUS_CFG: Record<StaffStatus, { label: string; bg: string; color: string }> = {
  "active":   { label: "Active",   bg: "#F0FDF4", color: "#16A34A" },
  "on-leave": { label: "On Leave", bg: "#FFFBEB", color: "#D97706" },
  "inactive": { label: "Inactive", bg: "#F9FAFB", color: "#9CA3AF" },
};

const EMPTY_FORM: FormState = {
  name: "", email: "", phone: "", role: "Waiter",
  department: "Service", salary: 0, joinDate: "",
  status: "active", address: "", notes: "", avatarColor: AVATAR_COLORS[0], avatarUrl: "",
};

const INP = "w-full px-4 py-3 rounded-xl text-sm outline-none border border-[#D1D5DB] focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-1";
const INP_S = { background: "var(--bg-subtle)", color: "var(--fg)" };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function initials(name: string) {
  return name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
}
function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}
function fmtSalary(n: number) {
  return n > 0 ? "Rs. " + n.toLocaleString("en-PK") : "—";
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ member, size = "sm" }: { member: Pick<StaffMember, "name" | "avatarColor" | "avatarUrl">; size?: "sm" | "md" | "lg" }) {
  const ini = initials(member.name);
  const cls = size === "lg" ? "w-16 h-16 text-xl rounded-2xl" : size === "md" ? "w-11 h-11 text-base rounded-xl" : "w-9 h-9 text-sm rounded-xl";
  if (member.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={member.avatarUrl} alt={member.name} className={`${cls} object-cover shrink-0`} />
    );
  }
  return (
    <div className={`${cls} flex items-center justify-center font-bold shrink-0`}
      style={{ background: member.avatarColor || AVATAR_COLORS[0], color: "#1F2937" }}>
      {ini}
    </div>
  );
}

// ─── Staff Form Overlay ───────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5510";

function StaffFormOverlay({
  mode, initial, saving, onClose, onSave,
}: {
  mode: "add" | "edit";
  initial: FormState;
  saving: boolean;
  onClose: () => void;
  onSave: (f: FormState) => void;
}) {
  const { accessToken } = useAuthStore();
  const [form, setForm]           = useState<FormState>(initial);
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [avatarFile, setAvatarFile]       = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(initial.avatarUrl || "");
  const [uploading, setUploading]         = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function f(key: keyof FormState, val: string | number) {
    setForm(p => ({ ...p, [key]: val }));
  }

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function removePhoto() {
    setAvatarFile(null);
    setAvatarPreview("");
    setForm(p => ({ ...p, avatarUrl: "" }));
    if (fileRef.current) fileRef.current.value = "";
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim())  e.name     = "Name is required";
    if (!form.phone.trim()) e.phone    = "Phone is required";
    if (!form.joinDate)     e.joinDate = "Join date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    let avatarUrl = form.avatarUrl;

    // Upload new photo if one was picked
    if (avatarFile) {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("avatar", avatarFile);
        const res = await fetch(`${API_BASE}/api/vendor/upload/staff-avatar`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: "include",
          body: fd,
        });
        const json = await res.json();
        if (json.success) avatarUrl = json.avatarUrl;
      } finally {
        setUploading(false);
      }
    }

    onSave({ ...form, avatarUrl });
  }

  const displaySrc = avatarPreview;
  const isBusy = saving || uploading;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed z-50 bottom-0 left-0 right-0 rounded-t-3xl bg-white flex flex-col overflow-hidden max-h-[92dvh] lg:bottom-0 lg:left-auto lg:right-0 lg:top-0 lg:w-[480px] lg:rounded-none lg:rounded-l-3xl lg:max-h-full"
        style={{ boxShadow: "0 -4px 40px rgba(0,0,0,0.14)" }}>

        {/* Drag handle mobile */}
        <div className="flex justify-center pt-3 pb-1 lg:hidden shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "#E5E7EB" }} />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 shrink-0" style={{ borderBottom: "1px solid #F4F4F5" }}>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 cursor-pointer" style={{ color: "var(--fg-muted)" }}>
            <XIcon />
          </button>
          <span className="text-sm font-bold text-black">{mode === "add" ? "Add Staff Member" : "Edit Staff Member"}</span>
        </div>

        {/* Photo + color picker */}
        <div className="px-5 py-4 shrink-0 flex items-center gap-4" style={{ borderBottom: "1px solid #F4F4F5" }}>
          {/* Avatar preview */}
          <div className="relative shrink-0">
            {displaySrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={displaySrc} alt="avatar" className="w-16 h-16 rounded-2xl object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold"
                style={{ background: form.avatarColor, color: "#1F2937" }}>
                {initials(form.name) || "?"}
              </div>
            )}
            {/* Remove photo button */}
            {displaySrc && (
              <button onClick={removePhoto}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center bg-white shadow cursor-pointer"
                style={{ border: "1px solid #E5E7EB", color: "#6B7280" }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold mb-1" style={{ color: "var(--fg-muted)" }}>
              {displaySrc ? "Photo uploaded" : "Profile Photo"}
            </p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFilePick} />
            <button type="button" onClick={() => fileRef.current?.click()}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer hover:bg-gray-50 mb-2"
              style={{ border: "1px solid #E5E7EB", color: "#374151" }}>
              {displaySrc ? "Change Photo" : "Upload Photo"}
            </button>
            {!displaySrc && (
              <>
                <p className="text-[10px] mb-1.5" style={{ color: "var(--fg-muted)" }}>Or pick a color:</p>
                <div className="flex gap-2 flex-wrap">
                  {AVATAR_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => f("avatarColor", c)}
                      className="w-6 h-6 rounded-lg cursor-pointer transition-transform hover:scale-110 shrink-0"
                      style={{
                        background: c,
                        border: form.avatarColor === c ? "2.5px solid var(--primary)" : "2px solid #E5E7EB",
                      }} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Fields */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 flex flex-col gap-3">
          <div>
            <input value={form.name} onChange={e => f("name", e.target.value)}
              placeholder="Full Name *" className={INP}
              style={{ ...INP_S, borderColor: errors.name ? "#DC2626" : "#D1D5DB" }} />
            {errors.name && <p className="text-xs mt-1" style={{ color: "#DC2626" }}>{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select value={form.role}
              onChange={e => setForm(p => ({ ...p, role: e.target.value as StaffRole, department: DEPARTMENTS[e.target.value as StaffRole] }))}
              className={INP} style={INP_S}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={form.status}
              onChange={e => setForm(p => ({ ...p, status: e.target.value as StaffStatus }))}
              className={INP} style={INP_S}>
              <option value="active">Active</option>
              <option value="on-leave">On Leave</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <input value={form.phone} onChange={e => f("phone", e.target.value)}
                placeholder="Phone *" className={INP}
                style={{ ...INP_S, borderColor: errors.phone ? "#DC2626" : "#D1D5DB" }} />
              {errors.phone && <p className="text-xs mt-1" style={{ color: "#DC2626" }}>{errors.phone}</p>}
            </div>
            <input type="email" value={form.email} onChange={e => f("email", e.target.value)}
              placeholder="Email" className={INP} style={INP_S} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: "var(--fg-muted)" }}>Rs.</span>
              <input type="number" min={0} value={form.salary || ""}
                onChange={e => f("salary", Number(e.target.value))}
                placeholder="Salary" className={`${INP} pl-11`} style={INP_S} />
            </div>
            <div>
              <input type="date" value={form.joinDate} onChange={e => f("joinDate", e.target.value)}
                className={INP} style={{ ...INP_S, borderColor: errors.joinDate ? "#DC2626" : "#D1D5DB" }} />
              {errors.joinDate && <p className="text-xs mt-1" style={{ color: "#DC2626" }}>{errors.joinDate}</p>}
            </div>
          </div>

          <input value={form.address} onChange={e => f("address", e.target.value)}
            placeholder="Address" className={INP} style={INP_S} />

          <textarea value={form.notes} onChange={e => f("notes", e.target.value)}
            rows={3} placeholder="Notes (optional)"
            className={`${INP} resize-none`} style={{ ...INP_S, minHeight: "72px" }} />
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-4" style={{ borderTop: "1px solid #F4F4F5" }}>
          <div className="flex gap-2.5">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer hover:opacity-80"
              style={{ background: "var(--bg-subtle)", color: "var(--fg)" }}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={isBusy}
              className="flex-1 py-3 rounded-2xl text-sm font-bold cursor-pointer hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: "var(--primary)", color: "#fff" }}>
              {isBusy && <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
              {uploading ? "Uploading…" : saving ? "Saving…" : mode === "add" ? "Add Member" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Staff Detail Overlay ─────────────────────────────────────────────────────
function StaffDetailOverlay({
  member, onClose, onEdit, onDelete,
}: {
  member: StaffMember;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const role   = ROLE_COLOR[member.role] ?? { bg: "#F9FAFB", color: "#6B7280" };
  const status = STATUS_CFG[member.status];

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed z-50 bottom-0 left-0 right-0 rounded-t-3xl bg-white flex flex-col overflow-hidden max-h-[92dvh] lg:bottom-0 lg:left-auto lg:right-0 lg:top-0 lg:w-[480px] lg:rounded-none lg:rounded-l-3xl lg:max-h-full"
        style={{ boxShadow: "0 -4px 40px rgba(0,0,0,0.14)" }}>

        {/* Drag handle mobile */}
        <div className="flex justify-center pt-3 pb-1 lg:hidden shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "#E5E7EB" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: "1px solid #F4F4F5" }}>
          <div className="flex items-center gap-2.5">
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 cursor-pointer" style={{ color: "var(--fg-muted)" }}>
              <XIcon />
            </button>
            <span className="text-sm font-bold text-black">Staff Profile</span>
          </div>
          <div className="flex gap-2">
            <button onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer hover:bg-gray-50"
              style={{ border: "1px solid #E5E7EB", color: "var(--fg-muted)" }}>
              <EditIcon /> Edit
            </button>
            <button onClick={onDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer hover:bg-red-50"
              style={{ color: "#DC2626" }}>
              <TrashIcon color="#DC2626" /> Remove
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* Profile hero */}
          <div className="px-5 py-5" style={{ borderBottom: "1px solid #F4F4F5" }}>
            <div className="flex items-center gap-4 mb-5">
              <Avatar member={member} size="lg" />
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-black leading-tight truncate">{member.name}</h2>
                <p className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>{member.department}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: role.bg, color: role.color }}>{member.role}</span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: status.bg, color: status.color }}>{status.label}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl p-3.5" style={{ background: "var(--bg-subtle)", border: "1px solid #F0F0F0" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>Monthly Salary</p>
                <p className="text-base font-bold text-black">{fmtSalary(member.salary)}</p>
              </div>
              <div className="rounded-2xl p-3.5" style={{ background: "var(--bg-subtle)", border: "1px solid #F0F0F0" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>Joined</p>
                <p className="text-base font-bold text-black">{fmtDate(member.joinDate)}</p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="px-5 py-4 flex flex-col gap-2.5" style={{ borderBottom: member.notes ? "1px solid #F4F4F5" : "none" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Contact</p>
            {[
              { icon: <PhoneIcon />, label: "Phone",   value: member.phone,   href: member.phone ? `tel:${member.phone}` : undefined },
              { icon: <MailIcon />,  label: "Email",   value: member.email,   href: member.email ? `mailto:${member.email}` : undefined },
              { icon: <PinIcon />,   label: "Address", value: member.address, href: undefined },
            ].filter(r => r.value).map(row => (
              <div key={row.label} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl" style={{ background: "var(--bg-subtle)", border: "1px solid #F0F0F0" }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#E5E7EB", color: "#6B7280" }}>{row.icon}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>{row.label}</p>
                  {row.href
                    ? <a href={row.href} className="text-sm font-medium text-black hover:underline truncate block">{row.value}</a>
                    : <p className="text-sm font-medium text-black truncate">{row.value}</p>}
                </div>
              </div>
            ))}
          </div>

          {member.notes && (
            <div className="px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#9CA3AF" }}>Notes</p>
              <p className="text-sm leading-relaxed p-3 rounded-2xl" style={{ background: "var(--bg-subtle)", color: "var(--fg-muted)" }}>{member.notes}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StaffPage() {
  const { accessToken } = useAuthStore();

  const [staff, setStaff]           = useState<StaffMember[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);

  const [formOpen, setFormOpen]         = useState(false);
  const [formMode, setFormMode]         = useState<"add" | "edit">("add");
  const [formInitial, setFormInitial]   = useState<FormState>(EMPTY_FORM);
  const [editId, setEditId]             = useState<string | null>(null);

  const [detailMember, setDetailMember] = useState<StaffMember | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);

  const [filterStatus, setFilterStatus] = useState<StaffStatus | "All">("All");
  const [search, setSearch]             = useState("");
  const [page, setPage]                 = useState(1);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    api.get<{ staff: StaffMember[] }>("/api/vendor/staff", accessToken)
      .then(res => { if (res.success) setStaff(res.staff ?? []); })
      .finally(() => setLoading(false));
  }, [accessToken]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const filtered = staff.filter(s => {
    if (filterStatus !== "All" && s.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!s.name.toLowerCase().includes(q) && !s.role.toLowerCase().includes(q) && !s.phone.includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function changeSearch(v: string) { setSearch(v); setPage(1); }
  function changeFilter(v: StaffStatus | "All") { setFilterStatus(v); setPage(1); }

  const activeCount  = staff.filter(s => s.status === "active").length;
  const leaveCount   = staff.filter(s => s.status === "on-leave").length;
  const totalPayroll = staff.filter(s => s.status !== "inactive").reduce((a, s) => a + (s.salary || 0), 0);

  // ── Handlers ───────────────────────────────────────────────────────────────
  function openAdd() {
    const color = AVATAR_COLORS[staff.length % AVATAR_COLORS.length];
    setFormInitial({ ...EMPTY_FORM, avatarColor: color });
    setFormMode("add");
    setEditId(null);
    setFormOpen(true);
  }

  function openEdit(s: StaffMember) {
    setFormInitial({ name: s.name, email: s.email, phone: s.phone, role: s.role, department: s.department, salary: s.salary, joinDate: s.joinDate, status: s.status, address: s.address, notes: s.notes, avatarColor: s.avatarColor, avatarUrl: s.avatarUrl || "" });
    setFormMode("edit");
    setEditId(s.id);
    setDetailMember(null);
    setFormOpen(true);
  }

  async function handleSave(f: FormState) {
    setSaving(true);
    try {
      const payload = { ...f, department: DEPARTMENTS[f.role] };

      if (formMode === "add") {
        const res = await api.post<{ id: string }>("/api/vendor/staff", payload, accessToken ?? undefined);
        if (res.success && res.id) {
          setStaff(prev => [{ ...payload, id: res.id }, ...prev]);
          setFormOpen(false);
        }
      } else if (formMode === "edit" && editId) {
        const res = await api.patch(`/api/vendor/staff/${editId}`, payload, accessToken ?? undefined);
        if (res.success) {
          setStaff(prev => prev.map(s => s.id === editId ? { ...s, ...payload } : s));
          // update detail view if open
          if (detailMember?.id === editId) setDetailMember(prev => prev ? { ...prev, ...payload } : prev);
          setFormOpen(false);
        }
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(member: StaffMember) {
    setStaff(prev => prev.filter(s => s.id !== member.id));
    setDeleteTarget(null);
    setDetailMember(null);
    await api.delete(`/api/vendor/staff/${member.id}`, accessToken ?? undefined);
  }

  return (
    <>
      {/* Form overlay */}
      {formOpen && (
        <StaffFormOverlay
          mode={formMode}
          initial={formInitial}
          saving={saving}
          onClose={() => setFormOpen(false)}
          onSave={handleSave}
        />
      )}

      {/* Detail overlay */}
      {detailMember && (
        <StaffDetailOverlay
          member={staff.find(s => s.id === detailMember.id) ?? detailMember}
          onClose={() => setDetailMember(null)}
          onEdit={() => openEdit(staff.find(s => s.id === detailMember.id) ?? detailMember)}
          onDelete={() => setDeleteTarget(staff.find(s => s.id === detailMember.id) ?? detailMember)}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="fixed z-[60] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl p-6 w-[320px] shadow-2xl">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#FEF2F2" }}>
              <TrashIcon size={20} color="#DC2626" />
            </div>
            <p className="text-base font-bold text-black text-center">Remove Staff Member?</p>
            <p className="text-sm text-center mt-1 mb-5" style={{ color: "var(--fg-muted)" }}>
              <span className="font-semibold text-black">{deleteTarget.name}</span> will be permanently removed.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer"
                style={{ background: "var(--bg-subtle)", color: "var(--fg)" }}>Cancel</button>
              <button onClick={() => handleDelete(deleteTarget)}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer"
                style={{ background: "#DC2626", color: "#fff" }}>Remove</button>
            </div>
          </div>
        </>
      )}

      <div className="p-4 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl lg:text-2xl font-semibold text-black tracking-tight">Staff</h1>
            <p className="text-sm mt-1" style={{ color: "var(--fg-muted)" }}>Manage your team members</p>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90"
            style={{ background: "var(--primary)", color: "#fff" }}>
            <PlusIcon /> Add Staff
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Staff",     value: staff.length,   clr: "#111" },
            { label: "Active",          value: activeCount,    clr: "#16A34A" },
            { label: "On Leave",        value: leaveCount,     clr: "#D97706" },
            { label: "Monthly Payroll", value: totalPayroll > 0 ? `Rs. ${(totalPayroll / 1000).toFixed(0)}K` : "—", clr: "var(--primary)" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-2xl font-bold" style={{ color: s.clr }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs + Search */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          <div className="flex border-b overflow-x-auto" style={{ borderColor: "#F4F4F5" }}>
            {(["All", "active", "on-leave", "inactive"] as (StaffStatus | "All")[]).map(s => {
              const label = s === "All" ? "All" : STATUS_CFG[s as StaffStatus].label;
              const count = s === "All" ? staff.length : staff.filter(m => m.status === s).length;
              const active = filterStatus === s;
              return (
                <button key={s} onClick={() => changeFilter(s)}
                  className="flex-1 min-w-fit py-3 px-3 text-sm font-medium cursor-pointer relative whitespace-nowrap"
                  style={{ color: active ? "var(--primary)" : "var(--fg-muted)" }}>
                  {label}
                  <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full" style={{
                    background: active ? "var(--primary-light)" : "var(--bg-subtle)",
                    color: active ? "var(--primary)" : "var(--fg-muted)",
                  }}>{count}</span>
                  {active && <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full" style={{ background: "var(--primary)" }} />}
                </button>
              );
            })}
          </div>
          <div className="px-4 py-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--fg-subtle)" }}><SearchIcon /></span>
              <input value={search} onChange={e => changeSearch(e.target.value)}
                placeholder="Search name, role, phone..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none border"
                style={{ background: "var(--bg-subtle)", borderColor: "#E5E7EB", color: "var(--fg)" }} />
            </div>
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5 animate-pulse" style={{ borderBottom: "1px solid #F9FAFB" }}>
                  <div className="w-9 h-9 rounded-xl bg-gray-200 shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 w-36 rounded bg-gray-200 mb-1.5" />
                    <div className="h-3 w-24 rounded bg-gray-100" />
                  </div>
                  <div className="h-6 w-16 rounded-full bg-gray-100" />
                </div>
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: "#F3F4F6" }}>
                <TeamIcon />
              </div>
              <p className="text-sm font-medium text-black mb-1">No staff found</p>
              <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                {staff.length === 0 ? "Add your first staff member" : "Try adjusting the filter or search"}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="lg:hidden flex flex-col divide-y" style={{ borderColor: "#F4F4F5" }}>
                {paginated.map(member => {
                  const role   = ROLE_COLOR[member.role] ?? { bg: "#F9FAFB", color: "#6B7280" };
                  const status = STATUS_CFG[member.status];
                  return (
                    <div key={member.id} className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setDetailMember(member)}>
                      <Avatar member={member} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <p className="text-sm font-semibold text-black truncate">{member.name}</p>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                            style={{ background: role.bg, color: role.color }}>{member.role}</span>
                        </div>
                        <p className="text-xs truncate" style={{ color: "var(--fg-muted)" }}>
                          {member.phone || member.email || member.department}
                          {member.salary > 0 ? ` · ${fmtSalary(member.salary)}` : ""}
                        </p>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                        style={{ background: status.bg, color: status.color }}>{status.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #F4F4F5" }}>
                      {["Staff Member", "Role", "Status", "Phone", "Salary", "Joined", ""].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "#9CA3AF" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((member, idx) => {
                      const role   = ROLE_COLOR[member.role] ?? { bg: "#F9FAFB", color: "#6B7280" };
                      const status = STATUS_CFG[member.status];
                      return (
                        <tr key={member.id}
                          className="cursor-pointer hover:bg-gray-50 transition-colors"
                          style={{ borderBottom: idx < paginated.length - 1 ? "1px solid #F9FAFB" : "none" }}
                          onClick={() => setDetailMember(member)}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar member={member} size="sm" />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-black truncate">{member.name}</p>
                                <p className="text-xs truncate" style={{ color: "var(--fg-muted)" }}>{member.email || member.department}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                              style={{ background: role.bg, color: role.color }}>{member.role}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                              style={{ background: status.bg, color: status.color }}>{status.label}</span>
                          </td>
                          <td className="px-4 py-3 text-sm" style={{ color: "var(--fg-muted)" }}>{member.phone || "—"}</td>
                          <td className="px-4 py-3 text-sm font-medium text-black">{fmtSalary(member.salary)}</td>
                          <td className="px-4 py-3 text-sm" style={{ color: "var(--fg-muted)" }}>{fmtDate(member.joinDate)}</td>
                          <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-1 justify-end">
                              <button onClick={() => setDetailMember(member)} title="View"
                                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-blue-50 transition-colors"
                                style={{ color: "#2563EB" }}><EyeIcon /></button>
                              <button onClick={() => openEdit(member)} title="Edit"
                                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-amber-50 transition-colors"
                                style={{ color: "#D97706" }}><EditIcon /></button>
                              <button onClick={() => setDeleteTarget(member)} title="Remove"
                                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
                                style={{ color: "#DC2626" }}><TrashIcon /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid #F4F4F5" }}>
              <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-30 hover:bg-gray-100"
                  style={{ color: "var(--fg-muted)" }}><ChevLeftIcon /></button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button key={n} onClick={() => setPage(n)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold cursor-pointer"
                    style={{ background: safePage === n ? "var(--primary)" : "transparent", color: safePage === n ? "#fff" : "var(--fg-muted)" }}>
                    {n}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-30 hover:bg-gray-100"
                  style={{ color: "var(--fg-muted)" }}><ChevRightIcon /></button>
              </div>
            </div>
          )}

          {!loading && totalPages <= 1 && filtered.length > 0 && (
            <div className="px-4 py-3 text-xs" style={{ color: "#9CA3AF", borderTop: "1px solid #F4F4F5" }}>
              {filtered.length} member{filtered.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function PlusIcon()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function XIcon()      { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function EyeIcon()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>; }
function EditIcon()   { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function TrashIcon({ size = 13, color = "currentColor" }: { size?: number; color?: string }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>; }
function SearchIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; }
function TeamIcon()   { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>; }
function PhoneIcon()  { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .84h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.64a16 16 0 006.29 6.29l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>; }
function MailIcon()   { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>; }
function PinIcon()    { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>; }
function ChevLeftIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>; }
function ChevRightIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>; }
