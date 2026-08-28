"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

type ServicePackage = {
  id: string;
  name: string;
  price: number;
};

type DbPackage = {
  id: string;
  name: string;
  price: number;
  description?: string;
};

export default function ServicesPage() {
  const { accessToken } = useAuthStore();
  const [services,  setServices]  = useState<ServicePackage[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [name,      setName]      = useState("");
  const [price,     setPrice]     = useState("");
  const [adding,    setAdding]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    api.get<{ packages: DbPackage[] }>("/api/vendor/packages", accessToken)
      .then(res => {
        if (res.success) setServices((res.packages ?? []).map(p => ({ id: p.id, name: p.name, price: p.price })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !price) return;
    setAdding(true); setError(null);
    try {
      const res = await api.post<{ package?: DbPackage; id?: string }>(
        "/api/vendor/packages",
        { name: name.trim(), price: Number(price), description: "" },
        accessToken ?? undefined,
      );
      if (res.success) {
        const newId = res.package?.id ?? (res as { id?: string }).id ?? String(Date.now());
        setServices(prev => [...prev, { id: newId, name: name.trim(), price: Number(price) }]);
        setName(""); setPrice("");
      } else {
        setError((res as { message?: string }).message ?? "Failed to add service");
      }
    } catch { setError("Network error"); }
    finally { setAdding(false); }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await api.delete(`/api/vendor/packages/${id}`, accessToken ?? undefined);
      if (res.success) setServices(prev => prev.filter(s => s.id !== id));
    } catch { /* ignore */ }
    finally { setDeletingId(null); }
  }

  const inputStyle = { background: "var(--bg-subtle)", borderColor: "#D1D5DB", color: "var(--fg)" };

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-semibold text-black tracking-tight">Services &amp; Pricing</h1>
        <p className="text-sm mt-1" style={{ color: "var(--fg-muted)" }}>Manage your service offerings and pricing</p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-2xl text-sm font-medium flex items-center justify-between" style={{ background: "#FEF2F2", color: "#DC2626" }}>
          {error}
          <button onClick={() => setError(null)} className="ml-2 cursor-pointer"><XIcon /></button>
        </div>
      )}

      {/* Add Form */}
      <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-5 mb-4">
        <p className="text-sm font-semibold text-black mb-3">Add New Service</p>
        <form onSubmit={handleAdd} className="flex items-end gap-2">
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Service Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Photography Session"
              required
              className="px-3 py-2.5 rounded-xl border text-sm outline-none"
              style={inputStyle}
            />
          </div>
          <div className="w-32 flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Price (Rs.)</label>
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="0"
              required
              min={0}
              className="px-3 py-2.5 rounded-xl border text-sm outline-none"
              style={inputStyle}
            />
          </div>
          <button
            type="submit"
            disabled={adding || !name.trim() || !price}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50 shrink-0"
            style={{ background: "var(--primary)", color: "#ffffff" }}
          >
            {adding ? "Adding…" : <><PlusIcon /> Add</>}
          </button>
        </form>
      </div>

      {/* Services List */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-5 flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 animate-pulse">
                <div className="h-3.5 w-40 rounded" style={{ background: "#E5E7EB" }} />
                <div className="h-3.5 w-20 rounded" style={{ background: "#E5E7EB" }} />
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="py-16 flex flex-col items-center">
            <EmptyIcon />
            <p className="text-sm font-medium mt-3 text-black">No services yet</p>
            <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>Add your first service above</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "#F4F4F5" }}>
            {services.map((s, i) => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3.5" style={{ borderColor: "#F4F4F5" }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                    {i + 1}
                  </div>
                  <p className="text-sm font-semibold text-black truncate">{s.name}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <p className="text-sm font-bold" style={{ color: "var(--primary)" }}>
                    Rs. {s.price.toLocaleString("en-PK")}
                  </p>
                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={deletingId === s.id}
                    className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer hover:bg-red-50 transition-colors disabled:opacity-40"
                    style={{ color: "#DC2626" }}
                  >
                    {deletingId === s.id ? <SpinIcon /> : <TrashIcon />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function PlusIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>; }
function XIcon()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>; }
function TrashIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>; }
function EmptyIcon() { return <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: "var(--fg-subtle)" }}><line x1="16.5" y1="9.4" x2="7.5" y2="4.21" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>; }
function SpinIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>; }
