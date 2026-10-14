"use client";
import { useMemo, useState } from "react";
import { Download, X } from "lucide-react";

interface Props {
  adminKey:     string;
  contacts:     { source: string }[];
  sourceLabels: Record<string, string>;
  sortField:    string;
  sortDir:      string;
  onClose:      () => void;
}

export function ExportSourcesModal({ adminKey, contacts, sourceLabels, sortField, sortDir, onClose }: Props) {
  // Group raw source values by display label so duplicates collapse into one checkbox.
  const groups = useMemo(() => {
    const m = new Map<string, { label: string; raw: Set<string>; count: number }>();
    for (const c of contacts) {
      const raw   = c.source || "other";
      const label = sourceLabels[raw] || raw;
      const g = m.get(label) ?? { label, raw: new Set<string>(), count: 0 };
      g.raw.add(raw); g.count += 1; m.set(label, g);
    }
    return [...m.values()].sort((a, b) => b.count - a.count);
  }, [contacts, sourceLabels]);

  const [picked, setPicked] = useState<Set<string>>(new Set());
  const toggle = (label: string) => setPicked(p => { const n = new Set(p); n.has(label) ? n.delete(label) : n.add(label); return n; });

  const chosen   = groups.filter(g => picked.has(g.label));
  const rawList  = chosen.flatMap(g => [...g.raw]);
  const total    = chosen.reduce((s, g) => s + g.count, 0);
  const href     = `/api/admin/contacts/download?key=${encodeURIComponent(adminKey)}&sources=${encodeURIComponent(rawList.join(","))}&sort=${sortField}&dir=${sortDir}`;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass rounded-2xl border border-white/15 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h3 className="text-white font-black text-lg">Export by Source</h3>
            <p className="text-gray-500 text-xs mt-0.5">Check the sources you want in one CSV file.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-3">
          <div className="flex gap-3 text-xs">
            <button type="button" onClick={() => setPicked(new Set(groups.map(g => g.label)))} className="text-blue-400 hover:text-blue-300 font-semibold">Select all</button>
            <button type="button" onClick={() => setPicked(new Set())} className="text-gray-500 hover:text-gray-300 font-semibold">Clear</button>
          </div>

          <div className="space-y-2">
            {groups.map(g => (
              <label key={g.label} className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${picked.has(g.label) ? "bg-green-500/10 border-green-500/40" : "bg-white/5 border-white/10 hover:border-white/25"}`}>
                <span className="flex items-center gap-3">
                  <input type="checkbox" checked={picked.has(g.label)} onChange={() => toggle(g.label)} className="w-4 h-4 accent-green-600" />
                  <span className="text-white text-sm font-semibold">{g.label}</span>
                </span>
                <span className="text-gray-500 text-xs">{g.count}</span>
              </label>
            ))}
          </div>

          {picked.size === 0 ? (
            <div className="w-full text-center py-3 rounded-xl bg-white/5 text-gray-600 text-sm font-semibold">Pick at least one source</div>
          ) : (
            <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => setTimeout(onClose, 300)}
              className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-xl transition-all">
              <Download className="w-4 h-4" />
              Download {total} contact{total === 1 ? "" : "s"} ({picked.size} source{picked.size === 1 ? "" : "s"})
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
