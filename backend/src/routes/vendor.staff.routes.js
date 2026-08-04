import { Router } from "express";
import { getStaff, createStaff, updateStaff, deleteStaff } from "../controllers/vendor.staff.controller.js";
import { authenticateVendor } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createStaffSchema, updateStaffSchema } from "../schemas/staff.schemas.js";

const router = Router();

router.use(authenticateVendor);

router.get("/",    getStaff);
router.post("/",   validate(createStaffSchema), createStaff);
router.patch("/:id", validate(updateStaffSchema), updateStaff);
router.delete("/:id", deleteStaff);

export default router;
