import { NextRequest, NextResponse } from "next/server";
import { validateVoucher, VoucherEvent } from "@/lib/vouchers";

// GET /api/vouchers/validate?code=HILHI20&event=camp&subtotal=155
export async function GET(req: NextRequest) {
  const code     = req.nextUrl.searchParams.get("code")     ?? "";
  const event    = (req.nextUrl.searchParams.get("event")   ?? "camp") as VoucherEvent;
  const subtotal = parseFloat(req.nextUrl.searchParams.get("subtotal") ?? "0");

  if (!code)     return NextResponse.json({ valid: false, error: "No code provided." });
  if (!subtotal) return NextResponse.json({ valid: false, error: "Invalid subtotal." });

  const result = await validateVoucher(code, event, subtotal);
  return NextResponse.json(result);
}
