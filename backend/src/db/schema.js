import { pgTable, text, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const bookingStatusEnum = pgEnum("booking_status", ["confirmed", "pending", "cancelled"]);
export const paymentMethodEnum = pgEnum("payment_method", ["Cash", "Bank Transfer", "Cheque", "Online"]);
export const paymentStatusEnum = pgEnum("payment_status", ["paid", "partial", "pending", "overdue"]);

// ─── Vendors ──────────────────────────────────────────────────────────────────
export const vendors = pgTable("vendors", {
    id:          text("id").primaryKey(),
    name:        text("name").notNull(),
    slug:        text("slug").notNull().unique(),
    tagline:     text("tagline"),
    email:       text("email").notNull().unique(),
    phone:       text("phone"),
    whatsapp:    text("whatsapp"),
    location:    text("location"),
    about:       text("about"),
    established: integer("established"),
    isVerified:  boolean("is_verified").default(false),
    createdAt:   timestamp("created_at").defaultNow(),
    updatedAt:   timestamp("updated_at").defaultNow(),
});

// ─── Halls ────────────────────────────────────────────────────────────────────
export const halls = pgTable("halls", {
    id:        text("id").primaryKey(),
    vendorId:  text("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
    name:      text("name").notNull(),
    capacity:  integer("capacity").notNull(),
    price:     integer("price").notNull(),
    desc:      text("desc"),
    createdAt: timestamp("created_at").defaultNow(),
});

// ─── Customers ────────────────────────────────────────────────────────────────
export const customers = pgTable("customers", {
    id:        text("id").primaryKey(),
    vendorId:  text("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
    name:      text("name").notNull(),
    phone:     text("phone").notNull(),
    email:     text("email"),
    createdAt: timestamp("created_at").defaultNow(),
});

// ─── Bookings ─────────────────────────────────────────────────────────────────
export const bookings = pgTable("bookings", {
    id:          text("id").primaryKey(),
    vendorId:    text("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
    customerId:  text("customer_id").references(() => customers.id),
    customerName: text("customer_name").notNull(),
    phone:       text("phone").notNull(),
    event:       text("event").notNull(),
    hall:        text("hall").notNull(),
    date:        text("date").notNull(),
    timeFrom:    text("time_from"),
    timeTo:      text("time_to"),
    guests:      integer("guests").default(0),
    amount:      integer("amount").default(0),
    paid:        integer("paid").default(0),
    status:      bookingStatusEnum("status").default("pending"),
    notes:       text("notes"),
    createdAt:   timestamp("created_at").defaultNow(),
    updatedAt:   timestamp("updated_at").defaultNow(),
});

// ─── Payments ─────────────────────────────────────────────────────────────────
export const payments = pgTable("payments", {
    id:          text("id").primaryKey(),
    bookingId:   text("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
    vendorId:    text("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
    amount:      integer("amount").notNull(),
    method:      paymentMethodEnum("method").default("Cash"),
    note:        text("note"),
    date:        text("date"),
    createdAt:   timestamp("created_at").defaultNow(),
});

// ─── Packages ─────────────────────────────────────────────────────────────────
export const packages = pgTable("packages", {
    id:          text("id").primaryKey(),
    vendorId:    text("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
    name:        text("name").notNull(),
    category:    text("category").notNull(),
    description: text("description"),
    price:       integer("price").notNull(),
    maxGuests:   integer("max_guests"),
    duration:    text("duration"),
    includes:    text("includes").array(),
    status:      text("status").default("active"),
    createdAt:   timestamp("created_at").defaultNow(),
    updatedAt:   timestamp("updated_at").defaultNow(),
});

// ─── Staff ────────────────────────────────────────────────────────────────────
export const staff = pgTable("staff", {
    id:          text("id").primaryKey(),
    vendorId:    text("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
    name:        text("name").notNull(),
    email:       text("email"),
    phone:       text("phone"),
    role:        text("role").notNull(),
    department:  text("department"),
    salary:      integer("salary").default(0),
    joinDate:    text("join_date"),
    status:      text("status").default("active"),
    address:     text("address"),
    notes:       text("notes"),
    avatarColor: text("avatar_color"),
    createdAt:   timestamp("created_at").defaultNow(),
    updatedAt:   timestamp("updated_at").defaultNow(),
});
