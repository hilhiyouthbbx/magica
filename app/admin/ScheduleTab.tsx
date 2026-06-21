"use client";

import { useState, useEffect } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
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

// ─── Time math helpers ────────────────────────────────────────────────────────
function toMins(t: string): number {
  const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return -1;
  let h = parseInt(m[1]);
  const min = parseInt(m[2]);
  const ap = m[3].toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return h * 60 + min;
}

function fromMins(total: number): string {
  if (total < 0) return "";
  const h24 = Math.floor(total / 60) % 24;
  const m = total % 60;
  const ap = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 > 12 ? h24 - 12 : h24 === 0 ? 12 : h24;
  return `${h12}:${m.toString().padStart(2, "0")} ${ap}`;
}

// ─── Default Schedule ─────────────────────────────────────────────────────────
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
      { id:"1-10", time:"12:00 PM", activity:"Lunch Break",                                   note:"45 min",                           type:"break"     },
      { id:"1-11", time:"12:45 PM", activity:"SKILL STATION — Shooting Form & Arc",           note:"Both courts",                      type:"section"   },
      { id:"1-12", time:"1:30 PM",  activity:"SKILL STATION — Defensive Positioning",         note:"Both courts",                      type:"section"   },
      { id:"1-13", time:"2:15 PM",  activity:"Cool Down & Camp Debrief",                      note:"",                                 type:"normal"    },
      { id:"1-14", time:"2:45 PM",  activity:"End of Day",                                    note:"",                                 type:"highlight" },
    ],
  },
  {
    label: "Day 2", date: "Tuesday, June 23",
    rows: [
      { id:"2-1",  time:"7:30 AM",  activity:"Check-In & Warm-Up",                               note:"",                                        type:"normal"    },
      { id:"2-2",  time:"8:00 AM",  activity:"TEAM FORMATION & NAMING",                          note:"NBA: 1st-4th | College: 5th-8th",         type:"highlight" },
      { id:"2-3",  time:"8:15 AM",  activity:"SKILL STATION — Post Moves & Low-Post Finishing",  note:"Both courts",                             type:"section"   },
      { id:"2-4",  time:"9:00 AM",  activity:"SKILL STATION — Shooting Off Screens",             note:"Both courts",                             type:"section"   },
      { id:"2-5",  time:"9:45 AM",  activity:"Water Break",                                      note:"5 min",                                   type:"break"     },
      { id:"2-6",  time:"10:00 AM", activity:"Seeding Round 2 — NBA Division",                   note:"T1 vs T3 | T2 vs T4 | 2x12-min clock",   type:"game"      },
      { id:"2-7",  time:"11:00 AM", activity:"Seeding Round 2 — College Division",               note:"T1 vs T3 | T2 vs T4 | 2x12-min clock",   type:"game"      },
      { id:"2-8",  time:"12:00 PM", activity:"Lunch Break",                                      note:"45 min",                                  type:"break"     },
      { id:"2-9",  time:"12:45 PM", activity:"SKILL STATION — Transition Offense / Fast Break",  note:"Both courts",                             type:"section"   },
      { id:"2-10", time:"1:30 PM",  activity:"SKILL STATION — 3-Point & Free Throw Practice",   note:"Both courts",                             type:"section"   },
      { id:"2-11", time:"2:15 PM",  activity:"Championship Contest Preview & Practice",          note:"All campers",                             type:"normal"    },
      { id:"2-12", time:"2:45 PM",  activity:"End of Day",                                       note:"",                                        type:"highlight" },
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
      { id:"3-8",  time:"12:15 PM", activity:"Lunch Break",                                note:"45 min",                                  type:"break"     },
      { id:"3-9",  time:"1:00 PM",  activity:"Individual Contest Practice / Shootaround",  note:"All courts",                              type:"normal"    },
      { id:"3-10", time:"2:00 PM",  activity:"Final Standings Announced",                  note:"All teams",                               type:"highlight" },
      { id:"3-11", time:"2:15 PM",  activity:"Cool Down & Championship Day Prep",          note:"",                                        type:"normal"    },
      { id:"3-12", time:"2:45 PM",  activity:"End of Day",                                 note:"",                                        type:"highlight" },
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
      { id:"4-9",  time:"12:00 PM", activity:"Lunch / Bracket Reveal",                note:"45 min",                                        type:"break"     },
      { id:"4-10", time:"12:45 PM", activity:"SEMIFINAL GAMES — NBA Division",        note:"#1 vs #4 | #2 vs #3 | 2x12-min clock",         type:"game"      },
      { id:"4-11", time:"1:25 PM",  activity:"SEMIFINAL GAMES — College Division",    note:"#1 vs #4 | #2 vs #3 | 2x12-min clock",         type:"game"      },
      { id:"4-12", time:"1:40 PM",  activity:"CHAMPIONSHIP GAME — NBA Division",      note:"Semifinal winners | 2x20-min clock",            type:"highlight" },
      { id:"4-13", time:"2:20 PM",  activity:"CHAMPIONSHIP GAME — College Division",  note:"Semifinal winners | 2x20-min clock",            type:"highlight" },
      { id:"4-14", time:"3:00 PM",  activity:"AWARDS CEREMONY",                       note:"Trophies, medals & camp awards",                type:"highlight" },
      { id:"4-15", time:"3:20 PM",  activity:"Photos & Closing Remarks",              note:"",                                              type:"normal"    },
      { id:"4-16", time:"3:30 PM",  activity:"Dismissal",                             note:"",                                              type:"highlight" },
    ],
  },
];

