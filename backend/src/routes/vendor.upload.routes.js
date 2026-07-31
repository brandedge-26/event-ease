import { Router } from "express";
import { uploadLogo, uploadGallery } from "../controllers/vendor.upload.controller.js";
import { authenticateVendor } from "../middleware/auth.middleware.js";
import { uploadVendorLogo, uploadVendorGallery } from "../config/multer.js";

const router = Router();

// All upload routes require authentication
router.use(authenticateVendor);

router.post("/logo",    uploadVendorLogo.single("logo"),          uploadLogo);
router.post("/gallery", uploadVendorGallery.array("images", 10),  uploadGallery);

export default router;
