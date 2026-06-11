"use client";
import { motion } from "framer-motion";
import { Shield, Users, Zap, Trophy } from "lucide-react";

const COURT_IMG_DEFAULT = "https://static.wixstatic.com/media/458ec6_b4485ee7904d414c9d5e981965dbc744~mv2.jpg/v1/fill/w_1200,h_700,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/basketball.jpg";
const TEAM_IMG          = "https://static.wixstatic.com/media/458ec6_07208ccf6e6e4aa8ac95a7a251f226a3~mv2.jpg/v1/fill/w_900,h_600,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/photo1.jpg";

const DEFAULT_BADGE = "Our Mission";
const DEFAULT_TITLE = "About Hilhi Youth Basketball";
const DEFAULT_TEXT1 = "Hilhi Youth Basketball prides itself on having a culture of leadership and hard work. We shape leaders by cultivating raw talent with quality coaching, creating a competitive environment and bringing an authentic love of the game to the players.";
const DEFAULT_TEXT2 = "Discipline, teamwork, sportsmanship, and having a positive attitude are foundational qualities instilled at all of our youth levels — these are the hallmarks of Hilhi Youth Basketball.";

const values = [
  { icon: Shield, title: "Leadership",    desc: "We instill leadership qualities in every player, on and off the court." },
  { icon: Users,  title: "Teamwork",      desc: "Building bonds that last a lifetime through the shared love of basketball." },
  { icon: Zap,    title: "Discipline",    desc: "Quality coaching and structured practice that elevates every player's game." },
  { icon: Trophy, title: "Sportsmanship", desc: "Winning with class, losing with grace — always representing Hilhi proudly." },
];

interface AboutContent {
  aboutBadge?:    string;
  aboutTitle?:    string;
  aboutText?:     string;
  aboutImageUrl?: string;
}

export function About({ content }: { content?: AboutContent }) {
  const badge     = content?.aboutBadge    || DEFAULT_BADGE;
  const title     = content?.aboutTitle    || DEFAULT_TITLE;
  const mainText  = content?.aboutText     || DEFAULT_TEXT1;
  const courtImg  = content?.aboutImageUrl || COURT_IMG_DEFAULT;
  const showP2    = !content?.aboutText;

  return (
    <section id="about" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.07),transparent_70%)]" />

      <div className="relative max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-widest mb-4">
            {badge}
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-5 leading-tight">
            {title.includes("Hilhi") || title.includes("Basketball")
              ? <>{title.replace("Hilhi Youth Basketball", "").trim() || "About Hilhi Youth"}<br /><span className="text-gradient">Basketball</span></>
              : <span>{title}</span>}
          </h2>
        </motion.div>

        {/* Two-column: text + image */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <p className="text-gray-300 text-lg leading-relaxed mb-6">{mainText}</p>
            {showP2 && (
              <p className="text-gray-400 leading-relaxed mb-8">{DEFAULT_TEXT2}</p>
            )}
            <div className="grid grid-cols-2 gap-4">
              {values.map((v) => (
                <div key={v.title} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <v.icon className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{v.title}</div>
                    <div className="text-gray-500 text-xs mt-0.5 leading-relaxed">{v.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Stacked photos */}
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
            className="relative">
            <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-blue-500/10">
              <img src={courtImg} alt="Basketball" className="w-full object-cover" style={{ height: "360px" }} />
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-[#080D1A]/40 to-transparent pointer-events-none" />
            </div>
            <div className="absolute -bottom-6 -left-6 w-44 h-32 rounded-2xl overflow-hidden border-4 border-[#080D1A] shadow-2xl shadow-black/50">
              <img src={TEAM_IMG} alt="Team huddle" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -top-4 -right-4 bg-blue-600 text-white rounded-2xl px-4 py-3 shadow-xl shadow-blue-500/30 text-center">
              <div className="font-black text-2xl leading-none">5+</div>
              <div className="text-blue-200 text-xs font-medium mt-0.5">Years Strong</div>
            </div>
          </motion.div>
        </div>

        {/* Team spirit banner */}
        <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0">
            <img src={courtImg} alt="" className="w-full h-full object-cover opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-blue-800/80 to-indigo-900/90" />
          </div>
          <div className="relative px-8 py-12 sm:px-16 sm:py-16 flex flex-col sm:flex-row items-center justify-between gap-8">
            <div>
              <div className="text-blue-300 text-sm font-semibold uppercase tracking-widest mb-2">We&apos;ve Got Team Spirit</div>
              <h3 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                Discipline, Teamwork,<br /><span className="text-blue-300">Positive Attitude.</span>
              </h3>
              <p className="mt-3 text-gray-300 max-w-md">These hallmarks are instilled at all youth levels — the foundation of Hilhi Youth Basketball.</p>
            </div>
            <a href="/#programs" className="flex-shrink-0 px-8 py-4 bg-white text-blue-900 font-black rounded-2xl hover:bg-blue-50 transition-all hover:scale-105 shadow-2xl text-lg whitespace-nowrap">
              Explore Programs →
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
