import { NextRequest, NextResponse } from "next/server";
import { getTournaments, upsertTournament } from "@/lib/tournament";

export const dynamic = "force-dynamic";

const SECRET = "7a3c9e1f5b2d8046a1c3e5f7b9d0246813579bdf";

const RULES = `• 4 quarters, 10-minute running clock.
• 4th quarter clock stops with 2:00 remaining if the point differential is 15 or more.
• 3 timeouts (30 seconds each) per team, per game.
• Overtime: 1st OT is 2 minutes, stop clock. 2nd OT is sudden death.
• Double bonus at 5 team fouls per quarter.
• 6 personal fouls disqualifies a player.
• 4th and 5th grade divisions: man-to-man defense only, using a 28.5" ball.
• No full-court press once a team is ahead by 20 or more points.`;

export async function POST(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (key !== SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tournaments = await getTournaments();
  const updated = [];
  for (const t of tournaments) {
    await upsertTournament({ ...t, rules: RULES });
    updated.push(t.id);
  }

  return NextResponse.json({ success: true, updatedIds: updated, rules: RULES });
}
