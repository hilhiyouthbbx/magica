"use client";

// Tryout check-in sheet: filter by grade, tick "Checked in" as kids arrive, and tick "Paid" once you
// have confirmed the PayPal/Venmo money landed (optionally emailing the parent a receipt).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Contact } from "@/lib/contacts";
import { TryoutReminderModal } from "./tryout-reminder";

const ordinal = (n: number) => (n % 100 >= 11 && n % 100 <= 13) ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] || "th";
const gradeNum = (g?: string) => { const m = /(\d+)/.exec(g || ""); return m ? Number(m[1]) : 0; };
const gradeName = (n: number) => n ? `${n}${ordinal(n)} Grade` : "Grade not set";

const isPaid = (c: Contact) => /^paid/i.test(c.paymentStatus || "");
const isFree = (c: Contact) => /^free/i.test(c.paymentStatus || "");
const qtyOf = (c: Contact) => { const m = /Qty:\s*(\d+)/i.exec(c.notes || ""); return m ? Number(m[1]) : 1; };
const methodOf = (c: Contact) => {
  const t = `${c.paymentStatus || ""} ${c.notes || ""}`;
  return /paypal/i.test(t) ? "PayPal" : /venmo/i.test(t) ? "Venmo" : "";
};
const canEmail = (c: Contact) => !!(c.email && c.email.includes("@") && !c.email.includes("noemail"));

type View = "all" | "notin" | "in" | "unpaid";

