import { z } from "zod";

const hallBase = z.object({
    name:     z.string().min(1, "Hall name is required"),
    capacity: z.number({ error: "Capacity must be a number" }).int().positive("Capacity must be positive"),
    price:    z.number({ error: "Price must be a number" }).int().nonnegative("Price cannot be negative"),
    desc:     z.string().optional(),
});

export const createHallSchema = hallBase;

export const updateHallSchema = hallBase.partial().refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one field is required to update" }
);
