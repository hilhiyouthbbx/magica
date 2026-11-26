"use client";

export const dynamic = "force-dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

interface Game { date: string; opp: string; games: Record<string, string> }
interface View { title: string; intro: string; games: Game[]; bookings: Record<string, string[]>; slots: number; teams: Record<string, string> }

const PW_KEY = "hilhi-concession-pw";
const TEAMS_KEY = "hilhi-concession-teams";

const mins = (t: string) => (t === "TBD" ? null : Number(t.slice(0, 2)) * 60 + Number(t.slice(3)));
const fmt = (m: number | null) => (m === null ? "TBD" : `${Math.floor(m / 60) % 12 || 12}:${String(m % 60).padStart(2, "0")} ${m >= 720 ? "PM" : "AM"}`);

function Slot({ label, value, enabled, onClaim, onRelease }: {
  label: string; value: string; enabled: boolean; onClaim: (name: string) => void; onRelease: () => void;
}) {
  const [draft, setDraft] = useState("");
  if (value) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-[11px] text-gray-400">{label}</span>
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
          <span className="text-emerald-200 text-sm font-semibold break-words">{value}</span>
          <button type="button" onClick={() => { if (confirm(`Remove ${value} from this spot?`)) onRelease(); }}
            className="text-[11px] text-gray-400 hover:text-red-300 underline whitespace-nowrap print:hidden">Remove</button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] text-gray-400">{label}</span>
      <div className="flex gap-1 print:hidden">
        <input value={draft} disabled={!enabled} onChange={e => setDraft(e.target.value)} placeholder="Type name" aria-label={label}
          onKeyDown={e => { if (e.key === "Enter" && draft.trim()) { onClaim(draft); setDraft(""); } }}
          className="min-w-0 flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-white text-sm placeholder-gray-600 disabled:opacity-40 focus:outline-none focus:border-blue-500" />
        <button type="button" disabled={!enabled || !draft.trim()} onClick={() => { onClaim(draft); setDraft(""); }}
          className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed">Sign up</button>
      </div>
      <span className="hidden print:block h-6 border-b border-gray-400" />
    </div>
  );
}

