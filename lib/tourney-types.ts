export type GameStatus = "scheduled" | "completed";
export type TournamentStatus = "pool_play" | "bracket" | "complete";

export interface Team {
  id: string;
  name: string;
  coachName: string;
}

export interface Pool {
  id: string;
  name: string; // "A", "B", "C"
  teamIds: string[];
}

export interface PoolGame {
  id: string;
  poolId: string;
  divisionId: string;
  court: number;
  timeSlot: number;
  time: string; // "08:30"
  team1Id: string;
  team2Id: string;
  score1?: number;
  score2?: number;
  status: GameStatus;
}

export interface BracketGame {
  id: string;
  divisionId: string;
  round: number;    // 1 = first round, higher = closer to final
  position: number; // 0-indexed within round
  team1Id?: string;
  team2Id?: string;
  score1?: number;
  score2?: number;
  status: GameStatus;
  winnerId?: string;
}

export interface Division {
  id: string;
  name: string;
  teams: Team[];
  pools: Pool[];
  games: PoolGame[];
  bracket: BracketGame[];
  bracketGenerated: boolean;
}

export interface Tournament {
  id: string;
  name: string;
  date: string;
  venue: string;
  courts: number;
  gameDuration: number;
  breakBetweenGames: number;
  startTime: string; // "08:00"
  divisions: Division[];
  status: TournamentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TeamStanding {
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  ties: number;
  pf: number;
  pa: number;
  pd: number;
  gamesPlayed: number;
  points: number;
}
