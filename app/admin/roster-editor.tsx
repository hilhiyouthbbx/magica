"use client";

// Admin editor for the High School Team Roster page (/high-school-roster).
// Edits the roster in the Pages tab; the parent saves it with the Save button.

import type { SiteContent, RosterPlayer, RosterTeam } from "@/lib/content";

type Roster = SiteContent["hsRoster"];

const GRADES = ["8", "9", "10", "11", "12"];
const newId = () => Math.random().toString(36).slice(2, 10);
const input = "w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-blue-500 placeholder:text-gray-600";

function PlayerRows({ players, onChange, label }: { players: RosterPlayer[]; onChange: (p: RosterPlayer[]) => void; label: string }) {
  const set = (i: number, patch: Partial<RosterPlayer>) => onChange(players.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= players.length) return;
    const next = [...players];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {players.map((p, i) => (
        <div key={p.id} className="flex flex-wrap items-center gap-2">
          <input value={p.name} onChange={e => set(i, { name: e.target.value })} placeholder="Player name" aria-label={`${label} player ${i + 1} name`}
            className={`${input} flex-1 min-w-[160px]`} />
          <select value={p.grade} onChange={e => set(i, { grade: e.target.value })} aria-label={`${label} player ${i + 1} grade`}
            className="px-2 py-2 rounded-xl bg-gray-800 border border-white/15 text-white text-sm">
            {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
          </select>
          <label className="flex items-center gap-1 text-xs text-gray-300 cursor-pointer">
            <input type="checkbox" checked={!!p.swing} onChange={e => set(i, { swing: e.target.checked })} /> Swing
          </label>
          <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="px-2 py-1 rounded-lg bg-white/10 text-gray-300 text-xs disabled:opacity-30">&uarr;</button>
          <button type="button" onClick={() => move(i, 1)} disabled={i === players.length - 1} aria-label="Move down" className="px-2 py-1 rounded-lg bg-white/10 text-gray-300 text-xs disabled:opacity-30">&darr;</button>
          <button type="button" onClick={() => { if (confirm(`Remove ${p.name || "this player"}?`)) onChange(players.filter((_, j) => j !== i)); }}
            aria-label="Remove player" className="px-2 py-1 rounded-lg bg-red-500/20 text-red-300 text-xs hover:bg-red-500/30">Remove</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...players, { id: newId(), name: "", grade: players[players.length - 1]?.grade || "9" }])}
        className="px-3 py-1.5 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-200 text-xs font-bold hover:bg-blue-600/40">+ Add player</button>
    </div>
  );
}

export function RosterEditor({ roster, onChange }: { roster: Roster; onChange: (r: Roster) => void }) {
  const setTeam = (i: number, patch: Partial<RosterTeam>) => onChange({ ...roster, teams: roster.teams.map((t, j) => (j === i ? { ...t, ...patch } : t)) });
  const moveTeam = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= roster.teams.length) return;
    const next = [...roster.teams];
    [next[i], next[j]] = [next[j], next[i]];
    onChange({ ...roster, teams: next });
  };

  return (
    <div className="space-y-5">
      <label className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer w-fit">
        <input type="checkbox" checked={roster.enabled} onChange={e => onChange({ ...roster, enabled: e.target.checked })} />
        Show the roster page to the public
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-gray-400 text-xs font-semibold mb-1">Page title</label>
          <input className={input} value={roster.title} onChange={e => onChange({ ...roster, title: e.target.value })} placeholder="Hilhi Spartans" />
        </div>
        <div>
          <label className="block text-gray-400 text-xs font-semibold mb-1">Season line</label>
          <input className={input} value={roster.subtitle} onChange={e => onChange({ ...roster, subtitle: e.target.value })} placeholder="Boys Basketball - 2026-2027 Final Team Selections" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-gray-400 text-xs font-semibold mb-1">Footer line</label>
          <input className={input} value={roster.footer} onChange={e => onChange({ ...roster, footer: e.target.value })} placeholder="Earned. Never given." />
        </div>
      </div>

      {roster.teams.map((t, i) => (
        <div key={t.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <input className={`${input} flex-1 min-w-[180px] font-bold`} value={t.name} onChange={e => setTeam(i, { name: e.target.value })} placeholder="Team name (Varsity, JV, ...)" aria-label={`Team ${i + 1} name`} />
            <span className="text-gray-500 text-xs">{t.players.length} player{t.players.length !== 1 ? "s" : ""}</span>
            <button type="button" onClick={() => moveTeam(i, -1)} disabled={i === 0} aria-label="Move team up" className="px-2 py-1 rounded-lg bg-white/10 text-gray-300 text-xs disabled:opacity-30">&uarr;</button>
            <button type="button" onClick={() => moveTeam(i, 1)} disabled={i === roster.teams.length - 1} aria-label="Move team down" className="px-2 py-1 rounded-lg bg-white/10 text-gray-300 text-xs disabled:opacity-30">&darr;</button>
            <button type="button" onClick={() => { if (confirm(`Delete the whole "${t.name || "team"}" list (${t.players.length} players)?`)) onChange({ ...roster, teams: roster.teams.filter((_, j) => j !== i) }); }}
              className="px-2 py-1 rounded-lg bg-red-500/20 text-red-300 text-xs hover:bg-red-500/30">Delete team</button>
          </div>

          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Players</p>
            <PlayerRows players={t.players} onChange={players => setTeam(i, { players })} label={t.name || `Team ${i + 1}`} />
          </div>

          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Swing players (play up from another team)</p>
            <p className="text-gray-600 text-[11px] mb-2">These show in their own &quot;Swing Players&quot; block under this team.</p>
            <PlayerRows players={t.swingPlayers} onChange={swingPlayers => setTeam(i, { swingPlayers })} label={`${t.name || `Team ${i + 1}`} swing`} />
          </div>
        </div>
      ))}

      <button type="button" onClick={() => onChange({ ...roster, teams: [...roster.teams, { id: newId(), name: "", players: [], swingPlayers: [] }] })}
        className="px-4 py-2 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-200 text-sm font-bold hover:bg-blue-600/40">+ Add a team</button>

      <p className="text-gray-500 text-xs">Click <strong>Save</strong> below to publish your changes to the roster page.</p>
    </div>
  );
}
