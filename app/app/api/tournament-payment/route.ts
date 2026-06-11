import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { saveContact } from "@/lib/contacts";
import { validateVoucher, redeemVoucher } from "@/lib/vouchers";

const SQ_BASE =
  process.env.SQUARE_ENVIRONMENT === "production"
    ? "https://connect.squareup.com/v2"
    : "https://connect.squareupsandbox.com/v2";

const ERROR_MESSAGES: Record<string, string> = {
  CARD_DECLINED:                "Your card was declined. Please try a different card.",
  CARD_DECLINED_CALL_ISSUER:   "Your card was declined. Please contact your bank.",
  CVV_FAILURE:                  "The security code (CVV) was incorrect. Please check and try again.",
  ADDRESS_VERIFICATION_FAILURE: "Address verification failed. Please check your billing ZIP code.",
  INSUFFICIENT_FUNDS:           "Insufficient funds on this card. Please use a different card.",
  CARD_EXPIRED:                 "This card has expired. Please use a different card.",
  INVALID_CARD:                 "The card information is invalid. Please check and try again.",
  TRANSACTION_LIMIT:            "This transaction exceeds your card limit.",
  TEMPORARY_ERROR:              "A temporary error occurred with the payment processor. Please try again.",
};

export async function POST(req: NextRequest) {
  try {
    const {
      sourceId, total: clientTotal, quantity,
      tournamentId, tournamentName,
      orgName, coachName, coachEmail, coachPhone,
      division, players, notes,
      voucherCode,
    } = await req.json();

    // ── Server-side voucher validation ──────────────────────────────────────
    let total: number = typeof clientTotal === "number" ? clientTotal : 0;
    let voucherApplied = false;
    if (voucherCode && typeof clientTotal === "number") {
      const check = await validateVoucher(voucherCode, "tournament", clientTotal);
      if (check.valid && check.voucher) {
        total = check.finalTotal!;
        voucherApplied = true;
      }
    }

    if (!sourceId || typeof clientTotal !== "number" || !coachEmail || !orgName) {
      return NextResponse.json({ success: false, error: "Invalid request. Please try again." }, { status: 400 });
    }

    // ── Charge via Square (skip when free) ──────────────────────────────────
    let paymentId: string | undefined;
    if (sourceId !== "FREE" && total > 0) {
      const sqRes = await fetch(`${SQ_BASE}/payments`, {
        method: "POST",
        headers: {
          "Content-Type":   "application/json",
          "Authorization":  `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
          "Square-Version": "2024-10-17",
        },
        body: JSON.stringify({
          source_id:           sourceId,
          idempotency_key:     crypto.randomUUID(),
          amount_money:        { amount: Math.round(total * 100), currency: "USD" },
          location_id:         process.env.SQUARE_LOCATION_ID,
          note:                `Hilhi BBX Tournament — ${tournamentName} — ${orgName} (${division})`,
          buyer_email_address: coachEmail || undefined,
        }),
      });
      const sqData = await sqRes.json();
      if (!sqRes.ok || sqData.errors?.length) {
        const code = sqData.errors?.[0]?.code as string | undefined;
        const msg  = ERROR_MESSAGES[code ?? ""] || sqData.errors?.[0]?.detail || "Payment was declined. Please try a different card.";
        return NextResponse.json({ success: false, error: msg }, { status: 400 });
      }
      paymentId = sqData.payment?.id as string | undefined;
    } else {
      paymentId = "FREE-" + crypto.randomUUID().slice(0, 8);
    }

    // ── Redeem voucher ───────────────────────────────────────────────────────
    if (voucherCode && voucherApplied) {
      try { await redeemVoucher(voucherCode); } catch { /* non-fatal */ }
    }

    // ── Save registration to tournament-register API ─────────────────────────
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/tournament-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId, orgName, coachName, coachEmail, coachPhone, division, players, notes }),
      });
    } catch { /* non-fatal — payment succeeded, log anyway */ }

    // ── Save contact ─────────────────────────────────────────────────────────
    try {
      await saveContact({
        name:   coachName || orgName,
        email:  coachEmail || "noemail@noemail.com",
        phone:  coachPhone || "",
        source: "tournament",
        notes:  `Tournament: ${tournamentName} | Team: ${orgName} | Division: ${division} | ${quantity} team(s) | $${total.toFixed(2)} | Square: ${paymentId ?? "n/a"}`,
      });
    } catch { /* non-fatal */ }

    // ── Send emails ───────────────────────────────────────────────────────────
    try { await sendEmails({ tournamentName, orgName, coachName, coachEmail, coachPhone, division, players, notes, quantity, total, paymentId }); } catch (e) {
      console.error("Tournament email send failed:", e);
    }

    return NextResponse.json({ success: true, paymentId });
  } catch (err) {
    console.error("tournament-payment route error:", err);
    return NextResponse.json({ success: false, error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}

async function sendEmails(data: {
  tournamentName: string; orgName: string; coachName: string; coachEmail: string;
  coachPhone: string; division: string; players: string; notes: string;
  quantity: number; total: number; paymentId?: string;
}) {
  const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT),
    secure: false,
    auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const { tournamentName, orgName, coachName, coachEmail, coachPhone, division, players, notes, quantity, total, paymentId } = data;

  await Promise.allSettled([
    // Admin notification
    transporter.sendMail({
      from:    process.env.SMTP_USER,
      to:      "info@hilhiyouthbbx.com",
      subject: `✅ Tournament Registration — ${orgName} — ${tournamentName} — $${total.toFixed(2)}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px">
          <h2 style="color:#1e40af">New Tournament Registration — Payment Received ✅</h2>
          <p><strong>Square Payment ID:</strong> ${paymentId ?? "N/A"}</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
          <p><strong>Tournament:</strong> ${tournamentName}</p>
          <p><strong>Organization / Team:</strong> ${orgName}</p>
          <p><strong>Division:</strong> ${division}</p>
          <p><strong>Teams:</strong> ${quantity}</p>
          <p><strong>Total Paid:</strong> $${total.toFixed(2)}</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
          <p><strong>Head Coach:</strong> ${coachName}</p>
          <p><strong>Email:</strong> ${coachEmail}</p>
          <p><strong>Phone:</strong> ${coachPhone || "—"}</p>
          ${players ? `<p><strong>Roster:</strong><br/>${players.replace(/\n/g, "<br/>")}</p>` : ""}
          ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}
        </div>`,
    }),
    // Coach receipt
    transporter.sendMail({
      from:    process.env.SMTP_USER,
      to:      coachEmail,
      subject: `Tournament Registration Confirmed — ${tournamentName} 🏀`,
      html: `
        <div style="font-family:sans-serif;max-width:600px">
          <h2 style="color:#1e40af">Tournament Registration Confirmed! 🏀</h2>
          <p>Hi Coach ${coachName},</p>
          <p>Your payment of <strong>$${total.toFixed(2)}</strong> has been received.</p>
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:16px 0">
            <strong style="color:#1e40af">Registration Summary</strong><br/>
            🏆 Tournament: ${tournamentName}<br/>
            🏀 Team: ${orgName}<br/>
            📋 Division: ${division}<br/>
            👥 Teams registered: ${quantity}
          </div>
          <p style="color:#6b7280;font-size:14px">
            Questions? Email <a href="mailto:info@hilhiyouthbbx.com">info@hilhiyouthbbx.com</a>
            or call <a href="tel:9715630552">971-563-0552</a>.
          </p>
          <p>— Hilhi Youth Basketball 🏀</p>
        </div>`,
    }),
  ]);
}
