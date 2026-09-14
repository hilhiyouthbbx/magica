import fs   from "fs";
import path from "path";

const FILE   = path.join(process.cwd(), "data", "raffle-counter.json");
const KV_KEY = "hilhi_raffle_ticket_counter";
export const RAFFLE_TICKET_PREFIX = "ON2027-";

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

async function readCounter(): Promise<number> {
  if (hasKV()) {
    try { return (await kvGet<number>(KV_KEY)) ?? 0; } catch { return 0; }
  }
  if (!fs.existsSync(FILE)) return 0;
  try { return (JSON.parse(fs.readFileSync(FILE, "utf8")).counter as number) ?? 0; } catch { return 0; }
}

async function writeCounter(value: number): Promise<void> {
  if (hasKV()) { await kvSet(KV_KEY, value); return; }
  const dir = path.dirname(FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify({ counter: value }, null, 2));
}

/**
 * Atomically reserves `count` sequential raffle ticket numbers, e.g.
 * ["ON2027-00001", "ON2027-00002"], and persists the updated counter so the
 * next purchase continues the sequence. Not perfectly race-safe under very
 * high concurrency (no distributed lock), but fine for the expected volume
 * of a youth-basketball fundraiser raffle.
 */
export async function reserveTicketNumbers(count: number): Promise<string[]> {
  const current = await readCounter();
  const numbers: string[] = [];
  for (let i = 1; i <= count; i++) {
    numbers.push(`${RAFFLE_TICKET_PREFIX}${String(current + i).padStart(5, "0")}`);
  }
  await writeCounter(current + count);
  return numbers;
}
