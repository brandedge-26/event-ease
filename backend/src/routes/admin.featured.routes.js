import { Router } from "express";
import { authenticateAdmin } from "../middleware/admin.auth.middleware.js";
import { getFeaturedPage, toggleFeatured } from "../controllers/admin.featured.controller.js";

const router = Router();
router.use(authenticateAdmin);

router.get("/",           getFeaturedPage);
router.patch("/:id/toggle", toggleFeatured);

export default router;
