import { NextResponse } from "next/server";
import { getMerchStock } from "@/lib/merch-stock";

export const dynamic = "force-dynamic";

// Public: lets the merch page show "Not available". Only garment labels and counts are returned.
export async function GET() {
  const s = await getMerchStock();
  return NextResponse.json(
    { rows: s.rows.map(r => ({ id: r.id, label: r.label, counts: r.counts })) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
