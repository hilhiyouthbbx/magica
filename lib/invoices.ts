import fs   from "fs";
import path from "path";

const FILE   = path.join(process.cwd(), "data", "invoices.json");
const KV_KEY = "hilhi_invoices";

const getRedisUrl   = () => process.env.KV_REST_API_URL   || process.env.UPSTASH_REDIS_REST_URL   || "";
const getRedisToken = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const hasKV         = () => !!(getRedisUrl() && getRedisToken());

async function getRedis() {
  const { Redis } = await import("@upstash/redis");
  return new Redis({ url: getRedisUrl(), token: getRedisToken() });
}
async function kvGet<T>(key: string): Promise<T | null> {
  const redis = await getRedis(); return redis.get<T>(key);
}
async function kvSet(key: string, value: unknown): Promise<void> {
  const redis = await getRedis(); await redis.set(key, value);
}

// ── Data model ──────────────────────────────────────────────────────
export interface InvoiceItem {
  description: string;
  amount: number;
}

export interface Invoice {
  id:               string;
  invoiceNumber:    string;   // e.g. "INV-1001" — auto-incrementing, shown to the organization
  organizationName: string;
  contactName?:     string;
  contactEmail:     string;
  items:            InvoiceItem[];
  notes?:           string;
  issueDate:        string;   // YYYY-MM-DD
  dueDate?:         string;   // YYYY-MM-DD
  status:           "unpaid" | "paid";
  paidAt?:          string;   // ISO timestamp, set when marked paid
  lastSentAt?:      string;   // ISO timestamp, set each time the invoice email is sent
  createdAt:        string;
  updatedAt:        string;
}

function makeId() { return `inv-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`; }

export function invoiceTotal(inv: Pick<Invoice, "items">): number {
  return inv.items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
}

// ── Read ─────────────────────────────────────────────────────────────────
export async function getInvoices(): Promise<Invoice[]> {
  if (hasKV()) {
    try { return (await kvGet<Invoice[]>(KV_KEY)) ?? []; } catch { return []; }
  }
  if (!fs.existsSync(FILE)) return [];
  try { return JSON.parse(fs.readFileSync(FILE, "utf8")) as Invoice[]; } catch { return []; }
}

// ── Write ─────────────────────────────────────────────────────────────────
async function saveInvoices(list: Invoice[]): Promise<void> {
  if (hasKV()) { await kvSet(KV_KEY, list); return; }
  const dir = path.dirname(FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2));
}

/** Next sequential invoice number, e.g. "INV-1001", "INV-1002", ... */
async function nextInvoiceNumber(): Promise<string> {
  const all = await getInvoices();
  const nums = all
    .map(i => parseInt((i.invoiceNumber || "").replace(/[^0-9]/g, ""), 10))
    .filter(n => !isNaN(n));
  const next = (nums.length > 0 ? Math.max(...nums) : 1000) + 1;
  return `INV-${next}`;
}

// ── CRUD helpers ──────────────────────────────────────────────────────────
export async function upsertInvoice(
  inv: Partial<Invoice> & { organizationName: string; contactEmail: string; items: InvoiceItem[] }
): Promise<Invoice> {
  const all = await getInvoices();
  const now = new Date().toISOString();

  if (inv.id) {
    const idx = all.findIndex(x => x.id === inv.id);
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...inv, updatedAt: now };
      await saveInvoices(all);
      return all[idx];
    }
  }

  const created: Invoice = {
    id:               makeId(),
    invoiceNumber:    inv.invoiceNumber || await nextInvoiceNumber(),
    organizationName: inv.organizationName,
    contactName:      inv.contactName || "",
    contactEmail:     inv.contactEmail,
    items:            inv.items,
    notes:            inv.notes || "",
    issueDate:        inv.issueDate || now.slice(0, 10),
    dueDate:          inv.dueDate || "",
    status:           inv.status || "unpaid",
    paidAt:           inv.status === "paid" ? now : undefined,
    createdAt:        now,
    updatedAt:        now,
  };
  all.push(created);
  await saveInvoices(all);
  return created;
}

export async function setInvoiceStatus(id: string, status: "paid" | "unpaid"): Promise<boolean> {
  const all = await getInvoices();
  const idx = all.findIndex(x => x.id === id);
  if (idx === -1) return false;
  all[idx].status = status;
  all[idx].paidAt = status === "paid" ? new Date().toISOString() : undefined;
  all[idx].updatedAt = new Date().toISOString();
  await saveInvoices(all);
  return true;
}

export async function markInvoiceSent(id: string): Promise<void> {
  const all = await getInvoices();
  const idx = all.findIndex(x => x.id === id);
  if (idx === -1) return;
  all[idx].lastSentAt = new Date().toISOString();
  all[idx].updatedAt = new Date().toISOString();
  await saveInvoices(all);
}

export async function deleteInvoice(id: string): Promise<void> {
  const all = (await getInvoices()).filter(x => x.id !== id);
  await saveInvoices(all);
}
