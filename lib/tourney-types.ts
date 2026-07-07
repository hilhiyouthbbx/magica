export type GameStatus       = "scheduled" | "completed";
export type TournamentStatus = "pool_play" | "bracket" | "complete";
export type BracketFormat    = "single" | "double" | "none";
export type TiebreakerMethod = "point_diff" | "least_pa";

export interface VenueConfig {
  name: string;
  courts: number;
}

export interface Team {
  id: string; name: string; coachName: string;
  /** Scheduling requests the team submitted at registration (e.g. "can't play before 10am Sat"). Shown in the Teams tab so it's not lost after import. */
  schedulingRequests?: string;
}

export interface Pool {
  id: string; name: string; teamIds: string[];
}

export interface PoolGame {
  id: string; poolId: string; divisionId: string;
  court: number; venue: string;
  timeSlot: number; time: string;
  /** Calendar date (YYYY-MM-DD) this game is scheduled on. Empty/undefined = not yet scheduled to a day/slot. */
  date?: string;
  team1Id: string; team2Id: string;
  score1?: number; score2?: number; status: GameStatus;
  /** When true, this game is excluded from standings calculations (e.g. an extra game beyond the guarantee). */
  excludeFromStandings?: boolean;
}

export interface BracketGame {
  id: string; divisionId: string; round: number; position: number;
  team1Id?: string; team2Id?: string;
  score1?: number; score2?: number; status: GameStatus;
  winnerId?: string; loserId?: string;
  isLosersBracket?: boolean;
}

export interface Division {
  id: string; name: string; teams: Team[]; pools: Pool[];
  games: PoolGame[]; bracket: BracketGame[];
  losersBracket: BracketGame[];
  bracketGenerated: boolean;
  /** Overrides the tournament-wide bracketFormat for just this division (e.g. one division is pool-play-only while another plays a bracket). */
  format?: BracketFormat;
}

export interface Tournament {
  id: string; name: string; date: string;
  startDate?: string; endDate?: string;
  venues: VenueConfig[];
  gameDuration: number; breakBetweenGames: number; startTime: string;
  bracketFormat: BracketFormat;
  gamesGuaranteed: number;
  tiebreaker: TiebreakerMethod;
  divisions: Division[]; status: TournamentStatus;
  createdAt: string; updatedAt: string;
  /** Per-day first-game-start / last-game-finish windows, keyed by YYYY-MM-DD date. */
  dayWindows?: Record<string, { start: string; end: string }>;
}

export interface TeamStanding {
  teamId: string; teamName: string;
  wins: number; losses: number; ties: number;
  pf: number; pa: number; pd: number;
  gamesPlayed: number; points: number;
}
