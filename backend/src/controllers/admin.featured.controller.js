import { eq, desc, asc, count, and, or, ilike } from "drizzle-orm";
import { db } from "../db/index.js";
import { vendors } from "../db/schema.js";

const PAGE_SIZE = 10;

// GET /api/admin/featured — featured (all) + unfeatured (paginated + searchable)
export async function getFeaturedPage(req, res) {
    try {
        const page   = Math.max(1, parseInt(req.query.page) || 1);
        const offset = (page - 1) * PAGE_SIZE;
        const search = req.query.search?.trim() ?? "";

        // Featured — always return all (typically small number)
        const featured = await db
            .select({
                id:         vendors.id,
                name:       vendors.name,
                slug:       vendors.slug,
                city:       vendors.city,
                area:       vendors.area,
                logoUrl:    vendors.logoUrl,
                isVerified: vendors.isVerified,
                isBlocked:  vendors.isBlocked,
                isFeatured: vendors.isFeatured,
                featuredAt: vendors.featuredAt,
            })
            .from(vendors)
            .where(eq(vendors.isFeatured, true))
            .orderBy(desc(vendors.featuredAt));

        // Unfeatured — paginated + optional search
        const searchFilter = search
            ? or(ilike(vendors.name, `%${search}%`), ilike(vendors.city, `%${search}%`))
            : undefined;

        const notFeaturedFilter = eq(vendors.isFeatured, false);
        const whereClause = searchFilter
            ? and(notFeaturedFilter, searchFilter)
            : notFeaturedFilter;

        const [{ total }] = await db
            .select({ total: count() })
            .from(vendors)
            .where(whereClause);

        const unfeatured = await db
            .select({
                id:         vendors.id,
                name:       vendors.name,
                slug:       vendors.slug,
                city:       vendors.city,
                area:       vendors.area,
                logoUrl:    vendors.logoUrl,
                isVerified: vendors.isVerified,
                isBlocked:  vendors.isBlocked,
                isFeatured: vendors.isFeatured,
                featuredAt: vendors.featuredAt,
            })
            .from(vendors)
            .where(whereClause)
            .orderBy(asc(vendors.name))
            .limit(PAGE_SIZE)
            .offset(offset);

        return res.json({
            success: true,
            featured,
            unfeatured,
            pagination: {
                page,
                pageSize: PAGE_SIZE,
                total: Number(total),
                totalPages: Math.ceil(Number(total) / PAGE_SIZE),
            },
        });
    } catch (err) {
        console.error("[admin getFeaturedPage]", err);
        return res.status(500).json({ success: false, message: "Failed to load featured vendors." });
    }
}

// PATCH /api/admin/featured/:id/toggle
export async function toggleFeatured(req, res) {
    try {
        const { id } = req.params;

        const [vendor] = await db
            .select({ id: vendors.id, isFeatured: vendors.isFeatured })
            .from(vendors)
            .where(eq(vendors.id, id))
            .limit(1);

        if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found." });

        const nowFeatured = !vendor.isFeatured;
        await db.update(vendors).set({
            isFeatured: nowFeatured,
            featuredAt: nowFeatured ? new Date() : null,
        }).where(eq(vendors.id, id));

        return res.json({ success: true, isFeatured: nowFeatured });
    } catch (err) {
        console.error("[admin toggleFeatured]", err);
        return res.status(500).json({ success: false, message: "Failed to update featured status." });
    }
}

// GET /api/vendor/profile/featured — public endpoint for home page
export async function getPublicFeatured(req, res) {
    try {
        const featured = await db
            .select({
                id:           vendors.id,
                name:         vendors.name,
                slug:         vendors.slug,
                businessType: vendors.businessType,
                tagline:      vendors.tagline,
                city:         vendors.city,
                area:         vendors.area,
                logoUrl:       vendors.logoUrl,
                galleryImages: vendors.galleryImages,
                isVerified:    vendors.isVerified,
                featuredAt:    vendors.featuredAt,
            })
            .from(vendors)
            .where(eq(vendors.isFeatured, true))
            .orderBy(desc(vendors.featuredAt));

        return res.json({ success: true, vendors: featured });
    } catch (err) {
        console.error("[getPublicFeatured]", err);
        return res.status(500).json({ success: false, vendors: [] });
    }
}
