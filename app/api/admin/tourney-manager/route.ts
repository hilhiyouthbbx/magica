import { NextRequest, NextResponse } from "next/server";
import { getAllTournamentsServer, saveTournamentServer, deleteTournamentServer } from "@/lib/tourney-manager-storage";

export const dynamic = "force-dynamic";

function checkAuth(req: NextRequest) {
  const key      = req.nextUrl.searchParams.get("key") || "";
  const expected = process.env.ADMIN_PASSWORD || "hilhi-admin";
  return key === expected;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tournaments = await getAllTournamentsServer();
  return NextResponse.json({ tournaments });
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  if (body.action === "save" && body.tournament) {
    await saveTournamentServer(body.tournament);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "delete" && body.id) {
    await deleteTournamentServer(body.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
