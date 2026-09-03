import { Router } from "express";
import { getOverview } from "../controllers/vendor.overview.controller.js";
import { authenticateVendorNoBranch } from "../middleware/auth.middleware.js";

const router = Router();

// No branch validation — overview always aggregates across all branches
router.get("/", authenticateVendorNoBranch, getOverview);

export default router;
