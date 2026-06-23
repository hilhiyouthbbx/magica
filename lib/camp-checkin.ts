// ── Camp Daily Check-In ─────────────────────────────────────────────────────
// Stores which campers checked in on each day.
// Redis key: hilhi_camp_checkins  (Hash)
// Hash field: {contactId}__{day}   (e.g. "abc123__day1")
// Hash value: "1" (present) | "0" (absent)
//
// Using HSET / HGETALL avoids the read-modify-write race condition that
// occurred with the old JSON-blob approach.  Each toggle is a single atomic
// field write that cannot overwrite another camper's data.

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

// ── Redis helpers ──────────────────────────────────────────────────────────

/** Atomic write of a single hash field. No read needed — cannot race. */
async function kvHSet(hashKey: string, field: string, value: string): Promise<void> {
  if (!hasKV()) return;
  await fetch(`${getRedisUrl()}/hset/${hashKey}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getRedisToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([field, value]),
  });
}

/** Read all fields from a hash in one round-trip. */
async function kvHGetAll(hashKey: string): Promise<Record<string, string>> {
  if (!hasKV()) return {};
  const res = await fetch(`${getRedisUrl()}/hgetall/${hashKey}`, {
    headers: { Authorization: `Bearer ${getRedisToken()}` },
    cache: "no-store",
  });
  const json = await res.json() as { result?: (string | null)[] | null };
  const arr = json.result ?? [];
  const out: Record<string, string> = {};
  for (let i = 0; i + 1 < arr.length; i += 2) {
    const k = arr[i];
    const v = arr[i + 1];
    if (k != null && v != null) out[k] = v;
  }
  return out;
}

/** Delete the entire hash key. */
async function kvDel(key: string): Promise<void> {
  if (!hasKV()) return;
  await fetch(`${getRedisUrl()}/del/${key}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getRedisToken()}` },
  });
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function getCheckIns(): Promise<CheckInMap> {
  const raw = await kvHGetAll(KV_KEY);
  const map: CheckInMap = {};
  for (const [fieldKey, val] of Object.entries(raw)) {
    const sep = fieldKey.lastIndexOf("__");
    if (sep === -1) continue;
    const contactId = fieldKey.slice(0, sep);
    const day       = fieldKey.slice(sep + 2) as DayKey;
    if (!["day1","day2","day3","day4"].includes(day)) continue;
    if (!map[contactId]) {
      map[contactId] = { day1: false, day2: false, day3: false, day4: false };
    }
    map[contactId][day] = val === "1";
  }
  return map;
}

/**
 * Atomically set one day's check-in for one camper.
 * Uses HSET on a single hash field — no read needed, no race condition.
 */
export async function setCheckIn(
  contactId: string,
  day: DayKey,
  checked: boolean
): Promise<CheckInMap> {
  const field = `${contactId}__${day}`;
  await kvHSet(KV_KEY, field, checked ? "1" : "0");
  return getCheckIns();
}

export async function clearCheckIns(): Promise<void> {
  await kvDel(KV_KEY);
}
