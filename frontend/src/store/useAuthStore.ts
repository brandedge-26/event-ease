import { create } from "zustand";
import type { VendorSession } from "@/lib/api";

interface AuthState {
  accessToken: string | null;
  vendor:      VendorSession | null;
  isLoading:   boolean; // true while checking session on app load

  setAuth:    (token: string, vendor: VendorSession) => void;
  clearAuth:  () => void;
  setLoading: (v: boolean) => void;
}

const VENDOR_CACHE_KEY = "ee_vendor_session";

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  vendor:      null,
  isLoading:   true, // start true — AuthProvider will resolve it

  setAuth: (accessToken, vendor) => {
    // Persist vendor info (NOT token) so offline restore is possible
    try { localStorage.setItem(VENDOR_CACHE_KEY, JSON.stringify(vendor)); } catch { /* ignore */ }
    set({ accessToken, vendor, isLoading: false });
  },

  clearAuth: () => {
    try { localStorage.removeItem(VENDOR_CACHE_KEY); } catch { /* ignore */ }
    set({ accessToken: null, vendor: null, isLoading: false });
  },

  setLoading: (v) => set({ isLoading: v }),
}));

/** Read cached vendor without touching Zustand state */
export function getCachedVendor(): VendorSession | null {
  try {
    const raw = localStorage.getItem(VENDOR_CACHE_KEY);
    return raw ? (JSON.parse(raw) as VendorSession) : null;
  } catch { return null; }
}
