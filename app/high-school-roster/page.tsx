"use client";

export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Printer } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import type { SiteContent, RosterPlayer, RosterTeam } from "@/lib/content";

function Row({ p }: { p: RosterPlayer }) {
  return (
    <li className="flex items-baseline justify-between gap-3 px-4 py-2.5 border-b border-white/5 last:border-b-0">
      <span className="text-white font-bold text-sm sm:text-base">
        {p.name}
        {p.swing && <span className="ml-2 text-[10px] font-bold tracking-widest text-sky-300 align-middle">SWING</span>}
      </span>
      <span className="text-gray-400 text-xs whitespace-nowrap">Grade {p.grade}</span>
    </li>
  );
}

function TeamCard({ team, i }: { team: RosterTeam; i: number }) {
  return (
    <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}
      className="glass rounded-2xl border border-white/10 overflow-hidden break-inside-avoid">
      <h2 className="px-4 py-3 bg-white/5 text-center text-white font-black tracking-wide uppercase text-sm sm:text-base">{team.name}</h2>
      <ul>{team.players.map(p => <Row key={p.id} p={p} />)}</ul>
      {team.swingPlayers.length > 0 && (
        <>
          <h3 className="px-4 py-2 bg-white/5 border-t border-white/10 text-center text-gray-300 font-bold tracking-widest uppercase text-xs">Swing Players</h3>
          <ul>{team.swingPlayers.map(p => <Row key={p.id} p={p} />)}</ul>
        </>
      )}
    </motion.section>
  );
}

export default function HighSchoolRosterPage() {
  const [roster, setRoster] = useState<SiteContent["hsRoster"] | null>(null);

  useEffect(() => {
    fetch("/api/content", { cache: "no-store" }).then(r => r.json()).then(d => setRoster(d.hsRoster)).catch(() => setRoster(null));
  }, []);

  return (
    <main className="min-h-screen bg-[#080D1A]">
      <style>{`@media print { header, footer, nav { display: none !important; } main { background: #fff !important; min-height: 0 !important; } main * { color: #000 !important; background: #fff !important; box-shadow: none !important; border-color: #ccc !important; backdrop-filter: none !important; } section { padding-top: 12px !important; } }`}</style>
      <Navbar />
      <section className="relative pt-32 pb-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.15),transparent_60%)]" />
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <p className="text-blue-400 text-xs font-bold tracking-[0.25em] uppercase mb-3">Hillsboro High School</p>
          <h1 className="text-4xl sm:text-6xl font-black text-white leading-none">{roster?.title || "Hilhi Spartans"}</h1>
          <p className="text-gray-400 text-sm sm:text-base mt-3">{roster?.subtitle || "Boys Basketball Roster"}</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-20">
        {roster === null ? (
          <div className="text-center text-gray-500 py-16">Loading roster…</div>
        ) : !roster.enabled ? (
          <div className="text-center text-gray-400 py-16">The roster will be posted soon. Check back!</div>
        ) : (
          <>
            <div className="flex justify-end mb-4 print:hidden">
              <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 text-sm font-semibold transition-colors">
                <Printer className="w-4 h-4" /> Print roster
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
              {roster.teams.map((t, i) => <TeamCard key={t.id} team={t} i={i} />)}
            </div>
            {roster.footer && <p className="text-center text-gray-500 text-xs tracking-widest uppercase mt-12">{roster.footer}</p>}
          </>
        )}
      </section>
      <Footer />
    </main>
  );
}
