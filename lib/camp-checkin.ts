// ── Camp Daily Check-In ────────────────────────────────────────────────────
// Stores which campers checked in on each day.
// Key: hilhi_camp_checkins
// Shape: Record<contactId, { day1: bool, day2: bool, day3: bool, day4: bool }>

const getRedisUrl   = () => process.env.KV_REST_API_URL   || process.env.UPSTASH_REDIS_REST_URL   || "";
const getRedisToken = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const hasKV = () => !!(getRedisUrl() && getRedisToken());

const KV_KEY = "hilhi_camp_checkins";

export type DayKey = "day1" | "day2" | "day3" | "day4";
export const DAY_LABELS: Record<DayKey, string> = {
  day1: "Day 1",
  day2: "Day 2",
  day3: "Day 3",
  day4: "Day 4",
};

export interface CamperCheckIn {
  day1: boolean;
  day2: boolean;
  day3: boolean;
  day4: boolean;
}

export type CheckInMap = Record<string, CamperCheckIn>; // contactId → days

async function kvGet<T>(key: string): Promise<T | null> {
  if (!hasKV()) return null;
  const res = await fetch(`${getRedisUrl()}/get/${key}`, {
    headers: { Authorization: `Bearer ${getRedisToken()}` },
    cache: "no-store",
  });
  const json = await res.json() as { result?: string | null };
  return json.result ? (JSON.parse(json.result) as T) : null;
}

async function kvSet(key: string, value: unknown): Promise<void> {
  if (!hasKV()) return;
  await fetch(`${getRedisUrl()}/set/${key}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getRedisToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ value: JSON.stringify(value) }),
  });
}

export async function getCheckIns(): Promise<CheckInMap> {
  return (await kvGet<CheckInMap>(KV_KEY)) ?? {};
}

export async function setCheckIn(contactId: string, day: DayKey, checked: boolean): Promise<CheckInMap> {
  const map = await getCheckIns();
  map[contactId] = {
    ...(map[contactId] ?? { day1: false, day2: false, day3: false, day4: false }),
    [day]: checked,
  };
  await kvSet(KV_KEY, map);
  return map;
}

export async function clearCheckIns(): Promise<void> {
  await kvSet(KV_KEY, {});
}
