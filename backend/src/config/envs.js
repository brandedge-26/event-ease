import "dotenv/config";



// VALIDATE REQUIRED ENVIRONMENT VARIABLES
const validateEnv = () => {

    const required = [
        'ACCESS_TOKEN_SECRET',
        'REFRESH_TOKEN_SECRET',
        'DB_URL',
        'CLIENT_URL',
        // Google OAuth — uncomment when implementing OAuth login
        // 'GOOGLE_CLIENT_ID',
        // 'GOOGLE_CLIENT_SECRET',
        // 'GOOGLE_CALLBACK_URL',
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
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET

}