import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { admins } from "../db/schema.js";

const COOKIE_NAME = "admin_token";
const COOKIE_OPTS = {
    httpOnly: true,
    sameSite: "lax",
    secure:   process.env.NODE_ENV === "production",
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
};

function jwtSecret() {
    return process.env.ACCESS_TOKEN_SECRET;
}

// POST /api/admin/auth/login
export async function adminLogin(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ success: false, message: "Email and password required." });

        const [admin] = await db.select().from(admins).where(eq(admins.email, email.toLowerCase().trim())).limit(1);
        if (!admin)
            return res.status(401).json({ success: false, message: "Invalid email or password." });

        const valid = await bcrypt.compare(password, admin.passwordHash);
        if (!valid)
            return res.status(401).json({ success: false, message: "Invalid email or password." });

        const token = jwt.sign({ id: admin.id, email: admin.email }, jwtSecret(), { expiresIn: "7d" });
        res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
        return res.json({ success: true });
    } catch (err) {
        console.error("[adminLogin]", err);
        return res.status(500).json({ success: false, message: "Login failed." });
    }
}

// GET /api/admin/auth/me
export async function adminMe(req, res) {
    return res.json({ success: true, admin: { id: req.admin.id, email: req.admin.email } });
}

// POST /api/admin/auth/logout
export async function adminLogout(req, res) {
    res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
    return res.json({ success: true });
}
