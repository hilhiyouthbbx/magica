"use client";

export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Trophy, Star } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import type { SiteContent, Coach } from "@/lib/content";
import { DynamicTitle } from "@/components/dynamic-title";

const BADGE  = "https://static.wixstatic.com/media/458ec6_d5ba4437af264a2196932023e209224e~mv2.png/v1/fill/w_400,h_400,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/badge.png";
const TEAM_1 = "https://static.wixstatic.com/media/8bb438_3ae04589aef4480e89a24d7283c69798~mv2_d_2869_3586_s_4_2.jpg/v1/fill/w_1200,h_600,al_c,q_85,enc_auto/team1.jpg";
const TEAM_2 = "https://static.wixstatic.com/media/458ec6_07208ccf6e6e4aa8ac95a7a251f226a3~mv2.jpg/v1/fill/w_1200,h_600,al_c,q_85,enc_auto/team2.jpg";

const GRADIENT_COLORS = [
  "from-blue-600 to-blue-800",
  "from-red-700 to-red-900",
  "from-indigo-600 to-indigo-800",
  "from-cyan-600 to-blue-700",
  "from-emerald-600 to-teal-800",
];


// ── Unified coach card (CMS — supports photo + roster) ───────────────────────
function CoachCard({ coach, index }: { coach: Coach; index: number }) {
  const color   = GRADIENT_COLORS[index % GRADIENT_COLORS.length];
  const roster  = coach.roster ?? [];
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.07 }}
      className="glass rounded-3xl border border-white/10 overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        <div className={`relative flex-shrink-0 lg:w-72 flex flex-col items-center justify-center p-10 bg-gradient-to-br ${color}`}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage:"linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize:"24px 24px" }} />
          <div className="relative w-36 h-36 rounded-full bg-white/10 border-4 border-white/20 flex items-center justify-center shadow-2xl overflow-hidden">
            {coach.imageUrl
              ? <img src={coach.imageUrl} alt={coach.name} className="w-full h-full object-cover" />
              : <img src={BADGE} alt={coach.name} className="w-28 h-28 object-contain" />}
          </div>
          <div className="relative mt-4 text-center">
            <div className="font-black text-white text-xl leading-tight">{coach.name}</div>
            <div className="text-white/70 text-xs font-semibold uppercase tracking-widest mt-1">{coach.title}</div>
          </div>
          <div className="relative mt-4 flex items-center gap-1.5 bg-white/15 border border-white/30 rounded-full px-3 py-1">
            <Star className="w-3 h-3 text-yellow-300 fill-yellow-300" />
            <span className="text-white text-xs font-bold">Head Coach</span>
          </div>
        </div>
        <div className="flex-1 p-8 lg:p-10 flex flex-col gap-6">
          <div>
            <h2 className="text-2xl font-black text-white mb-1">{coach.name}</h2>
            <div className="text-blue-400 font-semibold text-sm">{coach.title}</div>
            {coach.bio && <p className="text-gray-400 text-sm leading-relaxed mt-4">{coach.bio}</p>}
          </div>
          {roster.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-blue-400" />
                <span className="text-white font-bold text-sm uppercase tracking-wide">2025–26 Roster</span>
                <span className="bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-bold px-2 py-0.5 rounded-full">{roster.length} players</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {roster.map(player => (
                  <span key={player} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-gray-300 text-xs font-medium hover:bg-white/10 hover:text-white transition-colors">{player}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}


// ── Main page ─────────────────────────────────────────────────────────────────
export default function YouthCoachesPage() {
  const [intro,   setIntro]   = useState("The dedicated coaches behind every Hilhi Youth Basketball team — shaping players through leadership, discipline, and a genuine love of the game.");
  const [coaches, setCoaches] = useState<Coach[] | null>(null);

  useEffect(() => {
    fetch("/api/content")
      .then(r => r.json())
      .then((data: SiteContent) => {
        if (data?.youthCoaches?.intro) setIntro(data.youthCoaches.intro);
        setCoaches(data?.youthCoaches?.coaches ?? []);
      })
      .catch(() => setCoaches([]));
  }, []);

  const displayCoaches = coaches ?? [];

  return (
    <main className="min-h-screen bg-[#080D1A]">
      <DynamicTitle pageKey="youthCoaches" fallback="Youth Coaches | Hilhi Youth Basketball" />
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.15),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(220,38,38,0.08),transparent_55%)]" />
        <div className="absolute inset-0 opacity-10">
          <img src={TEAM_1} alt="" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#080D1A] via-transparent to-[#080D1A]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-widest mb-5">
              <Users className="w-3.5 h-3.5" /> 2025–2026 Coaching Staff
            </div>
            <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight mb-4">
              Youth <span className="text-gradient">Coaches</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">{intro}</p>
          </motion.div>
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.2 }}
            className="flex flex-wrap justify-center gap-6 mt-10">
            {[
              [String(displayCoaches.length), "Coaches"],
              ["6",    "Teams"],
              ["70+",  "Athletes"],
              ["2025–26","Season"],
            ].map(([v,l]) => (
              <div key={l} className="glass rounded-2xl px-6 py-4 border border-white/15 text-center min-w-[100px]">
                <div className="text-2xl font-black text-white">{v}</div>
                <div className="text-gray-500 text-xs font-medium uppercase tracking-wider mt-0.5">{l}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Coach cards */}
      <section className="max-w-7xl mx-auto px-4 pb-24 space-y-10">
        {coaches === null && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {coaches !== null && displayCoaches.map((c, i) => <CoachCard key={c.id} coach={c} index={i} />)}
      </section>

      {/* CTA banner */}
      <section className="relative overflow-hidden border-t border-white/10">
        <div className="absolute inset-0 opacity-15">
          <img src={TEAM_2} alt="" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080D1A] via-blue-950/80 to-[#080D1A]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
          <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.6 }}>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">Ready to <span className="text-gradient">Join the Team?</span></h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">Our coaches are ready to help your player grow. Check out upcoming events and register today.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/events" className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all hover:shadow-lg hover:shadow-blue-500/30 text-lg">View Events</a>
              <a href="/register" className="px-8 py-4 glass border border-white/20 hover:bg-white/10 text-white font-black rounded-2xl transition-all text-lg">Register Now</a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
