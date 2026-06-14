"use client";

import { useState, useCallback } from "react";
import type { Tournament, Division, Pool, PoolGame, BracketGame, Team, BracketFormat } from "@/lib/tourney-types";
import { getAllTournaments, saveTournament, deleteTournament as deleteT } from "@/lib/tourney-storage";
import { generateDivisionSchedule } from "@/lib/tourney-scheduler";
import { calculateStandings } from "@/lib/tourney-standings";
import { generateBracket, advanceBracketWinner } from "@/lib/tourney-bracket";
import { Plus, Trash2, ArrowLeft, Trophy, Calendar, MapPin, Users, Clock, Edit, X, Download } from "lucide-react";

// ── Registration contact (from admin contacts list) ──────────────────────────

export interface RegistrationContact {
  id: string;
  name: string;           // coach / contact name
  email: string;
  phone: string;
  source: string;         // "tournament"
  tournamentName?: string;
  teamName?: string;
  division?: string;
  date: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2,5)}`;

/** All registrations matching this tournament manager tournament by name */
function matchingRegs(contacts: RegistrationContact[], tournamentName: string): RegistrationContact[] {
  const n = tournamentName.toLowerCase().trim();
  return contacts.filter(c =>
    c.source === "tournament" && c.tournamentName?.toLowerCase().trim() === n && c.teamName?.trim()
  );
}

/** Check if a team name is already imported into a division */
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

function VenueEditor({ venues, onChange }: { venues: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Venues</label>
      <div className="space-y-2">
        {venues.map((v, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input value={v} onChange={e => { const n=[...venues]; n[i]=e.target.value; onChange(n); }}
              placeholder={`Venue ${i+1} (e.g. Main Gym)`}
              className="flex-1 bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500/60 placeholder:text-gray-600" />
            {venues.length > 1 && (
              <button onClick={() => onChange(venues.filter((_,j)=>j!==i))} className="text-gray-600 hover:text-red-400 transition-colors p-1">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        <button onClick={() => onChange([...venues, ""])}
          className="text-xs text-blue-400 hover:text-blue-300 font-bold transition-colors">
          + Add another venue
        </button>
      </div>
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
            <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 transition-all ${value===o.value?"border-blue-500 bg-blue-500":"border-gray-600"}`} />
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

// ── IMPORT REGISTRATIONS PANEL ─────────────────────────────────────────────

