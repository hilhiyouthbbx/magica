import fs from "fs";
import path from "path";

export type { TournamentConfig } from "./tournament-client";
export { TOURNAMENT_DEFAULTS }  from "./tournament-client";
import { TournamentConfig, TOURNAMENT_DEFAULTS } from "./tournament-client";

const FILE   = path.join(process.cwd(), "data", "tournament.json");
const KV_KEY = "hilhi_tournaments";

const hasKV = () =>
  !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

async function kvGet<T>(key: string): Promise<T | null> {
  const { kv } = await import("@vercel/kv");
  return kv.get<T>(key);
}
async function kvSet(key: string, value: unknown): Promise<void> {
  const { kv } = await import("@vercel/kv");
  await kv.set(key, value);
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
}

// ── Read all tournaments ────────────────────────────────────────────────────
export async function getTournaments(): Promise<TournamentConfig[]> {
  if (hasKV()) {
    try {
      return (await kvGet<TournamentConfig[]>(KV_KEY)) ?? [];
    } catch { return []; }
  }
  if (!fs.existsSync(FILE)) return [];
  try {
    const raw  = fs.readFileSync(FILE, "utf-8").trim();
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [{ ...TOURNAMENT_DEFAULTS, ...data, id: data.id ?? makeId() }];
    return data;
  } catch { return []; }
}

export async function getTournament(id: string): Promise<TournamentConfig | undefined> {
  return (await getTournaments()).find(t => t.id === id);
}

export async function getEnabledTournaments(): Promise<TournamentConfig[]> {
  return (await getTournaments()).filter(t => t.enabled);
}

// ── Persist ─────────────────────────────────────────────────────────────────
export async function saveTournaments(list: TournamentConfig[]): Promise<void> {
  if (hasKV()) {
    await kvSet(KV_KEY, list);
    return;
  }
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2));
}

export async function upsertTournament(t: Partial<TournamentConfig> & { id?: string }): Promise<TournamentConfig> {
  const list    = await getTournaments();
  const id      = t.id ?? makeId();
  const idx     = list.findIndex(x => x.id === id);
  const merged: TournamentConfig = { ...TOURNAMENT_DEFAULTS, ...t, id };
  if (idx !== -1) list[idx] = merged; else list.push(merged);
  await saveTournaments(list);
  return merged;
}

export async function deleteTournament(id: string): Promise<void> {
  await saveTournaments((await getTournaments()).filter(t => t.id !== id));
}
