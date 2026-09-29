import Redis from "ioredis";
import { ENV } from "./envs.js";

// Graceful no-op when REDIS_URL isn't set — every cache/otp call checks this
// and falls back to an uncached path, so the app runs fine without Redis too.
export const redis = ENV.REDIS_URL
    ? new Redis(ENV.REDIS_URL, { maxRetriesPerRequest: 2, lazyConnect: false })
    : null;

if (redis) {
    redis.on("connect", () => console.log("✅ Redis connected"));
    redis.on("error", (err) => console.error("[redis]", err.message));
}
