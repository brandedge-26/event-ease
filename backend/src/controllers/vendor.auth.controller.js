import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { vendors, halls } from "../db/schema.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { otpStore } from "../utils/otp.js";
import { sendOtpEmail } from "../utils/email.js";
import { slugify } from "../utils/slugify.js";
import { AppError } from "../middleware/errorHandler.js";

// ─── Cookie config ────────────────────────────────────────────────────────────
const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function vendorPayload(v) {
    return { id: v.id, email: v.email, name: v.name };
}

// ─── POST /vendor/auth/send-otp ───────────────────────────────────────────────
// Body validated by sendOtpSchema via validate middleware
export async function sendOtp(req, res, next) {
    try {
        const { email } = req.body;
        const normalEmail = email.toLowerCase().trim();

        const [existing] = await db
            .select({ id: vendors.id })
            .from(vendors)
            .where(eq(vendors.email, normalEmail))
            .limit(1);

        if (existing) {
            throw new AppError("Email is already registered.", 409);
        }

        const otp = otpStore.generate(normalEmail);
        await sendOtpEmail(normalEmail, otp);

        return res.status(200).json({ success: true, message: "OTP sent to your email." });
    } catch (err) {
        next(err);
    }
}

// ─── POST /vendor/auth/register ───────────────────────────────────────────────
// Body validated by registerSchema via validate middleware
export async function register(req, res, next) {
    try {
        const {
            businessName, businessType, mobile, whatsapp,
            city, area, address, cnic,
            halls: hallsInput = [],
            about,
            ownerName, email, password, otp,
        } = req.body;

        const normalEmail = email.toLowerCase().trim();

        // ── Verify OTP inline ──
        const otpResult = otpStore.verify(normalEmail, String(otp));
        if (!otpResult.ok) {
            throw new AppError(otpResult.error, 400);
        }

        // ── Duplicate email guard (race condition) ──
        const [duplicate] = await db
            .select({ id: vendors.id })
            .from(vendors)
            .where(eq(vendors.email, normalEmail))
            .limit(1);

        if (duplicate) {
            throw new AppError("Email is already registered.", 409);
        }

        // ── Prepare data ──
        const vendorId     = crypto.randomUUID();
        const passwordHash = await bcrypt.hash(password, 12);
        const slug         = `${slugify(businessName.trim())}-${vendorId.slice(0, 6)}`;

        const hallRows = hallsInput
            .filter((h) => h.name?.trim())
            .map((h) => ({
                id:       crypto.randomUUID(),
                vendorId,
                name:     h.name.trim(),
                capacity: Number(h.capacity) || 0,
                price:    Number(h.price)    || 0,
                desc:     h.desc?.trim()     || null,
            }));

        // ── Insert vendor then halls sequentially ──
        await db.insert(vendors).values({
            id:           vendorId,
            name:         businessName.trim(),
            slug,
            businessType,
            ownerName:    ownerName.trim(),
            email:        normalEmail,
            passwordHash,
            phone:        mobile.trim(),
            whatsapp:     whatsapp?.trim() || null,
            city:         city.trim(),
            area:         area.trim(),
            address:      address.trim(),
            cnic:         cnic?.trim()     || null,
            about:        about?.trim()    || null,
            isVerified:   false,
        });

        if (hallRows.length) {
            await db.insert(halls).values(hallRows);
        }

        otpStore.delete(normalEmail);

        // ── Tokens ──
        const payload      = { id: vendorId, email: normalEmail, name: businessName.trim() };
        const accessToken  = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        await db
            .update(vendors)
            .set({ refreshToken })
            .where(eq(vendors.id, vendorId));

        res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);

        return res.status(201).json({
            success: true,
            message: "Registration successful.",
            accessToken,
            vendor: { id: vendorId, name: businessName.trim(), slug, email: normalEmail, ownerName: ownerName.trim() },
        });
    } catch (err) {
        next(err);
    }
}

