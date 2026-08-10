import { eq, count, sum, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { vendors, bookings, reviews } from "../db/schema.js";

// GET /api/admin/dashboard/stats
export async function getDashboardStats(req, res) {
    try {
        // ── Counts ──────────────────────────────────────────────────────────────
        const [{ totalVendors }]   = await db.select({ totalVendors:   count() }).from(vendors);
        const [{ totalBookings }]  = await db.select({ totalBookings:  count() }).from(bookings);
        const [{ totalReviews }]   = await db.select({ totalReviews:   count() }).from(reviews);

        const [{ verified }]   = await db.select({ verified:   count() }).from(vendors).where(eq(vendors.isVerified, true));
        const [{ blocked }]    = await db.select({ blocked:    count() }).from(vendors).where(eq(vendors.isBlocked,  true));
        const [{ confirmed }]  = await db.select({ confirmed:  count() }).from(bookings).where(eq(bookings.status, "confirmed"));
        const [{ pending }]    = await db.select({ pending:    count() }).from(bookings).where(eq(bookings.status, "pending"));
        const [{ cancelled }]  = await db.select({ cancelled:  count() }).from(bookings).where(eq(bookings.status, "cancelled"));

        // Total revenue = sum of all paid amounts
        const [{ totalRevenue }] = await db.select({ totalRevenue: sum(bookings.paid) }).from(bookings);

        // ── Recent bookings (last 6) ─────────────────────────────────────────────
        const recentBookings = await db
            .select({
                id:           bookings.id,
                customerName: bookings.customerName,
                event:        bookings.event,
                hall:         bookings.hall,
                date:         bookings.date,
                amount:       bookings.amount,
                paid:         bookings.paid,
                status:       bookings.status,
                createdAt:    bookings.createdAt,
                vendorName:   vendors.name,
            })
            .from(bookings)
            .leftJoin(vendors, eq(bookings.vendorId, vendors.id))
            .orderBy(desc(bookings.createdAt))
            .limit(6);

        // ── Recent vendors (last 6) ──────────────────────────────────────────────
        const recentVendors = await db
            .select({
                id:          vendors.id,
                name:        vendors.name,
                email:       vendors.email,
                city:        vendors.city,
                isVerified:  vendors.isVerified,
                isBlocked:   vendors.isBlocked,
                createdAt:   vendors.createdAt,
            })
            .from(vendors)
            .orderBy(desc(vendors.createdAt))
            .limit(6);

        return res.json({
            success: true,
            stats: {
                vendors: {
                    total:      Number(totalVendors),
                    verified:   Number(verified),
                    unverified: Number(totalVendors) - Number(verified),
                    blocked:    Number(blocked),
                },
                bookings: {
                    total:     Number(totalBookings),
                    confirmed: Number(confirmed),
                    pending:   Number(pending),
                    cancelled: Number(cancelled),
                },
                reviews:      Number(totalReviews),
                totalRevenue: Number(totalRevenue ?? 0),
            },
            recentBookings,
            recentVendors,
        });
    } catch (err) {
        console.error("[admin getDashboardStats]", err);
        return res.status(500).json({ success: false, message: "Failed to load dashboard." });
    }
}
