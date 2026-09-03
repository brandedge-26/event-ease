import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { vendors, branches } from "../db/schema.js";
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

// POST /api/vendor/upload/staff-avatar
export async function uploadStaffAvatarHandler(req, res, next) {
    try {
        if (!req.file?.path) {
            return res.status(400).json({ success: false, message: "No image file provided." });
        }
        const avatarUrl = req.file.path; // Cloudinary secure URL
        return res.status(200).json({ success: true, avatarUrl });
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

// POST /api/vendor/branches/:id/gallery
export async function uploadBranchGalleryHandler(req, res, next) {
    try {
        if (!req.files?.length) {
            return res.status(400).json({ success: false, message: "No image files provided." });
        }

        const branchId = req.params.id;
        const newUrls  = req.files.map(f => f.path);

        const [branch] = await db
            .select({ galleryImages: branches.galleryImages, vendorId: branches.vendorId })
            .from(branches)
            .where(and(eq(branches.id, branchId), eq(branches.vendorId, req.vendor.id)))
            .limit(1);

        if (!branch) return res.status(404).json({ success: false, message: "Branch not found." });

        const existing      = branch.galleryImages ?? [];
        const galleryImages = [...existing, ...newUrls].slice(0, 20); // cap at 20

        await db.update(branches).set({ galleryImages }).where(eq(branches.id, branchId));

        return res.status(200).json({ success: true, galleryImages });
    } catch (err) {
        next(err);
    }
}
