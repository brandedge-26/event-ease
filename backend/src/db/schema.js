import { pgTable, text, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const bookingStatusEnum  = pgEnum("booking_status",  ["confirmed", "pending", "cancelled", "blocked"]);
export const paymentMethodEnum  = pgEnum("payment_method",  ["Cash", "Bank Transfer", "Cheque", "Online"]);
export const paymentStatusEnum  = pgEnum("payment_status",  ["paid", "partial", "pending", "overdue"]);
export const vendorTypeEnum     = pgEnum("vendor_type",     [
    "Banquet Hall", "Marquee", "Ballroom", "Wedding Lawn", "Hotel Banquet",
    "Rooftop Venue", "Farm House", "Beauty Parlor", "Florist",
    "Catering", "Decoration", "Photography", "Sound & Lights", "Car Rental", "Fireworks",
]);

// ─── Vendors ──────────────────────────────────────────────────────────────────
export const vendors = pgTable("vendors", {
    id:            text("id").primaryKey(),
    // Business
    name:          text("name").notNull(),               // businessName
    slug:          text("slug").notNull().unique(),
    businessType:  vendorTypeEnum("business_type").notNull(),
    tagline:       text("tagline"),
    // Owner / Auth
    ownerName:     text("owner_name").notNull(),
    email:         text("email").notNull().unique(),
    passwordHash:  text("password_hash").notNull(),
    // Contact
    phone:         text("phone").notNull(),
    whatsapp:      text("whatsapp"),
    // Location
    city:          text("city").notNull(),
    area:          text("area").notNull(),
    address:       text("address").notNull(),
    // Identity
    cnic:          text("cnic"),
    // Profile
    about:         text("about"),
    services:      text("services").array(),
    amenities:     text("amenities").array(),
    established:   integer("established"),
    // Auth session
    refreshToken:  text("refresh_token"),
    // Media
    logoUrl:       text("logo_url"),
    galleryImages: text("gallery_images").array(),
    mapUrl:        text("map_url"),
    // Status
    isVerified:    boolean("is_verified").default(false),
    isBlocked:     boolean("is_blocked").default(false),
    isFeatured:    boolean("is_featured").default(false),
    featuredAt:    timestamp("featured_at"),
    createdAt:     timestamp("created_at").defaultNow(),
    updatedAt:     timestamp("updated_at").defaultNow(),
});

// ─── Branches ─────────────────────────────────────────────────────────────────
export const branches = pgTable("branches", {
    id:        text("id").primaryKey(),
    vendorId:  text("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
    name:      text("name").notNull(),          // e.g. "Lahore Branch"
    city:      text("city").notNull(),
    area:      text("area").notNull(),
    address:   text("address").notNull(),
    // Branch-specific contact
    phone:         text("phone"),
    whatsapp:      text("whatsapp"),
    email:         text("email"),
    // Branch-specific details
    established:   integer("established"),
    startingPrice: integer("starting_price"),
    mapUrl:        text("map_url"),
    galleryImages: text("gallery_images").array(),
    isDefault:  boolean("is_default").default(false),
    isActive:   boolean("is_active").default(true),
    isApproved: boolean("is_approved").default(false),
    createdAt:  timestamp("created_at").defaultNow(),
});

// ─── Halls ────────────────────────────────────────────────────────────────────
export const halls = pgTable("halls", {
    id:        text("id").primaryKey(),
    vendorId:  text("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
    branchId:  text("branch_id").references(() => branches.id, { onDelete: "set null" }),
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
    branchId:  text("branch_id").references(() => branches.id, { onDelete: "set null" }),
    name:      text("name").notNull(),
    phone:     text("phone").notNull(),
    email:     text("email"),
    createdAt: timestamp("created_at").defaultNow(),
});

// ─── Bookings ─────────────────────────────────────────────────────────────────
export const bookings = pgTable("bookings", {
    id:          text("id").primaryKey(),
    vendorId:    text("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
    branchId:    text("branch_id").references(() => branches.id, { onDelete: "set null" }),
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
    hallAmount:  integer("hall_amount").default(0),
    paid:        integer("paid").default(0),
    status:      bookingStatusEnum("status").default("pending"),
    notes:       text("notes"),
    services:    text("services"),   // JSON-encoded BookingService[]
    createdAt:   timestamp("created_at").defaultNow(),
    updatedAt:   timestamp("updated_at").defaultNow(),
});

// ─── Payments ─────────────────────────────────────────────────────────────────
export const payments = pgTable("payments", {
    id:          text("id").primaryKey(),
    bookingId:   text("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
    vendorId:    text("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
    branchId:    text("branch_id").references(() => branches.id, { onDelete: "set null" }),
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
    branchId:    text("branch_id").references(() => branches.id, { onDelete: "set null" }),
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

// ─── Inquiries ────────────────────────────────────────────────────────────────
export const inquiries = pgTable("inquiries", {
    id:        text("id").primaryKey(),
    vendorId:  text("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
    branchId:  text("branch_id").references(() => branches.id, { onDelete: "set null" }),
    name:      text("name").notNull(),
    phone:     text("phone").notNull(),
    email:     text("email"),
    message:   text("message").notNull(),
    eventDate: text("event_date"),
    eventType: text("event_type"),
    guests:    integer("guests"),
    status:    text("status").default("new"),   // new | read | replied
    createdAt: timestamp("created_at").defaultNow(),
});

// ─── Vendor Notifications ─────────────────────────────────────────────────────
export const vendorNotifications = pgTable("vendor_notifications", {
    id:        text("id").primaryKey(),
    vendorId:  text("vendor_id").notNull(),
    branchId:  text("branch_id").references(() => branches.id, { onDelete: "set null" }),
    type:      text("type").notNull(),      // "inquiry", "booking", "review", "system"
    title:     text("title").notNull(),
    body:      text("body").notNull(),
    isRead:    boolean("is_read").default(false),
    link:      text("link"),                // deep link e.g. /vendor/dashboard/inquiries
    refId:     text("ref_id"),              // inquiry/booking id
    createdAt: timestamp("created_at").defaultNow(),
});

// ─── Staff ────────────────────────────────────────────────────────────────────
export const staff = pgTable("staff", {
    id:          text("id").primaryKey(),
    vendorId:    text("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
    branchId:    text("branch_id").references(() => branches.id, { onDelete: "set null" }),
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
    avatarUrl:   text("avatar_url"),
    createdAt:   timestamp("created_at").defaultNow(),
    updatedAt:   timestamp("updated_at").defaultNow(),
});

// ─── Marketplace Users ────────────────────────────────────────────────────────
export const marketplaceUsers = pgTable("marketplace_users", {
    id:           text("id").primaryKey(),
    name:         text("name").notNull(),
    email:        text("email").notNull().unique(),
    passwordHash: text("password_hash"),
    googleId:     text("google_id"),
    avatarUrl:    text("avatar_url"),
    refreshToken: text("refresh_token"),
    isBlocked:    boolean("is_blocked").default(false),
    createdAt:    timestamp("created_at").defaultNow(),
    updatedAt:    timestamp("updated_at").defaultNow(),
});

// ─── Admins ───────────────────────────────────────────────────────────────────
export const admins = pgTable("admins", {
    id:           text("id").primaryKey(),
    email:        text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    createdAt:    timestamp("created_at").defaultNow(),
});

// ─── Admin Notifications ──────────────────────────────────────────────────────
export const notifications = pgTable("notifications", {
    id:        text("id").primaryKey(),
    type:      text("type").notNull(),           // "new_vendor" | "new_booking" etc.
    title:     text("title").notNull(),
    body:      text("body").notNull(),
    isRead:    boolean("is_read").default(false),
    refId:     text("ref_id"),                   // vendorId or bookingId
    createdAt: timestamp("created_at").defaultNow(),
});

// ─── Contact Applications ─────────────────────────────────────────────────────
export const applications = pgTable("applications", {
    id:        text("id").primaryKey(),
    name:      text("name").notNull(),
    email:     text("email").notNull(),
    subject:   text("subject").notNull(),
    message:   text("message").notNull(),
    isRead:    boolean("is_read").default(false),
    createdAt: timestamp("created_at").defaultNow(),
});

// ─── Reviews ──────────────────────────────────────────────────────────────────
export const reviews = pgTable("reviews", {
    id:        text("id").primaryKey(),
    vendorId:  text("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
    name:      text("name").notNull(),
    rating:    integer("rating").notNull(),
    text:      text("text").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

// ─── Quotations ───────────────────────────────────────────────────────────────
export const quotationStatusEnum = pgEnum("quotation_status", ["pending", "accepted", "rejected"]);

export const quotations = pgTable("quotations", {
    id:           text("id").primaryKey(),
    vendorId:     text("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
    branchId:     text("branch_id").references(() => branches.id, { onDelete: "set null" }),
    customerName: text("customer_name").notNull(),
    phone:        text("phone").default(""),
    email:        text("email").default(""),
    event:        text("event").notNull(),
    hall:         text("hall").notNull(),
    date:         text("date"),
    guests:       integer("guests").default(0),
    hallAmount:   integer("hall_amount").default(0),
    services:     text("services"),   // JSON-encoded ServiceEntry[]
    notes:        text("notes"),
    status:       quotationStatusEnum("status").default("pending"),
    createdAt:    timestamp("created_at").defaultNow(),
    updatedAt:    timestamp("updated_at").defaultNow(),
});

// ─── Promo Banners ────────────────────────────────────────────────────────────
export const promoBanners = pgTable("promo_banners", {
    id:          text("id").primaryKey(),
    title:       text("title").notNull(),
    subtitle:    text("subtitle"),
    ctaText:     text("cta_text"),
    ctaLink:     text("cta_link").notNull(),
    imageUrl:    text("image_url").notNull(),
    height:      integer("height").default(300),
    sortOrder:   integer("sort_order").default(0),
    isActive:    boolean("is_active").default(true),
    expiresAt:   timestamp("expires_at"),           // null = no expiry
    createdAt:   timestamp("created_at").defaultNow(),
});
