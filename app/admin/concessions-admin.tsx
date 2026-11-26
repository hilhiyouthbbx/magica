"use client";

// Admin controls for the Concession Sign-Up page (/concessions): set the parent password, open or close
// the page, and see or fix who signed up. Saves on its own (does not use the Pages tab Save buttons).

import { useCallback, useEffect, useState } from "react";

interface Game { date: string; opp: string; games: Record<string, string> }
interface Data { enabled: boolean; password: string; title: string; intro: string; games: Game[]; bookings: Record<string, string[]> }

const TEAMS: Record<string, string> = { bf: "Boys JV2", bj: "Boys JV", bv: "Boys Varsity", gj: "Girls JV", gv: "Girls Varsity" };
const mins = (t: string) => (t === "TBD" ? null : Number(t.slice(0, 2)) * 60 + Number(t.slice(3)));
const fmt = (m: number | null) => (m === null ? "TBD" : `${Math.floor(m / 60) % 12 || 12}:${String(m % 60).padStart(2, "0")} ${m >= 720 ? "PM" : "AM"}`);
const input = "w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-blue-500 placeholder:text-gray-600";

export function ConcessionsAdmin({ adminKey }: { adminKey: string }) {
  const [d, setD] = useState<Data | null>(null);
  const [pw, setPw] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [title, setTitle] = useState("");
  const [intro, setIntro] = useState("");
  const [show, setShow] = useState(false);
  const [note, setNote] = useState<{ t: string; bad?: boolean } | null>(null);
  const url = `/api/admin/concessions?key=${encodeURIComponent(adminKey)}`;

  const apply = (x: Data, keepForm = false) => {
    setD(x);
    if (!keepForm) { setPw(x.password); setEnabled(x.enabled); setTitle(x.title); setIntro(x.intro); }
  };
  const load = useCallback(async () => {
    const r = await fetch(url, { cache: "no-store" });
    if (r.ok) apply(await r.json());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);
  useEffect(() => { load(); }, [load]);

  async function post(body: Record<string, unknown>, ok?: string) {
    setNote(null);
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) { setNote({ t: "Could not save. Please try again.", bad: true }); return; }
    apply(await r.json(), body.action !== "settings");
    if (ok) setNote({ t: ok });
  }

  function makePassword() {
    const words = ["spartan", "hoops", "court", "huddle", "tipoff", "dunk", "bucket", "blue"];
    setPw(`${words[Math.floor(Math.random() * words.length)]}${words[Math.floor(Math.random() * words.length)]}${Math.floor(10 + Math.random() * 89)}`);
    setShow(true);
  }

  function exportCsv() {
    if (!d) return;
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [["Date", "Opponent", "Time", "Teams", "Volunteer 1", "Volunteer 2", "Volunteer 3", "Volunteer 4"].map(esc).join(",")];
    d.games.forEach(g => {
      [...new Set(Object.values(g.games))].forEach(t => {
        const m = mins(t); const id = `${g.date}-${m}`;
        const teams = Object.entries(g.games).filter(([, x]) => x === t).map(([k]) => TEAMS[k]).join(" / ");
        const b = d.bookings[id] || [];
        lines.push([g.date, g.opp, fmt(m), teams, b[0] || "", b[1] || "", b[2] || "", b[3] || ""].map(esc).join(","));
      });
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }));
    a.download = "concession-signups.csv";
    document.body.appendChild(a); a.click(); a.remove();
  }

  if (!d) return <div className="text-gray-500 text-sm">Loading...</div>;
  const total = Object.values(d.bookings).reduce((n, a) => n + a.filter(Boolean).length, 0);
  const dirty = pw !== d.password || enabled !== d.enabled || title !== d.title || intro !== d.intro;

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
        <label className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer w-fit">
          <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} /> Page is open to families
        </label>
        <div>
          <label className="block text-gray-400 text-xs font-semibold mb-1">Password for parents</label>
          <div className="flex flex-wrap gap-2">
            <input className={`${input} flex-1 min-w-[200px]`} type={show ? "text" : "password"} value={pw} onChange={e => setPw(e.target.value)} placeholder="Type a password" autoComplete="off" />
            <button type="button" onClick={() => setShow(s => !s)} className="px-3 py-2 rounded-xl bg-white/10 text-gray-200 text-xs font-semibold">{show ? "Hide" : "Show"}</button>
            <button type="button" onClick={makePassword} className="px-3 py-2 rounded-xl bg-white/10 text-gray-200 text-xs font-semibold">Make one for me</button>
          </div>
          <p className="text-gray-500 text-xs mt-1">Capital letters don&apos;t matter. With no password, the page stays closed. Changing it signs everyone out the next time their page refreshes.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="block text-gray-400 text-xs font-semibold mb-1">Page title</label><input className={input} value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div><label className="block text-gray-400 text-xs font-semibold mb-1">Notice shown above the schedule</label><input className={input} value={intro} onChange={e => setIntro(e.target.value)} /></div>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" disabled={!dirty} onClick={() => post({ action: "settings", enabled, password: pw, title, intro }, "Saved.")}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-bold">Save settings</button>
          {note && <span className={`text-sm ${note.bad ? "text-red-400" : "text-emerald-400"}`}>{note.t}</span>}
          <a href="/concessions" target="_blank" rel="noreferrer" className="ml-auto text-blue-300 text-xs underline">Open the page</a>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-gray-300 text-sm"><strong className="text-white">{total}</strong> volunteer spots filled</span>
        <button type="button" onClick={exportCsv} className="px-3 py-1.5 rounded-lg bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 text-xs font-bold">Download (Excel)</button>
        <button type="button" disabled={total === 0} onClick={() => { if (confirm(`Clear all ${total} sign-ups for every game? This cannot be undone.`)) post({ action: "clearAll" }, "All sign-ups cleared."); }}
          className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-xs font-bold disabled:opacity-30">Clear all</button>
        <button type="button" onClick={load} className="px-3 py-1.5 rounded-lg bg-white/10 text-gray-300 text-xs font-semibold">Refresh</button>
      </div>

      <div className="space-y-3">
        {d.games.map(g => (
          <div key={g.date} className="rounded-xl border border-white/10 p-3">
            <div className="text-white font-bold text-sm mb-2">{new Date(g.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} &middot; {g.opp}</div>
            {[...new Set(Object.values(g.games))].map(t => {
              const m = mins(t); const id = `${g.date}-${m}`; const b = d.bookings[id] || [];
              const teams = Object.entries(g.games).filter(([, x]) => x === t).map(([k]) => TEAMS[k]).join(" / ");
              return (
                <div key={id} className="grid grid-cols-1 lg:grid-cols-[200px_repeat(4,minmax(0,1fr))] gap-2 py-2 border-t border-white/5 items-center">
                  <div className="text-gray-300 text-xs"><strong className="text-white">{fmt(m)}</strong> &middot; {teams}</div>
                  {[0, 1, 2, 3].map(i => (
                    <SlotEdit key={`${id}-${i}-${b[i] || ""}`} value={b[i] || ""} label={`${g.opp} ${fmt(m)} volunteer ${i + 1}`} onSave={name => post({ action: "setSlot", id, slot: i, name })} />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <p className="text-gray-500 text-xs">Type in a box and click away to change a name. Empty a box to free that spot.</p>
    </div>
  );
}

function SlotEdit({ value, label, onSave }: { value: string; label: string; onSave: (n: string) => void }) {
  const [v, setV] = useState(value);
  return <input className={input} value={v} placeholder="open" aria-label={label} onChange={e => setV(e.target.value)} onBlur={() => { if (v.trim() !== value) onSave(v); }} />;
}
