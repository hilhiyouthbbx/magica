// Server-side persistence for the Tournament Manager (bracket/pool-play/scheduler data).
// Mirrors the pattern used by lib/tournament.ts and lib/contacts.ts — this used to live ONLY in
// browser localStorage (lib/tourney-storage.ts), which meant a tournament could "disappear" simply
// by opening the site from a different browser, device, or origin (e.g. a preview URL), since
// localStorage never leaves the browser it was written in. This module gives tournaments a single
// server-side source of truth in Redis/KV (or a local JSON file in dev), just like everything else.
import fs from "fs";
import path from "path";
import type { Tournament } from "@/lib/tourney-types";

const FILE   = path.join(process.cwd(), "data", "tourney-manager.json");
const KV_KEY = "hilhi_tourney_manager_v1";

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

export async function getAllTournamentsServer(): Promise<Tournament[]> {
  if (hasKV()) {
    try {
      return (await kvGet<Tournament[]>(KV_KEY)) ?? [];
    } catch { return []; }
  }
  if (!fs.existsSync(FILE)) return [];
  try {
    const raw = fs.readFileSync(FILE, "utf-8").trim();
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function persist(list: Tournament[]): Promise<void> {
  if (hasKV()) {
    await kvSet(KV_KEY, list);
    return;
  }
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2));
}

export async function saveTournamentServer(t: Tournament): Promise<void> {
  const all = await getAllTournamentsServer();
  const idx = all.findIndex(x => x.id === t.id);
  if (idx >= 0) all[idx] = t; else all.push(t);
  await persist(all);
}

export async function deleteTournamentServer(id: string): Promise<void> {
  const all = (await getAllTournamentsServer()).filter(t => t.id !== id);
  await persist(all);
}
