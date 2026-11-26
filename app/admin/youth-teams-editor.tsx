"use client";

// Admin editor for the 2026-2027 Youth Teams page (/youth-coaches). Lives in the Pages tab and is saved with its Save button.

import type { ReactNode } from "react";
import type { YouthTeamsContent, YouthTeam, YouthPlayer } from "@/lib/youth-teams";

const GRADES = ["3", "4", "5", "6", "7", "8"];
const newId = () => Math.random().toString(36).slice(2, 10);
const input = "w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-blue-500 placeholder:text-gray-600";

export function YouthTeamsEditor({ data, onChange, renderImage }: {
  data: YouthTeamsContent;
  onChange: (d: YouthTeamsContent) => void;
  renderImage: (label: string, value: string, onChange: (v: string) => void) => ReactNode;
}) {
  const setTeam = (i: number, patch: Partial<YouthTeam>) => onChange({ ...data, teams: data.teams.map((t, j) => (j === i ? { ...t, ...patch } : t)) });
  const moveTeam = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= data.teams.length) return;
    const next = [...data.teams];
    [next[i], next[j]] = [next[j], next[i]];
    onChange({ ...data, teams: next });
  };
  const setPlayer = (ti: number, pi: number, patch: Partial<YouthPlayer>) =>
    setTeam(ti, { players: data.teams[ti].players.map((p, k) => (k === pi ? { ...p, ...patch } : p)) });
  const movePlayer = (ti: number, pi: number, d: -1 | 1) => {
    const list = [...data.teams[ti].players];
    const j = pi + d;
    if (j < 0 || j >= list.length) return;
    [list[pi], list[j]] = [list[j], list[pi]];
    setTeam(ti, { players: list });
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-gray-400 text-xs font-semibold mb-1">Page heading</label>
          <input className={input} value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} placeholder="2026-2027 Youth Teams" />
        </div>
        <div>
          <label className="block text-gray-400 text-xs font-semibold mb-1">Season label</label>
          <input className={input} value={data.season} onChange={e => onChange({ ...data, season: e.target.value })} placeholder="2026-2027 Season" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-gray-400 text-xs font-semibold mb-1">Intro text</label>
          <textarea rows={2} className={`${input} resize-none`} value={data.intro} onChange={e => onChange({ ...data, intro: e.target.value })} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer w-fit">
        <input type="checkbox" checked={data.showFullNames} onChange={e => onChange({ ...data, showFullNames: e.target.checked })} />
        Show players&apos; full names on the public page <span className="text-gray-500 text-xs">(unticked = first name and last initial, e.g. &quot;Amir K.&quot;)</span>
      </label>

      {data.teams.map((t, ti) => (
        <div key={t.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <input className={`${input} flex-1 min-w-[180px] font-bold`} value={t.name} onChange={e => setTeam(ti, { name: e.target.value })} placeholder="Team name (e.g. 5th Grade)" aria-label={`Team ${ti + 1} name`} />
            <span className="text-gray-500 text-xs">{t.players.length} player{t.players.length !== 1 ? "s" : ""}</span>
            <button type="button" onClick={() => moveTeam(ti, -1)} disabled={ti === 0} aria-label="Move team up" className="px-2 py-1 rounded-lg bg-white/10 text-gray-300 text-xs disabled:opacity-30">&uarr;</button>
            <button type="button" onClick={() => moveTeam(ti, 1)} disabled={ti === data.teams.length - 1} aria-label="Move team down" className="px-2 py-1 rounded-lg bg-white/10 text-gray-300 text-xs disabled:opacity-30">&darr;</button>
            <button type="button" onClick={() => { if (confirm(`Delete the whole "${t.name || "team"}" (${t.players.length} players)?`)) onChange({ ...data, teams: data.teams.filter((_, j) => j !== ti) }); }}
              className="px-2 py-1 rounded-lg bg-red-500/20 text-red-300 text-xs hover:bg-red-500/30">Delete team</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 text-xs font-semibold mb-1">Head coach</label>
              <input className={input} value={t.coach} onChange={e => setTeam(ti, { coach: e.target.value })} placeholder="Coach name" aria-label={`${t.name} head coach`} />
            </div>
            <div>
              <label className="block text-gray-400 text-xs font-semibold mb-1">Assistant coach (optional)</label>
              <input className={input} value={t.assistant} onChange={e => setTeam(ti, { assistant: e.target.value })} placeholder="Assistant coach name" aria-label={`${t.name} assistant coach`} />
            </div>
          </div>

          <div>{renderImage("Team picture", t.photoUrl, v => setTeam(ti, { photoUrl: v }))}</div>

          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Players</p>
            <div className="space-y-2">
              {t.players.map((p, pi) => (
                <div key={p.id} className="flex flex-wrap items-center gap-2">
                  <input value={p.name} onChange={e => setPlayer(ti, pi, { name: e.target.value })} placeholder="Player name" aria-label={`${t.name} player ${pi + 1} name`} className={`${input} flex-1 min-w-[160px]`} />
                  <select value={p.grade} onChange={e => setPlayer(ti, pi, { grade: e.target.value })} aria-label={`${t.name} player ${pi + 1} grade`}
                    className="px-2 py-2 rounded-xl bg-gray-800 border border-white/15 text-white text-sm">
                    {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
                  </select>
                  <button type="button" onClick={() => movePlayer(ti, pi, -1)} disabled={pi === 0} aria-label="Move up" className="px-2 py-1 rounded-lg bg-white/10 text-gray-300 text-xs disabled:opacity-30">&uarr;</button>
                  <button type="button" onClick={() => movePlayer(ti, pi, 1)} disabled={pi === t.players.length - 1} aria-label="Move down" className="px-2 py-1 rounded-lg bg-white/10 text-gray-300 text-xs disabled:opacity-30">&darr;</button>
                  <button type="button" onClick={() => { if (confirm(`Remove ${p.name || "this player"}?`)) setTeam(ti, { players: t.players.filter((_, k) => k !== pi) }); }}
                    aria-label="Remove player" className="px-2 py-1 rounded-lg bg-red-500/20 text-red-300 text-xs hover:bg-red-500/30">Remove</button>
                </div>
              ))}
              <button type="button" onClick={() => setTeam(ti, { players: [...t.players, { id: newId(), name: "", grade: t.players[t.players.length - 1]?.grade || "5" }] })}
                className="px-3 py-1.5 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-200 text-xs font-bold hover:bg-blue-600/40">+ Add player</button>
            </div>
          </div>
        </div>
      ))}

      <button type="button" onClick={() => onChange({ ...data, teams: [...data.teams, { id: newId(), name: "", coach: "", assistant: "", photoUrl: "", players: [] }] })}
        className="px-4 py-2 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-200 text-sm font-bold hover:bg-blue-600/40">+ Add a team</button>

      <p className="text-gray-500 text-xs">Click <strong>Save</strong> below to publish your changes. Upload a team picture first, then save.</p>
    </div>
  );
}
