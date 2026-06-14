import { NextRequest, NextResponse } from "next/server";
import { getMessages, addMessage, clearChat } from "@/lib/filmroom-chat";

export const dynamic = "force-dynamic";

const pw      = () => process.env.ADMIN_PASSWORD ?? "hilhi-admin";
const isAdmin = (r: NextRequest) => r.nextUrl.searchParams.get("key") === pw();

// GET /api/film-room/chat?since=ISO  — poll for new messages
export async function GET(req: NextRequest) {
  const since = req.nextUrl.searchParams.get("since") ?? undefined;
  const msgs  = await getMessages(since);
  return NextResponse.json(msgs);
}

// POST /api/film-room/chat  — send a message
export async function POST(req: NextRequest) {
  const { name, text } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
  if (!text?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });
  if (text.trim().length > 500) return NextResponse.json({ error: "Message too long" }, { status: 400 });
  const msg = await addMessage(name, text);
  return NextResponse.json(msg);
}

// DELETE /api/film-room/chat?key=xxx  — admin clear chat
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await clearChat();
  return NextResponse.json({ ok: true });
}
