import { NextRequest, NextResponse } from "next/server";
import { getTournaments, upsertTournament } from "@/lib/tournament";

export const dynamic = "force-dynamic";

const SECRET = "b1e4f7a2c9d6083f5a1e7c4b9d2f6083ae4c17b0";

const NEW_LINE = "• Technical foul: automatic 2 points and possession awarded to the opposing team.";

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
