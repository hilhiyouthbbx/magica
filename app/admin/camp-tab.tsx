"use client";
import { useState, useEffect } from "react";
import {
  Plus, Save, Trash2, X, Loader2, CheckCircle,
  Users, GripVertical, RefreshCw, Mail, Edit, ChevronRight
} from "lucide-react";
import type {
  CampScheduleData, CampTeam, BracketGame, IndividualEvent, Division,
  CamperRosterEntry
} from "@/lib/camp-schedule";
import type { DayKey, CheckInMap } from "@/lib/camp-checkin";

const EVENT_NAMES = [
  "Knockout",
  "Free Throw Contest",
  "3-Point Contest",
  "1-on-1 Challenge",
  "3-on-3 Tournament",
  "Layup Contest",
];

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


function camperShortName(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
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
  const [isLive, setIsLive]         = useState(false);
  const [liveDay, setLiveDay]       = useState(-1);

  // ── Load from server on mount ──
  useEffect(() => {
    setLoading(true);
    fetch("/api/camp-schedule")
      .then(r => r.json())
      .then((d: { dailySchedule?: DayData[]; active?: boolean; currentDay?: number }) => {
        if (d.dailySchedule && Array.isArray(d.dailySchedule) && d.dailySchedule.length > 0) {
          setDays(d.dailySchedule);
        }
        if (d.active !== undefined) setIsLive(d.active);
        // currentDay: 0=none, 1=Day1 only, 2=Days1-2, 3=Days1-3, 4=all
        if (d.currentDay !== undefined) setLiveDay(d.currentDay);
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

  async function persistLive(live: boolean, day: number) {
    setIsLive(live);
    setLiveDay(day);
    try {
      const res = await fetch(`/api/camp-schedule?key=${adminKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // active = schedule visible; currentDay = unlock through day N (0=none,1=Day1,2=Days1-2,3=Days1-3,4=all)
        body: JSON.stringify({ active: live, currentDay: live ? day : 0 }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        notify(`❌ Save failed (${res.status}) — ${err.error ?? "check admin key"}`);
        // Revert UI state on failure
        setIsLive(!live);
        setLiveDay(day);
        return;
      }
      notify(live ? `🔴 LIVE — ${day >= 0 ? "Day " + (day + 1) : "On Air"}` : "⚫ Off Air — schedule is public");
    } catch (e) {
      notify("❌ Network error — live status NOT saved");
      setIsLive(!live);
    }
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

      {/* ── Public Visibility Controls ── */}
      <div className={`rounded-xl border overflow-hidden transition-colors ${isLive ? "border-green-700/50" : "border-white/10"}`}>

        {/* Master on/off */}
        <div className={`flex items-center justify-between px-4 py-3 ${isLive ? "bg-green-950/40" : "bg-[#1a1f2e]"}`}>
          <div>
            <div className={`text-xs font-black uppercase tracking-widest ${isLive ? "text-green-400" : "text-gray-500"}`}>
              {isLive ? "✅ Schedule is PUBLIC" : "🔒 Schedule is HIDDEN"}
            </div>
            <div className="text-[11px] text-gray-600 mt-0.5">
              {isLive ? "Visitors can see the days you unlock below" : "Visitors see a blank page"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => persistLive(!isLive, isLive ? liveDay : (liveDay > 0 ? liveDay : 1))}
              className={`relative w-14 h-7 rounded-full transition-colors ${isLive ? "bg-green-600" : "bg-gray-700"}`}>
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${isLive ? "left-8" : "left-1"}`} />
            </button>
            <span className={`text-sm font-bold w-16 ${isLive ? "text-green-400" : "text-gray-600"}`}>{isLive ? "PUBLIC" : "HIDDEN"}</span>
          </div>
        </div>

        {/* Per-day visibility — only shown when PUBLIC */}
        {isLive && (
          <div className="px-4 py-3 bg-[#0f1117] border-t border-white/8">
            <div className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">
              Days visible to public — others show "Coming Soon"
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Day 1", sub: "Mon Jun 22", val: 1 },
                { label: "Day 2", sub: "Tue Jun 23", val: 2 },
                { label: "Day 3", sub: "Wed Jun 24", val: 3 },
                { label: "Championship", sub: "Thu Jun 25", val: 4 },
              ].map(({ label, sub, val }) => {
                const isOn = liveDay >= val;
                return (
                  <button key={val}
                    onClick={() => persistLive(true, isOn ? val - 1 : val)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all ${
                      isOn
                        ? "bg-green-900/30 border-green-600/50 text-green-300"
                        : "bg-white/4 border-white/10 text-gray-500 hover:border-white/20"
                    }`}>
                    <div className="text-left">
                      <div className="text-xs font-bold">{label}</div>
                      <div className="text-[10px] opacity-60">{sub}</div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[9px] font-black ${
                      isOn ? "bg-green-500 border-green-400 text-white" : "border-gray-600"
                    }`}>
                      {isOn ? "✓" : ""}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-gray-600 mt-2">
              Days are unlocked sequentially — turning on Day 3 also keeps Days 1 &amp; 2 visible.
            </p>
          </div>
        )}
      </div>

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
          {flash && <span className={`text-sm font-medium animate-pulse ${flash.startsWith("❌") ? "text-red-400" : "text-blue-300"}`}>{flash}</span>}
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

            {/* Header + close */}
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-sm">Edit Row</h3>
              <button onClick={() => { setSelectedId(null); setEditBuf(null); }} className="text-gray-500 hover:text-white text-lg leading-none">×</button>
            </div>

            {/* ── SAVE / DELETE — always visible at top ── */}
            <div className="flex gap-2">
              <button onClick={commitEdit}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-blue-900/40">
                ✓ Save
              </button>
              <button onClick={deleteSelected}
                className="flex-1 py-2.5 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-400 hover:text-red-300 text-sm font-bold rounded-lg transition-all">
                🗑 Delete{autoShift && <span className="text-xs font-normal ml-1">+ shift</span>}
              </button>
            </div>

            <div className="border-t border-white/10 pt-3 space-y-3">
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


export function CampTab({ adminKey }: { adminKey: string }) {
  const [data,        setData]        = useState<CampScheduleData | null>(null);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [section,     setSection]     = useState<"roster"|"checkin"|"teams"|"poolplay"|"standings"|"bracket"|"events"|"schedule"|"settings">("teams");
  const [roster,      setRoster]      = useState<CamperRosterEntry[]>([]);
  const [rawContacts, setRawContacts] = useState<Record<string, string>[]>([]);
  const [rosterLoad,  setRosterLoad]  = useState(false);
  const [editingCamper,     setEditingCamper]     = useState<Record<string,string> | null>(null);
  const [editCamperPatch,   setEditCamperPatch]   = useState<Record<string,string>>({});
  const [editCamperSaving,  setEditCamperSaving]  = useState(false);
  const [dragOver,    setDragOver]    = useState<string | null>(null);
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const [addPlayerOpen, setAddPlayerOpen] = useState<string | null>(null);
  const [playerSearch, setPlayerSearch]   = useState<string>("");
  const [eventDragOver, setEventDragOver] = useState<{eventId: string; teamId: string} | null>(null);
  const [addNomineeOpen, setAddNomineeOpen] = useState<{eventId: string; teamId: string} | null>(null);
  const [nomineeSearch, setNomineeSearch] = useState<string>("");
  const [rosterError,  setRosterError]  = useState<string>("");
  const [checkIns,     setCheckIns]     = useState<CheckInMap>({});
  const [checkInDay,   setCheckInDay]   = useState<DayKey>("day1");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailResult,  setEmailResult]  = useState<string>("");

  const CHECKIN_LS_KEY = `hilhi_checkins_${adminKey}`;

  // Save checkIns map to localStorage so it survives sign-out / refresh
  function persistLocally(map: CheckInMap) {
    try { localStorage.setItem(CHECKIN_LS_KEY, JSON.stringify(map)); } catch {}
  }

  useEffect(() => {
    // 1. Show localStorage data immediately (instant — no loading flash)
    try {
      const cached = localStorage.getItem(CHECKIN_LS_KEY);
      if (cached) setCheckIns(JSON.parse(cached) as CheckInMap);
    } catch {}

    fetch("/api/camp-schedule")
      .then(r => r.json())
      .then(setData)
      .catch(() => {});

    // 2. Load from Redis (authoritative source)
    fetch(`/api/camp-checkin?key=${adminKey}`)
      .then(r => r.json())
      .then(d => {
        if (!d.checkIns) return;
        const serverData = d.checkIns as CheckInMap;
        // Check if Redis actually has any check-ins stored
        const serverHasData = Object.values(serverData).some(ci =>
          Object.values(ci).some(Boolean)
        );
        if (serverHasData) {
          // Redis has data — use it as truth and refresh localStorage
          setCheckIns(serverData);
          persistLocally(serverData);
        }
        // If Redis is empty but localStorage had data, keep the localStorage
        // version already set above (Redis may just not be configured yet).
      })
      .catch(() => {
        // Network error — keep whatever localStorage provided above
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey]);

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
      const res  = await fetch(`/api/admin/contacts?key=${adminKey}`);
      if (!res.ok) {
        setRosterError(`Could not load contacts (status ${res.status}). Check admin password.`);
        return;
      }
      const raw = await res.json() as unknown;
      const all: Record<string, string>[] = Array.isArray(raw) ? raw : (raw as { contacts?: Record<string, string>[] }).contacts ?? [];
      setRawContacts(all); // keep full contact data for inline editing

      // Filter to camp registrations + format
      function parseGradeNum(g: string | undefined): number {
        if (!g) return 99;
        const m = g.match(/\d+/);
        return m ? parseInt(m[0], 10) : 99;
      }
      function fmt(full: string): string {
        const parts = full.trim().split(/\s+/);
        if (parts.length < 2 || !parts[0]) return parts[0] || "Unknown";
        return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
      }

      const campers: CamperRosterEntry[] = all
        .filter(c => {
          // Include anyone who has a camperName (i.e. filled in via the camp registration form)
          return !!(c.camperName && c.camperName.trim());
        })
        .map(c => {
          const fullName      = (c.camperName ?? c.name ?? "").trim();
          const grade         = (c.grade ?? "").trim();
          const paymentStatus = (c.paymentStatus ?? "").trim();
          const confirmed     = /paid|free|manual payment approved|approved/i.test(paymentStatus) || paymentStatus === "";
          return {
            id:          c.id ?? Math.random().toString(36).slice(2),
            fullName,
            displayName: fmt(fullName),
            grade,
            gradeNum:    parseGradeNum(grade),
            paymentStatus,
            confirmed,
          };
        })
        .sort((a, b) => a.gradeNum !== b.gradeNum ? a.gradeNum - b.gradeNum : a.fullName.localeCompare(b.fullName));

      if (campers.length === 0) {
        const sources = [...new Set(all.map((c: Record<string,string>) => c.source).filter(Boolean))].join(", ");
        const withName = all.filter((c: Record<string,string>) => c.camperName).length;
        setRosterError(`Found ${all.length} contacts, ${withName} have a camper name. Sources: ${sources || "none"}. Make sure camperName is populated in your registrations.`);
      } else {
        setRoster(campers);
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
    const arr = [...team.players];
    arr[idx] = value;
    setData({ ...data, teams: data.teams.map(t => t.id === teamId ? { ...t, players: arr } : t) });
  }

  function addPlayerToTeam(teamId: string, playerFullName: string) {
    if (!data) return;
    const team = data.teams.find(t => t.id === teamId);
    if (!team) return;
    if (team.players.includes(playerFullName)) return; // already on team
    const updatedTeams = data.teams.map(t =>
      t.id !== teamId ? t : { ...t, players: [...t.players.filter(p => p.trim()), playerFullName] }
    );
    setData({ ...data, teams: updatedTeams });
    // mark as assigned
    const cam = roster.find(r => r.fullName === playerFullName || r.displayName === playerFullName);
    if (cam) setAssignedIds(prev => new Set([...prev, cam.id]));
    setAddPlayerOpen(null);
    setPlayerSearch("");
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
      court: "Court A", status: "scheduled",
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

  /** Fill bracket seeds from pool-play standings (1v4, 2v3 for 4-team; 1v8, 4v5, 2v7, 3v6 for 8-team) */
  function autoSeedBracket(div: Division) {
    if (!data) return;
    const standings = calcPoolStandings(div);
    const seeds = standings.map(r => r.team.id);
    const divGames = [...data.bracketGames].filter(g => g.division === div);
    const quarters = divGames.filter(g => g.round === "quarter").sort((a,b) => a.id.localeCompare(b.id));
    const semis    = divGames.filter(g => g.round === "semi").sort((a,b) => a.id.localeCompare(b.id));

    let updated = [...data.bracketGames];
    const patch = (id: string, p: Partial<BracketGame>) => {
      updated = updated.map(g => g.id === id ? { ...g, ...p } : g);
    };

    if (quarters.length >= 4 && seeds.length >= 4) {
      // 8-team: 1v8, 4v5, 2v7, 3v6
      const matchups = [[0,7],[3,4],[1,6],[2,5]];
      quarters.slice(0,4).forEach((g,i) => {
        const [s1,s2] = matchups[i];
        patch(g.id, { team1Id: seeds[s1] ?? "", team2Id: seeds[s2] ?? "" });
      });
    } else if (semis.length >= 2 && seeds.length >= 2) {
      // 4-team: 1v4, 2v3
      const matchups = [[0,3],[1,2]];
      semis.slice(0,2).forEach((g,i) => {
        const [s1,s2] = matchups[i];
        patch(g.id, { team1Id: seeds[s1] ?? "", team2Id: seeds[s2] ?? "" });
      });
    }
    setData({ ...data, bracketGames: updated });
  }

  /** Advance the winner of a completed game into the next round */
  function advanceWinner(gameId: string) {
    if (!data) return;
    const game = data.bracketGames.find(g => g.id === gameId);
    if (!game || game.score1 === null || game.score2 === null) return;
    const winnerId = game.score1 >= game.score2 ? game.team1Id : game.team2Id;
    const loserId  = game.score1 >= game.score2 ? game.team2Id : game.team1Id;
    const div = game.division;

    const byRound = (r: BracketGame["round"]) =>
      data.bracketGames.filter(g => g.division === div && g.round === r).sort((a,b) => a.id.localeCompare(b.id));

    let updated = [...data.bracketGames];
    const patch = (id: string, p: Partial<BracketGame>) => {
      updated = updated.map(g => g.id === id ? { ...g, ...p } : g);
    };

    if (game.round === "quarter") {
      const quarters = byRound("quarter");
      const semis    = byRound("semi");
      const idx = quarters.findIndex(g => g.id === gameId);
      if (idx === -1) return;
      const semiIdx  = Math.floor(idx / 2);
      const slot     = idx % 2 === 0 ? "team1Id" : "team2Id";
      if (semis[semiIdx]) patch(semis[semiIdx].id, { [slot]: winnerId });
    } else if (game.round === "semi") {
      const semis  = byRound("semi");
      const finals = byRound("final");
      const thirds = byRound("3rd");
      const idx    = semis.findIndex(g => g.id === gameId);
      if (idx === -1) return;
      const slot = idx === 0 ? "team1Id" : "team2Id";
      if (finals[0]) patch(finals[0].id, { [slot]: winnerId });
      if (thirds[0]) patch(thirds[0].id, { [slot]: loserId });
    }
    setData({ ...data, bracketGames: updated });
  }

  function generateBracketTemplate(div: Division, format: "4-team" | "8-team") {
    if (!data) return;
    // Clear existing bracket games for this division
    const others = data.bracketGames.filter(g => g.division !== div);
    const newGames: BracketGame[] = [];
    const mk = (round: BracketGame["round"]): BracketGame => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2,6)}`, round, division: div,
      team1Id: "", team2Id: "", score1: null, score2: null, court: "Court A", status: "scheduled",
    });
    if (format === "8-team") {
      newGames.push(mk("quarter"), mk("quarter"), mk("quarter"), mk("quarter"));
    }
    newGames.push(mk("semi"), mk("semi"));
    newGames.push(mk("final"));
    newGames.push(mk("3rd"));
    save({ bracketGames: [...others, ...newGames] });
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

  function addNominee(eventId: string, teamId: string, playerFullName: string) {
    if (!data) return;
    const events = (data.individualEvents ?? []).map(e => {
      if (e.id !== eventId) return e;
      const slots = e.name === "3-on-3 Tournament" ? 3 : 2;
      const nomIdx = e.nominees.findIndex(n => n.teamId === teamId);
      const nominees = [...e.nominees];
      const curPlayers = nomIdx >= 0 ? nominees[nomIdx].players.filter(p => p.trim()) : [];
      if (curPlayers.includes(playerFullName) || curPlayers.length >= slots) return e;
      const newPlayers = [...curPlayers, playerFullName];
      if (nomIdx >= 0) nominees[nomIdx] = { teamId, players: newPlayers };
      else nominees.push({ teamId, players: newPlayers });
      return { ...e, nominees };
    });
    setData({ ...data, individualEvents: events });
    setAddNomineeOpen(null);
    setNomineeSearch("");
  }

  function removeNominee(eventId: string, teamId: string, playerFullName: string) {
    if (!data) return;
    const events = (data.individualEvents ?? []).map(e => {
      if (e.id !== eventId) return e;
      const nomIdx = e.nominees.findIndex(n => n.teamId === teamId);
      if (nomIdx === -1) return e;
      const nominees = [...e.nominees];
      nominees[nomIdx] = { ...nominees[nomIdx], players: nominees[nomIdx].players.filter(p => p !== playerFullName) };
      return { ...e, nominees };
    });
    setData({ ...data, individualEvents: events });
  }

  function handleEventDragOver(e: React.DragEvent<HTMLDivElement>, eventId: string, teamId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setEventDragOver({ eventId, teamId });
  }

  function handleEventDrop(e: React.DragEvent<HTMLDivElement>, eventId: string, teamId: string) {
    e.preventDefault();
    setEventDragOver(null);
    if (!data) return;
    const raw = e.dataTransfer.getData("camper");
    if (!raw) return;
    const cam: CamperRosterEntry = JSON.parse(raw) as CamperRosterEntry;
    addNominee(eventId, teamId, cam.fullName);
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
    // Use fullName to avoid silent drop when two campers share the same "First L." display name
    const playerName = cam.fullName;
    if (team.players.includes(playerName)) return;
    const updatedTeams = data.teams.map(t =>
      t.id !== teamId ? t : { ...t, players: [...t.players.filter(p => p.trim()), playerName] }
    );
    setData({ ...data, teams: updatedTeams });
    setAssignedIds(prev => new Set([...prev, cam.id]));
  }
  function removeFromTeam(teamId: string, playerName: string) {
    if (!data) return;
    const updatedTeams = data.teams.map(t =>
      t.id !== teamId ? t : { ...t, players: t.players.filter(p => p !== playerName) }
    );
    setData({ ...data, teams: updatedTeams });
    const stillAssigned = updatedTeams.some(t => t.players.some(p => p === playerName));
    if (!stillAssigned) {
      const cam = roster.find(r => r.displayName === playerName || r.fullName === playerName);
      if (cam) setAssignedIds(prev => { const s = new Set(prev); s.delete(cam.id); return s; });
    }
  }


  // ── Inline camper contact editing ──────────────────────────────────────────
  function openEditCamper(cam: CamperRosterEntry) {
    const raw = rawContacts.find(c => c.id === cam.id) ?? { id: cam.id, camperName: cam.fullName };
    setEditingCamper(raw);
    setEditCamperPatch({});
  }

  async function saveCamperEdit() {
    if (!editingCamper) return;
    setEditCamperSaving(true);
    try {
      const patch = editCamperPatch;
      await fetch(`/api/admin/contacts?key=${adminKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", id: editingCamper.id, patch }),
      });
      // Update rawContacts and roster in memory
      setRawContacts(prev => prev.map(c => c.id === editingCamper.id ? { ...c, ...patch } : c));
      setRoster(prev => prev.map(c => {
        if (c.id !== editingCamper.id) return c;
        const newFull = patch.camperName ?? editingCamper.camperName ?? c.fullName;
        const newGrade = patch.grade ?? editingCamper.grade ?? c.grade;
        const newPay = patch.paymentStatus ?? editingCamper.paymentStatus ?? c.paymentStatus;
        const fmt = (full: string) => {
          const parts = full.trim().split(/\s+/);
          if (parts.length < 2 || !parts[0]) return parts[0] || "Unknown";
          return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
        };
        const parseGN = (g: string) => { const m = g.match(/\d+/); return m ? parseInt(m[0], 10) : 99; };
        return {
          ...c,
          fullName: newFull,
          displayName: fmt(newFull),
          grade: newGrade,
          gradeNum: parseGN(newGrade),
          paymentStatus: newPay,
          confirmed: /paid|free|manual payment approved|approved/i.test(newPay) || newPay === "",
        };
      }));
      setEditingCamper(null);
    } catch {
      alert("Save failed — check network connection.");
    } finally {
      setEditCamperSaving(false);
    }
  }

  if (!data) return (
    <div className="flex items-center justify-center h-40 text-gray-500 text-sm">Loading…</div>
  );

  // ── Check-in helpers ──────────────────────────────────────────────────────
  async function toggleCheckIn(contactId: string, day: DayKey, checked: boolean) {
    // Optimistic update — MUST use functional form (prev =>) so rapid clicks
    // always build on the latest state, not a stale closure snapshot.
    setCheckIns(prev => {
      const next = {
        ...prev,
        [contactId]: {
          ...(prev[contactId] ?? { day1: false, day2: false, day3: false, day4: false }),
          [day]: checked,
        },
      };
      // Persist immediately to localStorage so sign-out / refresh can restore it
      persistLocally(next);
      return next;
    });
    try {
      await fetch(`/api/camp-checkin?key=${adminKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", contactId, day, checked }),
      });
      // Do NOT call setCheckIns from the server response — that overwrites any
      // optimistic updates that happened while this request was in-flight,
      // which is exactly what causes a check to vanish when you click another.
    } catch {
      // On network error revert this one toggle (and update localStorage too)
      setCheckIns(prev => {
        const next = {
          ...prev,
          [contactId]: {
            ...(prev[contactId] ?? { day1: false, day2: false, day3: false, day4: false }),
            [day]: !checked,
          },
        };
        persistLocally(next);
        return next;
      });
    }
  }

  async function sendAbsentEmails() {
    setSendingEmail(true);
    setEmailResult("");
    try {
      // Collect the contactIds the admin has checked on-screen right now.
      // Sending this to the server ensures it uses the exact same data the UI shows,
      // not a stale or empty Redis snapshot (which caused the "emailed everyone" bug).
      const presentIds = Object.entries(checkIns)
        .filter(([, ci]) => ci[checkInDay])
        .map(([id]) => id);

      const res  = await fetch(`/api/camp-checkin?key=${adminKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send-absent", day: checkInDay,
          dayLabel: { day1:"Day 1",day2:"Day 2",day3:"Day 3",day4:"Day 4" }[checkInDay],
          campName: data?.campName || "Hilhi Youth Basketball Camp",
          presentIds, // ← authoritative list of who is present on this screen
        }),
      });
      const json = await res.json() as { ok?: boolean; sent?: number; failed?: number; total?: number; message?: string; error?: string };
      if (json.error) setEmailResult("❌ " + json.error);
      else if (json.message) setEmailResult("✅ " + json.message);
      else setEmailResult(`✅ Sent ${json.sent ?? 0} emails to absent campers${json.failed ? ` (${json.failed} failed)` : ""}`);
    } catch (err) {
      setEmailResult("❌ Network error: " + String(err));
    } finally {
      setSendingEmail(false);
    }
  }

  const divTeams = (div: Division) => (data?.teams ?? []).filter(t => t.division === div);
  const teamOpts = (div: Division) => divTeams(div).map(t => ({ id: t.id, name: t.name || "(unnamed)" }));

  type PoolStandingRow = {
    team: CampTeam;
    wins: number;
    losses: number;
    pointsFor: number;
    pointsAgainst: number;
    diff: number;
    gamesPlayed: number;
  };

  function getPoolGames() {
    return ((((data ?? {}) as unknown as { seedingGames?: Array<{
      id: string;
      round: number;
      division: Division;
      team1Id: string;
      team2Id: string;
      score1: number | null;
      score2: number | null;
      court?: string;
      status?: string;
    }> }).seedingGames) ?? []);
  }

  function isPlayedPoolGame(game: ReturnType<typeof getPoolGames>[number]) {
    const s1 = typeof game.score1 === "number" ? game.score1 : null;
    const s2 = typeof game.score2 === "number" ? game.score2 : null;
    return s1 !== null && s2 !== null && (game.status === "final" || s1 > 0 || s2 > 0);
  }

  function addPoolGame(division: Division) {
    if (!data) return;
    const games = getPoolGames();
    const g = {
      id: Date.now().toString(),
      round: 1,
      division,
      team1Id: "",
      team2Id: "",
      score1: null as number | null,
      score2: null as number | null,
      court: "A",
      status: "scheduled",
    };
    save({ seedingGames: [...games, g] } as Partial<CampScheduleData>);
  }

  function setPoolGameField(id: string, field: string, value: unknown) {
    if (!data) return;
    const games = getPoolGames().map(g => g.id === id ? { ...g, [field]: value } : g);
    setData({ ...data, seedingGames: games } as CampScheduleData);
  }

  function savePoolGames() {
    if (!data) return;
    save({ seedingGames: getPoolGames() } as Partial<CampScheduleData>);
  }

  function removePoolGame(id: string) {
    if (!data || !confirm("Remove this pool play game?")) return;
    save({ seedingGames: getPoolGames().filter(g => g.id !== id) } as Partial<CampScheduleData>);
  }


  function generateSixGamePoolSchedule(division: Division) {
    if (!data) return;
    const teams = divTeams(division);
    if (teams.length !== 4) {
      alert("The 12-games-per-team pool schedule is set up for 4 teams per division. This division currently has " + teams.length + " teams.");
      return;
    }

    const allGames = getPoolGames();
    const otherDivisionGames = allGames.filter(g => g.division !== division);
    const divisionGames = allGames.filter(g => g.division === division);
    const existingByPair = new Map<string, typeof divisionGames>();

    function pairKey(a: string, b: string) {
      return [a, b].sort().join("__");
    }

    function teamNameForSchedule(id: string) {
      return teams.find(t => t.id === id)?.name || "TBD";
    }

    function autoScheduleRows(gamesToPlace: typeof divisionGames): DayData[] {
      const scheduleDays = (data as CampScheduleData & { dailySchedule?: DayData[] })?.dailySchedule;
      const baseDays: DayData[] =
        Array.isArray(scheduleDays) && scheduleDays.length > 0
          ? JSON.parse(JSON.stringify(scheduleDays))
          : JSON.parse(JSON.stringify(DEFAULT));

      // Remove previous auto-added rows for this division only, so regenerating does not duplicate rows.
      const autoPrefix = `pool-schedule-auto-${division}-`;
      const cleanDays = baseDays.map(day => ({
        ...day,
        rows: day.rows.filter(row => !String(row.id).startsWith(autoPrefix)),
      }));

      const sorted = [...gamesToPlace].sort((a, b) => (Number(a.round) || 0) - (Number(b.round) || 0));
      const third = Math.ceil(sorted.length / 3);
      const day1Games = sorted.slice(0, third);
      const day2Games = sorted.slice(third, third * 2);
      const day3Games = sorted.slice(third * 2);

      function makeRows(dayGames: typeof divisionGames, startTime: string): ScheduleRow[] {
        const start = toMins(startTime);
        return dayGames.map((game, idx) => ({
          id: `${autoPrefix}${game.id}`,
          time: fromMins(start + idx * 35),
          activity: `POOL PLAY — ${division}: ${teamNameForSchedule(game.team1Id)} vs ${teamNameForSchedule(game.team2Id)}`,
          note: `Round ${game.round} | Court ${game.court || "TBD"} | Enter score in Admin → Pool Play Scores`,
          type: "game" as RowType,
        }));
      }

      if (cleanDays[0]) cleanDays[0].rows = [...cleanDays[0].rows, ...makeRows(day1Games, "11:00 AM")];
      if (cleanDays[1]) cleanDays[1].rows = [...cleanDays[1].rows, ...makeRows(day2Games, "10:00 AM")];
      if (cleanDays[2]) cleanDays[2].rows = [...cleanDays[2].rows, ...makeRows(day3Games, "9:30 AM")];
      return cleanDays;
    }

    divisionGames.forEach(g => {
      if (!g.team1Id || !g.team2Id) return;
      const key = pairKey(g.team1Id, g.team2Id);
      existingByPair.set(key, [...(existingByPair.get(key) ?? []), g]);
    });

    const nextGames = [...divisionGames];
    const addedGames: typeof divisionGames = [];
    let round = Math.max(0, ...divisionGames.map(g => Number(g.round) || 0)) + 1;
    let courtIndex = 0;
    const courts = ["Main Court", "Aux Court"];

    // 4 teams + everyone plays 12 games = four full round robins.
    // Each pair plays 4 times: 6 pairings x 4 games = 24 total games per division.
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const t1 = teams[i];
        const t2 = teams[j];
        const key = pairKey(t1.id, t2.id);
        const currentCount = existingByPair.get(key)?.length ?? 0;
        for (let n = currentCount; n < 4; n++) {
          const newGame = {
            id: `pool-${division}-${t1.id}-${t2.id}-${Date.now()}-${i}-${j}-${n}`,
            round,
            division,
            team1Id: n % 2 === 0 ? t1.id : t2.id,
            team2Id: n % 2 === 0 ? t2.id : t1.id,
            score1: null,
            score2: null,
            court: courts[courtIndex % courts.length],
            status: "scheduled",
          };
          nextGames.push(newGame);
          addedGames.push(newGame);
          courtIndex++;
          if (courtIndex % 2 === 0) round++;
        }
      }
    }

    const dailySchedule = addedGames.length > 0 ? autoScheduleRows(addedGames) : (data?.dailySchedule ?? DEFAULT);
    save({ seedingGames: [...otherDivisionGames, ...nextGames], dailySchedule } as Partial<CampScheduleData>);
  }

  function calcPoolStandings(div: Division): PoolStandingRow[] {
    const rows = new Map<string, PoolStandingRow>();
    divTeams(div).forEach(team => rows.set(team.id, {
      team,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      diff: 0,
      gamesPlayed: 0,
    }));

    getPoolGames()
      .filter(game => game.division === div && isPlayedPoolGame(game))
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

  function teamName(id: string) {
    return data?.teams?.find(t => t.id === id)?.name || id || "TBD";
  }

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
          ["checkin",   "✅ Check-In"],
          ["teams",     "👥 Teams & Rosters"],
          ["poolplay",  "🏀 Pool Play Scores"],
          ["standings", "📊 Standings"],
          ["bracket",   "🏆 Bracket"],
          ["events",    "🎯 Individual Events"],
          ["schedule",  "📅 Schedule"],
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

      {/* ── CHECK-IN ── */}
      {section === "checkin" && (
        <div className="space-y-5">
          {/* Day selector + send button */}
          <div className="glass rounded-2xl border border-white/10 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-white font-black text-base">Daily Check-In</h3>
                <p className="text-gray-500 text-sm mt-0.5">
                  Check off each camper as they arrive. Use the day tabs to switch between days.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["day1","day2","day3","day4"] as DayKey[]).map(d => (
                  <button key={d} onClick={() => { setCheckInDay(d); setEmailResult(""); }}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${checkInDay === d ? "bg-blue-600 text-white" : "glass border border-white/15 text-gray-400 hover:text-white"}`}>
                    {({ day1:"Day 1", day2:"Day 2", day3:"Day 3", day4:"Day 4" } as Record<DayKey,string>)[d]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Roster with checkboxes */}
          {roster.length === 0 ? (
            <div className="glass rounded-2xl border border-white/10 p-8 text-center">
              <p className="text-gray-400 font-bold mb-2">No campers loaded yet.</p>
              <p className="text-gray-600 text-sm">Go to the 📋 Camper Roster tab and click "Load from Registrations" first.</p>
            </div>
          ) : (() => {
            const confirmedRoster = roster.filter(cam => cam.confirmed);
            const gradeMap = new Map<number, { label: string; campers: CamperRosterEntry[] }>();
            confirmedRoster.forEach(cam => {
              if (cam.gradeNum === 99) return; // skip unknown grade
              if (!gradeMap.has(cam.gradeNum)) gradeMap.set(cam.gradeNum, { label: gradeLabel(cam.grade), campers: [] });
              gradeMap.get(cam.gradeNum)!.campers.push(cam);
            });
            const grades = [...gradeMap.entries()].sort((a,b) => a[0]-b[0]);
            // Only count campers that are actually visible in the list (valid grade).
            // Confirmed campers with unknown grade (gradeNum 99) are skipped in the
            // display, so they must not inflate the absent counter.
            const visibleRoster = confirmedRoster.filter(cam => cam.gradeNum !== 99);
            const totalPresent = visibleRoster.filter(cam => checkIns[cam.id]?.[checkInDay]).length;
            const totalAbsent  = visibleRoster.length - totalPresent;
            return (
              <div className="space-y-4">
                {/* Summary bar */}
                <div className="glass rounded-2xl border border-white/10 p-4 flex flex-wrap gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-black text-green-400">{totalPresent}</div>
                    <div className="text-xs text-gray-500">Present</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-red-400">{totalAbsent}</div>
                    <div className="text-xs text-gray-500">Absent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-white">{visibleRoster.length}</div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                  <div className="flex-1" />
                  {/* Send absent emails */}
                  <div className="flex flex-col gap-2 items-end">
                    <button
                      onClick={sendAbsentEmails}
                      disabled={sendingEmail || totalAbsent === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 rounded-xl text-sm font-bold text-white transition-all"
                    >
                      {sendingEmail
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Sending…</>
                        : <><Mail className="w-3.5 h-3.5" />Email Absent Parents ({totalAbsent})</>
                      }
                    </button>
                    {emailResult && (
                      <span className={`text-xs font-bold px-3 py-1 rounded-lg ${emailResult.startsWith("✅") ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                        {emailResult}
                      </span>
                    )}
                  </div>
                </div>

                {/* Grade groups */}
                {grades.map(([gradeNum, { label, campers }]) => (
                  <div key={gradeNum} className="glass rounded-2xl border border-white/10 overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
                      <span className="text-sm font-black text-white">{label}</span>
                      <span className="text-xs text-gray-500">
                        {campers.filter(cam => checkIns[cam.id]?.[checkInDay]).length}/{campers.length} present
                      </span>
                    </div>
                    <div className="divide-y divide-white/[0.06]">
                      {campers.map(cam => {
                        const isPresent = !!(checkIns[cam.id]?.[checkInDay]);
                        return (
                          <label key={cam.id}
                            className={`flex items-center gap-4 px-5 py-3 cursor-pointer transition-colors ${isPresent ? "bg-green-500/10 hover:bg-green-500/15" : "hover:bg-white/[0.03]"}`}>
                            <input
                              type="checkbox"
                              checked={isPresent}
                              onChange={e => toggleCheckIn(cam.id, checkInDay, e.target.checked)}
                              className="w-5 h-5 rounded accent-green-500 cursor-pointer flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <span className={`font-bold text-sm ${isPresent ? "text-green-300" : "text-white"}`}>
                                {cam.fullName}
                              </span>
                              <span className="text-gray-600 text-xs ml-2">{cam.grade}</span>
                            </div>
                            {isPresent
                              ? <span className="text-green-500 text-xs font-bold flex-shrink-0">✓ Present</span>
                              : <span className="text-gray-700 text-xs flex-shrink-0">Absent</span>
                            }
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── ROSTER ── */}
      {section === "roster" && (
        <div className="space-y-5">
          {/* Header + Load button */}
          <div className="glass rounded-2xl border border-white/10 p-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-white font-black text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />Camper Roster
                  {roster.length > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-blue-600/30 border border-blue-500/40 rounded-full text-blue-300 text-xs font-bold">
                      {roster.filter(r => r.confirmed).length} registered · {roster.length} total
                    </span>
                  )}
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
            const confirmed = roster.filter(cam => cam.confirmed);
            const pending   = roster.filter(cam => !cam.confirmed);

            function RosterGroup({ campers, draggable: isDraggable }: { campers: CamperRosterEntry[]; draggable: boolean }) {
              const gradeMap = new Map<number, { label: string; campers: CamperRosterEntry[] }>();
              campers.forEach(cam => {
                if (cam.gradeNum === 99) return; // skip unknown grade
                const key = cam.gradeNum;
                if (!gradeMap.has(key)) gradeMap.set(key, { label: gradeLabel(cam.grade), campers: [] });
                gradeMap.get(key)!.campers.push(cam);
              });
              const sorted = [...gradeMap.entries()].sort((a, b) => a[0] - b[0]);
              return (
                <>
                  {sorted.map(([gradeNum, { label, campers: gc }]) => (
                    <div key={gradeNum} className="glass rounded-2xl border border-white/10 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-black text-white">{label}</span>
                        <span className="text-xs text-gray-500">{gc.length} camper{gc.length !== 1 ? "s" : ""}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {gc.map(cam => {
                          const isAssigned = assignedIds.has(cam.id);
                          return (
                            <div
                              key={cam.id}
                              draggable={isDraggable}
                              onDragStart={isDraggable ? e => handleDragStart(e, cam) : undefined}
                              title={isDraggable ? `${cam.fullName}${cam.grade ? " · " + cam.grade : ""} — drag to a team` : cam.fullName}
                              className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold select-none transition-all border ${
                                !isDraggable
                                  ? "bg-orange-500/10 border-orange-500/30 text-orange-300 cursor-default"
                                  : isAssigned
                                  ? "bg-green-500/15 border-green-500/40 text-green-300 opacity-70 cursor-grab active:cursor-grabbing"
                                  : "bg-blue-500/20 border-blue-500/40 text-blue-200 hover:bg-blue-500/30 cursor-grab active:cursor-grabbing"
                              }`}
                            >
                              {isDraggable && <GripVertical className="w-3 h-3 opacity-40 flex-shrink-0" />}
                              {cam.displayName}
                              {isDraggable && isAssigned && <span className="text-green-500 text-[10px] ml-0.5">✓</span>}
                              <button
                                onClick={e => { e.stopPropagation(); openEditCamper(cam); }}
                                onMouseDown={e => e.stopPropagation()}
                                className="ml-0.5 text-current opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity flex-shrink-0"
                                title="Edit contact">
                                <Edit className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </>
              );
            }

            return (
              <div className="space-y-5">
                {/* ── Confirmed registered campers ── */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-white">
                      ✅ Registered Campers
                      <span className="ml-2 px-2 py-0.5 bg-green-600/25 border border-green-500/40 rounded-full text-green-300 text-xs font-bold">
                        {confirmed.length}
                      </span>
                    </span>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-blue-500/30 border border-blue-500/50 inline-block" />Unassigned
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-green-500/20 border border-green-500/40 inline-block" />On a team
                      </span>
                    </div>
                  </div>
                  {confirmed.length === 0
                    ? <p className="text-gray-600 text-sm italic">No confirmed registrations yet.</p>
                    : <RosterGroup campers={confirmed} draggable={true} />
                  }
                </div>

                {/* ── Pending / needs registration ── */}
                {pending.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-orange-300">
                        ⚠️ Needs to Register
                        <span className="ml-2 px-2 py-0.5 bg-orange-600/25 border border-orange-500/40 rounded-full text-orange-300 text-xs font-bold">
                          {pending.length}
                        </span>
                      </span>
                      <span className="text-xs text-gray-600">Payment not yet confirmed — cannot be assigned to a team</span>
                    </div>
                    <RosterGroup campers={pending} draggable={false} />
                  </div>
                )}
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
                        const isFull        = false; // no hard cap on team size
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
                              <span className="text-xs font-bold text-gray-600">
                                {filledPlayers.length} player{filledPlayers.length !== 1 ? "s" : ""}
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
                                    {camperShortName(p)}
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

                    {/* Players — dynamic list + add from roster */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs text-gray-400 font-semibold">
                          Players{team.players.filter(p=>p.trim()).length > 0 ? ` (${team.players.filter(p=>p.trim()).length})` : ""}
                        </label>
                        <button
                          onClick={() => {
                            setAddPlayerOpen(addPlayerOpen === team.id ? null : team.id);
                            setPlayerSearch("");
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 hover:border-blue-500/60 text-blue-400 text-xs font-bold rounded-lg transition-all"
                        >
                          <Plus className="w-3 h-3" /> Add Player
                        </button>
                      </div>

                      {/* Add player dropdown */}
                      {addPlayerOpen === team.id && (() => {
                        const divisionForTeam = team.division;
                        const gradeRange = divisionForTeam === "NBA" ? [1,4] : [5,8];
                        const divRoster = roster
                          .filter(cam => cam.gradeNum >= gradeRange[0] && cam.gradeNum <= gradeRange[1])
                          .filter(cam => !team.players.includes(cam.fullName));
                        const searchLower = playerSearch.toLowerCase();
                        const filtered = playerSearch
                          ? divRoster.filter(cam =>
                              cam.fullName.toLowerCase().includes(searchLower) ||
                              cam.displayName.toLowerCase().includes(searchLower)
                            )
                          : divRoster;
                        // Sort: unassigned first, then by name
                        const sorted = [...filtered].sort((a,b) => {
                          const aAssigned = assignedIds.has(a.id);
                          const bAssigned = assignedIds.has(b.id);
                          if (aAssigned !== bAssigned) return aAssigned ? 1 : -1;
                          return a.fullName.localeCompare(b.fullName);
                        });
                        return (
                          <div className="mb-3 rounded-xl border border-blue-500/30 bg-[#0a1020] overflow-hidden">
                            <div className="p-2 border-b border-white/10">
                              <input
                                autoFocus
                                value={playerSearch}
                                onChange={e => setPlayerSearch(e.target.value)}
                                placeholder="Search by name…"
                                className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500 placeholder-gray-600"
                              />
                            </div>
                            {sorted.length === 0 ? (
                              <p className="text-xs text-gray-600 text-center py-3">
                                {playerSearch ? "No matches" : `No more ${divisionForTeam} players available`}
                              </p>
                            ) : (
                              <div className="max-h-48 overflow-y-auto divide-y divide-white/5">
                                {sorted.map(cam => (
                                  <button
                                    key={cam.id}
                                    onClick={() => addPlayerToTeam(team.id, cam.fullName)}
                                    className="w-full text-left px-3 py-2 hover:bg-blue-500/15 transition-colors flex items-center justify-between gap-2"
                                  >
                                    <span className="text-white text-xs font-medium">{cam.fullName}</span>
                                    <span className={`text-[10px] font-bold shrink-0 ${assignedIds.has(cam.id) ? "text-yellow-500/70" : "text-green-500/70"}`}>
                                      {assignedIds.has(cam.id) ? "on a team" : `Gr. ${cam.gradeNum}`}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                            <div className="px-3 py-1.5 border-t border-white/10">
                              <button onClick={() => { setAddPlayerOpen(null); setPlayerSearch(""); }} className="text-xs text-gray-600 hover:text-gray-400">
                                Cancel
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Player chips */}
                      {team.players.filter(p => p.trim()).length === 0 ? (
                        <p className="text-xs text-gray-700 italic py-2">No players yet — click Add Player or drag from the roster</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {team.players.filter(p => p.trim()).map((p, idx) => (
                            <span key={idx} className="flex items-center gap-1 bg-white/8 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white">
                              {p}
                              <button
                                onClick={() => removeFromTeam(team.id, p)}
                                className="text-gray-600 hover:text-red-400 ml-0.5 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── POOL PLAY SCORES ── */}
      {section === "poolplay" && (
        <div className="space-y-6">
          {(["NBA", "College"] as Division[]).map(div => {
            const games = getPoolGames().filter(game => game.division === div).sort((a, b) => a.round - b.round);
            const opts = teamOpts(div);
            return (
              <div key={div} className="glass rounded-2xl border border-white/10 p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div>
                    <h3 className="text-white font-black text-base">{div} Division — Pool Play Scores</h3>
                    <p className="text-gray-500 text-xs mt-0.5">
                      Enter pool play scores here. The Standings tab and public website standings use these scores.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => addPoolGame(div)}
                      className="px-3 py-1.5 glass border border-white/15 hover:border-blue-500/40 text-gray-400 hover:text-blue-400 text-xs font-bold rounded-xl transition-all">
                      + Add Pool Game
                    </button>
                    <button onClick={() => generateSixGamePoolSchedule(div)}
                      className="px-3 py-1.5 glass border border-yellow-500/30 hover:border-yellow-400/60 text-yellow-500 hover:text-yellow-300 text-xs font-bold rounded-xl transition-all">
                      Generate 12 Games/Team
                    </button>
                    <button onClick={savePoolGames}
                      className="flex items-center gap-1.5 px-3 py-1.5 glass border border-white/15 hover:border-green-500/40 text-gray-400 hover:text-green-400 text-xs font-bold rounded-xl transition-all">
                      <Save className="w-3 h-3" /> Save Scores
                    </button>
                  </div>
                </div>

                {games.length === 0 ? (
                  <p className="text-gray-600 text-sm">No pool play games yet. Click &quot;Add Pool Game&quot; to create one.</p>
                ) : (
                  <div className="space-y-3">
                    {games.map(game => (
                      <div key={game.id} className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 text-xs">Round</span>
                            <input
                              type="number" min={1} max={12}
                              value={game.round}
                              onChange={e => setPoolGameField(game.id, "round", parseInt(e.target.value) || 1)}
                              className="w-14 text-center px-2 py-1 rounded-lg bg-[#0f1729] border border-white/20 text-white text-xs focus:outline-none focus:border-blue-500"
                            />
                            <span className="text-gray-500 text-xs">Court</span>
                            <input
                              value={game.court ?? ""}
                              onChange={e => setPoolGameField(game.id, "court", e.target.value)}
                              className="w-40 text-center px-3 py-1.5 rounded-lg bg-[#0f1729] border border-white/20 text-white text-xs focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={game.status ?? "scheduled"}
                              onChange={e => setPoolGameField(game.id, "status", e.target.value)}
                              className="px-2 py-1 rounded-lg bg-[#0f1729] border border-white/20 text-white text-xs focus:outline-none focus:border-blue-500">
                              <option value="scheduled">Scheduled</option>
                              <option value="live">🔴 Live</option>
                              <option value="final">Final</option>
                            </select>
                            <button onClick={() => removePoolGame(game.id)}
                              className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-red-400 transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-[1fr_150px_1fr] gap-4 items-end">
                          <div>
                            <label className="block text-xs text-gray-500 font-semibold mb-1.5">Team 1</label>
                            <select
                              value={game.team1Id}
                              onChange={e => setPoolGameField(game.id, "team1Id", e.target.value)}
                              className="w-full px-2 py-2 rounded-xl bg-[#0f1729] border border-white/20 text-white text-sm focus:outline-none focus:border-blue-500">
                              <option value="">Select Team 1…</option>
                              {opts.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <div>
                              <label className="block text-[10px] text-gray-600 text-center mb-1">Score</label>
                              <input
                                type="number" min={0} placeholder="0"
                                value={game.score1 ?? ""}
                                onChange={e => setPoolGameField(game.id, "score1", e.target.value === "" ? null : parseInt(e.target.value))}
                                className="w-full text-center px-3 py-3 rounded-xl bg-[#0f1729] border border-white/20 text-white text-lg font-black focus:outline-none focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-gray-600 text-center mb-1">Score</label>
                              <input
                                type="number" min={0} placeholder="0"
                                value={game.score2 ?? ""}
                                onChange={e => setPoolGameField(game.id, "score2", e.target.value === "" ? null : parseInt(e.target.value))}
                                className="w-full text-center px-3 py-3 rounded-xl bg-[#0f1729] border border-white/20 text-white text-lg font-black focus:outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 font-semibold mb-1.5 text-right">Team 2</label>
                            <select
                              value={game.team2Id}
                              onChange={e => setPoolGameField(game.id, "team2Id", e.target.value)}
                              className="w-full px-2 py-2 rounded-xl bg-[#0f1729] border border-white/20 text-white text-sm focus:outline-none focus:border-blue-500">
                              <option value="">Select Team 2…</option>
                              {opts.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── STANDINGS ── */}
      {section === "standings" && (
        <div className="space-y-6">
          {(["NBA", "College"] as Division[]).map(div => {
            const rows = calcPoolStandings(div);
            const games = getPoolGames()
              .filter(game => game.division === div && isPlayedPoolGame(game))
              .sort((a, b) => a.round - b.round);

            return (
              <div key={div} className="glass rounded-2xl border border-white/10 p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div>
                    <h3 className="text-white font-black text-base">{div} Division Standings</h3>
                    <p className="text-gray-500 text-xs mt-1">
                      Auto-calculated from Pool Play scores. Scheduled 0–0 games are ignored until a score is entered.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-bold">
                    {games.length} scored games
                  </span>
                </div>

                {divTeams(div).length === 0 ? (
                  <p className="text-gray-600 text-sm">Add teams first in the Teams &amp; Rosters section.</p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px]">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="pb-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider pr-4">Rank</th>
                            <th className="pb-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider pr-4">Team</th>
                            <th className="pb-3 px-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">W</th>
                            <th className="pb-3 px-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">L</th>
                            <th className="pb-3 px-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">PF</th>
                            <th className="pb-3 px-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">PA</th>
                            <th className="pb-3 px-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Diff</th>
                            <th className="pb-3 px-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">GP</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row, idx) => (
                            <tr key={row.team.id} className="border-b border-white/5">
                              <td className="py-3 pr-4 text-gray-500 font-black text-sm">#{idx + 1}</td>
                              <td className="py-3 pr-4 text-white font-semibold text-sm">{row.team.name || "(unnamed)"}</td>
                              <td className="py-3 px-3 text-center text-green-400 font-black text-sm">{row.wins}</td>
                              <td className="py-3 px-3 text-center text-red-400 font-black text-sm">{row.losses}</td>
                              <td className="py-3 px-3 text-center text-gray-300 text-sm">{row.pointsFor}</td>
                              <td className="py-3 px-3 text-center text-gray-300 text-sm">{row.pointsAgainst}</td>
                              <td className={`py-3 px-3 text-center font-black text-sm ${row.diff > 0 ? "text-green-400" : row.diff < 0 ? "text-red-400" : "text-gray-500"}`}>
                                {row.diff > 0 ? "+" : ""}{row.diff}
                              </td>
                              <td className="py-3 px-3 text-center text-gray-500 text-sm">{row.gamesPlayed}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {games.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-white/10">
                        <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Pool Play Scores Used</div>
                        <div className="grid md:grid-cols-2 gap-2">
                          {games.map(game => (
                            <div key={game.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 flex items-center gap-2 text-xs">
                              <span className="text-gray-500 font-bold">R{game.round}</span>
                              <span className="text-white font-semibold flex-1 truncate">{teamName(game.team1Id)}</span>
                              <span className="text-white font-black">{game.score1}</span>
                              <span className="text-gray-600">–</span>
                              <span className="text-white font-black">{game.score2}</span>
                              <span className="text-white font-semibold flex-1 truncate text-right">{teamName(game.team2Id)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── BRACKET ── */}
      {section === "bracket" && (
        <div className="space-y-6">
          {(["NBA", "College"] as Division[]).map(div => {
            const divGames    = data.bracketGames.filter(g => g.division === div);
            const quarters    = divGames.filter(g => g.round === "quarter").sort((a,b) => a.id.localeCompare(b.id));
            const semis       = divGames.filter(g => g.round === "semi").sort((a,b) => a.id.localeCompare(b.id));
            const finals      = divGames.filter(g => g.round === "final");
            const thirds      = divGames.filter(g => g.round === "3rd");
            const hasQuarters = quarters.length > 0;
            const opts        = teamOpts(div);
            const divColor    = div === "NBA" ? "text-orange-400" : "text-blue-400";

            /** Shared game card for any round */
            const BracketCard = ({ game, label, accent }: { game: BracketGame; label: string; accent: string }) => {
              const s1 = game.score1 ?? null;
              const s2 = game.score2 ?? null;
              const played    = s1 !== null && s2 !== null;
              const w1        = played && s1! > s2!;
              const w2        = played && s2! > s1!;
              const canAdvance = played && (game.round === "semi" || game.round === "quarter");
              return (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
                  {/* Header row */}
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/8 bg-white/[0.02]">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${accent}`}>{label}</span>
                    <div className="flex items-center gap-1.5">
                      <select value={game.status} onChange={e => setBracketField(game.id, "status", e.target.value)}
                        className="px-1.5 py-0.5 rounded bg-[#0f1729] border border-white/15 text-white text-[10px] focus:outline-none focus:border-blue-500">
                        <option value="scheduled">Scheduled</option>
                        <option value="live">🔴 Live</option>
                        <option value="final">✅ Final</option>
                      </select>
                      <select value={game.court} onChange={e => setBracketField(game.id, "court", e.target.value)}
                        className="px-1.5 py-0.5 rounded bg-[#0f1729] border border-white/15 text-white text-[10px] focus:outline-none focus:border-blue-500">
                        {["Court A","Court B","Court 1","Court 2","Main Court","Gym A","Gym B","Both Courts"].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <button onClick={() => removeBracketGame(game.id)}
                        className="text-gray-700 hover:text-red-400 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  {/* Team 1 row */}
                  <div className={`flex items-center gap-2 px-3 py-2 border-b border-white/5 ${w1 ? "bg-green-500/8" : ""}`}>
                    <select value={game.team1Id} onChange={e => setBracketField(game.id, "team1Id", e.target.value)}
                      className={`flex-1 px-2 py-1.5 rounded-lg bg-[#0f1729] border text-white text-xs font-bold focus:outline-none transition-colors ${w1 ? "border-green-500/40 text-green-300" : "border-white/15 focus:border-blue-500"}`}>
                      <option value="">— Team 1 —</option>
                      {opts.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                    <input type="number" min={0} placeholder="—" value={s1 ?? ""}
                      onChange={e => setBracketField(game.id, "score1", e.target.value === "" ? null : parseInt(e.target.value))}
                      className={`w-14 text-center px-2 py-1.5 rounded-lg bg-[#0f1729] border text-white text-base font-black focus:outline-none transition-colors ${w1 ? "border-green-500/40 text-green-300" : "border-white/15 focus:border-blue-500"}`}
                    />
                  </div>
                  {/* Team 2 row */}
                  <div className={`flex items-center gap-2 px-3 py-2 ${w2 ? "bg-green-500/8" : ""}`}>
                    <select value={game.team2Id} onChange={e => setBracketField(game.id, "team2Id", e.target.value)}
                      className={`flex-1 px-2 py-1.5 rounded-lg bg-[#0f1729] border text-white text-xs font-bold focus:outline-none transition-colors ${w2 ? "border-green-500/40 text-green-300" : "border-white/15 focus:border-blue-500"}`}>
                      <option value="">— Team 2 —</option>
                      {opts.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                    <input type="number" min={0} placeholder="—" value={s2 ?? ""}
                      onChange={e => setBracketField(game.id, "score2", e.target.value === "" ? null : parseInt(e.target.value))}
                      className={`w-14 text-center px-2 py-1.5 rounded-lg bg-[#0f1729] border text-white text-base font-black focus:outline-none transition-colors ${w2 ? "border-green-500/40 text-green-300" : "border-white/15 focus:border-blue-500"}`}
                    />
                  </div>
                  {/* Advance winner button */}
                  {canAdvance && played && (
                    <div className="px-3 py-1.5 border-t border-white/8 bg-white/[0.02]">
                      <button onClick={() => advanceWinner(game.id)}
                        className="flex items-center gap-1 text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors">
                        <ChevronRight className="w-3 h-3" /> Advance winner →
                      </button>
                    </div>
                  )}
                </div>
              );
            };

            return (
              <div key={div} className="glass rounded-2xl border border-white/10 p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div>
                    <h3 className={`font-black text-base ${divColor}`}>{div} Division — Championship Bracket</h3>
                    <p className="text-gray-500 text-xs mt-0.5">{div === "NBA" ? "1st – 4th Grade" : "5th – 8th Grade"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => generateBracketTemplate(div, "4-team")}
                      className="px-3 py-1.5 glass border border-white/15 hover:border-orange-500/40 text-gray-400 hover:text-orange-400 text-xs font-bold rounded-xl transition-all">
                      ⚡ 4-Team Bracket
                    </button>
                    <button onClick={() => generateBracketTemplate(div, "8-team")}
                      className="px-3 py-1.5 glass border border-white/15 hover:border-orange-500/40 text-gray-400 hover:text-orange-400 text-xs font-bold rounded-xl transition-all">
                      ⚡ 8-Team Bracket
                    </button>
                    <button onClick={() => autoSeedBracket(div)}
                      className="px-3 py-1.5 glass border border-white/15 hover:border-purple-500/40 text-gray-400 hover:text-purple-400 text-xs font-bold rounded-xl transition-all">
                      🎯 Auto-Seed
                    </button>
                    <button onClick={saveBracket}
                      className="flex items-center gap-1.5 px-3 py-1.5 glass border border-white/15 hover:border-green-500/40 text-gray-400 hover:text-green-400 text-xs font-bold rounded-xl transition-all">
                      <Save className="w-3 h-3" /> Save
                    </button>
                  </div>
                </div>

                {divGames.length === 0 ? (
                  <div className="text-center py-8 space-y-3">
                    <p className="text-gray-600 text-sm">No bracket set up yet.</p>
                    <div className="flex justify-center gap-3">
                      <button onClick={() => generateBracketTemplate(div, "4-team")}
                        className="px-4 py-2 bg-orange-600/20 hover:bg-orange-600/35 border border-orange-500/30 text-orange-400 text-xs font-bold rounded-xl transition-all">
                        Generate 4-Team Bracket (Semi → Final)
                      </button>
                      <button onClick={() => generateBracketTemplate(div, "8-team")}
                        className="px-4 py-2 bg-orange-600/20 hover:bg-orange-600/35 border border-orange-500/30 text-orange-400 text-xs font-bold rounded-xl transition-all">
                        Generate 8-Team Bracket (QF → Semi → Final)
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Visual bracket tree ── */
                  <div className="overflow-x-auto">
                    <div className={`grid gap-4 min-w-[480px] ${hasQuarters ? "grid-cols-[1fr_auto_1fr_auto_1fr]" : "grid-cols-[1fr_auto_1fr]"}`}
                      style={{ alignItems: "start" }}>

                      {/* QUARTERFINALS column (only if exists) */}
                      {hasQuarters && (
                        <>
                          <div className="space-y-4">
                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-2 text-center">Quarterfinals</div>
                            {quarters.map((g,i) => (
                              <BracketCard key={g.id} game={g}
                                label={`QF ${i+1}`}
                                accent={div === "NBA" ? "text-orange-400" : "text-blue-400"}
                              />
                            ))}
                          </div>
                          {/* Connector arrow */}
                          <div className="flex items-center justify-center text-gray-700 text-xl pt-8">›</div>
                        </>
                      )}

                      {/* SEMIFINALS column */}
                      <div className="space-y-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-2 text-center">Semifinals</div>
                        {semis.length === 0 ? (
                          <button onClick={() => addBracketGame(div, "semi")}
                            className="w-full py-3 border border-dashed border-white/15 rounded-xl text-gray-700 text-xs hover:border-blue-500/40 hover:text-blue-400 transition-all">
                            + Add Semifinal
                          </button>
                        ) : (
                          semis.map((g,i) => (
                            <BracketCard key={g.id} game={g}
                              label={`SF ${i+1}`}
                              accent="text-blue-400"
                            />
                          ))
                        )}
                        {semis.length > 0 && (
                          <button onClick={() => addBracketGame(div, "semi")}
                            className="w-full py-1.5 border border-dashed border-white/10 rounded-lg text-gray-700 text-[10px] hover:border-blue-500/30 hover:text-blue-400 transition-all">
                            + Add Semifinal
                          </button>
                        )}
                      </div>

                      {/* Connector arrow */}
                      <div className="flex items-center justify-center text-gray-700 text-xl pt-8">›</div>

                      {/* FINAL + 3RD column */}
                      <div className="space-y-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-2 text-center">Championship</div>
                        {finals.length === 0 ? (
                          <button onClick={() => addBracketGame(div, "final")}
                            className="w-full py-3 border border-dashed border-white/15 rounded-xl text-gray-700 text-xs hover:border-yellow-500/40 hover:text-yellow-400 transition-all">
                            + Add Championship Game
                          </button>
                        ) : (
                          finals.map(g => (
                            <BracketCard key={g.id} game={g}
                              label="🏆 Championship"
                              accent="text-yellow-400"
                            />
                          ))
                        )}
                        {/* 3rd place */}
                        <div className="mt-3">
                          <div className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-2 text-center">3rd Place</div>
                          {thirds.length === 0 ? (
                            <button onClick={() => addBracketGame(div, "3rd")}
                              className="w-full py-3 border border-dashed border-white/15 rounded-xl text-gray-700 text-xs hover:border-gray-500/40 hover:text-gray-400 transition-all">
                              + Add 3rd Place Game
                            </button>
                          ) : (
                            thirds.map(g => (
                              <BracketCard key={g.id} game={g}
                                label="🥉 3rd Place"
                                accent="text-gray-400"
                              />
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
                            const nominees = (nom?.players ?? []).filter(p => p.trim());
                            const isFull = nominees.length >= slots;
                            const isDropTarget = eventDragOver?.eventId === evt.id && eventDragOver?.teamId === team.id;
                            const isNomineeOpen = addNomineeOpen?.eventId === evt.id && addNomineeOpen?.teamId === team.id;
                            return (
                              <div key={team.id}
                                onDragOver={e => !isFull && handleEventDragOver(e, evt.id, team.id)}
                                onDragLeave={() => setEventDragOver(null)}
                                onDrop={e => handleEventDrop(e, evt.id, team.id)}
                                className={`rounded-xl border p-2.5 transition-all ${
                                  isDropTarget ? "border-purple-400 bg-purple-500/15 scale-[1.01]"
                                  : isFull     ? "border-white/10 bg-white/[0.02]"
                                  :              "border-white/15 bg-white/[0.03] hover:border-white/25"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <label className="text-xs font-semibold text-gray-400">{team.name || "(unnamed)"}</label>
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-[10px] font-bold ${isFull ? "text-yellow-500" : "text-gray-600"}`}>
                                      {nominees.length}/{slots}{isFull ? " full" : ""}
                                    </span>
                                    {!isFull && (
                                      <button
                                        onClick={() => {
                                          setAddNomineeOpen(isNomineeOpen ? null : { eventId: evt.id, teamId: team.id });
                                          setNomineeSearch("");
                                        }}
                                        className="flex items-center gap-0.5 px-1.5 py-0.5 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-purple-400 text-[10px] font-bold rounded-md transition-all"
                                      >
                                        <Plus className="w-2.5 h-2.5" /> Add
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Add nominee dropdown */}
                                {isNomineeOpen && (() => {
                                  const teamPlayers = (data.teams.find(t => t.id === team.id)?.players ?? []).filter(p => p.trim());
                                  const divisionForEvt = evt.division ?? div;
                                  const gradeRange = divisionForEvt === "NBA" ? [1,4] : [5,8];
                                  const divRoster = roster.filter(cam => cam.gradeNum >= gradeRange[0] && cam.gradeNum <= gradeRange[1]);
                                  const searchLower = nomineeSearch.toLowerCase();
                                  // Show team players first, then rest of division
                                  const teamRoster = divRoster.filter(cam => teamPlayers.includes(cam.fullName));
                                  const otherRoster = divRoster.filter(cam => !teamPlayers.includes(cam.fullName));
                                  const allOptions = [...teamRoster, ...otherRoster].filter(cam => !nominees.includes(cam.fullName));
                                  const filtered = nomineeSearch ? allOptions.filter(cam =>
                                    cam.fullName.toLowerCase().includes(searchLower) || cam.displayName.toLowerCase().includes(searchLower)
                                  ) : allOptions;
                                  return (
                                    <div className="mb-2 rounded-lg border border-purple-500/30 bg-[#0a0f1e] overflow-hidden">
                                      <div className="p-1.5 border-b border-white/10">
                                        <input
                                          autoFocus
                                          value={nomineeSearch}
                                          onChange={e => setNomineeSearch(e.target.value)}
                                          placeholder="Search player…"
                                          className="w-full px-2 py-1 rounded-md bg-white/5 border border-white/10 text-white text-[11px] focus:outline-none focus:border-purple-500 placeholder-gray-600"
                                        />
                                      </div>
                                      {filtered.length === 0 ? (
                                        <p className="text-[11px] text-gray-600 text-center py-2">
                                          {nomineeSearch ? "No matches" : "No players available"}
                                        </p>
                                      ) : (
                                        <div className="max-h-36 overflow-y-auto divide-y divide-white/5">
                                          {filtered.map(cam => (
                                            <button
                                              key={cam.id}
                                              onClick={() => addNominee(evt.id, team.id, cam.fullName)}
                                              className="w-full text-left px-2.5 py-1.5 hover:bg-purple-500/15 transition-colors flex items-center justify-between gap-2"
                                            >
                                              <span className="text-white text-[11px] font-medium">{cam.fullName}</span>
                                              <span className={`text-[10px] font-bold shrink-0 ${teamPlayers.includes(cam.fullName) ? "text-blue-400/70" : "text-gray-600"}`}>
                                                {teamPlayers.includes(cam.fullName) ? "on team" : `Gr. ${cam.gradeNum}`}
                                              </span>
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                      <div className="px-2 py-1 border-t border-white/10">
                                        <button onClick={() => { setAddNomineeOpen(null); setNomineeSearch(""); }} className="text-[10px] text-gray-600 hover:text-gray-400">Cancel</button>
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* Nominee chips */}
                                {nominees.length === 0 ? (
                                  <p className={`text-[11px] text-center py-2 rounded-lg border border-dashed ${
                                    isDropTarget ? "text-purple-400 border-purple-400/50" : "text-gray-700 border-white/10"
                                  }`}>
                                    {isDropTarget ? "Drop to nominate" : "Drop player here or click Add"}
                                  </p>
                                ) : (
                                  <div className="flex flex-wrap gap-1">
                                    {nominees.map((p, idx) => (
                                      <span key={idx} className="flex items-center gap-1 bg-purple-500/15 border border-purple-500/25 rounded-md px-2 py-0.5 text-[11px] text-purple-200">
                                        {p}
                                        <button onClick={() => removeNominee(evt.id, team.id, p)} className="text-purple-400/50 hover:text-red-400 transition-colors">
                                          <X className="w-2.5 h-2.5" />
                                        </button>
                                      </span>
                                    ))}
                                    {!isFull && (
                                      <span className={`text-[11px] border border-dashed rounded-md px-2 py-0.5 ${
                                        isDropTarget ? "text-purple-400 border-purple-400/50" : "text-gray-700 border-white/10"
                                      }`}>
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

      {/* ── SCHEDULE ── */}
      {section === "schedule" && <ScheduleTab adminKey={adminKey} />}

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

      {/* ── Inline Camper Edit Modal ── */}
      {editingCamper && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setEditingCamper(null)}>
          <div className="bg-[#0D1520] border border-white/15 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div>
                <h3 className="text-white font-black text-base">Edit Camper</h3>
                <p className="text-gray-500 text-xs mt-0.5">{editingCamper.camperName || "—"}</p>
              </div>
              <button onClick={() => setEditingCamper(null)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Camper info */}
              <div>
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Camper Info</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {([ ["Camper Name", "camperName"], ["Grade", "grade"], ["Shirt Size", "shirtSize"] ] as const).map(([label, key]) => (
                    <div key={key}>
                      <label className="block text-gray-400 text-xs font-semibold mb-1">{label}</label>
                      <input
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        value={editCamperPatch[key] ?? editingCamper[key] ?? ""}
                        onChange={e => setEditCamperPatch(p => ({ ...p, [key]: e.target.value }))}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-gray-400 text-xs font-semibold mb-1">Gender</label>
                    <select
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      value={editCamperPatch.gender ?? editingCamper.gender ?? ""}
                      onChange={e => setEditCamperPatch(p => ({ ...p, gender: e.target.value }))}>
                      <option value="">Select</option>
                      <option value="Boys">Boys</option>
                      <option value="Girls">Girls</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Parent contact */}
              <div>
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Parent / Guardian</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {([ ["Parent Name", "name"], ["Email", "email"], ["Phone", "phone"] ] as const).map(([label, key]) => (
                    <div key={key}>
                      <label className="block text-gray-400 text-xs font-semibold mb-1">{label}</label>
                      <input
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        value={editCamperPatch[key] ?? editingCamper[key] ?? ""}
                        onChange={e => setEditCamperPatch(p => ({ ...p, [key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Emergency + Payment */}
              <div>
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Emergency & Payment</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {([ ["Emergency Contact", "emergencyContact"], ["Emergency Phone", "emergencyPhone"], ["Payment Status", "paymentStatus"], ["Amount Paid ($)", "amountPaid"] ] as const).map(([label, key]) => (
                    <div key={key}>
                      <label className="block text-gray-400 text-xs font-semibold mb-1">{label}</label>
                      <input
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        value={editCamperPatch[key] ?? editingCamper[key] ?? ""}
                        onChange={e => setEditCamperPatch(p => ({ ...p, [key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-gray-400 text-xs font-semibold mb-1">Notes</label>
                <textarea rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  value={editCamperPatch.notes ?? editingCamper.notes ?? ""}
                  onChange={e => setEditCamperPatch(p => ({ ...p, notes: e.target.value }))}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-5 py-4 border-t border-white/10">
              <button onClick={saveCamperEdit} disabled={editCamperSaving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all text-sm">
                {editCamperSaving
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                  : <><Save className="w-4 h-4" /> Save Changes</>}
              </button>
              <button onClick={() => setEditingCamper(null)}
                className="px-5 py-2.5 border border-white/20 text-gray-400 hover:text-white rounded-xl text-sm font-semibold transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
