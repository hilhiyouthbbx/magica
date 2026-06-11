import { NextRequest, NextResponse } from "next/server";
import { getContent, saveContent } from "@/lib/content";

const pw      = () => process.env.ADMIN_PASSWORD ?? "hilhi-admin";
const isAdmin = (r: NextRequest) => r.nextUrl.searchParams.get("key") === pw();

export async function GET() {
  return NextResponse.json(await getContent());
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  await saveContent(body);
  return NextResponse.json({ success: true });
}
