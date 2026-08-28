import { z } from "zod";

const VENDOR_TYPES = [
    "Banquet Hall", "Marquee", "Ballroom", "Wedding Lawn", "Hotel Banquet",
    "Rooftop Venue", "Farm House", "Beauty Parlor", "Florist",
    "Catering", "Decoration", "Photography", "Sound & Lights", "Car Rental", "Fireworks",
];

// ─── Send OTP ─────────────────────────────────────────────────────────────────
export const sendOtpSchema = z.object({
    email: z.string().email("Valid email address is required"),
});

// ─── Register ─────────────────────────────────────────────────────────────────
export const registerSchema = z.object({
    // Step 1 — Business Info
    businessName: z.string().min(2, "Business name must be at least 2 characters"),
    businessType: z.enum(VENDOR_TYPES, { error: `Business type must be one of: ${VENDOR_TYPES.join(", ")}` }),
    mobile:       z.string().min(10, "Valid mobile number is required"),
    whatsapp:     z.string().optional(),
    city:         z.string().min(1, "City is required"),
    area:         z.string().min(1, "Area is required"),
    address:      z.string().min(1, "Address is required"),
    cnic:         z.string().optional(),

    // Step 2 — Hall details (optional at registration)
    about: z.string().optional(),
    halls: z.array(
        z.object({
            name:     z.string().min(1, "Hall name is required"),
            capacity: z.number({ error: "Capacity must be a number" }).int().positive(),
            price:    z.number({ error: "Price must be a number" }).int().nonnegative(),
            desc:     z.string().optional(),
        })
    ).optional().default([]),

    // Step 3 — Account
    ownerName: z.string().min(2, "Owner name must be at least 2 characters"),
    email:     z.string().email("Valid email address is required"),
    password:  z.string().min(8, "Password must be at least 8 characters"),
    otp:       z.string().length(6, "OTP must be exactly 6 digits"),
});

// ─── Login ────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
    email:    z.string().email("Valid email address is required"),
    password: z.string().min(1, "Password is required"),
});

// ─── Update Vendor Profile ────────────────────────────────────────────────────
export const updateVendorSchema = z.object({
    name:        z.string().min(2).optional(),
    tagline:     z.string().max(120).optional(),
    phone:       z.string().min(10).optional(),
    whatsapp:    z.string().optional(),
    city:        z.string().min(1).optional(),
    area:        z.string().min(1).optional(),
    address:     z.string().min(1).optional(),
    about:       z.string().optional(),
    established: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
}).strict();
