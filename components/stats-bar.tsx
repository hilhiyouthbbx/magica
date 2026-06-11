"use client";
import { motion } from "framer-motion";

const STATS = [
  { icon: "🏀", value: "100+", label: "Players Developed" },
  { icon: "🏆", value: "10+",  label: "Teams Each Season" },
  { icon: "⭐", value: "5+",   label: "Years of Excellence" },
  { icon: "🎽", value: "K–8",  label: "Grades We Serve" },
  { icon: "📍", value: "HHS",  label: "Home Court" },
  { icon: "🔥", value: "All",  label: "Skill Levels" },
];

export function StatsBar() {
  return (
    <section className="relative bg-[#050A14] border-y border-orange-500/20 overflow-hidden py-0">
      {/* Orange glow lines top & bottom */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />

      {/* Faint basketball court arc */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.04]" viewBox="0 0 1200 120" preserveAspectRatio="xMidYMid slice">
        <circle cx="600" cy="180" r="160" fill="none" stroke="white" strokeWidth="2" />
        <line x1="0" y1="60" x2="1200" y2="60" stroke="white" strokeWidth="2" />
      </svg>

      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-orange-500/10">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="flex flex-col items-center justify-center py-6 px-2 text-center group hover:bg-orange-500/5 transition-colors"
            >
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-black text-orange-400 font-mono leading-none">{s.value}</div>
              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
