"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ─────────────────────────────────────────────────────────
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

// ─── Default Schedule ───────────────────────────────────────────────
const DEFAULT_SCHEDULE: DayData[] = [
  {
    label: "Day 1", date: "Monday, June 22", theme: "Fundamentals",
    rows: [
      { id: "1-1",  time: "7:30 AM",  activity: "Check-In & Registration",                      note: "",                                  type: "normal"    },
      { id: "1-2",  time: "8:00 AM",  activity: "Welcome, Camp Overview & Introductions",        note: "All campers",                       type: "highlight" },
      { id: "1-3",  time: "8:15 AM",  activity: "Warm-Up & Dynamic Stretching",                  note: "",                                  type: "normal"    },
      { id: "1-4",  time: "8:30 AM",  activity: "SKILL STATION — Ballhandling Fundamentals",     note: "Both courts",                       type: "section"   },
      { id: "1-5",  time: "9:15 AM",  activity: "SKILL STATION — Footwork & Pivoting",           note: "Both courts",                       type: "section"   },
      { id: "1-6",  time: "10:00 AM", activity: "SKILL STATION — Passing & Catching",            note: "Both courts",                       type: "section"   },
      { id: "1-7",  time: "10:45 AM", activity: "Water Break",                                   note: "5 min",                             type: "break"     },
      { id: "1-8",  time: "11:00 AM", activity: "Seeding Round 1 — NBA Division",                note: "2x12-min clock | 1st-4th Grade",    type: "game"      },
      { id: "1-9",  time: "11:30 AM", activity: "Seeding Round 1 — College Division",            note: "2x12-min clock | 5th-8th Grade",    type: "game"      },
      { id: "1-10", time: "12:00 PM", activity: "Lunch Break",                                   note: "60 min",                            type: "break"     },
      { id: "1-11", time: "1:00 PM",  activity: "SKILL STATION — Shooting Form & Arc",           note: "Both courts",                       type: "section"   },
      { id: "1-12", time: "1:45 PM",  activity: "SKILL STATION — Defensive Positioning",         note: "Both courts",                       type: "section"   },
      { id: "1-13", time: "2:30 PM",  activity: "Cool Down & Camp Debrief",                      note: "",                                  type: "normal"    },
      { id: "1-14", time: "3:00 PM",  activity: "End of Day",                                    note: "",                                  type: "highlight" },
    ],
  },
  {
    label: "Day 2", date: "Tuesday, June 23", theme: "Team Play",
    rows: [
      { id: "2-1",  time: "7:30 AM",  activity: "Check-In & Warm-Up",                               note: "",                                          type: "normal"    },
      { id: "2-2",  time: "8:00 AM",  activity: "TEAM FORMATION & NAMING (5 min)",                  note: "NBA: 1st-4th | College: 5th-8th",            type: "highlight" },
      { id: "2-3",  time: "8:15 AM",  activity: "SKILL STATION — Post Moves & Low-Post Finishing",  note: "Both courts",                               type: "section"   },
      { id: "2-4",  time: "9:00 AM",  activity: "SKILL STATION — Shooting Off Screens",             note: "Both courts",                               type: "section"   },
      { id: "2-5",  time: "9:45 AM",  activity: "Water Break",                                      note: "5 min",                                     type: "break"     },
      { id: "2-6",  time: "10:00 AM", activity: "Seeding Round 2 — NBA Division",                   note: "T1 vs T3 | T2 vs T4 | 2x12-min clock",     type: "game"      },
      { id: "2-7",  time: "11:00 AM", activity: "Seeding Round 2 — College Division",               note: "T1 vs T3 | T2 vs T4 | 2x12-min clock",     type: "game"      },
      { id: "2-8",  time: "12:00 PM", activity: "Lunch Break",                                      note: "60 min",                                    type: "break"     },
      { id: "2-9",  time: "1:00 PM",  activity: "SKILL STATION — Transition Offense / Fast Break",  note: "Both courts",                               type: "section"   },
      { id: "2-10", time: "1:45 PM",  activity: "SKILL STATION — 3-Point & Free Throw Practice",   note: "Both courts",                               type: "section"   },
      { id: "2-11", time: "2:30 PM",  activity: "Championship Contest Preview & Practice",          note: "All campers",                               type: "normal"    },
      { id: "2-12", time: "3:00 PM",  activity: "End of Day",                                       note: "",                                          type: "highlight" },
    ],
  },
  {
    label: "Day 3", date: "Wednesday, June 24", theme: "Advanced Skills",
    rows: [
      { id: "3-1",  time: "7:30 AM",  activity: "Check-In & Warm-Up",                          note: "",                                          type: "normal"    },
      { id: "3-2",  time: "8:00 AM",  activity: "SKILL STATION — Pick & Roll Offense",         note: "Both courts",                               type: "section"   },
      { id: "3-3",  time: "8:45 AM",  activity: "SKILL STATION — Fast Break & Transition D",   note: "Both courts",                               type: "section"   },
      { id: "3-4",  time: "9:30 AM",  activity: "Seeding Round 3 — NBA Division",              note: "T1 vs T4 | T2 vs T3 | 2x12-min clock",     type: "game"      },
      { id: "3-5",  time: "10:30 AM", activity: "Water Break",                                 note: "5 min",                                     type: "break"     },
      { id: "3-6",  time: "10:45 AM", activity: "Seeding Round 3 — College Division",          note: "T1 vs T4 | T2 vs T3 | 2x12-min clock",     type: "game"      },
      { id: "3-7",  time: "11:45 AM", activity: "Championship Day Preview / Lineup Cards",     note: "Teams nominate players for each contest",   type: "highlight" },
      { id: "3-8",  time: "12:15 PM", activity: "Lunch Break",                                 note: "60 min",                                    type: "break"     },
      { id: "3-9",  time: "1:15 PM",  activity: "Individual Contest Practice / Shootaround",   note: "All courts",                                type: "normal"    },
      { id: "3-10", time: "2:15 PM",  activity: "Final Standings Announced",                   note: "All teams",                                 type: "highlight" },
      { id: "3-11", time: "2:30 PM",  activity: "Cool Down & Championship Day Prep",           note: "",                                          type: "normal"    },
      { id: "3-12", time: "3:00 PM",  activity: "End of Day",                                  note: "",                                          type: "highlight" },
    ],
  },
  {
    label: "Championship", date: "Thursday, June 25", theme: "Championship Day",
    rows: [
      { id: "4-1",  time: "7:30 AM",  activity: "Doors Open & Warm-Up",                  note: "",                                               type: "normal"    },
      { id: "4-2",  time: "8:00 AM",  activity: "Opening Ceremony",                      note: "All campers",                                    type: "highlight" },
      { id: "4-3",  time: "8:15 AM",  activity: "KNOCKOUT CONTEST — All Camp",           note: "Last one standing wins!",                        type: "game"      },
      { id: "4-4",  time: "9:00 AM",  activity: "FREE THROW CONTEST",                    note: "Best of 10, 2 at a time | Tie = Sudden Death",   type: "game"      },
      { id: "4-5",  time: "9:30 AM",  activity: "3-POINT CONTEST",                       note: "3 balls at 5 spots | 1 min per shooter",         type: "game"      },
      { id: "4-6",  time: "10:00 AM", activity: "1-ON-1 CONTEST",                        note: "First to 15 points (2s and 3s count)",           type: "game"      },
      { id: "4-7",  time: "10:30 AM", activity: "3-ON-3 CONTEST",                        note: "First to 21 points (2s and 3s count)",           type: "game"      },
      { id: "4-8",  time: "11:15 AM", activity: "LAYUP CONTEST (Team Event)",            note: "Right 1 min + Left 1 min | Team total wins",     type: "game"      },
      { id: "4-9",  time: "12:00 PM", activity: "Lunch / Bracket Reveal",                note: "60 min",                                         type: "break"     },
      { id: "4-10", time: "12:15 PM", activity: "SEMIFINAL GAMES — NBA Division",        note: "#1 vs #4 | #2 vs #3 | 2x12-min clock",          type: "game"      },
      { id: "4-11", time: "12:55 PM", activity: "SEMIFINAL GAMES — College Division",    note: "#1 vs #4 | #2 vs #3 | 2x12-min clock",          type: "game"      },
      { id: "4-12", time: "1:10 PM",  activity: "CHAMPIONSHIP GAME — NBA Division",      note: "Semifinal winners | 2x20-min clock",              type: "highlight" },
      { id: "4-13", time: "1:50 PM",  activity: "CHAMPIONSHIP GAME — College Division",  note: "Semifinal winners | 2x20-min clock",              type: "highlight" },
      { id: "4-14", time: "2:30 PM",  activity: "AWARDS CEREMONY",                       note: "Trophies, medals & camp awards",                 type: "highlight" },
      { id: "4-15", time: "2:50 PM",  activity: "Photos & Closing Remarks",              note: "",                                               type: "normal"    },
      { id: "4-16", time: "3:00 PM",  activity: "Dismissal",                             note: "",                                               type: "highlight" },
    ],
  },
];

