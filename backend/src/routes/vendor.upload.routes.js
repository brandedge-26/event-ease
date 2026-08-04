import { Router } from "express";
import { uploadLogo, uploadGallery, uploadStaffAvatarHandler } from "../controllers/vendor.upload.controller.js";
import { authenticateVendor } from "../middleware/auth.middleware.js";
import { uploadVendorLogo, uploadVendorGallery, uploadStaffAvatar } from "../config/multer.js";

const router = Router();

// All upload routes require authentication
router.use(authenticateVendor);

router.post("/logo",         uploadVendorLogo.single("logo"),          uploadLogo);
router.post("/gallery",      uploadVendorGallery.array("images", 10),  uploadGallery);
router.post("/staff-avatar", uploadStaffAvatar.single("avatar"),       uploadStaffAvatarHandler);

export default router;
