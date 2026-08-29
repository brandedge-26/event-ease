"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";

export default function BranchSwitcher() {
  const { branches, activeBranchId, setBranch } = useAuthStore();
  const [open, setOpen] = useState(false);

  if (branches.length === 0) return null;

  const active = branches.find(b => b.id === activeBranchId);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-[var(--bg-subtle)]"
        style={{ color: "var(--fg)" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span className="max-w-[120px] truncate">{active?.city ?? "Select Branch"}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 z-20 min-w-[180px] rounded-2xl border border-[#E5E7EB] shadow-lg overflow-hidden" style={{ background: "var(--bg)" }}>
            {branches.map(branch => (
              <button
                key={branch.id}
                onClick={() => { setBranch(branch.id); setOpen(false); window.location.reload(); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors hover:bg-[var(--bg-subtle)]"
                style={{ color: "var(--fg)" }}
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${branch.id === activeBranchId ? "bg-[var(--primary)]" : "bg-[#D1D5DB]"}`} />
                <div>
                  <div className="font-medium leading-tight">{branch.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{branch.city}</div>
                </div>
                {branch.id === activeBranchId && (
                  <svg className="ml-auto" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