function ImportPanel({ tournament, contacts, onImport, onClose }: {
  tournament: Tournament;
  contacts: RegistrationContact[];
  onImport: (updated: Tournament) => void;
  onClose: () => void;
}) {
  const regs = matchingRegs(contacts, tournament.name);

  // Group by division name
  const byDiv: Record<string, RegistrationContact[]> = {};
  regs.forEach(c => {
    const key = c.division?.trim() || "Unassigned";
    if (!byDiv[key]) byDiv[key] = [];
    byDiv[key].push(c);
  });

  // Build initial selection — exclude already-imported teams
  const initialSel: Record<string, boolean> = {};
  regs.forEach(c => {
    const imported = teamImported(tournament, c.teamName!, c.division || "");
    initialSel[c.id] = !imported; // auto-select new teams
  });
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
      // Find matching division (case-insensitive)
      let div = t.divisions.find(d => d.name.toLowerCase() === divName.toLowerCase());
      // If no division match, use first division or create unassigned
      if (!div && t.divisions.length > 0) div = t.divisions[0];
      if (!div) return;

      // Skip if already in division
      if (div.teams.some(team => team.name.toLowerCase() === c.teamName!.toLowerCase().trim())) return;

      // Add team
      div.teams.push({ id: makeId(), name: c.teamName!.trim(), coachName: c.name });
    });

    t.updatedAt = new Date().toISOString();
    onImport(t);
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="glass border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {regs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-2xl mb-3">📋</p>
              <p className="font-bold text-gray-400 mb-1">No registrations found</p>
              <p className="text-sm">No contacts with tournament name matching <span className="text-gray-300">&quot;{tournament.name}&quot;</span>.</p>
              <p className="text-xs mt-2 text-gray-600">Registrations appear in the Contacts tab when teams sign up through your website.</p>
            </div>
          ) : (
            Object.entries(byDiv).map(([divName, divRegs]) => {
              // Find matching division in tournament
              const matchedDiv = tournament.divisions.find(d => d.name.toLowerCase() === divName.toLowerCase());
              const allSel = divRegs.every(c => selected[c.id]);
              return (
                <div key={divName}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-300 font-bold text-sm">{divName}</span>
                      {matchedDiv
                        ? <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">✓ matches division</span>
                        : <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">⚠️ no matching division</span>
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
                          alreadyIn
                            ? "border-white/5 opacity-50 cursor-not-allowed"
                            : selected[c.id]
                              ? "border-yellow-500/40 bg-yellow-500/5"
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
                            <div className="text-xs text-gray-500">
                              Coach: {c.name}
                              {c.email && <span className="ml-2 text-gray-600">{c.email}</span>}
                            </div>
                          </div>
                          {!matchedDiv && !alreadyIn && (
                            <span className="text-[10px] text-orange-400 shrink-0">→ {tournament.divisions[0]?.name || "first div"}</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {regs.length > 0 && (
          <div className="flex gap-3 p-5 border-t border-white/10 flex-shrink-0">
            <Btn onClick={onClose} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400">Cancel</Btn>
            <Btn onClick={doImport} disabled={selectedCount === 0}
              className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white">
              Import {selectedCount > 0 ? `${selectedCount} Team${selectedCount!==1?"s":""}` : "Teams"}
            </Btn>
          </div>
        )}
        {regs.length === 0 && (
          <div className="p-5 border-t border-white/10 flex-shrink-0">
            <Btn onClick={onClose} className="w-full bg-white/5 hover:bg-white/10 text-gray-400">Close</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

// ── EDIT TOURNAMENT MODAL ─────────────────────────────────────────────────────

interface EditFields {
  name: string; date: string; venues: string[];
  courts: number; gameDuration: number; breakBetweenGames: number;
  startTime: string; bracketFormat: BracketFormat; gamesGuaranteed: number;
}

function EditTournamentModal({ tournament, onSave, onClose }: {
  tournament: Tournament; onSave: (t: Tournament) => void; onClose: () => void;
}) {
  const [f, setF] = useState<EditFields>({
    name:             tournament.name,
    date:             tournament.date,
    venues:           tournament.venues?.length ? tournament.venues : ["Main Gym"],
    courts:           tournament.courts,
    gameDuration:     tournament.gameDuration,
    breakBetweenGames:tournament.breakBetweenGames,
    startTime:        tournament.startTime,
    bracketFormat:    tournament.bracketFormat ?? "single",
    gamesGuaranteed:  tournament.gamesGuaranteed ?? 3,
  });

  function save() {
    const updated: Tournament = {
      ...tournament,
      name:             f.name.trim() || tournament.name,
      date:             f.date,
      venues:           f.venues.filter(v => v.trim()),
      courts:           f.courts,
      gameDuration:     f.gameDuration,
      breakBetweenGames:f.breakBetweenGames,
      startTime:        f.startTime,
      bracketFormat:    f.bracketFormat,
      gamesGuaranteed:  f.gamesGuaranteed,
      updatedAt:        new Date().toISOString(),
    };
    onSave(updated);
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="glass border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-white font-bold text-lg">Edit Tournament Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <IF label="Tournament Name" value={f.name} onChange={v => setF(p=>({...p,name:v}))} />
          <IF label="Date" value={f.date} onChange={v => setF(p=>({...p,date:v}))} placeholder="June 22–25, 2026" />
          <VenueEditor venues={f.venues} onChange={v => setF(p=>({...p,venues:v}))} />
          <div className="grid grid-cols-2 gap-3">
            <IF label="Courts" type="number" min="1" value={f.courts} onChange={v => setF(p=>({...p,courts:+v}))} />
            <IF label="Games Guaranteed" type="number" min="1" value={f.gamesGuaranteed} onChange={v => setF(p=>({...p,gamesGuaranteed:+v}))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <IF label="Game Duration (min)" type="number" min="10" value={f.gameDuration} onChange={v => setF(p=>({...p,gameDuration:+v}))} />
            <IF label="Break Between Games (min)" type="number" min="0" value={f.breakBetweenGames} onChange={v => setF(p=>({...p,breakBetweenGames:+v}))} />
          </div>
          <IF label="Start Time" type="time" value={f.startTime} onChange={v => setF(p=>({...p,startTime:v}))} />
          <BracketFormatPicker value={f.bracketFormat} onChange={v => setF(p=>({...p,bracketFormat:v}))} />
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2.5 text-xs text-yellow-300">
            ⚠️ Changing courts, game duration, break time, or start time will <strong>not</strong> automatically reschedule existing games — only affects new tournaments.
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

type WizDiv = { name: string; pools: number; teams: string[] };
interface WizState {
  name: string; date: string; venues: string[];
  courts: number; gameDuration: number; breakBetweenGames: number; startTime: string;
  bracketFormat: BracketFormat; gamesGuaranteed: number;
  divisions: WizDiv[];
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

function CreateWizard({ onCreated, onClose, contacts }: {
  onCreated: (t: Tournament) => void; onClose: () => void;
  contacts: RegistrationContact[];
}) {
  const [step, setStep] = useState(1);
  const [w, setW] = useState<WizState>({
    name: "", date: "", venues: ["Main Gym"], courts: 2,
    gameDuration: 24, breakBetweenGames: 6, startTime: "08:00",
    bracketFormat: "single", gamesGuaranteed: 3,
    divisions: [{ name: "", pools: 2, teams: ["","","","","","","",""] }],
  });

  // Registrations matching current tournament name
  const regMatches = matchingRegs(contacts, w.name);
  const regByDiv: Record<string, string[]> = {};
  regMatches.forEach(c => {
    const key = c.division?.trim() || "";
    if (!regByDiv[key]) regByDiv[key] = [];
    if (c.teamName?.trim() && !regByDiv[key].includes(c.teamName.trim())) regByDiv[key].push(c.teamName.trim());
  });

  function autoFillDivision(di: number, divName: string) {
    // look for exact or partial match to this division name
    const matches = Object.entries(regByDiv).find(([k]) =>
      k.toLowerCase() === divName.toLowerCase() || divName.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(divName.toLowerCase())
    );
    const teams = matches ? matches[1] : [];
    if (!teams.length) return;
    setW(p => {
      const d = [...p.divisions];
      const padded = [...teams, ...Array(Math.max(0, 8 - teams.length)).fill("")];
      d[di] = { ...d[di], teams: padded };
      return { ...p, divisions: d };
    });
  }

  function generate() {
    const tid = makeId(); const now = new Date().toISOString();
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
      const games: PoolGame[] = generateDivisionSchedule(
        pools, divId, w.courts, w.gameDuration, w.breakBetweenGames, w.startTime, w.venues
      );
      return { id: divId, name: d.name, teams: allTeams, pools, games, bracket: [], losersBracket: [], bracketGenerated: false };
    });

    const t: Tournament = {
      id: tid, name: w.name, date: w.date, venues: w.venues.filter(v=>v.trim()),
      courts: w.courts, gameDuration: w.gameDuration, breakBetweenGames: w.breakBetweenGames,
      startTime: w.startTime, bracketFormat: w.bracketFormat, gamesGuaranteed: w.gamesGuaranteed,
      status: "pool_play", divisions, createdAt: now, updatedAt: now,
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
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          {step === 1 && <>
            <IF label="Tournament Name *" value={w.name} onChange={v=>setW(p=>({...p,name:v}))} placeholder="Hilhi Spring Invitational" />

            {/* Reg preview banner if name matches contacts */}
            {w.name.trim().length > 2 && regMatches.length > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2.5 text-sm">
                <div className="text-yellow-300 font-bold">📋 {regMatches.length} registration{regMatches.length!==1?"s":""} found</div>
                <div className="text-yellow-400/70 text-xs mt-0.5">
                  Teams from {Object.keys(regByDiv).length} division{Object.keys(regByDiv).length!==1?"s":""} can be auto-filled in Step 2
                </div>
              </div>
            )}

            <IF label="Date" value={w.date} onChange={v=>setW(p=>({...p,date:v}))} placeholder="June 22–25, 2026" />
            <VenueEditor venues={w.venues} onChange={v=>setW(p=>({...p,venues:v}))} />
            <div className="grid grid-cols-2 gap-3">
              <IF label="Courts" type="number" min="1" value={w.courts} onChange={v=>setW(p=>({...p,courts:+v}))} />
              <IF label="Games Guaranteed" type="number" min="1" value={w.gamesGuaranteed} onChange={v=>setW(p=>({...p,gamesGuaranteed:+v}))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <IF label="Game Duration (min)" type="number" value={w.gameDuration} onChange={v=>setW(p=>({...p,gameDuration:+v}))} />
              <IF label="Break Between (min)" type="number" value={w.breakBetweenGames} onChange={v=>setW(p=>({...p,breakBetweenGames:+v}))} />
            </div>
            <IF label="Start Time" type="time" value={w.startTime} onChange={v=>setW(p=>({...p,startTime:v}))} />
            <BracketFormatPicker value={w.bracketFormat} onChange={v=>setW(p=>({...p,bracketFormat:v}))} />
          </>}

          {step === 2 && (
            <div className="space-y-5">
              {regMatches.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2.5 text-xs text-yellow-300">
                  📋 <strong>{regMatches.length} registered teams</strong> found — use &quot;Fill from Registrations&quot; buttons below to auto-populate
                </div>
              )}
              {w.divisions.map((div, di) => {
                const hasRegForDiv = div.name.trim() && (
                  Object.keys(regByDiv).some(k =>
                    k.toLowerCase() === div.name.toLowerCase() ||
                    div.name.toLowerCase().includes(k.toLowerCase()) ||
                    k.toLowerCase().includes(div.name.toLowerCase())
                  )
                );
                return (
                  <div key={di} className="border border-white/10 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <IF label="Division Name *" value={div.name} onChange={v=>setW(p=>{const d=[...p.divisions];d[di]={...d[di],name:v};return{...p,divisions:d};})} placeholder="5th Grade Boys" />
                      </div>
                      <div className="w-28">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Pools</label>
                        <select value={div.pools} onChange={e=>setW(p=>{const d=[...p.divisions];d[di]={...d[di],pools:+e.target.value};return{...p,divisions:d};})}
                          className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none">
                          {[1,2,3,4].map(n=><option key={n} value={n} className="bg-slate-900">{n} Pool{n>1?"s":""}</option>)}
                        </select>
                      </div>
                      {w.divisions.length > 1 && (
                        <button onClick={()=>setW(p=>({...p,divisions:p.divisions.filter((_,i)=>i!==di)}))} className="mt-4 text-gray-600 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Auto-fill button when division name matches registrations */}
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
                  {w.venues.filter(v=>v.trim()).join(" · ") || "No venue set"}
                </p>
                <p className="text-gray-400">{w.courts} courts · {w.gameDuration}min games · {w.gamesGuaranteed} guaranteed · starts {w.startTime}</p>
                <p className="text-gray-400">Bracket: {w.bracketFormat === "single" ? "Single Elimination" : w.bracketFormat === "double" ? "Double Elimination" : "Pool Play Only"}</p>
              </div>
              {w.divisions.map((d,di) => {
                const filled = d.teams.filter(t=>t.trim());
                return (
                  <div key={di} className="glass border border-white/10 rounded-xl p-4">
                    <p className="text-white font-bold">{d.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{filled.length} teams · {d.pools} pool{d.pools>1?"s":""}</p>
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
              className="w-full bg-white/5 border border-white/20 text-white text-center text-2xl font-black py-3 rounded-xl focus:outline-none focus:border-blue-500/60" />
          </div>
          <div className="text-center text-gray-600 font-bold">vs</div>
          <div className="text-center">
            <div className="text-gray-300 text-xs mb-2 font-bold truncate">{teamB}</div>
            <input type="number" min="0" value={s2} onChange={e=>setS2(e.target.value)}
              className="w-full bg-white/5 border border-white/20 text-white text-center text-2xl font-black py-3 rounded-xl focus:outline-none focus:border-blue-500/60" />
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

function ScheduleView({ tournament, onUpdate }: { tournament: Tournament; onUpdate: (t: Tournament) => void }) {
  const [scoring, setScoring] = useState<{ divIdx: number; gameIdx: number }|null>(null);

  const allGames = tournament.divisions.flatMap((d,di) =>
    d.games.map((g,gi) => ({ game: g, divIdx: di, gameIdx: gi, divName: d.name }))
  );
  const slots = [...new Set(allGames.map(g=>g.game.time))].sort();

  function handleScore(s1: number, s2: number) {
    if (!scoring) return;
    const t = JSON.parse(JSON.stringify(tournament)) as Tournament;
    const g = t.divisions[scoring.divIdx].games[scoring.gameIdx];
    g.score1=s1; g.score2=s2; g.status="completed";
    t.updatedAt = new Date().toISOString();
    onUpdate(t); setScoring(null);
  }

  if (allGames.length === 0) return <div className="text-center py-12 text-gray-500">No games scheduled.</div>;

  const multiVenue = (tournament.venues?.length ?? 0) > 1;

  return (
    <div className="space-y-6">
      {slots.map(slot => (
        <div key={slot}>
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-4 h-4 text-gray-600"/>
            <span className="text-gray-400 font-bold text-sm">{slot}</span>
            <div className="flex-1 border-t border-white/5"/>
          </div>
          <div className="grid gap-2">
            {allGames.filter(g=>g.game.time===slot).map(({game,divIdx,gameIdx,divName})=>{
              const t1 = getTeamName(tournament, game.team1Id);
              const t2 = getTeamName(tournament, game.team2Id);
              const done = game.status==="completed";
              const poolName = tournament.divisions[divIdx].pools.find(p=>p.id===game.poolId)?.name ?? "";
              return (
                <div key={game.id} className="glass border border-white/10 hover:border-white/20 rounded-xl p-3.5 flex items-center gap-4 transition-colors">
                  <div className="shrink-0 text-center min-w-[56px]">
                    <div className="text-xs text-gray-600 font-bold">Ct {game.court}</div>
                    {multiVenue && <div className="text-[10px] text-gray-700 truncate max-w-[56px]">{game.venue}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                      <span>{divName}</span>{poolName&&<><span>·</span><span>{poolName}</span></>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm truncate ${done&&game.score1!>game.score2!?"text-white":"text-gray-300"}`}>{t1}</span>
                      {done
                        ? <span className="text-gray-500 font-black text-xs bg-white/5 px-2 py-0.5 rounded-md shrink-0">{game.score1} – {game.score2}</span>
                        : <span className="text-gray-700 text-xs shrink-0">vs</span>
                      }
                      <span className={`font-bold text-sm truncate ${done&&game.score2!>game.score1!?"text-white":"text-gray-300"}`}>{t2}</span>
                    </div>
                  </div>
                  <button onClick={()=>setScoring({divIdx,gameIdx})}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all shrink-0 ${done?"bg-white/5 text-gray-500 hover:text-blue-400":"bg-blue-600/20 text-blue-400 hover:bg-blue-600/30"}`}>
                    {done?"Edit":"Score →"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
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
  return (
    <div className="space-y-6">
      {tournament.divisions.map(div => (
        <div key={div.id}>
          <h3 className="text-white font-bold mb-3">{div.name}</h3>
          <div className="space-y-4">
            {div.pools.map(pool => {
              const standings = calculateStandings(pool.teamIds, div.teams, div.games.filter(g=>g.poolId===pool.id));
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
                        <th className="px-3 py-2 text-center font-bold">+/-</th>
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
                            <td className={`px-3 py-2.5 text-center font-bold ${s.pd>=0?"text-green-400":"text-red-400"}`}>{s.pd>0?"+":""}{s.pd}</td>
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

  if (tournament.bracketFormat === "none") {
    return (
      <div className="glass border border-white/10 rounded-2xl p-8 text-center">
        <Trophy className="w-10 h-10 text-gray-700 mx-auto mb-3"/>
        <h3 className="text-white font-bold mb-1">Pool Play Only</h3>
        <p className="text-gray-500 text-sm">This tournament uses pool play standings to determine the champion — no bracket play.</p>
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

  const formatLabel = tournament.bracketFormat === "double" ? "Double Elimination" : "Single Elimination";

  return (
    <div className="space-y-8">
      {tournament.bracketFormat === "double" && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2.5 text-sm text-blue-300">
          🔵 <strong>Double Elimination</strong> — teams must lose twice to be eliminated.
        </div>
      )}
      {tournament.divisions.map((div,divIdx) => {
        if (!div.bracketGenerated || div.bracket.length===0) {
          return (
            <div key={div.id} className="glass border border-white/10 rounded-2xl p-6 text-center">
              <Trophy className="w-10 h-10 text-gray-700 mx-auto mb-3"/>
              <h3 className="text-white font-bold mb-1">{div.name} Bracket</h3>
              <p className="text-xs text-gray-600 mb-3">{formatLabel}</p>
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

// ── TOURNAMENT DETAIL ─────────────────────────────────────────────────────────

type DetailTab = "schedule"|"standings"|"bracket";

function TournamentDetail({ tournament: init, onBack, onUpdate, contacts }: {
  tournament: Tournament; onBack: () => void; onUpdate: (t: Tournament) => void;
  contacts: RegistrationContact[];
}) {
  const [tournament, setTournament] = useState(init);
  const [tab, setTab] = useState<DetailTab>("schedule");
  const [editing, setEditing] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleUpdate = useCallback((updated: Tournament) => {
    saveTournament(updated); setTournament({...updated}); onUpdate(updated);
  }, [onUpdate]);

  const total = tournament.divisions.reduce((s,d)=>s+d.games.length,0);
  const done  = tournament.divisions.reduce((s,d)=>s+d.games.filter(g=>g.status==="completed").length,0);
  const teams = tournament.divisions.reduce((s,d)=>s+d.teams.length,0);
  const venueStr = tournament.venues?.filter(v=>v.trim()).join(" · ") || "";

  // Registration summary
  const regs = matchingRegs(contacts, tournament.name);
  const unimportedRegs = regs.filter(c => !teamImported(tournament, c.teamName!, c.division || ""));

  return (
    <div>
      {/* Header */}
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
            {tournament.date   && <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/>{tournament.date}</span>}
            {venueStr          && <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/>{venueStr}</span>}
            <span className="flex items-center gap-1"><Users className="w-3 h-3"/>{teams} teams · {tournament.courts} courts</span>
            {tournament.gamesGuaranteed > 0 && <span>{tournament.gamesGuaranteed} guaranteed</span>}
            {total > 0 && <span>{done}/{total} scored</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Import button — always visible, badge shows unimported count */}
          <button onClick={()=>setImporting(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 glass border rounded-lg text-xs font-bold transition-all relative ${
              unimportedRegs.length > 0
                ? "border-yellow-500/40 hover:border-yellow-500/70 text-yellow-400 hover:text-yellow-300"
                : "border-white/15 hover:border-white/25 text-gray-400 hover:text-white"
            }`}>
            <Download className="w-3.5 h-3.5"/>
            {unimportedRegs.length > 0 ? (
              <span>Import Teams <span className="bg-yellow-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded-full ml-1">{unimportedRegs.length}</span></span>
            ) : (
              <span>Import Teams</span>
            )}
          </button>
          <button onClick={()=>setEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 glass border border-white/15 hover:border-blue-500/40 text-gray-400 hover:text-white rounded-lg text-xs font-bold transition-all">
            <Edit className="w-3.5 h-3.5"/> Edit
          </button>
        </div>
      </div>

      {/* Unimported registrations banner */}
      {unimportedRegs.length > 0 && (
        <div className="mb-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl">📋</span>
          <div className="flex-1">
            <p className="text-yellow-300 font-bold text-sm">
              {unimportedRegs.length} unimported registration{unimportedRegs.length!==1?"s":""}
            </p>
            <p className="text-yellow-400/70 text-xs mt-0.5">
              Teams from your registration form haven&apos;t been added to this tournament manager yet.
            </p>
          </div>
          <button onClick={()=>setImporting(true)}
            className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded-lg transition-colors flex-shrink-0">
            Review →
          </button>
        </div>
      )}

      {/* All-imported confirmation */}
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

      {/* Info bar */}
      <div className="flex flex-wrap gap-2 mb-5">
        <span className="glass border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-400">
          🏀 {tournament.bracketFormat === "single" ? "Single Elim" : tournament.bracketFormat === "double" ? "Double Elim" : "Pool Play Only"}
        </span>
        <span className="glass border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-400">
          ✅ {tournament.gamesGuaranteed ?? 3} games guaranteed
        </span>
        <span className="glass border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-400">
          ⏱ {tournament.gameDuration}min games
        </span>
        {(tournament.venues?.length ?? 0) > 1 && (
          <span className="glass border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-400">
            📍 {tournament.venues.length} venues
          </span>
        )}
        {regs.length > 0 && (
          <span className="glass border border-yellow-500/20 rounded-lg px-3 py-1.5 text-xs text-yellow-400">
            📋 {regs.length} registered
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 mb-5">
        {(["schedule","standings","bracket"] as DetailTab[]).map(k=>(
          <button key={k} onClick={()=>setTab(k)}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${tab===k?"border-blue-500 text-blue-400":"border-transparent text-gray-500 hover:text-gray-300"}`}>
            {k==="schedule"?"📅 Schedule":k==="standings"?"📊 Standings":"🏆 Bracket"}
          </button>
        ))}
      </div>

      {tab==="schedule"  && <ScheduleView  tournament={tournament} onUpdate={handleUpdate}/>}
      {tab==="standings" && <StandingsView tournament={tournament}/>}
      {tab==="bracket"   && <BracketView   tournament={tournament} onUpdate={handleUpdate}/>}

      {editing && (
        <EditTournamentModal
          tournament={tournament}
          onSave={t => { handleUpdate(t); setEditing(false); }}
          onClose={() => setEditing(false)}
        />
      )}
      {importing && (
        <ImportPanel
          tournament={tournament}
          contacts={contacts}
          onImport={t => { handleUpdate(t); setImporting(false); }}
          onClose={() => setImporting(false)}
        />
      )}
    </div>
  );
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────

export function TourneyTab({ contacts = [] }: { contacts?: RegistrationContact[] }) {
  const [list, setList] = useState<Tournament[]>(() =>
    getAllTournaments().sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  );
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Tournament|null>(null);

  function handleCreated(t: Tournament) { setList(p=>[t,...p]); setCreating(false); setSelected(t); }
  function handleDelete(id: string) {
    if (!confirm("Delete this tournament? Cannot be undone.")) return;
    deleteT(id); setList(p=>p.filter(t=>t.id!==id));
    if (selected?.id===id) setSelected(null);
  }
  function handleUpdate(updated: Tournament) { setList(p=>p.map(t=>t.id===updated.id?updated:t)); }

  if (selected) return <TournamentDetail
    tournament={selected}
    contacts={contacts}
    onBack={()=>setSelected(null)}
    onUpdate={u=>{setSelected(u);handleUpdate(u);}}/>;

  const totalGames = (t: Tournament) => t.divisions.reduce((s,d)=>s+d.games.length,0);
  const doneGames  = (t: Tournament) => t.divisions.reduce((s,d)=>s+d.games.filter(g=>g.status==="completed").length,0);
  const totalTeams = (t: Tournament) => t.divisions.reduce((s,d)=>s+d.teams.length,0);

  // Registration stats per tournament
  function regCount(t: Tournament) { return matchingRegs(contacts, t.name).length; }
  function unimportedCount(t: Tournament) {
    return matchingRegs(contacts, t.name).filter(c => !teamImported(t, c.teamName!, c.division || "")).length;
  }

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
            const done=doneGames(t), total=totalGames(t);
            const pct = total>0?Math.round((done/total)*100):0;
            const venueStr = t.venues?.filter(v=>v.trim()).join(", ") || "";
            const regs = regCount(t);
            const unimported = unimportedCount(t);
            return (
              <div key={t.id} className={`glass border rounded-2xl p-4 transition-all ${unimported > 0 ? "border-yellow-500/25 hover:border-yellow-500/40" : "border-white/10 hover:border-white/20"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-white font-bold truncate">{t.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${S_COLOR[t.status]}`}>{S_LABEL[t.status]}</span>
                      {/* Registration badge */}
                      {unimported > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-300 flex items-center gap-1">
                          📋 {unimported} to import
                        </span>
                      )}
                      {regs > 0 && unimported === 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-500/15 text-green-400">
                          ✓ {regs} registered
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 text-xs text-gray-500 mb-1.5">
                      {t.date && <span>{t.date}</span>}
                      {venueStr && <span>{venueStr}</span>}
                      <span>{totalTeams(t)} teams · {t.divisions.length} div{t.divisions.length!==1?"s":""} · {t.courts} courts</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="text-[10px] bg-white/5 text-gray-500 px-2 py-0.5 rounded-md">
                        {t.bracketFormat==="single"?"Single Elim":t.bracketFormat==="double"?"Double Elim":"Pool Play Only"}
                      </span>
                      <span className="text-[10px] bg-white/5 text-gray-500 px-2 py-0.5 rounded-md">
                        {t.gamesGuaranteed??3} guaranteed
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
      {creating && <CreateWizard onCreated={handleCreated} onClose={()=>setCreating(false)} contacts={contacts}/>}
    </div>
  );
}
