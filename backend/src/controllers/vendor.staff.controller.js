import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db/index.js";
import { staff } from "../db/schema.js";

// GET /api/vendor/staff
export async function getStaff(req, res) {
    try {
        const vendorId = req.vendor.id;
        const rows = await db
            .select()
            .from(staff)
            .where(eq(staff.vendorId, vendorId))
            .orderBy(desc(staff.createdAt));

        return res.status(200).json({ success: true, staff: rows });
    } catch (err) {
        console.error("[getStaff]", err);
        return res.status(500).json({ success: false, message: "Failed to fetch staff." });
    }
}

// POST /api/vendor/staff
export async function createStaff(req, res) {
    try {
        const vendorId = req.vendor.id;
        const { name, email, phone, role, department, salary, joinDate, status, address, notes, avatarColor, avatarUrl } = req.body;

        const id = randomUUID();

        await db.insert(staff).values({
            id,
            vendorId,
            name,
            email:       email       ?? "",
            phone:       phone       ?? "",
            role,
            department:  department  ?? "",
            salary:      salary      ?? 0,
            joinDate:    joinDate    ?? null,
            status:      status      ?? "active",
            address:     address     ?? "",
            notes:       notes       ?? "",
            avatarColor: avatarColor ?? "#E0E7FF",
            avatarUrl:   avatarUrl   ?? null,
        });

        return res.status(201).json({ success: true, id });
    } catch (err) {
        console.error("[createStaff]", err);
        return res.status(500).json({ success: false, message: "Failed to create staff member." });
    }
}

// PATCH /api/vendor/staff/:id
export async function updateStaff(req, res) {
    try {
        const vendorId = req.vendor.id;
        const { id }   = req.params;

        const [existing] = await db
            .select({ id: staff.id, vendorId: staff.vendorId })
            .from(staff).where(eq(staff.id, id)).limit(1);

        if (!existing)                      return res.status(404).json({ success: false, message: "Staff member not found." });
        if (existing.vendorId !== vendorId) return res.status(403).json({ success: false, message: "Forbidden." });

        const { name, email, phone, role, department, salary, joinDate, status, address, notes, avatarColor, avatarUrl } = req.body;

        const updates = { updatedAt: new Date() };
        if (name        !== undefined) updates.name        = name;
        if (email       !== undefined) updates.email       = email;
        if (phone       !== undefined) updates.phone       = phone;
        if (role        !== undefined) updates.role        = role;
        if (department  !== undefined) updates.department  = department;
        if (salary      !== undefined) updates.salary      = salary;
        if (joinDate    !== undefined) updates.joinDate    = joinDate ?? null;
        if (status      !== undefined) updates.status      = status;
        if (address     !== undefined) updates.address     = address;
        if (notes       !== undefined) updates.notes       = notes;
        if (avatarColor !== undefined) updates.avatarColor = avatarColor;
        if (avatarUrl   !== undefined) updates.avatarUrl   = avatarUrl ?? null;

        await db.update(staff).set(updates).where(eq(staff.id, id));

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("[updateStaff]", err);
        return res.status(500).json({ success: false, message: "Failed to update staff member." });
    }
}

// DELETE /api/vendor/staff/:id
export async function deleteStaff(req, res) {
    try {
        const vendorId = req.vendor.id;
        const { id }   = req.params;

        const [existing] = await db
            .select({ id: staff.id, vendorId: staff.vendorId })
            .from(staff).where(eq(staff.id, id)).limit(1);

        if (!existing)                      return res.status(404).json({ success: false, message: "Staff member not found." });
        if (existing.vendorId !== vendorId) return res.status(403).json({ success: false, message: "Forbidden." });

        await db.delete(staff).where(eq(staff.id, id));

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("[deleteStaff]", err);
        return res.status(500).json({ success: false, message: "Failed to delete staff member." });
    }
}
