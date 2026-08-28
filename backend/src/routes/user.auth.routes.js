import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, login, refreshAccessToken, logout, getMe, googleAuthCallback } from "../controllers/user.auth.controller.js";
import { authenticateUser } from "../middleware/user.auth.middleware.js";
import passport from "../config/passport.js";

const router = Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many login attempts. Please try again after 15 minutes." },
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many registration attempts. Please try again after 1 hour." },
});

router.post("/register", registerLimiter, register);
router.post("/login",    loginLimiter,    login);
router.post("/refresh",  refreshAccessToken);
router.post("/logout",   logout);
router.get("/me",        authenticateUser, getMe);

// Google OAuth
router.get("/google",
    passport.authenticate("google", { scope: ["profile", "email"], session: false }),
);
router.get("/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/login?error=google_failed" }),
    googleAuthCallback,
);

export default router;
