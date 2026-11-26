"use client";

export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Star } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { DynamicTitle } from "@/components/dynamic-title";
import { DEFAULT_YOUTH_TEAMS, type YouthTeamsContent, type YouthTeam } from "@/lib/youth-teams";

const GRADIENT_COLORS = [
  "from-blue-600 to-blue-800",
  "from-red-700 to-red-900",
  "from-indigo-600 to-indigo-800",
  "from-cyan-600 to-blue-700",
  "from-emerald-600 to-teal-800",
  "from-violet-600 to-purple-800",
];

const gradeOf = (team: string) => (/(\d+)/.exec(team) || [])[1] || "";

// "Amir Kent" -> "Amir K." when full names are switched off
function shown(name: string, full: boolean) {
  if (full) return name;
  const parts = name.trim().split(/\s+/);
  return parts.length < 2 ? name : `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

function TeamCard({ team, index, full }: { team: YouthTeam; index: number; full: boolean }) {
  const color = GRADIENT_COLORS[index % GRADIENT_COLORS.length];
  const teamGrade = gradeOf(team.name);
  return (
    <motion.section
      initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
      className="glass rounded-3xl border border-white/10 overflow-hidden break-inside-avoid">
      <div className={`relative px-6 py-6 bg-gradient-to-br ${color}`}>
        <h2 className="text-2xl sm:text-3xl font-black text-white">{team.name}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-white/90 text-sm">
          {team.coach && <span className="inline-flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" /> Head Coach: <strong>{team.coach}</strong></span>}
          {team.assistant && <span className="inline-flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Assistant: <strong>{team.assistant}</strong></span>}
        </div>
      </div>

      {team.photoUrl && (
        <div className="bg-black/30">
          <img src={team.photoUrl} alt={`${team.name} team picture`} className="w-full h-auto max-h-[640px] object-contain mx-auto" />
        </div>
      )}

      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-white font-bold text-sm uppercase tracking-wide">Roster</span>
          <span className="bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-bold px-2 py-0.5 rounded-full">{team.players.length} players</span>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          {team.players.map(p => (
            <li key={p.id} className="flex items-baseline justify-between gap-3 py-2 border-b border-white/5">
              <span className="text-white font-semibold text-sm">{shown(p.name, full)}</span>
              {/* grade shown only when it differs from the team's grade, or for the combined 3rd/4th team */}
              {(p.grade !== teamGrade || /\//.test(team.name)) && <span className="text-gray-500 text-xs whitespace-nowrap">Grade {p.grade}</span>}
            </li>
          ))}
        </ul>
      </div>
    </motion.section>
  );
}

export default function YouthTeamsPage() {
  const [data, setData] = useState<YouthTeamsContent | null>(null);

  useEffect(() => {
    fetch("/api/content", { cache: "no-store" })
      .then(r => r.json())
      .then(d => setData({ ...DEFAULT_YOUTH_TEAMS, ...(d?.youthTeams ?? {}), teams: d?.youthTeams?.teams ?? DEFAULT_YOUTH_TEAMS.teams }))
      .catch(() => setData(DEFAULT_YOUTH_TEAMS));
  }, []);

  const teams = data?.teams ?? [];
  const players = teams.reduce((n, t) => n + t.players.length, 0);

  return (
    <main className="min-h-screen bg-[#080D1A]">
      <DynamicTitle pageKey="youthCoaches" fallback="2026-2027 Youth Teams | Hilhi Youth Basketball" />
      <Navbar />

      <section className="relative pt-32 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.15),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(220,38,38,0.08),transparent_55%)]" />
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-widest mb-5">
              <Users className="w-3.5 h-3.5" /> {data?.season || DEFAULT_YOUTH_TEAMS.season}
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight mb-4">{data?.title || DEFAULT_YOUTH_TEAMS.title}</h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">{data?.intro ?? DEFAULT_YOUTH_TEAMS.intro}</p>
          </motion.div>
          {data && (
            <div className="flex flex-wrap justify-center gap-6 mt-10">
              {[[String(teams.length), "Teams"], [String(players), "Athletes"]].map(([v, l]) => (
                <div key={l} className="glass rounded-2xl px-6 py-4 border border-white/15 text-center min-w-[100px]">
                  <div className="text-2xl font-black text-white">{v}</div>
                  <div className="text-gray-500 text-xs font-medium uppercase tracking-wider mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-24 space-y-10">
        {data === null && (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
        )}
        {data && teams.map((t, i) => <TeamCard key={t.id} team={t} index={i} full={data.showFullNames} />)}
      </section>

      <section className="relative overflow-hidden border-t border-white/10">
        <div className="relative max-w-7xl mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Want to <span className="text-gradient">Join Us?</span></h2>
          <p className="text-gray-400 max-w-xl mx-auto mb-8">Check out upcoming events and register today.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/events" className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all text-lg">View Events</a>
            <a href="/register" className="px-8 py-4 glass border border-white/20 hover:bg-white/10 text-white font-black rounded-2xl transition-all text-lg">Register Now</a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
