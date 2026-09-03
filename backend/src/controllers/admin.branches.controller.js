import { eq, desc, count, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { branches, vendors } from "../db/schema.js";

const PAGE_SIZE = 20;

// GET /api/admin/branches?page=1&status=pending|all
export async function getAllBranches(req, res) {
    try {
        const page     = Math.max(1, parseInt(req.query.page) || 1);
        const status   = req.query.status ?? "pending"; // "pending" | "all"
        const offset   = (page - 1) * PAGE_SIZE;

        // Always exclude default branches — only show secondary branches
        const whereClause = status === "pending"
            ? and(eq(branches.isDefault, false), eq(branches.isApproved, false))
            : eq(branches.isDefault, false);

        const [{ total }] = await db
            .select({ total: count() })
            .from(branches)
            .where(whereClause);

        const rows = await db
            .select({
                id:           branches.id,
                name:         branches.name,
                city:         branches.city,
                area:         branches.area,
                address:      branches.address,
                isDefault:    branches.isDefault,
                isActive:     branches.isActive,
                isApproved:   branches.isApproved,
                createdAt:    branches.createdAt,
                vendorId:     branches.vendorId,
                vendorName:   vendors.name,
                vendorEmail:  vendors.email,
                vendorPhone:  vendors.phone,
                vendorSlug:   vendors.slug,
                vendorCity:   vendors.city,
            })
            .from(branches)
            .leftJoin(vendors, eq(branches.vendorId, vendors.id))
            .where(whereClause)
            .orderBy(desc(branches.createdAt))
            .limit(PAGE_SIZE)
            .offset(offset);

        return res.status(200).json({
            success: true,
            branches: rows,
            pagination: {
                page,
                pageSize: PAGE_SIZE,
                total,
                totalPages: Math.ceil(total / PAGE_SIZE),
            },
        });
    } catch (err) {
        console.error("[admin/getAllBranches]", err);
        return res.status(500).json({ success: false, message: "Failed to fetch branches." });
    }
}

// PATCH /api/admin/branches/:id/approve — toggle isApproved
export async function approveBranch(req, res) {
    try {
        const { id } = req.params;

        const [branch] = await db
            .select({ isApproved: branches.isApproved })
            .from(branches)
            .where(eq(branches.id, id))
            .limit(1);

        if (!branch) return res.status(404).json({ success: false, message: "Branch not found." });

        const newStatus = !branch.isApproved;

        await db
            .update(branches)
            .set({ isApproved: newStatus })
            .where(eq(branches.id, id));

        return res.status(200).json({ success: true, isApproved: newStatus });
    } catch (err) {
        console.error("[admin/approveBranch]", err);
        return res.status(500).json({ success: false, message: "Failed to update branch." });
    }
}

// DELETE /api/admin/branches/:id
export async function deleteBranchAdmin(req, res) {
    try {
        const { id } = req.params;

        const [branch] = await db
            .select({ id: branches.id, isDefault: branches.isDefault, vendorId: branches.vendorId })
            .from(branches)
            .where(eq(branches.id, id))
            .limit(1);

        if (!branch) return res.status(404).json({ success: false, message: "Branch not found." });

        // Count total branches for this vendor
        const allBranches = await db
            .select({ id: branches.id })
            .from(branches)
            .where(eq(branches.vendorId, branch.vendorId));

        if (allBranches.length <= 1) {
            return res.status(400).json({ success: false, message: "Cannot delete the vendor's only branch." });
        }

        await db.delete(branches).where(eq(branches.id, id));

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("[admin/deleteBranchAdmin]", err);
        return res.status(500).json({ success: false, message: "Failed to delete branch." });
    }
}
