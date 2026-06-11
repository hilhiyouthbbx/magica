import fs from "fs";
import path from "path";

const DATA_DIR      = path.join(process.cwd(), "data");
const CONTACTS_FILE = path.join(DATA_DIR, "contacts.json");
const KV_KEY        = "hilhi_contacts";

// ── Supports both @vercel/kv vars AND @upstash/redis (Upstash marketplace) vars ──
const getRedisUrl   = () => process.env.KV_REST_API_URL   || process.env.UPSTASH_REDIS_REST_URL   || "";
const getRedisToken = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const hasKV         = () => !!(getRedisUrl() && getRedisToken());

async function getRedis() {
  const { Redis } = await import("@upstash/redis");
  return new Redis({ url: getRedisUrl(), token: getRedisToken() });
}
async function kvGet<T>(key: string): Promise<T | null> {
  const redis = await getRedis();
  return redis.get<T>(key);
}
async function kvSet(key: string, value: unknown): Promise<void> {
  const redis = await getRedis();
  await redis.set(key, value);
}

export interface Contact {
  id:              string;
  name:            string;
  email:           string;
  phone:           string;
  source:          "registration" | "merch-order" | "import" | "tournament" | "tryout";
  notes?:          string;
  tournamentName?: string;
  teamName?:       string;
  division?:       string;
  date:            string;
}

// ── Read all contacts ──────────────────────────────────────────────────────
export async function getContacts(): Promise<Contact[]> {
  if (hasKV()) {
    try {
      return (await kvGet<Contact[]>(KV_KEY)) ?? [];
    } catch { return []; }
  }
  if (!fs.existsSync(CONTACTS_FILE)) return [];
  try {
    const raw = fs.readFileSync(CONTACTS_FILE, "utf-8").trim();
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function persistContacts(contacts: Contact[]): Promise<void> {
  if (hasKV()) {
    await kvSet(KV_KEY, contacts);
    return;
  }
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2));
}

// ── Save / upsert a contact ────────────────────────────────────────────────
export async function saveContact(
  contact: Omit<Contact, "id" | "date">
): Promise<void> {
  const contacts = await getContacts();
  const emailLc  = contact.email.toLowerCase().trim();
  const existing = contacts.findIndex(c => c.email.toLowerCase() === emailLc);

  if (existing !== -1) {
    const c = contacts[existing];
    if (contact.source === "tournament") {
      contacts.push({
        ...contact,
        id:   `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        date: new Date().toISOString(),
      });
    } else {
      if (!c.notes?.includes(contact.source)) {
        c.notes = [c.notes, `+${contact.source}`].filter(Boolean).join(" ");
      }
      if (!c.phone && contact.phone) c.phone = contact.phone;
    }
  } else {
    contacts.push({
      ...contact,
      id:   `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: new Date().toISOString(),
    });
  }

  await persistContacts(contacts);
}

// ── Delete a contact ───────────────────────────────────────────────────────
export async function deleteContact(id: string): Promise<void> {
  const contacts = (await getContacts()).filter(c => c.id !== id);
  await persistContacts(contacts);
}

// ── Import contacts from CSV text ──────────────────────────────────────────
export async function importContactsCSV(csv: string): Promise<number> {
  const lines = csv.trim().split("\n").filter(Boolean);
  let imported = 0;
  for (const line of lines) {
    const cols  = line.split(",").map(s => s.trim().replace(/^"|"$/g, ""));
    if (cols.length < 2) continue;
    const email = cols.find(c => c.includes("@"));
    if (!email) continue;
    const emailIdx = cols.indexOf(email);
    const name  = cols.slice(0, emailIdx).join(" ").trim() || "Unknown";
    const phone = cols[emailIdx + 1] || "";
    if (email.toLowerCase() === "email") continue;
    await saveContact({ name, email, phone, source: "import" });
    imported++;
  }
  return imported;
}
