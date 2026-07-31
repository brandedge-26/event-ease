// Middleware factory: validates req.body against a Zod schema.
// On failure → passes ZodError to next() → globalErrorHandler formats it.
// On success → replaces req.body with parsed (coerced) data and calls next().

export const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        return next(result.error); // ZodError → globalErrorHandler
    }
    req.body = result.data; // use coerced/defaulted values
    next();
};
