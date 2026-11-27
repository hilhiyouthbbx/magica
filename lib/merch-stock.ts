// Blank-garment inventory for the merch store: how many of each garment color/size are left.
// Tracked by garment (not by design) because any design can be printed on any garment.
// Stored like the rest of the site data (Redis when configured, otherwise a local file). Admin only.

import fs from "fs";
import path from "path";

const FILE   = path.join(process.cwd(), "data", "merch-stock.json");
const KV_KEY = "hilhi_merch_stock";

const getRedisUrl   = () => process.env.KV_REST_API_URL   || process.env.UPSTASH_REDIS_REST_URL   || "";
const getRedisToken = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const hasKV         = () => !!(getRedisUrl() && getRedisToken());

export const STOCK_SIZES = ["YS", "YM", "YL", "AXS", "AS", "AM", "AL", "AXL", "A2XL", "A3XL"] as const;

export interface StockRow {
  id:     string;
  label:  string;                    // e.g. "White Hoodies"
  counts: Record<string, number>;    // size -> how many left
}

export interface MerchStock {
  rows:      StockRow[];
  updatedAt: string;
}

export const DEFAULT_STOCK: MerchStock = {
  updatedAt: "",
  rows: [
    { id: "white",    label: "White Hoodies",     counts: { AXS: 7, AM: 5, AL: 24 } },
    { id: "blue",     label: "Blue Hoodies",      counts: { AS: 4, AM: 2, AL: 1 } },
    { id: "darkgrey", label: "Dark Grey Hoodies", counts: { AM: 2 } },
    { id: "red",      label: "Red Hoodies",       counts: { AS: 12, AM: 8, AL: 6, A2XL: 7, A3XL: 8 } },
  ],
};

export async function getMerchStock(): Promise<MerchStock> {
  let saved: MerchStock | null = null;
  try {
    if (hasKV()) {
      const { Redis } = await import("@upstash/redis");
      saved = await new Redis({ url: getRedisUrl(), token: getRedisToken() }).get<MerchStock>(KV_KEY);
    } else if (fs.existsSync(FILE)) {
      saved = JSON.parse(fs.readFileSync(FILE, "utf-8") || "null");
    }
  } catch { saved = null; }
  return saved && Array.isArray(saved.rows) ? saved : DEFAULT_STOCK;
}

export async function saveMerchStock(s: MerchStock): Promise<void> {
  if (hasKV()) {
    const { Redis } = await import("@upstash/redis");
    await new Redis({ url: getRedisUrl(), token: getRedisToken() }).set(KV_KEY, s);
    return;
  }
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(s, null, 2));
}

export interface StockLine { color: string; size: string; qty: number }

function aggregate(lines: StockLine[]): StockLine[] {
  const m = new Map<string, StockLine>();
  lines.forEach(l => {
    if (!l.color || !l.size || l.qty <= 0) return;
    const k = `${l.color}|${l.size}`;
    const e = m.get(k) || { color: l.color, size: l.size, qty: 0 };
    e.qty += l.qty;
    m.set(k, e);
  });
  return [...m.values()];
}

/** Returns a plain-words description of the first line the stock can't cover, or null if everything is in stock. */
export function shortfall(stock: MerchStock, lines: StockLine[]): string | null {
  for (const l of aggregate(lines)) {
    const row = stock.rows.find(r => r.id === l.color);
    if (!row) continue;
    if ((row.counts[l.size] || 0) < l.qty) return `${row.label.replace(/\s*hoodies?\s*$/i, "").trim() || row.label} hoodie in size ${l.size}`;
  }
  return null;
}

/** Lowers the counts for a paid order (never below zero). */
export async function takeStock(lines: StockLine[]): Promise<void> {
  const s = await getMerchStock();
  const rows = s.rows.map(r => ({ ...r, counts: { ...r.counts } }));
  aggregate(lines).forEach(l => {
    const row = rows.find(r => r.id === l.color);
    if (!row) return;
    const left = Math.max(0, (row.counts[l.size] || 0) - l.qty);
    if (left > 0) row.counts[l.size] = left; else delete row.counts[l.size];
  });
  await saveMerchStock({ rows, updatedAt: new Date().toISOString() });
}

/** Keeps only sane values: known sizes, whole numbers 0-9999, short labels. */
export function cleanStock(input: unknown): MerchStock | null {
  const rows = (input as { rows?: unknown })?.rows;
  if (!Array.isArray(rows) || rows.length > 60) return null;
  const out: StockRow[] = rows.map((r: { id?: unknown; label?: unknown; counts?: unknown }, i: number) => {
    const counts: Record<string, number> = {};
    STOCK_SIZES.forEach(sz => {
      const n = Math.floor(Number((r.counts as Record<string, unknown> | undefined)?.[sz]));
      if (Number.isFinite(n) && n > 0) counts[sz] = Math.min(n, 9999);
    });
    return { id: String(r.id || `row${i}`).slice(0, 40), label: String(r.label ?? "").replace(/[<>]/g, "").trim().slice(0, 60), counts };
  });
  return { rows: out, updatedAt: new Date().toISOString() };
}
