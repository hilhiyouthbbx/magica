"use client";

// Admin: how many blank garments are left, by color and size. Edit the numbers and press Save.

import { useCallback, useEffect, useState } from "react";

const SIZES = ["YS", "YM", "YL", "AXS", "AS", "AM", "AL", "AXL", "A2XL", "A3XL"];
interface Row { id: string; label: string; counts: Record<string, number> }
interface Stock { rows: Row[]; updatedAt: string }
const newId = () => Math.random().toString(36).slice(2, 10);
const cell = "w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/15 text-white text-sm text-center focus:outline-none focus:border-blue-500";

export function MerchStockAdmin({ adminKey }: { adminKey: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [saved, setSaved] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [note, setNote] = useState<{ t: string; bad?: boolean } | null>(null);
  const url = `/api/admin/merch-stock?key=${encodeURIComponent(adminKey)}`;

  const load = useCallback(async () => {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return;
    const d: Stock = await r.json();
    setRows(d.rows); setSaved(JSON.stringify(d.rows)); setUpdatedAt(d.updatedAt || "");
  }, [url]);
  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!rows) return;
    setNote(null);
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows }) });
    if (!r.ok) { setNote({ t: "Could not save. Please try again.", bad: true }); return; }
    const d: Stock = await r.json();
    setRows(d.rows); setSaved(JSON.stringify(d.rows)); setUpdatedAt(d.updatedAt); setNote({ t: "Saved." });
  }

  if (!rows) return <div className="text-gray-500 text-sm">Loading...</div>;
  const set = (i: number, patch: Partial<Row>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const setCount = (i: number, sz: string, v: string) => {
    const n = Math.max(0, Math.min(9999, Math.floor(Number(v) || 0)));
    const counts = { ...rows[i].counts };
    if (n > 0) counts[sz] = n; else delete counts[sz];
    set(i, { counts });
  };
  const rowTotal = (r: Row) => SIZES.reduce((n, s) => n + (r.counts[s] || 0), 0);
  const colTotal = (s: string) => rows.reduce((n, r) => n + (r.counts[s] || 0), 0);
  const grand = rows.reduce((n, r) => n + rowTotal(r), 0);
  const dirty = JSON.stringify(rows) !== saved;

  return (
    <div className="space-y-4">
      <p className="text-gray-400 text-sm">Blank garments left, by color and size. Any design can go on any garment, so this is counted by garment, not by design. This is for your records and does not change what customers can order.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[820px]">
          <thead>
            <tr className="text-gray-400 text-xs">
              <th className="text-left px-2 py-2 w-48">Garment</th>
              {SIZES.map(s => <th key={s} className="px-1 py-2 w-16">{s}</th>)}
              <th className="px-2 py-2 w-16">Total</th>
              <th className="w-16" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="border-t border-white/5">
                <td className="px-2 py-1.5"><input className={`${cell} text-left`} value={r.label} onChange={e => set(i, { label: e.target.value })} placeholder="e.g. Black Hoodies" aria-label={`Garment ${i + 1} name`} /></td>
                {SIZES.map(s => (
                  <td key={s} className="px-1 py-1.5">
                    <input className={cell} type="number" min="0" inputMode="numeric" value={r.counts[s] ?? ""} placeholder="-" aria-label={`${r.label || "Garment"} ${s}`} onChange={e => setCount(i, s, e.target.value)} />
                  </td>
                ))}
                <td className="px-2 py-1.5 text-center font-bold text-white">{rowTotal(r)}</td>
                <td className="px-1 py-1.5"><button type="button" onClick={() => { if (confirm(`Remove "${r.label || "this row"}"?`)) setRows(rows.filter((_, j) => j !== i)); }} className="px-2 py-1 rounded-lg bg-red-500/20 text-red-300 text-xs hover:bg-red-500/30">Remove</button></td>
              </tr>
            ))}
            <tr className="border-t border-white/15">
              <td className="px-2 py-2 text-gray-300 font-bold">Total left</td>
              {SIZES.map(s => <td key={s} className="px-1 py-2 text-center text-gray-300 font-semibold">{colTotal(s)}</td>)}
              <td className="px-2 py-2 text-center font-black text-emerald-300">{grand}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setRows([...rows, { id: newId(), label: "", counts: {} }])} className="px-3 py-1.5 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-200 text-xs font-bold hover:bg-blue-600/40">+ Add a garment or color</button>
        <button type="button" disabled={!dirty} onClick={save} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-bold">Save inventory</button>
        {dirty && <span className="text-amber-300 text-xs">Unsaved changes</span>}
        {note && <span className={`text-sm ${note.bad ? "text-red-400" : "text-emerald-400"}`}>{note.t}</span>}
        {updatedAt && !dirty && <span className="text-gray-500 text-xs">Last saved {new Date(updatedAt).toLocaleString("en-US")}</span>}
      </div>
      <p className="text-gray-500 text-xs">A blank box means none left. Counts only change when you edit them here.</p>
    </div>
  );
}
