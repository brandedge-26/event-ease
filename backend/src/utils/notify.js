import { randomUUID } from "crypto";
import { db } from "../db/index.js";
import { notifications } from "../db/schema.js";

/**
 * createNotification({ type, title, body, refId? })
 * Fire-and-forget — errors are logged but never thrown to the caller.
 */
export async function createNotification({ type, title, body, refId = null }) {
    try {
        await db.insert(notifications).values({
            id: randomUUID(),
            type,
            title,
            body,
            refId,
        });
    } catch (err) {
        console.error("[notify]", err);
    }
}
