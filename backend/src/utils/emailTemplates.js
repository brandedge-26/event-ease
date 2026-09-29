import { ENV } from "../config/envs.js";

const PRIMARY    = "#FF3B6B";
const PRIMARY_DK = "#E8235A";
const INK        = "#111827";
const MUTED      = "#6B7280";
const BORDER     = "#EDEDED";
const SITE_URL   = ENV.CLIENT_URL || "https://joineventease.com";
const FONT       = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

// ─── Shared layout — every email is wrapped in this ────────────────────────────
// Table-based markup on purpose: this is what actually renders consistently
// across Gmail, Outlook, Apple Mail etc. — flexbox/grid/webfonts are not safe here.
function layout({ preheader = "", bodyHtml }) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Event Ease</title>
</head>
<body style="margin:0;padding:0;background:#F4F4F5;font-family:${FONT};">
  <span style="display:none;font-size:1px;color:#F4F4F5;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid ${BORDER};">

          <!-- Header -->
          <tr>
            <td style="padding:28px 32px 20px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="font-size:19px;font-weight:800;color:${INK};letter-spacing:-0.3px;">
                    Event<span style="color:${PRIMARY};">Ease</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:8px 32px 36px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:22px 32px;border-top:1px solid ${BORDER};text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:${MUTED};">
                Pakistan's #1 platform to discover, compare &amp; book event venues and vendors.
              </p>
              <p style="margin:0;font-size:12px;color:#B0B0B5;">
                &copy; ${new Date().getFullYear()} Event Ease &middot; <a href="${SITE_URL}" style="color:${MUTED};text-decoration:none;">${SITE_URL.replace(/^https?:\/\//, "")}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(label, href) {
    return `
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 4px;">
        <tr>
          <td style="border-radius:12px;background:${PRIMARY};">
            <a href="${href}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;">
              ${label}
            </a>
          </td>
        </tr>
      </table>`;
}

function heading(text) {
    return `<h1 style="margin:20px 0 12px;font-size:22px;font-weight:800;color:${INK};letter-spacing:-0.3px;">${text}</h1>`;
}

function paragraph(text) {
    return `<p style="margin:0 0 14px;font-size:14.5px;line-height:1.65;color:${MUTED};">${text}</p>`;
}

// ─── OTP verification email ─────────────────────────────────────────────────
export function otpTemplate({ otp }) {
    const bodyHtml = `
      ${heading("Verify your email")}
      ${paragraph("Use the code below to verify your email and finish setting up your Event Ease business account. This code expires in <strong style=\"color:" + INK + ";\">10 minutes</strong>.")}
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:22px 0 18px;">
        <tr>
          <td style="background:#FFF0F4;border:1px solid #FFD6E1;border-radius:14px;padding:22px;text-align:center;">
            <span style="font-size:34px;font-weight:800;letter-spacing:10px;color:${PRIMARY_DK};">${otp}</span>
          </td>
        </tr>
      </table>
      ${paragraph("Didn't request this code? You can safely ignore this email — no account will be created without it.")}
    `;
    return {
        subject: `${otp} is your Event Ease verification code`,
        html: layout({ preheader: `Your verification code is ${otp}`, bodyHtml }),
    };
}

// ─── Vendor — "congratulations, your business profile is live" ────────────────
export function vendorWelcomeTemplate({ businessName, ownerName }) {
    const bodyHtml = `
      ${heading(`Congratulations, ${ownerName.split(" ")[0]}! &#127881;`)}
      ${paragraph(`<strong style="color:${INK};">${businessName}</strong> is now registered on Event Ease. Your business profile has been created and our team will review it shortly to add your verified badge.`)}
      ${paragraph("Here's what you can do right now from your dashboard:")}
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:4px 0 4px;">
        ${["Add photos of your halls, packages &amp; services", "Set your pricing &amp; availability", "Start receiving inquiries from couples planning their event"]
            .map(item => `
          <tr>
            <td style="padding:6px 0;font-size:14.5px;color:${INK};">
              <span style="color:${PRIMARY};font-weight:700;">&#10003;</span>&nbsp; ${item}
            </td>
          </tr>`).join("")}
      </table>
      ${button("Go to Your Dashboard", `${SITE_URL}/vendor/login`)}
      ${paragraph("Questions? Just reply to this email — we're happy to help.")}
    `;
    return {
        subject: `Welcome to Event Ease, ${businessName}!`,
        html: layout({ preheader: `${businessName} is now live on Event Ease`, bodyHtml }),
    };
}

// ─── Vendor — admin verified their business ────────────────────────────────────
export function vendorVerifiedTemplate({ businessName }) {
    const bodyHtml = `
      ${heading("You're verified! &#9989;")}
      ${paragraph(`Great news — <strong style="color:${INK};">${businessName}</strong> has been reviewed and now carries the Event Ease <strong style="color:${INK};">Verified</strong> badge. Verified listings get more trust and more bookings from customers.`)}
      ${button("View Your Live Listing", `${SITE_URL}/vendor/login`)}
    `;
    return {
        subject: `${businessName} is now Verified on Event Ease`,
        html: layout({ preheader: `${businessName} is now Verified on Event Ease`, bodyHtml }),
    };
}

// ─── Customer — welcome on signup ──────────────────────────────────────────────
export function userWelcomeTemplate({ name }) {
    const firstName = (name || "there").split(" ")[0];
    const bodyHtml = `
      ${heading(`Welcome, ${firstName}! &#128075;`)}
      ${paragraph("Your Event Ease account is ready. Discover verified banquet halls, marquees, photographers, decorators &amp; caterers across Pakistan — compare prices and read real reviews before you book.")}
      ${button("Browse Venues", `${SITE_URL}/venues`)}
      ${paragraph("Planning something specific? Search by city, capacity or event type to find the perfect match.")}
    `;
    return {
        subject: "Welcome to Event Ease!",
        html: layout({ preheader: "Your account is ready — start exploring venues", bodyHtml }),
    };
}
