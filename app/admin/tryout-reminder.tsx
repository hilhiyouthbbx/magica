"use client";

// Payment-reminder email to every tryout registration that isn't marked Paid yet.
// Uses the same sender as Email Blast, so {{name}}, {{player}} and {{amount}} are filled in per parent.

import { useEffect, useMemo, useState } from "react";
import type { Contact } from "@/lib/contacts";
import { RichEditor, isHtmlEmpty } from "./rich-editor";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const hasEmail = (c: Contact) => !!(c.email && c.email.includes("@") && !c.email.includes("noemail"));

interface Session { label: string; time: string }

function defaultMessage(sessions: Session[], location: string, address: string): string {
  const list = sessions.length
    ? `<ul>${sessions.map(s => `<li><strong>${esc(s.label)}</strong> - ${esc(s.time)}</li>`).join("")}</ul>`
    : "";
  const where = location ? `<p><strong>Where:</strong> ${esc(location)}${address ? `<br>${esc(address)}` : ""}</p>` : "";
  return [
    `<p>Hi {{name}},</p>`,
    `<p>This is a friendly reminder that <strong>tryouts are coming up on Sunday, November 1 and Monday, November 2</strong>.</p>`,
    list,
    where,
    `<p>We have <strong>not received payment yet</strong> for <strong>{{player}}</strong>'s tryout registration. Amount due: <strong>{{amount}}</strong>. You can pay by Venmo to <strong>@hilhiyouthbbx</strong> (reply to this email if you would like a PayPal link instead).</p>`,
    `<p><strong>If you believe you have already paid</strong>, a payment may have slipped past me. Please reply to this email with a copy of your receipt (a screenshot of your PayPal or Venmo confirmation works great) and I will get you marked as paid right away.</p>`,
    `<p>Thank you, and we look forward to seeing {{player}} on the court!</p>`,
    `<p>Coach Kem<br>Hilhi Youth Basketball</p>`,
  ].join("");
}

export function TryoutReminderModal({ adminKey, unpaid, onClose }: { adminKey: string; unpaid: Contact[]; onClose: () => void }) {
  const [subject, setSubject] = useState("Reminder: Tryouts are Nov 1 & 2 - payment still needed");
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [busy, setBusy] = useState<"" | "test" | "send">("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [done, setDone] = useState<{ sent: number; failed: number } | null>(null);
  const [showList, setShowList] = useState(false);

  const recipients = useMemo(() => {
    const m = new Map<string, Contact[]>();
    unpaid.filter(hasEmail).forEach(c => { const k = c.email.trim().toLowerCase(); m.set(k, [...(m.get(k) || []), c]); });
    return [...m.values()];
  }, [unpaid]);
  const noEmail = unpaid.filter(c => !hasEmail(c));

  useEffect(() => {
    let alive = true;
    fetch("/api/content", { cache: "no-store" })
      .then(r => r.json())
      .then(d => { if (alive) setMessage(defaultMessage(d?.tryout?.sessions || [], d?.tryout?.location || "", d?.tryout?.address || "")); })
      .catch(() => { if (alive) setMessage(defaultMessage([], "", "")); })
      .finally(() => { if (alive) setReady(true); });
    return () => { alive = false; };
  }, []);

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
      if (d.ok) setNote(`Test sent to ${d.sent} address${d.sent !== 1 ? "es" : ""} (sample player and amount are filled in).`);
      else setError(d.error || "Test send failed.");
    } catch { setError("Network error sending the test."); }
    setBusy("");
  }

  async function sendAll() {
    if (!subject.trim() || isHtmlEmpty(message) || recipients.length === 0) return;
    if (!confirm(`Send this reminder to ${recipients.length} parent${recipients.length !== 1 ? "s" : ""} who haven't paid? This can't be undone.`)) return;
    setBusy("send"); setError(""); setNote("");
    try {
      const d = await post({ contactIds: recipients.flat().map(c => c.id) });
      if (d.ok) setDone({ sent: d.sent, failed: d.failed });
      else setError(d.error || "Send failed.");
    } catch { setError("Network error sending the reminder."); }
    setBusy("");
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-2xl bg-gray-900 border border-white/15 rounded-2xl my-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-white font-bold">Payment reminder - tryouts</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none" aria-label="Close">x</button>
        </div>

        {done ? (
          <div className="p-6 space-y-3 text-center">
            <div className="text-4xl">&#9989;</div>
            <p className="text-white font-bold">Reminder sent to {done.sent} parent{done.sent !== 1 ? "s" : ""}{done.failed ? ` (${done.failed} failed)` : ""}.</p>
            <p className="text-gray-400 text-sm">Replies with receipts go to info@hilhiyouthbbx.com. When one arrives, tick Paid for that player on the Check-In sheet.</p>
            <button onClick={onClose} className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm">Done</button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm text-amber-200">
              This goes to <strong>{recipients.length} parent{recipients.length !== 1 ? "s" : ""}</strong> whose registration is not marked Paid
              {unpaid.length !== recipients.length ? ` (${unpaid.length} registrations; parents with more than one player get one email)` : ""}.
              {" "}<button type="button" onClick={() => setShowList(v => !v)} className="underline">{showList ? "Hide list" : "Show who"}</button>
              {showList && (
                <ul className="mt-2 text-xs text-amber-100 space-y-0.5 max-h-40 overflow-y-auto">
                  {recipients.map(g => <li key={g[0].id}>{g[0].name} - {g.map(c => c.camperName || "player").join(", ")} - {g[0].email}</li>)}
                </ul>
              )}
              {noEmail.length > 0 && <div className="mt-2 text-xs text-red-300">{noEmail.length} unpaid registration{noEmail.length !== 1 ? "s have" : " has"} no email address and will be skipped.</div>}
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-semibold mb-1">Subject</label>
              <input value={subject} onChange={e => setSubject(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white font-bold text-sm focus:outline-none focus:border-blue-500" />
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-semibold mb-1">Message (you can edit it)</label>
              {ready ? <RichEditor value={message} onChange={setMessage} /> : <div className="text-gray-500 text-sm py-6 text-center">Loading...</div>}
              <p className="text-gray-600 text-[11px] mt-1">Filled in for each parent: <code className="text-gray-400">{"{{name}}"}</code> first name, <code className="text-gray-400">{"{{player}}"}</code> player name(s), <code className="text-gray-400">{"{{amount}}"}</code> amount due.</p>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>}

            <div className="border-t border-white/10 pt-4 space-y-2">
              <label className="block text-gray-400 text-xs font-semibold">Send yourself a test first</label>
              <div className="flex gap-2">
                <input value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="you@email.com"
                  className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500" />
                <button onClick={sendTest} disabled={!!busy || !ready || !testEmail.trim()}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl whitespace-nowrap">
                  {busy === "test" ? "Sending..." : "Send Test"}
                </button>
              </div>
              {note && <p className="text-emerald-400 text-xs">{note}</p>}
            </div>

            <button onClick={sendAll} disabled={!!busy || !ready || recipients.length === 0 || !subject.trim() || isHtmlEmpty(message)}
              className="w-full py-3.5 bg-gradient-to-r from-[#006aff] to-[#00aaff] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl">
              {busy === "send" ? "Sending..." : `Send reminder to ${recipients.length} parent${recipients.length !== 1 ? "s" : ""}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
