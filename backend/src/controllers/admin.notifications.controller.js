import { eq, desc, count } from "drizzle-orm";
import { db } from "../db/index.js";
import { notifications } from "../db/schema.js";

const PAGE_SIZE = 10;

// GET /api/admin/notifications?page=1
export async function getNotifications(req, res) {
    try {
        const page   = Math.max(1, parseInt(req.query.page) || 1);
        const offset = (page - 1) * PAGE_SIZE;

        const [{ total }] = await db.select({ total: count() }).from(notifications);

        const rows = await db
            .select()
            .from(notifications)
            .orderBy(desc(notifications.createdAt))
            .limit(PAGE_SIZE)
            .offset(offset);

        return res.json({
            success: true,
            notifications: rows,
            pagination: { page, pageSize: PAGE_SIZE, total, totalPages: Math.ceil(total / PAGE_SIZE) },
        });
    } catch (err) {
        console.error("[admin getNotifications]", err);
        return res.status(500).json({ success: false, message: "Failed to fetch notifications." });
    }
}

// GET /api/admin/notifications/unread-count
export async function getUnreadCount(req, res) {
    try {
        const [{ total }] = await db
            .select({ total: count() })
            .from(notifications)
            .where(eq(notifications.isRead, false));
        return res.json({ success: true, count: Number(total) });
    } catch (err) {
        console.error("[admin getUnreadCount]", err);
        return res.status(500).json({ success: false, count: 0 });
    }
}

// PATCH /api/admin/notifications/:id/read
export async function markRead(req, res) {
    try {
        await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, req.params.id));
        return res.json({ success: true });
    } catch (err) {
        console.error("[admin markRead]", err);
        return res.status(500).json({ success: false });
    }
}

// PATCH /api/admin/notifications/read-all
export async function markAllRead(req, res) {
    try {
        await db.update(notifications).set({ isRead: true }).where(eq(notifications.isRead, false));
        return res.json({ success: true });
    } catch (err) {
        console.error("[admin markAllRead]", err);
        return res.status(500).json({ success: false });
    }
}

// DELETE /api/admin/notifications/:id
export async function deleteNotification(req, res) {
    try {
        await db.delete(notifications).where(eq(notifications.id, req.params.id));
        return res.json({ success: true });
    } catch (err) {
        console.error("[admin deleteNotification]", err);
        return res.status(500).json({ success: false });
    }
}
