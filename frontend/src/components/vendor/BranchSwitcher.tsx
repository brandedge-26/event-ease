"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";

export default function BranchSwitcher() {
  const { branches, activeBranchId, setBranch, setBranches, accessToken } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [settingDefault, setSettingDefault] = useState<string | null>(null);

  if (branches.length === 0) return null;

  const active = branches.find(b => b.id === activeBranchId);

  async function handleSetDefault(e: React.MouseEvent, branchId: string) {
    e.stopPropagation();
    if (settingDefault) return;
    setSettingDefault(branchId);
    try {
      const res = await api.patch<{ branch?: { id: string; isDefault: boolean } }>(
        `/api/vendor/branches/${branchId}/default`,
        {},
        accessToken ?? undefined,
      );
      if (res.success) {
        const updated = branches.map(b => ({ ...b, isDefault: b.id === branchId }));
        setBranches(updated, activeBranchId ?? undefined);
      }
    } finally {
      setSettingDefault(null);
    }
  }

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-[var(--bg-subtle)]"
        style={{ color: "var(--fg)" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span className="max-w-[100px] truncate">{active?.city ?? "Branch"}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          {/* right-0 so it doesn't overflow off-screen */}
          <div className="absolute top-full mt-2 right-0 z-20 w-64 rounded-2xl border border-[#E5E7EB] shadow-xl overflow-hidden"
            style={{ background: "var(--bg)" }}>

            <div className="px-4 py-2.5 border-b border-[#F3F4F6]">
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>
                Your Branches
              </p>
            </div>

            {branches.map(branch => (
              <div key={branch.id} className="group relative">
                {/* Click to switch branch */}
                <button
                  onClick={() => { setBranch(branch.id); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors hover:bg-[var(--bg-subtle)] cursor-pointer"
                  style={{ color: "var(--fg)" }}
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 mt-0.5 ${branch.id === activeBranchId ? "bg-[var(--primary)]" : "bg-[#D1D5DB]"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium leading-snug truncate">{branch.name}</div>
                    <div className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: "var(--fg-muted)" }}>
                      <span>{branch.city}</span>
                      {branch.isDefault && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold leading-none" style={{ background: "#DCFCE7", color: "#15803D" }}>
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                  {branch.id === activeBranchId && (
                    <svg className="shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>

                {/* Set Default — appears on hover, only for non-default branches */}
                {!branch.isDefault && (
                  <button
                    onClick={(e) => handleSetDefault(e, branch.id)}
                    disabled={settingDefault === branch.id}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-opacity disabled:opacity-40 cursor-pointer"
                    style={{ background: "#F3F4F6", color: "#374151" }}
                  >
                    {settingDefault === branch.id ? "…" : "Set Default"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
