"use client";
import { useState } from "react";
import { RaffleSwitch } from "../raffle-switch";

export const dynamic = "force-dynamic";

// Standalone admin page: hilhiyouthbbx.com/admin/raffle
// Turn raffle ticket sales on/off from any phone or computer.
export default function RaffleAdminPage() {
  const [pw,     setPw]     = useState("");
  const [key,    setKey]    = useState<string | null>(null);
  const [error,  setError]  = useState("");
  const [busy,   setBusy]   = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      // Verify the password against a protected admin endpoint before showing the switch.
      const res = await fetch(`/api/admin/invoices?key=${encodeURIComponent(pw)}`);
      if (res.ok) setKey(pw); else setError("Wrong password.");
    } catch { setError("Could not verify. Try again."); }
    setBusy(false);
  }

  return (
    <main className="min-h-screen bg-[#080D1A] flex items-center justify-center px-4">
      <div className="w-full max-w-lg glass rounded-3xl border border-white/10 p-8">
        <h1 className="text-2xl font-black text-white mb-1">🎟️ Raffle On / Off</h1>
        <p className="text-gray-400 text-sm mb-6">Open or close raffle ticket sales on the website.</p>
        {key ? (
          <div className="space-y-4">
            <RaffleSwitch adminKey={key} />
            <a href="/raffle" target="_blank" className="block text-center text-blue-400 hover:text-blue-300 text-sm font-semibold">View the raffle page ↗</a>
            <a href="/admin" className="block text-center text-gray-500 hover:text-gray-300 text-sm">← Back to Admin</a>
          </div>
        ) : (
          <form onSubmit={login} className="space-y-4">
            <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Admin password" required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500" />
            {error && <div className="text-red-400 text-sm">{error}</div>}
            <button type="submit" disabled={busy}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl">
              {busy ? "Checking…" : "Unlock"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
