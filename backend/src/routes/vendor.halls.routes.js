import { Router } from "express";
import { createHall, updateHall, deleteHall } from "../controllers/vendor.halls.controller.js";
import { authenticateVendor } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticateVendor);

router.post("/",      createHall);
router.put("/:id",    updateHall);
router.delete("/:id", deleteHall);

export default router;
