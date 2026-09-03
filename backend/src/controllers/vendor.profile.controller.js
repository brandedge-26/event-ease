import { eq, desc, count, and, lt } from "drizzle-orm";
import { db } from "../db/index.js";
import { vendors, halls, reviews, bookings, branches } from "../db/schema.js";

// GET /api/vendor/profile/me — auth required
export async function getOwnProfile(req, res) {
    try {
        const [vendor] = await db
            .select({
                id:            vendors.id,
                name:          vendors.name,
                slug:          vendors.slug,
                businessType:  vendors.businessType,
                tagline:       vendors.tagline,
                ownerName:     vendors.ownerName,
                email:         vendors.email,
                phone:         vendors.phone,
                whatsapp:      vendors.whatsapp,
                city:          vendors.city,
                area:          vendors.area,
                address:       vendors.address,
                about:         vendors.about,
                services:      vendors.services,
                amenities:     vendors.amenities,
                established:   vendors.established,
                logoUrl:       vendors.logoUrl,
                galleryImages: vendors.galleryImages,
                mapUrl:        vendors.mapUrl,
                isVerified:    vendors.isVerified,
            })
            .from(vendors)
            .where(eq(vendors.id, req.vendor.id))
            .limit(1);

        if (!vendor) return res.status(404).json({ success: false, message: "Profile not found." });

        const vendorHalls = await db
            .select({ id: halls.id, name: halls.name, capacity: halls.capacity, price: halls.price, desc: halls.desc })
            .from(halls)
            .where(eq(halls.vendorId, req.vendor.id));

        return res.status(200).json({ success: true, vendor, halls: vendorHalls });
    } catch (err) {
        console.error("[getOwnProfile]", err);
        return res.status(500).json({ success: false, message: "Failed to fetch profile." });
    }
}

// PATCH /api/vendor/profile/me — auth required
export async function updateOwnProfile(req, res) {
    try {
        const { name, tagline, phone, whatsapp, city, area, address, about, services, amenities, established, galleryImages, mapUrl } = req.body;
        const updates = { updatedAt: new Date() };

        if (name          !== undefined) updates.name          = String(name).trim();
        if (tagline       !== undefined) updates.tagline       = String(tagline).trim() || null;
        if (phone         !== undefined) updates.phone         = String(phone).trim();
        if (whatsapp      !== undefined) updates.whatsapp      = String(whatsapp).trim() || null;
        if (city          !== undefined) updates.city          = String(city).trim();
        if (area          !== undefined) updates.area          = String(area).trim();
        if (address       !== undefined) updates.address       = String(address).trim();
        if (about         !== undefined) updates.about         = String(about).trim() || null;
        if (services      !== undefined) updates.services      = Array.isArray(services) ? services : [];
        if (amenities     !== undefined) updates.amenities     = Array.isArray(amenities) ? amenities : [];
        if (established   !== undefined) updates.established   = established ? Number(established) : null;
        if (galleryImages !== undefined) updates.galleryImages = galleryImages;
        if (mapUrl        !== undefined) updates.mapUrl        = mapUrl ? String(mapUrl).trim() : null;

        await db.update(vendors).set(updates).where(eq(vendors.id, req.vendor.id));
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("[updateOwnProfile]", err);
        return res.status(500).json({ success: false, message: "Failed to update profile." });
    }
}

