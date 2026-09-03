import { Router } from "express";
import { authenticateVendor } from "../middleware/auth.middleware.js";
import { getBranches, createBranch, updateBranch, deleteBranch, setDefaultBranch } from "../controllers/vendor.branch.controller.js";
import { uploadBranchGallery } from "../config/multer.js";
import { uploadBranchGalleryHandler } from "../controllers/vendor.upload.controller.js";

const router = Router();

router.use(authenticateVendor);

router.get("/",                          getBranches);
router.post("/",                         createBranch);
router.patch("/:id/default",             setDefaultBranch);
router.post("/:id/gallery",              uploadBranchGallery.array("images", 10), uploadBranchGalleryHandler);
router.patch("/:id",                     updateBranch);
router.delete("/:id",                    deleteBranch);

export default router;
