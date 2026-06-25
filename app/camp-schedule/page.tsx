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
  round: "quarter" | "semi" | "final" | "3rd";
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


function camperShortName(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
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


  // ── PDF Print ──────────────────────────────────────────────────────────────
  const handleDownloadPDF = () => {
    const typeLabel = (type: RowType) => {
      if (type === "section")   return "background:#fff8e8;color:#7a5000;font-weight:700;";
      if (type === "highlight") return "background:#f0f0f0;color:#000;font-weight:700;";
      if (type === "game")      return "color:#1a4080;font-weight:600;";
      if (type === "break")     return "color:#999;font-style:italic;";
      return "color:#333;";
    };

    const rows = current.rows.map(row => `
      <tr style="${typeLabel(row.type)}">
        <td class="tc">${row.time}</td>
        <td class="ac">${row.activity}</td>
        <td class="nc">${row.note ?? ""}</td>
      </tr>`).join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Hilhi Youth Basketball Camp 2026 — ${current.label}</title>
  <style>
    @page{size:letter portrait;margin:12mm 14mm;}
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Segoe UI',Arial,sans-serif;font-size:10px;color:#111;background:#fff;}
    .header{border-bottom:3px solid #F4A800;padding-bottom:8px;margin-bottom:12px;}
    .header h1{font-size:16px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;color:#111;}
    .header .day-title{font-size:20px;font-weight:900;color:#F4A800;margin:2px 0;}
    .header .meta{font-size:9px;color:#666;margin-top:3px;}
    .badges{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;}
    .badge{font-size:9px;padding:2px 9px;border-radius:10px;font-weight:700;}
    .badge-gray{background:#eee;color:#333;}
    .badge-gold{background:#F4A800;color:#000;}
    .badge-red{background:#c0392b;color:#fff;}
    table{width:100%;border-collapse:collapse;border:1px solid #ddd;table-layout:fixed;}
    thead tr{background:#f0f0f0;}
    th{padding:6px 10px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:0.8px;color:#666;}
    tr{border-bottom:1px solid #ebebeb;}
    tr:last-child{border-bottom:none;}
    tbody tr:nth-child(even){filter:brightness(0.985);}
    col.c-time{width:82px;}
    col.c-act{width:auto;}
    col.c-note{width:45%;}
    .tc{padding:6px 10px;white-space:nowrap;color:#555;font-size:10px;vertical-align:top;}
    .ac{padding:6px 10px;font-size:10.5px;vertical-align:top;word-break:break-word;}
    .nc{padding:6px 10px;font-size:9.5px;color:#555;vertical-align:top;word-break:break-word;line-height:1.45;}
    .footer{text-align:center;margin-top:14px;font-size:8px;color:#bbb;border-top:1px solid #eee;padding-top:8px;}
  </style>
</head>
<body>
  <div class="header">
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:8px;">
      <img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAAqAG8DASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD4D216DofwD8e+I/hnqPxB03w9LceD9OLi61QTwhYimN3yFw5xkdFPWuAAzX6gfscReFJv+Ceni+PxxLeQeEje3Y1KSwGZ1hzHnbwefoK9ScuVXRxRXM7Hwr4I/ZX+KfxH8I2Hijw54Sm1PQr64+yW94l1Agkl8zy9u1pAw+YYyRirniX9kD4veD/D2u65rHgyey0rQ+NRuGu7dhb/ACq3IWQk8Op4B61+rP7P8Hw+tv2ffB6fC+41C58GjxBF9lk1QETF/tn7zOQDjfuxkUftG6Rfa98Avjvp+mWVxqN/cSFIbW0iaWWVvs9tgKqgkn2ArD2z5rGns1Y/IDwl8CvHPjzwJr3jPQdAl1DwzoQkOpX6zxItuEjEjZVnDHCkH5Qa1fAP7MPxN+KPhM+JfDHhWXVtC+0/ZPta3MCDzdyrt2u4bqyjOMc192/sNeDE8IfshfGOw+J2ka14c0Oaa5k1GOe0kt7r7GbNBI8auuTwHAIB5Br279mu2+Gdr+z26fCe61S78K/27CRJqwIl87z4N4GVU46dR61UqrV7IShex+QXxJ+Fniz4NeJT4d8X6VJoeriFLj7I80ch8ts7WyjMOcHvXJmR8jDEY96+wP8Agqb/AMnTyf8AYEs/5yV8fgZrWNmkyJaOwquVIPU5zzSYwCOKXbS1TimLmZG8QdVU9F6U9QVRl3MQfU0tFNJCuAJHc/nTUBXufzp3HvS4Bp8qe4XI69J8P/tAfETw38LNR+HOl641v4M1QyG500WNu/mlsb/3rRmQfdHRhjFebAZrtfDPxCl0DwRrmifOZ7rH2OYID9n3fLPhicrvQAcA/hWlOEJu1R2X3mc5SirwVzrfAn7WHxc+GPgfTvDPhvxO+meG7G6N1a250y1lVJvM8wnzJImY/Mc4LEe2K6qw/b8/aB064vZbbxy0c17OJpz/AGLYHfJsVc4Nvx8qKMDHSuC1X4m6fe+BH0hDqPnPp1tYjTnVfsULxOGa4Q7yS7Y6bB95ssaTxz8S9O1nTpRox1G2vrnVF1WSSVVi+zsIRHsjZXJbnJ3EL24rplhaCTkpp6J7ev8AwPv8jCNes24ely2+fp/XyOx8WftwfHXxhoOs6HrnjJ7rTdXs2s763bR7KPzYGBVl3LAGXhiMqQeetc78O/2pfip8KPCQ8J+FfEp0vRDdC8Fl/Z1rMTNuVg26SJn6qpxnHHSquofFmzvvHHiXWpra41Kz1DTms7W0v8lVJMZw4WQFVyjH5W6n3NZl1470+4+Ldl4pW2mi0+Ge1laBFG8CNEVgoLeqnGW6YyaUsNQjpGa3tt011CNes94dL79exU+KnxV8YfGnxcdf8AGmpNrGumFLbzzaxQHy1ztXZEir3POM81yEcEku/ZGz7AWbapO0ep9K9euvi3oTeP7LxGLfUrk2Glm2twdsTmfLhWy7ylQFc8lnOQOMcBNF+Kfh3SvEHie6jj1a007V50uRbW6hXDbWLrvSZCvzucHLKR1St1haF7e1W9tult/v0MniK1r+ze3439uxU+KnxV8YfGnxcdf8AGmpNrGumFLbzzaxQHy1ztXZEir3POM81yEcEku/ZGz7AWbapO0ep9K9euvi3oTeP7LxGLfUrk2Glm2twdsTmfLhWy7ylQFc8lnOQOMcBNF+Kfh3SvEHie6jj1a007V50uRbW6hXDbWLrvSZCvzucHLKR1St1haF7e1W9tult/v0MniK1r+ze3437BRRRUjCiiigAooooA/9k=" alt="Hilhi Youth Basketball Camp" style="height:48px;width:auto;object-fit:contain;flex-shrink:0;border-radius:4px;" />
      <div>
        <h1>Hilhi Youth Basketball Camp 2026</h1>
        <div class="day-title">${current.label} — ${current.theme ?? ""}</div>
        <div class="meta">${current.date ?? ""}, 2026 · Hillsboro, OR · 7:30 AM – 3:00 PM</div>
      </div>
    </div>
    <div class="badges">
      <span class="badge badge-gray">Grades 1st–8th</span>
      <span class="badge badge-gold">NBA Division · 1st–4th Grade</span>
      <span class="badge badge-red">College Division · 5th–8th Grade</span>
    </div>
  </div>
  <table>
    <colgroup>
      <col class="c-time" />
      <col class="c-act" />
      <col class="c-note" />
    </colgroup>
    <thead><tr>
      <th>Time</th><th>Activity</th><th>Notes</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">hilhiyouthbbx.com · Printed from the live Hilhi Youth Basketball Camp schedule</div>
  <script>window.onload=()=>{window.print();}</script>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) { alert("Please allow pop-ups to print the schedule."); return; }
    win.document.write(html);
    win.document.close();
  };

  // ── Print Individual Events ───────────────────────────────────────────────
  const handlePrintEvents = () => {
    if (individualEvents.length === 0) {
      alert("No individual events have been set up yet. Add events in the admin panel first.");
      return;
    }

    const CONTEST_COLORS: Record<string, string> = {
      "Knockout":           "#B91C1C",
      "Free Throw Contest": "#1B4FC4",
      "3-Point Contest":    "#C41B1B",
      "1-on-1 Challenge":   "#1B7A3C",
      "3-on-3 Tournament":  "#7B3F00",
      "Layup Contest":      "#5B21B6",
    };

    const CONTEST_TIMES: Record<string, string> = {
      "Knockout":           "8:15 AM",
      "Free Throw Contest": "9:00 AM",
      "3-Point Contest":    "9:30 AM",
      "1-on-1 Challenge":   "10:00 AM",
      "3-on-3 Tournament":  "10:30 AM",
      "Layup Contest":      "11:15 AM",
    };

    const CONTEST_RULES: Record<string, string> = {
      "Knockout":           "Last one standing wins!",
      "Free Throw Contest": "Best of 10 shots. Tie = sudden death.",
      "3-Point Contest":    "3 balls at 5 spots. 1 minute per shooter.",
      "1-on-1 Challenge":   "First to 15 points. 2s and 3s count.",
      "3-on-3 Tournament":  "First to 21 points. 2s and 3s count.",
      "Layup Contest":      "Right 1 min + Left 1 min. Team total wins.",
    };

    const tName = (id: string) => teams.find(t => t.id === id)?.name || "";

    // Group events by name
    const eventNames = Array.from(new Set(individualEvents.map(e => e.name)));

    const eventBlocks = eventNames.map(evtName => {
      const color = CONTEST_COLORS[evtName] || "#333";
      const time  = CONTEST_TIMES[evtName]  || "";
      const rule  = CONTEST_RULES[evtName]  || "";
      const evts  = individualEvents.filter(e => e.name === evtName);

      const divBlocks = evts.map(evt => {
        const hasNominees = evt.nominees.some(n => n.players.some(p => p.trim()));
        const nomRows = hasNominees
          ? evt.nominees.map(nom => {
              const players = nom.players.filter(p => p.trim());
              if (players.length === 0) return "";
              const tn = tName(nom.teamId);
              return `<tr>
                <td class="team-cell">${tn}</td>
                <td class="players-cell">${players.join(" &nbsp;·&nbsp; ")}</td>
              </tr>`;
            }).filter(Boolean).join("")
          : `<tr><td colspan="2" class="tba">Participants TBA</td></tr>`;

        const winnerBlock = evt.status === "complete" && (evt.winner || evt.runnerUp) ? `
          <div class="winner-box">
            ${evt.winner   ? `<div><span class="trophy">🥇</span> <strong>${evt.winner}</strong></div>` : ""}
            ${evt.runnerUp ? `<div><span class="trophy">🥈</span> ${evt.runnerUp}</div>` : ""}
          </div>` : "";

        return `
          <div class="div-block">
            <div class="div-label ${evt.division === "NBA" ? "nba" : "college"}">${evt.division} Division &mdash; ${evt.division === "NBA" ? "1st&ndash;4th Grade" : "5th&ndash;8th Grade"}</div>
            ${winnerBlock}
            <table class="nom-table">
              <thead><tr><th>Team</th><th>Participants</th></tr></thead>
              <tbody>${nomRows}</tbody>
            </table>
          </div>`;
      }).join("");

      return `
        <div class="event-card">
          <div class="event-header" style="background:${color}">
            <div class="event-title">${evtName}</div>
            <div class="event-meta">${time}${rule ? " &nbsp;·&nbsp; " + rule : ""}</div>
          </div>
          <div class="event-body">${divBlocks}</div>
        </div>`;
    }).join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Championship Day — Individual Events · Hilhi Youth Hoop Camp 2026</title>
  <style>
    @page{size:letter portrait;margin:12mm 14mm;}
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Segoe UI',Arial,sans-serif;font-size:10px;color:#111;background:#fff;}
    .header{border-bottom:3px solid #F4A800;padding-bottom:8px;margin-bottom:14px;display:flex;align-items:center;gap:14px;}
    .header-text h1{font-size:15px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;color:#111;}
    .header-text .day{font-size:19px;font-weight:900;color:#E03A3A;margin:2px 0;}
    .header-text .meta{font-size:9px;color:#666;margin-top:3px;}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
    .event-card{border:1px solid #ddd;border-radius:8px;overflow:hidden;break-inside:avoid;}
    .event-header{padding:7px 10px;color:#fff;}
    .event-title{font-size:12px;font-weight:900;}
    .event-meta{font-size:8.5px;opacity:0.75;margin-top:2px;}
    .event-body{padding:8px 10px;background:#fafafa;}
    .div-block{margin-bottom:7px;}
    .div-block:last-child{margin-bottom:0;}
    .div-label{font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;padding:2px 6px;border-radius:3px;display:inline-block;margin-bottom:5px;}
    .div-label.nba{background:#fff3cd;color:#7a5000;}
    .div-label.college{background:#cfe2ff;color:#0a3578;}
    .winner-box{background:#fffbeb;border:1px solid #f0d060;border-radius:4px;padding:4px 8px;margin-bottom:5px;font-size:10px;}
    .winner-box div{margin-bottom:2px;} .winner-box div:last-child{margin-bottom:0;}
    .trophy{font-size:11px;}
    .nom-table{width:100%;border-collapse:collapse;font-size:9.5px;}
    .nom-table th{text-align:left;font-size:8px;text-transform:uppercase;letter-spacing:0.7px;color:#888;padding:0 0 3px;border-bottom:1px solid #e5e5e5;}
    .nom-table td{padding:3px 0;border-bottom:1px solid #f0f0f0;vertical-align:top;}
    .nom-table tr:last-child td{border-bottom:none;}
    .team-cell{font-weight:700;color:#555;width:28%;padding-right:6px;white-space:nowrap;}
    .players-cell{color:#222;}
    .tba{color:#aaa;font-style:italic;padding:4px 0;}
    .footer{text-align:center;margin-top:14px;font-size:8px;color:#bbb;border-top:1px solid #eee;padding-top:8px;}
  </style>
</head>
<body>
  <div class="header">
    <img src="` + window.location.origin + `/logo.png" alt="Hilhi Youth Basketball Camp" style="height:44px;width:auto;border-radius:4px;flex-shrink:0;object-fit:contain;"/>
    <div class="header-text">
      <h1>Hilhi Youth Basketball Camp 2026</h1>
      <div class="day">Championship Day — Individual Events</div>
      <div class="meta">Thursday, June 25, 2026 &nbsp;·&nbsp; Hillsboro, OR &nbsp;·&nbsp; Grades 1st–8th</div>
    </div>
  </div>
  <div class="grid">
    ${eventBlocks}
  </div>
  <div class="footer">hilhiyouthbbx.com · Printed from the live Hilhi Youth Basketball Camp schedule</div>
  <script>window.onload=()=>{window.print();}</script>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) { alert("Please allow pop-ups to print."); return; }
    win.document.write(html);
    win.document.close();
  };

  // ── Print Bracket ─────────────────────────────────────────────────
  const handlePrintBracket = () => {
    if (bracketGames.length === 0) {
      alert("No bracket games have been set up yet. Build the bracket in the admin panel first.");
      return;
    }

    const teamName = (id: string) => teams.find(t => t.id === id)?.name || id || "TBD";

    const roundLabel: Record<string, string> = {
      quarter: "Quarterfinals",
      semi:    "Semifinals",
      final:   "Championship Final",
      "3rd":   "3rd Place",
    };
    const roundOrder = ["quarter", "semi", "final", "3rd"];

    const divConfigs = [
      { div: "NBA",     label: "NBA Division",     grades: "1st – 4th Grade", headerBg: "#1B2A5E", headerColor: "#F4A800" },
      { div: "College", label: "College Division",  grades: "5th – 8th Grade", headerBg: "#7B1212", headerColor: "#ffffff" },
    ] as const;

    const divBlocks = divConfigs.map(({ div, label, grades, headerBg, headerColor }) => {
      const games = bracketGames.filter(g => g.division === div);
      if (games.length === 0) return "";

      const roundBlocks = roundOrder.map(round => {
        const roundGames = games.filter(g => g.round === round).sort((a, b) => a.id.localeCompare(b.id));
        if (roundGames.length === 0) return "";

        const gameCards = roundGames.map(g => {
          const t1 = teamName(g.team1Id);
          const t2 = teamName(g.team2Id);
          const isFinal = g.status === "final";
          const isLive  = g.status === "live";
          const w1 = isFinal && g.score1 !== null && g.score2 !== null && g.score1 > g.score2;
          const w2 = isFinal && g.score1 !== null && g.score2 !== null && g.score2 > g.score1;

          const statusBar = isLive
            ? `<div class="status-bar live">● LIVE NOW</div>`
            : isFinal
            ? `<div class="status-bar final">FINAL</div>`
            : "";

          const row = (team: string, score: number | null, isWinner: boolean) => `
            <div class="team-row ${isWinner ? "winner" : ""}">
              <span class="team-name">${team}</span>
              <span class="team-score">${score !== null ? score : "—"}</span>
              ${isWinner ? `<span class="win-badge">W</span>` : ""}
            </div>`;

          return `
            <div class="game-card ${isLive ? "game-live" : ""}">
              ${statusBar}
              <div class="teams">
                ${row(t1, g.score1, w1)}
                ${row(t2, g.score2, w2)}
              </div>
              ${g.court ? `<div class="court-label">${g.court}</div>` : ""}
            </div>`;
        }).join("");

        return `
          <div class="round-block">
            <div class="round-label">${roundLabel[round] || round}</div>
            <div class="games-row">${gameCards}</div>
          </div>`;
      }).join("");

      return `
        <div class="div-section">
          <div class="div-header" style="background:${headerBg};color:${headerColor};">
            <span class="div-name">${label}</span>
            <span class="div-grades">${grades}</span>
          </div>
          ${roundBlocks}
        </div>`;
    }).join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Championship Day — Bracket · Hilhi Youth Hoop Camp 2026</title>
  <style>
    @page{size:letter portrait;margin:12mm 14mm;}
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Segoe UI',Arial,sans-serif;font-size:10px;color:#111;background:#fff;}
    .header{border-bottom:3px solid #F4A800;padding-bottom:8px;margin-bottom:14px;display:flex;align-items:center;gap:14px;}
    .header-text h1{font-size:15px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;color:#111;}
    .header-text .day{font-size:19px;font-weight:900;color:#1B2A5E;margin:2px 0;}
    .header-text .meta{font-size:9px;color:#666;margin-top:3px;}
    .div-section{margin-bottom:16px;break-inside:avoid;}
    .div-header{display:flex;align-items:baseline;justify-content:space-between;padding:7px 12px;border-radius:6px 6px 0 0;}
    .div-name{font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:1px;}
    .div-grades{font-size:9px;opacity:0.75;}
    .round-block{margin-top:8px;}
    .round-label{font-size:8.5px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:5px;padding-left:2px;}
    .games-row{display:flex;flex-wrap:wrap;gap:8px;}
    .game-card{border:1px solid #ddd;border-radius:6px;overflow:hidden;min-width:180px;flex:1;}
    .game-live{border-color:#E03A3A;}
    .status-bar{padding:3px 8px;font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:1px;}
    .status-bar.live{background:#E03A3A;color:#fff;}
    .status-bar.final{background:#f5f5f5;color:#aaa;}
    .teams{border-bottom:1px solid #f0f0f0;}
    .team-row{display:flex;align-items:center;padding:5px 8px;border-bottom:1px solid #f5f5f5;}
    .team-row:last-child{border-bottom:none;}
    .team-row.winner{background:#fffbeb;}
    .team-name{flex:1;font-size:10px;font-weight:700;color:#222;}
    .team-row:not(.winner) .team-name{color:#666;}
    .team-score{font-size:12px;font-weight:900;color:#222;margin-left:8px;}
    .team-row:not(.winner) .team-score{color:#aaa;}
    .win-badge{margin-left:5px;background:#F4A800;color:#000;font-size:7px;font-weight:900;padding:1px 4px;border-radius:3px;}
    .court-label{font-size:8px;color:#bbb;padding:3px 8px;}
    .footer{text-align:center;margin-top:14px;font-size:8px;color:#bbb;border-top:1px solid #eee;padding-top:8px;}
  </style>
</head>
<body>
  <div class="header">
    <img src="` + window.location.origin + `/logo.png" alt="Hilhi Youth Basketball Camp" style="height:44px;width:auto;border-radius:4px;flex-shrink:0;object-fit:contain;"/>
    <div class="header-text">
      <h1>Hilhi Youth Basketball Camp 2026</h1>
      <div class="day">Championship Day — Bracket</div>
      <div class="meta">Thursday, June 25, 2026 &nbsp;·&nbsp; Hillsboro, OR &nbsp;·&nbsp; Grades 1st–8th</div>
    </div>
  </div>
  ${divBlocks}
  <div class="footer">hilhiyouthbbx.com · Printed from the live Hilhi Youth Basketball Camp schedule</div>
  <script>window.onload=()=>{window.print();}</script>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) { alert("Please allow pop-ups to print."); return; }
    win.document.write(html);
    win.document.close();
  };

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
          {/* Print buttons */}
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border border-white/20 text-white/60 hover:border-[#F4A800]/60 hover:text-[#F4A800] transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Print Schedule PDF
            </button>
            {bracketGames.length > 0 && (
              <button
                onClick={handlePrintBracket}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border border-white/20 text-white/60 hover:border-[#F4A800]/60 hover:text-[#F4A800] transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Print Bracket PDF
              </button>
            )}
            {individualEvents.length > 0 && (
              <button
                onClick={handlePrintEvents}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border border-white/20 text-white/60 hover:border-[#E03A3A]/60 hover:text-[#E03A3A] transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Print Championship Events
              </button>
            )}
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
                          const record = new Map(calcPoolStandings(div).map(r => [r.team.id, r])).get(team.id);
                          return (
                            <div key={team.id} className="rounded-2xl border border-white/10 overflow-hidden">
                              {/* Team header */}
                              <div className="px-4 py-3 flex items-center justify-between gap-3" style={{ background: div === "NBA" ? "#1B2A5E" : "#E03A3A" }}>
                                <div className="min-w-0">
                                  <div className="text-base font-black text-white truncate">{team.name || "TBD"}</div>
                                  {team.coach && <div className="text-xs opacity-60 text-white mt-0.5">Coach: {team.coach}</div>}
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="text-xl font-black text-white">{record?.wins ?? 0}-{record?.losses ?? 0}</div>
                                  <div className="text-[10px] text-white/60 uppercase tracking-wider">record</div>
                                  <div className="text-[10px] text-white/40">{players.length} players</div>
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
                                      <div className="text-sm text-white/75">{camperShortName(p)}</div>
                                    </div>
                                  ))
                                )}
                              </div>

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

        {/* ── STANDINGS VIEW ── */}
        {activeView === "standings" && (
          <div className="space-y-6">
            {(["NBA", "College"] as const).map(div => {
              const rows = calcPoolStandings(div);
              const games = seedingGames.filter(g => g.division === div && isPlayedPoolGame(g));
              return (
                <div key={div} className="rounded-2xl border border-white/10 overflow-hidden bg-white/2">
                  <div className="px-4 py-3 flex items-center justify-between" style={{ background: div === "NBA" ? "#1B2A5E" : "#E03A3A" }}>
                    <div>
                      <div className="text-white font-black uppercase">{div} Division Standings</div>
                      <div className="text-xs text-white/50">Calculated from final pool-play scores</div>
                    </div>
                    <div className="text-xs text-white/60 font-bold">{games.length} games played</div>
                  </div>

                  {rows.length === 0 ? (
                    <div className="px-4 py-8 text-center text-white/35 text-sm">Standings will show after teams are posted.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-white/5 text-white/35 text-[11px] uppercase tracking-widest">
                          <tr>
                            <th className="text-left px-3 py-2">#</th>
                            <th className="text-left px-3 py-2">Team</th>
                            <th className="text-center px-3 py-2">W</th>
                            <th className="text-center px-3 py-2">L</th>
                            <th className="text-center px-3 py-2">GP</th>
                            <th className="text-center px-3 py-2">PF</th>
                            <th className="text-center px-3 py-2">PA</th>
                            <th className="text-center px-3 py-2">Diff</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {rows.map((row, idx) => (
                            <tr key={row.team.id} className="text-white/75">
                              <td className="px-3 py-2 font-black text-white/35">{idx + 1}</td>
                              <td className="px-3 py-2 font-bold text-white">{row.team.name || "TBD"}</td>
                              <td className="px-3 py-2 text-center text-green-400 font-black">{row.wins}</td>
                              <td className="px-3 py-2 text-center text-red-400 font-black">{row.losses}</td>
                              <td className="px-3 py-2 text-center text-white/55">{row.gamesPlayed}</td>
                              <td className="px-3 py-2 text-center text-white/55">{row.pointsFor}</td>
                              <td className="px-3 py-2 text-center text-white/55">{row.pointsAgainst}</td>
                              <td className={`px-3 py-2 text-center font-black ${row.diff >= 0 ? "text-green-400" : "text-red-400"}`}>{row.diff > 0 ? "+" : ""}{row.diff}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {games.length > 0 && (
                    <div className="px-4 py-3 border-t border-white/10 bg-black/10">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/28 mb-2">Pool Scores Used</div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {games.map(g => (
                          <div key={g.id} className="rounded-lg bg-white/5 px-3 py-2 text-xs flex items-center justify-between gap-2">
                            <span className="text-white/60 truncate">{teamName(g.team1Id)} vs {teamName(g.team2Id)}</span>
                            <span className="font-black text-white flex-shrink-0">{g.score1} - {g.score2}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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
                const quarters = bracketGames.filter(g => g.division === div && g.round === "quarter").sort((a,b) => a.id.localeCompare(b.id));
                const semis = bracketGames.filter(g => g.division === div && g.round === "semi").sort((a,b) => a.id.localeCompare(b.id));
                const finals = bracketGames.filter(g => g.division === div && g.round === "final");
                const thirds = bracketGames.filter(g => g.division === div && g.round === "3rd");
                const divColor = div === "NBA" ? "#1B2A5E" : "#7B1212";
                const accent   = div === "NBA" ? "#F4A800" : "#fff";
                const hasGames = quarters.length > 0 || semis.length > 0 || finals.length > 0;

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
                        {quarters.length > 0 && (
                          <>
                            <p className="text-[10px] font-bold uppercase text-white/28 tracking-widest">Quarterfinals — 11:00 AM</p>
                            {quarters.map(g => <GameCard key={g.id} game={g} accentColor={accent} />)}
                          </>
                        )}
                        {semis.length > 0 && (
                          <>
                            <p className="text-[10px] font-bold uppercase text-white/28 tracking-widest mt-4">Semifinals — 12:45 PM</p>
                            {semis.map(g => <GameCard key={g.id} game={g} accentColor={accent} />)}
                          </>
                        )}
                        {finals.length > 0 && (
                          <>
                            <p className="text-[10px] font-bold uppercase text-white/28 tracking-widest mt-4">🏆 Championship Game — 2:05 PM</p>
                            {finals.map(g => <GameCard key={g.id} game={g} accentColor={accent} />)}
                          </>
                        )}
                        {thirds.length > 0 && (
                          <>
                            <p className="text-[10px] font-bold uppercase text-white/28 tracking-widest mt-4">🥉 3rd Place — 2:05 PM</p>
                            {thirds.map(g => <GameCard key={g.id} game={g} accentColor={accent} />)}
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
                  const CONTEST_META: Record<string, { abbr: string; rule: string; color: string; bg: string; time: string }> = {
                    "Knockout":          { abbr:"KO",  rule:"Last one standing wins!",                               color:"#fff",   bg:"#B91C1C", time:"8:15 AM"  },
                    "Free Throw Contest":{ abbr:"FT",  rule:"Best of 10 shots. Tie = sudden death.",                color:"#fff",   bg:"#1B4FC4", time:"9:00 AM"  },
                    "3-Point Contest":   { abbr:"3PT", rule:"3 balls at 5 spots. 1 minute per shooter.",            color:"#fff",   bg:"#C41B1B", time:"9:30 AM"  },
                    "1-on-1 Challenge":  { abbr:"1v1", rule:"First to 15 points. 2s and 3s count.",                color:"#fff",   bg:"#1B7A3C", time:"10:00 AM" },
                    "3-on-3 Tournament": { abbr:"3v3", rule:"First to 21 points. 2s and 3s count.",                color:"#fff",   bg:"#7B3F00", time:"10:30 AM" },
                    "Layup Contest":     { abbr:"LAY", rule:"Right hand 1 min + Left hand 1 min. Team total wins.", color:"#fff",   bg:"#5B21B6", time:"11:15 AM" },
                  };
                  const ALL_EVENT_NAMES = ["Knockout","Free Throw Contest","3-Point Contest","1-on-1 Challenge","3-on-3 Tournament","Layup Contest"];
                  const teamName = (id: string) => teams.find(t => t.id === id)?.name || "";
                  return (
                    <div className="space-y-4">
                      {ALL_EVENT_NAMES.map(evtName => {
                        const meta   = CONTEST_META[evtName] || { abbr: evtName.slice(0,3).toUpperCase(), rule: "", bg: "#333", color: "#fff", time: "" };
                        const evts   = individualEvents.filter(e => e.name === evtName);
                        if (evts.length === 0) return null; // only show events added by admin
                        const anyLive     = evts.some(e => e.status === "live");
                        const anyComplete = evts.some(e => e.status === "complete");

                        return (
                          <div key={evtName} className={`rounded-xl overflow-hidden border transition-all ${
                            anyLive ? "border-[#E03A3A]/60 shadow-lg shadow-[#E03A3A]/10" : "border-white/10"
                          }`}>
                            {/* Event header */}
                            <div className="flex items-center gap-3 px-4 py-3" style={{ background: meta.bg }}>
                              <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center text-xs font-black shrink-0"
                                style={{ color: meta.color }}>{meta.abbr}</div>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm" style={{ color: meta.color }}>{evtName}</div>
                                <div className="text-[11px] opacity-60 mt-0.5" style={{ color: meta.color }}>{meta.time} · {meta.rule}</div>
                              </div>
                              {anyLive     && <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-white/20 text-white animate-pulse shrink-0">🔴 LIVE</span>}
                              {anyComplete && <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-black/30 text-white/70 shrink-0">✅ DONE</span>}
                              {!anyLive && !anyComplete && <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/20 shrink-0" style={{ color: meta.color, opacity: 0.6 }}>UPCOMING</span>}
                            </div>

                            {/* Winner banner — shown when complete */}
                            {anyComplete && evts.some(e => e.winner) && (
                              <div className="px-4 py-3 border-b border-white/10" style={{ background: `${meta.bg}22` }}>
                                {evts.filter(e => e.winner).map(e => (
                                  <div key={e.id} className="flex flex-wrap items-center gap-4">
                                    <div className="flex items-center gap-2">
                                      <span className="text-2xl">🥇</span>
                                      <div>
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-white/35">{e.division} Champion</div>
                                        <div className="text-base font-black text-white">{e.winner}</div>
                                      </div>
                                    </div>
                                    {e.runnerUp && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-xl">🥈</span>
                                        <div>
                                          <div className="text-[10px] font-bold uppercase tracking-widest text-white/35">Runner-Up</div>
                                          <div className="text-sm font-bold text-white/60">{e.runnerUp}</div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Participants by division */}
                            <div className={`divide-y divide-white/5 ${anyComplete && evts.some(e => e.winner) ? "bg-white/2" : "bg-white/3"}`}>
                              {evts.map(e => {
                                const hasNominees = e.nominees.some(n => n.players.some(p => p.trim()));
                                return (
                                  <div key={e.id} className="px-4 py-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                        e.division === "NBA" ? "bg-orange-500/20 text-orange-400" : "bg-blue-500/20 text-blue-400"
                                      }`}>{e.division}</span>
                                      <span className="text-[10px] text-white/25">{e.division === "NBA" ? "1st–4th Grade" : "5th–8th Grade"}</span>
                                    </div>
                                    {!hasNominees ? (
                                      <p className="text-xs text-white/25 italic">Participants TBA</p>
                                    ) : (
                                      <div className="space-y-2">
                                        {e.nominees.map(nom => {
                                          const players = nom.players.filter(p => p.trim());
                                          if (players.length === 0) return null;
                                          const tName = teamName(nom.teamId);
                                          return (
                                            <div key={nom.teamId} className="flex items-start gap-2">
                                              {tName && (
                                                <span className="text-[10px] font-bold text-white/35 pt-0.5 shrink-0 min-w-[60px]">{tName}</span>
                                              )}
                                              <div className="flex flex-wrap gap-1.5">
                                                {players.map((p, pi) => (
                                                  <span key={pi} className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                                                    anyLive ? "bg-white/15 text-white" : "bg-white/8 text-white/65"
                                                  }`}>
                                                    {p}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          );
                                        })}
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
