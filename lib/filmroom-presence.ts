import fs   from "fs";
import path from "path";

const FILE   = path.join(process.cwd(), "data", "filmroom-presence.json");
const KV_KEY = "hilhi_filmroom_presence";

const getRedisUrl   = () => process.env.KV_REST_API_URL   || process.env.UPSTASH_REDIS_REST_URL   || "";
const getRedisToken = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const hasKV         = () => !!(getRedisUrl() && getRedisToken());

async function getRedis() {
  const { Redis } = await import("@upstash/redis");
  return new Redis({ url: getRedisUrl(), token: getRedisToken() });
}

export interface ActiveViewer {
  name:     string;
  lastSeen: string; // ISO
  watching?: string; // video title or stream name
}

const TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

async function read(): Promise<ActiveViewer[]> {
  if (hasKV()) {
    try { const r = await getRedis(); return (await r.get<ActiveViewer[]>(KV_KEY)) ?? []; } catch { return []; }
  }
  if (!fs.existsSync(FILE)) return [];
  try { return JSON.parse(fs.readFileSync(FILE, "utf8")); } catch { return []; }
}

async function write(list: ActiveViewer[]): Promise<void> {
  if (hasKV()) { const r = await getRedis(); await r.set(KV_KEY, list); return; }
  const dir = path.dirname(FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2));
}

function pruneStale(viewers: ActiveViewer[]): ActiveViewer[] {
  const cutoff = Date.now() - TIMEOUT_MS;
  return viewers.filter(v => new Date(v.lastSeen).getTime() > cutoff);
}

export async function heartbeat(name: string, watching?: string): Promise<ActiveViewer[]> {
  const all  = pruneStale(await read());
  const idx  = all.findIndex(v => v.name.toLowerCase() === name.toLowerCase());
  const now  = new Date().toISOString();
  if (idx >= 0) {
    all[idx].lastSeen = now;
    if (watching !== undefined) all[idx].watching = watching || undefined;
  } else {
    all.push({ name, lastSeen: now, ...(watching ? { watching } : {}) });
  }
  await write(all);
  return all;
}

export async function leave(name: string): Promise<void> {
  const all = (await read()).filter(v => v.name.toLowerCase() !== name.toLowerCase());
  await write(all);
}

export async function getActiveViewers(): Promise<ActiveViewer[]> {
  const all = pruneStale(await read());
  await write(all); // persist pruned list
  return all;
}
