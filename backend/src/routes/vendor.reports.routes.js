import { Router } from "express";
import { getReports } from "../controllers/vendor.reports.controller.js";
import { authenticateVendor } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authenticateVendor, getReports);

export default router;
