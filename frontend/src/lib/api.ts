const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5510";

type ApiResponse<T = unknown> = { success: boolean; message?: string; _fromCache?: true } & T;

let _activeBranchId: string | null = null;
// Direct getter registered by useAuthStore — always returns live Zustand state.
let _branchGetter: (() => string | null) | null = null;

export function setActiveBranch(id: string | null) {
  _activeBranchId = id;
}

export function getActiveBranchId(): string | null {
  return _activeBranchId;
}

/** Called once by useAuthStore to register a live branch-ID reader. */
export function registerBranchGetter(fn: () => string | null) {
  _branchGetter = fn;
}

/** Returns the current active branch ID — usable outside React components. */
export function resolveActiveBranchId(): string | null {
  return getActiveBranch();
}

// ── Response cache (localStorage) ────────────────────────────────────────────
// Keyed by branchId + path so switching branches offline serves the right data.
const RC_PREFIX      = "ee_rc_";
const RC_TTL         = 24 * 60 * 60 * 1000; // 24 h
const VENDOR_SESSION = "ee_vendor_session";  // same key as useAuthStore

// Returns the current active branch ID from the most authoritative source available:
// 1. Live Zustand getter (registered by useAuthStore at startup) — always current
// 2. Module-level var set by setActiveBranch()
// 3. localStorage fallback
function getActiveBranch(): string | null {
  if (_branchGetter) return _branchGetter();
  if (_activeBranchId) return _activeBranchId;
  try {
    const raw = localStorage.getItem(VENDOR_SESSION);
    if (!raw) return null;
    return JSON.parse(raw)?.activeBranchId ?? null;
  } catch { return null; }
}

function rcKey(branchId: string | null, path: string) {
  return RC_PREFIX + (branchId ?? "x") + "_" + path.replace(/\W+/g, "_");
}

function rcSave(key: string, data: unknown) {
  try { localStorage.setItem(key, JSON.stringify({ d: data, t: Date.now() })); } catch {}
}

function rcLoad(key: string): unknown | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { d, t } = JSON.parse(raw) as { d: unknown; t: number };
    if (Date.now() - t > RC_TTL) { localStorage.removeItem(key); return null; }
    return d;
  } catch { return null; }
}

function serveCache<T>(cacheKey: string | null): ApiResponse<T> | null {
  if (!cacheKey) return null;
  const cached = rcLoad(cacheKey);
  if (cached) return { ...(cached as ApiResponse<T>), _fromCache: true };
  return null;
}
// ─────────────────────────────────────────────────────────────────────────────

const OFFLINE_TOKEN = "offline-session";

async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
  timeoutMs = 8_000,
): Promise<ApiResponse<T>> {
  // Always read branch at call time — captures the latest value even if
  // _activeBranchId wasn't updated yet (localStorage is the fallback).
  const branchId = getActiveBranch();
  const cacheKey = method === "GET" ? rcKey(branchId, path) : null;

  // If we're in offline-session mode, skip network entirely and serve cache.
  // "offline-session" is a placeholder token that the real server rejects with 401,
  // so there's no point making the request — serve cached data directly.
  if (token === OFFLINE_TOKEN) {
    if (method === "GET") {
      const hit = serveCache<T>(cacheKey);
      if (hit) return hit;
    }
    return { success: false, message: "No connection." } as ApiResponse<T>;
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(branchId ? { "X-Branch-Id": branchId } : {}),
      },
      credentials: "include", // send httpOnly refresh cookie
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });
    const data = await res.json() as ApiResponse<T>;
    // Cache successful GET responses per branch
    if (cacheKey && data.success) rcSave(cacheKey, data);
    return data;
  } catch {
    // Network failure (no internet, timeout) — serve cached data for this branch
    const hit = serveCache<T>(cacheKey);
    if (hit) return hit;
    return { success: false, message: "No connection." } as ApiResponse<T>;
  }
}

export const api = {
  post: <T = unknown>(path: string, body: unknown, token?: string, timeoutMs?: number) =>
    request<T>("POST", path, body, token, timeoutMs),

  get: <T = unknown>(path: string, token?: string, timeoutMs?: number) =>
    request<T>("GET", path, undefined, token, timeoutMs),

  patch: <T = unknown>(path: string, body: unknown, token?: string) =>
    request<T>("PATCH", path, body, token),

  delete: <T = unknown>(path: string, token?: string) =>
    request<T>("DELETE", path, undefined, token),
};

export type VendorSession = {
  id:           string;
  name:         string;
  email:        string;
  ownerName:    string;
  slug:         string;
  isVerified:   boolean;
  isBlocked:    boolean;
  businessType: string;
};

export type Branch = {
  id:            string;
  vendorId:      string;
  name:          string;
  city:          string;
  area:          string;
  address:       string;
  isDefault:     boolean;
  isActive:      boolean;
  isApproved:    boolean;
  phone:         string | null;
  whatsapp:      string | null;
  email:         string | null;
  established:   number | null;
  startingPrice: number | null;
  mapUrl:        string | null;
  galleryImages: string[];
  createdAt:     string;
};
