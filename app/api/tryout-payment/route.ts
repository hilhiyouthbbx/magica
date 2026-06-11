import { NextRequest, NextResponse } from "next/server";
import { saveContact } from "@/lib/contacts";

const SQ_BASE =
  process.env.SQUARE_ENVIRONMENT === "production"
    ? "https://connect.squareup.com/v2"
    : "https://connect.squareupsandbox.com/v2";

export async function POST(req: NextRequest) {
  try {
    const {
      sourceId, total, quantity,
      parentName, email, phone,
      playerName, grade, session,
    } = await req.json();

    if (!sourceId || !total || !parentName || !email) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // Charge Square
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

    const paymentId = sqData.payment?.id || crypto.randomUUID();

    // Save to contacts
    await saveContact({
      name:   parentName,
      email,
      phone,
      source: "tryout" as any,
      notes:  `Player: ${playerName} | Grade: ${grade} | Session: ${session} | Qty: ${quantity}`,
    });

    return NextResponse.json({ success: true, paymentId });
  } catch (err: any) {
    console.error("tryout-payment error:", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
