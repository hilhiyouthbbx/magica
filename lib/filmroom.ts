import fs   from "fs";
import path from "path";

const LOG_FILE   = path.join(process.cwd(), "data", "filmroom-visitors.json");
const TALLY_FILE = path.join(process.cwd(), "data", "filmroom-tally.json");

const KV_LOG   = "hilhi_filmroom_visitors";
const KV_TALLY = "hilhi_filmroom_tally";

const getRedisUrl   = () => process.env.KV_REST_API_URL   || process.env.UPSTASH_REDIS_REST_URL   || "";
const getRedisToken = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const hasKV         = () => !!(getRedisUrl() && getRedisToken());

async function getRedis() {
  const { Redis } = await import("@upstash/redis");
  return new Redis({ url: getRedisUrl(), token: getRedisToken() });
}

// ── Types ──────────────────────────────────────────────────────────────────
export interface FilmRoomVisitor {
  id:        string;
  name:      string;
  email:     string;
  enteredAt: string;
}

export interface FilmRoomTally {
  key:       string;   // name_email normalized key
  name:      string;
  email:     string;
  count:     number;
  firstSeen: string;
  lastSeen:  string;
}

// ── Log helpers ────────────────────────────────────────────────────────────
async function readLog(): Promise<FilmRoomVisitor[]> {
  if (hasKV()) {
    try { const r = await getRedis(); return (await r.get<FilmRoomVisitor[]>(KV_LOG)) ?? []; } catch { return []; }
  }
  if (!fs.existsSync(LOG_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(LOG_FILE, "utf8")); } catch { return []; }
}

async function writeLog(list: FilmRoomVisitor[]): Promise<void> {
  if (hasKV()) { const r = await getRedis(); await r.set(KV_LOG, list); return; }
  const dir = path.dirname(LOG_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(LOG_FILE, JSON.stringify(list, null, 2));
}

// ── Tally helpers ──────────────────────────────────────────────────────────
async function readTally(): Promise<FilmRoomTally[]> {
  if (hasKV()) {
    try { const r = await getRedis(); return (await r.get<FilmRoomTally[]>(KV_TALLY)) ?? []; } catch { return []; }
  }
  if (!fs.existsSync(TALLY_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(TALLY_FILE, "utf8")); } catch { return []; }
}

async function writeTally(list: FilmRoomTally[]): Promise<void> {
  if (hasKV()) { const r = await getRedis(); await r.set(KV_TALLY, list); return; }
  const dir = path.dirname(TALLY_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(TALLY_FILE, JSON.stringify(list, null, 2));
}

// ── Public API ─────────────────────────────────────────────────────────────
export async function getVisitors(): Promise<FilmRoomVisitor[]> {
  return readLog();
}

export async function getTally(): Promise<FilmRoomTally[]> {
  return readTally();
}

export async function logVisitor(visitor: Omit<FilmRoomVisitor, "id">): Promise<{ entry: FilmRoomVisitor; tally: FilmRoomTally }> {
  const now = new Date().toISOString();

  // 1 — append to log
  const log = await readLog();
  const entry: FilmRoomVisitor = {
    id:        `fr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name:      visitor.name,
    email:     visitor.email,
    enteredAt: visitor.enteredAt || now,
  };
  log.unshift(entry);
  await writeLog(log.slice(0, 500));

  // 2 — update tally
  const tallies = await readTally();
  const key     = `${visitor.name.toLowerCase().trim()}|${visitor.email.toLowerCase().trim()}`;
  const idx     = tallies.findIndex(t => t.key === key);
  let tally: FilmRoomTally;
  if (idx >= 0) {
    tallies[idx].count   += 1;
    tallies[idx].lastSeen = now;
    tally = tallies[idx];
  } else {
    tally = { key, name: visitor.name, email: visitor.email, count: 1, firstSeen: now, lastSeen: now };
    tallies.unshift(tally);
  }
  // sort by most recent
  tallies.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
  await writeTally(tallies);

  return { entry, tally };
}

export async function clearVisitors(): Promise<void> {
  await writeLog([]);
  await writeTally([]);
}
