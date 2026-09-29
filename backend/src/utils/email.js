import { Resend } from "resend";
import { ENV } from "../config/envs.js";
import {
    otpTemplate,
    vendorWelcomeTemplate,
    vendorVerifiedTemplate,
    userWelcomeTemplate,
} from "./emailTemplates.js";

// ─── Resend client ───────────────────────────────────────────────────────────
// Without RESEND_API_KEY set, every send falls back to a console log so local
// dev keeps working without real email — set the key in .env to send for real.
const resend = ENV.RESEND_API_KEY ? new Resend(ENV.RESEND_API_KEY) : null;

// Fire-and-forget by design — a broken email should never break the request
// that triggered it (registration, OTP request, etc.), so failures are logged only.
async function send({ to, subject, html }) {
    try {
        if (!resend) {
            console.log(`\n📧  [email not sent — RESEND_API_KEY missing] To: ${to} | Subject: ${subject}\n`);
            return;
        }

        const { error } = await resend.emails.send({
            from:    ENV.EMAIL_FROM,
            to,
            subject,
            html,
        });

        if (error) {
            console.error("[resend] Failed to send email:", error);
        }
    } catch (err) {
        console.error("[resend] Failed to send email:", err);
    }
}

// ─── Public senders — one per transactional event ──────────────────────────────
export async function sendOtpEmail(to, otp) {
    const { subject, html } = otpTemplate({ otp });
    await send({ to, subject, html });
}

export async function sendVendorWelcomeEmail(to, { businessName, ownerName }) {
    const { subject, html } = vendorWelcomeTemplate({ businessName, ownerName });
    await send({ to, subject, html });
}

export async function sendVendorVerifiedEmail(to, { businessName }) {
    const { subject, html } = vendorVerifiedTemplate({ businessName });
    await send({ to, subject, html });
}

export async function sendUserWelcomeEmail(to, { name }) {
    const { subject, html } = userWelcomeTemplate({ name });
    await send({ to, subject, html });
}
