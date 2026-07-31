import { Router } from "express";
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

// Public — with Zod validation
router.post("/send-otp", validate(sendOtpSchema), sendOtp);
router.post("/register", validate(registerSchema), register);
router.post("/login",    validate(loginSchema),    login);

// No body to validate
router.post("/refresh", refreshAccessToken);
router.post("/logout",  logout);

// Protected
router.get("/me", authenticateVendor, getMe);

export default router;
