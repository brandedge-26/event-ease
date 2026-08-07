import { Router } from "express";
import { authenticateAdmin } from "../middleware/admin.auth.middleware.js";
import {
    getAllReviews,
    getVendorList,
    createReview,
    updateReview,
    deleteReview,
} from "../controllers/admin.reviews.controller.js";

const router = Router();
router.use(authenticateAdmin);

router.get("/",         getAllReviews);
router.get("/vendors",  getVendorList);
router.post("/",        createReview);
router.patch("/:id",    updateReview);
router.delete("/:id",   deleteReview);

export default router;
