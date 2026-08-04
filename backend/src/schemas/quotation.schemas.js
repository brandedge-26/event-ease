import { z } from "zod";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const serviceSchema = z.object({
    id:    z.string().max(100),
    label: z.string().max(200),
    unit:  z.string().max(100).optional().default(""),
    price: z.string().max(20).optional().default(""),
});

export const createQuotationSchema = z.object({
    customerName: z.string().min(2, "Customer name is required").max(100),
    phone:        z.string().max(20).optional().default(""),
    email:        z.string().max(200).optional().default(""),
    event:        z.string().min(1, "Event type is required").max(100),
    hall:         z.string().min(1, "Hall is required").max(100),
    date:         z.preprocess(
                    v => (v === "" ? undefined : v),
                    z.string().regex(DATE_REGEX, "Date must be YYYY-MM-DD").optional()
                  ),
    guests:       z.number().int().nonnegative().optional().default(0),
    hallAmount:   z.number().int().nonnegative().optional().default(0),
    notes:        z.string().max(5000).optional(),
    services:     z.array(serviceSchema).optional().default([]),
});

export const updateQuotationSchema = z.object({
    customerName: z.string().min(2).max(100).optional(),
    phone:        z.string().max(20).optional(),
    email:        z.string().max(200).optional(),
    event:        z.string().min(1).max(100).optional(),
    hall:         z.string().min(1).max(100).optional(),
    date:         z.preprocess(
                    v => (v === "" ? undefined : v),
                    z.string().regex(DATE_REGEX).optional()
                  ),
    guests:       z.number().int().nonnegative().optional(),
    hallAmount:   z.number().int().nonnegative().optional(),
    notes:        z.string().max(5000).optional(),
    services:     z.array(serviceSchema).optional(),
}).refine(d => Object.keys(d).length > 0, { message: "At least one field is required" });

export const updateStatusSchema = z.object({
    status: z.enum(["pending", "accepted", "rejected"]),
});
