import { eq, desc, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db/index.js";
import { quotations } from "../db/schema.js";

// ── helpers ───────────────────────────────────────────────────────────────────
function parseQuotation(q) {
    return {
        ...q,
        services: q.services ? JSON.parse(q.services) : [],
    };
}

// GET /api/vendor/quotations
export async function getQuotations(req, res) {
    try {
        const vendorId = req.vendor.id;
        const filter = req.branchId
            ? and(eq(quotations.vendorId, vendorId), eq(quotations.branchId, req.branchId))
            : eq(quotations.vendorId, vendorId);

        const rows = await db
            .select()
            .from(quotations)
            .where(filter)
            .orderBy(desc(quotations.createdAt));

        return res.status(200).json({ success: true, quotations: rows.map(parseQuotation) });
    } catch (err) {
        console.error("[getQuotations]", err);
        return res.status(500).json({ success: false, message: "Failed to fetch quotations." });
    }
}

// POST /api/vendor/quotations
export async function createQuotation(req, res) {
    try {
        const vendorId = req.vendor.id;
        const { customerName, phone, email, event, hall, date,
                guests, hallAmount, notes, services } = req.body;

        const id = randomUUID();

        await db.insert(quotations).values({
            id,
            vendorId,
            branchId:   req.branchId ?? null,
            customerName,
            phone:      phone      ?? "",
            email:      email      ?? "",
            event,
            hall,
            date:       date       ?? null,
            guests:     guests     ?? 0,
            hallAmount: hallAmount ?? 0,
            notes:      notes      ?? null,
            services:   services?.length ? JSON.stringify(services) : null,
            status:     "pending",
        });

        return res.status(201).json({ success: true, id });
    } catch (err) {
        console.error("[createQuotation]", err);
        return res.status(500).json({ success: false, message: "Failed to create quotation." });
    }
}

// PATCH /api/vendor/quotations/:id
export async function updateQuotation(req, res) {
    try {
        const vendorId = req.vendor.id;
        const { id }   = req.params;

        const [existing] = await db
            .select({ id: quotations.id, vendorId: quotations.vendorId })
            .from(quotations).where(eq(quotations.id, id)).limit(1);

        if (!existing)                        return res.status(404).json({ success: false, message: "Quotation not found." });
        if (existing.vendorId !== vendorId)   return res.status(403).json({ success: false, message: "Forbidden." });

        const { customerName, phone, email, event, hall, date,
                guests, hallAmount, notes, services } = req.body;

        const updates = { updatedAt: new Date() };

        if (customerName !== undefined) updates.customerName = customerName;
        if (phone        !== undefined) updates.phone        = phone;
        if (email        !== undefined) updates.email        = email;
        if (event        !== undefined) updates.event        = event;
        if (hall         !== undefined) updates.hall         = hall;
        if (date         !== undefined) updates.date         = date ?? null;
        if (guests       !== undefined) updates.guests       = guests;
        if (hallAmount   !== undefined) updates.hallAmount   = hallAmount;
        if (notes        !== undefined) updates.notes        = notes ?? null;
        if (services     !== undefined) updates.services     = services.length ? JSON.stringify(services) : null;

        await db.update(quotations).set(updates).where(eq(quotations.id, id));

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("[updateQuotation]", err);
        return res.status(500).json({ success: false, message: "Failed to update quotation." });
    }
}

// PATCH /api/vendor/quotations/:id/status
export async function updateQuotationStatus(req, res) {
    try {
        const vendorId    = req.vendor.id;
        const { id }      = req.params;
        const { status }  = req.body;

        const [existing] = await db
            .select({ id: quotations.id, vendorId: quotations.vendorId })
            .from(quotations).where(eq(quotations.id, id)).limit(1);

        if (!existing)                      return res.status(404).json({ success: false, message: "Quotation not found." });
        if (existing.vendorId !== vendorId) return res.status(403).json({ success: false, message: "Forbidden." });

        await db.update(quotations)
            .set({ status, updatedAt: new Date() })
            .where(eq(quotations.id, id));

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("[updateQuotationStatus]", err);
        return res.status(500).json({ success: false, message: "Failed to update status." });
    }
}

// DELETE /api/vendor/quotations/:id
export async function deleteQuotation(req, res) {
    try {
        const vendorId = req.vendor.id;
        const { id }   = req.params;

        const [existing] = await db
            .select({ id: quotations.id, vendorId: quotations.vendorId })
            .from(quotations).where(eq(quotations.id, id)).limit(1);

        if (!existing)                      return res.status(404).json({ success: false, message: "Quotation not found." });
        if (existing.vendorId !== vendorId) return res.status(403).json({ success: false, message: "Forbidden." });

        await db.delete(quotations).where(eq(quotations.id, id));

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("[deleteQuotation]", err);
        return res.status(500).json({ success: false, message: "Failed to delete quotation." });
    }
}
