import { NextRequest, NextResponse } from "next/server";
import { getVisitors, getTally, clearVisitors, deleteGuest, deleteVisitEntry } from "@/lib/filmroom";

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

  const guest    = req.nextUrl.searchParams.get("guest");    // tally key (name|email)
  const entryId  = req.nextUrl.searchParams.get("entryId"); // single log entry id

  if (guest) {
    await deleteGuest(decodeURIComponent(guest));
    return NextResponse.json({ ok: true });
  }
  if (entryId) {
    await deleteVisitEntry(decodeURIComponent(entryId));
    return NextResponse.json({ ok: true });
  }

  // No specific target → clear all
  await clearVisitors();
  return NextResponse.json({ ok: true });
}
