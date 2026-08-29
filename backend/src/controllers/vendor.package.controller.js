import { eq, desc, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db/index.js";
import { packages } from "../db/schema.js";

// GET /api/vendor/packages
export async function getPackages(req, res) {
    try {
        const vendorId = req.vendor.id;
        const filter = req.branchId
            ? and(eq(packages.vendorId, vendorId), eq(packages.branchId, req.branchId))
            : eq(packages.vendorId, vendorId);

        const rows = await db.select().from(packages)
            .where(filter)
            .orderBy(desc(packages.createdAt));
        return res.status(200).json({ success: true, packages: rows });
    } catch (err) {
        console.error("[getPackages]", err);
        return res.status(500).json({ success: false, message: "Failed to fetch packages." });
    }
}

// POST /api/vendor/packages
export async function createPackage(req, res) {
    try {
        const vendorId = req.vendor.id;
        const { name, category, description, price, maxGuests, duration, includes, status } = req.body;

        const id = randomUUID();
        await db.insert(packages).values({
            id,
            vendorId,
            branchId:    req.branchId ?? null,
            name,
            category:    category    ?? "Other",
            description: description ?? null,
            price:       price       ?? 0,
            maxGuests:   maxGuests   ?? null,
            duration:    duration    ?? null,
            includes:    includes    ?? [],
            status:      status      ?? "active",
        });

        return res.status(201).json({ success: true, id });
    } catch (err) {
        console.error("[createPackage]", err);
        return res.status(500).json({ success: false, message: "Failed to create package." });
    }
}

// PATCH /api/vendor/packages/:id
export async function updatePackage(req, res) {
    try {
        const vendorId = req.vendor.id;
        const { id }   = req.params;

        const [existing] = await db
            .select({ id: packages.id, vendorId: packages.vendorId })
            .from(packages).where(eq(packages.id, id)).limit(1);

        if (!existing)                      return res.status(404).json({ success: false, message: "Package not found." });
        if (existing.vendorId !== vendorId) return res.status(403).json({ success: false, message: "Forbidden." });

        const { name, category, description, price, maxGuests, duration, includes, status } = req.body;
        const updates = { updatedAt: new Date() };

        if (name        !== undefined) updates.name        = name;
        if (category    !== undefined) updates.category    = category;
        if (description !== undefined) updates.description = description ?? null;
        if (price       !== undefined) updates.price       = price;
        if (maxGuests   !== undefined) updates.maxGuests   = maxGuests ?? null;
        if (duration    !== undefined) updates.duration    = duration ?? null;
        if (includes    !== undefined) updates.includes    = includes ?? [];
        if (status      !== undefined) updates.status      = status;

        await db.update(packages).set(updates).where(eq(packages.id, id));
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("[updatePackage]", err);
        return res.status(500).json({ success: false, message: "Failed to update package." });
    }
}

// DELETE /api/vendor/packages/:id
export async function deletePackage(req, res) {
    try {
        const vendorId = req.vendor.id;
        const { id }   = req.params;

        const [existing] = await db
            .select({ id: packages.id, vendorId: packages.vendorId })
            .from(packages).where(eq(packages.id, id)).limit(1);

        if (!existing)                      return res.status(404).json({ success: false, message: "Package not found." });
        if (existing.vendorId !== vendorId) return res.status(403).json({ success: false, message: "Forbidden." });

        await db.delete(packages).where(eq(packages.id, id));
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("[deletePackage]", err);
        return res.status(500).json({ success: false, message: "Failed to delete package." });
    }
}
