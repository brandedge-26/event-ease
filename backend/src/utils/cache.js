import { redis } from "../config/redis.js";

// ─── Cache keys — one place so every reader/invalidator uses the same names ────
export const CACHE_KEYS = {
    allVendors: "vendors:all",
    featured:   "vendors:featured",
    profile:    (slug) => `vendor:profile:${slug}`,
};

// Public vendor data changes rarely (a vendor edits their profile/halls now
// and then) but is read on almost every page load — 5 minutes balances DB
// load against how stale a listing is allowed to look.
export const CACHE_TTL_SECONDS = 300;

// ─── Read-through wrapper ───────────────────────────────────────────────────
// Returns the cached value if present, otherwise runs fetchFn, caches the
// result, and returns it. Safe with no Redis configured or on any Redis
// error — always falls back to calling fetchFn so a cache outage never
// breaks a request, it just stops being fast.
export async function cacheWrap(key, ttlSeconds, fetchFn) {
    if (!redis) return fetchFn();

    try {
        const cached = await redis.get(key);
        if (cached !== null) return JSON.parse(cached);
    } catch (err) {
        console.error("[cache] read failed:", err.message);
    }

    const fresh = await fetchFn();

    try {
        await redis.set(key, JSON.stringify(fresh), "EX", ttlSeconds);
    } catch (err) {
        console.error("[cache] write failed:", err.message);
    }

    return fresh;
}

// ─── Invalidation ────────────────────────────────────────────────────────────
// Fire-and-forget-safe — never throws, so callers can call it without await
// right after a write without risking the response.
export async function cacheDel(...keys) {
    const validKeys = keys.filter(Boolean);
    if (!redis || validKeys.length === 0) return;
    try {
        await redis.del(...validKeys);
    } catch (err) {
        console.error("[cache] delete failed:", err.message);
    }
}
