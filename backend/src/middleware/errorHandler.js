import { ZodError } from "zod";

// ─── Custom App Error ─────────────────────────────────────────────────────────
// Throw this anywhere: throw new AppError("Not found", 404)
export class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.name       = "AppError";
        this.statusCode = statusCode;
    }
}

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Must be registered LAST in app.js: app.use(globalErrorHandler)
export const globalErrorHandler = (err, req, res, next) => {

    // ── Zod validation errors ──
    if (err instanceof ZodError) {
        const issues  = err.issues ?? err.errors ?? [];
        const details = issues.map((issue) => {
            const path = issue.path?.length ? issue.path.join(".") : "field";
            return `${path}: ${issue.message}`;
        });
        return res.status(400).json({
            success: false,
            message: details.length ? details[0] : "Validation error",
            errors:  details,
        });
    }

    // ── Known app errors (AppError) ──
    if (err instanceof AppError || err.statusCode) {
        return res.status(err.statusCode ?? 500).json({
            success: false,
            message: err.message,
        });
    }

    // ── JWT errors ──
    if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ success: false, message: "Invalid token." });
    }
    if (err.name === "TokenExpiredError") {
        return res.status(401).json({ success: false, message: "Token has expired." });
    }

    // ── Unknown / unexpected errors ──
    const isDev = process.env.NODE_ENV !== "production";
    console.error("[Unhandled Error]", err);

    return res.status(500).json({
        success: false,
        message: isDev ? err.message : "An unexpected error occurred.",
        ...(isDev && { stack: err.stack }),
    });
};
