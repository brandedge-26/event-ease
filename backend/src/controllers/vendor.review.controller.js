import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db/index.js";
import { reviews, vendors } from "../db/schema.js";

// POST /api/vendor/review/:vendorId — public
export async function createReview(req, res) {
    try {
        const { vendorId } = req.params;
        const { name, rating, text } = req.body;

        if (!name?.trim() || !rating || !text?.trim()) {
            return res.status(400).json({ success: false, message: "Name, rating, and review text are required." });
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
        console.error("[createReview]", err);
        return res.status(500).json({ success: false, message: "Failed to submit review." });
    }
}
