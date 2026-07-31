import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { vendors } from "../db/schema.js";
import { AppError } from "../middleware/errorHandler.js";

// POST /api/vendor/upload/logo
// Protected — multer (uploadVendorLogo) runs before this
export async function uploadLogo(req, res, next) {
    try {
        if (!req.file?.path) {
            throw new AppError("No image file provided.", 400);
        }

        const logoUrl = req.file.path; // Cloudinary secure URL

        await db
            .update(vendors)
            .set({ logoUrl, updatedAt: new Date() })
            .where(eq(vendors.id, req.vendor.id));

        return res.status(200).json({ success: true, logoUrl });
    } catch (err) {
        next(err);
    }
}

// POST /api/vendor/upload/gallery
// Protected — multer (uploadVendorGallery.array) runs before this
export async function uploadGallery(req, res, next) {
    try {
        if (!req.files?.length) {
            throw new AppError("No image files provided.", 400);
        }

        const newUrls = req.files.map((f) => f.path); // Cloudinary secure URLs

        // Fetch existing gallery to append (not replace)
        const [vendor] = await db
            .select({ galleryImages: vendors.galleryImages })
            .from(vendors)
            .where(eq(vendors.id, req.vendor.id))
            .limit(1);

        const existing      = vendor?.galleryImages ?? [];
        const galleryImages = [...existing, ...newUrls].slice(0, 30); // cap at 30

        await db
            .update(vendors)
            .set({ galleryImages, updatedAt: new Date() })
            .where(eq(vendors.id, req.vendor.id));

        return res.status(200).json({ success: true, galleryImages });
    } catch (err) {
        next(err);
    }
}
