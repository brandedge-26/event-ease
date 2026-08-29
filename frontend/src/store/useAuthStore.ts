import { create } from "zustand";
import type { VendorSession, Branch } from "@/lib/api";
import { setActiveBranch } from "@/lib/api";

interface AuthState {
  accessToken:    string | null;
  vendor:         VendorSession | null;
  isLoading:      boolean; // true while checking session on app load
  activeBranchId: string | null;
  branches:       Branch[];

  setAuth:      (token: string, vendor: VendorSession) => void;
  clearAuth:    () => void;
  setLoading:   (v: boolean) => void;
  setBranch:    (branchId: string) => void;
  setBranches:  (branches: Branch[], defaultId?: string) => void;
}

const VENDOR_CACHE_KEY = "ee_vendor_session";

export const useAuthStore = create<AuthState>((set) => ({
  accessToken:    null,
  vendor:         null,
  isLoading:      true, // start true — AuthProvider will resolve it
  activeBranchId: null,
  branches:       [],

  setAuth: (accessToken, vendor) => {
    // Persist vendor info (NOT token) so offline restore is possible
    try {
      const cached = localStorage.getItem(VENDOR_CACHE_KEY);
      const existing = cached ? JSON.parse(cached) : {};
      localStorage.setItem(VENDOR_CACHE_KEY, JSON.stringify({ ...existing, vendor }));
    } catch { /* ignore */ }
    set({ accessToken, vendor, isLoading: false });
  },

  clearAuth: () => {
    try { localStorage.removeItem(VENDOR_CACHE_KEY); } catch { /* ignore */ }
    setActiveBranch(null);
    set({ accessToken: null, vendor: null, isLoading: false, activeBranchId: null, branches: [] });
  },

  setLoading: (v) => set({ isLoading: v }),

  setBranch: (branchId) => {
    setActiveBranch(branchId);
    try {
      const cached = localStorage.getItem(VENDOR_CACHE_KEY);
      const existing = cached ? JSON.parse(cached) : {};
      localStorage.setItem(VENDOR_CACHE_KEY, JSON.stringify({ ...existing, activeBranchId: branchId }));
    } catch { /* ignore */ }
    set({ activeBranchId: branchId });
  },

  setBranches: (branches, defaultId) => {
    const activeBranchId = defaultId ?? branches.find((b) => b.isDefault)?.id ?? branches[0]?.id ?? null;
    setActiveBranch(activeBranchId);
    try {
      const cached = localStorage.getItem(VENDOR_CACHE_KEY);
      const existing = cached ? JSON.parse(cached) : {};
      localStorage.setItem(VENDOR_CACHE_KEY, JSON.stringify({ ...existing, branches, activeBranchId }));
    } catch { /* ignore */ }
    set({ branches, activeBranchId });
  },
}));

/** Read cached vendor without touching Zustand state */
export function getCachedVendor(): VendorSession | null {
  try {
    const raw = localStorage.getItem(VENDOR_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Support both old format (plain VendorSession) and new format ({ vendor, branches, activeBranchId })
    return parsed?.vendor ?? (parsed?.id ? parsed : null);
  } catch { return null; }
}

/** Read cached branches without touching Zustand state */
export function getCachedBranches(): { branches: Branch[]; activeBranchId: string | null } {
  try {
    const raw = localStorage.getItem(VENDOR_CACHE_KEY);
    if (!raw) return { branches: [], activeBranchId: null };
    const parsed = JSON.parse(raw);
    return {
      branches:       parsed?.branches       ?? [],
      activeBranchId: parsed?.activeBranchId ?? null,
    };
  } catch { return { branches: [], activeBranchId: null }; }
}