// ─── POST /vendor/auth/login ──────────────────────────────────────────────────
// Body validated by loginSchema via validate middleware
export async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        const [vendor] = await db
            .select({
                id:           vendors.id,
                name:         vendors.name,
                slug:         vendors.slug,
                email:        vendors.email,
                ownerName:    vendors.ownerName,
                passwordHash: vendors.passwordHash,
                businessType: vendors.businessType,
                city:         vendors.city,
                area:         vendors.area,
            })
            .from(vendors)
            .where(eq(vendors.email, email.toLowerCase().trim()))
            .limit(1);

        if (!vendor) {
            throw new AppError("Invalid email or password.", 401);
        }

        const passwordMatch = await bcrypt.compare(password, vendor.passwordHash);
        if (!passwordMatch) {
            throw new AppError("Invalid email or password.", 401);
        }

        const payload      = vendorPayload(vendor);
        const accessToken  = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        await db
            .update(vendors)
            .set({ refreshToken, updatedAt: new Date() })
            .where(eq(vendors.id, vendor.id));

        res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);

        const { passwordHash, ...vendorData } = vendor;

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            accessToken,
            vendor: vendorData,
        });
    } catch (err) {
        next(err);
    }
}

// ─── POST /vendor/auth/refresh ────────────────────────────────────────────────
export async function refreshAccessToken(req, res, next) {
    try {
        const token = req.cookies?.refreshToken;
        if (!token) {
            throw new AppError("Refresh token not found.", 401);
        }

        let decoded;
        try {
            decoded = verifyRefreshToken(token);
        } catch {
            throw new AppError("Invalid or expired refresh token.", 401);
        }

        const [vendor] = await db
            .select({
                id:           vendors.id,
                name:         vendors.name,
                slug:         vendors.slug,
                email:        vendors.email,
                ownerName:    vendors.ownerName,
                refreshToken: vendors.refreshToken,
            })
            .from(vendors)
            .where(eq(vendors.id, decoded.id))
            .limit(1);

        if (!vendor || vendor.refreshToken !== token) {
            throw new AppError("Refresh token is invalid or has been revoked.", 401);
        }

        const payload         = vendorPayload(vendor);
        const newAccessToken  = generateAccessToken(payload);
        const newRefreshToken = generateRefreshToken(payload);

        await db
            .update(vendors)
            .set({ refreshToken: newRefreshToken, updatedAt: new Date() })
            .where(eq(vendors.id, vendor.id));

        res.cookie("refreshToken", newRefreshToken, REFRESH_COOKIE_OPTIONS);

        return res.status(200).json({
            success: true,
            accessToken: newAccessToken,
            vendor: {
                id:        vendor.id,
                name:      vendor.name,
                slug:      vendor.slug,
                email:     vendor.email,
                ownerName: vendor.ownerName,
            },
        });
    } catch (err) {
        next(err);
    }
}

// ─── POST /vendor/auth/logout ─────────────────────────────────────────────────
export async function logout(req, res, next) {
    try {
        const token = req.cookies?.refreshToken;

        if (token) {
            try {
                const decoded = verifyRefreshToken(token);
                await db
                    .update(vendors)
                    .set({ refreshToken: null, updatedAt: new Date() })
                    .where(eq(vendors.id, decoded.id));
            } catch {
                // expired token — still clear cookie
            }
        }

        res.clearCookie("refreshToken", { httpOnly: true, sameSite: "strict" });
        return res.status(200).json({ success: true, message: "Logged out successfully." });
    } catch (err) {
        next(err);
    }
}

// ─── GET /vendor/auth/me ──────────────────────────────────────────────────────
export async function getMe(req, res, next) {
    try {
        const [vendor] = await db
            .select({
                id:           vendors.id,
                name:         vendors.name,
                slug:         vendors.slug,
                businessType: vendors.businessType,
                ownerName:    vendors.ownerName,
                email:        vendors.email,
                phone:        vendors.phone,
                whatsapp:     vendors.whatsapp,
                city:         vendors.city,
                area:         vendors.area,
                address:      vendors.address,
                cnic:         vendors.cnic,
                tagline:      vendors.tagline,
                about:        vendors.about,
                established:  vendors.established,
                isVerified:   vendors.isVerified,
                createdAt:    vendors.createdAt,
            })
            .from(vendors)
            .where(eq(vendors.id, req.vendor.id))
            .limit(1);

        if (!vendor) {
            throw new AppError("Vendor not found.", 404);
        }

        return res.status(200).json({ success: true, vendor });
    } catch (err) {
        next(err);
    }
}
