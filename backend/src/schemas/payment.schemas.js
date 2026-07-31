import { z } from "zod";

const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Cheque", "Online"];
const DATE_REGEX      = /^\d{4}-\d{2}-\d{2}$/;

export const recordPaymentSchema = z.object({
    bookingId: z.string().min(1, "Booking ID is required"),
    amount:    z.number({ error: "Amount must be a number" }).int().positive("Amount must be positive"),
    method:    z.enum(PAYMENT_METHODS, { error: `Method must be one of: ${PAYMENT_METHODS.join(", ")}` }),
    note:      z.string().optional(),
    date:      z.string().regex(DATE_REGEX, "Date must be YYYY-MM-DD format").optional(),
});
