import { eq, desc, count } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db/index.js";
import { reviews, vendors } from "../db/schema.js";

const PAGE_SIZE = 10;

// GET /api/admin/reviews?page=1
export async function getAllReviews(req, res) {
    try {
        const page   = Math.max(1, parseInt(req.query.page) || 1);
        const offset = (page - 1) * PAGE_SIZE;

        const [{ total }] = await db.select({ total: count() }).from(reviews);

        const rows = await db
            .select({
                id:         reviews.id,
                name:       reviews.name,
                rating:     reviews.rating,
                text:       reviews.text,
                createdAt:  reviews.createdAt,
                vendorId:   reviews.vendorId,
                vendorName: vendors.name,
                vendorSlug: vendors.slug,
            })
            .from(reviews)
            .leftJoin(vendors, eq(reviews.vendorId, vendors.id))
            .orderBy(desc(reviews.createdAt))
            .limit(PAGE_SIZE)
            .offset(offset);

        return res.json({
            success: true,
            reviews: rows,
            pagination: { page, pageSize: PAGE_SIZE, total, totalPages: Math.ceil(total / PAGE_SIZE) },
        });
    } catch (err) {
        console.error("[admin getAllReviews]", err);
        return res.status(500).json({ success: false, message: "Failed to fetch reviews." });
    }
}

// GET /api/admin/reviews/vendors — slim list for the "add review" dropdown
export async function getVendorList(req, res) {
    try {
        const list = await db
            .select({ id: vendors.id, name: vendors.name })
            .from(vendors)
            .orderBy(vendors.name);
        return res.json({ success: true, vendors: list });
    } catch (err) {
        console.error("[admin getVendorList]", err);
        return res.status(500).json({ success: false, message: "Failed to fetch vendors." });
    }
}

// POST /api/admin/reviews — create review for any vendor
export async function createReview(req, res) {
    try {
        const { vendorId, name, rating, text } = req.body;

        if (!vendorId || !name?.trim() || !text?.trim() || !rating) {
            return res.status(400).json({ success: false, message: "vendorId, name, rating, and text are required." });
        }
        const r = Number(rating);
        if (r < 1 || r > 5) {
            return res.status(400).json({ success: false, message: "Rating must be between 1 and 5." });
        }

        const [vendor] = await db.select({ id: vendors.id }).from(vendors).where(eq(vendors.id, vendorId)).limit(1);
        if (!vendor) {
            return res.status(404).json({ success: false, message: "Vendor not found." });
        }

        const [review] = await db.insert(reviews).values({
            id:       randomUUID(),
            vendorId,
            name:     name.trim(),
            rating:   r,
            text:     text.trim(),
        }).returning();

        return res.status(201).json({ success: true, review });
    } catch (err) {
        console.error("[admin createReview]", err);
        return res.status(500).json({ success: false, message: "Failed to create review." });
    }
}

// PATCH /api/admin/reviews/:id
export async function updateReview(req, res) {
    try {
        const { id } = req.params;
        const { name, rating, text } = req.body;

        const [existing] = await db.select({ id: reviews.id }).from(reviews).where(eq(reviews.id, id)).limit(1);
        if (!existing) return res.status(404).json({ success: false, message: "Review not found." });

        const updates = {};
        if (name   !== undefined) updates.name   = String(name).trim();
        if (text   !== undefined) updates.text   = String(text).trim();
        if (rating !== undefined) {
            const r = Number(rating);
            if (r < 1 || r > 5) return res.status(400).json({ success: false, message: "Rating must be 1–5." });
            updates.rating = r;
        }

        await db.update(reviews).set(updates).where(eq(reviews.id, id));
        return res.json({ success: true });
    } catch (err) {
        console.error("[admin updateReview]", err);
        return res.status(500).json({ success: false, message: "Failed to update review." });
    }
}

// DELETE /api/admin/reviews/:id
export async function deleteReview(req, res) {
    try {
        const { id } = req.params;
        const [existing] = await db.select({ id: reviews.id }).from(reviews).where(eq(reviews.id, id)).limit(1);
        if (!existing) return res.status(404).json({ success: false, message: "Review not found." });
        await db.delete(reviews).where(eq(reviews.id, id));
        return res.json({ success: true });
    } catch (err) {
        console.error("[admin deleteReview]", err);
        return res.status(500).json({ success: false, message: "Failed to delete review." });
    }
}
