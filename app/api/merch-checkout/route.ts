import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { saveContact } from "@/lib/contacts";

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeKey || stripeKey.startsWith("sk_test_REPLACE")) {
    return NextResponse.json(
      { error: "Stripe not configured. Add your STRIPE_SECRET_KEY to .env.local" },
      { status: 503 }
    );
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2026-05-27.dahlia" });

  const { name, email, phone, notes, items } = await req.json() as {
    name: string;
    email: string;
    phone: string;
    notes: string;
    items: { name: string; size: string; qty: number; price: number; img: string }[];
  };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  // ── Save customer to contacts DB ─────────────────────────────────────────
  try {
    const itemsSummary = items
      .map((i) => `${i.qty}× ${i.name} (${i.size})`)
      .join(", ");
    await saveContact({
      name,
      email,
      phone,
      source: "merch-order",
      notes: `Merch: ${itemsSummary}`,
    });
  } catch (err) {
    console.error("Contact save error:", err);
  }

  // ── Build Stripe line items ───────────────────────────────────────────────
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: `${item.name} – Size ${item.size}`,
        description: `Hilhi Youth Basketball Official Gear`,
        images: [item.img],
      },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: item.qty,
  }));

  const orderSummary = items
    .map((i) => `${i.qty}× ${i.name} (${i.size})`)
    .join(", ");

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    customer_email: email,
    metadata: {
      customer_name:  name,
      customer_phone: phone,
      order_notes:    notes?.slice(0, 490) || "",
      order_items:    orderSummary.slice(0, 490),
    },
    success_url: `${baseUrl}/merch/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${baseUrl}/merch`,
    billing_address_collection: "required",
    phone_number_collection: { enabled: true },
    shipping_address_collection: {
      allowed_countries: ["US"],
    },
  });

  return NextResponse.json({ url: session.url });
}
