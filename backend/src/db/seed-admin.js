/**
 * One-time seed script — creates the first admin account.
 * Run with:  node src/db/seed-admin.js
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "./index.js";
import { admins } from "./schema.js";

const EMAIL    = "admin@eventease.com";
const PASSWORD = "admin-123";

const hash = await bcrypt.hash(PASSWORD, 12);

await db.insert(admins).values({
    id:           crypto.randomUUID(),
    email:        EMAIL,
    passwordHash: hash,
}).onConflictDoNothing();

console.log(`✅ Admin seeded: ${EMAIL}`);
process.exit(0);
