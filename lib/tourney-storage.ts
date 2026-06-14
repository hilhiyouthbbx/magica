import type { Tournament } from "@/lib/tourney-types";

const KEY = "hilhi_tourney_v1";

export function getAllTournaments(): Tournament[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); }
  catch { return []; }
}

export function saveTournament(t: Tournament): void {
  const all = getAllTournaments();
  const idx = all.findIndex(x => x.id === t.id);
  if (idx >= 0) all[idx] = t; else all.push(t);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function getTournament(id: string): Tournament | null {
  return getAllTournaments().find(t => t.id === id) ?? null;
}

export function deleteTournament(id: string): void {
  localStorage.setItem(KEY, JSON.stringify(getAllTournaments().filter(t => t.id !== id)));
}
