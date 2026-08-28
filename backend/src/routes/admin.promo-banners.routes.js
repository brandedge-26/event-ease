import { Router } from "express";
import { listBanners, listAllBanners, createBanner, updateBanner, toggleBanner, deleteBanner } from "../controllers/admin.promo-banners.controller.js";
import { authenticateAdmin } from "../middleware/admin.auth.middleware.js";
import { uploadPromoBanner } from "../config/multer.js";

const router = Router();

router.get("/",         listBanners);                                              // public
router.get("/all",      authenticateAdmin, listAllBanners);                        // admin
router.post("/",        authenticateAdmin, uploadPromoBanner.single("image"), createBanner);
router.patch("/:id",        authenticateAdmin, uploadPromoBanner.single("image"), updateBanner);
router.patch("/:id/toggle", authenticateAdmin, toggleBanner);
router.delete("/:id",   authenticateAdmin, deleteBanner);

export default router;
