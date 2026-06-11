import { NextRequest, NextResponse } from "next/server";
import { getVouchers, upsertVoucher, deleteVoucher } from "@/lib/vouchers";

const pw      = () => process.env.ADMIN_PASSWORD ?? "hilhi-admin";
const isAdmin = (r: NextRequest) => r.nextUrl.searchParams.get("key") === pw();

// GET /api/vouchers?key=xxx  — list all
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getVouchers());
}

// POST /api/vouchers?key=xxx  — create or update
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.code) return NextResponse.json({ error: "code is required" }, { status: 400 });
  const voucher = await upsertVoucher(body);
  return NextResponse.json(voucher);
}

// DELETE /api/vouchers?key=xxx&id=xxx  — remove
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  await deleteVoucher(id);
  return NextResponse.json({ ok: true });
}
