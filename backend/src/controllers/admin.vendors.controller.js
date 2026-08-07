import { eq, desc, count } from "drizzle-orm";
import { db } from "../db/index.js";
import { vendors, halls } from "../db/schema.js";

const PAGE_SIZE = 10;

// GET /api/admin/vendors?page=1 — paginated vendors with hall count
export async function getAllVendors(req, res) {
    try {
        const page   = Math.max(1, parseInt(req.query.page) || 1);
        const offset = (page - 1) * PAGE_SIZE;

        const [{ total }] = await db.select({ total: count() }).from(vendors);

        const pageVendors = await db
            .select({
                id:           vendors.id,
                name:         vendors.name,
                slug:         vendors.slug,
                email:        vendors.email,
                phone:        vendors.phone,
                businessType: vendors.businessType,
                city:         vendors.city,
                area:         vendors.area,
                logoUrl:      vendors.logoUrl,
                isVerified:   vendors.isVerified,
                isBlocked:    vendors.isBlocked,
                createdAt:    vendors.createdAt,
            })
            .from(vendors)
            .orderBy(desc(vendors.createdAt))
            .limit(PAGE_SIZE)
            .offset(offset);

        const vendorIds = pageVendors.map(v => v.id);

        const allHalls = vendorIds.length
            ? await db.select({ vendorId: halls.vendorId }).from(halls)
            : [];

        const hallCount = allHalls.reduce((acc, h) => {
            acc[h.vendorId] = (acc[h.vendorId] ?? 0) + 1;
            return acc;
        }, {});

        const result = pageVendors.map(v => ({ ...v, hallCount: hallCount[v.id] ?? 0 }));

        return res.status(200).json({
            success: true,
            vendors: result,
            pagination: {
                page,
                pageSize: PAGE_SIZE,
                total,
                totalPages: Math.ceil(total / PAGE_SIZE),
            },
        });
    } catch (err) {
        console.error("[admin/getAllVendors]", err);
        return res.status(500).json({ success: false, message: "Failed to fetch vendors." });
    }
}

// GET /api/admin/vendors/:id — full vendor detail for drawer
export async function getVendorDetail(req, res) {
    try {
        const { id } = req.params;

        const [vendor] = await db
            .select()
            .from(vendors)
            .where(eq(vendors.id, id))
            .limit(1);

        if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found." });

        const vendorHalls = await db
            .select()
            .from(halls)
            .where(eq(halls.vendorId, id));

        // strip passwordHash & refreshToken
        const { passwordHash, refreshToken, ...safe } = vendor;

        return res.status(200).json({ success: true, vendor: { ...safe, halls: vendorHalls } });
    } catch (err) {
        console.error("[admin/getVendorDetail]", err);
        return res.status(500).json({ success: false, message: "Failed to fetch vendor." });
    }
}

// PATCH /api/admin/vendors/:id/verify — toggle isVerified
export async function verifyVendor(req, res) {
    try {
        const { id } = req.params;

        const [vendor] = await db
            .select({ isVerified: vendors.isVerified })
            .from(vendors)
            .where(eq(vendors.id, id))
            .limit(1);

        if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found." });

        const newStatus = !vendor.isVerified;

        await db
            .update(vendors)
            .set({ isVerified: newStatus, updatedAt: new Date() })
            .where(eq(vendors.id, id));

        return res.status(200).json({ success: true, isVerified: newStatus });
    } catch (err) {
        console.error("[admin/verifyVendor]", err);
        return res.status(500).json({ success: false, message: "Failed to update vendor." });
    }
}

// PATCH /api/admin/vendors/:id/block — toggle isBlocked
export async function blockVendor(req, res) {
    try {
        const { id } = req.params;

        const [vendor] = await db
            .select({ isBlocked: vendors.isBlocked })
            .from(vendors)
            .where(eq(vendors.id, id))
            .limit(1);

        if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found." });

        const newStatus = !vendor.isBlocked;

        await db
            .update(vendors)
            .set({ isBlocked: newStatus, updatedAt: new Date() })
            .where(eq(vendors.id, id));

        return res.status(200).json({ success: true, isBlocked: newStatus });
    } catch (err) {
        console.error("[admin/blockVendor]", err);
        return res.status(500).json({ success: false, message: "Failed to update vendor." });
    }
}

// DELETE /api/admin/vendors/:id
export async function deleteVendor(req, res) {
    try {
        const { id } = req.params;

        const [vendor] = await db
            .select({ id: vendors.id })
            .from(vendors)
            .where(eq(vendors.id, id))
            .limit(1);

        if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found." });

        await db.delete(vendors).where(eq(vendors.id, id));

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("[admin/deleteVendor]", err);
        return res.status(500).json({ success: false, message: "Failed to delete vendor." });
    }
}
