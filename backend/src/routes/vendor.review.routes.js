import { Router } from "express";
import { createReview } from "../controllers/vendor.review.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { createReviewSchema } from "../schemas/review.schemas.js";

const router = Router();
router.post("/:vendorId", validate(createReviewSchema), createReview);
export default router;
