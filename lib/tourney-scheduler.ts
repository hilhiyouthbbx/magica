import type { Pool, PoolGame } from "@/lib/tourney-types";

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

/** Circle/polygon round-robin pairing algorithm */
function roundRobinPairs(ids: string[]): [string, string][][] {
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

/** Greedy multi-pool scheduler: interleaves all pools' rounds, avoids team/court conflicts */
export function generateDivisionSchedule(
  pools: Pool[],
  divisionId: string,
  courts: number,
  gameDuration: number,
  breakBetween: number,
  startTime: string,
  venues: string[] = ["Main Gym"]
): PoolGame[] {
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
  const teamBusy = new Map<string, Set<number>>();
  const games: PoolGame[] = [];

  for (const pair of pairs) {
    for (let slot = 0; slot < 500; slot++) {
      if (teamBusy.get(pair.team1Id)?.has(slot) || teamBusy.get(pair.team2Id)?.has(slot)) continue;
      let court = -1;
      for (let c = 1; c <= courts; c++) {
        if (!courtBusy.get(c)?.has(slot)) { court = c; break; }
      }
      if (court === -1) continue;

      if (!courtBusy.has(court)) courtBusy.set(court, new Set());
      if (!teamBusy.has(pair.team1Id)) teamBusy.set(pair.team1Id, new Set());
      if (!teamBusy.has(pair.team2Id)) teamBusy.set(pair.team2Id, new Set());
      courtBusy.get(court)!.add(slot);
      teamBusy.get(pair.team1Id)!.add(slot);
      teamBusy.get(pair.team2Id)!.add(slot);

      const venueCount = venues.length || 1;
      const assignedVenue = venues[Math.floor((court - 1) / Math.ceil(courts / venueCount))] ?? venues[0] ?? "Main Gym";
      games.push({
        id: `${pair.poolId}-${pair.team1Id.slice(-6)}-${pair.team2Id.slice(-6)}-${slot}`,
        poolId: pair.poolId,
        divisionId,
        court,
        venue: assignedVenue,
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
