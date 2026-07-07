import type { Pool, PoolGame, VenueConfig } from "@/lib/tourney-types";

export function addMinutes(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${Math.floor(total / 60) % 24}:${(total % 60).toString().padStart(2, "0")}`;
}

export function formatTime12(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

/** Map a 1-based court number to its venue name given per-venue court counts */
export function courtToVenueName(courtNum: number, venues: VenueConfig[]): string {
  let cumulative = 0;
  for (const v of venues) {
    cumulative += v.courts;
    if (courtNum <= cumulative) return v.name;
  }
  return venues[0]?.name ?? "Main Gym";
}

/** Enumerate every calendar date (YYYY-MM-DD) between start and end, inclusive. */
export function buildTournamentDates(startDate?: string, endDate?: string): string[] {
  if (!startDate) return [];
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const start = new Date(sy, sm - 1, sd);
  const end = endDate ? (() => { const [ey, em, ed] = endDate.split("-").map(Number); return new Date(ey, em - 1, ed); })() : start;
  const dates: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    dates.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

/** Build the list of time-of-day slots for a single day, bounded by a start/end window. */
export function buildDayTimeSlots(start: string, end: string, gameDuration: number, breakBetween: number): string[] {
  const slots: string[] = [];
  let cur = start;
  let guard = 0;
  while (minutesOf(cur) + gameDuration <= minutesOf(end) && guard < 200) {
    slots.push(cur);
    cur = addMinutes(cur, gameDuration + breakBetween);
    guard++;
  }
  return slots;
}
function minutesOf(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Circle/polygon round-robin pairing algorithm */
export function roundRobinPairs(ids: string[]): [string, string][][] {
  const n = ids.length;
  if (n < 2) return [];
  const arr = n % 2 === 0 ? [...ids] : [...ids, "__BYE__"];
  const half = arr.length / 2;
  const rounds: [string, string][][] = [];
  for (let r = 0; r < arr.length - 1; r++) {
    const round: [string, string][] = [];
    for (let i = 0; i < half; i++) {
      const t1 = arr[i], t2 = arr[arr.length - 1 - i];
      if (t1 !== "__BYE__" && t2 !== "__BYE__") round.push([t1, t2]);
    }
    if (round.length) rounds.push(round);
    const last = arr.pop()!;
    arr.splice(1, 0, last);
  }
  return rounds;
}

/** Build round-robin pool games with NO date/time/court assigned yet — ready to drag onto the Scheduler grid. */
/**
 * Build pool games so that most teams get exactly `guarantee` games — NOT a full round-robin
 * (everyone-plays-everyone). With an odd number of teams a perfectly even split isn't possible,
 * so at most a small number of teams (usually just one) end up with one extra game instead of
 * every team playing everyone in the pool.
 */
function buildGuaranteedGamesForPool(pool: Pool, divisionId: string, guarantee: number): PoolGame[] {
  const rounds = roundRobinPairs(pool.teamIds); // ordered rounds — each team plays at most once per round
  const flatPairs = rounds.flat();
  const count = new Map<string, number>(pool.teamIds.map(id => [id, 0]));
  const chosen: [string, string][] = [];

  for (const [a, b] of flatPairs) {
    if ([...count.values()].every(c => c >= guarantee)) break;
    const ca = count.get(a) ?? 0, cb = count.get(b) ?? 0;
    if (ca < guarantee || cb < guarantee) {
      chosen.push([a, b]);
      count.set(a, ca + 1);
      count.set(b, cb + 1);
    }
  }

  return chosen.map(([a, b], i) => ({
    id: `${pool.id}-${a.slice(-6)}-${b.slice(-6)}-${i}`,
    poolId: pool.id,
    divisionId,
    court: 0,
    venue: "",
    timeSlot: -1,
    time: "",
    date: "",
    team1Id: a,
    team2Id: b,
    status: "scheduled" as const,
  }));
}

/** Build pool games across every pool in a division, respecting the games-guaranteed count. */
export function buildUnscheduledPoolGames(pools: Pool[], divisionId: string, guarantee: number = 3): PoolGame[] {
  return pools.flatMap(pool => buildGuaranteedGamesForPool(pool, divisionId, guarantee));
}

/**
 * Auto-place a list of games onto day/time/court slots, avoiding team AND coach conflicts
 * (a team's own games, and any other team sharing the same coach, never land in the same slot —
 * even across different courts) and respecting each team's noPlayBefore/noPlayAfter requests.
 * Games that can't find an open slot are left unscheduled.
 */
export function autoScheduleGames(
  games: PoolGame[],
  teams: { id: string; coachName: string; noPlayBefore?: string; noPlayAfter?: string }[],
  venues: VenueConfig[],
  gameDuration: number,
  breakBetween: number,
  startTime: string,
  startDate?: string,
  endDate?: string,
  dayWindows?: Record<string, { start: string; end: string }>,
  /** Games already scheduled elsewhere in the tournament (e.g. other divisions) whose court/time
   *  slots must be treated as occupied so this division's new games don't get double-booked onto
   *  the same court at the same time. */
  otherScheduledGames: { date?: string; time: string; court: number }[] = [],
): PoolGame[] {
  const safeVenues = venues.length > 0 ? venues : [{ name: "Main Gym", courts: 2 }];
  const totalCourts = safeVenues.reduce((s, v) => s + (v.courts || 1), 0);

  const days = buildTournamentDates(startDate, endDate);
  const dayKeys = days.length > 0 ? days : [""];
  const slotCombos: { day: string; time: string }[] = [];
  dayKeys.forEach(day => {
    const win = dayWindows?.[day];
    const slots = win
      ? buildDayTimeSlots(win.start, win.end, gameDuration, breakBetween)
      : buildDayTimeSlots(startTime || "08:00", "20:00", gameDuration, breakBetween);
    slots.forEach(time => slotCombos.push({ day, time }));
  });

  const teamById = new Map(teams.map(t => [t.id, t]));
  const busyByDayTime = new Map<string, Set<string>>(); // "day|time" -> set of teamIds/coach:name busy
  const courtsByDayTime = new Map<string, Set<number>>(); // "day|time" -> set of courts used

  // Seed court usage with games already scheduled elsewhere in the tournament so this division's
  // auto-placement doesn't double-book a court another division is already using at that time.
  otherScheduledGames.forEach(og => {
    if (!og.time || !og.court) return;
    const key = `${og.date || ""}|${og.time}`;
    const used = courtsByDayTime.get(key) ?? new Set<number>();
    used.add(og.court);
    courtsByDayTime.set(key, used);
  });

  return games.map(g => {
    if (g.time) return g; // already scheduled — leave as-is
    const t1 = teamById.get(g.team1Id), t2 = teamById.get(g.team2Id);
    const coach1 = t1?.coachName?.trim().toLowerCase();
    const coach2 = t2?.coachName?.trim().toLowerCase();

    for (const combo of slotCombos) {
      if (t1?.noPlayBefore && combo.time < t1.noPlayBefore) continue;
      if (t1?.noPlayAfter  && combo.time > t1.noPlayAfter)  continue;
      if (t2?.noPlayBefore && combo.time < t2.noPlayBefore) continue;
      if (t2?.noPlayAfter  && combo.time > t2.noPlayAfter)  continue;

      const key = `${combo.day}|${combo.time}`;
      const busy = busyByDayTime.get(key) ?? new Set<string>();
      if (busy.has(g.team1Id) || busy.has(g.team2Id)) continue;
      if (coach1 && busy.has(`coach:${coach1}`)) continue;
      if (coach2 && busy.has(`coach:${coach2}`)) continue;

      const usedCourts = courtsByDayTime.get(key) ?? new Set<number>();
      let court = -1;
      for (let c = 1; c <= totalCourts; c++) { if (!usedCourts.has(c)) { court = c; break; } }
      if (court === -1) continue;

      busy.add(g.team1Id); busy.add(g.team2Id);
      if (coach1) busy.add(`coach:${coach1}`);
      if (coach2) busy.add(`coach:${coach2}`);
      busyByDayTime.set(key, busy);
      usedCourts.add(court);
      courtsByDayTime.set(key, usedCourts);

      return { ...g, date: combo.day, time: combo.time, court, venue: courtToVenueName(court, safeVenues) };
    }
    return g; // no open slot found — stays unscheduled
  });
}

/** Greedy multi-pool scheduler: interleaves all pools' rounds, avoids team/court conflicts */
export function generateDivisionSchedule(
  pools: Pool[],
  divisionId: string,
  venues: VenueConfig[],
  gameDuration: number,
  breakBetween: number,
  startTime: string,
): PoolGame[] {
  const safeVenues = venues.length > 0 ? venues : [{ name: "Main Gym", courts: 2 }];
  const totalCourts = safeVenues.reduce((s, v) => s + (v.courts || 1), 0);

  // Interleave rounds from all pools so round 1 of each pool comes before round 2
  const poolRounds = pools.map(p => roundRobinPairs(p.teamIds));
  const maxRounds = Math.max(...poolRounds.map(r => r.length), 0);

  type Pair = { team1Id: string; team2Id: string; poolId: string };
  const pairs: Pair[] = [];
  for (let r = 0; r < maxRounds; r++) {
    pools.forEach((pool, pi) => {
      const round = poolRounds[pi][r];
      if (round) round.forEach(([t1, t2]) => pairs.push({ team1Id: t1, team2Id: t2, poolId: pool.id }));
    });
  }

  // Greedy court + time-slot assignment
  const courtBusy = new Map<number, Set<number>>();
  const teamBusy  = new Map<string, Set<number>>();
  const games: PoolGame[] = [];

  for (const pair of pairs) {
    for (let slot = 0; slot < 500; slot++) {
      if (teamBusy.get(pair.team1Id)?.has(slot) || teamBusy.get(pair.team2Id)?.has(slot)) continue;
      let court = -1;
      for (let c = 1; c <= totalCourts; c++) {
        if (!courtBusy.get(c)?.has(slot)) { court = c; break; }
      }
      if (court === -1) continue;

      if (!courtBusy.has(court)) courtBusy.set(court, new Set());
      if (!teamBusy.has(pair.team1Id)) teamBusy.set(pair.team1Id, new Set());
      if (!teamBusy.has(pair.team2Id)) teamBusy.set(pair.team2Id, new Set());
      courtBusy.get(court)!.add(slot);
      teamBusy.get(pair.team1Id)!.add(slot);
      teamBusy.get(pair.team2Id)!.add(slot);

      games.push({
        id: `${pair.poolId}-${pair.team1Id.slice(-6)}-${pair.team2Id.slice(-6)}-${slot}`,
        poolId: pair.poolId,
        divisionId,
        court,
        venue: courtToVenueName(court, safeVenues),
        timeSlot: slot,
        time: addMinutes(startTime, slot * (gameDuration + breakBetween)),
        team1Id: pair.team1Id,
        team2Id: pair.team2Id,
        status: "scheduled",
      });
      break;
    }
  }
  return games;
}
