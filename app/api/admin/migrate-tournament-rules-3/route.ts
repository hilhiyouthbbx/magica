import { NextRequest, NextResponse } from "next/server";
import { getTournaments, upsertTournament } from "@/lib/tournament";

export const dynamic = "force-dynamic";

const SECRET = "c4f8a1e6b3d9027ce5a2f8b1d4e70369bf82c5a4";

const NEW_LINES = [
  "Admission: $10 Adult",
  "$8 Senior (62 and older)",
  "$6 Ages 12–18",
  "12 and under: FREE",
  "$5 Military and First Responders",
].join("\n");

export async function POST(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (key !== SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tournaments = await getTournaments();
  const updated = [];
  for (const t of tournaments) {
    const rules = (t.rules || "").trim();
    const newRules = rules ? `${rules}\n\n${NEW_LINES}` : NEW_LINES;
    await upsertTournament({ ...t, rules: newRules });
    updated.push(t.id);
  }

  return NextResponse.json({ success: true, updatedIds: updated });
}
