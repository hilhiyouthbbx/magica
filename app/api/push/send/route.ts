import { NextRequest, NextResponse } from "next/server";
import { findSubscriptions, removeSubscriptionsByEndpoint } from "@/lib/push-subscriptions";

export const dynamic = "force-dynamic";

function checkAuth(req: NextRequest) {
  const key      = req.nextUrl.searchParams.get("key") || "";
  const expected = process.env.ADMIN_PASSWORD || "hilhi-admin";
  return key === expected;
}

// Admin-only — sends a push notification to everyone subscribed to a tournament (and optionally
// a specific team within it). Used by the Tournament Manager to auto-alert on schedule changes
// and final scores, but can be called for any custom announcement too.
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vapidPublic  = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT || "mailto:info@hilhiyouthbbx.com";
  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json({ error: "Push notifications aren't configured yet (missing VAPID keys)." }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { tournamentName, teamName, title, message, url } = body as {
      tournamentName: string; teamName?: string; title: string; message: string; url?: string;
    };
    if (!tournamentName || !title || !message) {
      return NextResponse.json({ error: "Missing tournamentName, title, or message." }, { status: 400 });
    }

    const subs = await findSubscriptions(tournamentName, teamName);
    if (subs.length === 0) return NextResponse.json({ ok: true, sent: 0 });

    const webpush = await import("web-push");
    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

    const payload = JSON.stringify({ title, body: message, url: url || "/" });
    const deadEndpoints: string[] = [];
    let sent = 0;

    await Promise.all(subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, payload);
        sent++;
      } catch (err: any) {
        // 404/410 = the subscription is gone (browser unsubscribed, cleared data, etc.) — clean it up.
        if (err?.statusCode === 404 || err?.statusCode === 410) deadEndpoints.push(s.endpoint);
        else console.error("push send error:", err?.statusCode, err?.body || err);
      }
    }));

    if (deadEndpoints.length > 0) await removeSubscriptionsByEndpoint(deadEndpoints);

    return NextResponse.json({ ok: true, sent, total: subs.length });
  } catch (err) {
    console.error("push send route error:", err);
    return NextResponse.json({ error: "Failed to send notifications." }, { status: 500 });
  }
}
