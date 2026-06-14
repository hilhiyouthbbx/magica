export type GameStatus     = "scheduled" | "completed";
export type TournamentStatus = "pool_play" | "bracket" | "complete";
export type BracketFormat  = "single" | "double" | "none";

export interface Team {
  id: string;
  name: string;
  coachName: string;
}

export interface Pool {
  id: string;
  name: string;
  teamIds: string[];
}

export interface PoolGame {
  id: string;
  poolId: string;
  divisionId: string;
  court: number;
  venue: string;       // which venue this game is at
  timeSlot: number;
  time: string;
  team1Id: string;
  team2Id: string;
  score1?: number;
  score2?: number;
  status: GameStatus;
}

export interface BracketGame {
  id: string;
  divisionId: string;
  round: number;
  position: number;
  team1Id?: string;
  team2Id?: string;
  score1?: number;
  score2?: number;
  status: GameStatus;
  winnerId?: string;
  loserId?: string;     // for double elimination
  isLosersBracket?: boolean;
}

export interface Division {
  id: string;
  name: string;
  teams: Team[];
  pools: Pool[];
  games: PoolGame[];
  bracket: BracketGame[];
  losersBracket: BracketGame[];   // for double elim
  bracketGenerated: boolean;
}

export interface Tournament {
  id: string;
  name: string;
  date: string;
  venues: string[];            // one or more venues
  courts: number;
  gameDuration: number;
  breakBetweenGames: number;
  startTime: string;
  bracketFormat: BracketFormat;
  gamesGuaranteed: number;
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
