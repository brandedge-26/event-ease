import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary.js";

// ─── Shared limits ─────────────────────────────────────────────────────────────
const IMG_LIMIT    = { fileSize: 10 * 1024 * 1024 }; // 10 MB
const AVATAR_LIMIT = { fileSize:  5 * 1024 * 1024 }; // 5 MB
const FORMATS      = ["jpg", "jpeg", "png", "webp"];

// ─── Vendor logo ──────────────────────────────────────────────────────────────
// eventease/vendors/{vendorId}/logo
const vendorLogoStorage = new CloudinaryStorage({
    cloudinary,
    params: async (req) => ({
        folder:           `eventease/vendors/${req.vendor?.id ?? "unknown"}/logo`,
        allowed_formats:  FORMATS,
        transformation:   [{ width: 400, height: 400, crop: "fill", quality: "auto" }],
    }),
});

export const uploadVendorLogo = multer({
    storage: vendorLogoStorage,
    limits:  AVATAR_LIMIT,
});

// ─── Vendor gallery (hall images) ─────────────────────────────────────────────
// eventease/vendors/{vendorId}/gallery
const vendorGalleryStorage = new CloudinaryStorage({
    cloudinary,
    params: async (req) => ({
        folder:           `eventease/vendors/${req.vendor?.id ?? "unknown"}/gallery`,
        allowed_formats:  FORMATS,
        transformation:   [{ width: 1200, height: 800, crop: "limit", quality: "auto" }],
    }),
});

export const uploadVendorGallery = multer({
    storage: vendorGalleryStorage,
    limits:  IMG_LIMIT,
});

// Multiple gallery images (max 10)
export const uploadVendorGalleryMultiple = multer({
    storage: vendorGalleryStorage,
    limits:  IMG_LIMIT,
}).array("images", 10);

// ─── Staff avatars ────────────────────────────────────────────────────────────
// eventease/vendors/{vendorId}/staff
const staffAvatarStorage = new CloudinaryStorage({
    cloudinary,
    params: async (req) => ({
        folder:           `eventease/vendors/${req.vendor?.id ?? "unknown"}/staff`,
        allowed_formats:  FORMATS,
        transformation:   [{ width: 300, height: 300, crop: "fill", gravity: "face", quality: "auto" }],
    }),
});

export const uploadStaffAvatar = multer({
    storage: staffAvatarStorage,
    limits:  AVATAR_LIMIT,
});
