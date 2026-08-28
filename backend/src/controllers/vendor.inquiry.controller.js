import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db/index.js";
import { inquiries, vendors } from "../db/schema.js";
import { notifyVendor } from "../utils/notifyVendor.js";

// POST /api/vendor/inquiry/:vendorId — public, no auth
export async function createInquiry(req, res) {
    try {
        const { vendorId } = req.params;
        const { name, phone, email, message, eventDate, eventType, guests } = req.body;

        if (!name?.trim() || !phone?.trim() || !message?.trim()) {
            return res.status(400).json({ success: false, message: "Name, phone, and message are required." });
        }

        // Verify vendor exists
        const [vendor] = await db.select({ id: vendors.id }).from(vendors).where(eq(vendors.id, vendorId)).limit(1);
        if (!vendor) {
            return res.status(404).json({ success: false, message: "Vendor not found." });
        }

        const [inquiry] = await db.insert(inquiries).values({
            id:        randomUUID(),
            vendorId,
            name:      name.trim(),
            phone:     phone.trim(),
            email:     email?.trim() || null,
            message:   message.trim(),
            eventDate: eventDate?.trim() || null,
            eventType: eventType?.trim() || null,
            guests:    guests ? Number(guests) : null,
            status:    "new",
        }).returning({ id: inquiries.id });

        notifyVendor({
            vendorId,
            type:  "inquiry",
            title: "New Inquiry Received",
            body:  `${name.trim()} sent you an inquiry${eventType ? ` for ${eventType}` : ""}.`,
            link:  "/vendor/dashboard/inquiries",
            refId: inquiry.id,
        });

        return res.status(201).json({ success: true, inquiryId: inquiry.id });
    } catch (err) {
        console.error("[createInquiry]", err);
        return res.status(500).json({ success: false, message: "Failed to submit inquiry." });
    }
}

// GET /api/vendor/inquiry — auth required, returns vendor's inquiries
export async function getInquiries(req, res) {
    try {
        const rows = await db
            .select()
            .from(inquiries)
            .where(eq(inquiries.vendorId, req.vendor.id))
            .orderBy(desc(inquiries.createdAt));

        return res.status(200).json({ success: true, inquiries: rows });
    } catch (err) {
        console.error("[getInquiries]", err);
        return res.status(500).json({ success: false, message: "Failed to fetch inquiries." });
    }
}

// DELETE /api/vendor/inquiry/:id — auth required
export async function deleteInquiry(req, res) {
    try {
        const { id } = req.params;

        const [row] = await db
            .select({ id: inquiries.id, vendorId: inquiries.vendorId })
            .from(inquiries)
            .where(eq(inquiries.id, id))
            .limit(1);

        if (!row || row.vendorId !== req.vendor.id) {
            return res.status(404).json({ success: false, message: "Inquiry not found." });
        }

        await db.delete(inquiries).where(eq(inquiries.id, id));
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("[deleteInquiry]", err);
        return res.status(500).json({ success: false, message: "Failed to delete inquiry." });
    }
}

// PATCH /api/vendor/inquiry/:id/status — auth required
export async function updateInquiryStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["new", "read", "replied"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status." });
        }

        const [row] = await db
            .select({ id: inquiries.id, vendorId: inquiries.vendorId })
            .from(inquiries)
            .where(eq(inquiries.id, id))
            .limit(1);

        if (!row || row.vendorId !== req.vendor.id) {
            return res.status(404).json({ success: false, message: "Inquiry not found." });
        }

        await db.update(inquiries).set({ status }).where(eq(inquiries.id, id));

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("[updateInquiryStatus]", err);
        return res.status(500).json({ success: false, message: "Failed to update inquiry." });
    }
}
