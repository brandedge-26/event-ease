// LocalStorage cache for bookings — shown when user is offline.
// Keys are automatically scoped per branch so switching branches offline
// serves the correct branch's data instead of shared/overwritten data.

import { resolveActiveBranchId } from "@/lib/api";

const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

type CacheEntry<T> = { data: T[]; savedAt: number };

// Append the current branch ID to the base key so each branch has its own slot.
function scopedKey(base: string): string {
  const branchId = resolveActiveBranchId();
  return branchId ? `${base}_${branchId}` : base;
}

export function saveToCache<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(scopedKey(key), JSON.stringify({ data, savedAt: Date.now() } satisfies CacheEntry<T>));
  } catch { /* storage full — ignore */ }
}

export function loadFromCache<T>(key: string): T[] | null {
  try {
    const raw = localStorage.getItem(scopedKey(key));
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - entry.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(scopedKey(key));
      return null;
    }
    return entry.data;
  } catch { return null; }
}

export const CACHE_KEYS = {
  VENUE_BOOKINGS:      "ee_venue_bookings",
  GENERAL_BOOKINGS:    "ee_general_bookings",
  VENUE_QUOTATIONS:    "ee_venue_quotations",
  GENERAL_QUOTATIONS:  "ee_general_quotations",
  VENUE_HALLS:         "ee_venue_halls",
} as const;
