import { NextRequest, NextResponse } from "next/server";
import { getContacts, deleteContact, importContactsCSV } from "@/lib/contacts";

function checkAuth(req: NextRequest) {
  const key      = req.nextUrl.searchParams.get("key") || "";
  const expected = process.env.ADMIN_PASSWORD || "hilhi-admin";
  return key === expected;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const contacts = await getContacts();
  return NextResponse.json({ contacts });
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  if (body.action === "delete" && body.id) {
    await deleteContact(body.id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "import" && body.csv) {
    const count = await importContactsCSV(body.csv);
    return NextResponse.json({ ok: true, imported: count });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
