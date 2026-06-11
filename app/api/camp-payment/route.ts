import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { saveContact } from "@/lib/contacts";

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

interface Camper {
  firstName: string; lastName: string; dob: string;
  grade: string; gender: string; school: string; jerseySize: string;
}
interface ParentInfo {
  guardianName: string; relationship: string; phone: string; email: string;
  address: string; city: string; state: string; zip: string;
  emergencyName: string; emergencyPhone: string; emergencyRelationship: string;
}
interface MedicalInfo {
  allergies: string; medications: string; conditions: string;
  doctorName: string; doctorPhone: string;
  photoRelease: boolean; waiverSigned: boolean; waiverName: string;
}

export async function POST(req: NextRequest) {
  try {
    const { sourceId, total, quantity, campers, parentInfo, medical } = await req.json() as {
      sourceId: string;
      total: number;
      quantity: number;
      campers: Camper[];
      parentInfo: ParentInfo;
      medical: MedicalInfo;
    };

    if (!sourceId || typeof total !== "number" || !parentInfo?.guardianName) {
      return NextResponse.json({ success: false, error: "Invalid request. Please try again." }, { status: 400 });
    }

    // ── Charge via Square ────────────────────────────────────────────────────
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
        note:                `Hilhi Youth BBX Camp — ${parentInfo.guardianName} (${quantity} camper${quantity > 1 ? "s" : ""})`,
        buyer_email_address: parentInfo.email || undefined,
      }),
    });

    const sqData = await sqRes.json();

    if (!sqRes.ok || sqData.errors?.length) {
      const code = sqData.errors?.[0]?.code as string | undefined;
      const msg  = ERROR_MESSAGES[code ?? ""] || sqData.errors?.[0]?.detail || "Payment was declined. Please try a different card.";
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }

    const paymentId = sqData.payment?.id as string | undefined;

    // ── Save contact ─────────────────────────────────────────────────────────
    try {
      await saveContact({
        name:   parentInfo.guardianName,
        email:  parentInfo.email || "noemail@noemail.com",
        phone:  parentInfo.phone || "",
        source: "registration",
        notes:  `Camp (${quantity} camper${quantity > 1 ? "s" : ""}): ${(campers || []).map((c: Camper) => `${c.firstName} ${c.lastName} (${c.grade})`).join(", ")} | $${total.toFixed(2)} | Square: ${paymentId ?? "n/a"}`,
      });
    } catch { /* non-fatal */ }

    // ── Send emails ───────────────────────────────────────────────────────────
    try { await sendEmails(parentInfo, campers, quantity, total, paymentId, medical); } catch (e) {
      console.error("Camp email send failed:", e);
    }

    return NextResponse.json({ success: true, paymentId });
  } catch (err) {
    console.error("camp-payment route error:", err);
    return NextResponse.json({ success: false, error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}

async function sendEmails(
  parentInfo: ParentInfo,
  campers:    Camper[],
  quantity:   number,
  total:      number,
  paymentId?: string,
  medical?:   MedicalInfo,
) {
  const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT),
    secure: false,
    auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const camperRows = (campers || []).map(c =>
    `<tr style="border-bottom:1px solid #e5e7eb">
       <td style="padding:8px 12px">${c.firstName} ${c.lastName}</td>
       <td style="padding:8px 12px;text-align:center">${c.grade} Grade</td>
       <td style="padding:8px 12px;text-align:center">${c.gender === "male" ? "Boy" : c.gender === "female" ? "Girl" : "Other"}</td>
       <td style="padding:8px 12px;text-align:center">${c.jerseySize}</td>
     </tr>`
  ).join("");

  const tableHtml = `
    <table border="0" cellpadding="0" cellspacing="0" width="100%"
           style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:16px 0">
      <tr style="background:#f1f5f9">
        <th style="padding:8px 12px;text-align:left">Camper</th>
        <th style="padding:8px 12px">Grade</th>
        <th style="padding:8px 12px">Gender</th>
        <th style="padding:8px 12px">Jersey Size</th>
      </tr>
      ${camperRows}
      <tr style="background:#dbeafe;font-weight:700">
        <td colspan="3" style="padding:12px">TOTAL PAID</td>
        <td style="padding:12px;text-align:right;font-size:16px">$${total.toFixed(2)}</td>
      </tr>
    </table>`;

  await Promise.allSettled([
    // Admin notification
    transporter.sendMail({
      from:    process.env.SMTP_USER,
      to:      "info@hilhiyouthbbx.com",
      subject: `✅ Camp Registration — ${parentInfo.guardianName} — ${quantity} camper${quantity > 1 ? "s" : ""} — $${total.toFixed(2)}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px">
          <h2 style="color:#1e40af">New Camp Registration — Payment Received ✅</h2>
          <p><strong>Square Payment ID:</strong> ${paymentId ?? "N/A"}</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
          <h3>Parent / Guardian</h3>
          <p><strong>${parentInfo.guardianName}</strong> (${parentInfo.relationship})<br/>
          ${parentInfo.email} · ${parentInfo.phone}</p>
          <p>Address: ${parentInfo.address}, ${parentInfo.city}, ${parentInfo.state} ${parentInfo.zip}</p>
          <p>Emergency: ${parentInfo.emergencyName} (${parentInfo.emergencyRelationship}) — ${parentInfo.emergencyPhone}</p>
          <h3>Registered Campers</h3>
          ${tableHtml}
          ${medical ? `
          <h3>Medical Notes</h3>
          <p>Allergies: ${medical.allergies || "None"}</p>
          <p>Medications: ${medical.medications || "None"}</p>
          <p>Conditions: ${medical.conditions || "None"}</p>
          <p>Doctor: ${medical.doctorName || "—"} ${medical.doctorPhone || ""}</p>
          <p>Waiver signed by: ${medical.waiverName} | Photo release: ${medical.photoRelease ? "Yes" : "No"}</p>
          ` : ""}
        </div>`,
    }),
    // Customer receipt
    transporter.sendMail({
      from:    process.env.SMTP_USER,
      to:      parentInfo.email,
      subject: "Your Camp Registration is Confirmed! 🏀",
      html: `
        <div style="font-family:sans-serif;max-width:600px">
          <h2 style="color:#1e40af">Camp Registration Confirmed! 🏀</h2>
          <p>Hi ${parentInfo.guardianName.split(" ")[0]},</p>
          <p>Your payment of <strong>$${total.toFixed(2)}</strong> has been received for the <strong>2026 Hilhi Youth Basketball Camp</strong>.</p>
          ${tableHtml}
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0">
            <strong style="color:#15803d">Camp Details</strong><br/>
            📅 June 22–25, 2026<br/>
            ⏰ 9AM–3PM (Drop-off at 8AM)<br/>
            📍 Hillsboro High School<br/>
            👕 Free T-shirt included
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
