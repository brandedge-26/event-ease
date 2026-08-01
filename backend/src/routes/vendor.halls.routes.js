import { Router } from "express";
import { getHalls, createHall, updateHall, deleteHall } from "../controllers/vendor.halls.controller.js";
import { authenticateVendor } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticateVendor);

router.get("/",       getHalls);
router.post("/",      createHall);
router.patch("/:id",  updateHall);
router.delete("/:id", deleteHall);

export default router;