// ─── Row color helpers ────────────────────────────────────────────────────────
function rowBg(type: RowType, selected: boolean) {
  if (selected) return "bg-blue-600/20 border-l-4 border-blue-400";
  if (type === "section")   return "bg-blue-950/60 border-l-4 border-yellow-400";
  if (type === "game")      return "bg-yellow-400/5 border-l-4 border-yellow-400/40";
  if (type === "break")     return "bg-white/3 opacity-60";
  if (type === "highlight") return "bg-blue-500/8 border-l-4 border-blue-400/50";
  return "hover:bg-white/5";
}
function timeColor(type: RowType) {
  return type === "section" ? "text-yellow-400 font-bold" : "text-gray-500";
}
function actColor(type: RowType) {
  if (type === "section")   return "text-yellow-400 font-semibold";
  if (type === "highlight") return "text-white font-medium";
  if (type === "game")      return "text-white";
  if (type === "break")     return "text-gray-500 italic";
  return "text-gray-300";
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ScheduleTab({ adminKey }: { adminKey: string }) {
  const [days, setDays]             = useState<DayData[]>(DEFAULT);
  const [activeDay, setActiveDay]   = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editBuf, setEditBuf]       = useState<ScheduleRow | null>(null);
  const [autoShift, setAutoShift]   = useState(true);
  const [flash, setFlash]           = useState("");
  const [loading, setLoading]       = useState(true);

  // ── Load from server on mount ──
  useEffect(() => {
    setLoading(true);
    fetch("/api/camp-schedule")
      .then(r => r.json())
      .then((d: { dailySchedule?: DayData[] }) => {
        if (d.dailySchedule && Array.isArray(d.dailySchedule) && d.dailySchedule.length > 0) {
          setDays(d.dailySchedule);
        }
        // else keep DEFAULT
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Save to server ──
  async function persist(next: DayData[]) {
    setDays(next);
    try {
      await fetch(`/api/camp-schedule?key=${adminKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailySchedule: next }),
      });
    } catch {}
  }

  function notify(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(""), 2500);
  }

  const current = days[activeDay];

  // ── Select a row ──
  function selectRow(row: ScheduleRow) {
    if (selectedId === row.id) {
      setSelectedId(null);
      setEditBuf(null);
    } else {
      setSelectedId(row.id);
      setEditBuf({ ...row });
    }
  }

  // ── Commit edits ──
  function commitEdit() {
    if (!editBuf) return;
    const rows = current.rows;
    const idx  = rows.findIndex(r => r.id === editBuf.id);
    if (idx < 0) return;

    let newRows = rows.map(r => r.id === editBuf.id ? { ...editBuf } : r);

    if (autoShift) {
      const oldMins = toMins(rows[idx].time);
      const newMins = toMins(editBuf.time);
      if (oldMins >= 0 && newMins >= 0 && oldMins !== newMins) {
        const delta = newMins - oldMins;
        newRows = newRows.map((r, i) => {
          if (i <= idx) return r;
          const m = toMins(r.time);
          if (m < 0) return r;
          return { ...r, time: fromMins(m + delta) };
        });
        notify(`⏱ Shifted ${rows.length - idx - 1} rows by ${delta > 0 ? "+" : ""}${delta} min`);
      }
    }

    const nextDays = days.map((d, di) => di !== activeDay ? d : { ...d, rows: newRows });
    persist(nextDays);
    setSelectedId(null);
    setEditBuf(null);
    if (!flash) notify("✓ Saved to server");
  }

  // ── Delete with auto-adjust ──
  function deleteSelected() {
    if (!selectedId) return;
    const rows = current.rows;
    const idx  = rows.findIndex(r => r.id === selectedId);
    if (idx < 0) return;

    let newRows = rows.filter(r => r.id !== selectedId);

    if (autoShift && idx < rows.length - 1) {
      const deletedMins = toMins(rows[idx].time);
      const nextMins    = toMins(rows[idx + 1].time);
      if (deletedMins >= 0 && nextMins >= 0) {
        const duration = nextMins - deletedMins;
        newRows = newRows.map((r, i) => {
          if (i < idx) return r;
          const m = toMins(r.time);
          if (m < 0) return r;
          return { ...r, time: fromMins(m - duration) };
        });
        notify(`🗑 Removed · shifted ${newRows.length - idx} rows back ${duration} min`);
      }
    } else {
      notify(`🗑 Removed "${rows[idx].activity}"`);
    }

    const nextDays = days.map((d, di) => di !== activeDay ? d : { ...d, rows: newRows });
    persist(nextDays);
    setSelectedId(null);
    setEditBuf(null);
  }

  // ── Add row ──
  function addRow() {
    const rows = current.rows;
    let insertIdx = rows.length;
    let defaultTime = "";

    if (selectedId) {
      const idx = rows.findIndex(r => r.id === selectedId);
      if (idx >= 0) {
        insertIdx = idx + 1;
        const curMins  = toMins(rows[idx].time);
        const nextMins = idx + 1 < rows.length ? toMins(rows[idx + 1].time) : curMins + 30;
        if (curMins >= 0 && nextMins >= 0) defaultTime = fromMins(Math.round((curMins + nextMins) / 2));
      }
    } else if (rows.length > 0) {
      const last = toMins(rows[rows.length - 1].time);
      if (last >= 0) defaultTime = fromMins(last + 30);
    }

    const newRow: ScheduleRow = {
      id: `${activeDay + 1}-${Date.now()}`,
      time: defaultTime, activity: "New Event", note: "", type: "normal",
    };
    const newRows = [...rows.slice(0, insertIdx), newRow, ...rows.slice(insertIdx)];
    const nextDays = days.map((d, di) => di !== activeDay ? d : { ...d, rows: newRows });
    persist(nextDays);
    setSelectedId(newRow.id);
    setEditBuf({ ...newRow });
  }

  function reset() {
    if (!confirm("Reset to original schedule? This will update the public page too.")) return;
    persist(JSON.parse(JSON.stringify(DEFAULT)));
    setSelectedId(null);
    setEditBuf(null);
    notify("✓ Reset to default");
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500 text-sm">
        Loading schedule…
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── Day tabs + controls ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 bg-[#1a1f2e] p-1 rounded-xl border border-white/10">
          {days.map((d, i) => (
            <button key={i} onClick={() => { setActiveDay(i); setSelectedId(null); setEditBuf(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeDay === i ? "bg-blue-600 text-white shadow" : "text-gray-400 hover:text-white"}`}>
              {d.label}
              {i === 3 && <span className="ml-1.5 text-[10px] font-black bg-orange-500 text-white px-1.5 py-0.5 rounded">FINALS</span>}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {flash && <span className="text-sm text-blue-300 font-medium animate-pulse">{flash}</span>}
          <button onClick={addRow}
            className="px-3 py-2 bg-white/8 hover:bg-white/12 border border-white/15 rounded-lg text-sm text-gray-300 hover:text-white transition-all">
            + Add Row
          </button>
          <button onClick={reset}
            className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-600 hover:text-gray-400 transition-all">
            Reset
          </button>
        </div>
      </div>

      {/* ── Auto-shift toggle ── */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-[#1a1f2e] rounded-xl border border-white/10">
        <button onClick={() => setAutoShift(!autoShift)}
          className={`relative w-10 h-5 rounded-full transition-colors ${autoShift ? "bg-blue-600" : "bg-gray-700"}`}>
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${autoShift ? "left-5" : "left-0.5"}`} />
        </button>
        <span className="text-sm text-gray-300 font-medium">Auto-adjust times</span>
        <span className="text-xs text-gray-600">
          {autoShift ? "ON — deletes and time changes shift all rows below automatically" : "OFF — only the selected row changes"}
        </span>
      </div>

      <div className="flex gap-4 items-start">

        {/* ── Schedule table ── */}
        <div className="flex-1 rounded-2xl border border-white/10 overflow-hidden bg-[#0f1117]">

          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <div>
              <span className="text-white font-bold">{current.label}</span>
              <span className="text-gray-600 text-sm ml-2">{current.date}, 2026</span>
            </div>
            <span className="text-xs text-gray-600">{current.rows.length} events · click any row to edit</span>
          </div>

          {current.rows.map((row) => {
            const isSel = selectedId === row.id;
            return (
              <div key={row.id} onClick={() => selectRow(row)}
                className={`grid grid-cols-[90px_1fr_auto] items-start px-4 py-3 border-b border-white/5 last:border-0 cursor-pointer transition-all ${rowBg(row.type, isSel)}`}>
                <div className={`text-xs font-mono pt-0.5 ${isSel ? "text-blue-300" : timeColor(row.type)}`}>{row.time}</div>
                <div>
                  <div className={`text-sm leading-snug ${isSel ? "text-white font-medium" : actColor(row.type)}`}>{row.activity}</div>
                  {row.note && <div className={`text-xs mt-0.5 ${isSel ? "text-blue-300/70" : "text-gray-600"}`}>{row.note}</div>}
                </div>
                <div className={`text-sm pl-2 ${isSel ? "opacity-100 text-blue-400" : "opacity-0"}`}>✏️</div>
              </div>
            );
          })}

          <button onClick={addRow}
            className="w-full py-3 text-sm text-gray-700 hover:text-blue-400 hover:bg-white/3 transition-all border-t border-white/5 flex items-center justify-center gap-1">
            <span className="text-lg leading-none">+</span> add row
          </button>
        </div>

        {/* ── Edit Panel ── */}
        {editBuf && (
          <div className="w-72 shrink-0 rounded-2xl border border-blue-500/40 bg-[#162035] p-4 space-y-3 sticky top-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-sm">Edit Row</h3>
              <button onClick={() => { setSelectedId(null); setEditBuf(null); }} className="text-gray-500 hover:text-white text-lg leading-none">×</button>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Time</label>
              <input value={editBuf.time} onChange={e => setEditBuf({ ...editBuf, time: e.target.value })}
                placeholder="9:00 AM"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              {autoShift && <p className="text-xs text-blue-400/70 mt-1">⏱ Changing time shifts all rows below</p>}
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Activity</label>
              <input value={editBuf.activity} onChange={e => setEditBuf({ ...editBuf, activity: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Note</label>
              <input value={editBuf.note} onChange={e => setEditBuf({ ...editBuf, note: e.target.value })}
                placeholder="Optional detail..."
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Row Style</label>
              <select value={editBuf.type} onChange={e => setEditBuf({ ...editBuf, type: e.target.value as RowType })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500 cursor-pointer">
                <option value="normal">Normal</option>
                <option value="section">Section header (gold)</option>
                <option value="game">Game / Contest (gold outline)</option>
                <option value="break">Break / Lunch (dim)</option>
                <option value="highlight">Highlight (blue)</option>
              </select>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={commitEdit}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-all">
                Save
              </button>
              <button onClick={deleteSelected}
                className="flex-1 py-2.5 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-400 hover:text-red-300 text-sm font-bold rounded-lg transition-all">
                Delete{autoShift && <span className="text-xs font-normal ml-1">+ adjust</span>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
