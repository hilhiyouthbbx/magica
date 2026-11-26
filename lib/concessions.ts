// Concession volunteer sign-up: schedule, parent password and the names people sign up with.
// Stored in the same place as the rest of the site data (Redis when configured, otherwise a local file).
// The password and the schedule are only ever sent to a browser after the server has checked the password.

import fs from "fs";
import path from "path";
import { timingSafeEqual } from "crypto";

const FILE   = path.join(process.cwd(), "data", "concessions.json");
const KV_KEY = "hilhi_concessions";

const getRedisUrl   = () => process.env.KV_REST_API_URL   || process.env.UPSTASH_REDIS_REST_URL   || "";
const getRedisToken = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const hasKV         = () => !!(getRedisUrl() && getRedisToken());

async function getRedis() {
  const { Redis } = await import("@upstash/redis");
  return new Redis({ url: getRedisUrl(), token: getRedisToken() });
}

export interface ConcessionGame {
  date:  string;                    // YYYY-MM-DD
  opp:   string;
  games: Record<string, string>;    // team code -> "HH:MM" or "TBD"
}

export interface ConcessionData {
  enabled:  boolean;
  password: string;                 // empty = page is closed until the admin sets one
  title:    string;
  intro:    string;
  games:    ConcessionGame[];
  bookings: Record<string, string[]>; // "YYYY-MM-DD-<minutes|null>" -> 4 names
}

export const TEAM_NAMES: Record<string, string> = {
  bf: "Boys JV2", bj: "Boys JV", bv: "Boys Varsity", gj: "Girls JV", gv: "Girls Varsity",
};

export const SLOTS = 4;

export const DEFAULT_GAMES: ConcessionGame[] = [
  { date: "2026-12-11", opp: "Franklin",                      games: { bf: "17:30", bj: "17:30", bv: "19:15" } },
  { date: "2026-12-12", opp: "Girls Ashland / Boys Westview", games: { gj: "11:00", gv: "13:00", bf: "16:00", bj: "16:00", bv: "18:00" } },
  { date: "2027-01-05", opp: "North Salem",                   games: { bf: "17:30", bj: "17:45", bv: "19:15" } },
  { date: "2027-01-12", opp: "Wilsonville",                   games: { bf: "17:30", bj: "17:45", bv: "19:15" } },
  { date: "2027-01-19", opp: "Aloha",                         games: { bf: "17:30", bj: "17:45", bv: "19:15" } },
  { date: "2027-01-22", opp: "Liberty",                       games: { bf: "16:15", gj: "16:15", bj: "17:45", gv: "17:45", bv: "19:15" } },
  { date: "2027-02-09", opp: "La Salle Prep",                 games: { bj: "17:45", bv: "19:15" } },
  { date: "2027-02-23", opp: "Woodburn",                      games: { bf: "16:15", bj: "16:15", bv: "17:45", gj: "17:45", gv: "19:15" } },
  { date: "2027-02-26", opp: "Canby",                         games: { bf: "16:15", gj: "16:15", gv: "17:45", bv: "19:15", bj: "TBD" } },
];

export const DEFAULTS: ConcessionData = {
  enabled:  true,
  password: "",
  title:    "Concession Volunteer Sign-Up",
  intro:    "All volunteers must arrive 20 minutes before their scheduled game time.",
  games:    DEFAULT_GAMES,
  bookings: {},
};

export async function getConcessions(): Promise<ConcessionData> {
  let saved: Partial<ConcessionData> | null = null;
  try {
    if (hasKV()) saved = await (await getRedis()).get<Partial<ConcessionData>>(KV_KEY);
    else if (fs.existsSync(FILE)) saved = JSON.parse(fs.readFileSync(FILE, "utf-8") || "null");
  } catch { saved = null; }
  return {
    ...DEFAULTS,
    ...(saved ?? {}),
    games:    saved?.games && saved.games.length ? saved.games : DEFAULTS.games,
    bookings: saved?.bookings ?? {},
  };
}

export async function saveConcessions(d: ConcessionData): Promise<void> {
  if (hasKV()) { await (await getRedis()).set(KV_KEY, d); return; }
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(d, null, 2));
}

/** Constant-time password check. An empty saved password never matches. */
export function passwordOk(saved: string, given: string): boolean {
  const a = Buffer.from((saved || "").trim().toLowerCase());
  const b = Buffer.from((given || "").trim().toLowerCase());
  if (a.length === 0 || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** What a parent may see: never the password. */
export function publicView(d: ConcessionData) {
  return { title: d.title, intro: d.intro, games: d.games, bookings: d.bookings, slots: SLOTS, teams: TEAM_NAMES };
}

export const cleanName = (s: unknown) => String(s ?? "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 60);
