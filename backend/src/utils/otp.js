// In-memory OTP store with TTL (10 minutes)
// Each entry: { otp, expiresAt, verified }

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

class OtpStore {
    #store = new Map();

    // Generate and store a 6-digit OTP for the given email
    generate(email) {
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        this.#store.set(email.toLowerCase(), {
            otp,
            expiresAt: Date.now() + OTP_TTL_MS,
            verified: false,
        });
        return otp;
    }

    // Verify OTP — marks entry as verified on success
    verify(email, otp) {
        const key   = email.toLowerCase();
        const entry = this.#store.get(key);

        if (!entry)                    return { ok: false, error: "OTP not found. Please request a new code." };
        if (Date.now() > entry.expiresAt) {
            this.#store.delete(key);   return { ok: false, error: "OTP has expired. Please request a new code." };
        }
        if (entry.otp !== String(otp)) return { ok: false, error: "Invalid OTP." };

        this.#store.set(key, { ...entry, verified: true });
        return { ok: true };
    }

    // Check if email OTP was already verified (used before registration)
    isVerified(email) {
        const entry = this.#store.get(email.toLowerCase());
        return !!(entry?.verified && Date.now() <= entry.expiresAt);
    }

    // Remove after successful registration
    delete(email) {
        this.#store.delete(email.toLowerCase());
    }
}

export const otpStore = new OtpStore();
