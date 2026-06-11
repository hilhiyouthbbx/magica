import { NextRequest, NextResponse } from "next/server";
import { getTournaments, getTournament, getEnabledTournaments, upsertTournament, deleteTournament } from "@/lib/tournament";

const pw      = () => process.env.ADMIN_PASSWORD ?? "hilhi-admin";
const isAdmin = (r: NextRequest) => r.nextUrl.searchParams.get("key") === pw();

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (isAdmin(req)) {
    if (id) {
      const t = await getTournament(id);
      return t ? NextResponse.json(t) : NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(await getTournaments());
  }
  if (id) {
    const t = await getTournament(id);
    if (!t?.enabled) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(t);
  }
  return NextResponse.json(await getEnabledTournaments());
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  const t    = await upsertTournament({ ...data, id: undefined });
  return NextResponse.json({ success: true, tournament: t });
}

export async function PUT(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  if (!data.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await upsertTournament(data);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await deleteTournament(id);
  return NextResponse.json({ success: true });
}
