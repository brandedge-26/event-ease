// Generate a URL-safe slug from a business name
// e.g. "Al-Noor Banquet Hall" → "al-noor-banquet-hall"
export function slugify(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")   // remove special chars
        .replace(/[\s_]+/g, "-")    // spaces/underscores → hyphens
        .replace(/-+/g, "-");       // collapse duplicate hyphens
}
