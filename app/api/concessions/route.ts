import { NextRequest, NextResponse } from "next/server";
import { getConcessions, saveConcessions, passwordOk, publicView, cleanName, SLOTS } from "@/lib/concessions";

export const dynamic = "force-dynamic";

// Parents: the password goes in the "x-concession-password" header (GET) or the body (POST).
const closed = () => NextResponse.json({ error: "closed" }, { status: 403 });
const wrong  = () => NextResponse.json({ error: "Incorrect password." }, { status: 401 });

export async function GET(req: NextRequest) {
  const d = await getConcessions();
  if (!d.enabled || !d.password.trim()) return closed();
  if (!passwordOk(d.password, req.headers.get("x-concession-password") || "")) return wrong();
  return NextResponse.json(publicView(d), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const d = await getConcessions();
  if (!d.enabled || !d.password.trim()) return closed();
  if (!passwordOk(d.password, String(body.password || ""))) return wrong();

  const id = String(body.id || "");
  const slot = Number(body.slot);
  const validId = d.games.some(g => id.startsWith(g.date + "-"));
  if (!validId || !Number.isInteger(slot) || slot < 0 || slot >= SLOTS) {
    return NextResponse.json({ error: "Unknown game or slot." }, { status: 400 });
  }

  // Always re-read just before writing so two parents signing up at once keep each other's names.
  const fresh = await getConcessions();
  const arr = [...(fresh.bookings[id] || [])];
  while (arr.length < SLOTS) arr.push("");

  if (body.action === "claim") {
    const name = cleanName(body.name);
    if (!name) return NextResponse.json({ error: "Please type a name." }, { status: 400 });
    if (arr[slot]) return NextResponse.json({ error: "That space was just taken. Please pick another.", ...publicView(fresh) }, { status: 409 });
    arr[slot] = name;
  } else if (body.action === "release") {
    arr[slot] = "";
  } else {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  fresh.bookings = { ...fresh.bookings, [id]: arr };
  await saveConcessions(fresh);
  return NextResponse.json(publicView(fresh), { headers: { "Cache-Control": "no-store" } });
}
