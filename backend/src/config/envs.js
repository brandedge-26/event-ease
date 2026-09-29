import "dotenv/config";



// VALIDATE REQUIRED ENVIRONMENT VARIABLES
const validateEnv = () => {

    const required = [
        'ACCESS_TOKEN_SECRET',
        'REFRESH_TOKEN_SECRET',
        'DB_URL',
        'CLIENT_URL',
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
        // Email OTP — required only in production
        // 'EMAIL_USER',
        // 'EMAIL_PASS',
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
        process.exit(1);
    }

    // Validate JWT secrets are strong enough (minimum 32 characters)
    if (process.env.ACCESS_TOKEN_SECRET.length < 32) {
        console.error('❌ ACCESS_TOKEN_SECRET must be at least 32 characters long');
        process.exit(1);
    }

    if (process.env.REFRESH_TOKEN_SECRET.length < 32) {
        console.error('❌ REFRESH_TOKEN_SECRET must be at least 32 characters long');
        process.exit(1);
    }

};

validateEnv();



// ENV VARS
export const ENV = {

    PORT: process.env.PORT,
    DB_URL: process.env.DB_URL,
    NODE_ENV: process.env.NODE_ENV,
    CLIENT_URL: process.env.CLIENT_URL,

    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,

    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

    GOOGLE_CLIENT_ID:     process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL:  process.env.GOOGLE_CALLBACK_URL ?? "http://localhost:5510/api/user/auth/google/callback",

    // Resend — transactional email (OTP, welcome, congratulations, etc.)
    // Falls back to console logging when RESEND_API_KEY is not set, so local
    // dev keeps working without a real key.
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM:     process.env.EMAIL_FROM ?? "Event Ease <onboarding@resend.dev>",

    // Redis — caches hot public reads (vendor listings/profiles) and stores OTPs.
    // Falls back to uncached DB reads / an in-memory OTP map when not set, so
    // local dev keeps working without a real Redis instance.
    REDIS_URL: process.env.REDIS_URL,

}