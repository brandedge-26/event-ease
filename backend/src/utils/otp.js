import { redis } from "../config/redis.js";

// OTP store — backed by Redis when configured (survives restarts, works
// across multiple server instances), falling back to an in-memory Map with
// the same TTL behaviour when it isn't, so local dev needs no Redis.

const OTP_TTL_SECONDS = 10 * 60; // 10 minutes
const memoryStore = new Map(); // fallback only

function keyOf(email) {
    return `otp:${email.toLowerCase()}`;
}

class OtpStore {
    // Generate and store a 6-digit OTP for the given email
    async generate(email) {
        const otp = String(Math.floor(100000 + Math.random() * 900000));

        if (redis) {
            await redis.set(keyOf(email), JSON.stringify({ otp, verified: false }), "EX", OTP_TTL_SECONDS);
        } else {
            memoryStore.set(email.toLowerCase(), {
                otp,
                verified:  false,
                expiresAt: Date.now() + OTP_TTL_SECONDS * 1000,
            });
        }

        return otp;
    }

    // Verify OTP — marks entry as verified on success
    async verify(email, otp) {
        const entry = await this.#read(email);

        if (!entry)                    return { ok: false, error: "OTP not found. Please request a new code." };
        if (entry.otp !== String(otp)) return { ok: false, error: "Invalid OTP." };

        await this.#write(email, { ...entry, verified: true });
        return { ok: true };
    }

    // Check if email OTP was already verified (used before registration)
    async isVerified(email) {
        const entry = await this.#read(email);
        return !!entry?.verified;
    }

    // Remove after successful registration
    async delete(email) {
        if (redis) await redis.del(keyOf(email));
        else memoryStore.delete(email.toLowerCase());
    }

    // ── Internal helpers ──
    async #read(email) {
        const key = email.toLowerCase();

        if (redis) {
            const raw = await redis.get(keyOf(email));
            return raw ? JSON.parse(raw) : null;
        }

        const entry = memoryStore.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            memoryStore.delete(key);
            return null;
        }
        return entry;
    }

    async #write(email, entry) {
        if (redis) {
            const ttl = await redis.ttl(keyOf(email));
            await redis.set(keyOf(email), JSON.stringify(entry), "EX", ttl > 0 ? ttl : OTP_TTL_SECONDS);
        } else {
            const existing = memoryStore.get(email.toLowerCase());
            memoryStore.set(email.toLowerCase(), { ...entry, expiresAt: existing?.expiresAt ?? Date.now() + OTP_TTL_SECONDS * 1000 });
        }
    }
}

export const otpStore = new OtpStore();