const STORAGE_KEY = "hilhi-camp-2026";

// ─── Row background styles ──────────────────────────────────────────
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

// ─── Main Component ─────────────────────────────────────────────────
export default function CampHubPage() {
  const [schedule, setSchedule]   = useState<DayData[]>(DEFAULT_SCHEDULE);
  const [activeDay, setActiveDay] = useState(0);
  const [editMode, setEditMode]   = useState(false);
  const [isLive, setIsLive]       = useState(false);
  const [liveDay, setLiveDay]     = useState(-1);
  const [showAdmin, setShowAdmin] = useState(true);
  const [saved, setSaved]         = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed.schedule) setSchedule(parsed.schedule);
        if (parsed.isLive !== undefined) setIsLive(parsed.isLive);
        if (parsed.liveDay !== undefined) setLiveDay(parsed.liveDay);
      }
    } catch {}
  }, []);

  // Save to localStorage
  const persist = useCallback((newSchedule: DayData[], newIsLive: boolean, newLiveDay: number) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ schedule: newSchedule, isLive: newIsLive, liveDay: newLiveDay }));
    } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, []);

  // Update a row field
  function updateRow(dayIdx: number, rowId: string, field: keyof ScheduleRow, value: string) {
    const next = schedule.map((d, di) => di !== dayIdx ? d : {
      ...d,
      rows: d.rows.map(r => r.id === rowId ? { ...r, [field]: value } : r),
    });
    setSchedule(next);
    persist(next, isLive, liveDay);
  }

  // Delete a row
  function deleteRow(dayIdx: number, rowId: string) {
    const next = schedule.map((d, di) => di !== dayIdx ? d : {
      ...d, rows: d.rows.filter(r => r.id !== rowId),
    });
    setSchedule(next);
    persist(next, isLive, liveDay);
  }

  // Add a row
  function addRow(dayIdx: number) {
    const next = schedule.map((d, di) => di !== dayIdx ? d : {
      ...d, rows: [...d.rows, { id: `${dayIdx}-${Date.now()}`, time: "", activity: "New Event", note: "", type: "normal" as RowType }],
    });
    setSchedule(next);
    persist(next, isLive, liveDay);
  }

  // Live toggle
  function toggleLive(val: boolean) {
    setIsLive(val);
    const newLiveDay = val && liveDay < 0 ? 0 : liveDay;
    setLiveDay(newLiveDay);
    persist(schedule, val, newLiveDay);
  }

  // Cycle live day
  function cycleLiveDay() {
    if (!isLive) return;
    const next = (liveDay + 1) % 4;
    setLiveDay(next);
    persist(schedule, isLive, next);
  }

  // Reset
  function resetSchedule() {
    if (!confirm("Reset to original schedule? All edits will be lost.")) return;
    const fresh = JSON.parse(JSON.stringify(DEFAULT_SCHEDULE));
    setSchedule(fresh);
    persist(fresh, isLive, liveDay);
  }

  const current = schedule[activeDay];

  return (
    <div className="min-h-screen bg-[#080C14] text-white" style={{ fontFamily: "system-ui, sans-serif" }}>

      {/* ── ADMIN BAR ── */}
      {showAdmin && (
        <div className="sticky top-0 z-50 bg-[#111827] border-b-2 border-[#F4A800] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[#F4A800] text-xs font-black uppercase tracking-widest">
            Admin Controls {saved && <span className="ml-2 text-green-400 normal-case">Saved!</span>}
          </span>

          <div className="flex flex-wrap items-center gap-4">
            {/* Live / Public toggle */}
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${isLive ? "bg-[#E03A3A] text-white" : "bg-white/10 text-white/40"}`}>
                {isLive ? "LIVE" : "PUBLIC"}
              </span>
              <button
                onClick={() => toggleLive(!isLive)}
                className={`w-11 h-6 rounded-full transition-colors relative ${isLive ? "bg-[#E03A3A]" : "bg-white/20"}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${isLive ? "left-5" : "left-0.5"}`} />
              </button>
              <span className="text-white/50 text-xs">LIVE</span>
            </div>

            {/* Edit toggle */}
            <div className="flex items-center gap-2">
              <span className="text-white/50 text-xs">Edit Schedule</span>
              <button
                onClick={() => setEditMode(!editMode)}
                className={`w-11 h-6 rounded-full transition-colors relative ${editMode ? "bg-green-600" : "bg-white/20"}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${editMode ? "left-5" : "left-0.5"}`} />
              </button>
            </div>

            <button onClick={resetSchedule} className="text-xs text-white/40 hover:text-white/70 border border-white/20 px-2.5 py-1 rounded-md transition-colors">
              Reset
            </button>
            <button onClick={() => setShowAdmin(false)} className="text-xs text-white/40 hover:text-white/70 border border-white/20 px-2.5 py-1 rounded-md transition-colors">
              Hide
            </button>
          </div>
        </div>
      )}

      {!showAdmin && (
        <button onClick={() => setShowAdmin(true)} className="fixed bottom-4 right-4 z-50 bg-[#1B2A5E] border-2 border-[#F4A800] text-[#F4A800] text-xs font-black px-3 py-2 rounded-lg shadow-xl">
          Admin
        </button>
      )}

      {/* Edit mode banner */}
      {editMode && (
        <div className="bg-[#F4A800]/15 border-b border-[#F4A800]/30 py-2 text-center text-[#F4A800] text-xs font-bold tracking-wide">
          EDIT MODE ON — Click any field below to change it
        </div>
      )}

      {/* ── HERO ── */}
      <div className="relative bg-gradient-to-b from-[#0D1520] to-[#080C14] px-4 pt-10 pb-8 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% -20%, rgba(244,168,0,.1) 0%, transparent 60%)" }} />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold mb-5 tracking-wider">
            <span className={`w-2 h-2 rounded-full ${isLive ? "bg-orange-400 animate-pulse" : "bg-white/30"}`} />
            {isLive ? "LIVE CAMP HUB" : "CAMP SCHEDULE HUB"}
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase leading-tight mb-2">Hilhi Summer Youth Hoop Camp</h1>
          <div className="text-5xl md:text-7xl font-black mb-3" style={{ color: "#F4A800" }}>2026</div>
          <p className="text-white/45 mb-5">June 22–25, 2026 · Follow the action in real time</p>
          <div className="flex flex-wrap justify-center gap-2 mb-5">
            <span className="text-xs px-3 py-1.5 rounded-full bg-white/10">Grades 1st–8th</span>
            <span className="text-xs px-3 py-1.5 rounded-full bg-white/10">7:30 AM – 3:00 PM</span>
            <span className="text-xs px-3 py-1.5 rounded-full font-bold" style={{ background: "#F4A800", color: "#0B0F1A" }}>NBA Teams: 1st–4th Grade</span>
            <span className="text-xs px-3 py-1.5 rounded-full font-bold bg-[#E03A3A]">College Teams: 5th–8th Grade</span>
          </div>
          {/* Live day indicator */}
          <button
            onClick={cycleLiveDay}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm border-none cursor-pointer transition-all ${isLive && liveDay >= 0 ? "bg-green-600 shadow-lg shadow-green-900/40" : "bg-white/10 text-white/40"}`}
            title={isLive ? "Click to change live day" : "Turn on LIVE in admin bar first"}
          >
            <span className={`w-2 h-2 rounded-full ${isLive && liveDay >= 0 ? "bg-white animate-pulse" : "bg-white/30"}`} />
            {isLive && liveDay >= 0 ? `Day ${liveDay + 1} is Live!` : "No Live Day Set"}
          </button>
        </div>
      </div>

      {/* ── TAB BAR ── */}
      <div className="sticky top-0 z-40 bg-[#0D1520]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-4xl mx-auto flex overflow-x-auto">
          {schedule.map((d, i) => (
            <button
              key={i}
              onClick={() => setActiveDay(i)}
              className={`relative flex-shrink-0 px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                activeDay === i ? "border-[#F4A800] text-[#F4A800]" : "border-transparent text-white/40 hover:text-white/70"
              }`}
            >
              {d.label}
              {i === 3 && <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-black bg-[#E03A3A] text-white">FINALS</span>}
              {isLive && liveDay === i && (
                <span className="absolute top-2 right-1.5 w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── SCHEDULE CONTENT ── */}
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Day header */}
        <div className="mb-4">
          <h2 className="text-lg font-black uppercase" style={{ color: "#F4A800" }}>
            {current.label}
            {activeDay === 3 && <span className="ml-2 text-sm text-[#E03A3A]">— Championship Day</span>}
          </h2>
          <p className="text-xs text-white/35 mt-0.5">{current.date}, 2026 · {current.theme}</p>
        </div>

        {/* ── SCHEDULE TABLE ── */}
        <div className="rounded-2xl overflow-hidden border border-white/10 mb-6">

          {/* Column headers */}
          <div className={`grid px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-white/30 bg-white/5 border-b border-white/10 ${editMode ? "grid-cols-[90px_1fr_1fr_32px]" : "grid-cols-[90px_1fr_1fr]"}`}>
            <div>Time</div>
            <div>Activity</div>
            <div>Notes</div>
            {editMode && <div />}
          </div>

          {/* Rows */}
          {current.rows.map((row) => (
            <div
              key={row.id}
              className={`grid px-4 py-2.5 border-b border-white/5 last:border-0 items-start ${rowBg(row.type)} ${editMode ? "grid-cols-[90px_1fr_1fr_32px]" : "grid-cols-[90px_1fr_1fr]"}`}
            >
              {/* Time */}
              {editMode ? (
                <input
                  value={row.time}
                  onChange={e => updateRow(activeDay, row.id, "time", e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-md px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-[#F4A800]/60"
                />
              ) : (
                <div className={`text-xs font-mono pt-0.5 ${timeColor(row.type)}`}>{row.time}</div>
              )}

              {/* Activity */}
              {editMode ? (
                <div className="px-1 space-y-1">
                  <input
                    value={row.activity}
                    onChange={e => updateRow(activeDay, row.id, "activity", e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-[#F4A800]/60"
                  />
                  <select
                    value={row.type}
                    onChange={e => updateRow(activeDay, row.id, "type", e.target.value)}
                    className="w-full bg-[#111827] border border-white/20 rounded-md px-2 py-1 text-[10px] text-white/60 focus:outline-none"
                  >
                    <option value="normal">Normal</option>
                    <option value="section">Section Header</option>
                    <option value="game">Game</option>
                    <option value="break">Break / Lunch</option>
                    <option value="highlight">Highlight</option>
                  </select>
                </div>
              ) : (
                <div className={`text-xs leading-snug ${actColor(row.type)}`}>
                  {row.activity}
                  {row.note && <div className="text-[11px] text-white/28 mt-0.5 sm:hidden">{row.note}</div>}
                </div>
              )}

              {/* Note */}
              {editMode ? (
                <input
                  value={row.note}
                  onChange={e => updateRow(activeDay, row.id, "note", e.target.value)}
                  placeholder="notes..."
                  className="w-full mx-1 bg-white/10 border border-white/20 rounded-md px-2 py-1 text-xs text-white/55 focus:outline-none focus:border-[#F4A800]/60"
                />
              ) : (
                <div className="text-[11px] text-white/28 hidden sm:block pt-0.5 leading-relaxed">{row.note}</div>
              )}

              {/* Delete */}
              {editMode && (
                <button onClick={() => deleteRow(activeDay, row.id)} className="text-white/20 hover:text-red-400 transition-colors text-sm self-center">
                  ✕
                </button>
              )}
            </div>
          ))}

          {/* Add row */}
          {editMode && (
            <button
              onClick={() => addRow(activeDay)}
              className="w-full py-3 text-xs text-white/30 hover:text-[#F4A800] hover:bg-white/3 transition-all border-t border-white/5 flex items-center justify-center gap-1.5"
            >
              + Add row to {current.label}
            </button>
          )}
        </div>

        {/* ── Seeding (Days 1-3) ── */}
        {activeDay < 3 && (
          <div className="mb-6">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-2">Seeding Schedule — Both Divisions</h3>
            <div className="rounded-xl border border-white/10 overflow-hidden bg-white/2">
              {[
                { label: "Round 1 — Jun 22", games: "Team A vs Team B · Team C vs Team D" },
                { label: "Round 2 — Jun 23", games: "Team A vs Team C · Team B vs Team D" },
                { label: "Round 3 — Jun 24", games: "Team A vs Team D · Team B vs Team C" },
              ].map((r, i) => (
                <div key={i} className={`flex items-center gap-3 px-4 py-3 border-b border-white/4 last:border-0 ${i === activeDay ? "bg-[#F4A800]/8" : ""}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${i === activeDay ? "bg-[#F4A800] text-black" : "bg-white/10 text-white/40"}`}>{i + 1}</div>
                  <div>
                    <div className="text-sm font-semibold text-white/75">{r.label}</div>
                    <div className="text-xs text-white/28 mt-0.5">{r.games}</div>
                  </div>
                  {i === activeDay && <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded bg-[#E03A3A]">TODAY</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Championship Bracket ── */}
        {activeDay === 3 && (
          <div className="mb-6">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-2">Championship Bracket</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { name: "NBA Division", grade: "1st-4th Grade", color: "#1B2A5E", accent: "#F4A800" },
                { name: "College Division", grade: "5th-8th Grade", color: "#E03A3A", accent: "#fff" },
              ].map(d => (
                <div key={d.name} className="rounded-xl border border-white/10 overflow-hidden">
                  <div className="px-4 py-2.5 text-sm font-black uppercase" style={{ background: d.color, color: d.accent }}>
                    {d.name} <span className="font-normal text-[11px] opacity-60">· {d.grade}</span>
                  </div>
                  <div className="p-4 bg-white/3 space-y-3">
                    <p className="text-[10px] font-bold uppercase text-white/28 mb-1">Semifinals — 12:15 PM</p>
                    {[["#1","#4"],["#2","#3"]].map(([a,b],i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <div className="flex-1 border border-dashed border-white/15 rounded py-1.5 text-center text-white/35">{a} Seed</div>
                        <span className="text-white/20 text-[10px]">vs</span>
                        <div className="flex-1 border border-dashed border-white/15 rounded py-1.5 text-center text-white/35">{b} Seed</div>
                        <span className="text-white/20">›</span>
                        <div className="flex-1 border border-dashed border-white/25 rounded py-1.5 text-center text-white/28">Winner</div>
                      </div>
                    ))}
                    <p className="text-[10px] font-bold uppercase text-white/28 mt-2 mb-1">Championship — 1:10 PM</p>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex-1 border border-dashed border-white/15 rounded py-1.5 text-center text-white/28">SF1 Win</div>
                      <span className="text-white/20 text-[10px]">vs</span>
                      <div className="flex-1 border border-dashed border-white/15 rounded py-1.5 text-center text-white/28">SF2 Win</div>
                      <span className="text-white/20">›</span>
                      <div className="flex-1 rounded py-1.5 text-center text-xs font-black" style={{ background: `${d.color}30`, border: `1px solid ${d.accent}`, color: d.accent }}>CHAMP</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Contest Rules ── */}
        {activeDay === 3 && (
          <div className="mb-6">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-2">Individual Contest Rules</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { abbr:"FT",  name:"Free Throw",      sub:"1-2 players/team", rule:"Best of 10 shots, 2 at a time. Tie goes to sudden death.", color:"#1B4FC4" },
                { abbr:"3PT", name:"3-Point Contest", sub:"1-2 players/team", rule:"3 balls at 5 spots around arc. 1 minute per shooter.", color:"#C41B1B" },
                { abbr:"1v1", name:"1-on-1",          sub:"1 player/team",    rule:"First to 15 points. 2-pointers and 3-pointers count.", color:"#1B7A3C" },
                { abbr:"3v3", name:"3-on-3",          sub:"3 players/team",   rule:"First to 21 points. 2-pointers and 3-pointers count.", color:"#7B3F00" },
                { abbr:"LAY", name:"Layup Contest",   sub:"Full team",        rule:"Right hand 1 min + Left hand 1 min. Team total wins.", color:"#5B21B6" },
                { abbr:"KO",  name:"Knockout",        sub:"ALL campers",      rule:"Everyone in line. Make your shot before the person behind you. Last standing wins!", color:"#B91C1C" },
              ].map(c => (
                <div key={c.name} className="rounded-xl overflow-hidden border border-white/10">
                  <div className="flex items-center gap-3 px-3 py-2.5" style={{ background: c.color }}>
                    <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-[11px] font-black">{c.abbr}</div>
                    <div><div className="text-sm font-bold">{c.name}</div><div className="text-[11px] opacity-60">{c.sub}</div></div>
                  </div>
                  <div className="px-3 py-2.5 bg-white/4 text-xs text-white/50 leading-relaxed">{c.rule}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 4-Day Overview ── */}
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white/28 bg-white/3 border-b border-white/10">
            4-Day Camp Overview
          </div>
          {schedule.map((d, i) => (
            <button
              key={i}
              onClick={() => setActiveDay(i)}
              className="w-full flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center text-white flex-shrink-0" style={{ background: i === 3 ? "#E03A3A" : "#1B2A5E" }}>
                <span className="text-[9px] opacity-60 leading-none">Jun</span>
                <span className="text-base font-black leading-tight">{22 + i}</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white/75">{d.label}{i === 3 ? " — Championship" : ""}</div>
                <div className="text-xs text-white/28">{d.date}, 2026 · {d.theme}</div>
              </div>
              {isLive && liveDay === i && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-600">LIVE</span>}
              <span className="text-white/20">›</span>
            </button>
          ))}
        </div>
      </div>

      <footer className="bg-[#0D1520] border-t border-white/10 py-6 text-center">
        <div className="text-base font-black uppercase"><span style={{ color: "#F4A800" }}>HILHI</span> Youth Hoop Camp 2026</div>
        <div className="text-xs text-white/28 mt-1">June 22–25, 2026 · Grades 1st–8th · NBA: 1st–4th · College: 5th–8th</div>
      </footer>
    </div>
  );
}
