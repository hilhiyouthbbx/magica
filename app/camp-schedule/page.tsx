"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ──────────────────────────────────────────────────────────
type RowType = "section" | "normal" | "break" | "game" | "highlight";

interface ScheduleRow {
  id: string;
  time: string;
  activity: string;
  note: string;
  type: RowType;
}

interface DayData {
  label: string;
  date: string;
  theme: string;
  rows: ScheduleRow[];
}

// ─── Default Schedule ────────────────────────────────────────────────
const DEFAULT_SCHEDULE: DayData[] = [
  {
    label: "Day 1", date: "Monday, June 22", theme: "Fundamentals",
    rows: [
      { id:"1-1",  time:"8:30 AM",  activity:"Check-In & Registration",                      note:"",                                 type:"normal"    },
      { id:"1-2",  time:"9:00 AM",  activity:"Welcome, Camp Overview & Introductions",        note:"All campers",                      type:"highlight" },
      { id:"1-3",  time:"9:15 AM",  activity:"Warm-Up & Dynamic Stretching",                  note:"",                                 type:"normal"    },
      { id:"1-4",  time:"9:25 AM",  activity:"SKILL STATION — Ballhandling Fundamentals",     note:"Both courts",                      type:"section"   },
      { id:"1-5",  time:"10:00 AM", activity:"SKILL STATION — Footwork & Pivoting",           note:"Both courts",                      type:"section"   },
      { id:"1-6",  time:"10:35 AM", activity:"SKILL STATION — Passing & Catching",            note:"Both courts",                      type:"section"   },
      { id:"1-7",  time:"11:10 AM", activity:"SKILL STATION — Shooting Form & Arc",           note:"Both courts",                      type:"section"   },
      { id:"1-8",  time:"11:45 AM", activity:"Water Break",                                   note:"5 min",                            type:"break"     },
      { id:"1-9",  time:"12:00 PM", activity:"Lunch Break",                                   note:"45 min",                           type:"break"     },
      { id:"1-10", time:"12:45 PM", activity:"Seeding Round 1 — NBA Division",                note:"2x12-min clock | 1st-4th Grade",   type:"game"      },
      { id:"1-11", time:"1:15 PM",  activity:"Seeding Round 1 — College Division",            note:"2x12-min clock | 5th-8th Grade",   type:"game"      },
      { id:"1-12", time:"1:45 PM",  activity:"SKILL STATION — Defensive Positioning",         note:"Both courts",                      type:"section"   },
      { id:"1-13", time:"2:30 PM",  activity:"Cool Down & Camp Debrief",                      note:"",                                 type:"normal"    },
      { id:"1-14", time:"3:00 PM",  activity:"End of Day",                                    note:"",                                 type:"highlight" },
    ],
  },
  {
    label: "Day 2", date: "Tuesday, June 23", theme: "Team Play",
    rows: [
      { id:"2-1",  time:"8:30 AM",  activity:"Check-In & Warm-Up",                               note:"",                                        type:"normal"    },
      { id:"2-2",  time:"9:00 AM",  activity:"TEAM FORMATION & NAMING",                          note:"NBA: 1st-4th | College: 5th-8th",         type:"highlight" },
      { id:"2-3",  time:"9:15 AM",  activity:"SKILL STATION — Post Moves & Low-Post Finishing",  note:"Both courts",                             type:"section"   },
      { id:"2-4",  time:"9:50 AM",  activity:"SKILL STATION — Shooting Off Screens",             note:"Both courts",                             type:"section"   },
      { id:"2-5",  time:"10:25 AM", activity:"SKILL STATION — Transition Offense / Fast Break",  note:"Both courts",                             type:"section"   },
      { id:"2-6",  time:"11:00 AM", activity:"SKILL STATION — 3-Point & Free Throw Practice",   note:"Both courts",                             type:"section"   },
      { id:"2-7",  time:"11:35 AM", activity:"Water Break",                                      note:"5 min",                                   type:"break"     },
      { id:"2-8",  time:"12:00 PM", activity:"Lunch Break",                                      note:"45 min",                                  type:"break"     },
      { id:"2-9",  time:"12:45 PM", activity:"Seeding Round 2 — NBA Division",                   note:"T1 vs T3 | T2 vs T4 | 2x12-min clock",   type:"game"      },
      { id:"2-10", time:"1:30 PM",  activity:"Seeding Round 2 — College Division",               note:"T1 vs T3 | T2 vs T4 | 2x12-min clock",   type:"game"      },
      { id:"2-11", time:"2:15 PM",  activity:"Championship Contest Preview & Practice",          note:"All campers",                             type:"normal"    },
      { id:"2-12", time:"2:50 PM",  activity:"Cool Down & Team Debrief",                         note:"",                                        type:"normal"    },
      { id:"2-13", time:"3:00 PM",  activity:"End of Day",                                       note:"",                                        type:"highlight" },
    ],
  },
  {
    label: "Day 3", date: "Wednesday, June 24", theme: "Advanced Skills",
    rows: [
      { id:"3-1",  time:"8:30 AM",  activity:"Check-In & Warm-Up",                         note:"",                                        type:"normal"    },
      { id:"3-2",  time:"9:00 AM",  activity:"SKILL STATION — Pick & Roll Offense",        note:"Both courts",                             type:"section"   },
      { id:"3-3",  time:"9:40 AM",  activity:"SKILL STATION — Fast Break & Transition D",  note:"Both courts",                             type:"section"   },
      { id:"3-4",  time:"10:20 AM", activity:"Championship Day Preview / Lineup Cards",    note:"Teams nominate players for each contest", type:"highlight" },
      { id:"3-5",  time:"10:45 AM", activity:"Individual Contest Practice / Shootaround",  note:"All courts",                              type:"normal"    },
      { id:"3-6",  time:"11:30 AM", activity:"Water Break",                                note:"5 min",                                   type:"break"     },
      { id:"3-7",  time:"12:00 PM", activity:"Lunch Break",                                note:"45 min",                                  type:"break"     },
      { id:"3-8",  time:"12:45 PM", activity:"Seeding Round 3 — NBA Division",             note:"T1 vs T4 | T2 vs T3 | 2x12-min clock",   type:"game"      },
      { id:"3-9",  time:"1:45 PM",  activity:"Seeding Round 3 — College Division",         note:"T1 vs T4 | T2 vs T3 | 2x12-min clock",   type:"game"      },
      { id:"3-10", time:"2:45 PM",  activity:"Final Standings Announced",                  note:"All teams",                               type:"highlight" },
      { id:"3-11", time:"2:50 PM",  activity:"Cool Down & Championship Day Prep",          note:"",                                        type:"normal"    },
      { id:"3-12", time:"3:00 PM",  activity:"End of Day",                                 note:"",                                        type:"highlight" },
    ],
  },
  {
    label: "Championship", date: "Thursday, June 25", theme: "Championship Day",
    rows: [
      { id:"4-1",  time:"8:30 AM",  activity:"Doors Open & Warm-Up",                  note:"",                                                type:"normal"    },
      { id:"4-2",  time:"9:00 AM",  activity:"Opening Ceremony",                      note:"All campers",                                     type:"highlight" },
      { id:"4-3",  time:"9:15 AM",  activity:"KNOCKOUT CONTEST — All Camp",           note:"Last one standing wins!",                         type:"game"      },
      { id:"4-4",  time:"10:00 AM", activity:"FREE THROW CONTEST",                    note:"Best of 10, 2 at a time | Tie = Sudden Death",    type:"game"      },
      { id:"4-5",  time:"10:25 AM", activity:"3-POINT CONTEST",                       note:"3 balls at 5 spots | 1 min per shooter",          type:"game"      },
      { id:"4-6",  time:"10:50 AM", activity:"1-ON-1 CONTEST",                        note:"First to 15 points (2s and 3s count)",            type:"game"      },
      { id:"4-7",  time:"11:15 AM", activity:"3-ON-3 CONTEST",                        note:"First to 21 points (2s and 3s count)",            type:"game"      },
      { id:"4-8",  time:"11:40 AM", activity:"LAYUP CONTEST (Team Event)",            note:"Right 1 min + Left 1 min | Team total wins",      type:"game"      },
      { id:"4-9",  time:"12:00 PM", activity:"Lunch / Bracket Reveal",                note:"45 min",                                          type:"break"     },
      { id:"4-10", time:"12:45 PM", activity:"SEMIFINAL GAMES — NBA & College",       note:"Both courts simultaneously | 2x10-min clock",     type:"game"      },
      { id:"4-11", time:"1:15 PM",  activity:"CHAMPIONSHIP GAMES — NBA & College",    note:"Both courts simultaneously | 2x15-min clock",     type:"highlight" },
      { id:"4-12", time:"2:00 PM",  activity:"3rd Place Games — NBA & College",       note:"Both courts simultaneously | 2x10-min clock",     type:"game"      },
      { id:"4-13", time:"2:30 PM",  activity:"AWARDS CEREMONY",                       note:"Trophies, medals & camp awards",                  type:"highlight" },
      { id:"4-14", time:"2:50 PM",  activity:"Photos & Closing Remarks",              note:"",                                                type:"normal"    },
      { id:"4-15", time:"3:00 PM",  activity:"Dismissal",                             note:"",                                                type:"highlight" },
    ],
  },
];


