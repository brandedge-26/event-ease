import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { bookings, payments, staff } from "../db/schema.js";

function getRangeDates(range) {
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth();

    let start, end, prevStart, prevEnd;

    if (range === "this_month") {
        start    = new Date(y, m, 1);
        end      = new Date(y, m + 1, 0);
        prevStart = new Date(y, m - 1, 1);
        prevEnd  = new Date(y, m, 0);
    } else if (range === "last_month") {
        start    = new Date(y, m - 1, 1);
        end      = new Date(y, m, 0);
        prevStart = new Date(y, m - 2, 1);
        prevEnd  = new Date(y, m - 1, 0);
    } else if (range === "last_3") {
        start    = new Date(y, m - 2, 1);
        end      = new Date(y, m + 1, 0);
        prevStart = new Date(y, m - 5, 1);
        prevEnd  = new Date(y, m - 2, 0);
    } else if (range === "last_6") {
        start    = new Date(y, m - 5, 1);
        end      = new Date(y, m + 1, 0);
        prevStart = new Date(y, m - 11, 1);
        prevEnd  = new Date(y, m - 5, 0);
    } else {
        // all time — no filtering
        start = prevStart = prevEnd = null;
        end   = null;
    }

    return { start, end, prevStart, prevEnd };
}

function toYMD(d) {
    const y  = d.getFullYear();
    const m  = String(d.getMonth() + 1).padStart(2, "0");
    const dy = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dy}`;
}
function inRange(dateStr, start, end) {
    if (!start) return true;
    return dateStr >= toYMD(start) && dateStr <= toYMD(end);
}

function monthLabel(yr, mo) {
    return new Date(yr, mo, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

// GET /api/vendor/reports?range=this_month  OR  ?month=2025-08
export async function getReports(req, res) {
    try {
        const monthParam = req.query.month; // "YYYY-MM"
        let start, end, prevStart, prevEnd;

        if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
            const [y, m] = monthParam.split("-").map(Number);
            start     = new Date(y, m - 1, 1);
            end       = new Date(y, m, 0);
            prevStart = new Date(y, m - 2, 1);
            prevEnd   = new Date(y, m - 1, 0);
        } else {
            const range = req.query.range ?? "this_month";
            ({ start, end, prevStart, prevEnd } = getRangeDates(range));
        }

        const vendorId = req.vendor.id;
        const branchId = req.branchId;

        const bookingFilter = branchId
            ? and(eq(bookings.vendorId, vendorId), eq(bookings.branchId, branchId))
            : eq(bookings.vendorId, vendorId);

        const staffFilter = branchId
            ? and(eq(staff.vendorId, vendorId), eq(staff.branchId, branchId))
            : eq(staff.vendorId, vendorId);

        // Fetch all vendor bookings
        const allBookings = await db
            .select({
                id:           bookings.id,
                customerName: bookings.customerName,
                phone:        bookings.phone,
                event:        bookings.event,
                hall:         bookings.hall,
                date:         bookings.date,
                timeFrom:     bookings.timeFrom,
                timeTo:       bookings.timeTo,
                guests:       bookings.guests,
                amount:       bookings.amount,
                paid:         bookings.paid,
                status:       bookings.status,
            })
            .from(bookings)
            .where(bookingFilter);

        // Fetch all vendor staff
        const allStaff = await db
            .select({ salary: staff.salary, status: staff.status })
            .from(staff)
            .where(staffFilter);

        // ── Filter by range ──
        const filtered = allBookings.filter(b => inRange(b.date, start, end));
        const prevFiltered = allBookings.filter(b => inRange(b.date, prevStart, prevEnd));

        // ── Revenue stats ──
        const totalRevenue   = filtered.reduce((s, b) => s + (b.amount ?? 0), 0);
        const totalPaid      = filtered.reduce((s, b) => s + (b.paid   ?? 0), 0);
        const totalDue       = totalRevenue - totalPaid;
        const prevRevenue    = prevFiltered.reduce((s, b) => s + (b.amount ?? 0), 0);
        const revenueChange  = prevRevenue > 0
            ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100)
            : null;
        const collectionRate = totalRevenue > 0
            ? Math.round((totalPaid / totalRevenue) * 100)
            : 0;

        // ── Booking status counts ──
        const confirmed = filtered.filter(b => b.status === "confirmed").length;
        const pending   = filtered.filter(b => b.status === "pending").length;
        const cancelled = filtered.filter(b => b.status === "cancelled").length;

        // ── Monthly chart (last 6 months) ──
        const now = new Date();
        const monthlyChart = Array.from({ length: 6 }, (_, i) => {
            const d  = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
            const yr = d.getFullYear();
            const mo = String(d.getMonth() + 1).padStart(2, "0");
            const prefix = `${yr}-${mo}`;
            const mBks = allBookings.filter(b => b.date?.startsWith(prefix));
            return {
                label:   monthLabel(yr, d.getMonth()),
                revenue: mBks.reduce((s, b) => s + (b.amount ?? 0), 0),
                paid:    mBks.reduce((s, b) => s + (b.paid   ?? 0), 0),
            };
        });

        // ── Top customers ──
        const custMap = new Map();
        for (const b of filtered) {
            const key = `${b.customerName}__${b.phone}`;
            const c = custMap.get(key) ?? { name: b.customerName, phone: b.phone, spent: 0, paid: 0, count: 0 };
            c.spent += (b.amount ?? 0);
            c.paid  += (b.paid   ?? 0);
            c.count += 1;
            custMap.set(key, c);
        }
        const topCustomers = [...custMap.values()].sort((a, b) => b.spent - a.spent).slice(0, 5);

        // ── Upcoming events (next 30 days) ──
        const today    = toYMD(new Date());
        const in30days = toYMD(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
        const upcoming = allBookings
            .filter(b => b.status !== "cancelled" && b.date >= today && b.date <= in30days)
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 6);

        // ── Payroll ──
        const monthlyPayroll    = allStaff.filter(s => s.status !== "inactive").reduce((s, st) => s + (st.salary ?? 0), 0);
        const activeStaffCount  = allStaff.filter(s => s.status === "active").length;

        return res.status(200).json({
            success: true,
            stats: {
                totalRevenue, totalPaid, totalDue,
                revenueChange, collectionRate,
                confirmed, pending, cancelled,
            },
            monthlyChart,
            topCustomers,
            upcoming,
            payroll: { monthlyPayroll, activeStaffCount },
        });
    } catch (err) {
        console.error("[getReports]", err);
        return res.status(500).json({ success: false, message: "Failed to fetch reports." });
    }
}
