import { Router } from "express";
import { getQuotations, createQuotation, updateQuotation, updateQuotationStatus, deleteQuotation } from "../controllers/vendor.quotation.controller.js";
import { authenticateVendor } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createQuotationSchema, updateQuotationSchema, updateStatusSchema } from "../schemas/quotation.schemas.js";

const router = Router();

router.use(authenticateVendor);

router.get("/",            getQuotations);
router.post("/",           validate(createQuotationSchema),  createQuotation);
router.patch("/:id",       validate(updateQuotationSchema),  updateQuotation);
router.patch("/:id/status",validate(updateStatusSchema),     updateQuotationStatus);
router.delete("/:id",                                        deleteQuotation);

export default router;
