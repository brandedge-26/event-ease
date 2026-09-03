// Syncs pending offline bookings to the server when connection is restored

import { getAllPending, deletePending, incrementRetries } from "./offlineDB";
import { resolveActiveBranchId } from "./api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5510";

const MAX_RETRIES = 3;

export async function syncPending(currentToken?: string): Promise<{ synced: number; failed: number }> {
  if (typeof window === "undefined" || !navigator.onLine) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  let pending;
  try {
    pending = await getAllPending();
  } catch {
    return { synced: 0, failed: 0 };
  }

  // Read branch ID once — same for all pending items in this session
  const branchId = resolveActiveBranchId();

  for (const booking of pending) {
    // Always prefer the freshly-refreshed token so that bookings queued with
    // an old (potentially expired) JWT still sync successfully.
    const tokenToUse = currentToken ?? booking.accessToken;

    try {
      const method = booking.method ?? "POST";
      const res = await fetch(`${API_BASE}${booking.endpoint}`, {
        method,
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${tokenToUse}`,
          // Required — api.ts sends this on every request; without it the server
          // cannot associate the booking with the correct branch and returns 400/false.
          ...(branchId ? { "X-Branch-Id": branchId } : {}),
        },
        body: method === "DELETE" ? undefined : JSON.stringify(booking.payload),
        signal: AbortSignal.timeout(10_000),
      });
      const data = await res.json();

      if (data.success) {
        await deletePending(booking.id);
        synced++;
      } else {
        // Server rejected — count retries, drop after MAX_RETRIES
        if (booking.retries >= MAX_RETRIES) {
          await deletePending(booking.id);
        } else {
          await incrementRetries(booking.id);
        }
        failed++;
      }
    } catch {
      // Network still unstable — leave in queue, try next time
      failed++;
    }
  }

  return { synced, failed };
}
