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
      { id:"1-1",  time:"7:30 AM",  activity:"Check-In & Registration",                      note:"",                                 type:"normal"    },
      { id:"1-2",  time:"8:00 AM",  activity:"Welcome, Camp Overview & Introductions",        note:"All campers",                      type:"highlight" },
      { id:"1-3",  time:"8:15 AM",  activity:"Warm-Up & Dynamic Stretching",                  note:"",                                 type:"normal"    },
      { id:"1-4",  time:"8:30 AM",  activity:"SKILL STATION — Ballhandling Fundamentals",     note:"Both courts",                      type:"section"   },
      { id:"1-5",  time:"9:15 AM",  activity:"SKILL STATION — Footwork & Pivoting",           note:"Both courts",                      type:"section"   },
      { id:"1-6",  time:"10:00 AM", activity:"SKILL STATION — Passing & Catching",            note:"Both courts",                      type:"section"   },
      { id:"1-7",  time:"10:45 AM", activity:"Water Break",                                   note:"5 min",                            type:"break"     },
      { id:"1-8",  time:"11:00 AM", activity:"Seeding Round 1 — NBA Division",                note:"2x12-min clock | 1st-4th Grade",   type:"game"      },
      { id:"1-9",  time:"11:30 AM", activity:"Seeding Round 1 — College Division",            note:"2x12-min clock | 5th-8th Grade",   type:"game"      },
      { id:"1-10", time:"12:00 PM", activity:"Lunch Break",                                   note:"45 min",                           type:"break"     },
      { id:"1-11", time:"12:45 PM", activity:"SKILL STATION — Shooting Form & Arc",           note:"Both courts",                      type:"section"   },
      { id:"1-12", time:"1:30 PM",  activity:"SKILL STATION — Defensive Positioning",         note:"Both courts",                      type:"section"   },
      { id:"1-13", time:"2:15 PM",  activity:"Cool Down & Camp Debrief",                      note:"",                                 type:"normal"    },
      { id:"1-14", time:"3:00 PM",  activity:"End of Day",                                    note:"",                                 type:"highlight" },
    ],
  },
  {
    label: "Day 2", date: "Tuesday, June 23", theme: "Team Play",
    rows: [
      { id:"2-1",  time:"7:30 AM",  activity:"Check-In & Warm-Up",                               note:"",                                        type:"normal"    },
      { id:"2-2",  time:"8:00 AM",  activity:"TEAM FORMATION & NAMING",                           note:"NBA: 1st-4th | College: 5th-8th",          type:"highlight" },
      { id:"2-3",  time:"8:15 AM",  activity:"SKILL STATION — Post Moves & Low-Post Finishing",   note:"Both courts",                              type:"section"   },
      { id:"2-4",  time:"9:00 AM",  activity:"SKILL STATION — Shooting Off Screens",              note:"Both courts",                              type:"section"   },
      { id:"2-5",  time:"9:45 AM",  activity:"Water Break",                                       note:"5 min",                                    type:"break"     },
      { id:"2-6",  time:"10:00 AM", activity:"Seeding Round 2 — NBA Division",                    note:"T1 vs T3 | T2 vs T4 | 2x12-min clock",    type:"game"      },
      { id:"2-7",  time:"11:00 AM", activity:"Seeding Round 2 — College Division",                note:"T1 vs T3 | T2 vs T4 | 2x12-min clock",    type:"game"      },
      { id:"2-8",  time:"12:00 PM", activity:"Lunch Break",                                       note:"45 min",                                   type:"break"     },
      { id:"2-9",  time:"12:45 PM", activity:"SKILL STATION — Transition Offense / Fast Break",   note:"Both courts",                              type:"section"   },
      { id:"2-10", time:"1:30 PM",  activity:"SKILL STATION — 3-Point & Free Throw Practice",     note:"Both courts",                              type:"section"   },
      { id:"2-11", time:"2:15 PM",  activity:"Championship Contest Preview & Practice",            note:"All campers",                              type:"normal"    },
      { id:"2-12", time:"3:00 PM",  activity:"End of Day",                                        note:"",                                         type:"highlight" },
    ],
  },
  {
    label: "Day 3", date: "Wednesday, June 24", theme: "Advanced Skills",
    rows: [
      { id:"3-1",  time:"7:30 AM",  activity:"Check-In & Warm-Up",                          note:"",                                        type:"normal"    },
      { id:"3-2",  time:"8:00 AM",  activity:"SKILL STATION — Pick & Roll Offense",         note:"Both courts",                              type:"section"   },
      { id:"3-3",  time:"8:45 AM",  activity:"SKILL STATION — Fast Break & Transition D",   note:"Both courts",                              type:"section"   },
      { id:"3-4",  time:"9:30 AM",  activity:"Seeding Round 3 — NBA Division",              note:"T1 vs T4 | T2 vs T3 | 2x12-min clock",    type:"game"      },
      { id:"3-5",  time:"10:30 AM", activity:"Water Break",                                 note:"5 min",                                    type:"break"     },
      { id:"3-6",  time:"10:45 AM", activity:"Seeding Round 3 — College Division",          note:"T1 vs T4 | T2 vs T3 | 2x12-min clock",    type:"game"      },
      { id:"3-7",  time:"11:45 AM", activity:"Championship Day Preview / Lineup Cards",     note:"Teams nominate players for each contest",  type:"highlight" },
      { id:"3-8",  time:"12:15 PM", activity:"Lunch Break",                                 note:"45 min",                                   type:"break"     },
      { id:"3-9",  time:"1:00 PM",  activity:"Individual Contest Practice / Shootaround",   note:"All courts",                               type:"normal"    },
      { id:"3-10", time:"2:00 PM",  activity:"Final Standings Announced",                   note:"All teams",                                type:"highlight" },
      { id:"3-11", time:"2:30 PM",  activity:"Cool Down & Championship Day Prep",           note:"",                                         type:"normal"    },
      { id:"3-12", time:"3:00 PM",  activity:"End of Day",                                  note:"",                                         type:"highlight" },
    ],
  },
  {
    label: "Championship", date: "Thursday, June 25", theme: "Championship Day",
    rows: [
      { id:"4-1",  time:"7:30 AM",  activity:"Doors Open & Warm-Up",                  note:"",                                              type:"normal"    },
      { id:"4-2",  time:"8:00 AM",  activity:"Opening Ceremony",                      note:"All campers",                                   type:"highlight" },
      { id:"4-3",  time:"8:15 AM",  activity:"KNOCKOUT CONTEST — All Camp",           note:"Last one standing wins!",                       type:"game"      },
      { id:"4-4",  time:"9:00 AM",  activity:"FREE THROW CONTEST",                    note:"Best of 10, 2 at a time | Tie = Sudden Death",  type:"game"      },
      { id:"4-5",  time:"9:30 AM",  activity:"3-POINT CONTEST",                       note:"3 balls at 5 spots | 1 min per shooter",        type:"game"      },
      { id:"4-6",  time:"10:00 AM", activity:"1-ON-1 CONTEST",                        note:"First to 15 points (2s and 3s count)",          type:"game"      },
      { id:"4-7",  time:"10:30 AM", activity:"3-ON-3 CONTEST",                        note:"First to 21 points (2s and 3s count)",          type:"game"      },
      { id:"4-8",  time:"11:15 AM", activity:"LAYUP CONTEST (Team Event)",            note:"Right 1 min + Left 1 min | Team total wins",    type:"game"      },
      { id:"4-9",  time:"12:00 PM", activity:"Lunch / Bracket Reveal",                note:"45 min",                                        type:"break"     },
      { id:"4-10", time:"12:45 PM", activity:"SEMIFINAL GAMES — NBA Division",        note:"#1 vs #4 | #2 vs #3 | 2x12-min clock",         type:"game"      },
      { id:"4-11", time:"1:25 PM",  activity:"SEMIFINAL GAMES — College Division",    note:"#1 vs #4 | #2 vs #3 | 2x12-min clock",         type:"game"      },
      { id:"4-12", time:"2:05 PM",  activity:"CHAMPIONSHIP GAME — NBA Division",      note:"Semifinal winners | 2x20-min clock",             type:"highlight" },
      { id:"4-13", time:"2:45 PM",  activity:"CHAMPIONSHIP GAME — College Division",  note:"Semifinal winners | 2x20-min clock",             type:"highlight" },
      { id:"4-14", time:"3:30 PM",  activity:"AWARDS CEREMONY",                       note:"Trophies, medals & camp awards",                type:"highlight" },
      { id:"4-15", time:"3:50 PM",  activity:"Photos & Closing Remarks",              note:"",                                              type:"normal"    },
      { id:"4-16", time:"4:00 PM",  activity:"Dismissal",                             note:"",                                              type:"highlight" },
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

interface StandingRow {
  team: CampTeam;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  diff: number;
  gamesPlayed: number;
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
  const [activeView, setActiveView] = useState<"schedule" | "standings" | "rosters">("schedule");

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

  function isPlayedPoolGame(game: SeedingGame) {
    const s1 = typeof game.score1 === "number" ? game.score1 : null;
    const s2 = typeof game.score2 === "number" ? game.score2 : null;
    return s1 !== null && s2 !== null && (game.status === "final" || s1 > 0 || s2 > 0);
  }

  function teamName(id: string) {
    return teams.find(t => t.id === id)?.name || id || "TBD";
  }

  function calcPoolStandings(division: "NBA" | "College"): StandingRow[] {
    const divTeams = teams.filter(t => t.division === division);
    const rows = new Map<string, StandingRow>();
    divTeams.forEach(team => rows.set(team.id, {
      team,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      diff: 0,
      gamesPlayed: 0,
    }));

    seedingGames
      .filter(game => game.division === division && isPlayedPoolGame(game))
      .forEach(game => {
        const s1 = game.score1 ?? 0;
        const s2 = game.score2 ?? 0;
        const t1 = rows.get(game.team1Id);
        const t2 = rows.get(game.team2Id);
        if (!t1 || !t2) return;

        t1.pointsFor += s1;
        t1.pointsAgainst += s2;
        t1.diff = t1.pointsFor - t1.pointsAgainst;
        t1.gamesPlayed += 1;

        t2.pointsFor += s2;
        t2.pointsAgainst += s1;
        t2.diff = t2.pointsFor - t2.pointsAgainst;
        t2.gamesPlayed += 1;

        if (s1 > s2) {
          t1.wins += 1;
          t2.losses += 1;
        } else if (s2 > s1) {
          t2.wins += 1;
          t1.losses += 1;
        }
      });

    return Array.from(rows.values()).sort((a, b) =>
      b.wins - a.wins ||
      b.diff - a.diff ||
      b.pointsFor - a.pointsFor ||
      a.pointsAgainst - b.pointsAgainst ||
      a.team.name.localeCompare(b.team.name)
    );
  }

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
            <span className="text-xs px-3 py-1.5 rounded-full bg-white/10">7:30 AM – 3:00 PM</span>
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
              onClick={() => setActiveView("standings")}
              className={`px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${activeView === "standings" ? "border-[#F4A800] text-[#F4A800]" : "border-transparent text-white/40 hover:text-white/60"}`}
            >
              📊 Standings
            </button>
            <button
              onClick={() => setActiveView("rosters")}
              className={`px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${activeView === "rosters" ? "border-[#F4A800] text-[#F4A800]" : "border-transparent text-white/40 hover:text-white/60"}`}
            >
              👥 Teams
            </button>
          </div>
          {schedule.map((d, i) => (
            <button
              key={i}
              onClick={() => setActiveDay(i)}
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
        {activeView === "schedule" && (<>

        {/* Day header */}
        <div className="mb-4">
          <h2 className="text-lg font-black uppercase" style={{ color: "#F4A800" }}>
            {current.label}
            {activeDay === 3 && <span className="ml-2 text-sm text-[#E03A3A]">— Championship Day</span>}
          </h2>
          <p className="text-xs text-white/35 mt-0.5">{current.date}, 2026 · {current.theme}</p>
        </div>

        {/* COMING SOON — day locked */}
        {!isDayUnlocked(activeDay) && (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-white/10 bg-white/2 mb-6">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-white font-black text-lg uppercase mb-2">{current.label} — Coming Soon</h3>
            <p className="text-white/35 text-sm max-w-xs">
              {activeDay === 3
                ? "The Championship schedule will be revealed on Thursday, June 25."
                : `The ${current.label} schedule will be posted on ${current.date}.`}
            </p>
            <p className="text-white/20 text-xs mt-4">Check back soon!</p>
          </div>
        )}

        {/* SCHEDULE TABLE — day unlocked */}
        {isDayUnlocked(activeDay) && (
          <div className="rounded-2xl overflow-hidden border border-white/10 mb-6">
            <div className="grid grid-cols-[90px_1fr_1fr] px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-white/30 bg-white/5 border-b border-white/10">
              <div>Time</div><div>Activity</div><div>Notes</div>
            </div>
            {current.rows.map((row) => (
              <div key={row.id} className={`grid grid-cols-[90px_1fr_1fr] px-4 py-2.5 border-b border-white/5 last:border-0 items-start ${rowBg(row.type)}`}>
                <div className={`text-xs font-mono pt-0.5 ${timeColor(row.type)}`}>{row.time}</div>
                <div className={`text-xs leading-snug ${actColor(row.type)}`}>
                  {row.activity}
                  {row.note && <div className="text-[11px] text-white/28 mt-0.5 sm:hidden">{row.note}</div>}
                </div>
                <div className="text-[11px] text-white/28 hidden sm:block pt-0.5 leading-relaxed">{row.note}</div>
              </div>
            ))}
          </div>
        )}

        {/* Seeding schedule — Days 1-3 */}
        {isDayUnlocked(activeDay) && activeDay < 3 && (() => {
          // Highlight TODAY based on the actual calendar date, not which tab is open
          const campDay = ["2026-06-22","2026-06-23","2026-06-24"].indexOf(
            new Date().toLocaleDateString("en-CA") // "YYYY-MM-DD" in local time
          );
          return (
            <div className="mb-6">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-2">Seeding Schedule — Both Divisions</h3>
              <div className="rounded-xl border border-white/10 overflow-hidden bg-white/2">
                {[
                  { label: "Round 1 — Mon Jun 22", games: "Team A vs Team B · Team C vs Team D" },
                  { label: "Round 2 — Tue Jun 23", games: "Team A vs Team C · Team B vs Team D" },
                  { label: "Round 3 — Wed Jun 24", games: "Team A vs Team D · Team B vs Team C" },
                ].map((r, i) => {
                  const isToday = i === campDay;
                  const isPast  = campDay > i;
                  return (
                    <div key={i} className={`flex items-center gap-3 px-4 py-3 border-b border-white/4 last:border-0 ${isToday ? "bg-[#F4A800]/8" : ""}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${isToday ? "bg-[#F4A800] text-black" : isPast ? "bg-green-800 text-green-300" : "bg-white/10 text-white/40"}`}>{isPast ? "✓" : i + 1}</div>
                      <div>
                        <div className={`text-sm font-semibold ${isPast ? "text-white/35 line-through" : "text-white/75"}`}>{r.label}</div>
                        <div className="text-xs text-white/28 mt-0.5">{r.games}</div>
                      </div>
                      {isToday && <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded bg-[#E03A3A]">TODAY</span>}
                      {isPast  && <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-white/30">DONE</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Championship — bracket + contests (live data) */}
        {isDayUnlocked(activeDay) && activeDay === 3 && (() => {
          // Helper: resolve team name from id
          const teamName = (id: string) => teams.find(t => t.id === id)?.name || id || "TBD";

          // Game card component inline
          function GameCard({ game, accentColor }: { game: BracketGame; accentColor: string }) {
            const t1 = teamName(game.team1Id);
            const t2 = teamName(game.team2Id);
            const isFinal = game.status === "final";
            const isLive  = game.status === "live";
            const w1 = isFinal && game.score1 !== null && game.score2 !== null && game.score1 > game.score2;
            const w2 = isFinal && game.score1 !== null && game.score2 !== null && game.score2 > game.score1;
            return (
              <div className={`rounded-xl border overflow-hidden ${isLive ? "border-[#E03A3A]/60 shadow-lg shadow-[#E03A3A]/10" : "border-white/10"}`}>
                {isLive && (
                  <div className="px-3 py-1 bg-[#E03A3A] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span className="text-[10px] font-black uppercase text-white tracking-widest">Live Now</span>
                  </div>
                )}
                {isFinal && (
                  <div className="px-3 py-1 bg-white/5 text-[10px] font-bold uppercase text-white/30 tracking-widest">Final</div>
                )}
                <div className="bg-white/3 divide-y divide-white/5">
                  {/* Team 1 */}
                  <div className={`flex items-center justify-between px-4 py-2.5 ${w1 ? "bg-white/5" : ""}`}>
                    <span className={`text-sm font-bold ${w1 ? "text-white" : "text-white/60"}`}>{t1 || "TBD"}</span>
                    {game.score1 !== null && (
                      <span className={`text-lg font-black ${w1 ? "text-white" : "text-white/40"}`}>{game.score1}</span>
                    )}
                    {game.score1 === null && !isFinal && (
                      <span className="text-xs text-white/20">—</span>
                    )}
                    {w1 && <span className="ml-2 text-[10px] font-black px-1.5 py-0.5 rounded" style={{ background: accentColor, color: "#0B0F1A" }}>W</span>}
                  </div>
                  {/* Team 2 */}
                  <div className={`flex items-center justify-between px-4 py-2.5 ${w2 ? "bg-white/5" : ""}`}>
                    <span className={`text-sm font-bold ${w2 ? "text-white" : "text-white/60"}`}>{t2 || "TBD"}</span>
                    {game.score2 !== null && (
                      <span className={`text-lg font-black ${w2 ? "text-white" : "text-white/40"}`}>{game.score2}</span>
                    )}
                    {game.score2 === null && !isFinal && (
                      <span className="text-xs text-white/20">—</span>
                    )}
                    {w2 && <span className="ml-2 text-[10px] font-black px-1.5 py-0.5 rounded" style={{ background: accentColor, color: "#0B0F1A" }}>W</span>}
                  </div>
                </div>
                {game.court && (
                  <div className="px-4 py-1.5 text-[10px] text-white/20 border-t border-white/5">{game.court}</div>
                )}
              </div>
            );
          }

          return (
            <>
              {/* ── Semifinals ── */}
              {(["NBA", "College"] as const).map(div => {
                const semis = bracketGames.filter(g => g.division === div && g.round === "semi");
                const finals = bracketGames.filter(g => g.division === div && g.round === "final");
                const divColor = div === "NBA" ? "#1B2A5E" : "#7B1212";
                const accent   = div === "NBA" ? "#F4A800" : "#fff";
                const hasGames = semis.length > 0 || finals.length > 0;

                return (
                  <div key={div} className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full`}
                        style={{ background: divColor, color: accent }}>
                        {div} Division
                      </span>
                      <span className="text-white/28 text-xs">{div === "NBA" ? "1st – 4th Grade" : "5th – 8th Grade"}</span>
                    </div>

                    {!hasGames ? (
                      /* No bracket games set yet — show seeding-based placeholder */
                      <div className="rounded-xl border border-white/10 overflow-hidden">
                        <div className="p-3 text-[10px] font-bold uppercase text-white/28 tracking-widest border-b border-white/5"
                          style={{ background: `${divColor}60` }}>
                          Semifinals — 12:45 PM
                        </div>
                        <div className="bg-white/3 divide-y divide-white/5">
                          {[["#1 Seed","#4 Seed"],["#2 Seed","#3 Seed"]].map(([a,b],i) => (
                            <div key={i} className="flex items-center justify-between px-4 py-2.5">
                              <div className="flex-1 text-sm text-white/35 font-semibold">{a}</div>
                              <span className="text-white/20 text-xs mx-3">vs</span>
                              <div className="flex-1 text-sm text-white/35 font-semibold text-right">{b}</div>
                            </div>
                          ))}
                        </div>
                        <div className="p-3 text-[10px] font-bold uppercase text-white/28 tracking-widest border-y border-white/5"
                          style={{ background: `${divColor}60` }}>
                          Championship — 2:05 PM
                        </div>
                        <div className="bg-white/3 px-4 py-2.5">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-white/25 font-semibold">SF1 Winner</div>
                            <span className="text-white/20 text-xs mx-3">vs</span>
                            <div className="text-sm text-white/25 font-semibold">SF2 Winner</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {semis.length > 0 && (
                          <>
                            <p className="text-[10px] font-bold uppercase text-white/28 tracking-widest">Semifinals — 12:45 PM</p>
                            {semis.map(g => <GameCard key={g.id} game={g} accentColor={accent} />)}
                          </>
                        )}
                        {finals.length > 0 && (
                          <>
                            <p className="text-[10px] font-bold uppercase text-white/28 tracking-widest mt-4">🏆 Championship Game — 2:05 PM</p>
                            {finals.map(g => <GameCard key={g.id} game={g} accentColor={accent} />)}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* ── Individual Contests ── */}
              <div className="mb-6">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-3">Individual Contests</h3>
                {(() => {
                  const CONTEST_META: Record<string, { abbr: string; rule: string; color: string; time: string }> = {
                    "Knockout":          { abbr:"KO",  rule:"Last one standing wins!",                              color:"#B91C1C", time:"8:15 AM"  },
                    "Free Throw Contest":{ abbr:"FT",  rule:"Best of 10 shots. Tie = sudden death.",               color:"#1B4FC4", time:"9:00 AM"  },
                    "3-Point Contest":   { abbr:"3PT", rule:"3 balls at 5 spots. 1 minute per shooter.",           color:"#C41B1B", time:"9:30 AM"  },
                    "1-on-1 Challenge":  { abbr:"1v1", rule:"First to 15 points. 2s and 3s count.",               color:"#1B7A3C", time:"10:00 AM" },
                    "3-on-3 Tournament": { abbr:"3v3", rule:"First to 21 points. 2s and 3s count.",               color:"#7B3F00", time:"10:30 AM" },
                    "Layup Contest":     { abbr:"LAY", rule:"Right hand 1 min + Left hand 1 min. Team total wins.",color:"#5B21B6", time:"11:15 AM" },
                  };
                  // Group events by name (both divisions together)
                  const eventNames = Array.from(new Set([
                    "Knockout","Free Throw Contest","3-Point Contest","1-on-1 Challenge","3-on-3 Tournament","Layup Contest"
                  ]));
                  return (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {eventNames.map(evtName => {
                        const meta = CONTEST_META[evtName] || { abbr: evtName.slice(0,3).toUpperCase(), rule: "", color: "#333", time: "" };
                        // Find events matching this name across divisions
                        const evts = individualEvents.filter(e => e.name === evtName);
                        const anyComplete = evts.some(e => e.status === "complete");
                        const anyLive    = evts.some(e => e.status === "live");
                        return (
                          <div key={evtName} className="rounded-xl overflow-hidden border border-white/10">
                            <div className="flex items-center gap-3 px-3 py-2.5" style={{ background: meta.color }}>
                              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-[11px] font-black">{meta.abbr}</div>
                              <div className="flex-1">
                                <div className="text-sm font-bold">{evtName}</div>
                                <div className="text-[11px] opacity-60">{meta.time}</div>
                              </div>
                              {anyLive    && <span className="text-[9px] font-black px-2 py-0.5 rounded bg-white/20 animate-pulse">LIVE</span>}
                              {anyComplete && <span className="text-[9px] font-black px-2 py-0.5 rounded bg-black/30">DONE</span>}
                            </div>
                            <div className="bg-white/3">
                              {anyComplete && evts.length > 0 ? (
                                <div className="divide-y divide-white/5">
                                  {evts.map(e => (
                                    <div key={e.id} className="px-3 py-2">
                                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">{e.division} Div</div>
                                      {e.winner && (
                                        <div className="flex items-center gap-2">
                                          <span className="text-base">🥇</span>
                                          <span className="text-sm font-bold text-white">{e.winner}</span>
                                        </div>
                                      )}
                                      {e.runnerUp && (
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className="text-base">🥈</span>
                                          <span className="text-sm text-white/50">{e.runnerUp}</span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="px-3 py-2.5">
                                  <div className="text-xs text-white/40 leading-relaxed">{meta.rule}</div>
                                  {evts.length === 0 && (
                                    <div className="text-[11px] text-white/20 mt-1 italic">Nominees TBA</div>
                                  )}
                                  {evts.length > 0 && evts.some(e => e.nominees.length > 0) && (
                                    <div className="mt-2 space-y-1">
                                      {evts.map(e => {
                                        const nominated = e.nominees.flatMap(n => n.players.filter(p => p.trim()));
                                        if (nominated.length === 0) return null;
                                        return (
                                          <div key={e.id}>
                                            <div className="text-[10px] font-bold uppercase text-white/25 mb-0.5">{e.division}</div>
                                            <div className="flex flex-wrap gap-1">
                                              {nominated.map((p, pi) => (
                                                <span key={pi} className="text-[11px] px-2 py-0.5 rounded bg-white/8 text-white/50">{p}</span>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </>
          );
        })()}

        {/* 4-Day Overview */}
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white/28 bg-white/3 border-b border-white/10">
            4-Day Camp Overview
          </div>
          {schedule.map((d, i) => (
            <button key={i} onClick={() => setActiveDay(i)}
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