// GET /api/vendors — public, returns all vendors with their min price
export async function getAllVendors(req, res) {
    try {
        const allVendors = await db
            .select({
                id:           vendors.id,
                name:         vendors.name,
                slug:         vendors.slug,
                businessType: vendors.businessType,
                tagline:      vendors.tagline,
                city:         vendors.city,
                area:         vendors.area,
                logoUrl:       vendors.logoUrl,
                galleryImages: vendors.galleryImages,
                isVerified:    vendors.isVerified,
                createdAt:     vendors.createdAt,
            })
            .from(vendors)
            .orderBy(desc(vendors.createdAt));

        // Fetch min price + capacity + hall count for each vendor
        const allHalls = await db
            .select({
                vendorId: halls.vendorId,
                price:    halls.price,
                capacity: halls.capacity,
            })
            .from(halls);

        const hallsByVendor = allHalls.reduce((acc, h) => {
            if (!acc[h.vendorId]) acc[h.vendorId] = [];
            acc[h.vendorId].push(h);
            return acc;
        }, {});

        const result = allVendors.map((v) => {
            const vHalls    = hallsByVendor[v.id] ?? [];
            const minPrice  = vHalls.length > 0 ? Math.min(...vHalls.map(h => h.price))    : null;
            const maxCap    = vHalls.length > 0 ? Math.max(...vHalls.map(h => h.capacity)) : 0;
            return { ...v, minPrice, maxCapacity: maxCap, hallCount: vHalls.length };
        });

        return res.status(200).json({ success: true, vendors: result });
    } catch (err) {
        console.error("[getAllVendors]", err);
        return res.status(500).json({ success: false, message: "Failed to fetch vendors." });
    }
}

// GET /api/vendor/profile/:slug — public, no auth required
export async function getPublicProfile(req, res) {
    try {
        const { slug } = req.params;

        if (!slug?.trim()) {
            return res.status(400).json({ success: false, message: "Slug is required." });
        }

        // Fetch vendor (select only public fields — no passwordHash / refreshToken)
        const [vendor] = await db
            .select({
                id:           vendors.id,
                name:         vendors.name,
                slug:         vendors.slug,
                businessType: vendors.businessType,
                tagline:      vendors.tagline,
                email:        vendors.email,
                phone:        vendors.phone,
                whatsapp:     vendors.whatsapp,
                city:         vendors.city,
                area:         vendors.area,
                address:      vendors.address,
                about:        vendors.about,
                services:     vendors.services,
                amenities:    vendors.amenities,
                established:  vendors.established,
                logoUrl:       vendors.logoUrl,
                galleryImages: vendors.galleryImages,
                mapUrl:        vendors.mapUrl,
                isVerified:    vendors.isVerified,
                isBlocked:     vendors.isBlocked,
                createdAt:    vendors.createdAt,
            })
            .from(vendors)
            .where(eq(vendors.slug, slug.trim()))
            .limit(1);

        if (!vendor) {
            return res.status(404).json({ success: false, message: "Vendor not found." });
        }

        // Fetch vendor's halls
        const vendorHalls = await db
            .select({
                id:       halls.id,
                name:     halls.name,
                capacity: halls.capacity,
                price:    halls.price,
                desc:     halls.desc,
            })
            .from(halls)
            .where(eq(halls.vendorId, vendor.id));

        const vendorReviews = await db
            .select({
                id:        reviews.id,
                name:      reviews.name,
                rating:    reviews.rating,
                text:      reviews.text,
                createdAt: reviews.createdAt,
            })
            .from(reviews)
            .where(eq(reviews.vendorId, vendor.id))
            .orderBy(desc(reviews.createdAt));

        // Fetch vendor's branches (public — only id, name, city)
        const vendorBranches = await db
            .select({
                id:            branches.id,
                name:          branches.name,
                city:          branches.city,
                area:          branches.area,
                address:       branches.address,
                isDefault:     branches.isDefault,
                phone:         branches.phone,
                whatsapp:      branches.whatsapp,
                email:         branches.email,
                established:   branches.established,
                startingPrice: branches.startingPrice,
                mapUrl:        branches.mapUrl,
                galleryImages: branches.galleryImages,
            })
            .from(branches)
            .where(eq(branches.vendorId, vendor.id))
            .orderBy(branches.createdAt);

        const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
        const [{ confirmedCount }] = await db
            .select({ confirmedCount: count() })
            .from(bookings)
            .where(and(
                eq(bookings.vendorId, vendor.id),
                eq(bookings.status, "confirmed"),
                lt(bookings.date, today),
            ));

        return res.status(200).json({
            success: true,
            vendor,
            halls:        vendorHalls,
            reviews:      vendorReviews,
            totalEvents:  confirmedCount ?? 0,
            branches:     vendorBranches,
        });
    } catch (err) {
        console.error("[getPublicProfile]", err);
        return res.status(500).json({ success: false, message: "Failed to fetch profile." });
    }
}
