import { NextRequest, NextResponse } from "next/server";
import { getCampSchedule, saveCampSchedule } from "@/lib/camp-schedule";

export const dynamic = "force-dynamic";

const pw      = () => process.env.ADMIN_PASSWORD ?? "hilhi-admin";
const isAdmin = (r: NextRequest) => r.nextUrl.searchParams.get("key") === pw();

export async function GET() {
  const data = await getCampSchedule();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const current = await getCampSchedule();
  const updated = { ...current, ...body };
  await saveCampSchedule(updated);
  return NextResponse.json({ ok: true });
}
