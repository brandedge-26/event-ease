import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { eq, or } from "drizzle-orm";
import { db } from "../db/index.js";
import { marketplaceUsers } from "../db/schema.js";
import { ENV } from "./envs.js";

passport.use(
    new GoogleStrategy(
        {
            clientID:     ENV.GOOGLE_CLIENT_ID,
            clientSecret: ENV.GOOGLE_CLIENT_SECRET,
            callbackURL:  ENV.GOOGLE_CALLBACK_URL,
        },
        async (_accessToken, _refreshToken, profile, done) => {
            try {
                const googleId = profile.id;
                const email    = profile.emails?.[0]?.value?.toLowerCase().trim();
                const name     = profile.displayName ?? profile.name?.givenName ?? "User";
                const avatar   = profile.photos?.[0]?.value ?? null;

                if (!email) return done(new Error("No email from Google"), null);

                // Try to find existing user by googleId OR email
                const [existing] = await db
                    .select()
                    .from(marketplaceUsers)
                    .where(or(
                        eq(marketplaceUsers.googleId, googleId),
                        eq(marketplaceUsers.email, email),
                    ))
                    .limit(1);

                if (existing) {
                    // Link googleId if signing in via email account for first time
                    const updates = {};
                    if (!existing.googleId)  updates.googleId  = googleId;
                    if (!existing.avatarUrl) updates.avatarUrl = avatar;
                    if (Object.keys(updates).length) {
                        updates.updatedAt = new Date();
                        await db
                            .update(marketplaceUsers)
                            .set(updates)
                            .where(eq(marketplaceUsers.id, existing.id));
                    }
                    return done(null, { id: existing.id, name: existing.name, email: existing.email, avatarUrl: existing.avatarUrl ?? avatar });
                }

                // New user — create account
                const userId = crypto.randomUUID();
                await db.insert(marketplaceUsers).values({
                    id:       userId,
                    name,
                    email,
                    googleId,
                    avatarUrl: avatar,
                });

                return done(null, { id: userId, name, email, avatarUrl: avatar });
            } catch (err) {
                return done(err, null);
            }
        },
    ),
);

export default passport;
