import { eq, desc, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { vendorNotifications } from "../db/schema.js";

// GET /api/vendor/notifications
export async function getNotifications(req, res) {
    try {
        const rows = await db
            .select()
            .from(vendorNotifications)
            .where(eq(vendorNotifications.vendorId, req.vendor.id))
            .orderBy(desc(vendorNotifications.createdAt))
            .limit(60);
        return res.json({ success: true, notifications: rows });
    } catch (err) {
        console.error("[getNotifications]", err);
        return res.status(500).json({ success: false, message: "Failed to fetch notifications." });
    }
}

// GET /api/vendor/notifications/unread-count
export async function getUnreadCount(req, res) {
    try {
        const rows = await db
            .select({ id: vendorNotifications.id })
            .from(vendorNotifications)
            .where(and(
                eq(vendorNotifications.vendorId, req.vendor.id),
                eq(vendorNotifications.isRead, false)
            ));
        return res.json({ success: true, count: rows.length });
    } catch (err) {
        return res.json({ success: true, count: 0 });
    }
}

// PATCH /api/vendor/notifications/:id/read
export async function markRead(req, res) {
    try {
        const { id } = req.params;
        await db.update(vendorNotifications)
            .set({ isRead: true })
            .where(and(eq(vendorNotifications.id, id), eq(vendorNotifications.vendorId, req.vendor.id)));
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false });
    }
}

// PATCH /api/vendor/notifications/read-all
export async function markAllRead(req, res) {
    try {
        await db.update(vendorNotifications)
            .set({ isRead: true })
            .where(eq(vendorNotifications.vendorId, req.vendor.id));
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false });
    }
}

// DELETE /api/vendor/notifications/:id
export async function deleteNotification(req, res) {
    try {
        const { id } = req.params;
        await db.delete(vendorNotifications)
            .where(and(eq(vendorNotifications.id, id), eq(vendorNotifications.vendorId, req.vendor.id)));
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false });
    }
}
