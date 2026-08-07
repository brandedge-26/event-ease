import { Router } from "express";
import { authenticateAdmin } from "../middleware/admin.auth.middleware.js";
import { getAllBookings, getBookingDetail, deleteBooking } from "../controllers/admin.bookings.controller.js";

const router = Router();

router.use(authenticateAdmin);

router.get("/",    getAllBookings);
router.get("/:id", getBookingDetail);
router.delete("/:id", deleteBooking);

export default router;
