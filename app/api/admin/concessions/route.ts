import { NextRequest, NextResponse } from "next/server";
import { getConcessions, saveConcessions, cleanName, SLOTS } from "@/lib/concessions";

export const dynamic = "force-dynamic";

const isAdmin = (r: NextRequest) => r.nextUrl.searchParams.get("key") === (process.env.ADMIN_PASSWORD ?? "hilhi-admin");

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getConcessions(), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const d = await getConcessions();

  if (body.action === "settings") {
    d.enabled  = !!body.enabled;
    d.password = String(body.password ?? "").trim().slice(0, 80);
    d.title    = String(body.title ?? d.title).slice(0, 120);
    d.intro    = String(body.intro ?? d.intro).slice(0, 600);
  } else if (body.action === "setSlot") {
    const id = String(body.id || ""), slot = Number(body.slot);
    if (!d.games.some(g => id.startsWith(g.date + "-")) || !(slot >= 0 && slot < SLOTS)) return NextResponse.json({ error: "Bad slot" }, { status: 400 });
    const arr = [...(d.bookings[id] || [])];
    while (arr.length < SLOTS) arr.push("");
    arr[slot] = cleanName(body.name);
    d.bookings[id] = arr;
    const ath = [...(d.athletes[id] || [])];
    while (ath.length < SLOTS) ath.push({ athlete: "", teams: "" });
    if (!arr[slot]) ath[slot] = { athlete: "", teams: "" };
    d.athletes[id] = ath;
  } else if (body.action === "setAthlete") {
    const id = String(body.id || ""), slot = Number(body.slot);
    if (!d.games.some(g => id.startsWith(g.date + "-")) || !(slot >= 0 && slot < SLOTS)) return NextResponse.json({ error: "Bad slot" }, { status: 400 });
    const ath = [...(d.athletes[id] || [])];
    while (ath.length < SLOTS) ath.push({ athlete: "", teams: "" });
    ath[slot] = { athlete: cleanName(body.athlete), teams: ath[slot]?.teams || "" };
    d.athletes[id] = ath;
  } else if (body.action === "clearAll") {
    d.bookings = {};
    d.athletes = {};
  } else if (body.action === "games" && Array.isArray(body.games)) {
    d.games = body.games;
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  await saveConcessions(d);
  return NextResponse.json(d, { headers: { "Cache-Control": "no-store" } });
}
