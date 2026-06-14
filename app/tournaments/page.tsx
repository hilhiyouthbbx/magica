"use client";

export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Trophy, Users, ChevronRight, Star } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import type { TournamentConfig } from "@/lib/tournament";
import { DynamicTitle } from "@/components/dynamic-title";

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<TournamentConfig[]>([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    fetch("/api/tournament")
      .then(r => r.json())
      .then((data: TournamentConfig[]) => { setTournaments(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-[#080D1A]">
      <DynamicTitle pageKey="tournaments" fallback="Tournaments | Hilhi Youth Basketball" />
      <Navbar />

      <section className="relative pt-32 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(37,99,235,0.15),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(220,38,38,0.1),transparent_55%)]" />
        <div className="relative max-w-7xl mx-auto px-4">
          <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-widest mb-4">
              <Trophy className="w-3.5 h-3.5" /> Youth Basketball Tournaments
            </div>
            <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight mb-3">
              Tournaments
            </h1>
            <p className="text-gray-400 text-lg max-w-xl">
              Register your team for upcoming Hilhi Youth Basketball tournaments.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-blue-500/40 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : tournaments.length === 0 ? (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
            className="text-center py-24 glass rounded-3xl border border-white/10 max-w-lg mx-auto">
            <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Tournaments Scheduled</h2>
            <p className="text-gray-400 mb-6">Check back soon — new tournaments are announced regularly.</p>
            <a href="/join" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all">
              Get Notified <ChevronRight className="w-4 h-4" />
            </a>
          </motion.div>
        ) : (
          <div className={`grid gap-6 ${tournaments.length === 1 ? "max-w-2xl mx-auto" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
            {tournaments.map((t, i) => (
              <motion.a key={t.id} href={`/tournaments/${t.id}`}
                initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:i*0.1 }}
                className="glass rounded-2xl border border-white/10 hover:border-blue-500/40 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 group block">

                {/* Banner image */}
                <div className="relative h-48 bg-gradient-to-br from-blue-900/60 to-gray-900 overflow-hidden">
                  {t.imageUrl ? (
                    <img src={t.imageUrl} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Trophy className="w-16 h-16 text-blue-500/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080D1A]/80 to-transparent" />
                  {t.isStateQualifier && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-black">
                      <Star className="w-3 h-3 fill-current" /> State Qualifier
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">{t.tagline}</div>
                  <h3 className="text-white font-black text-lg leading-tight mb-3 group-hover:text-blue-300 transition-colors">{t.name}</h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-blue-400" />
                      <span>{t.dates}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-blue-400" />
                      <span>{t.venue}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Users className="w-3.5 h-3.5 flex-shrink-0 text-blue-400" />
                      <span>{t.gender} · {t.grades}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div>
                      <div className="text-gray-500 text-xs">Entry Fee</div>
                      <div className="text-white font-black text-lg">${t.entryFee}</div>
                    </div>
                    <div className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 group-hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-colors">
                      Register <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
