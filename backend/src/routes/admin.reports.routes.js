import { Router } from "express";
import { authenticateAdmin } from "../middleware/admin.auth.middleware.js";
import { getAdminReports } from "../controllers/admin.reports.controller.js";

const router = Router();
router.use(authenticateAdmin);

router.get("/", getAdminReports);

export default router;
