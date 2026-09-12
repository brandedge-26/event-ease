import jwt from "jsonwebtoken";

export function authenticateAdmin(req, res, next) {
    // Prefer Authorization header (for Safari/ITP) then fall back to cookie
    const authHeader = req.headers?.authorization;
    const token = (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null)
        ?? req.cookies?.admin_token;
    if (!token)
        return res.status(401).json({ success: false, message: "Unauthorized." });

    try {
        const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.admin = payload;
        next();
    } catch {
        return res.status(401).json({ success: false, message: "Unauthorized." });
    }
}
