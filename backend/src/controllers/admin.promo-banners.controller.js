import { eq, asc, or, isNull, gt } from "drizzle-orm";
import { db } from "../db/index.js";
import { promoBanners } from "../db/schema.js";
import { AppError } from "../middleware/errorHandler.js";

// GET /api/admin/promo-banners — public, lists active non-expired banners
export async function listBanners(req, res, next) {
    try {
        const now  = new Date();
        const rows = await db
            .select()
            .from(promoBanners)
            .where(eq(promoBanners.isActive, true))
            .orderBy(asc(promoBanners.sortOrder), asc(promoBanners.createdAt));

        // Filter out expired ones (drizzle doesn't easily compose OR with null check in one where)
        const active = rows.filter(b => !b.expiresAt || b.expiresAt > now);
        return res.json({ success: true, banners: active });
    } catch (err) { next(err); }
}

// GET /api/admin/promo-banners/all — admin, lists all banners including inactive
export async function listAllBanners(req, res, next) {
    try {
        const rows = await db
            .select()
            .from(promoBanners)
            .orderBy(asc(promoBanners.sortOrder), asc(promoBanners.createdAt));
        return res.json({ success: true, banners: rows });
    } catch (err) { next(err); }
}

// POST /api/admin/promo-banners — admin, create banner
export async function createBanner(req, res, next) {
    try {
        const { title, subtitle, ctaText, ctaLink, sortOrder, durationDays, expiresAt } = req.body;
        if (!title || !ctaLink) throw new AppError("title and ctaLink are required", 400);
        if (!req.file?.path)    throw new AppError("Image is required", 400);

        // Resolve expiry
        let expiry = null;
        if (expiresAt) {
            expiry = new Date(expiresAt);
        } else if (durationDays && parseInt(durationDays) > 0) {
            expiry = new Date(Date.now() + parseInt(durationDays) * 24 * 60 * 60 * 1000);
        }

        const id = crypto.randomUUID();
        await db.insert(promoBanners).values({
            id,
            title,
            subtitle:  subtitle  || null,
            ctaText:   ctaText   || null,
            ctaLink,
            imageUrl:  req.file.path,
            sortOrder: sortOrder ? parseInt(sortOrder) : 0,
            expiresAt: expiry,
        });

        const [banner] = await db.select().from(promoBanners).where(eq(promoBanners.id, id));
        return res.status(201).json({ success: true, banner });
    } catch (err) { next(err); }
}

// PATCH /api/admin/promo-banners/:id — update banner fields (image optional)
export async function updateBanner(req, res, next) {
    try {
        const { id } = req.params;
        const [existing] = await db.select().from(promoBanners).where(eq(promoBanners.id, id)).limit(1);
        if (!existing) throw new AppError("Banner not found", 404);

        const { title, subtitle, ctaText, ctaLink, durationDays, expiresAt } = req.body;

        let expiry = existing.expiresAt; // keep existing by default
        if (expiresAt === "none") {
            expiry = null;
        } else if (expiresAt) {
            expiry = new Date(expiresAt);
        } else if (durationDays !== undefined) {
            expiry = parseInt(durationDays) > 0
                ? new Date(Date.now() + parseInt(durationDays) * 24 * 60 * 60 * 1000)
                : null;
        }

        const updates = {
            title:     title     ?? existing.title,
            subtitle:  subtitle  !== undefined ? (subtitle  || null) : existing.subtitle,
            ctaText:   ctaText   !== undefined ? (ctaText   || null) : existing.ctaText,
            ctaLink:   ctaLink   ?? existing.ctaLink,
            imageUrl:  req.file?.path ?? existing.imageUrl,
            expiresAt: expiry,
        };

        await db.update(promoBanners).set(updates).where(eq(promoBanners.id, id));
        const [banner] = await db.select().from(promoBanners).where(eq(promoBanners.id, id));
        return res.json({ success: true, banner });
    } catch (err) { next(err); }
}

// PATCH /api/admin/promo-banners/:id/toggle — toggle isActive
export async function toggleBanner(req, res, next) {
    try {
        const { id } = req.params;
        const [existing] = await db.select().from(promoBanners).where(eq(promoBanners.id, id)).limit(1);
        if (!existing) throw new AppError("Banner not found", 404);

        await db.update(promoBanners).set({ isActive: !existing.isActive }).where(eq(promoBanners.id, id));
        return res.json({ success: true, isActive: !existing.isActive });
    } catch (err) { next(err); }
}

// DELETE /api/admin/promo-banners/:id
export async function deleteBanner(req, res, next) {
    try {
        const { id } = req.params;
        await db.delete(promoBanners).where(eq(promoBanners.id, id));
        return res.json({ success: true });
    } catch (err) { next(err); }
}
