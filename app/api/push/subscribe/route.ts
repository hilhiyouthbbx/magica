import { NextRequest, NextResponse } from "next/server";
import { saveSubscription, removeSubscriptionsByEndpoint } from "@/lib/push-subscriptions";

export const dynamic = "force-dynamic";

// Public endpoint — anyone visiting the registration page can subscribe. No admin auth needed
// (mirrors how the registration/payment endpoints work — this is a public-facing form action).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscription, tournamentName, teamName, contactEmail } = body as {
      subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
      tournamentName?: string;
      teamName?: string;
      contactEmail?: string;
    };
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription." }, { status: 400 });
    }
    await saveSubscription({
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      tournamentName,
      teamName,
      contactEmail,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("push subscribe error:", err);
    return NextResponse.json({ error: "Failed to save subscription." }, { status: 500 });
  }
}

// Lets a browser unsubscribe cleanly if the user later disables notifications.
export async function DELETE(req: NextRequest) {
  try {
    const { endpoint } = await req.json();
    if (endpoint) await removeSubscriptionsByEndpoint([endpoint]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // best-effort, never block the user on this
  }
}
