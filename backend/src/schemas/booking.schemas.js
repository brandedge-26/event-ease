import { z } from "zod";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}$/;

const serviceSchema = z.object({
    label: z.string().max(200),
    unit:  z.string().max(100).optional(),
    price: z.string().max(20).optional(),
});

export const createBookingSchema = z.object({
    customerName: z.string().min(2, "Customer name is required").max(100),
    phone:        z.string().max(20).optional().default(""),
    event:        z.string().min(1, "Event type is required").max(100),
    hall:         z.string().min(1, "Hall is required").max(100),
    date:         z.string().regex(DATE_REGEX, "Date must be YYYY-MM-DD"),
    timeFrom:     z.string().regex(TIME_REGEX, "Start time must be HH:MM").optional(),
    timeTo:       z.string().regex(TIME_REGEX, "End time must be HH:MM").optional(),
    guests:       z.number({ error: "Guests must be a number" }).int().nonnegative().optional().default(0),
    amount:       z.number({ error: "Amount must be a number" }).int().nonnegative().optional().default(0),
    hallAmount:   z.number({ error: "Hall amount must be a number" }).int().nonnegative().optional().default(0),
    paid:         z.number({ error: "Paid must be a number" }).int().nonnegative().optional().default(0),
    status:       z.enum(["confirmed", "pending", "cancelled", "blocked"]).optional().default("pending"),
    notes:        z.string().max(5000).optional(),
    services:     z.array(serviceSchema).optional().default([]),
});

export const updateBookingSchema = z.object({
    customerName: z.string().min(2).max(100).optional(),
    phone:        z.string().max(20).optional(),
    event:        z.string().min(1).max(100).optional(),
    hall:         z.string().min(1).max(100).optional(),
    date:         z.string().regex(DATE_REGEX).optional(),
    timeFrom:     z.string().regex(TIME_REGEX).optional(),
    timeTo:       z.string().regex(TIME_REGEX).optional(),
    guests:       z.number().int().nonnegative().optional(),
    amount:       z.number().int().nonnegative().optional(),
    hallAmount:   z.number().int().nonnegative().optional(),
    paid:         z.number().int().nonnegative().optional(),
    status:       z.enum(["confirmed", "pending", "cancelled", "blocked"]).optional(),
    notes:        z.string().max(5000).optional(),
    services:     z.array(serviceSchema).optional(),
}).refine((d) => Object.keys(d).length > 0, { message: "At least one field is required" });

export const addPaymentSchema = z.object({
    amount: z.number({ error: "Amount must be a number" }).int().positive("Amount must be positive"),
    method: z.enum(["Cash", "Bank Transfer", "Cheque", "Online"]).optional().default("Cash"),
    note:   z.string().max(500).optional(),
    date:   z.string().regex(DATE_REGEX, "Date must be YYYY-MM-DD").optional(),
});

export const editPaymentSchema = z.object({
    amount: z.number({ error: "Amount must be a number" }).int().positive("Amount must be positive").optional(),
    method: z.enum(["Cash", "Bank Transfer", "Cheque", "Online"]).optional(),
    note:   z.string().max(500).optional(),
    date:   z.string().regex(DATE_REGEX, "Date must be YYYY-MM-DD").optional(),
}).refine((d) => Object.keys(d).length > 0, { message: "At least one field is required" });
