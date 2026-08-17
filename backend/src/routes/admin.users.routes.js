import { Router } from "express";
import { authenticateAdmin } from "../middleware/admin.auth.middleware.js";
import { getUsers, toggleBlock, deleteUser } from "../controllers/admin.users.controller.js";

const router = Router();
router.use(authenticateAdmin);

router.get("/",              getUsers);
router.patch("/:id/block",  toggleBlock);
router.delete("/:id",       deleteUser);

export default router;
