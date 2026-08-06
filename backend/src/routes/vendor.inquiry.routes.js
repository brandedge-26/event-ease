import { Router } from "express";
import { createInquiry, getInquiries, updateInquiryStatus, deleteInquiry } from "../controllers/vendor.inquiry.controller.js";
import { authenticateVendor } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createInquirySchema, updateInquiryStatusSchema } from "../schemas/inquiry.schemas.js";

const router = Router();

// Public — anyone can send an inquiry to a vendor
router.post("/:vendorId",       validate(createInquirySchema),       createInquiry);

// Auth required — vendor manages their own inquiries
router.get("/",                 authenticateVendor,                   getInquiries);
router.patch("/:id/status",     authenticateVendor, validate(updateInquiryStatusSchema), updateInquiryStatus);
router.delete("/:id",           authenticateVendor,                                        deleteInquiry);

export default router;
