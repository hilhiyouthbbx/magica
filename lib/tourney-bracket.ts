import type { BracketGame, Division } from "@/lib/tourney-types";
import { calculateStandings } from "./tourney-standings";

export function generateBracket(division: Division): BracketGame[] {
  // Seed: 1st of each pool, then 2nd of each pool, etc.
  const seeded: string[] = [];
  const maxPerPool = Math.max(...division.pools.map(p => p.teamIds.length));
  for (let seed = 0; seed < maxPerPool; seed++) {
    for (const pool of division.pools) {
      const standings = calculateStandings(
        pool.teamIds,
        division.teams,
        division.games.filter(g => g.poolId === pool.id)
      );
      if (standings[seed]) seeded.push(standings[seed].teamId);
    }
  }

  const n = seeded.length;
  if (n < 2) return [];

  const size = Math.pow(2, Math.ceil(Math.log2(Math.max(n, 2))));
  const padded: (string | null)[] = [...seeded, ...Array(size - n).fill(null)];
  const totalRounds = Math.log2(size);
  const games: BracketGame[] = [];

  // First round: standard seeding 1 vs last, 2 vs second-to-last
  for (let pos = 0; pos < size / 2; pos++) {
    const t1 = padded[pos];
    const t2 = padded[size - 1 - pos];
    const bye = !t1 || !t2;
    games.push({
      id: `br-${division.id}-r1-${pos}`,
      divisionId: division.id,
      round: 1,
      position: pos,
      team1Id: t1 ?? undefined,
      team2Id: t2 ?? undefined,
      status: bye ? "completed" : "scheduled",
      winnerId: bye ? (t1 ?? t2 ?? undefined) : undefined,
    });
  }

  // Subsequent rounds (empty to be filled as bracket advances)
  for (let round = 2; round <= totalRounds; round++) {
    const count = size / Math.pow(2, round);
    for (let pos = 0; pos < count; pos++) {
      games.push({
        id: `br-${division.id}-r${round}-${pos}`,
        divisionId: division.id,
        round,
        position: pos,
        status: "scheduled",
      });
    }
  }

  // Auto-advance bye winners into round 2
  const r1 = games.filter(g => g.round === 1);
  r1.forEach((g, idx) => {
    if (g.winnerId) {
      const next = games.find(x => x.round === 2 && x.position === Math.floor(idx / 2));
      if (next) {
        if (idx % 2 === 0) next.team1Id = g.winnerId;
        else next.team2Id = g.winnerId;
      }
    }
  });

  return games;
}

export function advanceBracketWinner(
  bracket: BracketGame[],
  game: BracketGame,
  score1: number,
  score2: number
): BracketGame[] {
  const winnerId = score1 >= score2 ? game.team1Id! : game.team2Id!;
  let updated = bracket.map(g =>
    g.id === game.id ? { ...g, score1, score2, status: "completed" as const, winnerId } : g
  );

  // Feed winner into next round
  const totalRounds = Math.max(...bracket.map(g => g.round));
  if (game.round < totalRounds) {
    const nextPos = Math.floor(game.position / 2);
    const nextRound = game.round + 1;
    const isFirst = game.position % 2 === 0;
    updated = updated.map(g => {
      if (g.round === nextRound && g.position === nextPos) {
        return isFirst ? { ...g, team1Id: winnerId } : { ...g, team2Id: winnerId };
      }
      return g;
    });
  }
  return updated;
}
