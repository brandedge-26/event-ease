import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { marketplaceUsers } from "../db/schema.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { AppError } from "../middleware/errorHandler.js";
import { ENV } from "../config/envs.js";

// ─── Cookie config ────────────────────────────────────────────────────────────
const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
};

function userPayload(u) {
    return { id: u.id, email: u.email, name: u.name };
}

// ─── POST /user/auth/register ─────────────────────────────────────────────────
export async function register(req, res, next) {
    try {
        const { name, email, password } = req.body;
        const normalEmail = email.toLowerCase().trim();

        const [existing] = await db
            .select({ id: marketplaceUsers.id })
            .from(marketplaceUsers)
            .where(eq(marketplaceUsers.email, normalEmail))
            .limit(1);

        if (existing) {
            throw new AppError("An account with this email already exists.", 409);
        }

        const userId      = crypto.randomUUID();
        const passwordHash = await bcrypt.hash(password, 12);
        const payload      = { id: userId, email: normalEmail, name: name.trim() };
        const accessToken  = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        await db.insert(marketplaceUsers).values({
            id:           userId,
            name:         name.trim(),
            email:        normalEmail,
            passwordHash,
            refreshToken,
        });

        res.cookie("userRefreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);

        return res.status(201).json({
            success: true,
            message: "Account created successfully.",
            accessToken,
            user: { id: userId, name: name.trim(), email: normalEmail },
        });
    } catch (err) {
        next(err);
    }
}

// ─── POST /user/auth/login ────────────────────────────────────────────────────
export async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        const normalEmail = email.toLowerCase().trim();

        const [user] = await db
            .select({
                id:           marketplaceUsers.id,
                name:         marketplaceUsers.name,
                email:        marketplaceUsers.email,
                passwordHash: marketplaceUsers.passwordHash,
                avatarUrl:    marketplaceUsers.avatarUrl,
                isBlocked:    marketplaceUsers.isBlocked,
            })
            .from(marketplaceUsers)
            .where(eq(marketplaceUsers.email, normalEmail))
            .limit(1);

        if (!user || !user.passwordHash) {
            throw new AppError("Invalid email or password.", 401);
        }

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) {
            throw new AppError("Invalid email or password.", 401);
        }

        if (user.isBlocked) {
            throw new AppError("Your account has been suspended. Please contact support.", 403);
        }

        const payload      = userPayload(user);
        const accessToken  = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        await db
            .update(marketplaceUsers)
            .set({ refreshToken, updatedAt: new Date() })
            .where(eq(marketplaceUsers.id, user.id));

        res.cookie("userRefreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            accessToken,
            user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
        });
    } catch (err) {
        next(err);
    }
}

// ─── POST /user/auth/refresh ──────────────────────────────────────────────────
export async function refreshAccessToken(req, res, next) {
    try {
        const token = req.cookies?.userRefreshToken;
        if (!token) throw new AppError("Refresh token not found.", 401);

        let decoded;
        try {
            decoded = verifyRefreshToken(token);
        } catch {
            throw new AppError("Invalid or expired refresh token.", 401);
        }

        const [user] = await db
            .select({
                id:           marketplaceUsers.id,
                name:         marketplaceUsers.name,
                email:        marketplaceUsers.email,
                avatarUrl:    marketplaceUsers.avatarUrl,
                refreshToken: marketplaceUsers.refreshToken,
                isBlocked:    marketplaceUsers.isBlocked,
            })
            .from(marketplaceUsers)
            .where(eq(marketplaceUsers.id, decoded.id))
            .limit(1);

        if (!user || user.refreshToken !== token) {
            throw new AppError("Refresh token is invalid or revoked.", 401);
        }

        if (user.isBlocked) {
            res.clearCookie("userRefreshToken", { httpOnly: true, sameSite: "strict" });
            throw new AppError("Your account has been suspended.", 403);
        }

        const payload         = userPayload(user);
        const newAccessToken  = generateAccessToken(payload);
        const newRefreshToken = generateRefreshToken(payload);

        await db
            .update(marketplaceUsers)
            .set({ refreshToken: newRefreshToken, updatedAt: new Date() })
            .where(eq(marketplaceUsers.id, user.id));

        res.cookie("userRefreshToken", newRefreshToken, REFRESH_COOKIE_OPTIONS);

        return res.status(200).json({
            success:     true,
            accessToken: newAccessToken,
            user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
        });
    } catch (err) {
        next(err);
    }
}

// ─── POST /user/auth/logout ───────────────────────────────────────────────────
export async function logout(req, res, next) {
    try {
        const token = req.cookies?.userRefreshToken;

        if (token) {
            try {
                const decoded = verifyRefreshToken(token);
                await db
                    .update(marketplaceUsers)
                    .set({ refreshToken: null, updatedAt: new Date() })
                    .where(eq(marketplaceUsers.id, decoded.id));
            } catch {
                // expired token — still clear cookie
            }
        }

        res.clearCookie("userRefreshToken", { httpOnly: true, sameSite: "strict" });
        return res.status(200).json({ success: true, message: "Logged out successfully." });
    } catch (err) {
        next(err);
    }
}

// ─── GET /user/auth/google/callback ──────────────────────────────────────────
export async function googleAuthCallback(req, res) {
    try {
        const googleUser = req.user; // set by passport
        if (!googleUser) {
            return res.redirect(`${ENV.CLIENT_URL}/login?error=google_failed`);
        }

        const payload      = { id: googleUser.id, email: googleUser.email, name: googleUser.name };
        const accessToken  = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        await db
            .update(marketplaceUsers)
            .set({ refreshToken, updatedAt: new Date() })
            .where(eq(marketplaceUsers.id, googleUser.id));

        res.cookie("userRefreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);

        // Pass short-lived access token via URL — callback page reads and clears it
        return res.redirect(
            `${ENV.CLIENT_URL}/auth/callback?token=${encodeURIComponent(accessToken)}`,
        );
    } catch {
        return res.redirect(`${ENV.CLIENT_URL}/login?error=google_failed`);
    }
}

// ─── GET /user/auth/me ────────────────────────────────────────────────────────
export async function getMe(req, res, next) {
    try {
        const [user] = await db
            .select({
                id:        marketplaceUsers.id,
                name:      marketplaceUsers.name,
                email:     marketplaceUsers.email,
                avatarUrl: marketplaceUsers.avatarUrl,
                createdAt: marketplaceUsers.createdAt,
            })
            .from(marketplaceUsers)
            .where(eq(marketplaceUsers.id, req.user.id))
            .limit(1);

        if (!user) throw new AppError("User not found.", 404);

        return res.status(200).json({ success: true, user });
    } catch (err) {
        next(err);
    }
}
