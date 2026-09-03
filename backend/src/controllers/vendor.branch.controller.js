import { eq, and, ne } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db/index.js";
import { branches } from "../db/schema.js";
import { createNotification } from "../utils/notify.js";

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
        const { name, city, area, address, phone, whatsapp, email, established, startingPrice, mapUrl } = req.body;

        if (!name || !city || !area || !address) {
            return res.status(400).json({ success: false, message: "name, city, area, address are required." });
        }

        // Smart-extract map URL from iframe embed code
        let resolvedMapUrl = mapUrl ?? null;
        if (resolvedMapUrl) {
            const match = resolvedMapUrl.match(/src="([^"]+)"/);
            if (match) resolvedMapUrl = match[1];
        }

        const id = randomUUID();
        const [branch] = await db.insert(branches).values({
            id,
            vendorId,
            name:          name.trim(),
            city:          city.trim(),
            area:          area.trim(),
            address:       address.trim(),
            phone:         phone?.trim()   || null,
            whatsapp:      whatsapp?.trim() || null,
            email:         email?.trim()   || null,
            established:   established ? Number(established) : null,
            startingPrice: startingPrice ? Number(startingPrice) : null,
            mapUrl:        resolvedMapUrl,
            isDefault:     false,
            isApproved:    false,
        }).returning();

        // Notify admin about new branch awaiting approval
        createNotification({
            type:  "new_branch",
            title: "New Branch Awaiting Approval",
            body:  `${req.vendor.name} added a new branch "${branch.name}" in ${branch.city}. Review and approve it in the Branches section.`,
            refId: branch.id,
        });

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
        const { name, city, area, address, phone, whatsapp, email, established, startingPrice, mapUrl, galleryImages } = req.body;

        const [existing] = await db.select({ vendorId: branches.vendorId })
            .from(branches).where(eq(branches.id, id)).limit(1);

        if (!existing || existing.vendorId !== vendorId) {
            return res.status(403).json({ success: false, message: "Forbidden." });
        }

        // Smart-extract map URL from iframe embed code
        let resolvedMapUrl = mapUrl;
        if (resolvedMapUrl != null) {
            const match = resolvedMapUrl.match(/src="([^"]+)"/);
            if (match) resolvedMapUrl = match[1];
        }

        const updates = {};
        if (name          !== undefined) updates.name          = name.trim();
        if (city          !== undefined) updates.city          = city.trim();
        if (area          !== undefined) updates.area          = area.trim();
        if (address       !== undefined) updates.address       = address.trim();
        if (phone         !== undefined) updates.phone         = phone?.trim()   || null;
        if (whatsapp      !== undefined) updates.whatsapp      = whatsapp?.trim() || null;
        if (email         !== undefined) updates.email         = email?.trim()   || null;
        if (established   !== undefined) updates.established   = established ? Number(established) : null;
        if (startingPrice !== undefined) updates.startingPrice = startingPrice ? Number(startingPrice) : null;
        if (resolvedMapUrl !== undefined) updates.mapUrl       = resolvedMapUrl || null;
        if (galleryImages !== undefined) updates.galleryImages = galleryImages;

        const [updated] = await db.update(branches)
            .set(updates)
            .where(eq(branches.id, id))
            .returning();

        return res.status(200).json({ success: true, branch: updated });
    } catch (err) {
        console.error("[updateBranch]", err);
        return res.status(500).json({ success: false, message: "Failed to update branch." });
    }
}

// PATCH /api/vendor/branches/:id/default
export async function setDefaultBranch(req, res) {
    try {
        const vendorId = req.vendor.id;
        const { id } = req.params;

        const [existing] = await db.select({ vendorId: branches.vendorId })
            .from(branches).where(eq(branches.id, id)).limit(1);

        if (!existing || existing.vendorId !== vendorId) {
            return res.status(403).json({ success: false, message: "Forbidden." });
        }

        // Unset all defaults, then set this one
        await db.update(branches)
            .set({ isDefault: false })
            .where(and(eq(branches.vendorId, vendorId), ne(branches.id, id)));

        const [updated] = await db.update(branches)
            .set({ isDefault: true })
            .where(eq(branches.id, id))
            .returning();

        return res.status(200).json({ success: true, branch: updated });
    } catch (err) {
        console.error("[setDefaultBranch]", err);
        return res.status(500).json({ success: false, message: "Failed to set default branch." });
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
