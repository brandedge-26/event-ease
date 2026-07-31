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

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  vendor:      null,
  isLoading:   true, // start true — AuthProvider will resolve it

  setAuth: (accessToken, vendor) => set({ accessToken, vendor, isLoading: false }),

  clearAuth: () => set({ accessToken: null, vendor: null, isLoading: false }),

  setLoading: (v) => set({ isLoading: v }),
}));
