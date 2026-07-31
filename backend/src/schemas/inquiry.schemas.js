import { z } from "zod";

const EVENT_TYPES = ["Wedding", "Engagement", "Birthday", "Corporate", "Mehndi Night", "Anniversary", "Walima", "Other"];

export const createInquirySchema = z.object({
    name:      z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
    phone:     z.string().min(10, "Valid phone number is required").max(20, "Phone number too long"),
    message:   z.string().max(2000, "Message must be under 2000 characters").optional(),
    eventDate: z.string().max(20).optional(),
    eventType: z.enum(EVENT_TYPES).optional(),
    guests:    z.number({ error: "Guests must be a number" }).int().min(1).max(100000).optional(),
});

export const updateInquiryStatusSchema = z.object({
    status: z.enum(["new", "read", "replied"], { error: "Status must be new, read, or replied" }),
});