interface CampTeam {
  id: string;
  name: string;
  division: "NBA" | "College";
  coach: string;
  players: string[];
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
}

interface SeedingGame {
  id: string;
  round: 1 | 2 | 3;
  division: "NBA" | "College";
  team1Id: string;
  team2Id: string;
  score1: number | null;
  score2: number | null;
  court: string;
  status: "scheduled" | "live" | "final";
}

interface BracketGame {
  id: string;
  round: "semi" | "final" | "3rd";
  division: "NBA" | "College";
  team1Id: string;
  team2Id: string;
  score1: number | null;
  score2: number | null;
  court: string;
  status: "scheduled" | "live" | "final";
}

interface IndividualEvent {
  id: string;
  name: string;
  division: "NBA" | "College";
  nominees: { teamId: string; players: string[] }[];
  winner?: string;
  runnerUp?: string;
  status: "upcoming" | "live" | "complete";
}

// ─── Row styling ─────────────────────────────────────────────────────
function rowBg(type: RowType) {
  if (type === "section")   return "bg-[#1B2A5E]/70 border-l-4 border-[#F4A800]";
  if (type === "game")      return "bg-[#F4A800]/8 border-l-4 border-[#F4A800]/40";
  if (type === "break")     return "bg-white/3 opacity-60";
  if (type === "highlight") return "bg-[#E03A3A]/8 border-l-4 border-[#E03A3A]/40";
  return "hover:bg-white/4";
}
function timeColor(type: RowType) {
  return type === "section" ? "text-[#F4A800] font-bold" : "text-white/35";
}
function actColor(type: RowType) {
  if (type === "section")   return "text-[#F4A800] font-bold";
  if (type === "highlight") return "text-white font-semibold";
  if (type === "game")      return "text-white font-medium";
  if (type === "break")     return "text-white/40 italic";
  return "text-white/75";
}

