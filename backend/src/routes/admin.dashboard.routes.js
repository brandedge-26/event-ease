import { Router } from "express";
import { authenticateAdmin } from "../middleware/admin.auth.middleware.js";
import { getDashboardStats } from "../controllers/admin.dashboard.controller.js";

const router = Router();
router.use(authenticateAdmin);
router.get("/stats", getDashboardStats);

export default router;
