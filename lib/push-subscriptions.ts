// Server-side storage for web push subscriptions — same Redis/KV-or-local-JSON pattern used
// throughout this codebase (see lib/contacts.ts, lib/tournament.ts).
import fs from "fs";
import path from "path";

const FILE   = path.join(process.cwd(), "data", "push-subscriptions.json");
const KV_KEY = "hilhi_push_subscriptions";

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

export interface PushSubscriptionRecord {
  id: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  /** What this subscriber wants alerts for. Matched loosely (case-insensitive, trimmed) against
   *  the tournament/team names supplied when sending. */
  tournamentName?: string;
  teamName?: string;
  contactEmail?: string;
  createdAt: string;
}

export async function getAllPushSubscriptions(): Promise<PushSubscriptionRecord[]> {
  if (hasKV()) {
    try { return (await kvGet<PushSubscriptionRecord[]>(KV_KEY)) ?? []; } catch { return []; }
  }
  if (!fs.existsSync(FILE)) return [];
  try {
    const raw = fs.readFileSync(FILE, "utf-8").trim();
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function persist(list: PushSubscriptionRecord[]): Promise<void> {
  if (hasKV()) { await kvSet(KV_KEY, list); return; }
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2));
}

export async function saveSubscription(sub: Omit<PushSubscriptionRecord, "id" | "createdAt">): Promise<void> {
  const all = await getAllPushSubscriptions();
  // De-dupe by endpoint — a browser's push endpoint is unique per subscription; re-subscribing
  // (e.g. re-checking the alerts box) should update the existing record, not create a duplicate.
  const idx = all.findIndex(s => s.endpoint === sub.endpoint);
  const record: PushSubscriptionRecord = {
    id: idx >= 0 ? all[idx].id : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: idx >= 0 ? all[idx].createdAt : new Date().toISOString(),
    ...sub,
  };
  if (idx >= 0) all[idx] = record; else all.push(record);
  await persist(all);
}

export async function removeSubscriptionsByEndpoint(endpoints: string[]): Promise<void> {
  if (endpoints.length === 0) return;
  const all = await getAllPushSubscriptions();
  const set = new Set(endpoints);
  await persist(all.filter(s => !set.has(s.endpoint)));
}

/** Finds subscribers matching a tournament (and optionally a specific team within it). */
export async function findSubscriptions(tournamentName: string, teamName?: string): Promise<PushSubscriptionRecord[]> {
  const all = await getAllPushSubscriptions();
  const tn = tournamentName.trim().toLowerCase();
  const teamN = teamName?.trim().toLowerCase();
  return all.filter(s => {
    if ((s.tournamentName || "").trim().toLowerCase() !== tn) return false;
    if (teamN && (s.teamName || "").trim().toLowerCase() !== teamN) return false;
    return true;
  });
}
