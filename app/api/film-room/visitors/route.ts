import { NextRequest, NextResponse } from "next/server";
import { getVisitors, getTally, clearVisitors } from "@/lib/filmroom";

export const dynamic = "force-dynamic";

const pw      = () => process.env.ADMIN_PASSWORD ?? "hilhi-admin";
const isAdmin = (r: NextRequest) => r.nextUrl.searchParams.get("key") === pw();

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [visitors, tally] = await Promise.all([getVisitors(), getTally()]);
  return NextResponse.json({ visitors, tally });
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await clearVisitors();
  return NextResponse.json({ ok: true });
}
