"use client";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";

const HERO_BG_DEFAULT =
  "https://static.wixstatic.com/media/458ec6_206c387fbcb24627b9f32c25225bd319~mv2.jpg/v1/fill/w_1920,h_900,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/5th-1.jpg";

const DEFAULT_TITLE    = "Building Champions On and Off the Court";
const DEFAULT_SUBTITLE = "Where Hillsboro's youth develop skills, character, and a love for the game.";

interface HeroContent {
  heroBadge?:    string;
  heroTitle?:    string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  statsYears?:   string;
  statsKids?:    string;
  statsCoaches?: string;
}

export function Hero({ content }: { content?: HeroContent }) {
  const c = content ?? {};
  const bgImage       = c.heroImageUrl || HERO_BG_DEFAULT;
  const title         = c.heroTitle    || DEFAULT_TITLE;
  const subtitle      = c.heroSubtitle || DEFAULT_SUBTITLE;
  const badge         = c.heroBadge    || "";
  const statsYears    = c.statsYears   || "5+";
  const statsKids     = c.statsKids    || "100+";
  const isDefaultTitle = title === DEFAULT_TITLE;

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0">
        <img src={bgImage} alt="Hilhi Youth Basketball Team" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#080D1A]/80 via-[#080D1A]/60 to-[#080D1A]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.35),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(220,38,38,0.2),transparent_55%)]" />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      <div className="relative max-w-7xl mx-auto px-4 pt-28 pb-16 text-center">

        {badge && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-widest mb-6">
            {badge}
          </motion.div>
        )}

        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          className="text-5xl sm:text-7xl md:text-8xl font-black uppercase leading-none tracking-tight mb-6">
          {isDefaultTitle ? (
            <>
              <span className="block text-white drop-shadow-lg">Building</span>
              <span className="block text-gradient">Champions</span>
              <span className="block text-white drop-shadow-lg">On &amp; Off</span>
              <span className="block text-gradient-red">The Court</span>
            </>
          ) : (
            <span className="text-white drop-shadow-lg">{title}</span>
          )}
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }}
          className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-200 mb-10 leading-relaxed drop-shadow">
          {subtitle}
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <a href="/#contact" className="group flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 hover:scale-105 text-lg">
            Join the Team <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
          <a href="/events" className="flex items-center justify-center gap-2 px-8 py-4 bg-white/15 backdrop-blur hover:bg-white/25 text-white font-bold rounded-2xl transition-all text-lg border border-white/30">
            <Play className="w-5 h-5 fill-white" /> View Events
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.35 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {[
            [statsKids,   "Youth Players"],
            ["10+",       "Teams"],
            [statsYears,  "Years Active"],
            ["All",       "Skill Levels"],
          ].map(([v, l]) => (
            <div key={l} className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-5 border border-white/20">
              <div className="text-3xl font-black text-white mb-1">{v}</div>
              <div className="text-xs font-medium text-gray-300 uppercase tracking-wider">{l}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-60">
        <div className="w-px h-10 bg-gradient-to-b from-transparent to-blue-400" />
        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
      </div>
    </section>
  );
}
