"use client";

import { useState, useCallback, useEffect } from "react";
import type {
  Tournament, Division, Pool, PoolGame, BracketGame, Team,
  BracketFormat, TiebreakerMethod, VenueConfig
} from "@/lib/tourney-types";
import { getAllTournaments, saveTournament, deleteTournament as deleteT, setTourneyAdminKey, syncTournamentsFromServer } from "@/lib/tourney-storage";
import { generateDivisionSchedule, courtToVenueName, buildUnscheduledPoolGames, buildTournamentDates, buildDayTimeSlots, autoScheduleGames, formatTime12 } from "@/lib/tourney-scheduler";
import { calculateStandings } from "@/lib/tourney-standings";
import { generateBracket, advanceBracketWinner } from "@/lib/tourney-bracket";
import { Plus, Trash2, ArrowLeft, Trophy, Calendar, MapPin, Users, Clock, Edit, X, Download, ChevronDown } from "lucide-react";
import type { TournamentConfig } from "@/lib/tournament-client";

// ── Registration contact ──────────────────────────────────────────────────────

export interface RegistrationContact {
  id: string; name: string; email: string; phone: string;
  source: string;
  tournamentName?: string; teamName?: string; division?: string;
  schedulingRequests?: string; noPlayBefore?: string; noPlayAfter?: string; noOverlapWithTeam?: string;
  date: string;
}

// ── Division presets ──────────────────────────────────────────────────────────

// Team type qualifiers offered alongside grade + gender when building division presets.
const TEAM_TYPES = ["", "Competitive", "Development", "AAU"];

function buildGradePresets(grade: string): string[] {
  const presets: string[] = [];
  for (const gender of ["Boys", "Girls"]) {
    for (const type of TEAM_TYPES) {
      presets.push(type ? `${grade} ${gender} ${type}` : `${grade} ${gender}`);
    }
  }
  return presets;
}

const GRADE_PRESETS: { grade: string; presets: string[] }[] = [
  "3rd/4th Grade", "5th Grade", "6th Grade", "7th Grade", "8th Grade",
].map(grade => ({ grade, presets: buildGradePresets(grade) }));

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2,5)}`;

// Parse a YYYY-MM-DD string as a local date (avoids UTC off-by-one issues)
function parseLocalDate(s: string): Date | null {
  if (!s) return null;
  const [y,m,d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m-1, d);
}
function formatDateRange(start: string, end: string): string {
  const sd = parseLocalDate(start), ed = parseLocalDate(end);
  if (!sd) return "";
  if (!ed || start === end) return sd.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const sameMonth = sd.getMonth() === ed.getMonth() && sd.getFullYear() === ed.getFullYear();
  const startStr = sd.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endStr = sameMonth
    ? ed.toLocaleDateString("en-US", { day: "numeric", year: "numeric" })
    : ed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${startStr}\u2013${endStr}`;
}

function totalCourts(venues: VenueConfig[]): number {
  return venues.reduce((s, v) => s + (v.courts || 1), 0);
}
function venueLabel(venues: VenueConfig[]): string {
  return venues.filter(v => v.name.trim()).map(v => v.name).join(" · ") || "—";
}

function matchingRegs(contacts: RegistrationContact[], tournamentName: string): RegistrationContact[] {
  const n = tournamentName.toLowerCase().trim();
  return contacts.filter(c =>
    c.source === "tournament" && c.tournamentName?.toLowerCase().trim() === n && c.teamName?.trim()
  );
}
function teamImported(tournament: Tournament, teamName: string, divisionName: string): boolean {
  const div = tournament.divisions.find(d => d.name.toLowerCase() === divisionName.toLowerCase());
  return !!div?.teams.some(t => t.name.toLowerCase() === teamName.toLowerCase().trim());
}

function Btn({ children, onClick, className = "", disabled = false, type: t = "button" }: {
  children: React.ReactNode; onClick?: () => void; className?: string;
  disabled?: boolean; type?: "button"|"submit";
}) {
  return (
    <button type={t} onClick={onClick} disabled={disabled}
      className={`px-3 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${className}`}>
      {children}
    </button>
  );
}

function IF({ label, value, onChange, placeholder = "", type = "text", min, step }: {
  label: string; value: string|number; onChange: (v: string) => void;
  placeholder?: string; type?: string; min?: string; step?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</label>
      <input type={type} min={min} step={step} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500/60 placeholder:text-gray-600" />
    </div>
  );
}

// ── Venue + Courts editor ─────────────────────────────────────────────────────

