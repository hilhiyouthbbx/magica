import type { Tournament, VenueConfig } from "@/lib/tourney-types";

const KEY = "hilhi_tourney_v1";

function migrate(t: Tournament): Tournament {
  // ── venues: old string[] → VenueConfig[] ─────────────────────────────────
  const rawVenues = (t as any).venues;
  const oldCourts = (t as any).courts ?? 2;
  let venues: VenueConfig[];

  if (Array.isArray(rawVenues) && rawVenues.length > 0) {
    if (typeof rawVenues[0] === "string") {
      // Old format: string[] — convert, put old court count on first venue
      venues = (rawVenues as string[]).map((name, i) => ({
        name: name.trim() || "Main Gym",
        courts: i === 0 ? oldCourts : 1,
      }));
    } else {
      // Already new VenueConfig[]
      venues = rawVenues as VenueConfig[];
    }
  } else if ((t as any).venue) {
    // Even older: single venue string
    venues = [{ name: (t as any).venue, courts: oldCourts }];
  } else {
    venues = [{ name: "Main Gym", courts: oldCourts }];
  }

  return {
    ...t,
    venues,
    bracketFormat:    t.bracketFormat    ?? "single",
    gamesGuaranteed:  t.gamesGuaranteed  ?? 3,
    tiebreaker:       t.tiebreaker       ?? "point_diff",
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
