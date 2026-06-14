import type { Tournament } from "@/lib/tourney-types";

const KEY = "hilhi_tourney_v1";

/** Migrate old tournament shape to current shape */
function migrate(t: Tournament): Tournament {
  return {
    ...t,
    venues: (t as any).venue ? [(t as any).venue] : (t.venues ?? ["Main Gym"]),
    bracketFormat: t.bracketFormat ?? "single",
    gamesGuaranteed: t.gamesGuaranteed ?? 3,
    divisions: (t.divisions ?? []).map(d => ({
      ...d,
      losersBracket: d.losersBracket ?? [],
      games: (d.games ?? []).map(g => ({ ...g, venue: g.venue ?? "Main Gym" })),
    })),
  };
}

export function getAllTournaments(): Tournament[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return (Array.isArray(data) ? data : [data]).map(migrate);
  } catch { return []; }
}

export function getTournament(id: string): Tournament | undefined {
  return getAllTournaments().find(t => t.id === id);
}

export function saveTournament(t: Tournament): void {
  if (typeof window === "undefined") return;
  const all = getAllTournaments();
  const idx = all.findIndex(x => x.id === t.id);
  if (idx >= 0) all[idx] = t; else all.push(t);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function deleteTournament(id: string): void {
  if (typeof window === "undefined") return;
  const all = getAllTournaments().filter(t => t.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
}
