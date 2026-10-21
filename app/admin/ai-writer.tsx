"use client";

// "Write with AI" helper for the Email Blast dialog. Describe what you want to say (or improve the
// draft that's already in the Message box) and it fills in the subject + message. Nothing is sent
// anywhere — it only edits the draft, and you can undo it.

import { useState } from "react";
import { isHtmlEmpty } from "./rich-editor";

const TONES = ["Friendly", "Excited", "Short & direct", "More formal"];

export function AiWriter({ adminKey, subject, message, setSubject, setMessage }: {
  adminKey: string;
  subject: string;
  message: string;
  setSubject: (s: string) => void;
  setMessage: (html: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("Friendly");
  const [busy, setBusy] = useState<"" | "write" | "improve">("");
  const [error, setError] = useState("");
  const [undo, setUndo] = useState<{ subject: string; message: string } | null>(null);

  const hasDraft = !isHtmlEmpty(message);

  async function run(mode: "write" | "improve") {
    if (busy) return;
    if (mode === "write" && !prompt.trim()) { setError("Tell me what the email should say first."); return; }
    if (mode === "write" && hasDraft && !confirm("This will replace what's in the Message box. (You can undo it right after.) Continue?")) return;
    setBusy(mode); setError("");
    try {
      const res = await fetch(`/api/admin/email-blast/ai?key=${encodeURIComponent(adminKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, prompt, tone, current: message, currentSubject: subject }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) { setError(data.error || "The AI couldn't write that. Please try again."); }
      else {
        setUndo({ subject, message });
        if (data.subject && (!subject.trim() || mode === "write")) setSubject(data.subject);
        setMessage(data.html);
      }
    } catch {
      setError("Network error — please try again.");
    }
    setBusy("");
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-purple-400/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 text-sm font-semibold transition-colors">
        ✨ Write with AI
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-purple-400/30 bg-purple-500/10 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-purple-200 text-sm font-bold">✨ Write with AI</span>
        <button type="button" onClick={() => setOpen(false)} className="text-[11px] text-gray-400 hover:text-white">Hide</button>
      </div>

      <div>
        <label className="block text-gray-300 text-xs font-semibold mb-1">What do you want to say?</label>
        <textarea rows={3} value={prompt} onChange={e => setPrompt(e.target.value)}
          placeholder="e.g. Remind parents tryouts are Sunday Nov 1 and Monday Nov 2 at Hillsboro High. Cost is $310. Bring water and court shoes. Register at hilhiyouthbbx.com/tryout."
          className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-400 resize-y" />
        <p className="text-gray-500 text-[11px] mt-1">Include the dates, times, prices and links — the AI only uses what you give it and puts [brackets] where something is missing.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-gray-400 text-xs font-semibold">Tone:</span>
        {TONES.map(t => (
          <button key={t} type="button" onClick={() => setTone(t)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${tone === t ? "bg-purple-500 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => run("write")} disabled={!!busy}
          className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-white text-sm font-bold transition-colors">
          {busy === "write" ? "Writing…" : "Write my email"}
        </button>
        <button type="button" onClick={() => run("improve")} disabled={!!busy || !hasDraft}
          title={hasDraft ? "Polish the draft in the Message box" : "Write or paste a draft in the Message box first"}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors">
          {busy === "improve" ? "Improving…" : "Improve my draft"}
        </button>
        {undo && !busy && (
          <button type="button" onClick={() => { setSubject(undo.subject); setMessage(undo.message); setUndo(null); }}
            className="px-3 py-2 rounded-xl text-gray-300 hover:text-white text-sm underline">
            ↩ Undo
          </button>
        )}
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-xs text-red-300">{error}</div>}
      <p className="text-gray-500 text-[11px]">Always read the draft before sending — then use <b>Send Test</b> to see exactly how it looks.</p>
    </div>
  );
}
