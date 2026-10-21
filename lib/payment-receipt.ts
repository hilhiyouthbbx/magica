import nodemailer from "nodemailer";
import type { Contact } from "@/lib/contacts";

// "Payment received" receipt, emailed to the parent when the admin confirms a PayPal/Venmo
// (or any other "Pending") registration as Paid.

const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function sourceLabel(c: Pick<Contact, "source" | "ticketType">): string {
  const s = (c.source || "").toLowerCase();
  if (s.includes("tryout")) return "Winter Tryouts";
  if (s.includes("raffle")) return "Fundraiser Raffle";
  if (s.includes("tournament")) return "Tournament";
  if (s.includes("camp") || s === "registration") return "Youth Camp";
  return c.ticketType || c.source || "Registration";
}

export function receiptHtml(c: Contact, method: string): string {
  const first = (c.name || "").split(" ")[0] || "there";
  const amount = Number(c.amountPaid);
  const row = (k: string, v: string) => v ? `
    <tr>
      <td style="padding:6px 0;font-size:13px;color:#6b7280;width:42%;vertical-align:top;">${k}</td>
      <td style="padding:6px 0;font-size:13px;color:#111;text-align:right;font-weight:600;">${esc(v)}</td>
    </tr>` : "";
  const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/Los_Angeles" });

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<meta name="color-scheme" content="light"/><meta name="supported-color-schemes" content="light"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:system-ui,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
  <tr><td bgcolor="#1e3a8a" style="background-color:#1e3a8a;padding:24px 32px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="padding-right:16px;vertical-align:middle;"><img src="https://www.hilhiyouthbbx.com/spartan-head-white.png" alt="Hilhi Spartans" width="48" height="50" style="display:block;border:0;" /></td>
      <td style="vertical-align:middle;"><span style="display:inline-block;color:#ffffff !important;font-size:22px;font-weight:800;line-height:1.2;">Hilhi Youth Basketball</span></td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:28px 32px;">
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111;">&#9989; Payment Received</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">Hi ${esc(first)}, we've received your payment${Number.isFinite(amount) && amount > 0 ? ` of <strong>$${amount.toFixed(2)}</strong>` : ""}${c.camperName ? ` for <strong>${esc(c.camperName)}</strong>` : ""}. Thank you! Your registration is now <strong>paid in full</strong>. Please keep this email as your receipt.</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;margin-bottom:20px;"><tr><td>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${row("Registration", sourceLabel(c))}${row("Player", c.camperName || "")}${row("Grade", c.grade || "")}
        ${row("Amount paid", Number.isFinite(amount) && amount > 0 ? "$" + amount.toFixed(2) : "")}${row("Payment method", method)}${row("Date confirmed", date)}${row("Payment status", "Paid")}
      </table>
    </td></tr></table>

    <p style="margin:0;font-size:13px;line-height:1.6;color:#374151;">If anything above looks wrong, just reply to this email or write us at <a href="mailto:info@hilhiyouthbbx.com" style="color:#2563eb;">info@hilhiyouthbbx.com</a>. See you on the court! &#127936;</p>
  </td></tr>
  <tr><td bgcolor="#f8fafc" style="background-color:#f8fafc;padding:20px 32px;border-top:1px solid #e5e7eb;">
    <p style="margin:0;font-size:12px;color:#9ca3af;">Hilhi Youth Basketball &middot; Hillsboro, Oregon<br/>
    Questions? Email us at <a href="mailto:info@hilhiyouthbbx.com" style="color:#2563eb;">info@hilhiyouthbbx.com</a></p>
  </td></tr>
</table></td></tr></table></body></html>`;
}

/** Returns { ok } or { ok:false, error }. Never throws. */
export async function sendPaymentReceipt(c: Contact, method: string): Promise<{ ok: boolean; error?: string }> {
  const host = process.env.SMTP_HOST, user = process.env.SMTP_USER, pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return { ok: false, error: "email is not configured" };
  try {
    const transporter = nodemailer.createTransport({
      host, port: Number(process.env.SMTP_PORT || 587), secure: false, auth: { user, pass },
    });
    await transporter.sendMail({
      from: `"Hilhi Youth Basketball" <${user}>`,
      to: c.email,
      subject: `Payment received - ${sourceLabel(c)}${c.camperName ? ` (${c.camperName})` : ""}`,
      html: receiptHtml(c, method),
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
