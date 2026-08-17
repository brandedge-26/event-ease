import { eq, gte } from "drizzle-orm";
import { db } from "../db/index.js";
import { vendors, bookings } from "../db/schema.js";

function getRangeStart(range) {
    const now = new Date();
    switch (range) {
        case "7d":  return new Date(now - 7  * 86_400_000);
        case "30d": return new Date(now - 30 * 86_400_000);
        case "3m":  return new Date(now - 90 * 86_400_000);
        case "1y":
        default:    return new Date(now - 365 * 86_400_000);
    }
}

function monthKey(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key) {
    const [y, m] = key.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short" });
}

function buildMonthSlots(since) {
    const slots = new Map();
    const cursor = new Date(since.getFullYear(), since.getMonth(), 1);
    const now    = new Date();
    while (cursor <= now) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
        slots.set(key, { month: monthLabel(key), bookings: 0, revenue: 0 });
        cursor.setMonth(cursor.getMonth() + 1);
    }
    return slots;
}

// GET /api/admin/reports?range=7d|30d|3m|1y
export async function getAdminReports(req, res) {
    try {
        const range = req.query.range ?? "1y";
        const since = getRangeStart(range);

        // ── Fetch bookings in range (joined with vendor for city/type) ──────────
        const rows = await db
            .select({
                id:          bookings.id,
                paid:        bookings.paid,
                amount:      bookings.amount,
                status:      bookings.status,
                createdAt:   bookings.createdAt,
                vendorId:    bookings.vendorId,
                vendorName:  vendors.name,
                vendorCity:  vendors.city,
                vendorType:  vendors.businessType,
            })
            .from(bookings)
            .leftJoin(vendors, eq(bookings.vendorId, vendors.id))
            .where(gte(bookings.createdAt, since));

        // ── All vendors (for active count) ────────────────────────────────────
        const allVendors = await db
            .select({ id: vendors.id, isBlocked: vendors.isBlocked })
            .from(vendors);

        // ── Overview stats ────────────────────────────────────────────────────
        const totalBookings     = rows.length;
        const totalRevenue      = rows.reduce((s, b) => s + (b.paid ?? 0), 0);
        const totalVenues       = allVendors.filter(v => !v.isBlocked).length;
        const avgBookingValue   = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;

        // ── Monthly chart ─────────────────────────────────────────────────────
        const monthSlots = buildMonthSlots(since);
        for (const b of rows) {
            const key = monthKey(b.createdAt);
            if (monthSlots.has(key)) {
                monthSlots.get(key).bookings += 1;
                monthSlots.get(key).revenue  += b.paid ?? 0;
            }
        }
        const monthly = [...monthSlots.values()];

        // ── Venue type breakdown ──────────────────────────────────────────────
        const typeMap = new Map();
        for (const b of rows) {
            const t = b.vendorType ?? "Other";
            typeMap.set(t, (typeMap.get(t) ?? 0) + 1);
        }
        const byType = [...typeMap.entries()]
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // ── City breakdown ────────────────────────────────────────────────────
        const cityMap = new Map();
        for (const b of rows) {
            const c = b.vendorCity ?? "Unknown";
            cityMap.set(c, (cityMap.get(c) ?? 0) + 1);
        }
        const byCity = [...cityMap.entries()]
            .map(([city, bookings]) => ({ city, bookings }))
            .sort((a, b) => b.bookings - a.bookings)
            .slice(0, 8);

        // ── Top venues ────────────────────────────────────────────────────────
        const venueMap = new Map();
        for (const b of rows) {
            if (!b.vendorId) continue;
            const v = venueMap.get(b.vendorId) ?? {
                id: b.vendorId, name: b.vendorName, city: b.vendorCity,
                type: b.vendorType, bookings: 0, revenue: 0,
            };
            v.bookings += 1;
            v.revenue  += b.paid ?? 0;
            venueMap.set(b.vendorId, v);
        }
        const topVenues = [...venueMap.values()]
            .sort((a, b) => b.bookings - a.bookings)
            .slice(0, 5);

        return res.json({
            success: true,
            stats: { totalRevenue, totalBookings, totalVenues, avgBookingValue },
            monthly,
            byType,
            byCity,
            topVenues,
        });
    } catch (err) {
        console.error("[admin getAdminReports]", err);
        return res.status(500).json({ success: false, message: "Failed to load reports." });
    }
}
