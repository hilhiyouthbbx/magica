"use client";
import { useState, useEffect } from "react";
import {
  Plus, Save, Trash2, X, Loader2, CheckCircle
} from "lucide-react";
import type {
  CampScheduleData, CampTeam, BracketGame, IndividualEvent, Division
} from "@/lib/camp-schedule";

const EVENT_NAMES = [
  "Free Throw Contest",
  "3-Point Contest",
  "1-on-1 Challenge",
  "3-on-3 Tournament",
];

export function CampTab({ adminKey }: { adminKey: string }) {
  const [data,    setData]    = useState<CampScheduleData | null>(null);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [section, setSection] = useState<"teams"|"standings"|"bracket"|"events"|"settings">("teams");

  useEffect(() => {
    fetch("/api/camp-schedule")
      .then(r => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  async function save(patch: Partial<CampScheduleData>) {
    if (!data) return;
    const updated = { ...data, ...patch };
    setData(updated);
    setSaving(true);
    try {
      await fetch(`/api/camp-schedule?key=${adminKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  // ── Team helpers ──────────────────────────────────────────────────────────
  function addTeam(division: Division) {
    if (!data) return;
    const newTeam: CampTeam = {
      id: Date.now().toString(),
      name: "", division, coach: "", players: [],
      wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0,
    };
    save({ teams: [...data.teams, newTeam] });
  }

  function setTeamField(id: string, field: keyof CampTeam, value: unknown) {
    if (!data) return;
    setData({ ...data, teams: data.teams.map(t => t.id === id ? { ...t, [field]: value } : t) });
  }

  function setPlayerName(teamId: string, idx: number, value: string) {
    if (!data) return;
    const team = data.teams.find(t => t.id === teamId);
    if (!team) return;
    // Keep array positions — pad with empty strings up to idx
    const arr = Array.from({ length: 6 }, (_, i) => team.players[i] ?? "");
    arr[idx] = value;
    setData({ ...data, teams: data.teams.map(t => t.id === teamId ? { ...t, players: arr } : t) });
  }

  function saveTeams() {
    if (!data) return;
    // Strip trailing empty strings only on save
    const cleaned = data.teams.map(t => ({
      ...t, players: t.players.filter(p => p.trim() !== "")
    }));
    save({ teams: cleaned });
  }

  function removeTeam(id: string) {
    if (!data || !confirm("Remove this team?")) return;
    save({ teams: data.teams.filter(t => t.id !== id) });
  }

  // ── Bracket helpers ───────────────────────────────────────────────────────
  function addBracketGame(division: Division, round: BracketGame["round"]) {
    if (!data) return;
    const g: BracketGame = {
      id: Date.now().toString(), round, division,
      team1Id: "", team2Id: "", score1: null, score2: null,
      court: "A", status: "scheduled",
    };
    save({ bracketGames: [...data.bracketGames, g] });
  }

  function setBracketField(id: string, field: keyof BracketGame, value: unknown) {
    if (!data) return;
    setData({ ...data, bracketGames: data.bracketGames.map(g => g.id === id ? { ...g, [field]: value } : g) });
  }

  function saveBracket() { if (data) save({ bracketGames: data.bracketGames }); }

  function removeBracketGame(id: string) {
    if (!data || !confirm("Remove this game?")) return;
    save({ bracketGames: data.bracketGames.filter(g => g.id !== id) });
  }

  // ── Event helpers ─────────────────────────────────────────────────────────
  function addEvent(division: Division, name: string) {
    if (!data) return;
    const e: IndividualEvent = {
      id: Date.now().toString(), name, division,
      nominees: [], status: "upcoming",
    };
    save({ individualEvents: [...(data.individualEvents ?? []), e] });
  }

  function setEventField(id: string, field: keyof IndividualEvent, value: unknown) {
    if (!data) return;
    setData({ ...data, individualEvents: (data.individualEvents ?? []).map(e => e.id === id ? { ...e, [field]: value } : e) });
  }

  function setNominee(eventId: string, teamId: string, idx: number, value: string) {
    if (!data) return;
    const events = (data.individualEvents ?? []).map(e => {
      if (e.id !== eventId) return e;
      const slots = e.name === "3-on-3 Tournament" ? 3 : 2;
      const nomIdx = e.nominees.findIndex(n => n.teamId === teamId);
      const nominees = [...e.nominees];
      const curPlayers = nomIdx >= 0 ? [...nominees[nomIdx].players] : Array(slots).fill("");
      const padded = Array.from({ length: slots }, (_, i) => curPlayers[i] ?? "");
      padded[idx] = value;
      if (nomIdx >= 0) nominees[nomIdx] = { teamId, players: padded };
      else nominees.push({ teamId, players: padded });
      return { ...e, nominees };
    });
    setData({ ...data, individualEvents: events });
  }

  function saveEvents() {
    if (!data) return;
    // Strip empty nominees on save
    const cleaned = (data.individualEvents ?? []).map(e => ({
      ...e, nominees: e.nominees.map(n => ({ ...n, players: n.players.filter(p => p.trim() !== "") }))
    }));
    save({ individualEvents: cleaned });
  }

  function removeEvent(id: string) {
    if (!data || !confirm("Remove this event?")) return;
    save({ individualEvents: (data.individualEvents ?? []).filter(e => e.id !== id) });
  }

  if (!data) return (
    <div className="flex items-center justify-center h-40 text-gray-500 text-sm">Loading…</div>
  );

  const divTeams = (div: Division) => data.teams.filter(t => t.division === div);
  const teamOpts = (div: Division) => divTeams(div).map(t => ({ id: t.id, name: t.name || "(unnamed)" }));

  return (
    <div className="space-y-5">

      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-gray-500 text-sm">
          Public page:{" "}
          <a href="/camp-schedule" target="_blank" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
            /camp-schedule ↗
          </a>
        </p>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${data.active ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-500"}`}>
          {data.active ? "🟢 Live to public" : "⚫ Hidden — activate in Settings"}
        </span>
      </div>

      {/* Section nav */}
      <div className="flex flex-wrap gap-2 items-center">
        {([
          ["teams",    "👥 Teams & Rosters"],
          ["standings","📊 Standings"],
          ["bracket",  "🏆 Bracket"],
          ["events",   "🎯 Individual Events"],
          ["settings", "⚙️ Settings"],
        ] as const).map(([s, label]) => (
          <button key={s} onClick={() => setSection(s)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${section === s ? "bg-blue-600 text-white" : "glass border border-white/15 text-gray-400 hover:text-white"}`}>
            {label}
          </button>
        ))}
        {saving && <span className="flex items-center gap-1 text-blue-400 text-sm"><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving…</span>}
        {saved  && <span className="flex items-center gap-1 text-green-400 text-sm"><CheckCircle className="w-3.5 h-3.5" />Saved!</span>}
      </div>

      {/* ── TEAMS ── */}
      {section === "teams" && (
        <div className="space-y-6">
          {(["NBA", "College"] as Division[]).map(div => (
            <div key={div} className="glass rounded-2xl border border-white/10 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white font-black text-base">{div} Division</h3>
                  <p className="text-gray-500 text-xs mt-0.5">{div === "NBA" ? "1st – 4th Grade" : "5th – 8th Grade"}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => addTeam(div)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all">
                    <Plus className="w-3.5 h-3.5" /> Add Team
                  </button>
                  <button onClick={saveTeams}
                    className="flex items-center gap-1.5 px-3 py-2 glass border border-white/15 hover:border-green-500/40 text-gray-400 hover:text-green-400 text-xs font-bold rounded-xl transition-all">
                    <Save className="w-3.5 h-3.5" /> Save All
                  </button>
                </div>
              </div>

              {divTeams(div).length === 0 && (
                <p className="text-gray-600 text-sm text-center py-4">
                  No {div} teams yet. Click &quot;Add Team&quot; to get started.
                </p>
              )}

              <div className="space-y-5">
                {divTeams(div).map(team => (
                  <div key={team.id} className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-4">

                    {/* Name + Coach row */}
                    <div className="flex items-start gap-3">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 font-semibold mb-1.5">Team Name</label>
                          <input
                            value={team.name}
                            onChange={e => setTeamField(team.id, "name", e.target.value)}
                            placeholder={div === "NBA" ? "e.g. Lakers" : "e.g. Duke"}
                            className="w-full px-3 py-2.5 rounded-xl bg-[#0f1729] border border-white/20 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 font-semibold mb-1.5">Coach</label>
                          <input
                            value={team.coach}
                            onChange={e => setTeamField(team.id, "coach", e.target.value)}
                            placeholder="Coach name"
                            className="w-full px-3 py-2.5 rounded-xl bg-[#0f1729] border border-white/20 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </div>
                      <button onClick={() => removeTeam(team.id)}
                        className="mt-6 w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* 6 player slots */}
                    <div>
                      <label className="block text-xs text-gray-400 font-semibold mb-2">Players (up to 6)</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Array.from({ length: 6 }, (_, i) => (
                          <div key={i}>
                            <label className="block text-[11px] text-gray-600 mb-1">Player {i + 1}</label>
                            <input
                              value={team.players[i] ?? ""}
                              onChange={e => setPlayerName(team.id, i, e.target.value)}
                              placeholder={`Player ${i + 1}`}
                              className="w-full px-3 py-2 rounded-xl bg-[#0f1729] border border-white/20 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-700"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── STANDINGS ── */}
      {section === "standings" && (
        <div className="space-y-6">
          {(["NBA", "College"] as Division[]).map(div => (
            <div key={div} className="glass rounded-2xl border border-white/10 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-black text-base">{div} Division Standings</h3>
                <button onClick={saveTeams}
                  className="flex items-center gap-1.5 px-3 py-2 glass border border-white/15 hover:border-green-500/40 text-gray-400 hover:text-green-400 text-xs font-bold rounded-xl transition-all">
                  <Save className="w-3.5 h-3.5" /> Save
                </button>
              </div>

              {divTeams(div).length === 0 ? (
                <p className="text-gray-600 text-sm">Add teams first in the Teams &amp; Rosters section.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="pb-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider pr-4">Team</th>
                        <th className="pb-3 px-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">W</th>
                        <th className="pb-3 px-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">L</th>
                        <th className="pb-3 px-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">PF</th>
                        <th className="pb-3 px-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">PA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {divTeams(div).map(team => (
                        <tr key={team.id} className="border-b border-white/5">
                          <td className="py-3 pr-4 text-white font-semibold text-sm">{team.name || "(unnamed)"}</td>
                          {(["wins","losses","pointsFor","pointsAgainst"] as const).map(field => (
                            <td key={field} className="py-3 px-3">
                              <input
                                type="number" min={0}
                                value={team[field]}
                                onChange={e => setTeamField(team.id, field, parseInt(e.target.value) || 0)}
                                className="w-16 text-center px-2 py-2 rounded-lg bg-[#0f1729] border border-white/20 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── BRACKET ── */}
      {section === "bracket" && (
        <div className="space-y-6">
          {(["NBA", "College"] as Division[]).map(div => (
            <div key={div} className="glass rounded-2xl border border-white/10 p-5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="text-white font-black text-base">{div} Division Bracket</h3>
                <div className="flex flex-wrap gap-2">
                  {(["semi","final","3rd"] as BracketGame["round"][]).map(r => (
                    <button key={r} onClick={() => addBracketGame(div, r)}
                      className="px-3 py-1.5 glass border border-white/15 hover:border-blue-500/40 text-gray-400 hover:text-blue-400 text-xs font-bold rounded-xl transition-all">
                      + {r === "3rd" ? "3rd Place" : r === "semi" ? "Semifinal" : "Final"}
                    </button>
                  ))}
                  <button onClick={saveBracket}
                    className="flex items-center gap-1.5 px-3 py-1.5 glass border border-white/15 hover:border-green-500/40 text-gray-400 hover:text-green-400 text-xs font-bold rounded-xl transition-all">
                    <Save className="w-3 h-3" /> Save
                  </button>
                </div>
              </div>

              {data.bracketGames.filter(g => g.division === div).length === 0 ? (
                <p className="text-gray-600 text-sm">No bracket games yet. Add Semifinal, Final, and 3rd Place games above.</p>
              ) : (
                <div className="space-y-3">
                  {data.bracketGames.filter(g => g.division === div).map(game => {
                    const opts = teamOpts(div);
                    return (
                      <div key={game.id} className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className={`text-xs font-black uppercase px-2 py-0.5 rounded-full ${game.round === "final" ? "bg-yellow-500/20 text-yellow-400" : game.round === "semi" ? "bg-blue-500/20 text-blue-400" : "bg-gray-500/20 text-gray-400"}`}>
                            {game.round === "3rd" ? "3rd Place" : game.round === "semi" ? "Semifinal" : "Championship"}
                          </span>
                          <div className="flex items-center gap-2">
                            <select
                              value={game.status}
                              onChange={e => setBracketField(game.id, "status", e.target.value)}
                              className="px-2 py-1 rounded-lg bg-[#0f1729] border border-white/20 text-white text-xs focus:outline-none focus:border-blue-500">
                              <option value="scheduled">Scheduled</option>
                              <option value="live">🔴 Live</option>
                              <option value="final">Final</option>
                            </select>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500 text-xs">Court</span>
                              <input
                                value={game.court}
                                onChange={e => setBracketField(game.id, "court", e.target.value)}
                                className="w-12 text-center px-2 py-1 rounded-lg bg-[#0f1729] border border-white/20 text-white text-xs focus:outline-none focus:border-blue-500"
                              />
                            </div>
                            <button onClick={() => removeBracketGame(game.id)}
                              className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-red-400 transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {([1, 2] as const).map(n => {
                            const teamKey = `team${n}Id` as "team1Id" | "team2Id";
                            const scoreKey = `score${n}` as "score1" | "score2";
                            return (
                              <div key={n} className="space-y-2">
                                <select
                                  value={game[teamKey]}
                                  onChange={e => setBracketField(game.id, teamKey, e.target.value)}
                                  className="w-full px-2 py-2 rounded-xl bg-[#0f1729] border border-white/20 text-white text-sm focus:outline-none focus:border-blue-500">
                                  <option value="">Select Team {n}…</option>
                                  {opts.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                </select>
                                <input
                                  type="number" min={0} placeholder="Score"
                                  value={game[scoreKey] ?? ""}
                                  onChange={e => setBracketField(game.id, scoreKey, e.target.value === "" ? null : parseInt(e.target.value))}
                                  className="w-full text-center px-2 py-2 rounded-xl bg-[#0f1729] border border-white/20 text-white text-sm focus:outline-none focus:border-blue-500"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── INDIVIDUAL EVENTS ── */}
      {section === "events" && (
        <div className="space-y-6">
          <div className="glass rounded-2xl border border-white/10 p-4">
            <p className="text-gray-400 text-sm">
              Track which players each team is nominating for individual skill events on Championship Day.
              Add one section per event per division, enter nominees, then record the winner when done.
            </p>
          </div>

          {(["NBA", "College"] as Division[]).map(div => (
            <div key={div} className="glass rounded-2xl border border-white/10 p-5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <h3 className="text-white font-black text-base">{div} Division — Individual Events</h3>
                  <p className="text-gray-500 text-xs mt-0.5">{div === "NBA" ? "1st – 4th Grade" : "5th – 8th Grade"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {EVENT_NAMES.map(name => (
                    <button key={name} onClick={() => addEvent(div, name)}
                      className="px-3 py-1.5 glass border border-white/15 hover:border-blue-500/40 text-gray-400 hover:text-blue-400 text-xs font-bold rounded-xl transition-all">
                      + {name}
                    </button>
                  ))}
                  <button onClick={saveEvents}
                    className="flex items-center gap-1.5 px-3 py-1.5 glass border border-white/15 hover:border-green-500/40 text-gray-400 hover:text-green-400 text-xs font-bold rounded-xl transition-all">
                    <Save className="w-3 h-3" /> Save All
                  </button>
                </div>
              </div>

              {(data.individualEvents ?? []).filter(e => e.division === div).length === 0 && (
                <p className="text-gray-600 text-sm">No events added yet. Click an event button above to get started.</p>
              )}

              <div className="space-y-4">
                {(data.individualEvents ?? []).filter(e => e.division === div).map(evt => {
                  const teams = divTeams(div);
                  const slots = evt.name === "3-on-3 Tournament" ? 3 : 2;
                  return (
                    <div key={evt.id} className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-white font-black text-sm">{evt.name}</span>
                        <div className="flex items-center gap-2">
                          <select
                            value={evt.status}
                            onChange={e => setEventField(evt.id, "status", e.target.value)}
                            className="px-2 py-1 rounded-lg bg-[#0f1729] border border-white/20 text-white text-xs focus:outline-none focus:border-blue-500">
                            <option value="upcoming">Upcoming</option>
                            <option value="live">🔴 Live</option>
                            <option value="complete">✅ Complete</option>
                          </select>
                          <button onClick={() => removeEvent(evt.id)}
                            className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-red-400 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                          Nominees — {evt.name === "3-on-3 Tournament" ? "3 players per team" : "up to 2 per team"}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {teams.map(team => {
                            const nom = evt.nominees.find(n => n.teamId === team.id);
                            return (
                              <div key={team.id}>
                                <label className="block text-xs font-semibold text-gray-400 mb-1.5">{team.name || "(unnamed)"}</label>
                                <div className="space-y-1.5">
                                  {Array.from({ length: slots }, (_, i) => (
                                    <input key={i}
                                      value={(nom?.players ?? [])[i] ?? ""}
                                      onChange={e => setNominee(evt.id, team.id, i, e.target.value)}
                                      placeholder={`Nominee ${i + 1}`}
                                      className="w-full px-2.5 py-2 rounded-lg bg-[#0f1729] border border-white/20 text-white text-xs focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-700"
                                    />
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {evt.status === "complete" && (
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
                          <div>
                            <label className="block text-xs font-bold text-yellow-400 mb-1">🥇 Winner</label>
                            <input
                              value={evt.winner ?? ""}
                              onChange={e => setEventField(evt.id, "winner", e.target.value)}
                              placeholder="Winner name"
                              className="w-full px-2.5 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-white text-sm focus:outline-none focus:border-yellow-400"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-400 mb-1">🥈 Runner-Up</label>
                            <input
                              value={evt.runnerUp ?? ""}
                              onChange={e => setEventField(evt.id, "runnerUp", e.target.value)}
                              placeholder="Runner-up name"
                              className="w-full px-2.5 py-2 rounded-lg bg-white/5 border border-white/20 text-white text-sm focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── SETTINGS ── */}
      {section === "settings" && (
        <div className="glass rounded-2xl border border-white/10 p-5 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-white font-black text-base">Camp Settings</h3>
            <button
              onClick={() => save({ active: !data.active })}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all shadow-lg ${
                data.active
                  ? "bg-green-600 hover:bg-green-500 text-white shadow-green-500/30"
                  : "bg-white/10 hover:bg-white/20 border border-white/20 text-gray-300"
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${data.active ? "bg-white animate-pulse" : "bg-gray-500"}`} />
              {data.active ? "🟢 Active — Visible to Public" : "⚫ Inactive — Hidden from Public"}
            </button>
          </div>

          {!data.active && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm">
              <span className="text-lg">👁</span>
              <span>The Camp Schedule page is currently hidden. Click the button above to make it live when you&apos;re ready.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Camp Name</label>
              <input
                value={data.campName}
                onChange={e => setData({ ...data, campName: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-[#0f1729] border border-white/20 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Camp Year</label>
              <input
                type="number"
                value={data.campYear}
                onChange={e => setData({ ...data, campYear: parseInt(e.target.value) || 2025 })}
                className="w-full px-3 py-2.5 rounded-xl bg-[#0f1729] border border-white/20 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Current Day <span className="text-gray-600 font-normal">(0 = not started)</span>
            </label>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map(d => (
                <button key={d}
                  onClick={() => setData({ ...data, currentDay: d })}
                  className={`w-12 py-2 rounded-xl text-sm font-black transition-all ${data.currentDay === d ? "bg-orange-500 text-white" : "glass border border-white/15 text-gray-400 hover:text-white"}`}>
                  {d === 0 ? "–" : `D${d}`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Live Announcement <span className="text-gray-600 font-normal">(visible to everyone on the schedule page)</span>
            </label>
            <textarea
              value={data.announcement}
              onChange={e => setData({ ...data, announcement: e.target.value })}
              placeholder="Post a live update, game result, or schedule change..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl bg-[#0f1729] border border-white/20 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <button
            onClick={() => save({ campName: data.campName, campYear: data.campYear, currentDay: data.currentDay, announcement: data.announcement })}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all">
            <Save className="w-4 h-4" /> Save Settings
          </button>
        </div>
      )}

    </div>
  );
}
