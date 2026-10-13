import fs   from "fs";
import path from "path";

const FILE   = path.join(process.cwd(), "data", "raffle-settings.json");
const KV_KEY = "hilhi_raffle_settings";

const getRedisUrl   = () => process.env.KV_REST_API_URL   || process.env.UPSTASH_REDIS_REST_URL   || "";
const getRedisToken = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const hasKV         = () => !!(getRedisUrl() && getRedisToken());

async function getRedis() {
  const { Redis } = await import("@upstash/redis");
  return new Redis({ url: getRedisUrl(), token: getRedisToken() });
}

export interface RaffleSettings { open: boolean; }

/** Raffle is OPEN by default until the admin turns it off. */
export async function getRaffleSettings(): Promise<RaffleSettings> {
  try {
    if (hasKV()) {
      const redis = await getRedis();
      const v = await redis.get<RaffleSettings>(KV_KEY);
      return { open: v?.open !== false };
    }
    if (!fs.existsSync(FILE)) return { open: true };
    const v = JSON.parse(fs.readFileSync(FILE, "utf8")) as RaffleSettings;
    return { open: v?.open !== false };
  } catch { return { open: true }; }
}

export async function setRaffleOpen(open: boolean): Promise<void> {
  if (hasKV()) {
    const redis = await getRedis();
    await redis.set(KV_KEY, { open });
    return;
  }
  const dir = path.dirname(FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify({ open }, null, 2));
}
