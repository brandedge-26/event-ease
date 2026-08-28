// LocalStorage cache for bookings — shown when user is offline

const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

type CacheEntry<T> = { data: T[]; savedAt: number };

export function saveToCache<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify({ data, savedAt: Date.now() } satisfies CacheEntry<T>));
  } catch { /* storage full — ignore */ }
}

export function loadFromCache<T>(key: string): T[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - entry.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(key);
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
