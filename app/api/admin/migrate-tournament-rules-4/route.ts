import { NextRequest, NextResponse } from "next/server";
import { getTournaments, upsertTournament } from "@/lib/tournament";

export const dynamic = "force-dynamic";

const SECRET = "d7e2b4f9a1c6083ef5b2a7d4c9f01682e3b5c8d9";

const NEW_LINE = "Weekend Pass (Adult only): $16";

export async function POST(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (key !== SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tournaments = await getTournaments();
  const updated = [];
  for (const t of tournaments) {
    const rules = (t.rules || "").trim();
    const newRules = rules ? `${rules}\n${NEW_LINE}` : NEW_LINE;
    await upsertTournament({ ...t, rules: newRules });
    updated.push(t.id);
  }

  return NextResponse.json({ success: true, updatedIds: updated });
}
