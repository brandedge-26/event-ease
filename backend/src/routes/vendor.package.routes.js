import { Router } from "express";
import { getPackages, createPackage, updatePackage, deletePackage } from "../controllers/vendor.package.controller.js";
import { authenticateVendor } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticateVendor);

router.get("/",      getPackages);
router.post("/",     createPackage);
router.patch("/:id", updatePackage);
router.delete("/:id",deletePackage);

export default router;
