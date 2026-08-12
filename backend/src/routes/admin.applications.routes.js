import { Router } from "express";
import { getApplications, deleteApplication, markApplicationRead } from "../controllers/admin.applications.controller.js";
import { authenticateAdmin } from "../middleware/admin.auth.middleware.js";

const router = Router();
router.use(authenticateAdmin);

router.get("/",           getApplications);
router.delete("/:id",     deleteApplication);
router.patch("/:id/read", markApplicationRead);

export default router;
