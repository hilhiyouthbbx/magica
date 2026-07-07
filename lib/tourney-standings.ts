import type { PoolGame, Team, TeamStanding, TiebreakerMethod } from "@/lib/tourney-types";

export function calculateStandings(
  teamIds: string[],
  teams: Team[],
  games: PoolGame[],
  tiebreaker: TiebreakerMethod = "point_diff"
): TeamStanding[] {
  const teamMap = new Map(teams.map(t => [t.id, t.name]));
  const s = new Map<string, TeamStanding>(
    teamIds.map(id => [id, {
      teamId: id,
      teamName: teamMap.get(id) ?? "Unknown",
      wins: 0, losses: 0, ties: 0, pf: 0, pa: 0, pd: 0, gamesPlayed: 0, points: 0,
    }])
  );

  for (const g of games) {
    if (g.status !== "completed" || g.score1 == null || g.score2 == null) continue;
    const excluded = new Set(g.excludedTeamIds ?? []);
    const a = s.get(g.team1Id), b = s.get(g.team2Id);
    // Each team's participation in this game is counted independently — excluding one team
    // (e.g. an extra game beyond their guarantee) doesn't affect the other team's record.
    if (a && !excluded.has(g.team1Id)) {
      a.pf += g.score1; a.pa += g.score2; a.gamesPlayed++;
      if (g.score1 > g.score2) a.wins++;
      else if (g.score2 > g.score1) a.losses++;
      else a.ties++;
      a.points += g.score1 > g.score2 ? 2 : g.score1 === g.score2 ? 1 : 0;
    }
    if (b && !excluded.has(g.team2Id)) {
      b.pf += g.score2; b.pa += g.score1; b.gamesPlayed++;
      if (g.score2 > g.score1) b.wins++;
      else if (g.score1 > g.score2) b.losses++;
      else b.ties++;
      b.points += g.score2 > g.score1 ? 2 : g.score1 === g.score2 ? 1 : 0;
    }
  }

  const list = [...s.values()].map(x => ({ ...x, pd: x.pf - x.pa }));

  list.sort((a, b) => {
    // 1. Wins
    if (b.wins !== a.wins) return b.wins - a.wins;

    // 2. Head-to-head (always checked first within a tie)
    const h2h = games.find(
      g => g.status === "completed" &&
        !(g.excludedTeamIds?.includes(a.teamId)) && !(g.excludedTeamIds?.includes(b.teamId)) &&
        ((g.team1Id === a.teamId && g.team2Id === b.teamId) ||
         (g.team1Id === b.teamId && g.team2Id === a.teamId))
    );
    if (h2h && h2h.score1 != null && h2h.score2 != null) {
      const aWon =
        (h2h.team1Id === a.teamId && h2h.score1 > h2h.score2) ||
        (h2h.team2Id === a.teamId && h2h.score2 > h2h.score1);
      const bWon =
        (h2h.team1Id === b.teamId && h2h.score1 > h2h.score2) ||
        (h2h.team2Id === b.teamId && h2h.score2 > h2h.score1);
      if (aWon && !bWon) return -1;
      if (bWon && !aWon) return 1;
      // tied head-to-head (shouldn't happen unless tie game) — fall through
    }

    // 3. Tiebreaker setting
    if (tiebreaker === "least_pa") {
      // Fewest points allowed wins — lower PA is better
      if (a.pa !== b.pa) return a.pa - b.pa;
      // Then most points for
      return b.pf - a.pf;
    } else {
      // Default: point_diff — higher net is better
      if (b.pd !== a.pd) return b.pd - a.pd;
      // Then most points for
      return b.pf - a.pf;
    }
  });

  return list;
}
