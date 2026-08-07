import { Router } from "express";
import { getAllVendors, getVendorDetail, verifyVendor, blockVendor, deleteVendor } from "../controllers/admin.vendors.controller.js";
import { authenticateAdmin } from "../middleware/admin.auth.middleware.js";

const router = Router();

router.use(authenticateAdmin);

router.get("/",                  getAllVendors);
router.get("/:id",               getVendorDetail);
router.patch("/:id/verify",      verifyVendor);
router.patch("/:id/block",       blockVendor);
router.delete("/:id",            deleteVendor);

export default router;