// ─── Public Page (read-only) ──────────────────────────────────────────
export default function CampHubPage() {
  const [schedule, setSchedule] = useState<DayData[]>(DEFAULT_SCHEDULE);
  const [activeDay, setActiveDay] = useState(0);
  // active = schedule page is visible to public
  const [isActive, setIsActive] = useState(false);
  // unlockedThrough: 0=none, 1=Day1 only, 2=Days1-2, 3=Days1-3, 4=all
  const [unlockedThrough, setUnlockedThrough] = useState(0);
  // loaded = API response received (prevents flash of wrong state)
  const [loaded, setLoaded] = useState(false);
  // Only auto-select day tab on the very first API response; user picks after that
  const autoSelected = useRef(false);
  // Teams for the Rosters tab
  const [teams, setTeams] = useState<CampTeam[]>([]);
  // Championship game data
  const [bracketGames, setBracketGames] = useState<BracketGame[]>([]);
  const [seedingGames, setSeedingGames] = useState<SeedingGame[]>([]);
  const [individualEvents, setIndividualEvents] = useState<IndividualEvent[]>([]);
  // Top-level view toggle
  const [activeView, setActiveView] = useState<"schedule" | "rosters" | "brackets">("schedule");

  const fetchStatus = useCallback(() => {
    fetch("/api/camp-schedule", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { dailySchedule?: DayData[]; active?: boolean; currentDay?: number; teams?: CampTeam[]; bracketGames?: BracketGame[]; seedingGames?: SeedingGame[]; individualEvents?: IndividualEvent[] }) => {
        if (d.dailySchedule && Array.isArray(d.dailySchedule) && d.dailySchedule.length > 0) {
          setSchedule(d.dailySchedule);
        }
        if (d.teams && Array.isArray(d.teams)) setTeams(d.teams);
        if (d.bracketGames && Array.isArray(d.bracketGames)) setBracketGames(d.bracketGames);
        if (d.seedingGames && Array.isArray(d.seedingGames)) setSeedingGames(d.seedingGames);
        if (d.individualEvents && Array.isArray(d.individualEvents)) setIndividualEvents(d.individualEvents);
        const active = d.active === true;
        const through = typeof d.currentDay === "number" ? d.currentDay : 0;
        setIsActive(active);
        setUnlockedThrough(through);
        // Auto-select the latest unlocked day tab — first load only
        if (!autoSelected.current && active && through > 0) {
          setActiveDay(Math.min(through - 1, 3));
          autoSelected.current = true;
        }
      })
      .catch(() => {
        setIsActive(false);
      })
      .finally(() => setLoaded(true));
  }, []); // fetchStatus never changes — safe to omit deps

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 30_000);
    const onFocus = () => fetchStatus();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchStatus]);

  // Helper: is this day tab unlocked?
  const isDayUnlocked = (i: number) => (i + 1) <= unlockedThrough;

  const current = schedule[activeDay] ?? DEFAULT_SCHEDULE[0];

  // ── Spinner while waiting for first API response ──
  if (!loaded) {
    return (
      <div className="min-h-screen bg-[#080C14] flex items-center justify-center" style={{ fontFamily: "system-ui, sans-serif" }}>
        <span className="text-white/30 text-sm animate-pulse">Loading…</span>
      </div>
    );
  }

  // ── Schedule hidden by admin ──
  if (!isActive) {
    return (
      <div className="min-h-screen bg-[#080C14] flex flex-col items-center justify-center text-center px-4" style={{ fontFamily: "system-ui, sans-serif" }}>
        <div className="text-6xl mb-6">🏀</div>
        <h1 className="text-3xl font-black uppercase text-white mb-2">Hilhi Youth Hoop Camp</h1>
        <div className="text-4xl font-black mb-4" style={{ color: "#F4A800" }}>2026</div>
        <p className="text-white/40 text-sm max-w-xs">The camp schedule is not available right now. Check back soon!</p>
        <div className="mt-8 text-xs text-white/20">June 22–25, 2026 · Hillsboro, OR</div>
      </div>
    );
  }

  // ── Full schedule page ──
  return (
    <div className="min-h-screen bg-[#080C14] text-white" style={{ fontFamily: "system-ui, sans-serif" }}>

      {/* HERO */}
      <div className="relative bg-gradient-to-b from-[#0D1520] to-[#080C14] px-4 pt-10 pb-8 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% -20%, rgba(244,168,0,.1) 0%, transparent 60%)" }} />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-black uppercase leading-tight mb-2">
            Hilhi Summer Youth Hoop Camp
          </h1>
          <div className="text-5xl md:text-7xl font-black mb-3" style={{ color: "#F4A800" }}>2026</div>
          <p className="text-white/45 mb-5">June 22–25, 2026 · Follow the action in real time</p>
          <div className="flex flex-wrap justify-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-full bg-white/10">Grades 1st–8th</span>
            <span className="text-xs px-3 py-1.5 rounded-full bg-white/10">8:30 AM – 3:00 PM</span>
            <span className="text-xs px-3 py-1.5 rounded-full font-bold" style={{ background: "#F4A800", color: "#0B0F1A" }}>NBA: 1st–4th Grade</span>
            <span className="text-xs px-3 py-1.5 rounded-full font-bold bg-[#E03A3A]">College: 5th–8th Grade</span>
          </div>
        </div>
      </div>

      {/* TAB BAR */}
      <div className="sticky top-0 z-40 bg-[#0D1520]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-4xl mx-auto flex overflow-x-auto">
          {/* View toggle */}
          <div className="flex border-r border-white/10 mr-1 pr-1 flex-shrink-0">
            <button
              onClick={() => setActiveView("schedule")}
              className={`px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${activeView === "schedule" ? "border-[#F4A800] text-[#F4A800]" : "border-transparent text-white/40 hover:text-white/60"}`}
            >
              📅 Schedule
            </button>
            <button
              onClick={() => setActiveView("rosters")}
              className={`px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${activeView === "rosters" ? "border-[#F4A800] text-[#F4A800]" : "border-transparent text-white/40 hover:text-white/60"}`}
            >
              👥 Teams
            </button>
            <button
              onClick={() => setActiveView("brackets")}
              className={`px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${activeView === "brackets" ? "border-[#F4A800] text-[#F4A800]" : "border-transparent text-white/40 hover:text-white/60"}`}
            >
              🏆 Brackets
            </button>
          </div>
          {schedule.map((d, i) => (
            <button
              key={i}
              onClick={() => { setActiveDay(i); setActiveView("schedule"); }}
              className={[
                "relative flex-shrink-0 px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap",
                activeDay === i
                  ? "border-[#F4A800] text-[#F4A800]"
                  : isDayUnlocked(i)
                  ? "border-transparent text-white/40 hover:text-white/70"
                  : "border-transparent text-white/20",
              ].join(" ")}
            >
              {!isDayUnlocked(i) && <span className="mr-1 opacity-40">🔒</span>}
              {d.label}
              {i === 3 && isDayUnlocked(i) && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-black bg-[#E03A3A] text-white">FINALS</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* SCHEDULE CONTENT */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* ── ROSTERS VIEW ── */}
        {activeView === "rosters" && (
          <div>
            {teams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-white/10 bg-white/2">
                <div className="text-4xl mb-4">🏀</div>
                <h3 className="text-white font-black text-lg uppercase mb-2">Teams Coming Soon</h3>
                <p className="text-white/35 text-sm max-w-xs">Team rosters will be posted before camp begins.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {(["NBA", "College"] as const).map(div => {
                  const divTeams = teams.filter(t => t.division === div);
                  if (divTeams.length === 0) return null;
                  return (
                    <div key={div}>
                      <div className={`flex items-center gap-2 mb-3`}>
                        <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${div === "NBA" ? "bg-[#1B2A5E] text-[#F4A800]" : "bg-[#E03A3A] text-white"}`}>{div} Division</span>
                        <span className="text-white/28 text-xs">{div === "NBA" ? "1st – 4th Grade" : "5th – 8th Grade"}</span>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {divTeams.map(team => {
                          const players = team.players.filter(p => p.trim());
                          return (
                            <div key={team.id} className="rounded-2xl border border-white/10 overflow-hidden">
                              {/* Team header */}
                              <div className="px-4 py-3 flex items-center justify-between" style={{ background: div === "NBA" ? "#1B2A5E" : "#E03A3A" }}>
                                <div>
                                  <div className="text-base font-black text-white">{team.name || "TBD"}</div>
                                  {team.coach && <div className="text-xs opacity-60 text-white mt-0.5">Coach: {team.coach}</div>}
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-black text-white/20">{players.length}</div>
                                  <div className="text-[10px] text-white/40 uppercase tracking-wider">players</div>
                                </div>
                              </div>
                              {/* Player list */}
                              <div className="bg-white/3 divide-y divide-white/5">
                                {players.length === 0 ? (
                                  <div className="px-4 py-3 text-xs text-white/25 italic">Roster not yet posted</div>
                                ) : (
                                  players.map((p, i) => (
                                    <div key={i} className="px-4 py-2.5 flex items-center gap-3">
                                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[11px] font-bold text-white/40 flex-shrink-0">{i + 1}</div>
                                      <div className="text-sm text-white/75">{p}</div>
                                    </div>
                                  ))
                                )}
                              </div>
                              {/* Record (show once games are played) */}
                              {(team.wins > 0 || team.losses > 0) && (
                                <div className="px-4 py-2 bg-white/5 flex gap-4 text-xs">
                                  <span className="text-green-400 font-bold">{team.wins}W</span>
                                  <span className="text-red-400 font-bold">{team.losses}L</span>
                                  <span className="text-white/28">{team.pointsFor} PF / {team.pointsAgainst} PA</span>
                                </div>
                              )}
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
        )}

        {/* ── SCHEDULE VIEW ── */}
        {activeView === "brackets" && (() => {
          const teamName = (id: string) => teams.find(t => t.id === id)?.name || "";

          function GameCard({ game, accent }: { game: BracketGame; accent: string }) {
            const t1 = teamName(game.team1Id) || "TBD";
            const t2 = teamName(game.team2Id) || "TBD";
            const done = game.status === "final";
            const live = game.status === "live";
            const w1 = done && game.score1 !== null && game.score2 !== null && game.score1 > game.score2;
            const w2 = done && game.score1 !== null && game.score2 !== null && game.score2 > game.score1;
            return (
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-10">

              {/* ── CHAMPIONSHIP BRACKET ── */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-6 rounded-full bg-[#F4A800]" />
                  <h2 className="text-base font-black uppercase text-white tracking-wide">🏆 Championship Bracket</h2>
                  <span className="text-[11px] text-white/30 font-medium">June 25 · Championship Day</span>
                </div>

                {bracketGames.length === 0 ? (
                  <div className="space-y-8">
                    {(["NBA", "College"] as const).map(div => {
                      const divColor  = div === "NBA" ? "#1B2A5E" : "#7B1212";
                      const accent    = div === "NBA" ? "#F4A800" : "#FECACA";
                      const gradeTag  = div === "NBA" ? "1st – 4th Grade" : "5th – 8th Grade";
                      return (
                        <div key={div} className="rounded-2xl border border-white/10 overflow-hidden">
                          <div className="px-5 py-3 flex items-center gap-3" style={{ background: divColor }}>
                            <span className="text-sm font-black text-white uppercase tracking-wide">{div} Division</span>
                            <span className="text-[11px] text-white/50">{gradeTag}</span>
                          </div>
                          <div className="bg-[#080C14] p-5">
                            <div className="flex items-center gap-0">
                              <div className="flex flex-col gap-3 w-[44%]">
                                {[["Semifinal 1","#1 Seed","#4 Seed"],["Semifinal 2","#2 Seed","#3 Seed"]].map(([lbl,s1,s2]) => (
                                  <div key={lbl} className="rounded-xl border border-white/10 overflow-hidden">
                                    <div className="text-[9px] font-black text-white/20 uppercase tracking-widest px-3 py-1.5 bg-white/3 border-b border-white/5 text-center">{lbl}</div>
                                    {[s1,s2].map((seed,si) => (
                                      <div key={si} className={`flex items-center justify-between px-3 py-2.5 ${si===0?"border-b border-white/8":""}`}>
                                        <span className="text-xs text-white/25 italic font-semibold">{seed}</span>
                                        <span className="text-white/10 text-xs">–</span>
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                              <div className="w-[12%] self-stretch relative">
                                <div className="absolute left-0 top-[25%] w-full h-[50%] border-t-2 border-b-2 border-r-2 rounded-r-lg" style={{ borderColor: `${accent}30` }} />
                                <div className="absolute right-0 top-1/2 w-1/2 border-t-2 -translate-y-px" style={{ borderColor: `${accent}30` }} />
                              </div>
                              <div className="flex flex-col gap-3 w-[44%]">
                                <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${accent}40` }}>
                                  <div className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 text-center" style={{ background: `${accent}18`, color: accent }}>🏆 Championship</div>
                                  {["Winner – Semi 1","Winner – Semi 2"].map((lbl,li) => (
                                    <div key={li} className={`flex items-center justify-between px-3 py-2.5 ${li===0?"border-b border-white/8":""}`}>
                                      <span className="text-xs text-white/20 italic">{lbl}</span>
                                      <span className="text-white/10 text-xs">–</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="rounded-xl border border-white/8 overflow-hidden">
                                  <div className="text-[9px] font-black text-white/20 uppercase tracking-widest px-3 py-1.5 bg-white/3 border-b border-white/5 text-center">3rd Place</div>
                                  {["Loser – Semi 1","Loser – Semi 2"].map((lbl,li) => (
                                    <div key={li} className={`flex items-center justify-between px-3 py-2.5 ${li===0?"border-b border-white/8":""}`}>
                                      <span className="text-xs text-white/20 italic">{lbl}</span>
                                      <span className="text-white/10 text-xs">–</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <p className="text-center text-[11px] text-white/20 mt-5 italic">Brackets revealed after seeding rounds · Championship Day June 25</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-8">
                    {(["NBA", "College"] as const).map(div => {
                      const divColor = div === "NBA" ? "#1B2A5E" : "#7B1212";
                      const accent   = div === "NBA" ? "#F4A800" : "#FECACA";
                      const gradeTag = div === "NBA" ? "1st – 4th Grade" : "5th – 8th Grade";
                      const semis  = bracketGames.filter(g => g.division === div && g.round === "semi");
                      const finals = bracketGames.filter(g => g.division === div && g.round === "final");
                      const thirds = bracketGames.filter(g => g.division === div && g.round === "3rd");

                      function BracketSlot({ game, label, isChamp }: { game?: BracketGame; label: string; isChamp?: boolean }) {
                        const t1 = game ? (teamName(game.team1Id) || "TBD") : "TBD";
                        const t2 = game ? (teamName(game.team2Id) || "TBD") : "TBD";
                        const done = game?.status === "final";
                        const live = game?.status === "live";
                        const w1 = done && game!.score1 != null && game!.score2 != null && game!.score1 > game!.score2;
                        const w2 = done && game!.score1 != null && game!.score2 != null && game!.score2 > game!.score1;
                        return (
                          <div className={`rounded-xl overflow-hidden ${live ? "ring-2 ring-red-500 shadow-lg shadow-red-500/20" : ""}`}
                               style={{ border: `1px solid ${isChamp ? accent+"50" : "rgba(255,255,255,0.1)"}` }}>
                            {live && (
                              <div className="flex items-center gap-1.5 px-3 py-1 bg-red-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Live Now</span>
                              </div>
                            )}
                            <div className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 text-center"
                                 style={{ background: isChamp ? `${accent}18` : "rgba(255,255,255,0.02)", color: isChamp ? accent : "rgba(255,255,255,0.2)" }}>
                              {isChamp ? "🏆 " : ""}{label}{done && !live ? " · Final" : ""}
                            </div>
                            {([{name:t1,score:game?.score1??null,win:w1},{name:t2,score:game?.score2??null,win:w2}]).map((row,ri) => (
                              <div key={ri} className={`flex items-center justify-between px-3 py-2.5 ${ri===0?"border-b border-white/8":""} ${row.win?"bg-white/5":""}`}>
                                <span className={`text-xs font-bold flex-1 truncate ${row.win?"text-white":"text-white/55"}`}>{row.name}</span>
                                <div className="flex items-center gap-1.5 ml-2">
                                  {row.score !== null
                                    ? <span className={`text-lg font-black ${row.win?"text-white":"text-white/30"}`}>{row.score}</span>
                                    : <span className="text-white/15 text-xs">–</span>}
                                  {row.win && <span className="text-[10px] font-black px-1.5 py-0.5 rounded" style={{ background: accent, color:"#000" }}>W</span>}
                                </div>
                              </div>
                            ))}
                            {game?.court && <div className="px-3 py-1 text-[9px] text-white/15 border-t border-white/5">{game.court}</div>}
                          </div>
                        );
                      }

                      return (
                        <div key={div} className="rounded-2xl border border-white/10 overflow-hidden">
                          <div className="px-5 py-3 flex items-center gap-3" style={{ background: divColor }}>
                            <span className="text-sm font-black text-white uppercase tracking-wide">{div} Division</span>
                            <span className="text-[11px] text-white/50">{gradeTag}</span>
                          </div>
                          <div className="bg-[#080C14] p-5">
                            <div className="flex items-center gap-0">
                              <div className="flex flex-col gap-3 w-[44%]">
                                <BracketSlot game={semis[0]} label="Semifinal 1" />
                                <BracketSlot game={semis[1]} label="Semifinal 2" />
                              </div>
                              <div className="w-[12%] self-stretch relative">
                                <div className="absolute left-0 top-[25%] w-full h-[50%] border-t-2 border-b-2 border-r-2 rounded-r-lg" style={{ borderColor: `${accent}35` }} />
                                <div className="absolute right-0 top-1/2 w-1/2 border-t-2 -translate-y-px" style={{ borderColor: `${accent}35` }} />
                              </div>
                              <div className="flex flex-col gap-3 w-[44%]">
                                <BracketSlot game={finals[0]} label="Championship" isChamp={true} />
                                <BracketSlot game={thirds[0]} label="3rd Place" />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── INDIVIDUAL CONTESTS ── */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-6 rounded-full bg-[#E03A3A]" />
                  <h2 className="text-base font-black uppercase text-white tracking-wide">⚡ Individual Contests</h2>
                  <span className="text-[11px] text-white/30 font-medium">Championship Day · June 25</span>
                </div>
                {individualEvents.length === 0 ? (
                  <div className="rounded-2xl border border-white/8 bg-white/2 px-6 py-8 text-center">
                    <div className="text-4xl mb-3">⚡</div>
                    <p className="text-white/50 text-sm font-semibold">Individual Contest results posted on Championship Day</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {individualEvents.map(evt => {
                      const allPlayers = evt.nominees.flatMap((n: EventNominee) => n.players);
                      return (
                        <div key={evt.id} className="rounded-xl border border-white/10 bg-white/2 overflow-hidden">
                          <div className="px-4 py-2.5 bg-white/4 border-b border-white/8 flex items-center justify-between">
                            <span className="text-sm font-black text-white uppercase tracking-wide">{evt.name}</span>
                            {evt.winner && <span className="text-[10px] font-bold text-[#F4A800] uppercase">Final</span>}
                          </div>
                          <div className="px-4 py-3 space-y-1.5">
                            {evt.winner ? (
                              <>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-[#F4A800] font-black uppercase tracking-widest">🥇 Winner</span>
                                  <span className="text-sm text-white font-bold">{evt.winner}</span>
                                </div>
                                {evt.runnerUp && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-white/40 font-black uppercase tracking-widest">🥈 Runner-Up</span>
                                    <span className="text-sm text-white/70 font-semibold">{evt.runnerUp}</span>
                                  </div>
                                )}
                              </>
                            ) : allPlayers.length === 0 ? (
                              <p className="text-xs text-white/25 italic">Nominees will be announced soon</p>
                            ) : (
                              <>
                                <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-2">Nominees</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {allPlayers.map((player: string, pi: number) => (
                                    <span key={pi} className="text-xs px-2.5 py-1 rounded-full bg-white/8 text-white/70 font-semibold">{player}</span>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          );
          })()}


                {/* 4-Day Overview */}
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white/28 bg-white/3 border-b border-white/10">
            4-Day Camp Overview
          </div>
          {schedule.map((d, i) => (
            <button key={i} onClick={() => { setActiveDay(i); setActiveView("schedule"); }}
              className="w-full flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors text-left">
              <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center text-white flex-shrink-0"
                style={{ background: i === 3 ? "#E03A3A" : "#1B2A5E" }}>
                <span className="text-[9px] opacity-60 leading-none">Jun</span>
                <span className="text-base font-black leading-tight">{22 + i}</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white/75">{d.label}{i === 3 ? " — Championship" : ""}</div>
                <div className="text-xs text-white/28">{d.date}, 2026 · {d.theme}</div>
              </div>
              {isDayUnlocked(i)
                ? <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-700 text-white">OPEN</span>
                : <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-white/30">SOON</span>}
              <span className="text-white/20">›</span>
            </button>
          ))}
        </div>
      </>)}
      </div>

      <footer className="bg-[#0D1520] border-t border-white/10 py-6 text-center">
        <div className="text-base font-black uppercase"><span style={{ color: "#F4A800" }}>HILHI</span> Youth Hoop Camp 2026</div>
        <div className="text-xs text-white/28 mt-1">June 22–25, 2026 · Grades 1st–8th · NBA: 1st–4th · College: 5th–8th</div>
      </footer>
    </div>
  );
}
