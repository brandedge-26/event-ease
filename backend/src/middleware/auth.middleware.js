import { verifyAccessToken } from "../utils/jwt.js";
import { db } from "../db/index.js";
import { branches } from "../db/schema.js";
import { eq, and } from "drizzle-orm";

// Protects vendor routes — expects Bearer token in Authorization header
export async function authenticateVendor(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Access token required." });
    }

    const token = header.slice(7);
    let decoded;
    try {
        decoded = verifyAccessToken(token);
    } catch {
        return res.status(401).json({ success: false, message: "Invalid or expired access token." });
    }

    req.vendor = decoded; // { id, email, name }

    // ── Branch validation ──
    const branchId = req.headers["x-branch-id"];
    if (branchId) {
        const [branch] = await db
            .select({ id: branches.id })
            .from(branches)
            .where(and(eq(branches.id, branchId), eq(branches.vendorId, decoded.id)))
            .limit(1);

        if (!branch) {
            return res.status(403).json({ success: false, message: "Invalid branch." });
        }
        req.branchId = branch.id;
    } else {
        req.branchId = null;
    }

    next();
}