export function TryoutCheckin({ adminKey }: { adminKey: string }) {
  const [all, setAll] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [grade, setGrade] = useState<number | "all">("all");
  const [view, setView] = useState<View>("all");
  const [q, setQ] = useState("");
  const [emailReceipts, setEmailReceipts] = useState(true);
  const [reminderTo, setReminderTo] = useState<Contact[] | null>(null);
  const [toast, setToast] = useState<{ msg: string; bad?: boolean } | null>(null);
  const busy = useRef(0);

  useEffect(() => {
    try { const v = localStorage.getItem("hilhi_tryout_email_receipts"); if (v !== null) setEmailReceipts(v === "1"); } catch { /* ignore */ }
  }, []);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/admin/contacts?key=${encodeURIComponent(adminKey)}`, { cache: "no-store" });
      const d = await r.json();
      if (Array.isArray(d.contacts) && busy.current === 0) setAll(d.contacts);
    } catch { /* keep what we have */ }
    setLoading(false);
  }, [adminKey]);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000); // pick up new registrations
    return () => clearInterval(t);
  }, [load]);

  const say = (msg: string, bad = false) => { setToast({ msg, bad }); setTimeout(() => setToast(t => (t && t.msg === msg ? null : t)), 5000); };

  const tryouts = useMemo(() => all.filter(c => (c.source || "").toLowerCase() === "tryout"), [all]);

  const patchContact = (id: string, patch: Partial<Contact>) =>
    setAll(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)));

  async function save(id: string, patch: Partial<Contact>, notify = false) {
    busy.current++;
    try {
      const r = await fetch(`/api/admin/contacts?key=${encodeURIComponent(adminKey)}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", id, patch, notify }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) throw new Error("save failed");
      return d as { ok: boolean; emailed?: boolean; emailTo?: string; emailError?: string };
    } finally { busy.current--; }
  }

  async function toggleCheckIn(c: Contact) {
    const was = !!c.tryoutCheckedIn;
    const next = was ? "" : new Date().toISOString();
    patchContact(c.id, { tryoutCheckedIn: next });
    try { await save(c.id, { tryoutCheckedIn: next }); }
    catch { patchContact(c.id, { tryoutCheckedIn: c.tryoutCheckedIn || "" }); say("Couldn't save that check-in. Please try again.", true); }
  }

  async function togglePaid(c: Contact) {
    if (isFree(c)) return;
    if (isPaid(c)) {
      if (!confirm(`Mark ${c.camperName || c.name} as NOT paid?`)) return;
      const status = `Pending - ${methodOf(c) || "Unconfirmed"}`;
      patchContact(c.id, { paymentStatus: status });
      try { await save(c.id, { paymentStatus: status }); }
      catch { patchContact(c.id, { paymentStatus: c.paymentStatus }); say("Couldn't save that change. Please try again.", true); }
      return;
    }
    const notify = emailReceipts && canEmail(c);
    if (notify && !confirm(`Mark ${c.camperName || c.name} as Paid and email a payment receipt to ${c.email}?`)) return;
    patchContact(c.id, { paymentStatus: "Paid" });
    try {
      const d = await save(c.id, { paymentStatus: "Paid" }, notify);
      if (notify) {
        if (d.emailed) say(`Paid. Receipt emailed to ${d.emailTo}.`);
        else say(`Marked Paid, but the receipt email could not be sent${d.emailError ? ` (${d.emailError})` : ""}.`, true);
      }
    } catch { patchContact(c.id, { paymentStatus: c.paymentStatus }); say("Couldn't save that change. Please try again.", true); }
  }

  const gradeCounts = useMemo(() => {
    const m = new Map<number, { total: number; in: number }>();
    tryouts.forEach(c => {
      const g = gradeNum(c.grade);
      const e = m.get(g) || { total: 0, in: 0 };
      e.total++; if (c.tryoutCheckedIn) e.in++;
      m.set(g, e);
    });
    return m;
  }, [tryouts]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return tryouts
      .filter(c => grade === "all" || gradeNum(c.grade) === grade)
      .filter(c => view === "all" ? true : view === "notin" ? !c.tryoutCheckedIn : view === "in" ? !!c.tryoutCheckedIn : (!isPaid(c) && !isFree(c)))
      .filter(c => !needle || [c.camperName, c.name, c.email, c.phone].some(v => (v || "").toLowerCase().includes(needle)))
      .sort((a, b) => gradeNum(a.grade) - gradeNum(b.grade) || (a.camperName || "").localeCompare(b.camperName || ""));
  }, [tryouts, grade, view, q]);

  const groups = useMemo(() => {
    const m = new Map<number, Contact[]>();
    rows.forEach(c => { const g = gradeNum(c.grade); m.set(g, [...(m.get(g) || []), c]); });
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  }, [rows]);

  const totals = useMemo(() => ({
    total: tryouts.length,
    checkedIn: tryouts.filter(c => c.tryoutCheckedIn).length,
    paid: tryouts.filter(c => isPaid(c) || isFree(c)).length,
    unpaid: tryouts.filter(c => !isPaid(c) && !isFree(c)).length,
  }), [tryouts]);

  const pill = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${active ? "bg-blue-600 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`;

  const gradeKeys = [...gradeCounts.keys()].sort((a, b) => a - b);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ["Registered", totals.total, "text-white"],
          ["Checked in", `${totals.checkedIn} / ${totals.total}`, "text-emerald-400"],
          ["Paid / Free", totals.paid, "text-emerald-400"],
          ["Not paid yet", totals.unpaid, totals.unpaid ? "text-amber-400" : "text-gray-400"],
        ].map(([label, val, color]) => (
          <div key={String(label)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <div className="text-gray-400 text-xs font-semibold">{label}</div>
            <div className={`text-2xl font-black ${color}`}>{val}</div>
          </div>
        ))}
      </div>

      {totals.unpaid > 0 && (
        <button onClick={() => setReminderTo(tryouts.filter(c => !isPaid(c) && !isFree(c)))}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-400/30 hover:bg-amber-500/25 text-amber-200 text-sm font-bold transition-colors">
          &#9993; Email the {totals.unpaid} unpaid registration{totals.unpaid !== 1 ? "s" : ""} a payment reminder
        </button>
      )}

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setGrade("all")} className={pill(grade === "all")}>All grades ({totals.checkedIn}/{totals.total})</button>
        {gradeKeys.map(g => {
          const e = gradeCounts.get(g)!;
          return <button key={g} onClick={() => setGrade(g)} className={pill(grade === g)}>{gradeName(g)} ({e.in}/{e.total})</button>;
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search player, parent, email, phone"
          className="flex-1 min-w-[200px] px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500" />
        {([["all", "Everyone"], ["notin", "Not checked in"], ["in", "Checked in"], ["unpaid", "Not paid"]] as [View, string][]).map(([v, l]) => (
          <button key={v} onClick={() => setView(v)} className={pill(view === v)}>{l}</button>
        ))}
      </div>

      <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer w-fit">
        <input type="checkbox" checked={emailReceipts}
          onChange={e => { setEmailReceipts(e.target.checked); try { localStorage.setItem("hilhi_tryout_email_receipts", e.target.checked ? "1" : "0"); } catch { /* ignore */ } }} />
        Email the parent a receipt when I tick Paid
      </label>

      {toast && <div className={`rounded-xl px-4 py-2 text-sm border ${toast.bad ? "bg-red-500/10 border-red-500/20 text-red-300" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"}`}>{toast.msg}</div>}

      {reminderTo && (
        <TryoutReminderModal adminKey={adminKey} onClose={() => setReminderTo(null)} unpaid={reminderTo} />
      )}

      {view === "unpaid" && rows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3">
          <span className="text-amber-200 text-sm">Showing <strong>{rows.length}</strong> not-paid registration{rows.length !== 1 ? "s" : ""}{grade !== "all" ? ` in ${gradeName(grade)}` : ""}.</span>
          <button onClick={() => setReminderTo(rows)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-900 text-sm font-bold transition-colors">
            &#9993; Send reminder to these {rows.length === 1 ? "parent" : "parents"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-gray-500 text-sm py-8 text-center">Loading tryout registrations…</div>
      ) : rows.length === 0 ? (
        <div className="text-gray-500 text-sm py-8 text-center">{totals.total === 0 ? "No tryout registrations yet." : "Nobody matches that filter."}</div>
      ) : (
        groups.map(([g, list]) => (
          <div key={g} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-white/5 flex items-center justify-between">
              <span className="text-white font-bold text-sm">{gradeName(g)}</span>
              <span className="text-gray-400 text-xs">{list.filter(c => c.tryoutCheckedIn).length} of {list.length} checked in</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-[11px] uppercase tracking-wide">
                    <th className="text-center px-3 py-2 w-20">Checked in</th>
                    <th className="text-left px-3 py-2">Player</th>
                    <th className="text-left px-3 py-2">Parent</th>
                    <th className="text-left px-3 py-2">Uniform</th>
                    <th className="text-right px-3 py-2">Amount</th>
                    <th className="text-center px-3 py-2 w-24">Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map(c => {
                    const paid = isPaid(c), free = isFree(c), qty = qtyOf(c);
                    return (
                      <tr key={c.id} className={`border-t border-white/5 ${c.tryoutCheckedIn ? "bg-emerald-500/5" : ""}`}>
                        <td className="text-center px-3 py-2">
                          <input type="checkbox" checked={!!c.tryoutCheckedIn} onChange={() => toggleCheckIn(c)}
                            className="w-6 h-6 accent-emerald-500 cursor-pointer" aria-label={`Check in ${c.camperName || c.name}`} />
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-white font-semibold">{c.camperName || "(no player name)"}{qty > 1 && <span className="ml-2 text-[11px] text-amber-300">x{qty} players</span>}</div>
                          {c.inHillsboroBoundary === "no" && <div className="text-[11px] text-red-400">Outside Hillsboro HS boundary</div>}
                          {!paid && !free && <div className="text-[11px] text-amber-400">NOT PAID - {c.paymentStatus || "pending"}{canEmail(c) && <button type="button" onClick={() => setReminderTo([c])} className="ml-2 underline hover:text-amber-200">&#9993; Send reminder</button>}</div>}
                        </td>
                        <td className="px-3 py-2 text-gray-300">
                          <div>{c.name}</div>
                          <div className="text-[11px] text-gray-500">{c.phone}{c.phone && c.email ? " · " : ""}{c.email}</div>
                        </td>
                        <td className="px-3 py-2 text-gray-300">{c.shirtSize || "-"}</td>
                        <td className="px-3 py-2 text-right text-gray-300">{free ? "Free" : c.amountPaid ? `$${Number(c.amountPaid).toFixed(2)}` : "-"}</td>
                        <td className="text-center px-3 py-2">
                          {free ? <span className="text-xs text-gray-400">Free</span> : (
                            <input type="checkbox" checked={paid} onChange={() => togglePaid(c)}
                              className="w-6 h-6 accent-blue-500 cursor-pointer" aria-label={`Paid: ${c.camperName || c.name}`} />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
