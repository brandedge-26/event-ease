import { eq, desc, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db/index.js";
import { bookings, payments } from "../db/schema.js";

// ── helpers ───────────────────────────────────────────────────────────────────
function parseBooking(b) {
    return {
        ...b,
        services: b.services ? JSON.parse(b.services) : [],
    };
}

// GET /api/vendor/bookings — all bookings for authenticated vendor
export async function getBookings(req, res) {
    try {
        const vendorId = req.vendor.id;

        const bookingFilter = req.branchId
            ? and(eq(bookings.vendorId, vendorId), eq(bookings.branchId, req.branchId))
            : eq(bookings.vendorId, vendorId);

        const paymentFilter = req.branchId
            ? and(eq(payments.vendorId, vendorId), eq(payments.branchId, req.branchId))
            : eq(payments.vendorId, vendorId);

        const [vendorBookings, vendorPayments] = await Promise.all([
            db.select().from(bookings)
                .where(bookingFilter)
                .orderBy(desc(bookings.createdAt)),
            db.select().from(payments)
                .where(paymentFilter)
                .orderBy(desc(payments.createdAt)),
        ]);

        // Group payments by bookingId
        const paymentsByBooking = vendorPayments.reduce((acc, p) => {
            if (!acc[p.bookingId]) acc[p.bookingId] = [];
            acc[p.bookingId].push(p);
            return acc;
        }, {});

        const result = vendorBookings.map(b => ({
            ...parseBooking(b),
            payments: paymentsByBooking[b.id] ?? [],
        }));

        return res.status(200).json({ success: true, bookings: result });
    } catch (err) {
        console.error("[getBookings]", err);
        return res.status(500).json({ success: false, message: "Failed to fetch bookings." });
    }
}

// POST /api/vendor/bookings — create a new booking
export async function createBooking(req, res) {
    try {
        const vendorId = req.vendor.id;
        const { customerName, phone, event, hall, date, timeFrom, timeTo,
                guests, amount, hallAmount, paid, status, notes, services } = req.body;

        const id = randomUUID();

        await db.insert(bookings).values({
            id,
            vendorId,
            branchId:   req.branchId ?? null,
            customerName,
            phone:      phone ?? "",
            event,
            hall,
            date,
            timeFrom:   timeFrom  ?? null,
            timeTo:     timeTo    ?? null,
            guests:     guests    ?? 0,
            amount:     amount    ?? 0,
            hallAmount: hallAmount ?? 0,
            paid:       paid      ?? 0,
            status:     status    ?? "pending",
            notes:      notes     ?? null,
            services:   services?.length ? JSON.stringify(services) : null,
        });

        // Record advance payment if any
        if (paid && paid > 0) {
            const today = new Date().toISOString().slice(0, 10);
            await db.insert(payments).values({
                id:        randomUUID(),
                bookingId: id,
                vendorId,
                amount:    paid,
                method:    "Cash",
                note:      "Advance",
                date:      today,
            });
        }

        return res.status(201).json({ success: true, id });
    } catch (err) {
        console.error("[createBooking]", err);
        return res.status(500).json({ success: false, message: "Failed to create booking." });
    }
}

// PATCH /api/vendor/bookings/:id — update a booking
export async function updateBooking(req, res) {
    try {
        const vendorId = req.vendor.id;
        const { id }   = req.params;

        const [existing] = await db
            .select({ id: bookings.id, vendorId: bookings.vendorId })
            .from(bookings).where(eq(bookings.id, id)).limit(1);

        if (!existing)                      return res.status(404).json({ success: false, message: "Booking not found." });
        if (existing.vendorId !== vendorId) return res.status(403).json({ success: false, message: "Forbidden." });

        const { customerName, phone, event, hall, date, timeFrom, timeTo,
                guests, amount, hallAmount, paid, status, notes, services } = req.body;

        const updates = { updatedAt: new Date() };

        if (customerName !== undefined) updates.customerName = customerName;
        if (phone        !== undefined) updates.phone        = phone;
        if (event        !== undefined) updates.event        = event;
        if (hall         !== undefined) updates.hall         = hall;
        if (date         !== undefined) updates.date         = date;
        if (timeFrom     !== undefined) updates.timeFrom     = timeFrom || null;
        if (timeTo       !== undefined) updates.timeTo       = timeTo   || null;
        if (guests       !== undefined) updates.guests       = guests;
        if (amount       !== undefined) updates.amount       = amount;
        if (hallAmount   !== undefined) updates.hallAmount   = hallAmount;
        if (paid         !== undefined) updates.paid         = paid;
        if (status       !== undefined) updates.status       = status;
        if (notes        !== undefined) updates.notes        = notes || null;
        if (services     !== undefined) updates.services     = services.length ? JSON.stringify(services) : null;

        await db.update(bookings).set(updates).where(eq(bookings.id, id));

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("[updateBooking]", err);
        return res.status(500).json({ success: false, message: "Failed to update booking." });
    }
}

// DELETE /api/vendor/bookings/:id — permanently delete a booking (cascades payments)
export async function deleteBooking(req, res) {
    try {
        const vendorId = req.vendor.id;
        const { id }   = req.params;

        const [existing] = await db
            .select({ id: bookings.id, vendorId: bookings.vendorId })
            .from(bookings).where(eq(bookings.id, id)).limit(1);

        if (!existing)                      return res.status(404).json({ success: false, message: "Booking not found." });
        if (existing.vendorId !== vendorId) return res.status(403).json({ success: false, message: "Forbidden." });

        await db.delete(bookings).where(eq(bookings.id, id)); // payments cascade

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("[deleteBooking]", err);
        return res.status(500).json({ success: false, message: "Failed to delete booking." });
    }
}

// PATCH /api/vendor/bookings/:id/cancel — cancel a booking
export async function cancelBooking(req, res) {
    try {
        const vendorId = req.vendor.id;
        const { id }   = req.params;

        const [existing] = await db
            .select({ id: bookings.id, vendorId: bookings.vendorId })
            .from(bookings).where(eq(bookings.id, id)).limit(1);

        if (!existing)                      return res.status(404).json({ success: false, message: "Booking not found." });
        if (existing.vendorId !== vendorId) return res.status(403).json({ success: false, message: "Forbidden." });

        await db.update(bookings)
            .set({ status: "cancelled", updatedAt: new Date() })
            .where(eq(bookings.id, id));

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("[cancelBooking]", err);
        return res.status(500).json({ success: false, message: "Failed to cancel booking." });
    }
}

// PATCH /api/vendor/bookings/:id/payments/:paymentId — edit a payment
export async function editPayment(req, res) {
    try {
        const vendorId          = req.vendor.id;
        const { id: bookingId, paymentId } = req.params;
        const { amount, method, note, date } = req.body;

        const [existing] = await db
            .select({ id: payments.id, bookingId: payments.bookingId, vendorId: payments.vendorId, amount: payments.amount })
            .from(payments).where(eq(payments.id, paymentId)).limit(1);

        if (!existing)                      return res.status(404).json({ success: false, message: "Payment not found." });
        if (existing.vendorId !== vendorId) return res.status(403).json({ success: false, message: "Forbidden." });
        if (existing.bookingId !== bookingId) return res.status(400).json({ success: false, message: "Payment does not belong to this booking." });

        const updates = {};
        if (amount !== undefined) updates.amount = amount;
        if (method !== undefined) updates.method = method;
        if (note   !== undefined) updates.note   = note || null;
        if (date   !== undefined) updates.date   = date;

        await db.update(payments).set(updates).where(eq(payments.id, paymentId));

        // If amount changed, recompute booking.paid
        if (amount !== undefined && amount !== existing.amount) {
            const diff    = amount - existing.amount;
            const [bk]    = await db.select({ paid: bookings.paid }).from(bookings).where(eq(bookings.id, bookingId)).limit(1);
            const newPaid = Math.max(0, (bk?.paid ?? 0) + diff);
            await db.update(bookings).set({ paid: newPaid, updatedAt: new Date() }).where(eq(bookings.id, bookingId));
            return res.status(200).json({ success: true, newPaid });
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("[editPayment]", err);
        return res.status(500).json({ success: false, message: "Failed to edit payment." });
    }
}

// DELETE /api/vendor/bookings/:id/payments/:paymentId — delete a payment
export async function deletePayment(req, res) {
    try {
        const vendorId          = req.vendor.id;
        const { id: bookingId, paymentId } = req.params;

        const [existing] = await db
            .select({ id: payments.id, bookingId: payments.bookingId, vendorId: payments.vendorId, amount: payments.amount })
            .from(payments).where(eq(payments.id, paymentId)).limit(1);

        if (!existing)                        return res.status(404).json({ success: false, message: "Payment not found." });
        if (existing.vendorId !== vendorId)   return res.status(403).json({ success: false, message: "Forbidden." });
        if (existing.bookingId !== bookingId) return res.status(400).json({ success: false, message: "Payment does not belong to this booking." });

        await db.delete(payments).where(eq(payments.id, paymentId));

        // Recompute booking.paid
        const [bk]    = await db.select({ paid: bookings.paid }).from(bookings).where(eq(bookings.id, bookingId)).limit(1);
        const newPaid = Math.max(0, (bk?.paid ?? 0) - existing.amount);
        await db.update(bookings).set({ paid: newPaid, updatedAt: new Date() }).where(eq(bookings.id, bookingId));

        return res.status(200).json({ success: true, newPaid });
    } catch (err) {
        console.error("[deletePayment]", err);
        return res.status(500).json({ success: false, message: "Failed to delete payment." });
    }
}

// POST /api/vendor/bookings/:id/payments — add a payment to a booking
export async function addPayment(req, res) {
    try {
        const vendorId      = req.vendor.id;
        const { id: bookingId } = req.params;
        const { amount, method, note, date } = req.body;

        const [existing] = await db
            .select({ id: bookings.id, paid: bookings.paid, amount: bookings.amount, vendorId: bookings.vendorId })
            .from(bookings).where(eq(bookings.id, bookingId)).limit(1);

        if (!existing)                      return res.status(404).json({ success: false, message: "Booking not found." });
        if (existing.vendorId !== vendorId) return res.status(403).json({ success: false, message: "Forbidden." });

        const today     = new Date().toISOString().slice(0, 10);
        const paymentId = randomUUID();
        const newPaid   = (existing.paid ?? 0) + amount;

        await db.insert(payments).values({
            id:        paymentId,
            bookingId,
            vendorId,
            amount,
            method:    method ?? "Cash",
            note:      note   ?? null,
            date:      date   ?? today,
        });

        await db.update(bookings)
            .set({ paid: newPaid, updatedAt: new Date() })
            .where(eq(bookings.id, bookingId));

        return res.status(201).json({ success: true, id: paymentId, newPaid });
    } catch (err) {
        console.error("[addPayment]", err);
        return res.status(500).json({ success: false, message: "Failed to record payment." });
    }
}
