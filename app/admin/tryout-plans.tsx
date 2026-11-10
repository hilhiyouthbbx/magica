"use client";

// Payment plans for tryout/registration balances. Each family can be put on a plan:
//   monthly  - remaining $250 in two $125 installments (Dec 1, 2026 and Jan 1, 2027)
//   raffle   - covers the balance by selling additional raffle tickets
//   combo    - monthly installments plus additional raffle tickets
// PlanCell is the per-row control on the Tryout Check-In sheet; PlanReminderModal emails the families
// whose installment is due (or who chose the raffle option). It uses the same sender as Email Blast.

import { useMemo, useState } from "react";
import type { Contact } from "@/lib/contacts";
import { RichEditor, isHtmlEmpty } from "./rich-editor";

export type PlanOption = "" | "monthly" | "raffle" | "combo";
type Inst = NonNullable<Contact["planInstallments"]>[number];

const DEFAULT_INSTALLMENTS: Inst[] = [{ due: "2026-12-01", amount: 125 }, { due: "2027-01-01", amount: 125 }];
export const defaultInstallments = (): Inst[] => DEFAULT_INSTALLMENTS.map(i => ({ ...i }));

export const hasInstallments = (c: Contact) => c.planOption === "monthly" || c.planOption === "combo";
const canEmail = (c: Contact) => !!(c.email && c.email.includes("@") && !c.email.includes("noemail"));

