"use client";

import { useRef, useState } from "react";
import { useStore, StaffMember, StaffRole, StaffStatus, STAFF_AVATAR_COLORS } from "@/store/useStore";

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLES: StaffRole[] = ["Manager", "Receptionist", "Chef", "Waiter", "Decorator", "Photographer", "DJ", "Security", "Cleaner", "Driver", "Other"];

const DEPARTMENTS: Record<StaffRole, string> = {
  Manager: "Operations", Receptionist: "Front Desk", Chef: "Kitchen",
  Waiter: "Service", Decorator: "Events", Photographer: "Events",
  DJ: "Events", Security: "Security", Cleaner: "Housekeeping",
  Driver: "Transport", Other: "General",
};

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

const EMPTY_FORM: Omit<StaffMember, "id"> = {
  name: "", email: "", phone: "", role: "Waiter",
  department: "Service", salary: 0, joinDate: "",
  status: "active", address: "", notes: "",
  avatarColor: STAFF_AVATAR_COLORS[0], avatarUrl: "",
};

const INP = "w-full px-5 py-4 rounded-2xl text-sm outline-none transition-all duration-200 border border-[#D1D5DB] focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-1";
const INP_STYLE = { background: "var(--bg-subtle)", color: "var(--fg)" };

type DrawerMode = "detail" | "add" | "edit" | null;

