import type { Tournament, VenueConfig } from "@/lib/tourney-types";

const KEY = "hilhi_tourney_v1";

// ── Server sync ─────────────────────────────────────────────────────────────
// Tournaments used to live ONLY in browser localStorage, which meant they could silently
// "disappear" if you opened the site from a different browser, device, or URL (e.g. a preview
// domain) — localStorage never leaves the browser/origin that wrote it. We now also mirror every
// save/delete to a server-side store (Redis/KV) so there's a single source of truth that survives
// across browsers and devices. localStorage is kept as an instant local cache so the UI still
// loads immediately without waiting on a network round-trip.
let adminKey = "";
export function setTourneyAdminKey(key: string): void { adminKey = key; }

function apiUrl(): string { return `/api/admin/tourney-manager?key=${encodeURIComponent(adminKey)}`; }

function syncSaveToServer(t: Tournament): void {
  if (typeof window === "undefined" || !adminKey) return;
  fetch(apiUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "save", tournament: t }),
  }).catch(() => { /* best-effort — localStorage already has it */ });
}

function syncDeleteToServer(id: string): void {
  if (typeof window === "undefined" || !adminKey) return;
  fetch(apiUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "delete", id }),
  }).catch(() => { /* best-effort */ });
}

/** Fetches the server's authoritative tournament list, reconciles it with whatever's in
 *  localStorage (newer `updatedAt` wins per tournament, union of both sets), writes the merged
 *  result back to localStorage, and returns it. Call this once on mount so a tournament saved
 *  from another browser/device shows up here, and any tournament that only exists locally
 *  (e.g. saved before this sync existed) gets pushed up to the server. */
export async function syncTournamentsFromServer(): Promise<Tournament[]> {
  const local = getAllTournaments();
  if (!adminKey) return local;
  try {
    const res = await fetch(apiUrl());
    if (!res.ok) return local;
    const data = await res.json();
    const remote: Tournament[] = Array.isArray(data.tournaments) ? data.tournaments.map(migrate) : [];

    const byId = new Map<string, Tournament>();
    for (const t of remote) byId.set(t.id, t);
    for (const t of local) {
      const existing = byId.get(t.id);
      if (!existing || new Date(t.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
        byId.set(t.id, t);
      }
    }
    const merged = [...byId.values()];

    // Push anything the server didn't have (or had an older copy of) back up.
    for (const t of merged) {
      const remoteMatch = remote.find(r => r.id === t.id);
      if (!remoteMatch || remoteMatch.updatedAt !== t.updatedAt) syncSaveToServer(t);
    }

    if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return local;
  }
}

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
  syncSaveToServer(t);
}

export function deleteTournament(id: string): void {
  if (typeof window === "undefined") return;
  const all = getAllTournaments().filter(t => t.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
  syncDeleteToServer(id);
}