const dateOf = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00`);
const fmtDue = (iso: string) => dateOf(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
const shortDate = (iso: string) => dateOf(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const isOverdue = (it: Inst) => !it.paid && new Date(`${it.due}T23:59:59`) < new Date();

const PLAN_NAME: Record<string, string> = { monthly: "Monthly plan", raffle: "Extra raffle tickets", combo: "Monthly + raffle tickets" };

export function PlanCell({ c, onSave }: { c: Contact; onSave: (patch: Partial<Contact>) => void }) {
  const opt = (c.planOption || "") as PlanOption;
  const inst = c.planInstallments || [];
  return (
    <div className="space-y-1 min-w-[170px] text-left">
      <select value={opt} aria-label={`Payment plan for ${c.camperName || c.name}`}
        onChange={e => {
          const v = e.target.value as PlanOption;
          const patch: Partial<Contact> = { planOption: v };
          if ((v === "monthly" || v === "combo") && inst.length === 0) patch.planInstallments = defaultInstallments();
          onSave(patch);
        }}
        className="w-full px-2 py-1.5 rounded-lg bg-gray-800 border border-white/15 text-white text-xs">
        <option value="">No plan</option>
        <option value="monthly">{PLAN_NAME.monthly}</option>
        <option value="raffle">{PLAN_NAME.raffle}</option>
        <option value="combo">{PLAN_NAME.combo}</option>
      </select>
      {hasInstallments(c) && inst.map((it, i) => (
        <label key={`${it.due}-${i}`} className="flex flex-wrap items-center gap-x-2 text-[11px] cursor-pointer">
          <input type="checkbox" checked={!!it.paid} className="w-4 h-4 accent-emerald-500"
            aria-label={`${shortDate(it.due)} installment paid for ${c.camperName || c.name}`}
            onChange={() => onSave({ planInstallments: inst.map((x, j) => (j === i ? { ...x, paid: x.paid ? "" : new Date().toISOString() } : x)) })} />
          <span className={it.paid ? "text-emerald-300" : isOverdue(it) ? "text-red-400 font-semibold" : "text-gray-300"}>
            {shortDate(it.due)} ${it.amount} {it.paid ? "paid" : isOverdue(it) ? "OVERDUE" : "due"}
          </span>
          {it.reminded && !it.paid && <span className="text-gray-500">(reminded {shortDate(it.reminded)})</span>}
        </label>
      ))}
    </div>
  );
}

interface Group { key: string; kind: "inst" | "raffle"; due?: string; amount?: number; label: string; contacts: Contact[] }

const FOOT_RECEIPT = `<p><strong>If you believe you have already paid</strong>, a payment may have slipped past me. Please reply to this email with a copy of your receipt (a screenshot of your PayPal or Venmo confirmation works great) and I will get you marked as paid right away.</p>`;
const SIGN = `<p>Thank you for your understanding and continued support of Hilhi Youth Basketball.</p><p><strong>Coach KEM</strong><br>Hilhi Youth Basketball</p>`;

function build(g: Group): { subject: string; html: string } {
  if (g.kind === "raffle") {
    return {
      subject: "Raffle tickets and your registration balance",
      html: [
        `<p>Hello {{name}},</p>`,
        `<p>Thank you for choosing to sell additional raffle tickets to help cover the registration balance for <strong>{{player}}</strong>.</p>`,
        `<p>This is a quick check-in. Please let me know how your ticket sales are going, and whether you would like more tickets to sell. The proceeds go toward your remaining registration balance, and it is a great way to reduce or even eliminate your out-of-pocket costs.</p>`,
        `<p>If you would also like to make monthly payments (the remaining $250 balance in two installments of $125, due December 1, 2026, and January 1, 2027), just let me know so we can make the appropriate arrangements.</p>`,
        FOOT_RECEIPT, SIGN,
      ].join(""),
    };
  }
  const due = g.due || "";
  const past = new Date(`${due}T23:59:59`) < new Date();
  const when = fmtDue(due);
  return {
    subject: past ? `Payment past due: $${g.amount} installment (was due ${when})` : `Payment reminder: $${g.amount} installment due ${when}`,
    html: [
      `<p>Hello {{name}},</p>`,
      past
        ? `<p>This is a friendly reminder that the installment on your payment plan for <strong>{{player}}</strong> was due on <strong>${when}</strong> and we have not marked it as received yet.</p>`
        : `<p>This is a friendly reminder that the next installment on your payment plan for <strong>{{player}}</strong> is due on <strong>${when}</strong>.</p>`,
      `<p><strong>Amount due: $${g.amount} per player.</strong></p>`,
      `<p>As a reminder, the remaining $250 balance is paid in two installments of $125, due December 1, 2026, and January 1, 2027. You can pay by Venmo to <strong>@hilhiyouthbbx</strong> (reply to this email if you would like a PayPal link instead).</p>`,
      `<p>If you are also selling additional raffle tickets toward your balance, please let me know so I can update your account. If you need a longer payment plan or smaller monthly payments, please email me directly so we can work out an arrangement.</p>`,
      FOOT_RECEIPT, SIGN,
    ].join(""),
  };
}

export function PlanReminderModal({ adminKey, tryouts, onClose, onSent }: {
  adminKey: string; tryouts: Contact[]; onClose: () => void; onSent: (list: Contact[], due: string) => void;
}) {
  const groups = useMemo(() => {
    const m = new Map<string, Group>();
    const put = (key: string, mk: () => Group, c: Contact) => {
      const g = m.get(key) || mk();
      if (!g.contacts.some(x => x.id === c.id)) g.contacts.push(c);
      m.set(key, g);
    };
    tryouts.filter(canEmail).forEach(c => {
      if (hasInstallments(c)) {
        (c.planInstallments || []).forEach(it => {
          if (it.paid) return;
          put(`inst:${it.due}:${it.amount}`, () => ({ key: `inst:${it.due}:${it.amount}`, kind: "inst", due: it.due, amount: it.amount, label: `${fmtDue(it.due)} installment ($${it.amount})`, contacts: [] }), c);
        });
      }
      if (c.planOption === "raffle") put("raffle", () => ({ key: "raffle", kind: "raffle", label: "Extra raffle ticket families (check-in)", contacts: [] }), c);
    });
    return [...m.values()].sort((a, b) => (a.kind === b.kind ? (a.due || "").localeCompare(b.due || "") : a.kind === "inst" ? -1 : 1));
  }, [tryouts]);

  const [sel, setSel] = useState(groups[0]?.key || "");
  const first = groups[0] ? build(groups[0]) : { subject: "", html: "" };
  const [subject, setSubject] = useState(first.subject);
  const [message, setMessage] = useState(first.html);
  const [skip, setSkip] = useState(true);
  const [testEmail, setTestEmail] = useState("");
  const [busy, setBusy] = useState<"" | "test" | "send">("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [done, setDone] = useState<{ sent: number; failed: number } | null>(null);
  const [showList, setShowList] = useState(false);

  const g = groups.find(x => x.key === sel);
  const list = useMemo(() => (g ? g.contacts.filter(c => !(skip && g.kind === "inst" && (c.planInstallments || []).find(i => i.due === g.due)?.reminded)) : []), [g, skip]);
  const recipients = useMemo(() => {
    const m = new Map<string, Contact[]>();
    list.forEach(c => { const k = c.email.trim().toLowerCase(); m.set(k, [...(m.get(k) || []), c]); });
    return [...m.values()];
  }, [list]);
  const skipped = g ? g.contacts.length - list.length : 0;

  function choose(key: string) {
    const prev = groups.find(x => x.key === sel);
    if (prev && message !== build(prev).html && !confirm("Switching replaces the subject and message with that reminder's wording (your edits will be lost). Continue?")) return;
    const next = groups.find(x => x.key === key);
    if (!next) return;
    const b = build(next);
    setSel(key); setSubject(b.subject); setMessage(b.html); setNote(""); setError("");
  }

  async function post(payload: Record<string, unknown>) {
    const res = await fetch(`/api/admin/email-blast?key=${encodeURIComponent(adminKey)}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, messageHtml: message, ...payload }),
    });
    return res.json();
  }

  async function sendTest() {
    if (!testEmail.trim() || !subject.trim() || isHtmlEmpty(message)) return;
    setBusy("test"); setError(""); setNote("");
    try {
      const d = await post({ testEmail: testEmail.trim() });
      if (d.ok) setNote(`Test sent to ${d.sent} address${d.sent !== 1 ? "es" : ""} (sample player name is filled in).`);
      else setError(d.error || "Test send failed.");
    } catch { setError("Network error sending the test."); }
    setBusy("");
  }

  async function sendAll() {
    if (!g || !subject.trim() || isHtmlEmpty(message) || recipients.length === 0) return;
    if (!confirm(`Send this reminder to ${recipients.length} parent${recipients.length !== 1 ? "s" : ""}? This can't be undone.`)) return;
    setBusy("send"); setError(""); setNote("");
    try {
      const d = await post({ contactIds: recipients.flat().map(c => c.id) });
      if (d.ok) {
        setDone({ sent: d.sent, failed: d.failed });
        if (!d.failed && g.kind === "inst" && g.due) onSent(recipients.flat(), g.due);
      } else setError(d.error || "Send failed.");
    } catch { setError("Network error sending the reminder."); }
    setBusy("");
  }

  const planned = tryouts.filter(c => c.planOption);
  const count = (o: string) => planned.filter(c => c.planOption === o).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-2xl bg-gray-900 border border-white/15 rounded-2xl my-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-white font-bold">Payment plan reminders</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none" aria-label="Close">x</button>
        </div>

        {done ? (
          <div className="p-6 space-y-3 text-center">
            <div className="text-4xl">&#9989;</div>
            <p className="text-white font-bold">Reminder sent to {done.sent} parent{done.sent !== 1 ? "s" : ""}{done.failed ? ` (${done.failed} failed)` : ""}.</p>
            <p className="text-gray-400 text-sm">{done.failed ? "Because some did not go through, nobody was marked as reminded - check the list and try again." : "Each family is marked \"reminded\" on the sheet. When a payment arrives, tick that installment as paid."}</p>
            <button onClick={onClose} className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm">Done</button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-xs text-gray-300">
              Families on a plan: <strong className="text-white">{planned.length}</strong> (Monthly {count("monthly")} · Raffle tickets {count("raffle")} · Monthly + raffle {count("combo")}).
              Choose each family&apos;s plan in the <strong>Payment plan</strong> column on the check-in sheet.
            </div>

            {groups.length === 0 ? (
              <div className="text-gray-400 text-sm text-center py-6">Nothing to remind right now. Either no family has a plan with an unpaid installment (or the raffle option) yet, or they have no email address.</div>
            ) : (
              <>
                <div>
                  <label className="block text-gray-400 text-xs font-semibold mb-1">Which reminder</label>
                  <select value={sel} onChange={e => choose(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-800 border border-white/15 text-white text-sm focus:outline-none focus:border-blue-500">
                    {groups.map(x => <option key={x.key} value={x.key}>{x.label} - {x.contacts.length} famil{x.contacts.length !== 1 ? "ies" : "y"}</option>)}
                  </select>
                </div>

                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm text-amber-200">
                  This goes to <strong>{recipients.length} parent{recipients.length !== 1 ? "s" : ""}</strong>.
                  {" "}<button type="button" onClick={() => setShowList(v => !v)} className="underline">{showList ? "Hide list" : "Show who"}</button>
                  {showList && (
                    <ul className="mt-2 text-xs text-amber-100 space-y-0.5 max-h-40 overflow-y-auto">
                      {recipients.map(r => <li key={r[0].id}>{r[0].name} - {r.map(c => c.camperName || "player").join(", ")} - {r[0].email}</li>)}
                    </ul>
                  )}
                  {g?.kind === "inst" && (
                    <label className="flex items-center gap-2 mt-2 text-xs cursor-pointer">
                      <input type="checkbox" checked={skip} onChange={e => setSkip(e.target.checked)} />
                      Skip families already reminded for this installment{skipped > 0 ? ` (${skipped} skipped)` : ""}
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-gray-400 text-xs font-semibold mb-1">Subject</label>
                  <input value={subject} onChange={e => setSubject(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white font-bold text-sm focus:outline-none focus:border-blue-500" />
                </div>

                <div>
                  <label className="block text-gray-400 text-xs font-semibold mb-1">Message (you can edit it)</label>
                  <RichEditor value={message} onChange={setMessage} />
                  <p className="text-gray-600 text-[11px] mt-1">Filled in for each parent: <code className="text-gray-400">{"{{name}}"}</code> first name, <code className="text-gray-400">{"{{player}}"}</code> player name(s).</p>
                </div>

                {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>}

                <div className="border-t border-white/10 pt-4 space-y-2">
                  <label className="block text-gray-400 text-xs font-semibold">Send yourself a test first</label>
                  <div className="flex gap-2">
                    <input value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="you@email.com"
                      className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500" />
                    <button onClick={sendTest} disabled={!!busy || !testEmail.trim()}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl whitespace-nowrap">
                      {busy === "test" ? "Sending..." : "Send Test"}
                    </button>
                  </div>
                  {note && <p className="text-emerald-400 text-xs">{note}</p>}
                </div>

                <button onClick={sendAll} disabled={!!busy || recipients.length === 0 || !subject.trim() || isHtmlEmpty(message)}
                  className="w-full py-3.5 bg-gradient-to-r from-[#006aff] to-[#00aaff] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl">
                  {busy === "send" ? "Sending..." : `Send reminder to ${recipients.length} parent${recipients.length !== 1 ? "s" : ""}`}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
