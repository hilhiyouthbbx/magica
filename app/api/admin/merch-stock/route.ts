import { NextRequest, NextResponse } from "next/server";
import { getMerchStock, saveMerchStock, cleanStock } from "@/lib/merch-stock";

export const dynamic = "force-dynamic";

const isAdmin = (r: NextRequest) => r.nextUrl.searchParams.get("key") === (process.env.ADMIN_PASSWORD ?? "hilhi-admin");

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getMerchStock(), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const clean = cleanStock(body);
  if (!clean) return NextResponse.json({ error: "Bad data" }, { status: 400 });
  await saveMerchStock(clean);
  return NextResponse.json(clean, { headers: { "Cache-Control": "no-store" } });
}