// ─── Avatar component ─────────────────────────────────────────────────────────
function Avatar({ member, size = "sm" }: { member: Pick<StaffMember, "name" | "avatarColor" | "avatarUrl">; size?: "sm" | "md" | "lg" }) {
  const initials = member.name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
  const dim = size === "lg" ? "w-16 h-16 text-xl rounded-2xl" : size === "md" ? "w-12 h-12 text-base rounded-xl" : "w-9 h-9 text-xs rounded-xl";

  if (member.avatarUrl) {
    return (
      <div className={`${dim} overflow-hidden shrink-0`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className={`${dim} flex items-center justify-center font-bold shrink-0`}
      style={{ background: member.avatarColor, color: "#1F2937" }}>
      {initials}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function StaffPage() {
  const { staff, addStaff, updateStaff, deleteStaff } = useStore();

  const [drawerMode, setDrawerMode]           = useState<DrawerMode>(null);
  const [selectedId, setSelectedId]           = useState<string | null>(null);
  const [filterStatus, setFilterStatus]       = useState<StaffStatus | "All">("All");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [form, setForm]                       = useState<Omit<StaffMember, "id">>(EMPTY_FORM);
  const [errors, setErrors]                   = useState<Record<string, string>>({});
  const [search, setSearch]                   = useState("");

  const selected = selectedId ? staff.find(s => s.id === selectedId) ?? null : null;

  const visible = staff.filter(s => {
    if (filterStatus !== "All" && s.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!s.name.toLowerCase().includes(q) && !s.role.toLowerCase().includes(q) && !s.phone.includes(q)) return false;
    }
    return true;
  });

  const activeCount = staff.filter(s => s.status === "active").length;
  const leaveCount  = staff.filter(s => s.status === "on-leave").length;
  const totalSalary = staff.filter(s => s.status !== "inactive").reduce((a, s) => a + s.salary, 0);

  function openAdd() {
    const c = STAFF_AVATAR_COLORS[staff.length % STAFF_AVATAR_COLORS.length];
    setForm({ ...EMPTY_FORM, avatarColor: c });
    setErrors({});
    setSelectedId(null);
    setDrawerMode("add");
  }
  function openEdit(s: StaffMember) {
    setForm({ name: s.name, email: s.email, phone: s.phone, role: s.role, department: s.department, salary: s.salary, joinDate: s.joinDate, status: s.status, address: s.address, notes: s.notes, avatarColor: s.avatarColor, avatarUrl: s.avatarUrl ?? "" });
    setErrors({});
    setSelectedId(s.id);
    setDrawerMode("edit");
  }
  function openDetail(s: StaffMember) { setSelectedId(s.id); setDrawerMode("detail"); }
  function closeDrawer() { setDrawerMode(null); setSelectedId(null); }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim())  e.name     = "Name required";
    if (!form.phone.trim()) e.phone    = "Phone required";
    if (!form.joinDate)     e.joinDate = "Join date required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    if (drawerMode === "add") {
      addStaff({ ...form, department: DEPARTMENTS[form.role], id: `STF-${Date.now()}` });
    } else if (drawerMode === "edit" && selectedId) {
      updateStaff({ ...form, department: DEPARTMENTS[form.role], id: selectedId });
    }
    closeDrawer();
  }

  function handleDelete(id: string) {
    deleteStaff(id);
    setDeleteConfirmId(null);
    if (selectedId === id) closeDrawer();
  }

  const drawerOpen = drawerMode !== null;

  return (
    <div className="p-4 lg:p-6 min-h-screen" style={{ background: "var(--bg-subtle, #F4F4F5)" }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-black">Staff</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>Manage your team members</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: "var(--primary)", color: "#fff" }}>
          <PlusIcon /> Add Staff
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Staff",     value: staff.length },
          { label: "Active",          value: activeCount },
          { label: "On Leave",        value: leaveCount },
          { label: "Monthly Payroll", value: totalSalary > 0 ? `${(totalSalary / 1000).toFixed(0)}K` : "0" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl px-4 py-4" style={{ border: "1px solid #F0F0F0" }}>
            <p className="text-xl font-bold text-black">{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }}><SearchIcon /></span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, role, phone..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-white outline-none"
            style={{ border: "1.5px solid #E5E7EB" }} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(["All", "active", "on-leave", "inactive"] as (StaffStatus | "All")[]).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className="px-3.5 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors"
              style={filterStatus === s
                ? { background: "#111", color: "#fff" }
                : { background: "#fff", color: "var(--fg-muted)", border: "1px solid #E5E7EB" }}>
              {s === "All" ? "All" : STATUS_CFG[s as StaffStatus].label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #F0F0F0" }}>
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: "#F3F4F6" }}>
              <TeamIcon />
            </div>
            <p className="text-sm font-medium text-black mb-1">No staff found</p>
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>Adjust filters or add a new staff member</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr style={{ borderBottom: "1px solid #F4F4F5" }}>
                  {["Staff Member", "Role", "Status", "Phone", "Salary", "Joined", ""].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "#9CA3AF" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((member, idx) => {
                  const role   = ROLE_COLOR[member.role];
                  const status = STATUS_CFG[member.status];
                  return (
                    <tr key={member.id}
                      className="transition-colors hover:bg-gray-50 cursor-pointer"
                      style={{ borderBottom: idx < visible.length - 1 ? "1px solid #F9FAFB" : "none" }}
                      onClick={() => openDetail(member)}>

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

                      <td className="px-4 py-3 text-sm" style={{ color: "var(--fg-muted)" }}>{member.phone}</td>

                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-black">
                          {member.salary > 0 ? `Rs. ${member.salary.toLocaleString("en-PK")}` : "—"}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-sm" style={{ color: "var(--fg-muted)" }}>
                        {member.joinDate ? new Date(member.joinDate).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>

                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => openDetail(member)} title="View"
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-blue-50 transition-colors"
                            style={{ color: "#2563EB" }}><EyeIcon /></button>
                          <button onClick={() => openEdit(member)} title="Edit"
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                            style={{ color: "var(--fg-muted)" }}><EditIcon /></button>
                          <button onClick={() => setDeleteConfirmId(member.id)} title="Remove"
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
        )}
        {visible.length > 0 && (
          <div className="px-4 py-3 text-xs" style={{ color: "#9CA3AF", borderTop: "1px solid #F4F4F5" }}>
            Showing {visible.length} of {staff.length} members
          </div>
        )}
      </div>

      {/* Delete Confirm */}
      {deleteConfirmId && (
        <>
          <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="fixed z-60 inset-0 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: "#FEF2F2" }}>
                <TrashIcon color="#DC2626" />
              </div>
              <p className="text-base font-bold text-black mb-1">Remove Staff Member?</p>
              <p className="text-sm mb-5" style={{ color: "var(--fg-muted)" }}>
                &ldquo;{staff.find(s => s.id === deleteConfirmId)?.name}&rdquo; will be permanently removed.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
                  style={{ border: "1px solid #E5E7EB", color: "var(--fg-muted)" }}>Cancel</button>
                <button onClick={() => handleDelete(deleteConfirmId)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "#DC2626" }}>Remove</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Backdrop */}
      {drawerOpen && <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={closeDrawer} />}

      {/* Drawer */}
      {drawerOpen && (
        <>
          <div className="lg:hidden fixed z-50 bottom-0 left-0 right-0 rounded-t-3xl bg-white flex flex-col overflow-hidden"
            style={{ maxHeight: "92dvh", boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}>
            <DrawerInner mode={drawerMode!} member={selected} form={form} setForm={setForm} errors={errors}
              onSave={handleSave} onEdit={() => selected && openEdit(selected)}
              onDelete={() => selected && setDeleteConfirmId(selected.id)} onClose={closeDrawer} />
          </div>
          <div className="hidden lg:flex fixed z-50 right-0 top-0 bottom-0 w-[480px] bg-white flex-col overflow-hidden rounded-l-3xl"
            style={{ boxShadow: "-4px 0 40px rgba(0,0,0,0.12)" }}>
            <DrawerInner mode={drawerMode!} member={selected} form={form} setForm={setForm} errors={errors}
              onSave={handleSave} onEdit={() => selected && openEdit(selected)}
              onDelete={() => selected && setDeleteConfirmId(selected.id)} onClose={closeDrawer} />
          </div>
        </>
      )}
    </div>
  );
}

// ─── Drawer Router ────────────────────────────────────────────────────────────
function DrawerInner(p: {
  mode: DrawerMode; member: StaffMember | null;
  form: Omit<StaffMember, "id">; setForm: React.Dispatch<React.SetStateAction<Omit<StaffMember, "id">>>;
  errors: Record<string, string>;
  onSave: () => void; onEdit: () => void; onDelete: () => void; onClose: () => void;
}) {
  if (p.mode === "detail" && p.member)
    return <StaffDetail member={p.member} onEdit={p.onEdit} onDelete={p.onDelete} onClose={p.onClose} />;
  return <StaffForm mode={p.mode === "add" ? "add" : "edit"} form={p.form} setForm={p.setForm}
    errors={p.errors} onSave={p.onSave} onClose={p.onClose} />;
}

// ─── Detail ───────────────────────────────────────────────────────────────────
function StaffDetail({ member, onEdit, onDelete, onClose }: {
  member: StaffMember; onEdit: () => void; onDelete: () => void; onClose: () => void;
}) {
  const role   = ROLE_COLOR[member.role];
  const status = STATUS_CFG[member.status];

  return (
    <>
      <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0" style={{ borderBottom: "1px solid #F4F4F5" }}>
        <div className="flex items-center gap-2.5">
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors" style={{ color: "var(--fg-muted)" }}><CloseIcon /></button>
          <span className="text-sm font-semibold text-black">Staff Profile</span>
        </div>
        <div className="flex gap-2">
          <button onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border hover:bg-gray-50 transition-colors"
            style={{ border: "1px solid #E5E7EB", color: "var(--fg-muted)" }}>
            <EditIcon /> Edit
          </button>
          <button onClick={onDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-50 transition-colors"
            style={{ color: "#DC2626" }}>
            <TrashIcon color="#DC2626" /> Remove
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Profile hero */}
        <div className="px-5 py-5" style={{ borderBottom: "1px solid #F4F4F5" }}>
          <div className="flex items-center gap-4 mb-5">
            <Avatar member={member} size="lg" />
            <div>
              <h2 className="text-lg font-bold text-black leading-tight">{member.name}</h2>
              <p className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>{member.department}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: role.bg, color: role.color }}>{member.role}</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: status.bg, color: status.color }}>{status.label}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3.5" style={{ background: "#F9FAFB", border: "1px solid #F0F0F0" }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>Monthly Salary</p>
              <p className="text-base font-bold text-black">{member.salary > 0 ? `Rs. ${member.salary.toLocaleString("en-PK")}` : "—"}</p>
            </div>
            <div className="rounded-xl p-3.5" style={{ background: "#F9FAFB", border: "1px solid #F0F0F0" }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>Joined</p>
              <p className="text-base font-bold text-black">
                {member.joinDate ? new Date(member.joinDate).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="px-5 py-4 space-y-2.5" style={{ borderBottom: member.notes ? "1px solid #F4F4F5" : "none" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "#9CA3AF" }}>Contact</p>
          {[
            { icon: <PhoneIcon />, label: "Phone",   value: member.phone,   href: `tel:${member.phone}` },
            { icon: <MailIcon />,  label: "Email",   value: member.email,   href: member.email ? `mailto:${member.email}` : undefined },
            { icon: <PinIcon />,   label: "Address", value: member.address, href: undefined },
          ].filter(r => r.value).map(row => (
            <div key={row.label} className="flex items-center gap-3 px-3.5 py-3 rounded-xl" style={{ background: "#F9FAFB" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#EFEFEF", color: "#6B7280" }}>{row.icon}</div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>{row.label}</p>
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
            <p className="text-sm leading-relaxed" style={{ color: "var(--fg-muted)" }}>{member.notes}</p>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Form ─────────────────────────────────────────────────────────────────────
function StaffForm({ mode, form, setForm, errors, onSave, onClose }: {
  mode: "add" | "edit";
  form: Omit<StaffMember, "id">;
  setForm: React.Dispatch<React.SetStateAction<Omit<StaffMember, "id">>>;
  errors: Record<string, string>;
  onSave: () => void;
  onClose: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  function f(key: keyof Omit<StaffMember, "id" | "role" | "status" | "avatarColor" | "avatarUrl">, val: string | number) {
    setForm(p => ({ ...p, [key]: val }));
  }

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setForm(p => ({ ...p, avatarUrl: ev.target?.result as string }));
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setForm(p => ({ ...p, avatarUrl: "" }));
    if (fileRef.current) fileRef.current.value = "";
  }

  const initials = form.name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 shrink-0" style={{ borderBottom: "1px solid #F4F4F5" }}>
        <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors" style={{ color: "var(--fg-muted)" }}>
          <CloseIcon />
        </button>
        <span className="text-sm font-semibold text-black">{mode === "add" ? "Add Staff Member" : "Edit Staff Member"}</span>
      </div>

      {/* Avatar upload section */}
      <div className="px-5 py-4 shrink-0 flex items-center gap-4" style={{ borderBottom: "1px solid #F4F4F5" }}>
        {/* Preview */}
        <div className="relative shrink-0">
          {form.avatarUrl ? (
            <div className="w-16 h-16 rounded-2xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold"
              style={{ background: form.avatarColor, color: "#1F2937" }}>
              {initials}
            </div>
          )}
          {/* Remove photo button */}
          {form.avatarUrl && (
            <button onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center bg-white shadow"
              style={{ border: "1px solid #E5E7EB", color: "#6B7280" }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-black mb-1">Profile Photo</p>
          <p className="text-xs mb-2.5" style={{ color: "var(--fg-muted)" }}>
            {form.avatarUrl ? "Photo uploaded" : "No photo — initials will show"}
          </p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
          <button onClick={() => fileRef.current?.click()}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors hover:bg-gray-50"
            style={{ border: "1px solid #E5E7EB", color: "#374151" }}>
            {form.avatarUrl ? "Change Photo" : "Upload Photo"}
          </button>
        </div>
      </div>

      {/* Form fields */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">

        <input value={form.name} onChange={e => f("name", e.target.value)}
          placeholder="Full Name *"
          className={INP} style={{ ...INP_STYLE, borderColor: errors.name ? "#DC2626" : undefined }} />
        {errors.name && <p className="text-xs -mt-1.5" style={{ color: "#DC2626" }}>{errors.name}</p>}

        <div className="grid grid-cols-2 gap-3">
          <select value={form.role}
            onChange={e => setForm(p => ({ ...p, role: e.target.value as StaffRole, department: DEPARTMENTS[e.target.value as StaffRole] }))}
            className={INP} style={INP_STYLE}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={form.status}
            onChange={e => setForm(p => ({ ...p, status: e.target.value as StaffStatus }))}
            className={INP} style={INP_STYLE}>
            <option value="active">Active</option>
            <option value="on-leave">On Leave</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <input value={form.phone} onChange={e => f("phone", e.target.value)}
              placeholder="Phone *"
              className={INP} style={{ ...INP_STYLE, borderColor: errors.phone ? "#DC2626" : undefined }} />
            {errors.phone && <p className="text-xs mt-1" style={{ color: "#DC2626" }}>{errors.phone}</p>}
          </div>
          <input type="email" value={form.email} onChange={e => f("email", e.target.value)}
            placeholder="Email" className={INP} style={INP_STYLE} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input type="number" min={0} value={form.salary || ""} onChange={e => f("salary", Number(e.target.value))}
            placeholder="Salary (Rs.)" className={INP} style={INP_STYLE} />
          <div>
            <input type="date" value={form.joinDate} onChange={e => f("joinDate", e.target.value)}
              className={INP} style={{ ...INP_STYLE, borderColor: errors.joinDate ? "#DC2626" : undefined }} />
            {errors.joinDate && <p className="text-xs mt-1" style={{ color: "#DC2626" }}>{errors.joinDate}</p>}
          </div>
        </div>

        <input value={form.address} onChange={e => f("address", e.target.value)}
          placeholder="Address" className={INP} style={INP_STYLE} />

        <textarea value={form.notes} onChange={e => f("notes", e.target.value)}
          rows={3} placeholder="Notes (optional)"
          className={`${INP} resize-none`} style={INP_STYLE} />
      </div>

      {/* Bottom bar */}
      <div className="shrink-0 px-5 py-4" style={{ borderTop: "1px solid #F4F4F5" }}>
        <div className="flex gap-2.5">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-semibold border hover:bg-gray-50 transition-colors"
            style={{ border: "1px solid #E5E7EB", color: "#6B7280" }}>
            Cancel
          </button>
          <button onClick={onSave}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: "var(--primary)" }}>
            {mode === "add" ? "Add Member" : "Save Changes"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function PlusIcon()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function CloseIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function EyeIcon()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>; }
function EditIcon()   { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function TrashIcon({ color = "currentColor" }: { color?: string }) { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>; }
function SearchIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; }
function TeamIcon()   { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>; }
function PhoneIcon()  { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .84h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.64a16 16 0 006.29 6.29l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>; }
function MailIcon()   { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>; }
function PinIcon()    { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>; }
