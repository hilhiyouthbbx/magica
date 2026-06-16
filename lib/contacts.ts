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

// ── Contact interface — all Wix CSV fields included ───────────────────────
export interface Contact {
  id:    string;
  date:  string;

  // Core contact info
  name:   string;
  email:  string;
  phone:  string;
  source: string; // e.g. "registration", "2026 Youth Summer Camp", "tournament"
  notes?: string;

  // Camper / participant info
  camperName?: string;
  grade?:      string;
  gender?:     string;
  shirtSize?:  string;

  // Emergency contact
  emergencyContact?: string;
  emergencyPhone?:   string;

  // Wix order / payment fields
  orderNumber?:   string;
  orderDate?:     string;
  ticketType?:    string;
  ticketNum?:     string;
  ticketPrice?:   string;
  benefit?:       string;
  coupon?:        string;
  tax?:           string;
  amountPaid?:    string;   // = "Total ticket" in Wix
  wixServiceFee?: string;
  ticketRevenue?: string;
  paymentStatus?: string;
  checkedIn?:     string;
  seatInfo?:      string;

  // Tournament fields
  tournamentName?: string;
  teamName?:       string;
  division?:       string;
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

// ── Save / upsert a single contact ────────────────────────────────────────
export async function saveContact(
  contact: Omit<Contact, "id" | "date">
): Promise<void> {
  const contacts = await getContacts();
  const emailLc  = contact.email.toLowerCase().trim();
  const existing = contacts.findIndex(c => c.email.toLowerCase() === emailLc);

  if (existing !== -1 && contact.source === "tournament") {
    // Tournament: always add new entry (different team/event)
    contacts.push({
      ...contact,
      id:   `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: new Date().toISOString(),
    });
  } else if (existing !== -1) {
    // Upsert: merge into existing, fill in blanks
    const c = contacts[existing];
    if (!c.phone && contact.phone) c.phone = contact.phone;
    if (!c.camperName && contact.camperName) c.camperName = contact.camperName;
    if (!c.grade      && contact.grade)      c.grade      = contact.grade;
    if (!c.shirtSize  && contact.shirtSize)  c.shirtSize  = contact.shirtSize;
    if (!c.notes      && contact.notes)      c.notes      = contact.notes;
  } else {
    contacts.push({
      ...contact,
      id:   `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: new Date().toISOString(),
    });
  }

  await persistContacts(contacts);
}

// ── Create a brand-new contact (always inserts, never upserts) ──────────────
export async function createContact(
  contact: Omit<Contact, "id" | "date">
): Promise<Contact> {
  if (contact.shirtSize) contact = { ...contact, shirtSize: normalizeShirtSize(contact.shirtSize) };
  const contacts = await getContacts();
  const newContact: Contact = {
    ...contact,
    id:   `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    date: new Date().toISOString(),
  };
  contacts.push(newContact);
  await persistContacts(contacts);
  return newContact;
}

// ── Update a contact ───────────────────────────────────────────────────────
export async function updateContact(id: string, patch: Partial<Omit<Contact, "id" | "date">>): Promise<boolean> {
  // Normalize shirt size if being updated
  if (patch.shirtSize) patch = { ...patch, shirtSize: normalizeShirtSize(patch.shirtSize) };
  const contacts = await getContacts();
  const idx = contacts.findIndex(c => c.id === id);
  if (idx === -1) return false;
  contacts[idx] = { ...contacts[idx], ...patch };
  await persistContacts(contacts);
  return true;
}

// ── Delete a contact ───────────────────────────────────────────────────────
export async function deleteContact(id: string): Promise<void> {
  const contacts = (await getContacts()).filter(c => c.id !== id);
  await persistContacts(contacts);
}

// ── Shirt-size normalizer — converts full names to abbreviations ─────────────
function normalizeShirtSize(raw: string): string {
  const s = raw.trim().toLowerCase().replace(/[\s\-_./]+/g, "");
  // Adult sizes
  if (s === "adultxxlarge" || s === "adultxxl" || s === "axxl" || s === "2xl" || s === "xxl") return "AXL";
  if (s === "adultxlarge"  || s === "adultxl"  || s === "axl"  || s === "xl")                return "AXL";
  if (s === "adultlarge"   || s === "al"        || s === "alarge")                            return "AL";
  if (s === "adultmedium"  || s === "am"        || s === "amedium")                           return "AM";
  if (s === "adultsmall"   || s === "as"        || s === "asmall")                            return "AS";
  // Youth sizes
  if (s === "youthxxlarge" || s === "youthxxl" || s === "yxxl")                              return "YXL";
  if (s === "youthxlarge"  || s === "youthxl"  || s === "yxl")                               return "YXL";
  if (s === "youthlarge"   || s === "yl"        || s === "ylarge")                            return "YL";
  if (s === "youthmedium"  || s === "ym"        || s === "ymedium")                           return "YM";
  if (s === "youthsmall"   || s === "ys"        || s === "ysmall")                            return "YS";
  // Return original if no match (already an abbreviation or unknown)
  return raw.trim();
}

// ── Wix TSV parser (tab-separated with header row) ────────────────────────
async function importWixTSV(tsv: string, source: string): Promise<number> {
  const rows = tsv.trim().split(/\r?\n/);
  if (rows.length < 2) return 0;

  // Normalise header names
  const headers = rows[0].split("\t").map(h =>
    h.trim().replace(/[^a-z0-9]/gi, " ").trim().toLowerCase()
  );

  const col  = (needle: string) => headers.findIndex(h => h.includes(needle));
  const get  = (row: string[], idx: number) => idx >= 0 ? (row[idx] || "").trim() : "";

  // Map Wix column names → indices
  const iOrderNum     = col("order num");
  const iOrderDate    = col("order date");
  const iGuestFirst   = col("guest first");
  const iGuestLast    = col("guest last");
  const iEmail        = col("email");
  const iTicketType   = col("ticket type");
  const iTicketNum    = col("ticket num");
  const iTicketPrice  = col("ticket price");
  const iBenefit      = col("benefit");
  const iCoupon       = col("coupon");
  const iTax          = col("tax");
  const iTotalTicket  = col("total ticket");
  const iWixFee       = col("wix service");
  const iRevenue      = col("ticket rev");
  const iPayment      = col("payment");
  const iCheckedIn    = col("checked");
  const iSeatInfo     = col("seat");
  const iCamperGrade  = col("camper grade") >= 0 ? col("camper grade") : col("grade");
  const iParentName   = col("parent name") >= 0 ? col("parent name") : col("parent na");
  const iPhone        = col("phone");
  // Emergency: first and last occurrence
  const iEmerg1 = headers.findIndex(h => h.includes("emergenc"));
  const iEmerg2 = headers.length - 1 - [...headers].reverse().findIndex(h => h.includes("emergenc"));
  const iSex          = col("sex");
  const iShirtSize    = col("tee shirt") >= 0 ? col("tee shirt") : col("shirt");

  let imported = 0;

  // Load existing contacts once — use ticket number to detect true duplicates
  const existingContacts = await getContacts();
  const existingTickets  = new Set(existingContacts.map(c => c.ticketNum).filter(Boolean));

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i].split("\t");

    const email = get(row, iEmail);
    if (!email || !email.includes("@")) continue;

    const ticketNum = get(row, iTicketNum);

    // Skip true duplicates: same ticket number already in the database
    if (ticketNum && existingTickets.has(ticketNum)) continue;

    const guestFirst = get(row, iGuestFirst);
    const guestLast  = get(row, iGuestLast);
    const camperName = [guestFirst, guestLast].filter(Boolean).join(" ");

    const parentName = get(row, iParentName);
    const name = parentName || camperName || "Unknown";

    // Fix scientific notation phone numbers (Excel exports 5.04E+09)
    const phoneRaw = get(row, iPhone);
    let phone = phoneRaw;
    if (/^\d+\.?\d*[Ee][+\-]\d+$/.test(phoneRaw)) {
      try { phone = Math.round(parseFloat(phoneRaw)).toString(); } catch { /* keep raw */ }
    }

    // Always create a new record per ticket row — each ticket = one camper registration.
    // Multiple tickets under the same parent email are separate registrations, NOT duplicates.
    await createContact({
      name,
      email,
      phone,
      source,
      camperName,
      grade:            get(row, iCamperGrade),
      gender:           get(row, iSex),
      shirtSize:        normalizeShirtSize(get(row, iShirtSize)),
      emergencyContact: get(row, iEmerg1),
      emergencyPhone:   iEmerg2 !== iEmerg1 ? get(row, iEmerg2) : "",
      orderNumber:      get(row, iOrderNum),
      orderDate:        get(row, iOrderDate),
      ticketType:       get(row, iTicketType),
      ticketNum:        get(row, iTicketNum),
      ticketPrice:      get(row, iTicketPrice),
      benefit:          get(row, iBenefit),
      coupon:           get(row, iCoupon),
      tax:              get(row, iTax),
      amountPaid:       get(row, iTotalTicket),
      wixServiceFee:    get(row, iWixFee),
      ticketRevenue:    get(row, iRevenue),
      paymentStatus:    get(row, iPayment),
      checkedIn:        get(row, iCheckedIn),
      seatInfo:         get(row, iSeatInfo),
      notes: [
        camperName ? `Camper: ${camperName}` : "",
        get(row, iCamperGrade) ? `Grade: ${get(row, iCamperGrade)}` : "",
        get(row, iShirtSize)   ? `Shirt: ${get(row, iShirtSize)}`   : "",
      ].filter(Boolean).join(" | "),
    });
    imported++;
  }
  return imported;
}

// ── Public CSV import — auto-detects Wix TSV or simple CSV ────────────────
export async function importContactsCSV(csv: string, source = "import"): Promise<number> {
  // Detect Wix tab-separated export
  const isWixTSV = csv.includes("\t") &&
    (csv.toLowerCase().includes("order num") ||
     csv.toLowerCase().includes("guest first") ||
     csv.toLowerCase().includes("ticket type"));

  if (isWixTSV) return importWixTSV(csv, source);

  // Simple CSV: name,email,phone
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
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
    await createContact({ name, email, phone, source });
    imported++;
  }
  return imported;
}
