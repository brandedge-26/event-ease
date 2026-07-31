import { z } from "zod";

export const createReviewSchema = z.object({
    name:   z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
    rating: z.number({ error: "Rating must be a number" }).int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
    text:   z.string().min(5, "Review must be at least 5 characters").max(2000, "Review must be under 2000 characters"),
});
