import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { saveContact } from "@/lib/contacts";

const SQ_BASE =
  process.env.SQUARE_ENVIRONMENT === "production"
    ? "https://connect.squareup.com/v2"
    : "https://connect.squareupsandbox.com/v2";

// ── Friendly card-decline messages ────────────────────────────────────────
const ERROR_MESSAGES: Record<string, string> = {
  CARD_DECLINED:                  "Your card was declined. Please try a different card.",
  CARD_DECLINED_CALL_ISSUER:      "Your card was declined. Please contact your bank.",
  CVV_FAILURE:                    "The security code (CVV) was incorrect. Please check and try again.",
  ADDRESS_VERIFICATION_FAILURE:   "Address verification failed. Please check your billing ZIP code.",
  INSUFFICIENT_FUNDS:             "Insufficient funds on this card. Please use a different card.",
  CARD_EXPIRED:                   "This card has expired. Please use a different card.",
  INVALID_CARD:                   "The card information is invalid. Please check and try again.",
  TRANSACTION_LIMIT:              "This transaction exceeds your card limit.",
  TEMPORARY_ERROR:                "A temporary error occurred with the payment processor. Please try again.",
};

export async function POST(req: NextRequest) {
  try {
    const { sourceId, total, cart, contact } = await req.json();

    if (!sourceId || typeof total !== "number" || !Array.isArray(cart) || !contact?.name) {
      return NextResponse.json(
        { success: false, error: "Invalid request. Please try again." },
        { status: 400 }
      );
    }

    // ── Create payment via Square ──────────────────────────────────────────
    const sqRes = await fetch(`${SQ_BASE}/payments`, {
      method: "POST",
      headers: {
        "Content-Type":   "application/json",
        "Authorization":  `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
        "Square-Version": "2024-10-17",
      },
      body: JSON.stringify({
        source_id:         sourceId,
        idempotency_key:   crypto.randomUUID(),
        amount_money: {
          amount:   Math.round(total * 100), // cents
          currency: "USD",
        },
        location_id:           process.env.SQUARE_LOCATION_ID,
        note:                  `Hilhi Youth BBX Merch — ${contact.name}`,
        buyer_email_address:   contact.email || undefined,
      }),
    });

    const sqData = await sqRes.json();

    if (!sqRes.ok || sqData.errors?.length) {
      const code = sqData.errors?.[0]?.code as string | undefined;
      const msg  = ERROR_MESSAGES[code ?? ""] || sqData.errors?.[0]?.detail || "Payment was declined. Please try a different card.";
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }

    const paymentId = sqData.payment?.id as string | undefined;

    // ── Save contact ───────────────────────────────────────────────────────
    try {
      await saveContact({
        name:   contact.name,
        email:  contact.email || "noemail@noemail.com",
        phone:  contact.phone || "",
        source: "merch-order",
        notes:  `Items: ${(cart as Array<{ name: string; size: string; qty: number; price: number }>)
          .map(i => `${i.name} (${i.size}) ×${i.qty}`)
          .join(", ")} | Total: $${total.toFixed(2)} | Square ID: ${paymentId ?? "n/a"}`,
      });
    } catch {/* non-fatal */}

    // ── Send confirmation emails ───────────────────────────────────────────
    try {
      await sendEmails(contact, cart, total, paymentId);
    } catch (e) {
      console.error("Email send failed:", e);
    }

    return NextResponse.json({ success: true, paymentId });
  } catch (err) {
    console.error("square-payment route error:", err);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

// ── Email helpers ──────────────────────────────────────────────────────────
async function sendEmails(
  contact: { name: string; email: string; phone?: string; notes?: string },
  cart:    Array<{ name: string; size: string; qty: number; price: number }>,
  total:   number,
  paymentId?: string,
) {
  const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT),
    secure: false,
    auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const rows = cart
    .map(
      i =>
        `<tr style="border-bottom:1px solid #e5e7eb">
           <td style="padding:10px 12px">${i.name}</td>
           <td style="padding:10px 12px;text-align:center;font-weight:700">${i.size}</td>
           <td style="padding:10px 12px;text-align:center">${i.qty}</td>
           <td style="padding:10px 12px;text-align:right">$${(i.price * i.qty).toFixed(2)}</td>
         </tr>`
    )
    .join("");

  const tableHtml = `
    <table border="0" cellpadding="0" cellspacing="0" width="100%"
           style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:16px 0">
      <tr style="background:#f1f5f9">
        <th style="padding:10px 12px;text-align:left">Item</th>
        <th style="padding:10px 12px">Size</th>
        <th style="padding:10px 12px">Qty</th>
        <th style="padding:10px 12px;text-align:right">Price</th>
      </tr>
      ${rows}
      <tr style="background:#dbeafe;font-weight:700">
        <td colspan="3" style="padding:12px">ORDER TOTAL</td>
        <td style="padding:12px;text-align:right;font-size:18px">$${total.toFixed(2)}</td>
      </tr>
    </table>`;

  await Promise.allSettled([
    // Admin notification
    transporter.sendMail({
      from:    process.env.SMTP_USER,
      to:      "info@hilhiyouthbbx.com",
      subject: `✅ New Merch Order — ${contact.name} — $${total.toFixed(2)}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px">
          <h2 style="color:#1e40af">New Merch Order — Payment Received ✅</h2>
          <p><strong>Square Payment ID:</strong> ${paymentId ?? "N/A"}</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
          <p><strong>Customer:</strong> ${contact.name}</p>
          <p><strong>Email:</strong> ${contact.email}</p>
          <p><strong>Phone:</strong> ${contact.phone || "—"}</p>
          <p><strong>Notes:</strong> ${contact.notes || "—"}</p>
          ${tableHtml}
        </div>`,
    }),
    // Customer receipt
    transporter.sendMail({
      from:    process.env.SMTP_USER,
      to:      contact.email,
      subject: "Your Hilhi Youth BBX Order is Confirmed! 🏀",
      html: `
        <div style="font-family:sans-serif;max-width:600px">
          <h2 style="color:#1e40af">Order Confirmed! 🏀</h2>
          <p>Hi ${contact.name.split(" ")[0]},</p>
          <p>Your payment of <strong>$${total.toFixed(2)}</strong> has been received. Here's your order summary:</p>
          ${tableHtml}
          <p style="color:#6b7280;font-size:14px">
            Questions? Email <a href="mailto:info@hilhiyouthbbx.com">info@hilhiyouthbbx.com</a>
            or call <a href="tel:9715630552">971-563-0552</a>.
          </p>
          <p>— Hilhi Youth Basketball 🏀</p>
        </div>`,
    }),
  ]);
}
