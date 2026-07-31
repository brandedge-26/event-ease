import nodemailer from "nodemailer";
import { ENV } from "../config/envs.js";

// ─── Transporter ─────────────────────────────────────────────────────────────
// In development: logs OTP to console so you can test without real SMTP.
// In production:  set EMAIL_USER and EMAIL_PASS in .env (Gmail App Password).

function createTransporter() {
    if (ENV.NODE_ENV !== "production") {
        // Ethereal fake SMTP — emails are captured, not actually sent
        return nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            auth: {
                user: "ethereal_user",  // not needed for console-only dev flow
                pass: "ethereal_pass",
            },
        });
    }

    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: ENV.EMAIL_USER,
            pass: ENV.EMAIL_PASS,
        },
    });
}

// ─── Send OTP ────────────────────────────────────────────────────────────────
export async function sendOtpEmail(to, otp) {
    // Always log in dev so the flow works without real SMTP
    if (ENV.NODE_ENV !== "production") {
        console.log(`\n📧  OTP for ${to} → ${otp}\n`);
        return;
    }

    const transporter = createTransporter();

    await transporter.sendMail({
        from: `"Event Ease" <${ENV.EMAIL_USER}>`,
        to,
        subject: "Your Event Ease verification code",
        html: `
            <div style="font-family:sans-serif;max-width:480px;margin:auto">
                <h2 style="color:#FF2D78">Event Ease</h2>
                <p>Your verification code is:</p>
                <h1 style="letter-spacing:8px;color:#111">${otp}</h1>
                <p style="color:#666;font-size:13px">This code expires in 10 minutes. Do not share it with anyone.</p>
            </div>
        `,
    });
}
