import { Router } from "express";
import { getAllBranches, approveBranch, deleteBranchAdmin } from "../controllers/admin.branches.controller.js";
import { authenticateAdmin } from "../middleware/admin.auth.middleware.js";

const router = Router();

router.use(authenticateAdmin);

router.get("/",              getAllBranches);
router.patch("/:id/approve", approveBranch);
router.delete("/:id",        deleteBranchAdmin);

export default router;
