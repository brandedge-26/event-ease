import { z } from "zod";

const ROLES      = ["Manager", "Waiter", "Chef", "Security", "Cleaner", "Decorator", "DJ", "Receptionist", "Photographer", "Driver", "Other"];
const STATUSES   = ["active", "on-leave", "inactive"];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const staffBase = z.object({
    name:        z.string().min(2, "Staff name is required"),
    email:       z.string().email().optional().or(z.literal("")),
    phone:       z.string().min(10, "Valid phone number is required"),
    role:        z.enum(ROLES, { error: `Role must be one of: ${ROLES.join(", ")}` }),
    department:  z.string().optional(),
    salary:      z.number().int().nonnegative().optional().default(0),
    joinDate:    z.string().regex(DATE_REGEX, "Join date must be YYYY-MM-DD").optional(),
    status:      z.enum(STATUSES).optional().default("active"),
    address:     z.string().optional(),
    notes:       z.string().optional(),
    avatarColor: z.string().optional(),
});

export const createStaffSchema = staffBase;

export const updateStaffSchema = staffBase.partial().refine(
    (d) => Object.keys(d).length > 0,
    { message: "At least one field is required to update" }
);
