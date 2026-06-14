import { NextRequest, NextResponse } from "next/server";
import { heartbeat, leave, getActiveViewers } from "@/lib/filmroom-presence";

export const dynamic = "force-dynamic";

// GET — who is currently active
export async function GET() {
  const viewers = await getActiveViewers();
  return NextResponse.json(viewers);
}

// POST — heartbeat { name, watching? } or leave { name, action: "leave" }
export async function POST(req: NextRequest) {
  const { name, action, watching } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
  if (action === "leave") {
    await leave(name.trim());
    return NextResponse.json({ ok: true });
  }
  const viewers = await heartbeat(name.trim(), watching as string | undefined);
  return NextResponse.json(viewers);
}
