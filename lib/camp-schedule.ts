import fs   from "fs";
import path from "path";

const FILE   = path.join(process.cwd(), "data", "camp-schedule.json");
const KV_KEY = "hilhi_camp_schedule";

const getRedisUrl   = () => process.env.KV_REST_API_URL   || process.env.UPSTASH_REDIS_REST_URL   || "";
const getRedisToken = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const hasKV         = () => !!(getRedisUrl() && getRedisToken());

async function getRedis() {
  const { Redis } = await import("@upstash/redis");
  return new Redis({ url: getRedisUrl(), token: getRedisToken() });
}

export type Division = "NBA" | "College";
export type GameStatus = "scheduled" | "live" | "final";
export type BracketRound = "semi" | "final" | "3rd";

export interface CampTeam {
  id:        string;
  name:      string;
  division:  Division;
  coach:     string;
  players:   string[];
  wins:      number;
  losses:    number;
  pointsFor: number;
  pointsAgainst: number;
}

export interface SeedingGame {
  id:       string;
  round:    1 | 2 | 3;
  division: Division;
  team1Id:  string;
  team2Id:  string;
  score1:   number | null;
  score2:   number | null;
  court:    string;
  status:   GameStatus;
}

export interface BracketGame {
  id:       string;
  round:    BracketRound;
  division: Division;
  team1Id:  string;
  team2Id:  string;
  score1:   number | null;
  score2:   number | null;
  court:    string;
  status:   GameStatus;
}

export interface EventNominee {
  teamId:  string;
  players: string[];
}

export interface IndividualEvent {
  id:        string;
  name:      string;   // "Free Throw Contest", "3-Point Contest", etc.
  division:  Division;
  nominees:  EventNominee[];
  winner?:   string;
  runnerUp?: string;
  status:    "upcoming" | "live" | "complete";
}

export interface CampScheduleData {
  campName:      string;
  campYear:      number;
  currentDay:    number;  // 1-4 (0 = not started)
  active:        boolean; // false = hidden from public
  announcement:  string;
  teams:         CampTeam[];
  seedingGames:  SeedingGame[];
  bracketGames:    BracketGame[];
  individualEvents: IndividualEvent[];
  updatedAt:        string;
}

const DEFAULTS: CampScheduleData = {
  campName:     "Hilhi Summer Youth Hoop Camp",
  campYear:     2025,
  currentDay:   0,
  active:       false,
  announcement: "",
  teams: [],
  seedingGames: [],
  bracketGames:     [],
  individualEvents: [],
  updatedAt:        new Date().toISOString(),
};

async function read(): Promise<CampScheduleData> {
  if (hasKV()) {
    try { const r = await getRedis(); return (await r.get<CampScheduleData>(KV_KEY)) ?? DEFAULTS; } catch { /* fall through */ }
  }
  if (!fs.existsSync(FILE)) return DEFAULTS;
  try { return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(FILE, "utf8")) }; } catch { return DEFAULTS; }
}

async function write(data: CampScheduleData): Promise<void> {
  data.updatedAt = new Date().toISOString();
  if (hasKV()) { const r = await getRedis(); await r.set(KV_KEY, data); return; }
  const dir = path.dirname(FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

export async function getCampSchedule(): Promise<CampScheduleData> {
  return read();
}

export async function saveCampSchedule(data: CampScheduleData): Promise<CampScheduleData> {
  await write(data);
  return data;
}

// ── Camper roster entry (shared with admin roster UI) ───────────────────────
export interface CamperRosterEntry {
  id:          string;
  fullName:    string;
  displayName: string; // "First L."
  grade:       string;
  gradeNum:    number; // 1-8 for sort, 99 = unknown
}
