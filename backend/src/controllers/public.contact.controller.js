import { randomUUID } from "crypto";
import { db } from "../db/index.js";
import { applications } from "../db/schema.js";
import { createNotification } from "../utils/notify.js";

// POST /api/contact
export async function submitContact(req, res) {
    try {
        const { name, email, subject, message } = req.body;
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        const id = randomUUID();
        await db.insert(applications).values({ id, name: name.trim(), email: email.trim().toLowerCase(), subject: subject.trim(), message: message.trim() });

        // Fire admin notification
        createNotification({
            type:  "new_application",
            title: "New Contact Application",
            body:  `${name.trim()} (${email.trim()}) sent a message: "${subject.trim()}"`,
            refId: id,
        });

        return res.json({ success: true, message: "Your message has been sent!" });
    } catch (err) {
        console.error("[submitContact]", err);
        return res.status(500).json({ success: false, message: "Failed to send message." });
    }
}
