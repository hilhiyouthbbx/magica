import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { saveContact } from "@/lib/contacts";
import { campConfirmationHtml, campAdminNotificationHtml } from "@/lib/email";
import { validateVoucher, redeemVoucher, calcDiscount } from "@/lib/vouchers";

const SQ_BASE =
  process.env.SQUARE_ENVIRONMENT === "production"
    ? "https://connect.squareup.com/v2"
    : "https://connect.squareupsandbox.com/v2";

const ERROR_MESSAGES: Record<string, string> = {
  CARD_DECLINED:                "Your card was declined. Please try a different card.",
  CARD_DECLINED_CALL_ISSUER:   "Your card was declined. Please contact your bank or try a different card.",
  CVV_FAILURE:                  "The security code (CVV) was incorrect. Please check and try again.",
  ADDRESS_VERIFICATION_FAILURE: "Address verification failed. Please check your billing ZIP code.",
  INSUFFICIENT_FUNDS:           "Insufficient funds on this card. Please use a different card.",
  CARD_EXPIRED:                 "This card has expired. Please use a different card.",
  INVALID_CARD:                 "The card information is invalid. Please check and try again.",
  TRANSACTION_LIMIT:            "This transaction exceeds your card limit.",
  TEMPORARY_ERROR:              "A temporary error occurred. Please try again in a moment.",
  UNAUTHORIZED:                 "Payment could not be authorized. Please re-enter your card details and try again.",
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
    const { sourceId, total: clientTotal, quantity, campers, parentInfo, medical, voucherCode } = await req.json() as {
      sourceId: string;
      total: number;
      quantity: number;
      campers: Camper[];
      parentInfo: ParentInfo;
      medical: MedicalInfo;
      voucherCode?: string | null;
    };

    // ── Server-side voucher validation ──────────────────────────────────────
    // Vouchers apply to BASE price only; fee is waived when a voucher is used
    const CAMP_BASE  = 150;
    const CAMP_FEE   = Math.round(CAMP_BASE * 0.03 * 100) / 100;
    const baseOnly   = CAMP_BASE * quantity;          // $150 per camper
    const fullTotal  = (CAMP_BASE + CAMP_FEE) * quantity; // $154.50 per camper
    let total = fullTotal;
    let voucherApplied = false;

    if (voucherCode) {
      const check = await validateVoucher(voucherCode, "camp", baseOnly);
      if (check.valid && check.voucher) {
        total = check.finalTotal!;   // discounted base, fee waived
        voucherApplied = true;
      }
    }

    if (!sourceId || typeof clientTotal !== "number" || !parentInfo?.guardianName) {
      return NextResponse.json({ success: false, error: "Invalid request. Please try again." }, { status: 400 });
    }

    // ── Charge via Square (skip when free) ───────────────────────────────────
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
      paymentId = sqData.payment?.id as string | undefined;
    } else {
      paymentId = "FREE-" + crypto.randomUUID().slice(0, 8);
    }

    // ── Redeem voucher ───────────────────────────────────────────────────────
    if (voucherCode && voucherApplied) {
      try { await redeemVoucher(voucherCode); } catch { /* non-fatal */ }
    }

    // ── Save contact ─────────────────────────────────────────────────────────
    try {
      await saveContact({
        name:   parentInfo.guardianName,
        email:  parentInfo.email || "noemail@noemail.com",
        phone:  parentInfo.phone || "",
        source: "registration",
        notes:  `Camp (${quantity} camper${quantity > 1 ? "s" : ""}): ${(campers || []).map((c: Camper) => `${c.firstName} ${c.lastName} (${c.grade})`).join(", ")} | $${total.toFixed(2)} | Square: ${paymentId ?? "n/a"}`,
        camperName:       (campers || []).map(c => `${c.firstName} ${c.lastName}`).join(", "),
        grade:            (campers || []).map(c => c.grade).join(", "),
        gender:           (campers || []).map(c => c.gender).join(", "),
        shirtSize:        (campers || []).map(c => c.jerseySize).join(", "),
        emergencyContact: parentInfo.emergencyName,
        emergencyPhone:   parentInfo.emergencyPhone,
        amountPaid:       total.toFixed(2),
        paymentStatus:    "Paid",
      });
    } catch { /* non-fatal */ }

    // ── Send emails ───────────────────────────────────────────────────────────
    try {
      await sendEmails(parentInfo, campers, total, paymentId, medical);
    } catch (e) {
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
  total:      number,
  paymentId?: string,
  medical?:   MedicalInfo,
) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn("SMTP not configured — skipping confirmation email.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host:   smtpHost,
    port:   Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth:   { user: smtpUser, pass: smtpPass },
  });

  const parentFirstName = parentInfo.guardianName.split(" ")[0];

  // Build camper array for email template
  const camperList = (campers || []).map(c => ({
    name:      `${c.firstName} ${c.lastName}`,
    grade:     c.grade,
    gender:    c.gender === "male" ? "Boy" : c.gender === "female" ? "Girl" : c.gender,
    shirtSize: c.jerseySize,
  }));

  // Beautiful customer receipt
  const customerHtml = campConfirmationHtml({
    parentFirstName,
    campers:  camperList,
    total:    total.toFixed(2),
    paymentId,
  });

  // Admin notification with full details
  const adminHtml = campAdminNotificationHtml({
    parentName:       parentInfo.guardianName,
    parentEmail:      parentInfo.email,
    parentPhone:      parentInfo.phone,
    campers:          camperList,
    total:            total.toFixed(2),
    paymentId,
    emergencyContact: parentInfo.emergencyName,
    emergencyPhone:   parentInfo.emergencyPhone,
  });

  await Promise.allSettled([
    // Admin notification
    transporter.sendMail({
      from:    `"Hilhi Youth Basketball" <${smtpUser}>`,
      to:      "info@hilhiyouthbbx.com",
      subject: `✅ New Camp Registration — ${parentInfo.guardianName} — ${camperList.length} camper${camperList.length > 1 ? "s" : ""} — $${total.toFixed(2)}`,
      html:    adminHtml,
    }),
    // Customer receipt
    parentInfo.email ? transporter.sendMail({
      from:    `"Hilhi Youth Basketball" <${smtpUser}>`,
      to:      parentInfo.email,
      subject: "🏀 Your Camp Registration is Confirmed!",
      html:    customerHtml,
    }) : Promise.resolve(),
  ]);
}
