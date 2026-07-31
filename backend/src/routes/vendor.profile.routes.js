import { Router } from "express";
import { getAllVendors, getPublicProfile, getOwnProfile, updateOwnProfile } from "../controllers/vendor.profile.controller.js";
import { authenticateVendor } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/",     getAllVendors);
// /me must come before /:slug so "me" isn't treated as a slug
router.get("/me",   authenticateVendor, getOwnProfile);
router.patch("/me", authenticateVendor, updateOwnProfile);
router.get("/:slug", getPublicProfile);

export default router;
