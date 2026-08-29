import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db/index.js";
import { branches } from "../db/schema.js";

// GET /api/vendor/branches
export async function getBranches(req, res) {
    try {
        const vendorId = req.vendor.id;
        const result = await db.select().from(branches)
            .where(eq(branches.vendorId, vendorId))
            .orderBy(branches.createdAt);
        return res.status(200).json({ success: true, branches: result });
    } catch (err) {
        console.error("[getBranches]", err);
        return res.status(500).json({ success: false, message: "Failed to fetch branches." });
    }
}

// POST /api/vendor/branches
export async function createBranch(req, res) {
    try {
        const vendorId = req.vendor.id;
        const { name, city, area, address } = req.body;

        if (!name || !city || !area || !address) {
            return res.status(400).json({ success: false, message: "name, city, area, address are required." });
        }

        const id = randomUUID();
        const [branch] = await db.insert(branches).values({
            id,
            vendorId,
            name:      name.trim(),
            city:      city.trim(),
            area:      area.trim(),
            address:   address.trim(),
            isDefault: false,
        }).returning();

        return res.status(201).json({ success: true, branch });
    } catch (err) {
        console.error("[createBranch]", err);
        return res.status(500).json({ success: false, message: "Failed to create branch." });
    }
}

// PATCH /api/vendor/branches/:id
export async function updateBranch(req, res) {
    try {
        const vendorId = req.vendor.id;
        const { id } = req.params;
        const { name, city, area, address } = req.body;

        const [existing] = await db.select({ vendorId: branches.vendorId })
            .from(branches).where(eq(branches.id, id)).limit(1);

        if (!existing || existing.vendorId !== vendorId) {
            return res.status(403).json({ success: false, message: "Forbidden." });
        }

        const [updated] = await db.update(branches)
            .set({
                ...(name    ? { name:    name.trim()    } : {}),
                ...(city    ? { city:    city.trim()    } : {}),
                ...(area    ? { area:    area.trim()    } : {}),
                ...(address ? { address: address.trim() } : {}),
            })
            .where(eq(branches.id, id))
            .returning();

        return res.status(200).json({ success: true, branch: updated });
    } catch (err) {
        console.error("[updateBranch]", err);
        return res.status(500).json({ success: false, message: "Failed to update branch." });
    }
}

// DELETE /api/vendor/branches/:id
export async function deleteBranch(req, res) {
    try {
        const vendorId = req.vendor.id;
        const { id } = req.params;

        const [existing] = await db.select({ vendorId: branches.vendorId, isDefault: branches.isDefault })
            .from(branches).where(eq(branches.id, id)).limit(1);

        if (!existing || existing.vendorId !== vendorId) {
            return res.status(403).json({ success: false, message: "Forbidden." });
        }

        // Count total branches for this vendor
        const allBranches = await db
            .select({ id: branches.id })
            .from(branches)
            .where(eq(branches.vendorId, vendorId));

        // Block deleting the only branch
        if (allBranches.length <= 1) {
            return res.status(400).json({ success: false, message: "Cannot delete your only branch." });
        }

        // Block deleting the default branch only when it's the sole default
        if (existing.isDefault) {
            const defaultCount = await db
                .select({ id: branches.id })
                .from(branches)
                .where(and(eq(branches.vendorId, vendorId), eq(branches.isDefault, true)));

            if (defaultCount.length <= 1) {
                return res.status(400).json({ success: false, message: "Cannot delete the default branch. Set another branch as default first." });
            }
        }

        await db.delete(branches).where(eq(branches.id, id));
        return res.status(200).json({ success: true, message: "Branch deleted." });
    } catch (err) {
        console.error("[deleteBranch]", err);
        return res.status(500).json({ success: false, message: "Failed to delete branch." });
    }
}
