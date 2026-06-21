"use client";

import { useState, useEffect } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────
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
  rows: ScheduleRow[];
}

// ─── Default Schedule ────────────────────────────────────────────────────────
const DEFAULT: DayData[] = [
  {
    label: "Day 1", date: "Monday, June 22",
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
      { id:"1-10", time:"12:00 PM", activity:"Lunch Break",                                   note:"60 min",                           type:"break"     },
      { id:"1-11", time:"1:00 PM",  activity:"SKILL STATION — Shooting Form & Arc",           note:"Both courts",                      type:"section"   },
      { id:"1-12", time:"1:45 PM",  activity:"SKILL STATION — Defensive Positioning",         note:"Both courts",                      type:"section"   },
      { id:"1-13", time:"2:30 PM",  activity:"Cool Down & Camp Debrief",                      note:"",                                 type:"normal"    },
      { id:"1-14", time:"3:00 PM",  activity:"End of Day",                                    note:"",                                 type:"highlight" },
    ],
  },
  {
    label: "Day 2", date: "Tuesday, June 23",
    rows: [
      { id:"2-1",  time:"7:30 AM",  activity:"Check-In & Warm-Up",                               note:"",                                        type:"normal"    },
      { id:"2-2",  time:"8:00 AM",  activity:"TEAM FORMATION & NAMING (5 min)",                  note:"NBA: 1st-4th | College: 5th-8th",         type:"highlight" },
      { id:"2-3",  time:"8:15 AM",  activity:"SKILL STATION — Post Moves & Low-Post Finishing",  note:"Both courts",                             type:"section"   },
      { id:"2-4",  time:"9:00 AM",  activity:"SKILL STATION — Shooting Off Screens",             note:"Both courts",                             type:"section"   },
      { id:"2-5",  time:"9:45 AM",  activity:"Water Break",                                      note:"5 min",                                   type:"break"     },
      { id:"2-6",  time:"10:00 AM", activity:"Seeding Round 2 — NBA Division",                   note:"T1 vs T3 | T2 vs T4 | 2x12-min clock",   type:"game"      },
      { id:"2-7",  time:"11:00 AM", activity:"Seeding Round 2 — College Division",               note:"T1 vs T3 | T2 vs T4 | 2x12-min clock",   type:"game"      },
      { id:"2-8",  time:"12:00 PM", activity:"Lunch Break",                                      note:"60 min",                                  type:"break"     },
      { id:"2-9",  time:"1:00 PM",  activity:"SKILL STATION — Transition Offense / Fast Break",  note:"Both courts",                             type:"section"   },
      { id:"2-10", time:"1:45 PM",  activity:"SKILL STATION — 3-Point & Free Throw Practice",   note:"Both courts",                             type:"section"   },
      { id:"2-11", time:"2:30 PM",  activity:"Championship Contest Preview & Practice",          note:"All campers",                             type:"normal"    },
      { id:"2-12", time:"3:00 PM",  activity:"End of Day",                                       note:"",                                        type:"highlight" },
    ],
  },
  {
    label: "Day 3", date: "Wednesday, June 24",
    rows: [
      { id:"3-1",  time:"7:30 AM",  activity:"Check-In & Warm-Up",                         note:"",                                        type:"normal"    },
      { id:"3-2",  time:"8:00 AM",  activity:"SKILL STATION — Pick & Roll Offense",        note:"Both courts",                             type:"section"   },
      { id:"3-3",  time:"8:45 AM",  activity:"SKILL STATION — Fast Break & Transition D",  note:"Both courts",                             type:"section"   },
      { id:"3-4",  time:"9:30 AM",  activity:"Seeding Round 3 — NBA Division",             note:"T1 vs T4 | T2 vs T3 | 2x12-min clock",   type:"game"      },
      { id:"3-5",  time:"10:30 AM", activity:"Water Break",                                note:"5 min",                                   type:"break"     },
      { id:"3-6",  time:"10:45 AM", activity:"Seeding Round 3 — College Division",         note:"T1 vs T4 | T2 vs T3 | 2x12-min clock",   type:"game"      },
      { id:"3-7",  time:"11:45 AM", activity:"Championship Day Preview / Lineup Cards",    note:"Teams nominate players for each contest", type:"highlight" },
      { id:"3-8",  time:"12:15 PM", activity:"Lunch Break",                                note:"60 min",                                  type:"break"     },
      { id:"3-9",  time:"1:15 PM",  activity:"Individual Contest Practice / Shootaround",  note:"All courts",                              type:"normal"    },
      { id:"3-10", time:"2:15 PM",  activity:"Final Standings Announced",                  note:"All teams",                               type:"highlight" },
      { id:"3-11", time:"2:30 PM",  activity:"Cool Down & Championship Day Prep",          note:"",                                        type:"normal"    },
      { id:"3-12", time:"3:00 PM",  activity:"End of Day",                                 note:"",                                        type:"highlight" },
    ],
  },
  {
    label: "Championship", date: "Thursday, June 25",
    rows: [
      { id:"4-1",  time:"7:30 AM",  activity:"Doors Open & Warm-Up",                  note:"",                                              type:"normal"    },
      { id:"4-2",  time:"8:00 AM",  activity:"Opening Ceremony",                      note:"All campers",                                   type:"highlight" },
      { id:"4-3",  time:"8:15 AM",  activity:"KNOCKOUT CONTEST — All Camp",           note:"Last one standing wins!",                       type:"game"      },
      { id:"4-4",  time:"9:00 AM",  activity:"FREE THROW CONTEST",                    note:"Best of 10, 2 at a time | Tie = Sudden Death",  type:"game"      },
      { id:"4-5",  time:"9:30 AM",  activity:"3-POINT CONTEST",                       note:"3 balls at 5 spots | 1 min per shooter",        type:"game"      },
      { id:"4-6",  time:"10:00 AM", activity:"1-ON-1 CONTEST",                        note:"First to 15 points (2s and 3s count)",          type:"game"      },
      { id:"4-7",  time:"10:30 AM", activity:"3-ON-3 CONTEST",                        note:"First to 21 points (2s and 3s count)",          type:"game"      },
      { id:"4-8",  time:"11:15 AM", activity:"LAYUP CONTEST (Team Event)",            note:"Right 1 min + Left 1 min | Team total wins",    type:"game"      },
      { id:"4-9",  time:"12:00 PM", activity:"Lunch / Bracket Reveal",                note:"60 min",                                        type:"break"     },
      { id:"4-10", time:"12:15 PM", activity:"SEMIFINAL GAMES — NBA Division",        note:"#1 vs #4 | #2 vs #3 | 2x12-min clock",         type:"game"      },
      { id:"4-11", time:"12:55 PM", activity:"SEMIFINAL GAMES — College Division",    note:"#1 vs #4 | #2 vs #3 | 2x12-min clock",         type:"game"      },
      { id:"4-12", time:"1:10 PM",  activity:"CHAMPIONSHIP GAME — NBA Division",      note:"Semifinal winners | 2x20-min clock",             type:"highlight" },
      { id:"4-13", time:"1:50 PM",  activity:"CHAMPIONSHIP GAME — College Division",  note:"Semifinal winners | 2x20-min clock",             type:"highlight" },
      { id:"4-14", time:"2:30 PM",  activity:"AWARDS CEREMONY",                       note:"Trophies, medals & camp awards",                type:"highlight" },
      { id:"4-15", time:"2:50 PM",  activity:"Photos & Closing Remarks",              note:"",                                              type:"normal"    },
      { id:"4-16", time:"3:00 PM",  activity:"Dismissal",                             note:"",                                              type:"highlight" },
    ],
  },
];

