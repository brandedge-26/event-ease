import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
    sendOtp,
    register,
    login,
    refreshAccessToken,
    logout,
    getMe,
} from "../controllers/vendor.auth.controller.js";
import { authenticateVendor } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { sendOtpSchema, registerSchema, loginSchema } from "../schemas/vendor.schemas.js";

const router = Router();

// Rate limiters
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 10,                    // 10 attempts per IP per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many login attempts. Please try again after 15 minutes." },
});

const otpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,  // 1 hour
    max: 5,                     // 5 OTP requests per IP per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many OTP requests. Please try again after 1 hour." },
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,  // 1 hour
    max: 5,                     // 5 registrations per IP per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many registration attempts. Please try again after 1 hour." },
});

// Public — with Zod validation + rate limiting
router.post("/send-otp", otpLimiter,      validate(sendOtpSchema), sendOtp);
router.post("/register", registerLimiter, validate(registerSchema), register);
router.post("/login",    loginLimiter,    validate(loginSchema),    login);

// No body to validate
router.post("/refresh", refreshAccessToken);
router.post("/logout",  logout);

// Protected
router.get("/me", authenticateVendor, getMe);

export default router;