function VenueEditor({ venues, onChange }: { venues: VenueConfig[]; onChange: (v: VenueConfig[]) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Venues &amp; Courts</label>
        <span className="text-[10px] text-gray-600">Total: {totalCourts(venues)} court{totalCourts(venues)!==1?"s":""}</span>
      </div>
      <div className="space-y-2">
        {venues.map((v, i) => (
          <div key={i} className="flex gap-2 items-start">
            {/* Venue name */}
            <div className="flex-1">
              <input value={v.name} onChange={e => { const n=[...venues]; n[i]={...n[i], name: e.target.value}; onChange(n); }}
                placeholder={`Venue ${i+1} (e.g. Main Gym)`}
                className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500/60 placeholder:text-gray-600" />
            </div>
            {/* Courts at this venue */}
            <div className="flex-shrink-0 w-28">
              <div className="relative">
                <input type="number" min="1" max="20" value={v.courts}
                  onChange={e => { const n=[...venues]; n[i]={...n[i], courts: Math.max(1, +e.target.value||1)}; onChange(n); }}
                  className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 pr-2 rounded-lg focus:outline-none focus:border-blue-500/60 text-center" />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 text-[10px] pointer-events-none">courts</span>
              </div>
            </div>
            {venues.length > 1 && (
              <button onClick={() => onChange(venues.filter((_,j)=>j!==i))} className="text-gray-600 hover:text-red-400 transition-colors p-2 mt-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
        <button onClick={() => onChange([...venues, { name: "", courts: 2 }])}
          className="text-xs text-blue-400 hover:text-blue-300 font-bold transition-colors">
          + Add another venue
        </button>
      </div>
    </div>
  );
}

// ── Tiebreaker picker ─────────────────────────────────────────────────────────

function TiebreakerPicker({ value, onChange }: { value: TiebreakerMethod; onChange: (v: TiebreakerMethod) => void }) {
  const opts: { value: TiebreakerMethod; label: string; desc: string }[] = [
    { value: "point_diff", label: "Point Differential",    desc: "Net +/− points (PF minus PA) breaks ties" },
    { value: "least_pa",   label: "Least Points Allowed",  desc: "Fewest points scored against you wins the tiebreaker" },
  ];
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tiebreaker (when teams are tied in W-L)</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {opts.map(o => (
          <button key={o.value} type="button" onClick={() => onChange(o.value)}
            className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${value===o.value?"border-blue-500/60 bg-blue-500/10":"border-white/10 hover:border-white/20"}`}>
            <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 ${value===o.value?"border-blue-500 bg-blue-500":"border-gray-600"}`}/>
            <div>
              <div className={`text-sm font-bold ${value===o.value?"text-white":"text-gray-300"}`}>{o.label}</div>
              <div className="text-[11px] text-gray-500 leading-tight mt-0.5">{o.desc}</div>
            </div>
          </button>
        ))}
      </div>
      <p className="text-[10px] text-gray-600 mt-1">Head-to-head result is always checked first before either tiebreaker.</p>
    </div>
  );
}

// ── Bracket format picker ─────────────────────────────────────────────────────

function DayWindowsEditor({ startDate, endDate, value, onChange, defaultStart }: {
  startDate: string; endDate: string;
  value: Record<string, { start: string; end: string }>;
  onChange: (v: Record<string, { start: string; end: string }>) => void;
  defaultStart: string;
}) {
  const dates = buildTournamentDates(startDate, endDate);
  if (dates.length === 0) {
    return <p className="text-gray-600 text-xs">Set Start Date &amp; End Date above to configure each day's first-game and last-game times.</p>;
  }
  function setWindow(date: string, field: "start"|"end", v: string) {
    const cur = value[date] ?? { start: defaultStart, end: "20:00" };
    onChange({ ...value, [date]: { ...cur, [field]: v } });
  }
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">First Game / Last Game — Per Day</label>
      {dates.map(date => {
        const w = value[date] ?? { start: defaultStart, end: "20:00" };
        return (
          <div key={date} className="flex items-center gap-2">
            <span className="text-gray-400 text-xs w-24 flex-shrink-0">{new Date(date + "T00:00:00").toLocaleDateString("en-US",{ month:"short", day:"numeric" })}</span>
            <input type="time" value={w.start} onChange={e=>setWindow(date, "start", e.target.value)}
              className="flex-1 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500" />
            <span className="text-gray-600 text-xs">to</span>
            <input type="time" value={w.end} onChange={e=>setWindow(date, "end", e.target.value)}
              className="flex-1 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500" />
          </div>
        );
      })}
    </div>
  );
}

function BracketFormatPicker({ value, onChange }: { value: BracketFormat; onChange: (v: BracketFormat) => void }) {
  const opts: { value: BracketFormat; label: string; desc: string }[] = [
    { value: "single", label: "Single Elimination", desc: "One loss and you're out" },
    { value: "double", label: "Double Elimination", desc: "Two losses to be eliminated" },
    { value: "none",   label: "Pool Play Only",     desc: "No bracket — standings decide champion" },
  ];
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Bracket Format</label>
      <div className="grid gap-2">
        {opts.map(o => (
          <button key={o.value} type="button" onClick={() => onChange(o.value)}
            className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${value===o.value?"border-blue-500/60 bg-blue-500/10":"border-white/10 hover:border-white/20"}`}>
            <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 ${value===o.value?"border-blue-500 bg-blue-500":"border-gray-600"}`}/>
            <div>
              <div className={`text-sm font-bold ${value===o.value?"text-white":"text-gray-300"}`}>{o.label}</div>
              <div className="text-xs text-gray-500">{o.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Division preset picker ────────────────────────────────────────────────────

function DivisionPresetPicker({ onSelect }: { onSelect: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [hoveredGrade, setHoveredGrade] = useState<string | null>(GRADE_PRESETS[0].grade);

  const current = GRADE_PRESETS.find(g => g.grade === hoveredGrade) ?? GRADE_PRESETS[0];

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(p => !p)}
        className="flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">
        Presets <ChevronDown className={`w-3 h-3 transition-transform ${open?"rotate-180":""}`}/>
      </button>
      {open && (
        <div className="absolute top-6 left-0 z-40 bg-[#0f1522] border border-white/15 rounded-xl shadow-xl overflow-hidden w-[380px]">
          <div className="flex">
            {/* Grade column */}
            <div className="w-32 border-r border-white/10 py-1">
              {GRADE_PRESETS.map(g => (
                <button key={g.grade} type="button"
                  onMouseEnter={() => setHoveredGrade(g.grade)}
                  onClick={() => setHoveredGrade(g.grade)}
                  className={`w-full text-left px-3 py-2 text-xs font-bold transition-colors ${hoveredGrade===g.grade?"bg-blue-500/15 text-blue-300":"text-gray-400 hover:text-gray-200"}`}>
                  {g.grade}
                </button>
              ))}
            </div>
            {/* Options column */}
            <div className="flex-1 p-2 space-y-1">
              {current.presets.map(p => (
                <button key={p} type="button"
                  onClick={() => { onSelect(p); setOpen(false); }}
                  className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-medium">
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-white/10 px-3 py-2">
            <button type="button" onClick={() => setOpen(false)} className="text-[10px] text-gray-600 hover:text-gray-400">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

const S_COLOR: Record<Tournament["status"], string> = {
  pool_play: "bg-blue-500/20 text-blue-300",
  bracket:   "bg-orange-500/20 text-orange-300",
  complete:  "bg-green-500/20 text-green-300",
};
const S_LABEL: Record<Tournament["status"], string> = {
  pool_play: "Pool Play", bracket: "Bracket", complete: "Complete",
};

function getTeamName(tournament: Tournament, teamId: string|null|undefined): string {
  if (!teamId) return "TBD";
  return tournament.divisions.flatMap(d => d.teams).find(t => t.id === teamId)?.name ?? "TBD";
}

// ── IMPORT REGISTRATIONS PANEL ────────────────────────────────────────────────

function ImportPanel({ tournament, contacts, onImport, onClose }: {
  tournament: Tournament; contacts: RegistrationContact[];
  onImport: (updated: Tournament) => void; onClose: () => void;
}) {
  const regs = matchingRegs(contacts, tournament.name);
  const byDiv: Record<string, RegistrationContact[]> = {};
  regs.forEach(c => {
    const key = c.division?.trim() || "Unassigned";
    if (!byDiv[key]) byDiv[key] = [];
    byDiv[key].push(c);
  });
  const initialSel: Record<string, boolean> = {};
  regs.forEach(c => { initialSel[c.id] = !teamImported(tournament, c.teamName!, c.division || ""); });
  const [selected, setSelected] = useState<Record<string, boolean>>(initialSel);

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const newCount = regs.filter(c => !teamImported(tournament, c.teamName!, c.division || "")).length;

  function toggle(id: string) { setSelected(p => ({ ...p, [id]: !p[id] })); }
  function selectAll(divRegs: RegistrationContact[]) { setSelected(p => { const n={...p}; divRegs.forEach(c=>n[c.id]=true); return n; }); }
  function deselectAll(divRegs: RegistrationContact[]) { setSelected(p => { const n={...p}; divRegs.forEach(c=>n[c.id]=false); return n; }); }

  function doImport() {
    const toImport = regs.filter(c => selected[c.id]);
    if (!toImport.length) return;
    const t: Tournament = JSON.parse(JSON.stringify(tournament));
    toImport.forEach(c => {
      const divName = c.division?.trim() || "";
      let div = t.divisions.find(d => d.name.toLowerCase() === divName.toLowerCase());
      if (!div) {
        // Category didn't exist yet on this bracket — create it so the team still lands in its own division.
        div = { id: makeId(), name: divName || "Unassigned", teams: [], pools: [], games: [], bracket: [], losersBracket: [], bracketGenerated: false };
        t.divisions.push(div);
      }
      if (div.teams.some(team => team.name.toLowerCase() === c.teamName!.toLowerCase().trim())) return;
      const team = {
        id: makeId(), name: c.teamName!.trim(), coachName: c.name,
        schedulingRequests: c.schedulingRequests || undefined,
        noPlayBefore: c.noPlayBefore || undefined,
        noPlayAfter:  c.noPlayAfter || undefined,
        noOverlapWithTeam: c.noOverlapWithTeam || undefined,
      };
      div.teams.push(team);
      // Auto-place the team into its category's pool so it's ready for pool-game generation immediately.
      if (div.pools.length === 0) div.pools.push({ id: makeId(), name: "Pool A", teamIds: [] });
      const pool = div.pools[0];
      if (!pool.teamIds.includes(team.id)) pool.teamIds.push(team.id);
    });
    t.updatedAt = new Date().toISOString();
    onImport(t);
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="glass border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-white/10 flex-shrink-0">
          <div>
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <Download className="w-4 h-4 text-yellow-400"/> Import Registrations
            </h2>
            <p className="text-gray-500 text-xs mt-0.5">
              {regs.length} registration{regs.length!==1?"s":""} for <span className="text-gray-300 font-bold">{tournament.name}</span>
              {newCount > 0 && <span className="text-yellow-400 ml-1">· {newCount} new</span>}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1"><X className="w-5 h-5"/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {regs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-2xl mb-3">📋</p>
              <p className="font-bold text-gray-400 mb-1">No registrations found</p>
              <p className="text-sm">No contacts with tournament name matching <span className="text-gray-300">&quot;{tournament.name}&quot;</span>.</p>
            </div>
          ) : (
            Object.entries(byDiv).map(([divName, divRegs]) => {
              const matchedDiv = tournament.divisions.find(d => d.name.toLowerCase() === divName.toLowerCase());
              const allSel = divRegs.every(c => selected[c.id]);
              return (
                <div key={divName}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-300 font-bold text-sm">{divName}</span>
                      {matchedDiv
                        ? <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">✓ matches division</span>
                        : <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">⚠️ no match</span>
                      }
                    </div>
                    <button onClick={() => allSel ? deselectAll(divRegs) : selectAll(divRegs)}
                      className="text-xs text-blue-400 hover:text-blue-300 font-bold transition-colors">
                      {allSel ? "Deselect all" : "Select all"}
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {divRegs.map(c => {
                      const alreadyIn = teamImported(tournament, c.teamName!, c.division || "");
                      return (
                        <label key={c.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                          alreadyIn ? "border-white/5 opacity-50 cursor-not-allowed"
                            : selected[c.id] ? "border-yellow-500/40 bg-yellow-500/5"
                            : "border-white/10 hover:border-white/20"
                        }`}>
                          <input type="checkbox" checked={selected[c.id] ?? false} disabled={alreadyIn}
                            onChange={() => !alreadyIn && toggle(c.id)}
                            className="w-4 h-4 accent-yellow-400 rounded flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-bold ${alreadyIn?"text-gray-600":"text-white"}`}>{c.teamName}</span>
                              {alreadyIn && <span className="text-[10px] text-gray-600 bg-white/5 px-1.5 py-0.5 rounded font-bold">already added</span>}
                            </div>
                            <div className="text-xs text-gray-500">Coach: {c.name}{c.email && <span className="ml-2 text-gray-600">{c.email}</span>}</div>
                            {c.schedulingRequests && (
                              <div className="text-xs text-yellow-400/90 mt-1 flex items-start gap-1">
                                <span className="flex-shrink-0">⚠️</span>
                                <span>{c.schedulingRequests}</span>
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
        {regs.length > 0 ? (
          <div className="flex gap-3 p-5 border-t border-white/10 flex-shrink-0">
            <Btn onClick={onClose} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400">Cancel</Btn>
            <Btn onClick={doImport} disabled={selectedCount === 0}
              className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white">
              Import {selectedCount > 0 ? `${selectedCount} Team${selectedCount!==1?"s":""}` : "Teams"}
            </Btn>
          </div>
        ) : (
          <div className="p-5 border-t border-white/10 flex-shrink-0">
            <Btn onClick={onClose} className="w-full bg-white/5 hover:bg-white/10 text-gray-400">Close</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

// ── REGISTRATION MERGE (paste-in) PANEL ───────────────────────────────────────

interface MergeRow { teamName: string; coach: string; division: string; }

function parseMergeText(raw: string): MergeRow[] {
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines[0]?.toLowerCase().includes("team")) lines.shift(); // skip header row
  return lines.map(line => {
    const parts = line.split(",").map(p => p.trim());
    return { teamName: parts[0] ?? "", coach: parts[1] || "No Coach Listed", division: parts[2] || "Unassigned" };
  }).filter(r => r.teamName);
}

function norm(v: string) { return (v || "").trim().toLowerCase().replace(/\s+/g, " "); }

function MergeTextPanel({ tournament, onImport, onClose }: {
  tournament: Tournament; onImport: (updated: Tournament) => void; onClose: () => void;
}) {
  const [raw, setRaw] = useState("");
  const rows = parseMergeText(raw);

  function loadSample() {
    setRaw("Team Name, Coach Name, Division\nSunset Select, Coach Davis, 6th Grade Boys\nBeaverton Blue, Coach Lee, 5th Grade Boys");
  }

  function merge() {
    if (!rows.length) return;
    const t: Tournament = JSON.parse(JSON.stringify(tournament));
    rows.forEach(r => {
      let div = t.divisions.find(d => norm(d.name) === norm(r.division));
      if (!div) {
        div = { id: makeId(), name: r.division, teams: [], pools: [], games: [], bracket: [], losersBracket: [], bracketGenerated: false };
        t.divisions.push(div);
      }
      const exists = div.teams.some(team => norm(team.name) === norm(r.teamName));
      if (!exists) div.teams.push({ id: makeId(), name: r.teamName, coachName: r.coach });
      // Ensure a pool exists to hold the team so pool-game generation works right away.
      if (div.pools.length === 0) div.pools.push({ id: makeId(), name: "Pool A", teamIds: [] });
      const pool = div.pools[0];
      const teamId = div.teams.find(team => norm(team.name) === norm(r.teamName))!.id;
      if (!pool.teamIds.includes(teamId)) pool.teamIds.push(teamId);
    });
    t.updatedAt = new Date().toISOString();
    onImport(t);
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="glass border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-white/10 flex-shrink-0">
          <div>
            <h2 className="text-white font-bold text-lg flex items-center gap-2">📋 Merge Registration Teams</h2>
            <p className="text-gray-500 text-xs mt-0.5">Paste team rows to auto-create divisions &amp; teams.</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1"><X className="w-5 h-5"/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <label className="text-gray-400 text-xs font-semibold">Paste CSV rows: Team Name, Coach Name, Division</label>
          <textarea value={raw} onChange={e=>setRaw(e.target.value)} rows={7}
            placeholder="Sunset Select, Coach Davis, 6th Grade Boys&#10;Beaverton Blue, Coach Lee, 5th Grade Boys"
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-600 text-sm font-mono focus:outline-none focus:border-blue-500"/>
          <button onClick={loadSample} className="text-xs text-blue-400 hover:text-blue-300 font-bold">Load sample rows</button>

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Preview {rows.length>0 && `(${rows.length})`}</p>
            {rows.length === 0
              ? <p className="text-gray-600 text-sm">No teams parsed yet.</p>
              : <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {rows.map((r,i) => {
                    const div = tournament.divisions.find(d => norm(d.name) === norm(r.division));
                    const dup = div?.teams.some(team => norm(team.name) === norm(r.teamName));
                    return (
                      <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${dup ? "border-white/5 opacity-50" : "border-white/10"}`}>
                        <div>
                          <span className="text-white font-bold">{r.teamName}</span>
                          <span className="text-gray-500 text-xs ml-2">Coach {r.coach}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${div ? "bg-green-500/10 text-green-400" : "bg-orange-500/10 text-orange-400"}`}>
                          {div ? r.division : `${r.division} (new)`}
                        </span>
                      </div>
                    );
                  })}
                </div>
            }
          </div>
          <p className="text-gray-600 text-xs leading-relaxed">New teams are added into each division&apos;s first pool. If you&apos;ve already split a division into multiple pools, move teams manually afterward.</p>
        </div>
        <div className="flex gap-3 p-5 border-t border-white/10 flex-shrink-0">
          <Btn onClick={onClose} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400">Cancel</Btn>
          <Btn onClick={merge} disabled={rows.length === 0}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white">
            Merge {rows.length > 0 ? `${rows.length} Team${rows.length!==1?"s":""}` : "Teams"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ── EDIT TOURNAMENT MODAL ─────────────────────────────────────────────────────

interface EditFields {
  name: string; date: string; startDate: string; endDate: string; venues: VenueConfig[];
  gameDuration: number; breakBetweenGames: number;
  startTime: string; bracketFormat: BracketFormat;
  gamesGuaranteed: number; tiebreaker: TiebreakerMethod;
  dayWindows: Record<string, { start: string; end: string }>;
}

function EditTournamentModal({ tournament, onSave, onClose }: {
  tournament: Tournament; onSave: (t: Tournament) => void; onClose: () => void;
}) {
  const [f, setF] = useState<EditFields>({
    name:             tournament.name,
    date:             tournament.date,
    startDate:        tournament.startDate ?? "",
    endDate:          tournament.endDate ?? "",
    venues:           tournament.venues?.length ? tournament.venues : [{ name: "Main Gym", courts: 2 }],
    gameDuration:     tournament.gameDuration,
    breakBetweenGames:tournament.breakBetweenGames,
    startTime:        tournament.startTime,
    bracketFormat:    tournament.bracketFormat ?? "single",
    gamesGuaranteed:  tournament.gamesGuaranteed ?? 3,
    tiebreaker:       tournament.tiebreaker ?? "point_diff",
    dayWindows:       tournament.dayWindows ?? {},
  });

  function save() {
    const updated: Tournament = {
      ...tournament,
      name:             f.name.trim() || tournament.name,
      date:             f.date,
      startDate:        f.startDate,
      endDate:          f.endDate,
      venues:           f.venues.filter(v => v.name.trim()),
      gameDuration:     f.gameDuration,
      breakBetweenGames:f.breakBetweenGames,
      startTime:        f.startTime,
      bracketFormat:    f.bracketFormat,
      gamesGuaranteed:  f.gamesGuaranteed,
      tiebreaker:       f.tiebreaker,
      dayWindows:       f.dayWindows,
      updatedAt:        new Date().toISOString(),
    };
    onSave(updated);
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="glass border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-white font-bold text-lg">Edit Tournament Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-5 space-y-5">
          <IF label="Tournament Name" value={f.name} onChange={v => setF(p=>({...p,name:v}))} />
          <div className="grid grid-cols-2 gap-3">
            <IF label="Start Date" type="date" value={f.startDate} onChange={v => setF(p=>{
              const endDate = (p.endDate && p.endDate < v) ? v : (p.endDate || v);
              return {...p, startDate:v, endDate, date: formatDateRange(v, endDate)};
            })} />
            <IF label="End Date" type="date" value={f.endDate} onChange={v => setF(p=>({...p, endDate:v, date: formatDateRange(p.startDate||v, v)}))} />
          </div>
          <DayWindowsEditor startDate={f.startDate} endDate={f.endDate} value={f.dayWindows} onChange={v=>setF(p=>({...p, dayWindows:v}))} defaultStart={f.startTime}/>
          <VenueEditor venues={f.venues} onChange={v => setF(p=>({...p,venues:v}))} />
          <div className="grid grid-cols-2 gap-3">
            <IF label="Games Guaranteed" type="number" min="1" value={f.gamesGuaranteed} onChange={v => setF(p=>({...p,gamesGuaranteed:+v}))} />
            <IF label="Game Duration (min)" type="number" min="10" value={f.gameDuration} onChange={v => setF(p=>({...p,gameDuration:+v}))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <IF label="Break Between Games (min)" type="number" min="0" value={f.breakBetweenGames} onChange={v => setF(p=>({...p,breakBetweenGames:+v}))} />
            <IF label="Start Time" type="time" value={f.startTime} onChange={v => setF(p=>({...p,startTime:v}))} />
          </div>
          <TiebreakerPicker value={f.tiebreaker} onChange={v => setF(p=>({...p,tiebreaker:v}))} />
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2.5 text-xs text-yellow-300">
            ⚠️ Changing game duration, break time, or start time will <strong>not</strong> automatically reschedule existing games.
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-white/10">
          <Btn onClick={onClose} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400">Cancel</Btn>
          <Btn onClick={save} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white">Save Changes</Btn>
        </div>
      </div>
    </div>
  );
}

// ── CREATE WIZARD ─────────────────────────────────────────────────────────────

type WizDiv = { name: string; pools: number; teams: string[]; format?: BracketFormat };
interface WizState {
  name: string; date: string; startDate: string; endDate: string; venues: VenueConfig[];
  gameDuration: number; breakBetweenGames: number; startTime: string;
  bracketFormat: BracketFormat; gamesGuaranteed: number; tiebreaker: TiebreakerMethod;
  divisions: WizDiv[];
  dayWindows: Record<string, { start: string; end: string }>;
}

function snakePools(teams: string[], poolCount: number): string[][] {
  const filled = teams.filter(t => t.trim());
  const pools: string[][] = Array.from({ length: poolCount }, () => []);
  filled.forEach((team, i) => {
    const row = Math.floor(i / poolCount);
    const col = i % poolCount;
    pools[row % 2 === 0 ? col : poolCount - 1 - col].push(team);
  });
  return pools;
}

function CreateWizard({ onCreated, onClose, contacts, tournaments }: {
  onCreated: (t: Tournament) => void; onClose: () => void;
  contacts: RegistrationContact[]; tournaments: TournamentConfig[];
}) {
  const [step, setStep] = useState(1);
  const [w, setW] = useState<WizState>({
    name: "", date: "", startDate: "", endDate: "", venues: [{ name: "Main Gym", courts: 2 }],
    gameDuration: 24, breakBetweenGames: 6, startTime: "08:00",
    bracketFormat: "single", gamesGuaranteed: 3, tiebreaker: "point_diff",
    divisions: [{ name: "", pools: 2, teams: ["","","","","","","",""] }],
    dayWindows: {},
  });

  const regMatches = matchingRegs(contacts, w.name);
  const regByDiv: Record<string, string[]> = {};
  regMatches.forEach(c => {
    const key = c.division?.trim() || "";
    if (!regByDiv[key]) regByDiv[key] = [];
    if (c.teamName?.trim() && !regByDiv[key].includes(c.teamName.trim())) regByDiv[key].push(c.teamName.trim());
  });

  function autoFillDivision(di: number, divName: string) {
    const matches = Object.entries(regByDiv).find(([k]) =>
      k.toLowerCase() === divName.toLowerCase() || divName.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(divName.toLowerCase())
    );
    const teams = matches ? matches[1] : [];
    if (!teams.length) return;
    setW(p => {
      const d = [...p.divisions];
      d[di] = { ...d[di], teams: [...teams, ...Array(Math.max(0, 8 - teams.length)).fill("")] };
      return { ...p, divisions: d };
    });
  }

  function generate() {
    const tid = makeId(); const now = new Date().toISOString();
    const safeVenues = w.venues.filter(v => v.name.trim()).length > 0
      ? w.venues.filter(v => v.name.trim())
      : [{ name: "Main Gym", courts: 2 }];
    const divisions: Division[] = w.divisions.map(d => {
      const divId = makeId();
      const poolTeamNames = snakePools(d.teams, d.pools);
      let tIdx = 0;
      const allTeams: Team[] = poolTeamNames.flatMap(names => names.map(name => ({ id: makeId(), name, coachName: "" })));
      tIdx = 0;
      const pools: Pool[] = poolTeamNames.map((names, pi) => {
        const poolId = makeId();
        const teamIds = names.map(() => allTeams[tIdx++].id);
        return { id: poolId, name: `Pool ${String.fromCharCode(65+pi)}`, teamIds };
      });
      // Games start UNSCHEDULED — drag them onto the day/court grid in the Scheduler tab to assign a slot.
      const games: PoolGame[] = buildUnscheduledPoolGames(pools, divId);
      return { id: divId, name: d.name, teams: allTeams, pools, games, bracket: [], losersBracket: [], bracketGenerated: false, format: d.format };
    });
    const t: Tournament = {
      id: tid, name: w.name, date: w.date, startDate: w.startDate, endDate: w.endDate, venues: safeVenues,
      gameDuration: w.gameDuration, breakBetweenGames: w.breakBetweenGames,
      startTime: w.startTime, bracketFormat: w.bracketFormat,
      gamesGuaranteed: w.gamesGuaranteed, tiebreaker: w.tiebreaker,
      status: "pool_play", divisions, createdAt: now, updatedAt: now,
      dayWindows: w.dayWindows,
    };
    saveTournament(t); onCreated(t);
  }

  const canNext1 = w.name.trim().length > 0;
  const canNext2 = w.divisions.every(d => d.name.trim() && d.teams.filter(t=>t.trim()).length >= 2);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="glass border border-white/10 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h2 className="text-white font-bold text-lg">New Tournament</h2>
            <p className="text-gray-500 text-xs mt-0.5">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1"><X className="w-5 h-5"/></button>
        </div>

        <div className="p-5 space-y-5">
          {step === 1 && <>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Tournament Name *</label>
              {tournaments.length > 0 ? (
                <>
                  <select
                    value={tournaments.find(tc => tc.name === w.name) ? w.name : (w.name ? "__custom__" : "")}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === "" ) { setW(p => ({ ...p, name: "" })); return; }
                      if (val === "__custom__") { setW(p => ({ ...p, name: p.name === "" ? "" : p.name })); return; }
                      const tc = tournaments.find(t => t.name === val);
                      if (!tc) return;
                      // auto-fill from TournamentConfig
                      const fmt = tc.format?.toLowerCase() ?? "";
                      const bracketFormat: BracketFormat =
                        fmt.includes("double") ? "double" :
                        (fmt.includes("pool") || fmt.includes("none")) ? "none" : "single";
                      const gamesGuaranteed = parseInt(tc.gamesGuaranteed) || 3;
                      const venues: VenueConfig[] = tc.venue?.trim()
                        ? [{ name: tc.venue.trim(), courts: 2 }]
                        : [{ name: "Main Gym", courts: 2 }];
                      const divisions: WizDiv[] = tc.divisions?.length > 0
                        ? tc.divisions.map(name => ({ name, pools: 2, teams: ["","","","","","","",""] }))
                        : [{ name: "", pools: 2, teams: ["","","","","","","",""] }];
                      setW(p => ({
                        ...p,
                        name: tc.name,
                        date: tc.dates || p.date,
                        venues,
                        gamesGuaranteed,
                        bracketFormat,
                        divisions,
                      }));
                    }}
                    className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500/60"
                  >
                    <option value="" className="bg-slate-900">— Select a tournament —</option>
                    {tournaments.map(tc => (
                      <option key={tc.id} value={tc.name} className="bg-slate-900">{tc.name}</option>
                    ))}
                    <option value="__custom__" className="bg-slate-900">Other / Custom name…</option>
                  </select>
                  {/* Show text input when "Other / Custom" is chosen or no list match */}
                  {(w.name && !tournaments.find(tc => tc.name === w.name)) && (
                    <input
                      value={w.name}
                      onChange={e => setW(p => ({ ...p, name: e.target.value }))}
                      placeholder="Enter custom tournament name"
                      className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500/60 placeholder:text-gray-600"
                    />
                  )}
                </>
              ) : (
                <input
                  value={w.name}
                  onChange={e => setW(p => ({ ...p, name: e.target.value }))}
                  placeholder="Hilhi Spring Invitational"
                  className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500/60 placeholder:text-gray-600"
                />
              )}
            </div>
            {w.name.trim().length > 2 && regMatches.length > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2.5 text-sm">
                <div className="text-yellow-300 font-bold">📋 {regMatches.length} registration{regMatches.length!==1?"s":""} found</div>
                <div className="text-yellow-400/70 text-xs mt-0.5">Teams can be auto-filled from registrations in Step 2</div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <IF label="Start Date" type="date" value={w.startDate} onChange={v=>setW(p=>{
                const endDate = (p.endDate && p.endDate < v) ? v : (p.endDate || v);
                return {...p, startDate:v, endDate, date: formatDateRange(v, endDate)};
              })} />
              <IF label="End Date" type="date" value={w.endDate} onChange={v=>setW(p=>({...p, endDate:v, date: formatDateRange(p.startDate||v, v)}))} />
            </div>
            <DayWindowsEditor startDate={w.startDate} endDate={w.endDate} value={w.dayWindows} onChange={v=>setW(p=>({...p, dayWindows:v}))} defaultStart={w.startTime}/>
            <VenueEditor venues={w.venues} onChange={v=>setW(p=>({...p,venues:v}))} />
            <div className="grid grid-cols-2 gap-3">
              <IF label="Games Guaranteed" type="number" min="1" value={w.gamesGuaranteed} onChange={v=>setW(p=>({...p,gamesGuaranteed:+v}))} />
              <IF label="Game Duration (min)" type="number" value={w.gameDuration} onChange={v=>setW(p=>({...p,gameDuration:+v}))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <IF label="Break Between (min)" type="number" value={w.breakBetweenGames} onChange={v=>setW(p=>({...p,breakBetweenGames:+v}))} />
              <IF label="Start Time" type="time" value={w.startTime} onChange={v=>setW(p=>({...p,startTime:v}))} />
            </div>
            <TiebreakerPicker value={w.tiebreaker} onChange={v=>setW(p=>({...p,tiebreaker:v}))} />
          </>}

          {step === 2 && (
            <div className="space-y-5">
              {regMatches.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2.5 text-xs text-yellow-300">
                  📋 <strong>{regMatches.length} registered teams</strong> — use &quot;Fill from Registrations&quot; buttons to auto-populate
                </div>
              )}
              {w.divisions.map((div, di) => {
                const hasRegForDiv = div.name.trim() && Object.keys(regByDiv).some(k =>
                  k.toLowerCase() === div.name.toLowerCase() ||
                  div.name.toLowerCase().includes(k.toLowerCase()) ||
                  k.toLowerCase().includes(div.name.toLowerCase())
                );
                return (
                  <div key={di} className="border border-white/10 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Division Name *</label>
                          <DivisionPresetPicker onSelect={name => setW(p=>{const d=[...p.divisions];d[di]={...d[di],name};return{...p,divisions:d};})}/>
                        </div>
                        <input value={div.name}
                          onChange={e=>setW(p=>{const d=[...p.divisions];d[di]={...d[di],name:e.target.value};return{...p,divisions:d};})}
                          placeholder="e.g. 5th Grade Boys Competitive"
                          className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500/60 placeholder:text-gray-600" />
                      </div>
                      <div className="w-28 flex-shrink-0">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Pools</label>
                        <select value={div.pools} onChange={e=>setW(p=>{const d=[...p.divisions];d[di]={...d[di],pools:+e.target.value};return{...p,divisions:d};})}
                          className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none">
                          {[1,2,3,4].map(n=><option key={n} value={n} className="bg-slate-900">{n} Pool{n>1?"s":""}</option>)}
                        </select>
                      </div>
                      <div className="w-40 flex-shrink-0">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Play Format</label>
                        <select value={div.format ?? ""} onChange={e=>setW(p=>{const d=[...p.divisions];d[di]={...d[di],format:(e.target.value || undefined) as BracketFormat|undefined};return{...p,divisions:d};})}
                          className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none">
                          <option value="" className="bg-slate-900">Tournament Default</option>
                          <option value="none" className="bg-slate-900">Pool Play Only</option>
                          <option value="single" className="bg-slate-900">Pool → Single Elim</option>
                          <option value="double" className="bg-slate-900">Pool → Double Elim</option>
                        </select>
                      </div>
                      {w.divisions.length > 1 && (
                        <button onClick={()=>setW(p=>({...p,divisions:p.divisions.filter((_,i)=>i!==di)}))} className="text-gray-600 hover:text-red-400 transition-colors mt-6">
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      )}
                    </div>
                    {hasRegForDiv && (
                      <button onClick={() => autoFillDivision(di, div.name)}
                        className="w-full py-2 border border-yellow-500/30 hover:border-yellow-500/60 bg-yellow-500/5 hover:bg-yellow-500/10 text-yellow-400 text-xs font-bold rounded-lg transition-all">
                        📋 Fill from Registrations — import team names
                      </button>
                    )}
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Team Names</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {div.teams.map((tm, ti) => (
                          <input key={ti} value={tm} placeholder={`Team ${ti+1}`}
                            onChange={e=>setW(p=>{const d=[...p.divisions];const teams=[...d[di].teams];teams[ti]=e.target.value;if(ti===teams.length-1&&e.target.value.trim())teams.push("");d[di]={...d[di],teams};return{...p,divisions:d};})}
                            className="bg-white/5 border border-white/10 text-white text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-blue-500/60 placeholder:text-gray-700" />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
              <button onClick={()=>setW(p=>({...p,divisions:[...p.divisions,{name:"",pools:2,teams:["","","","","","","",""]}]}))}
                className="w-full py-2.5 border border-dashed border-white/20 hover:border-blue-500/40 text-gray-500 hover:text-blue-400 rounded-xl text-sm font-bold transition-colors">
                + Add Division
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3 text-sm">
              <div className="glass border border-white/10 rounded-xl p-4 space-y-2">
                <p className="text-white font-bold text-base">{w.name||"—"}</p>
                {w.date && <p className="text-gray-400 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/>{w.date}</p>}
                <p className="text-gray-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5"/>
                  {venueLabel(w.venues)}
                </p>
                <p className="text-gray-400">{totalCourts(w.venues)} courts · {w.gameDuration}min games · {w.gamesGuaranteed} guaranteed · starts {w.startTime}</p>
                <p className="text-gray-400">Tiebreaker: {w.tiebreaker==="point_diff"?"Point Differential":"Least Points Allowed"}</p>
              </div>
              {w.divisions.map((d,di) => {
                const filled = d.teams.filter(t=>t.trim());
                return (
                  <div key={di} className="glass border border-white/10 rounded-xl p-4">
                    <p className="text-white font-bold">{d.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{filled.length} teams · {d.pools} pool{d.pools>1?"s":""} · {d.format==="double"?"Pool → Double Elim":d.format==="none"?"Pool Play Only":"Pool → Single Elim"}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {filled.map((tm,ti)=><span key={ti} className="bg-white/5 border border-white/10 text-gray-300 text-xs px-2 py-0.5 rounded-md">{tm}</span>)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-5 border-t border-white/10">
          <Btn onClick={()=>step>1?setStep(s=>s-1):onClose()} className="bg-white/5 hover:bg-white/10 text-gray-400">
            {step>1?"← Back":"Cancel"}
          </Btn>
          <div className="flex gap-1.5">{[1,2,3].map(n=><div key={n} className={`w-2 h-2 rounded-full ${step===n?"bg-blue-500":"bg-white/15"}`}/>)}</div>
          {step < 3
            ? <Btn onClick={()=>setStep(s=>s+1)} disabled={step===1?!canNext1:!canNext2} className="bg-blue-600 hover:bg-blue-500 text-white">Next →</Btn>
            : <Btn onClick={generate} className="bg-green-600 hover:bg-green-500 text-white">🚀 Generate Schedule</Btn>
          }
        </div>
      </div>
    </div>
  );
}

// ── SCORE DIALOG ─────────────────────────────────────────────────────────────

function ScoreDialog({ game, teamA, teamB, onSave, onClose }: {
  game: PoolGame|BracketGame; teamA: string; teamB: string;
  onSave: (s1:number, s2:number) => void; onClose: () => void;
}) {
  const [s1, setS1] = useState(String(game.score1 ?? ""));
  const [s2, setS2] = useState(String(game.score2 ?? ""));
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="glass border border-white/10 rounded-2xl p-6 w-full max-w-sm">
        <h3 className="text-white font-bold mb-4 text-center">Enter Score</h3>
        <div className="grid grid-cols-3 items-center gap-3 mb-6">
          <div className="text-center">
            <div className="text-gray-300 text-xs mb-2 font-bold truncate">{teamA}</div>
            <input type="number" min="0" value={s1} onChange={e=>setS1(e.target.value)}
              className="w-full bg-white/5 border border-white/20 text-white text-center text-2xl font-black py-3 rounded-xl focus:outline-none focus:border-blue-500/60"/>
          </div>
          <div className="text-center text-gray-600 font-bold">vs</div>
          <div className="text-center">
            <div className="text-gray-300 text-xs mb-2 font-bold truncate">{teamB}</div>
            <input type="number" min="0" value={s2} onChange={e=>setS2(e.target.value)}
              className="w-full bg-white/5 border border-white/20 text-white text-center text-2xl font-black py-3 rounded-xl focus:outline-none focus:border-blue-500/60"/>
          </div>
        </div>
        <div className="flex gap-3">
          <Btn onClick={onClose} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400">Cancel</Btn>
          <Btn onClick={()=>onSave(parseInt(s1)||0, parseInt(s2)||0)} disabled={s1===""||s2===""}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white">Save Score</Btn>
        </div>
      </div>
    </div>
  );
}

// ── SCHEDULE VIEW ─────────────────────────────────────────────────────────────

function conflictKey(divIdx: number, gameIdx: number) { return `${divIdx}-${gameIdx}`; }

/**
 * Find which games (by divIdx/gameIdx) conflict at the same day+time slot — either because
 * the same TEAM is double-booked, or because the same COACH is double-booked across two
 * different teams (common when one coach runs multiple teams). Coach conflicts apply even
 * across different courts and different divisions, since a coach can only be on one court.
 */
function fmtConflictDay(day: string): string {
  if (!day) return "";
  return new Date(day + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) + " ";
}

/**
 * Find every team/coach double-booking across the WHOLE tournament (every division, not just
 * the one currently shown in the filter) — this is what catches a coach running teams in two
 * different divisions. Returns both a highlight Set (for bordering game cards) and a plain-English
 * list of exactly which games/teams/times collide, so it's visible even when filtered to one division.
 */
function computeScheduleConflicts(tournament: Tournament): { keys: Set<string>; details: string[] } {
  type Entry = {
    divIdx: number; gameIdx: number; divName: string; team1: string; team2: string;
    teamIds: string[]; coachNames: string[]; teamNames: string[]; noOverlapRequests: string[];
  };
  const byDayTime = new Map<string, Entry[]>();
  tournament.divisions.forEach((d, divIdx) => {
    const teamById = new Map(d.teams.map(t => [t.id, t]));
    d.games.forEach((g, gameIdx) => {
      if (!g.time) return; // unscheduled — can't conflict
      const key = `${g.date || ""}|${g.time}`;
      const arr = byDayTime.get(key) ?? [];
      const coachNames = [g.team1Id, g.team2Id]
        .map(id => teamById.get(id)?.coachName?.trim().toLowerCase())
        .filter((c): c is string => !!c);
      const teamNames = [g.team1Id, g.team2Id].map(id => teamById.get(id)?.name ?? "?");
      const noOverlapRequests = [g.team1Id, g.team2Id]
        .map(id => teamById.get(id)?.noOverlapWithTeam?.trim().toLowerCase())
        .filter((r): r is string => !!r);
      arr.push({
        divIdx, gameIdx, divName: d.name,
        team1: teamById.get(g.team1Id)?.name ?? "?", team2: teamById.get(g.team2Id)?.name ?? "?",
        teamIds: [g.team1Id, g.team2Id], coachNames, teamNames, noOverlapRequests,
      });
      byDayTime.set(key, arr);
    });
  });

  const keys = new Set<string>();
  const details: string[] = [];

  for (const [dayTimeKey, entries] of byDayTime.entries()) {
    const [day, time] = dayTimeKey.split("|");
    const whenLabel = `${fmtConflictDay(day)}${formatTime12(time)}`;
    const seenTeam = new Map<string, Entry>();
    const seenCoach = new Map<string, Entry>();
    for (const e of entries) {
      const k = conflictKey(e.divIdx, e.gameIdx);
      for (const teamId of e.teamIds) {
        const teamName = teamId === (e.teamIds[0]) ? e.team1 : e.team2;
        const prior = seenTeam.get(teamId);
        if (prior) {
          keys.add(k); keys.add(conflictKey(prior.divIdx, prior.gameIdx));
          details.push(`⏰ ${whenLabel} — ${teamName} is scheduled for two games at once (${prior.divName}: ${prior.team1} vs ${prior.team2} · ${e.divName}: ${e.team1} vs ${e.team2})`);
        } else {
          seenTeam.set(teamId, e);
        }
      }
      for (const coach of e.coachNames) {
        const prior = seenCoach.get(coach);
        if (prior) {
          keys.add(k); keys.add(conflictKey(prior.divIdx, prior.gameIdx));
          details.push(`⏰ ${whenLabel} — coach is double-booked across divisions: ${prior.divName} (${prior.team1} vs ${prior.team2}) and ${e.divName} (${e.team1} vs ${e.team2})`);
        } else {
          seenCoach.set(coach, e);
        }
      }
    }

    // "Can't play at the same time as another team" requests — check every pair of entries in this slot.
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const a = entries[i]; const b = entries[j];
        const aWantsB = a.noOverlapRequests.some(r => b.teamNames.some(n => n.toLowerCase() === r));
        const bWantsA = b.noOverlapRequests.some(r => a.teamNames.some(n => n.toLowerCase() === r));
        if (aWantsB || bWantsA) {
          keys.add(conflictKey(a.divIdx, a.gameIdx)); keys.add(conflictKey(b.divIdx, b.gameIdx));
          details.push(`⏰ ${whenLabel} — requested no-overlap conflict: ${a.divName} (${a.team1} vs ${a.team2}) and ${b.divName} (${b.team1} vs ${b.team2})`);
        }
      }
    }
  }

  return { keys, details };
}

/** Games scheduled outside a team's requested "can't play before/after" window. */
function computeTimeViolations(tournament: Tournament): { divIdx: number; gameIdx: number; message: string }[] {
  const violations: { divIdx: number; gameIdx: number; message: string }[] = [];
  tournament.divisions.forEach((d, divIdx) => {
    const teamById = new Map(d.teams.map(t => [t.id, t]));
    d.games.forEach((g, gameIdx) => {
      if (!g.time) return;
      [g.team1Id, g.team2Id].forEach(teamId => {
        const team = teamById.get(teamId);
        if (!team) return;
        if (team.noPlayBefore && g.time < team.noPlayBefore) {
          violations.push({ divIdx, gameIdx, message: `${team.name} can't play before ${formatTime12(team.noPlayBefore)} (scheduled ${formatTime12(g.time)})` });
        }
        if (team.noPlayAfter && g.time > team.noPlayAfter) {
          violations.push({ divIdx, gameIdx, message: `${team.name} can't play after ${formatTime12(team.noPlayAfter)} (scheduled ${formatTime12(g.time)})` });
        }
      });
    });
  });
  return violations;
}

/** Teams playing more games than the tournament's guarantee — surfaced as a warning. */
function computeGameOverage(tournament: Tournament): { divName: string; teamName: string; count: number }[] {
  const guarantee = tournament.gamesGuaranteed || 3;
  const overage: { divName: string; teamName: string; count: number }[] = [];
  tournament.divisions.forEach(div => {
    const counts = new Map<string, number>();
    div.games.forEach(g => {
      counts.set(g.team1Id, (counts.get(g.team1Id) ?? 0) + 1);
      counts.set(g.team2Id, (counts.get(g.team2Id) ?? 0) + 1);
    });
    div.teams.forEach(team => {
      const count = counts.get(team.id) ?? 0;
      if (count > guarantee) overage.push({ divName: div.name, teamName: team.name, count });
    });
  });
  return overage;
}

function ScheduleView({ tournament, onUpdate }: { tournament: Tournament; onUpdate: (t: Tournament) => void }) {
  const [scoring, setScoring] = useState<{ divIdx: number; gameIdx: number }|null>(null);
  const [dragOverKey, setDragOverKey] = useState<string|null>(null);
  const [selectedDiv, setSelectedDiv] = useState<string>("all");

  const guarantee = tournament.gamesGuaranteed || 3;
  const overage = computeGameOverage(tournament);
  const { keys: conflicts, details: conflictDetails } = computeScheduleConflicts(tournament);
  const timeViolations = computeTimeViolations(tournament);
  const timeViolationKeys = new Set(timeViolations.map(v => conflictKey(v.divIdx, v.gameIdx)));
  const courts = totalCourts(tournament.venues ?? []);
  const courtNums = Array.from({length: Math.max(courts,1)}, (_,i)=>i+1);
  const multiVenue = (tournament.venues?.length ?? 0) > 1;

  const allEntries = tournament.divisions.flatMap((d,di) =>
    d.games.map((g,gi) => ({ game: g, divIdx: di, gameIdx: gi, divName: d.name }))
  ).filter(e => selectedDiv === "all" || e.divIdx === Number(selectedDiv));

  const unscheduled = allEntries.filter(e => !e.game.time);
  const scheduled    = allEntries.filter(e => !!e.game.time);

  // Days: use the tournament's date range if set; otherwise fall back to a single unlabeled day.
  const days = buildTournamentDates(tournament.startDate, tournament.endDate);
  const dayKeys = days.length > 0 ? days : [""];

  function slotsForDay(day: string): string[] {
    const win = tournament.dayWindows?.[day];
    if (win) return buildDayTimeSlots(win.start, win.end, tournament.gameDuration, tournament.breakBetweenGames);
    // No window configured for this day — fall back to a reasonable default range from the tournament start time.
    return buildDayTimeSlots(tournament.startTime || "08:00", "20:00", tournament.gameDuration, tournament.breakBetweenGames);
  }

  const gameAt = (day: string, time: string, court: number) =>
    scheduled.find(g => (g.game.date || "") === day && g.game.time === time && g.game.court === court);

  function handleScore(s1: number, s2: number) {
    if (!scoring) return;
    const t = JSON.parse(JSON.stringify(tournament)) as Tournament;
    const g = t.divisions[scoring.divIdx].games[scoring.gameIdx];
    g.score1=s1; g.score2=s2; g.status="completed";
    t.updatedAt = new Date().toISOString();
    onUpdate(t); setScoring(null);
  }

  function toggleExcludeTeam(divIdx: number, gameIdx: number, teamId: string) {
    const t = JSON.parse(JSON.stringify(tournament)) as Tournament;
    const g = t.divisions[divIdx].games[gameIdx];
    const excluded = new Set(g.excludedTeamIds ?? []);
    if (excluded.has(teamId)) excluded.delete(teamId); else excluded.add(teamId);
    g.excludedTeamIds = [...excluded];
    t.updatedAt = new Date().toISOString();
    onUpdate(t);
  }

  function deleteGame(divIdx: number, gameIdx: number) {
    if (!confirm("Delete this game? This can't be undone.")) return;
    const t = JSON.parse(JSON.stringify(tournament)) as Tournament;
    t.divisions[divIdx].games.splice(gameIdx, 1);
    t.updatedAt = new Date().toISOString();
    onUpdate(t);
  }

  /** Delete every game scheduled at this exact day+time across ALL divisions/courts — a full reset for that slot. */
  function deleteGamesAtSlot(day: string, time: string) {
    const count = tournament.divisions.reduce((n, d) => n + d.games.filter(g => g.time === time && (g.date || "") === day).length, 0);
    if (count === 0) return;
    if (!confirm(`Delete all ${count} game${count!==1?"s":""} scheduled at ${formatTime12(time)}${day?` on ${fmtConflictDay(day)}`:""}? This can't be undone.`)) return;
    const t = JSON.parse(JSON.stringify(tournament)) as Tournament;
    t.divisions.forEach(d => { d.games = d.games.filter(g => !(g.time === time && (g.date || "") === day)); });
    t.updatedAt = new Date().toISOString();
    onUpdate(t);
  }

  function handleDrop(e: React.DragEvent, day: string, time: string, court: number) {
    e.preventDefault();
    setDragOverKey(null);
    let src: { divIdx: number; gameIdx: number };
    try { src = JSON.parse(e.dataTransfer.getData("text/plain")); } catch { return; }
    const dest = gameAt(day, time, court);
    if (dest && dest.divIdx === src.divIdx && dest.gameIdx === src.gameIdx) return; // dropped on itself

    const t = JSON.parse(JSON.stringify(tournament)) as Tournament;
    const srcGame = t.divisions[src.divIdx].games[src.gameIdx];
    const venue = courtToVenueName(court, t.venues ?? []);

    if (dest) {
      // Swap the two games' slots
      const destGame = t.divisions[dest.divIdx].games[dest.gameIdx];
      const srcSlot = { time: srcGame.time, court: srcGame.court, venue: srcGame.venue, timeSlot: srcGame.timeSlot, date: srcGame.date };
      srcGame.time = destGame.time; srcGame.court = destGame.court; srcGame.venue = destGame.venue; srcGame.timeSlot = destGame.timeSlot; srcGame.date = destGame.date;
      destGame.time = srcSlot.time; destGame.court = srcSlot.court; destGame.venue = srcSlot.venue; destGame.timeSlot = srcSlot.timeSlot; destGame.date = srcSlot.date;
    } else {
      // Move into an empty slot (also handles placing an unscheduled game for the first time)
      srcGame.time = time; srcGame.court = court; srcGame.venue = venue; srcGame.date = day;
    }
    t.updatedAt = new Date().toISOString();
    onUpdate(t);
  }

  function handleDropToUnscheduled(e: React.DragEvent) {
    e.preventDefault();
    setDragOverKey(null);
    let src: { divIdx: number; gameIdx: number };
    try { src = JSON.parse(e.dataTransfer.getData("text/plain")); } catch { return; }
    const t = JSON.parse(JSON.stringify(tournament)) as Tournament;
    const g = t.divisions[src.divIdx].games[src.gameIdx];
    g.time = ""; g.court = 0; g.venue = ""; g.date = ""; g.timeSlot = -1;
    t.updatedAt = new Date().toISOString();
    onUpdate(t);
  }

  const [teamSlotDragOver, setTeamSlotDragOver] = useState<string|null>(null);

  /** Remove a team from a game slot, leaving it empty ("TBD") so a different team can be dragged in. */
  function clearGameTeamSlot(divIdx: number, gameIdx: number, slot: "team1Id"|"team2Id") {
    const t = JSON.parse(JSON.stringify(tournament)) as Tournament;
    const g = t.divisions[divIdx].games[gameIdx];
    g[slot] = "";
    g.excludedTeamIds = (g.excludedTeamIds ?? []).filter(id => id !== (entryTeamId(g, slot)));
    t.updatedAt = new Date().toISOString();
    onUpdate(t);
  }
  function entryTeamId(g: PoolGame, slot: "team1Id"|"team2Id") { return g[slot]; }

  /** Drop a team (dragged from the roster, or from another game's slot) into an empty/occupied game slot.
   *  This COPIES the team in — dragging a team out of one game to fill another slot leaves them in
   *  their original game too (e.g. so a team can pick up an extra/overage game without losing their
   *  regular one). Use the ✕ button on a slot if you actually want to remove a team from a game. */
  function dropTeamIntoSlot(divIdx: number, gameIdx: number, slot: "team1Id"|"team2Id", e: React.DragEvent) {
    e.preventDefault(); e.stopPropagation();
    setTeamSlotDragOver(null);
    let data: { teamId: string; fromDivId?: string; fromGame?: { divIdx: number; gameIdx: number; slot: "team1Id"|"team2Id" } };
    try { data = JSON.parse(e.dataTransfer.getData("text/plain")); } catch { return; }
    if (!data.teamId) return;

    const t = JSON.parse(JSON.stringify(tournament)) as Tournament;
    const div = t.divisions[divIdx];
    // Only allow teams that belong to THIS division's roster — keeps pools/standings coherent.
    if (!div.teams.some(tm => tm.id === data.teamId)) { alert("That team isn't in this category — move it to this category first (Teams tab) before scheduling it here."); return; }

    const g = t.divisions[divIdx].games[gameIdx];
    const otherSlot = slot === "team1Id" ? "team2Id" : "team1Id";
    if (g[otherSlot] === data.teamId) { alert("A team can't play itself."); return; }

    g[slot] = data.teamId;
    t.updatedAt = new Date().toISOString();
    onUpdate(t);
  }

  function GameCard({ entry, conflicted, isOver }: { entry: typeof allEntries[number]; conflicted: boolean; isOver: boolean }) {
    const { game, divIdx, gameIdx, divName } = entry;
    const t1 = getTeamName(tournament, game.team1Id);
    const t2 = getTeamName(tournament, game.team2Id);
    const done = game.status==="completed";
    const poolName = tournament.divisions[divIdx].pools.find(p=>p.id===game.poolId)?.name ?? "";
    const timeViolated = timeViolationKeys.has(conflictKey(divIdx, gameIdx));
    const excluded = new Set(game.excludedTeamIds ?? []);
    const anyExcluded = excluded.size > 0;
    const slotKey = (slot: "team1Id"|"team2Id") => `${divIdx}-${gameIdx}-${slot}`;
    return (
      <div
        draggable
        onDragStart={e=>e.dataTransfer.setData("text/plain", JSON.stringify({divIdx,gameIdx}))}
        className={`glass border rounded-xl p-3 cursor-grab active:cursor-grabbing transition-colors ${
          conflicted ? "border-red-500/60 bg-red-500/5" : timeViolated ? "border-orange-500/60 bg-orange-500/5" : isOver ? "border-blue-500/60" : anyExcluded ? "border-yellow-500/30" : "border-white/10 hover:border-white/20"
        }`}
      >
        <div className="flex items-center justify-between gap-1 mb-1">
          <div className="flex items-center gap-2 text-[11px] text-gray-600 truncate">
            <span>{divName}</span>{poolName&&<><span>·</span><span>{poolName}</span></>}
            {timeViolated && <span className="text-orange-400 font-bold">· ⏰</span>}
          </div>
          <button onClick={()=>deleteGame(divIdx,gameIdx)} title="Delete this game" className="text-gray-700 hover:text-red-400 transition-colors flex-shrink-0">
            <Trash2 className="w-3 h-3"/>
          </button>
        </div>
        {(["team1Id","team2Id"] as const).map(slot => {
          const teamId = game[slot];
          const name = slot === "team1Id" ? t1 : t2;
          const score = slot === "team1Id" ? game.score1 : game.score2;
          const winning = done && (slot === "team1Id" ? game.score1! > game.score2! : game.score2! > game.score1!);
          const isDragOver = teamSlotDragOver === slotKey(slot);
          return (
            <div key={slot}
              onDragOver={e=>{ e.preventDefault(); e.stopPropagation(); setTeamSlotDragOver(slotKey(slot)); }}
              onDragLeave={()=>setTeamSlotDragOver(k=>k===slotKey(slot)?null:k)}
              onDrop={e=>dropTeamIntoSlot(divIdx, gameIdx, slot, e)}
              className={`flex items-center justify-between gap-1 rounded-lg px-1 -mx-1 transition-colors ${isDragOver ? "bg-blue-500/20 ring-1 ring-blue-500/60" : ""}`}
              title="Drop a team here (drag from another game's slot) to assign them to this extra game — they'll stay in their original game too."
            >
              <label className="flex items-center gap-1 flex-1 min-w-0 cursor-pointer">
                <input type="checkbox" checked={excluded.has(teamId)} disabled={!teamId} onChange={()=>toggleExcludeTeam(divIdx,gameIdx,teamId)} className="w-3 h-3 accent-yellow-500 flex-shrink-0"
                  title="Doesn't count toward this team's standings (e.g. an extra game beyond their guarantee)" />
                {teamId && (
                  <span draggable
                    onDragStart={e=>{ e.stopPropagation(); e.dataTransfer.setData("text/plain", JSON.stringify({ teamId, fromGame: { divIdx, gameIdx, slot } })); }}
                    className={`font-bold text-xs truncate cursor-grab active:cursor-grabbing ${excluded.has(teamId) ? "text-yellow-500/70 line-through" : winning ? "text-white" : "text-gray-300"}`}
                    title="Drag this team onto another game's slot to add them there too (they stay in this game as well) — use the ✕ if you want to remove them from a game instead.">
                    {name}
                  </span>
                )}
                {!teamId && <span className="font-bold text-xs truncate text-gray-700 italic">— drop a team here —</span>}
              </label>
              {done && teamId && <span className="text-gray-500 font-black text-[10px] bg-white/5 px-1.5 py-0.5 rounded shrink-0">{score}</span>}
              {teamId && (
                <button onClick={()=>clearGameTeamSlot(divIdx,gameIdx,slot)} title="Remove this team from the game so you can drag a different one in"
                  className="text-gray-700 hover:text-red-400 transition-colors flex-shrink-0">
                  <X className="w-3 h-3"/>
                </button>
              )}
            </div>
          );
        })}
        <button onClick={()=>setScoring({divIdx,gameIdx})}
          className={`mt-1.5 w-full text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${done?"bg-white/5 text-gray-500 hover:text-blue-400":"bg-blue-600/20 text-blue-400 hover:bg-blue-600/30"}`}>
          {done?"Edit Score":"Score →"}
        </button>
      </div>
    );
  }

  if (allEntries.length === 0) return <div className="text-center py-12 text-gray-500">No games yet — generate pool games for a division first.</div>;

  return (
    <div className="space-y-4">
      {tournament.divisions.length > 1 && (
        <select value={selectedDiv} onChange={e=>setSelectedDiv(e.target.value)}
          className="bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none">
          <option value="all" className="bg-slate-900">All Divisions</option>
          {tournament.divisions.map((d,i) => <option key={d.id} value={i} className="bg-slate-900">{d.name}</option>)}
        </select>
      )}

      <div className={`rounded-xl px-4 py-3 text-sm border ${conflicts.size>0?"bg-red-500/10 border-red-500/30 text-red-300":"bg-green-500/10 border-green-500/30 text-green-300"}`}>
        {conflicts.size>0 ? (
          <>
            <p className="font-bold mb-1">⚠️ {conflictDetails.length} scheduling conflict{conflictDetails.length!==1?"s":""} found — including across other categories (e.g. one coach running two teams in different divisions):</p>
            <ul className="text-xs space-y-1">
              {conflictDetails.map((msg,i) => <li key={i}>{msg}</li>)}
            </ul>
            <p className="text-xs mt-1.5 text-red-400/70">Drag a game to an open slot to fix it, or use the clear-time buttons below to reset a slot and start over.</p>
          </>
        ) : "✓ Schedule looks good — no team or coach is double-booked."}
      </div>

      {timeViolations.length > 0 && (
        <div className="rounded-xl px-4 py-3 text-sm border bg-orange-500/10 border-orange-500/30 text-orange-300">
          <p className="font-bold mb-1">⏰ {timeViolations.length} game{timeViolations.length!==1?"s":""} violate a team's scheduling request:</p>
          <ul className="text-xs space-y-0.5">
            {timeViolations.map((v,i) => <li key={i}>· {v.message}</li>)}
          </ul>
        </div>
      )}

      {overage.length > 0 && (
        <div className="rounded-xl px-4 py-3 text-sm border bg-yellow-500/10 border-yellow-500/30 text-yellow-300">
          <p className="font-bold mb-1">⚠️ {overage.length} team{overage.length!==1?"s are":" is"} playing more than {guarantee} guaranteed games:</p>
          <ul className="text-xs space-y-0.5">
            {overage.map((o,i) => <li key={i}>· {o.teamName} ({o.divName}) — {o.count} games</li>)}
          </ul>
          <p className="text-xs mt-1.5 text-yellow-400/70">Check "doesn't count" on the extra game(s) below if they shouldn't affect standings.</p>
        </div>
      )}

      <p className="text-xs text-gray-600">Drag any game card onto another slot to reschedule it — swaps if the slot is occupied, or drop it back into "Unscheduled Games" to pull it off the board.</p>

      {/* Unscheduled games queue */}
      <div
        onDragOver={e=>{e.preventDefault(); setDragOverKey("unscheduled");}}
        onDragLeave={()=>setDragOverKey(k=>k==="unscheduled"?null:k)}
        onDrop={handleDropToUnscheduled}
        className={`rounded-xl border-2 border-dashed p-3 transition-colors ${dragOverKey==="unscheduled"?"border-blue-500 bg-blue-500/10":"border-white/10"}`}
      >
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Unscheduled Games {unscheduled.length>0 && `(${unscheduled.length})`}</p>
        {unscheduled.length === 0 ? (
          <p className="text-gray-700 text-xs">Everything's on the board — or drop a game here to pull it off.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {unscheduled.map(entry => (
              <GameCard key={entry.game.id} entry={entry} conflicted={false} isOver={false}/>
            ))}
          </div>
        )}
      </div>

      {/* Day-by-day scheduling grids */}
      {dayKeys.map(day => {
        const slots = slotsForDay(day);
        return (
          <div key={day || "single-day"}>
            {day && (
              <div className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400"/>
                {new Date(day + "T00:00:00").toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" })}
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full border-separate" style={{ borderSpacing: "8px" }}>
                <thead>
                  <tr>
                    <th className="text-left text-xs text-gray-600 font-bold w-20"></th>
                    {courtNums.map(c => (
                      <th key={c} className="text-left text-xs font-bold text-gray-400 px-2 py-1 min-w-[220px]">
                        Court {c}{multiVenue && <span className="block text-[10px] text-gray-600 font-normal">{courtToVenueName(c, tournament.venues ?? [])}</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {slots.map(slot => (
                    <tr key={slot}>
                      <td className="align-top text-xs text-gray-500 font-bold pt-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-600"/>{formatTime12(slot)}
                          <button onClick={()=>deleteGamesAtSlot(day, slot)} title="Delete all games at this time — start this slot over"
                            className="text-gray-700 hover:text-red-400 transition-colors">
                            <Trash2 className="w-3 h-3"/>
                          </button>
                        </div>
                      </td>
                      {courtNums.map(court => {
                        const entry = gameAt(day, slot, court);
                        const key = `${day}|${slot}|${court}`;
                        const isOver = dragOverKey === key;
                        if (!entry) {
                          return (
                            <td key={court}
                              onDragOver={e=>{e.preventDefault(); setDragOverKey(key);}}
                              onDragLeave={()=>setDragOverKey(k=>k===key?null:k)}
                              onDrop={e=>handleDrop(e, day, slot, court)}
                              className={`align-top rounded-xl border-2 border-dashed ${isOver?"border-blue-500 bg-blue-500/10":"border-white/5"} h-20`}
                            />
                          );
                        }
                        const conflicted = conflicts.has(conflictKey(entry.divIdx, entry.gameIdx));
                        return (
                          <td key={court}
                            onDragOver={e=>{e.preventDefault(); setDragOverKey(key);}}
                            onDragLeave={()=>setDragOverKey(k=>k===key?null:k)}
                            onDrop={e=>handleDrop(e, day, slot, court)}
                            className="align-top"
                          >
                            <GameCard entry={entry} conflicted={conflicted} isOver={isOver}/>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {scoring && (()=>{
        const g = tournament.divisions[scoring.divIdx].games[scoring.gameIdx];
        return <ScoreDialog game={g} teamA={getTeamName(tournament,g.team1Id)} teamB={getTeamName(tournament,g.team2Id)}
          onSave={handleScore} onClose={()=>setScoring(null)}/>;
      })()}
    </div>
  );
}

// ── STANDINGS VIEW ────────────────────────────────────────────────────────────

function StandingsView({ tournament }: { tournament: Tournament }) {
  const tiebreaker = tournament.tiebreaker ?? "point_diff";
  const tbLabel = tiebreaker === "least_pa" ? "Least Points Allowed" : "Point Differential";
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <span>Tiebreaker: Head-to-head → {tbLabel}</span>
      </div>
      {tournament.divisions.map(div => (
        <div key={div.id}>
          <h3 className="text-white font-bold mb-3">{div.name}</h3>
          <div className="space-y-4">
            {div.pools.map(pool => {
              const standings = calculateStandings(pool.teamIds, div.teams, div.games.filter(g=>g.poolId===pool.id), tiebreaker);
              return (
                <div key={pool.id} className="glass border border-white/10 rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-white/3 border-b border-white/10">
                    <span className="text-gray-400 font-bold text-sm">{pool.name}</span>
                    <span className="text-gray-600 text-xs ml-2">· {pool.teamIds.length} teams</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="text-gray-600 text-xs">
                        <th className="text-left px-4 py-2 font-bold">Team</th>
                        <th className="px-3 py-2 text-center font-bold">W</th>
                        <th className="px-3 py-2 text-center font-bold">L</th>
                        <th className="px-3 py-2 text-center font-bold">PF</th>
                        <th className="px-3 py-2 text-center font-bold">PA</th>
                        <th className={`px-3 py-2 text-center font-bold ${tiebreaker==="least_pa"?"text-blue-400":""}`}>
                          {tiebreaker==="least_pa"?"PA↑":"+/−"}
                        </th>
                      </tr></thead>
                      <tbody>
                        {standings.map((s,idx) => (
                          <tr key={s.teamId} className={`border-t border-white/5 ${idx===0?"bg-yellow-500/5":""}`}>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600 text-xs w-4 font-bold">{idx+1}</span>
                                <span className={`font-bold ${idx===0?"text-yellow-300":"text-white"}`}>{s.teamName}</span>
                                {idx===0&&<Trophy className="w-3 h-3 text-yellow-500"/>}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-center text-green-400 font-bold">{s.wins}</td>
                            <td className="px-3 py-2.5 text-center text-red-400 font-bold">{s.losses}</td>
                            <td className="px-3 py-2.5 text-center text-gray-400">{s.pf}</td>
                            <td className="px-3 py-2.5 text-center text-gray-400">{s.pa}</td>
                            <td className={`px-3 py-2.5 text-center font-bold ${
                              tiebreaker==="least_pa"
                                ? "text-gray-400"
                                : s.pd>=0?"text-green-400":"text-red-400"
                            }`}>
                              {tiebreaker==="least_pa" ? s.pa : (s.pd>0?"+":"")+s.pd}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── BRACKET VIEW ──────────────────────────────────────────────────────────────

function BracketView({ tournament, onUpdate }: { tournament: Tournament; onUpdate: (t: Tournament) => void }) {
  const [scoring, setScoring] = useState<{ divIdx: number; gameIdx: number }|null>(null);

  function formatFor(div: Division): BracketFormat { return div.format ?? tournament.bracketFormat; }
  function labelFor(fmt: BracketFormat) { return fmt==="double"?"Double Elimination":fmt==="none"?"Pool Play Only":"Single Elimination"; }

  const allPoolPlayOnly = tournament.divisions.every(d => formatFor(d) === "none");
  if (tournament.divisions.length > 0 && allPoolPlayOnly) {
    return (
      <div className="glass border border-white/10 rounded-2xl p-8 text-center">
        <Trophy className="w-10 h-10 text-gray-700 mx-auto mb-3"/>
        <h3 className="text-white font-bold mb-1">Pool Play Only</h3>
        <p className="text-gray-500 text-sm">Every division uses pool play standings to determine the champion — no bracket play.</p>
      </div>
    );
  }

  function poolPlayDone(div: Division) {
    return div.games.length > 0 && div.games.every(g => g.status==="completed");
  }
  function handleGenerate(divIdx: number) {
    const t = JSON.parse(JSON.stringify(tournament)) as Tournament;
    t.divisions[divIdx].bracket = generateBracket(t.divisions[divIdx]);
    t.divisions[divIdx].bracketGenerated = true;
    t.status = "bracket"; t.updatedAt = new Date().toISOString();
    onUpdate(t);
  }
  function handleScore(s1: number, s2: number) {
    if (!scoring) return;
    const t = JSON.parse(JSON.stringify(tournament)) as Tournament;
    const game = t.divisions[scoring.divIdx].bracket[scoring.gameIdx];
    t.divisions[scoring.divIdx].bracket = advanceBracketWinner(t.divisions[scoring.divIdx].bracket, game, s1, s2);
    const allDone = t.divisions.every(d => d.bracket.length>0 && d.bracket.every(g=>!!g.winnerId));
    if (allDone) t.status = "complete";
    t.updatedAt = new Date().toISOString();
    onUpdate(t); setScoring(null);
  }

  return (
    <div className="space-y-8">
      {tournament.divisions.map((div,divIdx) => {
        const fmt = formatFor(div);
        const formatLabel = labelFor(fmt);
        if (fmt === "none") {
          return (
            <div key={div.id} className="glass border border-white/10 rounded-2xl p-5 text-center">
              <h3 className="text-white font-bold mb-1">{div.name}</h3>
              <p className="text-gray-500 text-sm">Pool Play Only — standings decide this division&apos;s champion.</p>
            </div>
          );
        }
        if (!div.bracketGenerated || div.bracket.length===0) {
          return (
            <div key={div.id} className="glass border border-white/10 rounded-2xl p-6 text-center">
              <Trophy className="w-10 h-10 text-gray-700 mx-auto mb-3"/>
              <h3 className="text-white font-bold mb-1">{div.name} Bracket</h3>
              <p className="text-xs text-gray-600 mb-3">{formatLabel}</p>
              {fmt === "double" && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2.5 text-sm text-blue-300 mb-3 text-left">
                  🔵 <strong>Double Elimination</strong> — teams must lose twice to be eliminated.
                </div>
              )}
              {poolPlayDone(div)
                ? <><p className="text-gray-500 text-sm mb-4">Pool play complete — ready to generate the bracket!</p>
                    <Btn onClick={()=>handleGenerate(divIdx)} className="bg-orange-600 hover:bg-orange-500 text-white">🏆 Generate Bracket</Btn></>
                : <p className="text-gray-600 text-sm">Complete all pool play games first.</p>
              }
            </div>
          );
        }
        const rounds = [...new Set(div.bracket.map(g=>g.round))].sort((a,b)=>a-b);
        const maxRound = Math.max(...rounds);
        const champion = div.bracket.find(g=>g.round===maxRound&&g.winnerId);
        return (
          <div key={div.id}>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-yellow-400"/>
              <h3 className="text-white font-bold">{div.name} Bracket</h3>
              <span className="text-gray-600 text-xs">· {formatLabel}</span>
              {champion&&<span className="text-yellow-300 text-sm ml-1">🏆 {getTeamName(tournament,champion.winnerId!)}</span>}
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {rounds.map(round => (
                <div key={round} className="flex-shrink-0 w-52">
                  <div className="text-gray-600 text-xs font-bold uppercase tracking-wider mb-3 text-center">
                    {round===maxRound?"🏆 Final":round===maxRound-1?"Semifinal":`Round ${round}`}
                  </div>
                  <div className="space-y-3">
                    {div.bracket.filter(g=>g.round===round).map(game=>{
                      const done = game.status==="completed";
                      const canScore = !!game.team1Id&&!!game.team2Id;
                      const gameIdx = div.bracket.indexOf(game);
                      return (
                        <div key={game.id} className={`glass border ${done?"border-green-500/20":"border-white/10"} rounded-xl overflow-hidden`}>
                          {[{id:game.team1Id,score:game.score1},{id:game.team2Id,score:game.score2}].map((side,si)=>(
                            <div key={si} className={`flex items-center justify-between px-3 py-2 ${si===0?"border-b border-white/5":""} ${done&&game.winnerId===side.id?"bg-yellow-500/10":""}`}>
                              <span className={`text-sm font-bold truncate ${!side.id?"text-gray-700":done&&game.winnerId===side.id?"text-yellow-300":"text-gray-200"}`}>
                                {getTeamName(tournament,side.id)}
                              </span>
                              {done&&<span className={`text-sm font-black ml-2 ${game.winnerId===side.id?"text-yellow-300":"text-gray-600"}`}>{side.score}</span>}
                            </div>
                          ))}
                          {canScore&&(
                            <button onClick={()=>setScoring({divIdx,gameIdx})}
                              className={`w-full py-1.5 text-xs font-bold transition-colors ${done?"text-gray-600 hover:text-blue-400":"text-blue-400 hover:text-blue-300"}`}>
                              {done?"Edit Score":"Enter Score →"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {scoring&&(()=>{
        const g = tournament.divisions[scoring.divIdx].bracket[scoring.gameIdx];
        return <ScoreDialog game={g} teamA={getTeamName(tournament,g.team1Id??null)} teamB={getTeamName(tournament,g.team2Id??null)}
          onSave={handleScore} onClose={()=>setScoring(null)}/>;
      })()}
    </div>
  );
}

// ── TEAMS & DIVISIONS VIEW (drag teams between divisions, set per-division format) ──

function TeamsView({ tournament, onUpdate }: { tournament: Tournament; onUpdate: (t: Tournament) => void }) {
  const [dragOverDiv, setDragOverDiv] = useState<string|null>(null);

  function createMatchup(divId: string, teamAId: string, teamBId: string) {
    if (teamAId === teamBId) return;
    const t = JSON.parse(JSON.stringify(tournament)) as Tournament;
    const div = t.divisions.find(d => d.id === divId);
    if (!div) return;
    const pool = div.pools.find(p => p.teamIds.includes(teamAId)) ?? div.pools.find(p => p.teamIds.includes(teamBId)) ?? div.pools[0];
    const poolId = pool?.id ?? "";
    div.games.push({
      id: makeId(), poolId, divisionId: divId,
      court: 0, venue: "", timeSlot: -1, time: "", date: "",
      team1Id: teamAId, team2Id: teamBId, status: "scheduled",
    });
    t.updatedAt = new Date().toISOString();
    onUpdate(t);
  }

  function moveTeam(teamId: string, fromDivId: string, toDivId: string) {
    if (fromDivId === toDivId) return;
    const t = JSON.parse(JSON.stringify(tournament)) as Tournament;
    const fromDiv = t.divisions.find(d => d.id === fromDivId);
    const toDiv = t.divisions.find(d => d.id === toDivId);
    if (!fromDiv || !toDiv) return;
    const team = fromDiv.teams.find(tm => tm.id === teamId);
    if (!team) return;

    // Remove from old division: teams list, every pool's teamIds, and any pool games involving it
    // (those games no longer make sense once the team has switched categories).
    fromDiv.teams = fromDiv.teams.filter(tm => tm.id !== teamId);
    fromDiv.pools.forEach(p => { p.teamIds = p.teamIds.filter(id => id !== teamId); });
    fromDiv.games = fromDiv.games.filter(g => g.team1Id !== teamId && g.team2Id !== teamId);

    // Add to new division: teams list + its first pool (create one if needed)
    toDiv.teams.push(team);
    if (toDiv.pools.length === 0) toDiv.pools.push({ id: makeId(), name: "Pool A", teamIds: [] });
    if (!toDiv.pools[0].teamIds.includes(teamId)) toDiv.pools[0].teamIds.push(teamId);

    t.updatedAt = new Date().toISOString();
    onUpdate(t);
  }

  function setDivisionFormat(divId: string, format: BracketFormat | "") {
    const t = JSON.parse(JSON.stringify(tournament)) as Tournament;
    const div = t.divisions.find(d => d.id === divId);
    if (!div) return;
    div.format = format === "" ? undefined : format;
    t.updatedAt = new Date().toISOString();
    onUpdate(t);
  }

  /** Manually pick (or clear) the team a given team can't be scheduled at the same time as —
   *  picking from the actual roster (instead of free text) guarantees an exact name match so the
   *  Scheduler's conflict checker reliably catches it. */
  function setTeamNoOverlap(divId: string, teamId: string, otherTeamName: string) {
    const t = JSON.parse(JSON.stringify(tournament)) as Tournament;
    const div = t.divisions.find(d => d.id === divId);
    if (!div) return;
    const team = div.teams.find(tm => tm.id === teamId);
    if (!team) return;
    team.noOverlapWithTeam = otherTeamName || undefined;
    t.updatedAt = new Date().toISOString();
    onUpdate(t);
  }

  function renameDivision(divId: string, name: string) {
    const t = JSON.parse(JSON.stringify(tournament)) as Tournament;
    const div = t.divisions.find(d => d.id === divId);
    if (!div) return;
    div.name = name;
    t.updatedAt = new Date().toISOString();
    onUpdate(t);
  }

  function generatePoolGames(divId: string) {
    const div = tournament.divisions.find(d => d.id === divId);
    if (!div) return;
    if (div.teams.length < 2) { alert("Add at least 2 teams to this category first."); return; }
    if (div.games.length > 0) {
      if (!confirm(`${div.name} already has ${div.games.length} game(s). Generating fresh pool games will replace them (including any scores). Continue?`)) return;
    }
    const t = JSON.parse(JSON.stringify(tournament)) as Tournament;
    const d = t.divisions.find(x => x.id === divId)!;
    // Make sure every team is in a pool — default to one big pool if none exist yet.
    if (d.pools.length === 0) d.pools.push({ id: makeId(), name: "Pool A", teamIds: [] });
    const assignedIds = new Set(d.pools.flatMap(p => p.teamIds));
    d.teams.forEach(team => { if (!assignedIds.has(team.id)) d.pools[0].teamIds.push(team.id); });
    // Build games so most teams get exactly the guaranteed count (odd team counts mean
    // usually just one team gets an extra game, rather than everyone playing everyone).
    const built = buildUnscheduledPoolGames(d.pools, divId, t.gamesGuaranteed || 3);
    // Games already scheduled in OTHER divisions occupy courts too — seed those so this
    // division's auto-placement doesn't double-book the same court/time as another division.
    const otherScheduledGames = t.divisions
      .filter(x => x.id !== divId)
      .flatMap(x => x.games)
      .filter(g => g.time && g.court);
    // Auto-place each game onto a day/time/court slot right away — avoiding team, coach,
    // and scheduling-request conflicts. Anything that can't find a slot stays unscheduled.
    d.games = autoScheduleGames(
      built, d.teams, t.venues ?? [], t.gameDuration, t.breakBetweenGames, t.startTime,
      t.startDate, t.endDate, t.dayWindows, otherScheduledGames,
    );
    d.bracket = []; d.bracketGenerated = false;
    t.updatedAt = new Date().toISOString();
    onUpdate(t);
  }

  function addDivision() {
    const t = JSON.parse(JSON.stringify(tournament)) as Tournament;
    t.divisions.push({ id: makeId(), name: "New Category", teams: [], pools: [], games: [], bracket: [], losersBracket: [], bracketGenerated: false });
    t.updatedAt = new Date().toISOString();
    onUpdate(t);
  }

  function deleteDivision(divId: string) {
    const div = tournament.divisions.find(d => d.id === divId);
    if (!div) return;
    if (div.teams.length > 0 && !confirm(`${div.name} has ${div.teams.length} team(s). Delete this category anyway?`)) return;
    const t = JSON.parse(JSON.stringify(tournament)) as Tournament;
    t.divisions = t.divisions.filter(d => d.id !== divId);
    t.updatedAt = new Date().toISOString();
    onUpdate(t);
  }

  if (tournament.divisions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="mb-4">No categories yet.</p>
        <Btn onClick={addDivision} className="bg-blue-600 hover:bg-blue-500 text-white">+ Add Category</Btn>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-600">Drag a team card onto another category to move it there. Drag one team onto another <em>within the same category</em> to create a matchup between them — it'll show up in the Scheduler tab&apos;s Unscheduled Games queue, ready to drag onto the board.</p>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {tournament.divisions.map(div => {
          const isOver = dragOverDiv === div.id;
          return (
            <div key={div.id}
              onDragOver={e=>{e.preventDefault(); setDragOverDiv(div.id);}}
              onDragLeave={()=>setDragOverDiv(k=>k===div.id?null:k)}
              onDrop={e=>{
                e.preventDefault(); setDragOverDiv(null);
                let data: { teamId: string; fromDivId: string };
                try { data = JSON.parse(e.dataTransfer.getData("text/plain")); } catch { return; }
                moveTeam(data.teamId, data.fromDivId, div.id);
              }}
              className={`flex-shrink-0 w-64 glass border rounded-2xl p-3 space-y-2.5 transition-colors ${isOver ? "border-blue-500/60 bg-blue-500/5" : "border-white/10"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <input value={div.name} onChange={e=>renameDivision(div.id, e.target.value)}
                  className="flex-1 bg-transparent text-white font-bold text-sm px-1 py-0.5 rounded focus:outline-none focus:bg-white/5" />
                <button onClick={()=>deleteDivision(div.id)} className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5"/>
                </button>
              </div>

              <select value={div.format ?? ""} onChange={e=>setDivisionFormat(div.id, e.target.value as BracketFormat|"")}
                className="w-full bg-white/5 border border-white/10 text-gray-300 text-xs px-2 py-1.5 rounded-lg focus:outline-none">
                <option value="" className="bg-slate-900">Tournament Default</option>
                <option value="none" className="bg-slate-900">Pool Play Only</option>
                <option value="single" className="bg-slate-900">Pool → Single Elim</option>
                <option value="double" className="bg-slate-900">Pool → Double Elim</option>
              </select>

              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">{div.teams.length} team{div.teams.length!==1?"s":""} · {div.games.length} game{div.games.length!==1?"s":""}</div>
                <button onClick={()=>generatePoolGames(div.id)} disabled={div.teams.length<2}
                  className="text-[10px] font-bold px-2 py-1 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all whitespace-nowrap">
                  🎲 Generate Games
                </button>
              </div>

              <div className="space-y-1.5 min-h-[40px]">
                {div.teams.length === 0 && (
                  <div className="text-center text-gray-700 text-xs py-4 border border-dashed border-white/10 rounded-lg">Drop a team here</div>
                )}
                {div.teams.map(team => (
                  <div key={team.id}
                    draggable
                    onDragStart={e=>{ e.stopPropagation(); e.dataTransfer.setData("text/plain", JSON.stringify({ teamId: team.id, fromDivId: div.id })); }}
                    onDragOver={e=>{ e.preventDefault(); e.stopPropagation(); }}
                    onDrop={e=>{
                      e.preventDefault(); e.stopPropagation(); setDragOverDiv(null);
                      let data: { teamId: string; fromDivId: string };
                      try { data = JSON.parse(e.dataTransfer.getData("text/plain")); } catch { return; }
                      if (data.fromDivId === div.id) createMatchup(div.id, data.teamId, team.id);
                      else moveTeam(data.teamId, data.fromDivId, div.id);
                    }}
                    title="Drag another team from this category onto this card to create a matchup between them."
                    className="glass border border-white/10 hover:border-blue-500/40 rounded-lg px-2.5 py-2 cursor-grab active:cursor-grabbing"
                  >
                    <div className="text-white font-bold text-xs truncate">{team.name}</div>
                    {team.coachName && <div className="text-gray-600 text-[10px] truncate">Coach {team.coachName}</div>}
                    {(team.noPlayBefore || team.noPlayAfter) && (
                      <div className="text-blue-300/90 text-[10px] mt-1 flex items-center gap-1">
                        <span className="flex-shrink-0">⏰</span>
                        <span>{team.noPlayBefore && `Not before ${formatTime12(team.noPlayBefore)}`}{team.noPlayBefore && team.noPlayAfter && " · "}{team.noPlayAfter && `Not after ${formatTime12(team.noPlayAfter)}`}</span>
                      </div>
                    )}
                    {team.noOverlapWithTeam && (
                      <div className="text-purple-300/90 text-[10px] mt-1 flex items-center gap-1">
                        <span className="flex-shrink-0">🚫</span>
                        <span className="truncate">Not same time as {team.noOverlapWithTeam}</span>
                      </div>
                    )}
                    {team.schedulingRequests && (
                      <div className="text-yellow-400/90 text-[10px] mt-1 flex items-start gap-1">
                        <span className="flex-shrink-0">⚠️</span>
                        <span className="line-clamp-2">{team.schedulingRequests}</span>
                      </div>
                    )}
                    <select
                      value={team.noOverlapWithTeam ?? ""}
                      onChange={e => setTeamNoOverlap(div.id, team.id, e.target.value)}
                      onClick={e => e.stopPropagation()}
                      onPointerDown={e => e.stopPropagation()}
                      draggable={false}
                      title="Pick the exact team this one can't be scheduled at the same time as — picking from the roster (instead of typing) guarantees the Scheduler catches the conflict."
                      className="w-full mt-1.5 bg-white/5 border border-white/10 text-gray-400 text-[10px] px-1.5 py-1 rounded-md focus:outline-none focus:border-purple-500/50"
                    >
                      <option value="" className="bg-slate-900">🚫 Can't play same time as… (none)</option>
                      {tournament.divisions.flatMap(d2 => d2.teams
                        .filter(tm => tm.id !== team.id)
                        .map(tm => (
                          <option key={tm.id} value={tm.name} className="bg-slate-900">
                            {tm.name}{d2.id !== div.id ? ` (${d2.name})` : ""}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        <button onClick={addDivision}
          className="flex-shrink-0 w-64 h-fit py-3 border border-dashed border-white/20 hover:border-blue-500/40 text-gray-500 hover:text-blue-400 rounded-2xl text-sm font-bold transition-colors">
          + Add Category
        </button>
      </div>
    </div>
  );
}

// ── TOURNAMENT DETAIL ─────────────────────────────────────────────────────────

type DetailTab = "teams"|"schedule"|"standings"|"bracket";

function TournamentDetail({ tournament: init, onBack, onUpdate, contacts }: {
  tournament: Tournament; onBack: () => void; onUpdate: (t: Tournament) => void;
  contacts: RegistrationContact[];
}) {
  const [tournament, setTournament] = useState(init);
  const [tab, setTab] = useState<DetailTab>("teams");
  const [editing, setEditing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [merging, setMerging] = useState(false);

  const handleUpdate = useCallback((updated: Tournament) => {
    saveTournament(updated); setTournament({...updated}); onUpdate(updated);
  }, [onUpdate]);

  const total = tournament.divisions.reduce((s,d)=>s+d.games.length,0);
  const done  = tournament.divisions.reduce((s,d)=>s+d.games.filter(g=>g.status==="completed").length,0);
  const teams = tournament.divisions.reduce((s,d)=>s+d.teams.length,0);
  const vLabel = venueLabel(tournament.venues ?? []);
  const courts = totalCourts(tournament.venues ?? []);

  const regs = matchingRegs(contacts, tournament.name);
  const unimportedRegs = regs.filter(c => !teamImported(tournament, c.teamName!, c.division || ""));

  return (
    <div>
      <div className="flex items-start gap-3 mb-4">
        <button onClick={onBack} className="mt-1 text-gray-500 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4"/>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-white font-bold text-lg">{tournament.name}</h2>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${S_COLOR[tournament.status]}`}>{S_LABEL[tournament.status]}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 text-xs text-gray-500 mt-1">
            {tournament.date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/>{tournament.date}</span>}
            {vLabel !== "—" && <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/>{vLabel}</span>}
            <span className="flex items-center gap-1"><Users className="w-3 h-3"/>{teams} teams · {courts} court{courts!==1?"s":""}</span>
            {tournament.gamesGuaranteed > 0 && <span>{tournament.gamesGuaranteed} guaranteed</span>}
            {total > 0 && <span>{done}/{total} scored</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={()=>setImporting(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 glass border rounded-lg text-xs font-bold transition-all ${
              unimportedRegs.length > 0
                ? "border-yellow-500/40 hover:border-yellow-500/70 text-yellow-400"
                : "border-white/15 hover:border-white/25 text-gray-400 hover:text-white"
            }`}>
            <Download className="w-3.5 h-3.5"/>
            Import{unimportedRegs.length > 0 && <span className="bg-yellow-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded-full ml-1">{unimportedRegs.length}</span>}
          </button>
          <button onClick={()=>setMerging(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 glass border border-white/15 hover:border-blue-500/40 text-gray-400 hover:text-white rounded-lg text-xs font-bold transition-all">
            📋 Merge Teams
          </button>
          <button onClick={()=>setEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 glass border border-white/15 hover:border-blue-500/40 text-gray-400 hover:text-white rounded-lg text-xs font-bold transition-all">
            <Edit className="w-3.5 h-3.5"/> Edit
          </button>
        </div>
      </div>

      {unimportedRegs.length > 0 && (
        <div className="mb-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl">📋</span>
          <div className="flex-1">
            <p className="text-yellow-300 font-bold text-sm">{unimportedRegs.length} unimported registration{unimportedRegs.length!==1?"s":""}</p>
            <p className="text-yellow-400/70 text-xs mt-0.5">Teams from your registration form haven&apos;t been added yet.</p>
          </div>
          <button onClick={()=>setImporting(true)} className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded-lg transition-colors flex-shrink-0">
            Review →
          </button>
        </div>
      )}
      {regs.length > 0 && unimportedRegs.length === 0 && (
        <div className="mb-4 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm">
          <span className="text-green-400">✓</span>
          <span className="text-green-300 font-bold">All {regs.length} registration{regs.length!==1?"s":""} imported</span>
          <button onClick={()=>setImporting(true)} className="text-xs text-gray-500 hover:text-gray-400 ml-auto">Review</button>
        </div>
      )}

      {total > 0 && (
        <div className="mb-5">
          <div className="bg-white/5 rounded-full h-1.5">
            <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{width:`${Math.round((done/total)*100)}%`}}/>
          </div>
          <div className="text-xs text-gray-600 mt-1 text-right">{Math.round((done/total)*100)}% pool play complete</div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-5">
        <span className="glass border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-400">
          🏀 {tournament.bracketFormat==="single"?"Single Elim":tournament.bracketFormat==="double"?"Double Elim":"Pool Play Only"}
        </span>
        <span className="glass border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-400">
          ✅ {tournament.gamesGuaranteed ?? 3} guaranteed
        </span>
        <span className="glass border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-400">
          ⏱ {tournament.gameDuration}min
        </span>
        <span className="glass border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-400">
          {tournament.tiebreaker === "least_pa" ? "🔒 Least PA tiebreaker" : "📊 +/− tiebreaker"}
        </span>
        {(tournament.venues?.length ?? 0) > 1 && (
          <span className="glass border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-400">
            📍 {tournament.venues.length} venues · {courts} courts total
          </span>
        )}
        {regs.length > 0 && (
          <span className="glass border border-yellow-500/20 rounded-lg px-3 py-1.5 text-xs text-yellow-400">
            📋 {regs.length} registered
          </span>
        )}
      </div>

      <div className="flex border-b border-white/10 mb-5">
        {(["teams","schedule","standings","bracket"] as DetailTab[]).map(k=>(
          <button key={k} onClick={()=>setTab(k)}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${tab===k?"border-blue-500 text-blue-400":"border-transparent text-gray-500 hover:text-gray-300"}`}>
            {k==="teams"?"🧩 Teams":k==="schedule"?"📅 Schedule":k==="standings"?"📊 Standings":"🏆 Bracket"}
          </button>
        ))}
      </div>

      {tab==="teams"     && <TeamsView     tournament={tournament} onUpdate={handleUpdate}/>}
      {tab==="schedule"  && <ScheduleView  tournament={tournament} onUpdate={handleUpdate}/>}
      {tab==="standings" && <StandingsView tournament={tournament}/>}
      {tab==="bracket"   && <BracketView   tournament={tournament} onUpdate={handleUpdate}/>}

      {editing && <EditTournamentModal tournament={tournament} onSave={t=>{handleUpdate(t);setEditing(false);}} onClose={()=>setEditing(false)}/>}
      {importing && <ImportPanel tournament={tournament} contacts={contacts} onImport={t=>{handleUpdate(t);setImporting(false);}} onClose={()=>setImporting(false)}/>}
      {merging && <MergeTextPanel tournament={tournament} onImport={t=>{handleUpdate(t);setMerging(false);}} onClose={()=>setMerging(false)}/>}
    </div>
  );
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────

export function TourneyTab({ contacts = [], tournaments = [], adminKey = "" }: { contacts?: RegistrationContact[]; tournaments?: TournamentConfig[]; adminKey?: string }) {
  const [list, setList] = useState<Tournament[]>(() =>
    getAllTournaments().sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  );
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Tournament|null>(null);

  // Pull the authoritative copy from the server on mount so a tournament saved from another
  // browser/device (or from "yesterday") shows up here instead of appearing to be gone.
  useEffect(() => {
    setTourneyAdminKey(adminKey);
    syncTournamentsFromServer().then(merged => {
      setList(merged.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey]);

  function handleCreated(t: Tournament) { setList(p=>[t,...p]); setCreating(false); setSelected(t); }
  function handleDelete(id: string) {
    if (!confirm("Delete this tournament? Cannot be undone.")) return;
    deleteT(id); setList(p=>p.filter(t=>t.id!==id));
    if (selected?.id===id) setSelected(null);
  }
  function handleUpdate(updated: Tournament) { setList(p=>p.map(t=>t.id===updated.id?updated:t)); }

  if (selected) return <TournamentDetail tournament={selected} contacts={contacts} onBack={()=>setSelected(null)} onUpdate={u=>{setSelected(u);handleUpdate(u);}}/>;

  const tGames = (t: Tournament) => t.divisions.reduce((s,d)=>s+d.games.length,0);
  const dGames  = (t: Tournament) => t.divisions.reduce((s,d)=>s+d.games.filter(g=>g.status==="completed").length,0);
  const tTeams  = (t: Tournament) => t.divisions.reduce((s,d)=>s+d.teams.length,0);
  const regCount = (t: Tournament) => matchingRegs(contacts, t.name).length;
  const unimportedCount = (t: Tournament) => matchingRegs(contacts, t.name).filter(c => !teamImported(t, c.teamName!, c.division||"")).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-base">Tournament Calculator</h2>
          <p className="text-gray-500 text-sm mt-0.5">Auto-generate schedules, run brackets, and track scores.</p>
        </div>
        <Btn onClick={()=>setCreating(true)} className="bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5">
          <Plus className="w-4 h-4 inline"/> New
        </Btn>
      </div>

      {list.length === 0 ? (
        <div className="glass border border-white/10 rounded-2xl p-10 text-center">
          <div className="text-5xl mb-4">🏆</div>
          <p className="text-white font-bold mb-1">No tournaments yet</p>
          <p className="text-gray-500 text-sm mb-5">Create one to auto-generate a full schedule with brackets and standings.</p>
          <Btn onClick={()=>setCreating(true)} className="bg-blue-600 hover:bg-blue-500 text-white">+ Create First Tournament</Btn>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(t => {
            const done=dGames(t), total=tGames(t);
            const pct = total>0?Math.round((done/total)*100):0;
            const courts = totalCourts(t.venues ?? []);
            const regs = regCount(t);
            const unimported = unimportedCount(t);
            return (
              <div key={t.id} className={`glass border rounded-2xl p-4 transition-all ${unimported>0?"border-yellow-500/25 hover:border-yellow-500/40":"border-white/10 hover:border-white/20"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-white font-bold truncate">{t.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${S_COLOR[t.status]}`}>{S_LABEL[t.status]}</span>
                      {unimported > 0 && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-300">📋 {unimported} to import</span>}
                      {regs > 0 && unimported === 0 && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-500/15 text-green-400">✓ {regs} registered</span>}
                    </div>
                    <div className="flex flex-wrap gap-x-3 text-xs text-gray-500 mb-1.5">
                      {t.date && <span>{t.date}</span>}
                      {venueLabel(t.venues ?? []) !== "—" && <span>{venueLabel(t.venues ?? [])}</span>}
                      <span>{tTeams(t)} teams · {t.divisions.length} div{t.divisions.length!==1?"s":""} · {courts} court{courts!==1?"s":""}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="text-[10px] bg-white/5 text-gray-500 px-2 py-0.5 rounded-md">
                        {t.bracketFormat==="single"?"Single Elim":t.bracketFormat==="double"?"Double Elim":"Pool Play Only"}
                      </span>
                      <span className="text-[10px] bg-white/5 text-gray-500 px-2 py-0.5 rounded-md">{t.gamesGuaranteed??3} guaranteed</span>
                      <span className="text-[10px] bg-white/5 text-gray-500 px-2 py-0.5 rounded-md">
                        {(t.tiebreaker??"point_diff")==="least_pa"?"Least PA":"Point Diff"}
                      </span>
                    </div>
                    {total>0&&(
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white/5 rounded-full h-1 max-w-[100px]">
                          <div className="bg-blue-500 h-1 rounded-full" style={{width:`${pct}%`}}/>
                        </div>
                        <span className="text-xs text-gray-600">{done}/{total}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Btn onClick={()=>setSelected(t)} className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400">Open →</Btn>
                    <button onClick={()=>handleDelete(t.id)} className="p-2 text-gray-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {creating && <CreateWizard onCreated={handleCreated} onClose={()=>setCreating(false)} contacts={contacts} tournaments={tournaments}/>}
    </div>
  );
}
