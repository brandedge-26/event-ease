import { z } from "zod";

const CATEGORIES = ["Wedding", "Engagement", "Birthday", "Corporate", "Anniversary", "Other"];

const packageBase = z.object({
    name:        z.string().min(2, "Package name is required"),
    category:    z.enum(CATEGORIES, { error: `Category must be one of: ${CATEGORIES.join(", ")}` }),
    description: z.string().optional(),
    price:       z.number({ error: "Price must be a number" }).int().nonnegative(),
    maxGuests:   z.number().int().positive().optional(),
    duration:    z.string().optional(),
    includes:    z.array(z.string()).optional().default([]),
    status:      z.enum(["active", "inactive"]).optional().default("active"),
});

export const createPackageSchema = packageBase;

export const updatePackageSchema = packageBase.partial().refine(
    (d) => Object.keys(d).length > 0,
    { message: "At least one field is required to update" }
);
