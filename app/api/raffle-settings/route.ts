import { NextRequest, NextResponse } from "next/server";
import { getRaffleSettings, setRaffleOpen } from "@/lib/raffle-settings";

export const dynamic = "force-dynamic";

const pw      = () => process.env.ADMIN_PASSWORD ?? "hilhi-admin";
const isAdmin = (r: NextRequest) => r.nextUrl.searchParams.get("key") === pw();

// Public: the raffle page, nav button and homepage tile all read this.
export async function GET() {
  return NextResponse.json(await getRaffleSettings(), { headers: { "Cache-Control": "no-store" } });
}

// Admin only: { open: boolean }
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  await setRaffleOpen(body.open !== false);
  return NextResponse.json({ ok: true, open: body.open !== false });
}