const STORAGE_KEY = "hilhi-schedule-2026";

// ─── Row styling helpers ─────────────────────────────────────────────────────
function rowStyle(type: RowType) {
  if (type === "section")   return "bg-blue-950/60 border-l-4 border-yellow-400";
  if (type === "game")      return "bg-yellow-400/5 border-l-4 border-yellow-400/40";
  if (type === "break")     return "bg-white/3 opacity-60";
  if (type === "highlight") return "bg-blue-500/8 border-l-4 border-blue-400/50";
  return "hover:bg-white/3";
}

function timeStyle(type: RowType) {
  return type === "section" ? "text-yellow-400 font-bold" : "text-gray-500";
}

function actStyle(type: RowType) {
  if (type === "section")   return "text-yellow-400 font-semibold";
  if (type === "highlight") return "text-white font-medium";
  if (type === "game")      return "text-white";
  if (type === "break")     return "text-gray-500 italic";
  return "text-gray-300";
}

// ─── Component ───────────────────────────────────────────────────────────────
export function ScheduleTab() {
  const [days, setDays]           = useState<DayData[]>(DEFAULT);
  const [activeDay, setActiveDay] = useState(0);
  const [editMode, setEditMode]   = useState(false);
  const [saved, setSaved]         = useState(false);

  // Load saved schedule on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setDays(JSON.parse(stored));
    } catch {}
  }, []);

  function persist(next: DayData[]) {
    setDays(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function updateRow(dayIdx: number, rowId: string, field: keyof ScheduleRow, value: string) {
    persist(days.map((d, di) => di !== dayIdx ? d : {
      ...d,
      rows: d.rows.map(r => r.id === rowId ? { ...r, [field]: value } : r),
    }));
  }

  function deleteRow(dayIdx: number, rowId: string) {
    persist(days.map((d, di) => di !== dayIdx ? d : {
      ...d, rows: d.rows.filter(r => r.id !== rowId),
    }));
  }

  function addRow(dayIdx: number) {
    persist(days.map((d, di) => di !== dayIdx ? d : {
      ...d,
      rows: [...d.rows, {
        id: `${dayIdx + 1}-${Date.now()}`,
        time: "", activity: "New Event", note: "", type: "normal" as RowType,
      }],
    }));
  }

  function reset() {
    if (!confirm("Reset to original schedule? All edits will be lost.")) return;
    persist(JSON.parse(JSON.stringify(DEFAULT)));
  }

  const current = days[activeDay];

  return (
    <div className="space-y-4">

      {/* ── Top bar: day tabs + edit controls ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">

        {/* Day tabs */}
        <div className="flex gap-1 bg-[#1a1f2e] p-1 rounded-xl border border-white/10">
          {days.map((d, i) => (
            <button
              key={i}
              onClick={() => setActiveDay(i)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                activeDay === i
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {d.label}
              {i === 3 && (
                <span className="ml-1.5 text-[10px] font-black bg-orange-500 text-white px-1.5 py-0.5 rounded">FINALS</span>
              )}
            </button>
          ))}
        </div>

        {/* Edit controls */}
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-green-400 text-xs font-semibold">✓ Saved</span>
          )}
          {editMode && (
            <button
              onClick={reset}
              className="text-xs text-gray-500 hover:text-gray-300 border border-white/10 px-3 py-1.5 rounded-lg transition-colors"
            >
              Reset to Default
            </button>
          )}
          <button
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              editMode
                ? "bg-green-600 hover:bg-green-500 text-white"
                : "bg-blue-600 hover:bg-blue-500 text-white"
            }`}
          >
            {editMode ? (
              <><span>✓</span> Done Editing</>
            ) : (
              <><span>✏️</span> Edit Schedule</>
            )}
          </button>
        </div>
      </div>

      {/* Edit mode hint */}
      {editMode && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3 text-sm text-blue-300">
          <strong>Edit Mode On</strong> — Click any field below to change it. Changes save automatically.
        </div>
      )}

      {/* ── Day info ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-lg">
            {current.label}
            {activeDay === 3 && <span className="ml-2 text-orange-400 text-base">— Championship Day</span>}
          </h2>
          <p className="text-gray-500 text-sm">{current.date}, 2026</p>
        </div>
        <span className="text-xs text-gray-600 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
          {current.rows.length} events
        </span>
      </div>

      {/* ── Schedule Table ── */}
      <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#0f1117]">

        {/* Column headers */}
        <div className={`grid text-xs font-bold uppercase tracking-widest text-gray-600 bg-white/5 border-b border-white/10 px-4 py-3 ${editMode ? "grid-cols-[100px_1fr_1fr_36px]" : "grid-cols-[100px_1fr_1fr]"}`}>
          <div>Time</div>
          <div>Activity</div>
          <div>Notes</div>
          {editMode && <div />}
        </div>

        {/* Rows */}
        {current.rows.map((row) => (
          <div
            key={row.id}
            className={`grid px-4 py-3 border-b border-white/5 last:border-0 items-start transition-colors ${rowStyle(row.type)} ${editMode ? "grid-cols-[100px_1fr_1fr_36px]" : "grid-cols-[100px_1fr_1fr]"}`}
          >
            {/* Time cell */}
            {editMode ? (
              <input
                value={row.time}
                onChange={e => updateRow(activeDay, row.id, "time", e.target.value)}
                className="w-full bg-white/8 border border-white/15 rounded-lg px-2 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500/60 focus:bg-white/10"
              />
            ) : (
              <div className={`text-xs font-mono pt-0.5 ${timeStyle(row.type)}`}>{row.time}</div>
            )}

            {/* Activity cell */}
            {editMode ? (
              <div className="px-1 space-y-1.5">
                <input
                  value={row.activity}
                  onChange={e => updateRow(activeDay, row.id, "activity", e.target.value)}
                  className="w-full bg-white/8 border border-white/15 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500/60 focus:bg-white/10"
                />
                <select
                  value={row.type}
                  onChange={e => updateRow(activeDay, row.id, "type", e.target.value)}
                  className="w-full bg-[#1a1f2e] border border-white/15 rounded-lg px-2 py-1 text-xs text-gray-400 focus:outline-none cursor-pointer"
                >
                  <option value="normal">Normal row</option>
                  <option value="section">Section header (navy)</option>
                  <option value="game">Game / Seeding (gold)</option>
                  <option value="break">Break / Lunch (dim)</option>
                  <option value="highlight">Highlight (blue)</option>
                </select>
              </div>
            ) : (
              <div className={`text-sm leading-snug ${actStyle(row.type)}`}>
                {row.activity}
              </div>
            )}

            {/* Note cell */}
            {editMode ? (
              <input
                value={row.note}
                onChange={e => updateRow(activeDay, row.id, "note", e.target.value)}
                placeholder="Add a note..."
                className="mx-1 w-full bg-white/8 border border-white/15 rounded-lg px-2 py-1.5 text-xs text-gray-400 placeholder-gray-700 focus:outline-none focus:border-blue-500/60 focus:bg-white/10"
              />
            ) : (
              <div className="text-xs text-gray-600 pt-0.5 leading-relaxed">{row.note}</div>
            )}

            {/* Delete button */}
            {editMode && (
              <button
                onClick={() => deleteRow(activeDay, row.id)}
                className="self-center text-gray-700 hover:text-red-400 transition-colors text-lg leading-none"
                title="Delete row"
              >
                ×
              </button>
            )}
          </div>
        ))}

        {/* Add row */}
        {editMode && (
          <button
            onClick={() => addRow(activeDay)}
            className="w-full py-3.5 text-sm text-gray-600 hover:text-blue-400 hover:bg-white/3 transition-all border-t border-white/5 flex items-center justify-center gap-2"
          >
            <span className="text-lg leading-none">+</span>
            Add row to {current.label}
          </button>
        )}
      </div>

      {/* ── Summary row count ── */}
      <p className="text-xs text-gray-700 text-right">
        {current.rows.length} scheduled events · Changes auto-save to browser
      </p>
    </div>
  );
}
