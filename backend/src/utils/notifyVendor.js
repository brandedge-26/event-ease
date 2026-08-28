import { randomUUID } from "crypto";
import { db } from "../db/index.js";
import { vendorNotifications } from "../db/schema.js";

/**
 * notifyVendor({ vendorId, type, title, body, link?, refId? })
 * Fire-and-forget — errors are logged but never thrown.
 */
export async function notifyVendor({ vendorId, type, title, body, link = null, refId = null }) {
    try {
        await db.insert(vendorNotifications).values({
            id: randomUUID(),
            vendorId,
            type,
            title,
            body,
            link,
            refId,
        });
    } catch (err) {
        console.error("[notifyVendor]", err);
    }
}
