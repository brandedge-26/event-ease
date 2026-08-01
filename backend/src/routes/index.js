import { Router } from "express";
import vendorAuthRoutes    from "./vendor.auth.routes.js";
import vendorProfileRoutes from "./vendor.profile.routes.js";
import vendorUploadRoutes  from "./vendor.upload.routes.js";
import vendorInquiryRoutes from "./vendor.inquiry.routes.js";
import vendorHallsRoutes   from "./vendor.halls.routes.js";
import vendorReviewRoutes  from "./vendor.review.routes.js";
import vendorBookingRoutes from "./vendor.booking.routes.js";

const router = Router();

router.use("/vendor/auth",     vendorAuthRoutes);
router.use("/vendor/profile",  vendorProfileRoutes);
router.use("/vendor/upload",   vendorUploadRoutes);
router.use("/vendor/inquiry",  vendorInquiryRoutes);
router.use("/vendor/halls",    vendorHallsRoutes);
router.use("/vendor/review",   vendorReviewRoutes);
router.use("/vendor/bookings", vendorBookingRoutes);

export default router;
