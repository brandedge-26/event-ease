import { eq, desc, count } from "drizzle-orm";
import { db } from "../db/index.js";
import { applications } from "../db/schema.js";

const PAGE_SIZE = 10;

// GET /api/admin/applications
export async function getApplications(req, res) {
    try {
        const page   = Math.max(1, parseInt(req.query.page) || 1);
        const offset = (page - 1) * PAGE_SIZE;

        const [{ total }] = await db.select({ total: count() }).from(applications);

        const rows = await db
            .select()
            .from(applications)
            .orderBy(desc(applications.createdAt))
            .limit(PAGE_SIZE)
            .offset(offset);

        return res.json({
            success: true,
            applications: rows,
            pagination: {
                page,
                pageSize: PAGE_SIZE,
                total: Number(total),
                totalPages: Math.ceil(Number(total) / PAGE_SIZE),
            },
        });
    } catch (err) {
        console.error("[getApplications]", err);
        return res.status(500).json({ success: false, message: "Failed to load applications." });
    }
}

// DELETE /api/admin/applications/:id
export async function deleteApplication(req, res) {
    try {
        const { id } = req.params;
        await db.delete(applications).where(eq(applications.id, id));
        return res.json({ success: true });
    } catch (err) {
        console.error("[deleteApplication]", err);
        return res.status(500).json({ success: false, message: "Failed to delete application." });
    }
}

// PATCH /api/admin/applications/:id/read
export async function markApplicationRead(req, res) {
    try {
        const { id } = req.params;
        await db.update(applications).set({ isRead: true }).where(eq(applications.id, id));
        return res.json({ success: true });
    } catch (err) {
        console.error("[markApplicationRead]", err);
        return res.status(500).json({ success: false, message: "Failed to update." });
    }
}
