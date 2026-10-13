"use client";
import { useEffect, useState } from "react";

export function RaffleSwitch({ adminKey }: { adminKey: string }) {
  const [open,   setOpen]   = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/raffle-settings", { cache: "no-store" }).then(r => r.json()).then(d => setOpen(d.open !== false)).catch(() => setOpen(true));
  }, []);

  async function toggle(v: boolean) {
    setSaving(true);
    const res = await fetch(`/api/raffle-settings?key=${adminKey}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ open: v }),
    });
    if (res.ok) setOpen(v);
    setSaving(false);
  }

  if (open === null) return <div className="text-gray-500 text-sm">Loading…</div>;
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
      <div>
        <div className="text-white font-semibold text-sm">Raffle Ticket Sales {open ? "— OPEN" : "— CLOSED"}</div>
        <div className="text-gray-500 text-xs mt-0.5">
          When OFF: the /raffle page shows &quot;Raffle Is Closed&quot;, the orange Raffle button and homepage tile are hidden, and no new tickets can be bought (blocked on the server too).
        </div>
      </div>
      <button type="button" disabled={saving} onClick={() => toggle(!open)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${open ? "bg-green-600" : "bg-white/20"}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${open ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  );
}
