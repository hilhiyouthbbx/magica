"use client";
import { useState, useEffect } from "react";
import {
  Plus, Save, Trash2, X, Loader2, CheckCircle,
  Users, GripVertical, RefreshCw
} from "lucide-react";
import type {
  CampScheduleData, CampTeam, BracketGame, IndividualEvent, Division,
  CamperRosterEntry
} from "@/lib/camp-schedule";

const EVENT_NAMES = [
  "Free Throw Contest",
  "3-Point Contest",
  "1-on-1 Challenge",
  "3-on-3 Tournament",
];

export function CampTab({ adminKey }: { adminKey: string }) {
  const [data,        setData]        = useState<CampScheduleData | null>(null);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [section,     setSection]     = useState<"roster"|"teams"|"standings"|"bracket"|"events"|"settings">("teams");
  const [roster,      setRoster]      = useState<CamperRosterEntry[]>([]);
  const [rosterLoad,  setRosterLoad]  = useState(false);
  const [dragOver,    setDragOver]    = useState<string | null>(null);
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const [rosterError,  setRosterError]  = useState<string>("");

  useEffect(() => {
    fetch("/api/camp-schedule")
      .then(r => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  // Recompute assignedIds whenever teams or roster changes
  useEffect(() => {
    if (!data || roster.length === 0) return;
    const allNames = new Set<string>();
    data.teams.forEach(t => t.players.forEach(p => p && allNames.add(p.trim().toLowerCase())));
    const ids = new Set<string>();
    roster.forEach(cam => {
      if (allNames.has(cam.displayName.toLowerCase()) || allNames.has(cam.fullName.toLowerCase()))
        ids.add(cam.id);
    });
    setAssignedIds(ids);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.teams, roster]);

  async function loadRoster() {
    setRosterLoad(true);
    setRosterError("");
    try {
      const res  = await fetch(`/api/camp-schedule/roster?key=${adminKey}`);
      const json = await res.json() as { campers?: CamperRosterEntry[]; error?: string };
      if (!res.ok || json.error) {
        setRosterError(`Error ${res.status}: ${json.error ?? "Unknown error"}`);
      } else if (json.campers) {
        setRoster(json.campers);
      } else {
        setRosterError("No campers returned. Check that contacts have a source containing 'camp' or '2026'.");
      }
    } catch (err) {
      setRosterError(`Network error: ${String(err)}`);
    } finally {
      setRosterLoad(false);
    }
  }

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
    const arr = Array.from({ length: 6 }, (_, i) => team.players[i] ?? "");
    arr[idx] = value;
    setData({ ...data, teams: data.teams.map(t => t.id === teamId ? { ...t, players: arr } : t) });
  }

  function saveTeams() {
    if (!data) return;
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
    const cleaned = (data.individualEvents ?? []).map(e => ({
      ...e, nominees: e.nominees.map(n => ({ ...n, players: n.players.filter(p => p.trim() !== "") }))
    }));
    save({ individualEvents: cleaned });
  }

  function removeEvent(id: string) {
    if (!data || !confirm("Remove this event?")) return;
    save({ individualEvents: (data.individualEvents ?? []).filter(e => e.id !== id) });
  }

  // ── Drag-and-drop helpers ─────────────────────────────────────────────────
  function handleDragStart(e: React.DragEvent<HTMLDivElement>, cam: CamperRosterEntry) {
    e.dataTransfer.setData("camper", JSON.stringify(cam));
    e.dataTransfer.effectAllowed = "move";
  }
  function handleDragOver(e: React.DragEvent<HTMLDivElement>, teamId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(teamId);
  }
  function handleDragLeave() { setDragOver(null); }
  function handleDrop(e: React.DragEvent<HTMLDivElement>, teamId: string) {
    e.preventDefault();
    setDragOver(null);
    if (!data) return;
    const raw = e.dataTransfer.getData("camper");
    if (!raw) return;
    const cam: CamperRosterEntry = JSON.parse(raw) as CamperRosterEntry;
    const team = data.teams.find(t => t.id === teamId);
    if (!team) return;
    const playerName = cam.displayName;
    if (team.players.includes(playerName)) return;
    const arr = Array.from({ length: 6 }, (_, i) => team.players[i] ?? "");
    const emptyIdx = arr.findIndex(p => !p.trim());
    if (emptyIdx === -1) return;
    arr[emptyIdx] = playerName;
    const updatedTeams = data.teams.map(t => t.id === teamId ? { ...t, players: arr } : t);
    setData({ ...data, teams: updatedTeams });
    setAssignedIds(prev => new Set([...prev, cam.id]));
  }
  function removeFromTeam(teamId: string, playerName: string) {
    if (!data) return;
    const updatedTeams = data.teams.map(t =>
      t.id !== teamId ? t : { ...t, players: t.players.map(p => p === playerName ? "" : p) }
    );
    setData({ ...data, teams: updatedTeams });
    const stillAssigned = updatedTeams.some(t => t.players.some(p => p === playerName));
    if (!stillAssigned) {
      const cam = roster.find(r => r.displayName === playerName || r.fullName === playerName);
      if (cam) setAssignedIds(prev => { const s = new Set(prev); s.delete(cam.id); return s; });
    }
  }

  if (!data) return (
    <div className="flex items-center justify-center h-40 text-gray-500 text-sm">Loading…</div>
  );

  const divTeams = (div: Division) => data.teams.filter(t => t.division === div);
  const teamOpts = (div: Division) => divTeams(div).map(t => ({ id: t.id, name: t.name || "(unnamed)" }));

  // Grade label helper (used in roster section)
  function gradeLabel(g: string) {
    if (!g || g === "Unknown Grade") return g || "Unknown Grade";
    const n = parseInt(g.match(/\d+/)?.[0] ?? "0", 10);
    if (n === 0) return g;
    const suf = n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";
    return `${n}${suf} Grade`;
  }

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
          ["roster",    "📋 Camper Roster"],
          ["teams",     "👥 Teams & Rosters"],
          ["standings", "📊 Standings"],
          ["bracket",   "🏆 Bracket"],
          ["events",    "🎯 Individual Events"],
          ["settings",  "⚙️ Settings"],
        ] as const).map(([s, label]) => (
          <button key={s} onClick={() => setSection(s)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${section === s ? "bg-blue-600 text-white" : "glass border border-white/15 text-gray-400 hover:text-white"}`}>
            {label}
          </button>
        ))}
        {saving && <span className="flex items-center gap-1 text-blue-400 text-sm"><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving…</span>}
        {saved  && <span className="flex items-center gap-1 text-green-400 text-sm"><CheckCircle className="w-3.5 h-3.5" />Saved!</span>}
      </div>

      {/* ── ROSTER ── */}
      {section === "roster" && (
        <div className="space-y-5">
          {/* Header + Load button */}
          <div className="glass rounded-2xl border border-white/10 p-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-white font-black text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />Camper Roster
                </h3>
                <p className="text-gray-500 text-sm mt-0.5">
                  Auto-pulled from 2026 Summer Youth Camp registrations, sorted by grade.
                </p>
              </div>
              <button onClick={loadRoster} disabled={rosterLoad}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl text-sm font-bold text-white transition-all">
                {rosterLoad ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                {roster.length === 0 ? "Load from Registrations" : "Refresh"}
              </button>
            </div>
            {rosterError && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
                ⚠️ {rosterError}
              </div>
            )}
            {roster.length === 0 && !rosterLoad && !rosterError && (
              <p className="text-gray-600 text-sm mt-4 italic">
                Click &quot;Load from Registrations&quot; to pull in all campers from the contact form.
              </p>
            )}
          </div>

          {roster.length > 0 && (() => {
            // Group by grade number, then grade label
            const gradeMap = new Map<number, { label: string; campers: CamperRosterEntry[] }>();
            roster.forEach(cam => {
              const key = cam.gradeNum;
              if (!gradeMap.has(key)) gradeMap.set(key, { label: gradeLabel(cam.grade), campers: [] });
              gradeMap.get(key)!.campers.push(cam);
            });
            const sorted = [...gradeMap.entries()].sort((a, b) => a[0] - b[0]);
            return (
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-blue-500/30 border border-blue-500/50 inline-block" />
                    Unassigned
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-green-500/20 border border-green-500/40 inline-block" />
                    Already on a team ✓
                  </span>
                  <span className="text-gray-600">Drag a name onto any team card below to assign.</span>
                </div>
                {sorted.map(([gradeNum, { label, campers }]) => (
                  <div key={gradeNum} className="glass rounded-2xl border border-white/10 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-black text-white">{label}</span>
                      <span className="text-xs text-gray-500">{campers.length} camper{campers.length !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {campers.map(cam => {
                        const isAssigned = assignedIds.has(cam.id);
                        return (
                          <div
                            key={cam.id}
                            draggable
                            onDragStart={e => handleDragStart(e, cam)}
                            title={`${cam.fullName}${cam.grade ? " · " + cam.grade : ""} — drag to a team`}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold cursor-grab active:cursor-grabbing select-none transition-all border ${
                              isAssigned
                                ? "bg-green-500/15 border-green-500/40 text-green-300 opacity-70"
                                : "bg-blue-500/20 border-blue-500/40 text-blue-200 hover:bg-blue-500/30"
                            }`}
                          >
                            <GripVertical className="w-3 h-3 opacity-40 flex-shrink-0" />
                            {cam.displayName}
                            {isAssigned && <span className="text-green-500 text-[10px] ml-0.5">✓</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Drop zone — team cards */}
          {roster.length > 0 && data.teams.length > 0 && (
            <div className="glass rounded-2xl border border-white/10 p-5">
              <h3 className="text-white font-black text-sm mb-1">🏀 Drop Zone — Assign to Teams</h3>
              <p className="text-gray-500 text-xs mb-4">Drag a name from above onto a team box. Click ✕ next to a name to remove them.</p>
              <div className="space-y-5">
                {(["NBA", "College"] as Division[]).map(div => (
                  <div key={div}>
                    <div className={`text-xs font-black uppercase tracking-widest mb-2 ${div === "NBA" ? "text-orange-400" : "text-blue-400"}`}>
                      {div} Division
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {data.teams.filter(t => t.division === div).map(team => {
                        const isDragTarget  = dragOver === team.id;
                        const filledPlayers = team.players.filter(p => p.trim());
                        const isFull        = filledPlayers.length >= 6;
                        return (
                          <div
                            key={team.id}
                            onDragOver={e => !isFull && handleDragOver(e, team.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={e => handleDrop(e, team.id)}
                            className={`rounded-xl border p-3 transition-all min-h-[80px] ${
                              isDragTarget ? "border-blue-400 bg-blue-500/15 scale-[1.01]"
                              : isFull     ? "border-white/10 bg-white/[0.02] opacity-60"
                              :              "border-white/15 bg-white/[0.03] hover:border-white/25"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-white font-black text-sm">{team.name || "(unnamed)"}</span>
                              <span className={`text-xs font-bold ${isFull ? "text-yellow-500" : "text-gray-600"}`}>
                                {filledPlayers.length}/6{isFull ? " full" : ""}
                              </span>
                            </div>
                            {filledPlayers.length === 0 ? (
                              <p className={`text-xs py-2 text-center rounded-lg border border-dashed ${isDragTarget ? "text-blue-400 border-blue-400/50" : "text-gray-700 border-white/10"}`}>
                                Drop player here
                              </p>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {filledPlayers.map((p, idx) => (
                                  <span key={idx} className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1 text-xs text-white">
                                    {p}
                                    <button onClick={() => removeFromTeam(team.id, p)} className="text-gray-500 hover:text-red-400 ml-0.5 flex-shrink-0">
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                                {!isFull && (
                                  <span className={`text-xs border border-dashed rounded-lg px-2 py-1 ${isDragTarget ? "text-blue-400 border-blue-400/40" : "text-gray-700 border-white/10"}`}>
                                    + drop here
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex justify-end">
                <button onClick={saveTeams}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 rounded-xl text-sm font-bold text-white transition-all">
                  <Save className="w-3.5 h-3.5" />Save All Team Rosters
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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
