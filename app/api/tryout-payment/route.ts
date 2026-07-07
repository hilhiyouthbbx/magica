import { NextRequest, NextResponse } from "next/server";
import { saveContact } from "@/lib/contacts";
import { validateVoucher, redeemVoucher } from "@/lib/vouchers";

const SQ_BASE =
  process.env.SQUARE_ENVIRONMENT === "production"
    ? "https://connect.squareup.com/v2"
    : "https://connect.squareupsandbox.com/v2";

export async function POST(req: NextRequest) {
  try {
    const {
      sourceId, total: clientTotal, basePrice: clientBase, quantity,
      parentName, email, phone,
      playerName, grade, session,
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

    // Free registration — skip Square
    let paymentId = "FREE-" + crypto.randomUUID().slice(0, 8);
    if (sourceId !== "FREE" && total > 0) {  // skip Square for free
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
          note: `Tryout Reg — ${playerName || ""} | ${grade || ""} | ${session || ""}`,
        }),
      });
      const sqData = await sqRes.json();
      if (!sqRes.ok || sqData.errors) {
        const msg = sqData.errors?.[0]?.detail || "Payment failed.";
        return NextResponse.json({ error: msg }, { status: 400 });
      }
      paymentId = sqData.payment?.id || paymentId;
    }

    // ── Redeem voucher ───────────────────────────────────────────────────────
    if (voucherCode && voucherApplied) {
      try { await redeemVoucher(voucherCode); } catch { /* non-fatal */ }
    }

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
      notes:  `Player: ${playerName} | Grade: ${grade} | Session: ${session} | Qty: ${quantity} | Uniform size: ${uniformSize || "n/a"} | Next season school: ${nextSeasonSchool || "n/a"} | Address: ${address || "n/a"} | Boundary check: ${boundarySchool || "not checked"} (${inHillsboroBoundary || "unknown"}) | Waiver (2026-2027 Winter Season): ${waiverSigned ? `Signed by ${waiverName || "n/a"}` : "NOT SIGNED"}`,
    });

    return NextResponse.json({ success: true, paymentId });
  } catch (err: any) {
    console.error("tryout-payment error:", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
