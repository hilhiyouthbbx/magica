import { NextRequest, NextResponse } from "next/server";
import { getContacts, deleteContact, updateContact, importContactsCSV, createContact, deleteContactsBySource } from "@/lib/contacts";
import { Redis } from "@upstash/redis";

export const dynamic = "force-dynamic";

const getRedisUrl   = () => process.env.KV_REST_API_URL   || process.env.UPSTASH_REDIS_REST_URL   || "";
const getRedisToken = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const hasKV         = () => !!(getRedisUrl() && getRedisToken());

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

  const action = req.nextUrl.searchParams.get("action");

  // Handle plain-text CSV import (from file upload button)
  if (action === "import") {
    const source = req.nextUrl.searchParams.get("source") || "import";
    const csv    = await req.text();
    const count  = await importContactsCSV(csv, source);
    return NextResponse.json({ imported: count });
  }

  // Handle JSON body actions
  const body = await req.json();

  if (body.action === "delete" && body.id) {
    await deleteContact(body.id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "deleteBySource" && body.source) {
    const removed = await deleteContactsBySource(body.source);
    return NextResponse.json({ ok: true, removed });
  }

  if (body.action === "update" && body.id && body.patch) {
    const ok = await updateContact(body.id, body.patch);
    return NextResponse.json({ ok });
  }

  if (body.action === "import" && body.csv) {
    const count = await importContactsCSV(body.csv, body.source || "import");
    return NextResponse.json({ ok: true, imported: count });
  }

  // Bulk JSON — stores the full contact array directly into Redis/filesystem
  if (body.action === "bulkJson" && Array.isArray(body.contacts)) {
    try {
      if (hasKV()) {
        const redis = new Redis({ url: getRedisUrl(), token: getRedisToken() });
        await redis.set("hilhi_contacts", body.contacts);
      } else {
        const fs   = await import("fs");
        const path = await import("path");
        const dir  = path.join(process.cwd(), "data");
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, "contacts.json"), JSON.stringify(body.contacts, null, 2));
      }
      return NextResponse.json({ ok: true, imported: body.contacts.length });
    } catch (e: unknown) {
      return NextResponse.json({ error: String(e) }, { status: 500 });
    }
  }

  if (body.action === "create" && body.contact) {
    const created = await createContact(body.contact);
    return NextResponse.json({ ok: true, contact: created });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
