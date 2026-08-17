import { eq, desc, count, or, ilike } from "drizzle-orm";
import { db } from "../db/index.js";
import { vendors, marketplaceUsers } from "../db/schema.js";

const PAGE_SIZE = 15;

// GET /api/admin/users?page=1&tab=all|vendors|users&q=search
export async function getUsers(req, res) {
    try {
        const page   = Math.max(1, parseInt(req.query.page) || 1);
        const tab    = req.query.tab ?? "all";
        const q      = req.query.q?.trim() ?? "";
        const offset = (page - 1) * PAGE_SIZE;

        // ── Fetch vendors ─────────────────────────────────────────────────────
        let vendorRows = [];
        if (tab === "all" || tab === "vendors") {
            vendorRows = await db
                .select({
                    id:           vendors.id,
                    name:         vendors.name,
                    email:        vendors.email,
                    city:         vendors.city,
                    businessType: vendors.businessType,
                    isVerified:   vendors.isVerified,
                    isBlocked:    vendors.isBlocked,
                    logoUrl:      vendors.logoUrl,
                    createdAt:    vendors.createdAt,
                })
                .from(vendors)
                .orderBy(desc(vendors.createdAt));
        }

        // ── Fetch marketplace users ───────────────────────────────────────────
        let userRows = [];
        if (tab === "all" || tab === "users") {
            userRows = await db
                .select({
                    id:        marketplaceUsers.id,
                    name:      marketplaceUsers.name,
                    email:     marketplaceUsers.email,
                    avatarUrl: marketplaceUsers.avatarUrl,
                    isBlocked: marketplaceUsers.isBlocked,
                    createdAt: marketplaceUsers.createdAt,
                })
                .from(marketplaceUsers)
                .orderBy(desc(marketplaceUsers.createdAt));
        }

        // ── Merge & tag ───────────────────────────────────────────────────────
        const vendors_tagged = vendorRows.map(v => ({ ...v, _type: "vendor" }));
        const users_tagged   = userRows.map(u => ({ ...u, _type: "user", city: null, businessType: null }));

        let combined = [...vendors_tagged, ...users_tagged]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // ── Search filter ─────────────────────────────────────────────────────
        if (q) {
            const lq = q.toLowerCase();
            combined = combined.filter(u =>
                u.name.toLowerCase().includes(lq) ||
                u.email.toLowerCase().includes(lq)
            );
        }

        // ── Stats ─────────────────────────────────────────────────────────────
        const totalVendors  = vendorRows.length;
        const totalUsers    = userRows.length;
        const totalBlocked  = combined.filter(u => u.isBlocked).length;

        // ── Paginate ──────────────────────────────────────────────────────────
        const total      = combined.length;
        const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        const paginated  = combined.slice(offset, offset + PAGE_SIZE);

        return res.json({
            success: true,
            users: paginated,
            stats: { total: totalVendors + totalUsers, totalVendors, totalUsers, totalBlocked },
            pagination: { page, pageSize: PAGE_SIZE, total, totalPages },
        });
    } catch (err) {
        console.error("[admin getUsers]", err);
        return res.status(500).json({ success: false, message: "Failed to fetch users." });
    }
}

// PATCH /api/admin/users/:id/block  — toggle block for vendor or marketplace user
export async function toggleBlock(req, res) {
    try {
        const { id }   = req.params;
        const { type, blocked } = req.body; // type: "vendor" | "user"

        if (type === "vendor") {
            await db.update(vendors).set({ isBlocked: blocked }).where(eq(vendors.id, id));
        } else {
            await db.update(marketplaceUsers).set({ isBlocked: blocked }).where(eq(marketplaceUsers.id, id));
        }

        return res.json({ success: true });
    } catch (err) {
        console.error("[admin toggleBlock]", err);
        return res.status(500).json({ success: false });
    }
}

// DELETE /api/admin/users/:id
export async function deleteUser(req, res) {
    try {
        const { id }   = req.params;
        const { type } = req.body;

        if (type === "vendor") {
            await db.delete(vendors).where(eq(vendors.id, id));
        } else {
            await db.delete(marketplaceUsers).where(eq(marketplaceUsers.id, id));
        }

        return res.json({ success: true });
    } catch (err) {
        console.error("[admin deleteUser]", err);
        return res.status(500).json({ success: false });
    }
}
