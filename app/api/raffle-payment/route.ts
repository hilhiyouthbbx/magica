import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { saveContact } from "@/lib/contacts";
import { reserveTicketNumbers } from "@/lib/raffle";

const TICKET_PRICE = 20;
const ADMIN_COPY_EMAIL = "info@hilhiyouthbbx.com";

function escapeHtml(s: string): string {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function ticketEmailHtml(opts: {
  buyerName: string; athleteFirstName: string; athleteGrade: string;
  ticketNumbers: string[]; total: number; isAdminCopy: boolean;
}): string {
  const { buyerName, athleteFirstName, athleteGrade, ticketNumbers, total, isAdminCopy } = opts;
  const ticketRows = ticketNumbers.map(n => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:16px;font-weight:800;color:#111;letter-spacing:1px;">${escapeHtml(n)}</td>
    </tr>`).join("");

  return `
<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<meta name="color-scheme" content="light"/><meta name="supported-color-schemes" content="light"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:system-ui,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr>
          <td bgcolor="#1e3a8a" style="background-color:#1e3a8a;padding:24px 32px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="padding-right:16px;vertical-align:middle;">
                <img src="https://www.hilhiyouthbbx.com/spartan-head-white.png" alt="Hilhi Spartans" width="48" height="50" style="display:block;border:0;" />
              </td>
              <td style="vertical-align:middle;">
                <span style="display:inline-block;color:#ffffff !important;font-size:22px;font-weight:800;line-height:1.2;font-family:system-ui,sans-serif;">Hilhi Youth Basketball</span>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#111;">🎟️ ${isAdminCopy ? "New Raffle Ticket Purchase" : "You're In the Raffle!"}</h1>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">
              ${isAdminCopy
                ? `<strong>${escapeHtml(buyerName)}</strong> bought <strong>${ticketNumbers.length}</strong> ticket${ticketNumbers.length > 1 ? "s" : ""} supporting <strong>${escapeHtml(athleteFirstName)}</strong> (${escapeHtml(athleteGrade)}) — total <strong>$${total.toFixed(2)}</strong>.`
                : `Thanks for supporting <strong>${escapeHtml(athleteFirstName) || "Hilhi Youth Basketball"}</strong>! Here ${ticketNumbers.length > 1 ? "are your ticket numbers" : "is your ticket number"} for the Hilhi Youth Basketball Fundraiser Raffle.`
              }
            </p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:20px;">
              <thead>
                <tr style="background:#f1f5f9;">
                  <th style="padding:10px 16px;text-align:left;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;">Ticket Number${ticketNumbers.length > 1 ? "s" : ""}</th>
                </tr>
              </thead>
              <tbody>${ticketRows}</tbody>
            </table>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
              <tr>
                <td style="padding:4px 0;font-size:13px;color:#6b7280;">Purchased by</td>
                <td style="padding:4px 0;font-size:13px;color:#111;text-align:right;font-weight:600;">${escapeHtml(buyerName)}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;font-size:13px;color:#6b7280;">Supporting</td>
                <td style="padding:4px 0;font-size:13px;color:#111;text-align:right;font-weight:600;">${escapeHtml(athleteFirstName)}${athleteGrade ? ` (${escapeHtml(athleteGrade)})` : ""}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;font-size:13px;color:#6b7280;">Total</td>
                <td style="padding:4px 0;font-size:15px;color:#111;text-align:right;font-weight:800;">$${total.toFixed(2)}</td>
              </tr>
            </table>

            <div style="padding:14px 18px;border-radius:8px;background:#fffbeb;border:1px solid #fde68a;">
              <p style="margin:0;font-size:13px;font-weight:700;color:#92400e;">🎉 Drawing held December 21, 2026 — Grand Prize: 2 Night Stay @ the Eastlund Hotel + 2 Blazer Tickets. Winners notified by phone/email.</p>
            </div>
          </td>
        </tr>
        <tr>
          <td bgcolor="#f8fafc" style="background-color:#f8fafc;padding:20px 32px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              Hilhi Youth Basketball · Hillsboro, Oregon<br/>
              Questions? Email us at <a href="mailto:info@hilhiyouthbbx.com" style="color:#2563eb;">info@hilhiyouthbbx.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function sendEmail(to: string, subject: string, html: string) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpHost || !smtpUser || !smtpPass) return; // email not configured — non-fatal
  const transporter = nodemailer.createTransport({
    host: smtpHost, port: Number(process.env.SMTP_PORT || 587), secure: false,
    auth: { user: smtpUser, pass: smtpPass },
  });
  await transporter.sendMail({ from: `"Hilhi Youth Basketball" <${smtpUser}>`, to, subject, html });
}

export async function POST(req: NextRequest) {
  try {
    const {
      sourceId, quantity, paymentMethod, // "paypal" | "venmo" — off-site, confirmed manually by admin afterward
      buyerName, email, phone,
      athleteFirstName, athleteGrade,
    } = await req.json();

    const qty = Math.max(1, Math.min(50, parseInt(quantity, 10) || 1)); // hard cap of 50/order as a sanity limit
    const total = TICKET_PRICE * qty; // price is server-authoritative — never trust a client-sent total

    if (!sourceId || !buyerName || !email || !athleteFirstName || !athleteGrade) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }
    if (paymentMethod !== "paypal" && paymentMethod !== "venmo") {
      return NextResponse.json({ error: "Invalid payment method." }, { status: 400 });
    }

    const ticketNumbers = await reserveTicketNumbers(qty);
    const paymentId = `PENDING-${paymentMethod.toUpperCase()}-${crypto.randomUUID().slice(0, 8)}`;
    const paymentStatus = `Pending - ${paymentMethod === "paypal" ? "PayPal" : "Venmo"}`;

    await saveContact({
      name:   buyerName,
      email,
      phone,
      source: "raffle" as any,
      camperName: `${athleteFirstName} (${athleteGrade})`,
      grade: athleteGrade,
      amountPaid: total.toFixed(2),
      paymentStatus,
      notes: `Raffle tickets: ${ticketNumbers.join(", ")} | Qty: ${qty} | Supporting: ${athleteFirstName} (${athleteGrade}) | Payment: ${paymentStatus} (${paymentId})`,
    } as any);

    const buyerHtml = ticketEmailHtml({ buyerName, athleteFirstName, athleteGrade, ticketNumbers, total, isAdminCopy: false });
    const adminHtml = ticketEmailHtml({ buyerName, athleteFirstName, athleteGrade, ticketNumbers, total, isAdminCopy: true });

    await Promise.all([
      sendEmail(email, `Your Hilhi Raffle Ticket${ticketNumbers.length > 1 ? "s" : ""} — ${ticketNumbers[0]}`, buyerHtml),
      sendEmail(ADMIN_COPY_EMAIL, `New Raffle Purchase — ${buyerName} ($${total.toFixed(2)})`, adminHtml),
    ]);

    return NextResponse.json({ success: true, ticketNumbers, paymentId });
  } catch (err: any) {
    console.error("raffle-payment error:", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
