"use client";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

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

/* Faint basketball court half-court SVG overlay */
function CourtLines() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 1920 900"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity: 0.06 }}
    >
      {/* Half-court line */}
      <line x1="0" y1="450" x2="1920" y2="450" stroke="white" strokeWidth="3" />
      {/* Center circle */}
      <circle cx="960" cy="450" r="120" fill="none" stroke="white" strokeWidth="3" />
      {/* Center dot */}
      <circle cx="960" cy="450" r="12" fill="white" />
      {/* Left key / paint */}
      <rect x="100" y="300" width="320" height="300" fill="none" stroke="white" strokeWidth="3" />
      <line x1="100" y1="450" x2="420" y2="450" stroke="white" strokeWidth="3" />
      {/* Left free throw circle */}
      <path d="M 420 300 A 120 120 0 0 1 420 600" fill="none" stroke="white" strokeWidth="3" />
      {/* Left 3-point arc */}
      <path d="M 100 200 A 500 500 0 0 1 100 700" fill="none" stroke="white" strokeWidth="3" />
      {/* Right key / paint */}
      <rect x="1500" y="300" width="320" height="300" fill="none" stroke="white" strokeWidth="3" />
      <line x1="1500" y1="450" x2="1820" y2="450" stroke="white" strokeWidth="3" />
      {/* Right free throw circle */}
      <path d="M 1500 300 A 120 120 0 0 0 1500 600" fill="none" stroke="white" strokeWidth="3" />
      {/* Right 3-point arc */}
      <path d="M 1820 200 A 500 500 0 0 0 1820 700" fill="none" stroke="white" strokeWidth="3" />
    </svg>
  );
}

/* Scrolling sports ticker */
const TICKER_ITEMS = [
  "🏀 2026 Youth Summer Camp — Registration Open",
  "⭐ Ages 5–14 · All Skill Levels Welcome",
  "📍 Hillsboro, Oregon",
  "🏆 Building Champions On and Off the Court",
  "🎽 Official Merch Now Available",
  "📅 Camp: June 22–25, 2026",
  "🔥 Join the Hilhi Youth Basketball Family",
];

function Ticker() {
  const text = TICKER_ITEMS.join("   •   ");
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-orange-500/90 backdrop-blur-sm overflow-hidden h-10 flex items-center border-t border-orange-400/50 z-10">
      <div className="flex-shrink-0 bg-orange-700 text-white text-xs font-black uppercase tracking-widest px-4 h-full flex items-center whitespace-nowrap z-10 shadow-lg">
        🏀 LIVE
      </div>
      <div className="overflow-hidden flex-1 relative">
        <motion.div
          className="flex whitespace-nowrap text-white text-xs font-semibold tracking-wide gap-0"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          <span className="pr-16">{text}</span>
          <span className="pr-16">{text}</span>
        </motion.div>
      </div>
    </div>
  );
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

      {/* Background photo */}
      <div className="absolute inset-0">
        <img src={bgImage} alt="Hilhi Youth Basketball Team" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#080D1A]/85 via-[#080D1A]/65 to-[#080D1A]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.35),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(249,115,22,0.18),transparent_55%)]" />
      </div>

      {/* Basketball court line overlay */}
      <CourtLines />

      {/* Floating basketball emoji accent */}
      <motion.div
        className="absolute right-[8%] top-[22%] text-7xl select-none pointer-events-none hidden lg:block"
        animate={{ y: [0, -18, 0], rotate: [0, 15, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ filter: "drop-shadow(0 0 32px rgba(249,115,22,0.5))" }}
      >
        🏀
      </motion.div>

      <div className="relative max-w-7xl mx-auto px-4 pt-28 pb-20 text-center">

        {/* Season badge */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-black uppercase tracking-widest mb-6">
          {badge || "🏆 Hillsboro's Youth Basketball Program"}
        </motion.div>

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
          <a href="/register" className="group flex items-center justify-center gap-2 px-8 py-4 bg-orange-500 hover:bg-orange-400 text-white font-black rounded-2xl transition-all shadow-lg shadow-orange-500/40 hover:shadow-orange-500/60 hover:scale-105 text-lg uppercase tracking-wide">
            Register Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
          <a href="/#programs" className="flex items-center justify-center gap-2 px-8 py-4 bg-white/15 backdrop-blur hover:bg-white/25 text-white font-bold rounded-2xl transition-all text-lg border border-white/30">
            Explore Programs
          </a>
        </motion.div>

        {/* Scoreboard-style stats */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.35 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
          {[
            { v: statsKids, l: "Youth Players" },
            { v: "10+",     l: "Active Teams" },
            { v: statsYears,l: "Years Strong" },
            { v: "All",     l: "Skill Levels" },
          ].map(({ v, l }) => (
            <div key={l} className="relative overflow-hidden bg-black/50 backdrop-blur-md rounded-2xl px-4 py-5 border border-white/10 group hover:border-orange-500/40 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-orange-500/0 group-hover:from-orange-500/5 group-hover:to-transparent transition-all" />
              <div className="text-3xl font-black text-orange-400 mb-1 font-mono">{v}</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{l}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50">
        <div className="w-px h-8 bg-gradient-to-b from-transparent to-orange-400" />
        <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
      </div>

      {/* Sports ticker */}
      <Ticker />
    </section>
  );
}
