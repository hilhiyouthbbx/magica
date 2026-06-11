import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { saveContact } from "@/lib/contacts";

const CAMP_PRICE_CENTS = 15375; // $150.00 + $3.75 fee

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeKey || stripeKey.startsWith("sk_test_REPLACE")) {
    return NextResponse.json(
      { error: "Stripe not configured. Add your STRIPE_SECRET_KEY to .env.local" },
      { status: 503 }
    );
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2026-05-27.dahlia" });

  const body = await req.json();
  const { quantity, registrations, parentInfo } = body;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  // ── Save parent contact to database ─────────────────────────────────────
  try {
    const camperNames = registrations
      .map((r: { firstName: string; lastName: string }) => `${r.firstName} ${r.lastName}`)
      .join(", ");
    await saveContact({
      name:   parentInfo.guardianName,
      email:  parentInfo.email,
      phone:  parentInfo.phone,
      source: "registration",
      notes:  `Camper(s): ${camperNames}`,
    });
  } catch (err) {
    console.error("Contact save error:", err);
    // Don't block checkout on DB errors
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price_data: {
        currency: "usd",
        product_data: {
          name: "2026 Hilhi Youth Basketball Camp",
          description: `June 22–25, 2026 · Hillsboro High School · ${quantity} camper${quantity > 1 ? "s" : ""}`,
          images: [
            "https://galaxy-prod.tlcdn.com/view/user_34cYMUBillHvO8MzqYYaa9tzVg5/7634f012657a4144882b4e25112250e9.jpg",
          ],
        },
        unit_amount: CAMP_PRICE_CENTS,
      },
      quantity,
    },
  ];

  const camperNames = registrations
    .map((r: { firstName: string; lastName: string }) => `${r.firstName} ${r.lastName}`)
    .join(", ");

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    customer_email: parentInfo.email,
    metadata: {
      campers: camperNames.slice(0, 490),
      parent:  `${parentInfo.guardianName} — ${parentInfo.phone}`,
      event:   "2026 Hilhi Youth Basketball Camp",
    },
    success_url: `${baseUrl}/register/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${baseUrl}/register`,
    billing_address_collection: "required",
    phone_number_collection: { enabled: true },
  });

  return NextResponse.json({ url: session.url });
}
