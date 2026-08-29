import { eq, asc, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db/index.js";
import { halls } from "../db/schema.js";

// GET /api/vendor/halls
export async function getHalls(req, res) {
    try {
        const filter = req.branchId
            ? and(eq(halls.vendorId, req.vendor.id), eq(halls.branchId, req.branchId))
            : eq(halls.vendorId, req.vendor.id);

        const vendorHalls = await db
            .select()
            .from(halls)
            .where(filter)
            .orderBy(asc(halls.createdAt));
        return res.status(200).json({ success: true, halls: vendorHalls });
    } catch (err) {
        console.error("[getHalls]", err);
        return res.status(500).json({ success: false, message: "Failed to fetch halls." });
    }
}

// POST /api/vendor/halls
export async function createHall(req, res) {
    try {
        const { name, capacity, price, desc } = req.body;
        if (!name?.trim() || !capacity || !price) {
            return res.status(400).json({ success: false, message: "Name, capacity, and price are required." });
        }
        const [hall] = await db.insert(halls).values({
            id:       randomUUID(),
            vendorId: req.vendor.id,
            branchId: req.branchId ?? null,
            name:     name.trim(),
            capacity: Number(capacity),
            price:    Number(price),
            desc:     desc?.trim() || null,
        }).returning();
        return res.status(201).json({ success: true, hall });
    } catch (err) {
        console.error("[createHall]", err);
        return res.status(500).json({ success: false, message: "Failed to create hall." });
    }
}

// PUT /api/vendor/halls/:id
export async function updateHall(req, res) {
    try {
        const { id } = req.params;
        const { name, capacity, price, desc } = req.body;

        const [existing] = await db.select({ vendorId: halls.vendorId }).from(halls).where(eq(halls.id, id)).limit(1);
        if (!existing || existing.vendorId !== req.vendor.id) {
            return res.status(404).json({ success: false, message: "Hall not found." });
        }
        await db.update(halls).set({
            name:     name.trim(),
            capacity: Number(capacity),
            price:    Number(price),
            desc:     desc?.trim() || null,
        }).where(eq(halls.id, id));
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("[updateHall]", err);
        return res.status(500).json({ success: false, message: "Failed to update hall." });
    }
}

// DELETE /api/vendor/halls/:id
export async function deleteHall(req, res) {
    try {
        const { id } = req.params;
        const [existing] = await db.select({ vendorId: halls.vendorId }).from(halls).where(eq(halls.id, id)).limit(1);
        if (!existing || existing.vendorId !== req.vendor.id) {
            return res.status(404).json({ success: false, message: "Hall not found." });
        }
        await db.delete(halls).where(eq(halls.id, id));
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("[deleteHall]", err);
        return res.status(500).json({ success: false, message: "Failed to delete hall." });
    }
}
