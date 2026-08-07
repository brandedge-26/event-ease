import jwt from "jsonwebtoken";

export function authenticateAdmin(req, res, next) {
    const token = req.cookies?.admin_token;
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
