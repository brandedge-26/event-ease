import { verifyAccessToken } from "../utils/jwt.js";

// Protects user routes — expects Bearer token in Authorization header
export function authenticateUser(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Access token required." });
    }

    const token = header.slice(7);
    try {
        const decoded = verifyAccessToken(token);
        req.user = decoded; // { id, email, name }
        next();
    } catch {
        return res.status(401).json({ success: false, message: "Invalid or expired access token." });
    }
}
