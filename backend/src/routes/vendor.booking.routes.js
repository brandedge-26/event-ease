import { Router } from "express";
import { getBookings, createBooking, updateBooking, deleteBooking, cancelBooking, addPayment, editPayment, deletePayment } from "../controllers/vendor.booking.controller.js";
import { authenticateVendor } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createBookingSchema, updateBookingSchema, addPaymentSchema, editPaymentSchema } from "../schemas/booking.schemas.js";

const router = Router();

// All booking routes require auth — vendors manage their own bookings
router.use(authenticateVendor);

router.get("/",                                getBookings);
router.post("/",                               validate(createBookingSchema),  createBooking);
router.patch("/:id",                           validate(updateBookingSchema),  updateBooking);
router.delete("/:id",                                                          deleteBooking);
router.patch("/:id/cancel",                                                    cancelBooking);
router.post("/:id/payments",                   validate(addPaymentSchema),     addPayment);
router.patch("/:id/payments/:paymentId",       validate(editPaymentSchema),    editPayment);
router.delete("/:id/payments/:paymentId",                                      deletePayment);

export default router;
