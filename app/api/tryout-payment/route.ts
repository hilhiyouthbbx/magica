import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { saveContact } from "@/lib/contacts";
import { getContent } from "@/lib/content";
import { validateVoucher, redeemVoucher } from "@/lib/vouchers";

const SQ_BASE =
  process.env.SQUARE_ENVIRONMENT === "production"
    ? "https://connect.squareup.com/v2"
    : "https://connect.squareupsandbox.com/v2";


const ADMIN_COPY_EMAIL = "info@hilhiyouthbbx.com";

function esc(s: unknown): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

interface TryoutEmailOpts {
  parentName: string; email: string; phone: string;
  playerName: string; grade: string; school: string; uniformSize: string; address: string;
  boundary: string; qty: number; total: number; paymentStatus: string; voucherCode?: string | null; voucherDiscount: number;
  sessions: { label: string; time: string }[]; location: string; locationAddress: string; title: string;
  isAdminCopy: boolean;
}

function tryoutEmailHtml(o: TryoutEmailOpts): string {
  const pending = o.paymentStatus.startsWith("Pending");
  const row = (k: string, v: string) => v ? `
    <tr>
      <td style="padding:6px 0;font-size:13px;color:#6b7280;width:42%;vertical-align:top;">${k}</td>
      <td style="padding:6px 0;font-size:13px;color:#111;text-align:right;font-weight:600;">${esc(v)}</td>
    </tr>` : "";
  const sessionRows = o.sessions.map(s => `
    <tr><td style="padding:8px 0;font-size:14px;color:#111;"><strong>${esc(s.label)}</strong> &nbsp;&middot;&nbsp; ${esc(s.time)}</td></tr>`).join("");
  const payNote = o.total <= 0
    ? "No payment due."
    : pending
      ? `Payment of $${o.total.toFixed(2)} is marked <strong>pending</strong>. We will confirm it once your ${esc(o.paymentStatus.replace("Pending - ", ""))} payment is received.`
      : `Payment received: $${o.total.toFixed(2)}.`;

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
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111;">&#9989; ${o.isAdminCopy ? "New Tryout Registration" : "You're Registered!"}</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">
      ${o.isAdminCopy
        ? `<strong>${esc(o.parentName)}</strong> registered <strong>${esc(o.playerName)}</strong> for the ${esc(o.title)}.`
        : `Hi ${esc(o.parentName.split(" ")[0] || "there")}, <strong>${esc(o.playerName)}</strong> is registered for the ${esc(o.title)}. Please keep this email for your records.`}
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;margin-bottom:20px;"><tr><td>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${row("Player", o.playerName)}${row("Grade", o.grade)}${row("Uniform size", o.uniformSize)}${row("School next season", o.school)}
        ${o.qty > 1 ? row("Quantity", String(o.qty)) : ""}
        ${o.isAdminCopy ? row("Parent / guardian", o.parentName) + row("Email", o.email) + row("Phone", o.phone) + row("Home address", o.address) + row("Boundary check", o.boundary) : ""}
        ${o.voucherCode ? row("Promo code", o.voucherCode + " (-$" + o.voucherDiscount.toFixed(2) + ")") : ""}${row(o.voucherCode ? "Due today" : "Total", o.total > 0 ? "$" + o.total.toFixed(2) : "Free")}${row("Payment status", o.paymentStatus)}
      </table>
    </td></tr></table>

    <p style="margin:0 0 20px;font-size:13px;line-height:1.6;color:#374151;">${payNote}</p>

    ${o.sessions.length ? `
    <h2 style="margin:0 0 6px;font-size:15px;font-weight:800;color:#111;">Tryout sessions</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">${sessionRows}</table>` : ""}
    ${o.location ? `<p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#374151;"><strong>Location:</strong> ${esc(o.location)}${o.locationAddress ? `<br/>${esc(o.locationAddress)}` : ""}</p>` : ""}

    <div style="padding:14px 18px;border-radius:8px;background:#eff6ff;border:1px solid #bfdbfe;">
      <p style="margin:0;font-size:13px;font-weight:600;color:#1e3a8a;">Bring water, wear basketball shoes, and arrive 10 minutes early. See you at tryouts! &#127936;</p>
    </div>
  </td></tr>
  <tr><td bgcolor="#f8fafc" style="background-color:#f8fafc;padding:20px 32px;border-top:1px solid #e5e7eb;">
    <p style="margin:0;font-size:12px;color:#9ca3af;">Hilhi Youth Basketball &middot; Hillsboro, Oregon<br/>
    Questions? Email us at <a href="mailto:info@hilhiyouthbbx.com" style="color:#2563eb;">info@hilhiyouthbbx.com</a></p>
  </td></tr>
</table></td></tr></table></body></html>`;
}

async function sendMail(to: string, subject: string, html: string) {
  const host = process.env.SMTP_HOST, user = process.env.SMTP_USER, pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) { console.warn("SMTP not configured - skipping tryout email"); return; }
  const transporter = nodemailer.createTransport({
    host, port: Number(process.env.SMTP_PORT || 587), secure: false, auth: { user, pass },
  });
  await transporter.sendMail({ from: `"Hilhi Youth Basketball" <${user}>`, to, subject, html });
}

export async function POST(req: NextRequest) {
  try {
    const {
      sourceId, total: clientTotal, basePrice: clientBase, quantity,
      paymentMethod, // "card" | "paypal" | "venmo" — off-site methods skip Square and land as "Pending"
      parentName, email, phone,
      playerName, grade,
      nextSeasonSchool, address, boundarySchool, inHillsboroBoundary,
      uniformSize, waiverSigned, waiverName,
      voucherCode,
    } = await req.json();

    // ── Server-side voucher validation (against BASE price, fee waived with voucher) ──
    const baseOnly = typeof clientBase === "number" ? clientBase : (typeof clientTotal === "number" ? clientTotal : 0);
    let total: number = typeof clientTotal === "number" ? clientTotal : 0;
    let voucherApplied = false;
    if (voucherCode && baseOnly > 0) {
      const check = await validateVoucher(voucherCode, "tryout", baseOnly);
      if (check.valid && check.voucher) {
        total = check.finalTotal!;   // discounted base, no fee
        voucherApplied = true;
      }
    }

    if (!sourceId || !parentName || !email) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }
    if (!waiverSigned || !waiverName) {
      return NextResponse.json({ error: "The Liability Waiver must be signed before registering." }, { status: 400 });
    }

    // Free registration — skip Square. PayPal/Venmo also skip Square — payment happens off-site
    // and gets confirmed manually by the admin afterward (no API keys for those, so no way to
    // auto-verify here).
    const isAltPayment = paymentMethod === "paypal" || paymentMethod === "venmo";
    let paymentId = "FREE-" + crypto.randomUUID().slice(0, 8);
    let paymentStatus = total > 0 ? "Paid" : "Free";

    if (isAltPayment && total > 0) {
      paymentId = `PENDING-${paymentMethod.toUpperCase()}-${crypto.randomUUID().slice(0, 8)}`;
      paymentStatus = `Pending - ${paymentMethod === "paypal" ? "PayPal" : "Venmo"}`;
    } else if (sourceId !== "FREE" && total > 0) {  // skip Square for free
      const sqRes = await fetch(`${SQ_BASE}/payments`, {
        method:  "POST",
        headers: {
          "Authorization":  `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
          "Content-Type":   "application/json",
          "Square-Version": "2024-10-17",
        },
        body: JSON.stringify({
          source_id:       sourceId,
          idempotency_key: crypto.randomUUID(),
          amount_money:    { amount: Math.round(total * 100), currency: "USD" },
          location_id:     process.env.SQUARE_LOCATION_ID,
          buyer_email_address: email,
          note: `Tryout Reg — ${playerName || ""} | ${grade || ""}`,
        }),
      });
      const sqData = await sqRes.json();
      if (!sqRes.ok || sqData.errors) {
        const msg = sqData.errors?.[0]?.detail || "Payment failed.";
        return NextResponse.json({ error: msg }, { status: 400 });
      }
      paymentId = sqData.payment?.id || paymentId;
    }

    // ── Redeem voucher ────────────────────────────────────────────────────────────────
    if (voucherCode && voucherApplied) {
      try { await redeemVoucher(voucherCode); } catch { /* non-fatal */ }
    }

    const voucherDiscount = voucherApplied ? Math.max(0, baseOnly - total) : 0;

    // Save to contacts
    await saveContact({
      name:   parentName,
      email,
      phone,
      source: "tryout" as any,
      camperName: playerName,
      grade,
      nextSeasonSchool: nextSeasonSchool || "",
      address: address || "",
      boundarySchool: boundarySchool || "",
      inHillsboroBoundary: inHillsboroBoundary || "unknown",
      shirtSize: uniformSize || "",
      amountPaid: total.toFixed(2),
      paymentStatus,
      notes:  `Player: ${playerName} | Grade: ${grade} | Qty: ${quantity} | Uniform size: ${uniformSize || "n/a"} | Next season school: ${nextSeasonSchool || "n/a"} | Address: ${address || "n/a"} | Boundary check: ${boundarySchool || "not checked"} (${inHillsboroBoundary || "unknown"}) | Voucher: ${voucherApplied ? `${String(voucherCode).toUpperCase()} (-$${voucherDiscount.toFixed(2)})` : "none"} | Due today: $${total.toFixed(2)} | Payment: ${paymentStatus}${isAltPayment ? ` (${paymentId})` : ""} | Waiver (2026-2027 Winter Season): ${waiverSigned ? `Signed by ${waiverName || "n/a"}` : "NOT SIGNED"}`,
    });

    // ── Confirmation emails (parent + admin copy). Never block the registration if email fails. ──
    try {
      const site = await getContent();
      const t = site.tryout;
      const base = {
        parentName, email, phone: phone || "", playerName, grade: grade || "", school: nextSeasonSchool || "",
        uniformSize: uniformSize || "", address: address || "",
        boundary: boundarySchool ? `${boundarySchool} (${inHillsboroBoundary || "unknown"})` : (inHillsboroBoundary || ""),
        qty: Number(quantity) || 1, total, paymentStatus, voucherCode: voucherApplied ? String(voucherCode).toUpperCase() : null, voucherDiscount,
        sessions: (t.sessions || []).map((x: { label: string; time: string }) => ({ label: x.label, time: x.time })),
        location: t.location || "", locationAddress: t.address || "", title: t.title || "Youth Tryouts",
      };
      await Promise.allSettled([
        email ? sendMail(email, `Tryout Registration Confirmed - ${playerName}`, tryoutEmailHtml({ ...base, isAdminCopy: false })) : Promise.resolve(),
        sendMail(ADMIN_COPY_EMAIL, `New Tryout Registration - ${playerName} (${grade || "n/a"}) - ${total > 0 ? "$" + total.toFixed(2) : "Free"}`, tryoutEmailHtml({ ...base, isAdminCopy: true })),
      ]);
    } catch (e) {
      console.error("Tryout confirmation email failed:", e);
    }

    return NextResponse.json({ success: true, paymentId });
  } catch (err: any) {
    console.error("tryout-payment error:", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
