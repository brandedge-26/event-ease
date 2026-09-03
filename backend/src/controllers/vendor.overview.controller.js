import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { bookings, inquiries, branches } from "../db/schema.js";

function getRangeDates(range) {
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth();

    if (range === "this_month") {
        return { start: new Date(y, m, 1),     end: new Date(y, m + 1, 0) };
    } else if (range === "last_month") {
        return { start: new Date(y, m - 1, 1), end: new Date(y, m, 0) };
    } else if (range === "last_3") {
        return { start: new Date(y, m - 2, 1), end: new Date(y, m + 1, 0) };
    } else if (range === "last_6") {
        return { start: new Date(y, m - 5, 1), end: new Date(y, m + 1, 0) };
    }
    return { start: null, end: null }; // all time
}

function toYMD(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function inRange(dateStr, start, end) {
    if (!start) return true;
    return dateStr >= toYMD(start) && dateStr <= toYMD(end);
}
function monthLabel(yr, mo) {
    return new Date(yr, mo, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

// GET /api/vendor/overview?range=this_month
// Always aggregates across ALL branches — ignores branchId header
export async function getOverview(req, res) {
    try {
        const vendorId = req.vendor.id;
        const range    = req.query.range ?? "this_month";
        const { start, end } = getRangeDates(range);

        // ── Fetch all data (no branch filter) ──────────────────────────────
        const [allBookings, allInquiries, allBranches] = await Promise.all([
            db.select({
                id:           bookings.id,
                branchId:     bookings.branchId,
                date:         bookings.date,
                amount:       bookings.amount,
                paid:         bookings.paid,
                status:       bookings.status,
                customerName: bookings.customerName,
                phone:        bookings.phone,
                event:        bookings.event,
                hall:         bookings.hall,
                guests:       bookings.guests,
                timeFrom:     bookings.timeFrom,
                timeTo:       bookings.timeTo,
            }).from(bookings).where(eq(bookings.vendorId, vendorId)),

            db.select({
                id:       inquiries.id,
                branchId: inquiries.branchId,
                status:   inquiries.status,
                createdAt: inquiries.createdAt,
            }).from(inquiries).where(eq(inquiries.vendorId, vendorId)),

            db.select({
                id:        branches.id,
                name:      branches.name,
                city:      branches.city,
                area:      branches.area,
                isDefault: branches.isDefault,
                isActive:  branches.isActive,
                isApproved: branches.isApproved,
            }).from(branches).where(eq(branches.vendorId, vendorId)),
        ]);

        // ── Filter by range ─────────────────────────────────────────────────
        const filtered = allBookings.filter(b => inRange(b.date, start, end));

        // ── Overall stats ───────────────────────────────────────────────────
        const totalRevenue    = filtered.reduce((s, b) => s + (b.amount ?? 0), 0);
        const totalPaid       = filtered.reduce((s, b) => s + (b.paid   ?? 0), 0);
        const totalDue        = totalRevenue - totalPaid;
        const collectionRate  = totalRevenue > 0 ? Math.round((totalPaid / totalRevenue) * 100) : 0;
        const confirmed       = filtered.filter(b => b.status === "confirmed").length;
        const pending         = filtered.filter(b => b.status === "pending").length;
        const cancelled       = filtered.filter(b => b.status === "cancelled").length;
        const totalBookings   = confirmed + pending + cancelled;

        // Inquiries — filter by createdAt within range
        const filteredInquiries = allInquiries.filter(inq => {
            if (!start) return true;
            const d = toYMD(new Date(inq.createdAt));
            return d >= toYMD(start) && d <= toYMD(end);
        });
        const totalInquiries = filteredInquiries.length;
        const newInquiries   = filteredInquiries.filter(i => i.status === "new").length;

        // ── Per-branch breakdown ────────────────────────────────────────────
        const branchMap = new Map(allBranches.map(b => [b.id, b]));

        const branchStats = allBranches.map(branch => {
            const bBookings = filtered.filter(b => b.branchId === branch.id);
            const bInquiries = filteredInquiries.filter(i => i.branchId === branch.id);
            const revenue  = bBookings.reduce((s, b) => s + (b.amount ?? 0), 0);
            const paid     = bBookings.reduce((s, b) => s + (b.paid   ?? 0), 0);
            return {
                id:         branch.id,
                name:       branch.name,
                city:       branch.city,
                area:       branch.area,
                isDefault:  branch.isDefault,
                isActive:   branch.isActive,
                isApproved: branch.isApproved,
                revenue,
                paid,
                due:        revenue - paid,
                confirmed:  bBookings.filter(b => b.status === "confirmed").length,
                pending:    bBookings.filter(b => b.status === "pending").length,
                cancelled:  bBookings.filter(b => b.status === "cancelled").length,
                inquiries:  bInquiries.length,
            };
        });

        // ── Monthly chart — last 6 months, all branches ─────────────────────
        const now = new Date();
        const monthlyChart = Array.from({ length: 6 }, (_, i) => {
            const d      = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
            const yr     = d.getFullYear();
            const mo     = String(d.getMonth() + 1).padStart(2, "0");
            const prefix = `${yr}-${mo}`;
            const mBks   = allBookings.filter(b => b.date?.startsWith(prefix));
            return {
                label:   monthLabel(yr, d.getMonth()),
                revenue: mBks.reduce((s, b) => s + (b.amount ?? 0), 0),
                paid:    mBks.reduce((s, b) => s + (b.paid   ?? 0), 0),
            };
        });

        // ── Upcoming events — all branches, next 30 days ────────────────────
        const today    = toYMD(new Date());
        const in30days = toYMD(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
        const upcoming = allBookings
            .filter(b => b.status !== "cancelled" && b.date >= today && b.date <= in30days)
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 8)
            .map(b => ({
                ...b,
                branchName: branchMap.get(b.branchId)?.name ?? "—",
            }));

        return res.status(200).json({
            success: true,
            stats: {
                totalRevenue, totalPaid, totalDue,
                collectionRate,
                confirmed, pending, cancelled, totalBookings,
                totalInquiries, newInquiries,
            },
            branchStats,
            monthlyChart,
            upcoming,
        });
    } catch (err) {
        console.error("[getOverview]", err);
        return res.status(500).json({ success: false, message: "Failed to fetch overview." });
    }
}
