import { eq, desc, count } from "drizzle-orm";
import { db } from "../db/index.js";
import { bookings, vendors } from "../db/schema.js";

const PAGE_SIZE = 10;

// GET /api/admin/bookings?page=1
export async function getAllBookings(req, res) {
    try {
        const page   = Math.max(1, parseInt(req.query.page) || 1);
        const offset = (page - 1) * PAGE_SIZE;

        const [{ total }] = await db.select({ total: count() }).from(bookings);

        const rows = await db
            .select({
                id:           bookings.id,
                customerName: bookings.customerName,
                phone:        bookings.phone,
                event:        bookings.event,
                hall:         bookings.hall,
                date:         bookings.date,
                guests:       bookings.guests,
                amount:       bookings.amount,
                paid:         bookings.paid,
                status:       bookings.status,
                createdAt:    bookings.createdAt,
                vendorId:     bookings.vendorId,
                vendorName:   vendors.name,
            })
            .from(bookings)
            .leftJoin(vendors, eq(bookings.vendorId, vendors.id))
            .orderBy(desc(bookings.createdAt))
            .limit(PAGE_SIZE)
            .offset(offset);

        return res.json({
            success: true,
            bookings: rows,
            pagination: {
                page,
                pageSize: PAGE_SIZE,
                total,
                totalPages: Math.ceil(total / PAGE_SIZE),
            },
        });
    } catch (err) {
        console.error("[admin getAllBookings]", err);
        return res.status(500).json({ success: false, message: "Failed to fetch bookings." });
    }
}

// GET /api/admin/bookings/:id
export async function getBookingDetail(req, res) {
    try {
        const { id } = req.params;

        const [booking] = await db
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
                hallAmount:   bookings.hallAmount,
                paid:         bookings.paid,
                status:       bookings.status,
                notes:        bookings.notes,
                services:     bookings.services,
                createdAt:    bookings.createdAt,
                updatedAt:    bookings.updatedAt,
                vendorId:     bookings.vendorId,
                vendorName:   vendors.name,
                vendorSlug:   vendors.slug,
                vendorPhone:  vendors.phone,
                vendorCity:   vendors.city,
            })
            .from(bookings)
            .leftJoin(vendors, eq(bookings.vendorId, vendors.id))
            .where(eq(bookings.id, id))
            .limit(1);

        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found." });
        }

        return res.json({ success: true, booking });
    } catch (err) {
        console.error("[admin getBookingDetail]", err);
        return res.status(500).json({ success: false, message: "Failed to fetch booking." });
    }
}

// DELETE /api/admin/bookings/:id
export async function deleteBooking(req, res) {
    try {
        const { id } = req.params;

        const [existing] = await db.select({ id: bookings.id }).from(bookings).where(eq(bookings.id, id)).limit(1);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Booking not found." });
        }

        await db.delete(bookings).where(eq(bookings.id, id));
        return res.json({ success: true });
    } catch (err) {
        console.error("[admin deleteBooking]", err);
        return res.status(500).json({ success: false, message: "Failed to delete booking." });
    }
}
