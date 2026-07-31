import { z } from "zod";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}$/;

export const createBookingSchema = z.object({
    customerName: z.string().min(2, "Customer name is required"),
    phone:        z.string().min(10, "Valid phone number is required"),
    event:        z.string().min(1, "Event type is required"),
    hall:         z.string().min(1, "Hall is required"),
    date:         z.string().regex(DATE_REGEX, "Date must be in YYYY-MM-DD format"),
    timeFrom:     z.string().regex(TIME_REGEX, "Start time must be in HH:MM format").optional(),
    timeTo:       z.string().regex(TIME_REGEX, "End time must be in HH:MM format").optional(),
    guests:       z.number().int().nonnegative().optional().default(0),
    amount:       z.number().int().nonnegative().optional().default(0),
    paid:         z.number().int().nonnegative().optional().default(0),
    status:       z.enum(["confirmed", "pending", "cancelled"]).optional().default("pending"),
    notes:        z.string().optional(),
    customerId:   z.string().optional(),
});

export const updateBookingSchema = z.object({
    customerName: z.string().min(2).optional(),
    phone:        z.string().min(10).optional(),
    event:        z.string().min(1).optional(),
    hall:         z.string().min(1).optional(),
    date:         z.string().regex(DATE_REGEX).optional(),
    timeFrom:     z.string().regex(TIME_REGEX).optional(),
    timeTo:       z.string().regex(TIME_REGEX).optional(),
    guests:       z.number().int().nonnegative().optional(),
    amount:       z.number().int().nonnegative().optional(),
    paid:         z.number().int().nonnegative().optional(),
    status:       z.enum(["confirmed", "pending", "cancelled"]).optional(),
    notes:        z.string().optional(),
}).refine((d) => Object.keys(d).length > 0, { message: "At least one field is required" });