export default function ConcessionsPage() {
  const [pw, setPw] = useState("");
  const [typed, setTyped] = useState("");
  const [view, setView] = useState<View | null>(null);
  const [msg, setMsg] = useState("");
  const [closed, setClosed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mine, setMine] = useState<string[]>([]);
  const [filter, setFilter] = useState<"all" | "eligible" | "double">("all");

  const load = useCallback(async (password: string, quiet = false) => {
    try {
      const r = await fetch("/api/concessions", { headers: { "x-concession-password": password }, cache: "no-store" });
      if (r.status === 403) { setClosed(true); setView(null); return false; }
      if (r.status === 401) { if (!quiet) setMsg("That password is not right. Please try again."); sessionStorage.removeItem(PW_KEY); setView(null); return false; }
      const d = await r.json();
      setView(d); setPw(password); setMsg(""); setClosed(false);
      sessionStorage.setItem(PW_KEY, password);
      return true;
    } catch { if (!quiet) setMsg("Could not reach the server. Please try again."); return false; }
  }, []);

  useEffect(() => {
    try { setMine(JSON.parse(localStorage.getItem(TEAMS_KEY) || "[]")); } catch { /* ignore */ }
    const saved = sessionStorage.getItem(PW_KEY);
    if (saved) load(saved, true); else fetch("/api/concessions").then(r => { if (r.status === 403) setClosed(true); }).catch(() => {});
  }, [load]);

  // keep names fresh while the page stays open
  useEffect(() => {
    if (!view || !pw) return;
    const t = setInterval(() => load(pw, true), 30000);
    return () => clearInterval(t);
  }, [view, pw, load]);

  async function unlock(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg("");
    await load(typed.trim());
    setBusy(false);
  }

  async function act(action: "claim" | "release", id: string, slot: number, name?: string) {
    setMsg("");
    const r = await fetch("/api/concessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, id, slot, name, password: pw }) });
    const d = await r.json().catch(() => ({}));
    if (d.games) setView(d);
    if (!r.ok) setMsg(d.error || "Something went wrong. Please try again.");
  }

  function toggleTeam(k: string) {
    const next = mine.includes(k) ? mine.filter(x => x !== k) : [...mine, k];
    setMine(next);
    try { localStorage.setItem(TEAMS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }

  const days = useMemo(() => {
    if (!view) return [];
    const out: { game: Game; double: boolean; rows: { id: string; t: number | null; same: string[]; blocked: boolean; pending: boolean; ok: boolean }[] }[] = [];
    for (const d of view.games) {
      const g = Object.entries(d.games).map(([k, t]) => ({ k, t: mins(t) }));
      const double = g.some(x => x.k[0] === "b") && g.some(x => x.k[0] === "g");
      if (filter === "double" && !double) continue;
      const rows = [];
      for (const t of [...new Set(g.map(x => x.t))].sort((a, b) => (a ?? 9999) - (b ?? 9999))) {
        const same = g.filter(x => x.t === t).map(x => x.k);
        const blocked = g.some(x => mine.includes(x.k) && (t === null || x.t === null || (t - 20 < x.t + 90 && t + 90 > x.t)));
        const pending = t === null || g.some(x => x.t === null && mine.includes(x.k));
        const ok = mine.length > 0 && !blocked && !pending;
        if (filter === "eligible" && !ok) continue;
        rows.push({ id: `${d.date}-${t}`, t, same, blocked, pending, ok });
      }
      if (rows.length) out.push({ game: d, double, rows });
    }
    return out;
  }, [view, mine, filter]);

  const shell = (children: React.ReactNode) => (
    <main className="min-h-screen bg-[#080D1A]">
      <style>{`@media print { header, footer, nav { display: none !important; } main { background: #fff !important; } main * { color: #000 !important; background: #fff !important; border-color: #bbb !important; } }`}</style>
      <Navbar />
      {children}
      <Footer />
    </main>
  );

  if (!view) {
    return shell(
      <section className="max-w-md mx-auto px-4 pt-36 pb-24">
        <div className="glass rounded-2xl border border-white/15 p-8">
          <h1 className="text-2xl font-black text-white mb-2">Concession Sign-Up</h1>
          {closed ? (
            <p className="text-gray-400 text-sm">Concession sign-up is not open right now. Please check back soon.</p>
          ) : (
            <form onSubmit={unlock} className="space-y-4">
              <p className="text-gray-400 text-sm">This page is for Hilhi basketball families. Enter the password you were given.</p>
              <input type="password" value={typed} onChange={e => setTyped(e.target.value)} placeholder="Password" autoFocus aria-label="Password"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
              {msg && <p className="text-red-400 text-sm">{msg}</p>}
              <button disabled={busy || !typed.trim()} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#006aff] to-[#00aaff] text-white font-black disabled:opacity-50">
                {busy ? "Checking..." : "Open sign-up"}
              </button>
            </form>
          )}
        </div>
      </section>
    );
  }

  return shell(
    <>
      <section className="pt-32 pb-6 bg-[#102c59]/60">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-blue-300 text-xs font-bold tracking-[0.25em] uppercase mb-2">Hilhi Spartans &middot; 2026&ndash;2027</p>
          <h1 className="text-3xl sm:text-4xl font-black text-white">{view.title}</h1>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <div className="glass rounded-2xl border border-white/10 p-5 space-y-3 print:hidden">
          <p className="text-white font-semibold">Four volunteer spaces per game</p>
          <p className="text-gray-400 text-sm">Pick your athlete&apos;s team(s), then type your name in an open space and press <strong>Sign up</strong>. Girls-only dates are not shown.</p>
          {view.intro && <p className="text-amber-300 text-sm font-semibold">{view.intro}</p>}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {Object.entries(view.teams).map(([k, v]) => (
              <label key={k} className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer">
                <input type="checkbox" checked={mine.includes(k)} onChange={() => toggleTeam(k)} className="w-4 h-4" /> {v}
              </label>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-gray-300">Show{" "}
              <select value={filter} onChange={e => setFilter(e.target.value as typeof filter)} className="ml-1 px-2 py-1.5 rounded-lg bg-gray-800 border border-white/15 text-white text-sm">
                <option value="all">All games</option>
                <option value="eligible">Eligible games only</option>
                <option value="double">Doubleheaders only</option>
              </select>
            </label>
            <button type="button" onClick={() => window.print()} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 text-sm font-semibold">Print schedule</button>
          </div>
          <p className="text-gray-500 text-xs">Games are estimated at 90 minutes. Conflict checks include the 20-minute early arrival; away-game travel is not checked. Games that start at the same time share the four spaces.</p>
        </div>

        {msg && <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">{msg}</div>}

        {days.length === 0 && <p className="text-gray-400 py-8 text-center">{mine.length ? "No games match that filter." : "Select your athlete's team(s) above to see where you can sign up."}</p>}

        {days.map(({ game, double, rows }) => (
          <section key={game.date} className="glass rounded-2xl border border-white/10 p-5 break-inside-avoid">
            <h2 className="text-lg font-black text-white mb-1">
              {new Date(game.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" })} &middot; {game.opp}{" "}
              {double && <span className="ml-1 text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 align-middle">Doubleheader</span>}
            </h2>
            {rows.map(r => {
              const filled = (view.bookings[r.id] || []).filter(Boolean).length;
              return (
                <div key={r.id} className="grid grid-cols-1 lg:grid-cols-[220px_repeat(4,minmax(0,1fr))] gap-3 border-t border-white/10 py-4">
                  <div>
                    <div className="text-white font-bold">{fmt(r.t)}{r.t === null ? "" : ` - ${fmt(r.t + 90)}`}</div>
                    <div className="text-blue-300 text-sm font-semibold">{r.t === null ? "Arrival TBD" : `Volunteer arrival: ${fmt(r.t - 20)}`}</div>
                    <div className="text-gray-300 text-sm">{r.same.map(k => view.teams[k]).join(" / ")}</div>
                    <div className={`text-xs mt-1 ${r.blocked || r.pending ? "text-red-400" : "text-gray-500"}`}>
                      {r.pending ? "Pending game time" : r.blocked ? "Game conflict" : !mine.length ? "Select athlete team(s) to sign up" : "Available to your team"} &middot; {filled}/{view.slots} filled
                    </div>
                  </div>
                  {Array.from({ length: view.slots }).map((_, i) => (
                    <Slot key={i} label={`Volunteer ${i + 1}`} value={(view.bookings[r.id] || [])[i] || ""} enabled={r.ok}
                      onClaim={name => act("claim", r.id, i, name)} onRelease={() => act("release", r.id, i)} />
                  ))}
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </>
  );
}
