import fs   from "fs";
import path from "path";

const FILE    = path.join(process.cwd(), "data", "vouchers.json");
const KV_KEY  = "hilhi_vouchers";

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

// ── Data model ─────────────────────────────────────────────────────────────
export type VoucherEvent = "camp" | "tournament" | "tryout";

export interface Voucher {
  id:             string;
  code:           string;           // uppercase, e.g. "HILHI20"
  description:    string;           // admin label
  type:           "percent" | "fixed"; // % off or $ off
  amount:         number;           // 20 = 20% or $20
  events:         VoucherEvent[];   // which event types this applies to
  maxUses:        number | null;    // null = unlimited
  usedCount:      number;
  expiresAt:      string | null;    // ISO date string or null
  minOrderAmount: number;           // 0 = no minimum
  enabled:        boolean;
  createdAt:      string;
}

function makeId() { return `v-${Date.now()}-${Math.random().toString(36).slice(2,5)}`; }

// ── Read ───────────────────────────────────────────────────────────────────
export async function getVouchers(): Promise<Voucher[]> {
  if (hasKV()) {
    try { return (await kvGet<Voucher[]>(KV_KEY)) ?? []; } catch { return []; }
  }
  if (!fs.existsSync(FILE)) return [];
  try { return JSON.parse(fs.readFileSync(FILE, "utf8")) as Voucher[]; } catch { return []; }
}

// ── Write ──────────────────────────────────────────────────────────────────
export async function saveVouchers(list: Voucher[]): Promise<void> {
  if (hasKV()) {
    await kvSet(KV_KEY, list); return;
  }
  const dir = path.dirname(FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2));
}

// ── CRUD helpers ───────────────────────────────────────────────────────────
export async function upsertVoucher(v: Partial<Voucher> & { code: string }): Promise<Voucher> {
  const all = await getVouchers();
  const now = new Date().toISOString();
  if (v.id) {
    const idx = all.findIndex(x => x.id === v.id);
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...v };
      await saveVouchers(all);
      return all[idx];
    }
  }
  const created: Voucher = {
    id:             makeId(),
    code:           v.code.toUpperCase().trim(),
    description:    v.description    ?? "",
    type:           v.type           ?? "percent",
    amount:         v.amount         ?? 10,
    events:         v.events         ?? ["camp", "tournament", "tryout"],
    maxUses:        v.maxUses        ?? null,
    usedCount:      0,
    expiresAt:      v.expiresAt      ?? null,
    minOrderAmount: v.minOrderAmount ?? 0,
    enabled:        v.enabled        ?? true,
    createdAt:      now,
  };
  await saveVouchers([...all, created]);
  return created;
}

export async function deleteVoucher(id: string): Promise<void> {
  const all = await getVouchers();
  await saveVouchers(all.filter(v => v.id !== id));
}

// ── Validate a code at checkout ────────────────────────────────────────────
export interface VoucherCheckResult {
  valid:           boolean;
  voucher?:        Voucher;
  discountAmount?: number;   // actual $ saved
  finalTotal?:     number;
  error?:          string;
}

export function calcDiscount(voucher: Voucher, subtotal: number): number {
  if (voucher.type === "percent") {
    return Math.round((subtotal * voucher.amount / 100) * 100) / 100;
  }
  return Math.min(voucher.amount, subtotal); // fixed — can't discount more than total
}

export async function validateVoucher(
  code: string,
  event: VoucherEvent,
  subtotal: number,
): Promise<VoucherCheckResult> {
  const all = await getVouchers();
  const v   = all.find(x => x.code === code.toUpperCase().trim());

  if (!v)         return { valid: false, error: "Invalid promo code." };
  if (!v.enabled) return { valid: false, error: "This promo code is no longer active." };

  if (v.expiresAt && new Date(v.expiresAt) < new Date())
    return { valid: false, error: "This promo code has expired." };

  if (v.maxUses !== null && v.usedCount >= v.maxUses)
    return { valid: false, error: "This promo code has reached its usage limit." };

  if (!v.events.includes(event))
    return { valid: false, error: `This promo code is not valid for ${event} registrations.` };

  if (v.minOrderAmount > 0 && subtotal < v.minOrderAmount)
    return { valid: false, error: `This promo code requires a minimum order of $${v.minOrderAmount.toFixed(2)}.` };

  const discountAmount = calcDiscount(v, subtotal);
  const finalTotal     = Math.max(0, subtotal - discountAmount);

  return { valid: true, voucher: v, discountAmount, finalTotal };
}

// ── Increment use count after successful payment ───────────────────────────
export async function redeemVoucher(code: string): Promise<void> {
  const all = await getVouchers();
  const idx = all.findIndex(x => x.code === code.toUpperCase().trim());
  if (idx >= 0) {
    all[idx].usedCount += 1;
    await saveVouchers(all);
  }
}
