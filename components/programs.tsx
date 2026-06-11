"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { SiteContent, ProgramCard } from "@/lib/content";

const TAG_COLORS = [
  "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "bg-green-500/20 text-green-300 border-green-500/30",
  "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "bg-red-500/20 text-red-300 border-red-500/30",
  "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
];

const FALLBACK: ProgramCard[] = [
  { id:"prog-1", icon:"👥", title:"Youth Teams",    subtitle:"All Skill Levels",  desc:"Structured teams for youth players at every level. Learn fundamentals, compete in leagues, and grow as a player and teammate.", tag:"Ages 5–14",      link:"/join",      highlight:true  },
  { id:"prog-2", icon:"📅", title:"Events & Camps", subtitle:"Register Today",    desc:"Stay up to date with all youth camps, league games, practice schedules, and important events throughout the season.",          tag:"Camp Open!",   link:"/events",    highlight:false },
  { id:"prog-3", icon:"⭐", title:"HS Calendar",    subtitle:"High School Events",desc:"High school basketball events, tryouts, and elite training opportunities for advanced players looking to compete at the next level.", tag:"High School", link:"https://www.hilhiyouthbbx.com/hs-calender", highlight:false },
  { id:"prog-4", icon:"🛒", title:"Merchandise",    subtitle:"Official Gear",     desc:"Rep your team with official Hilhi Youth Basketball apparel. New arrivals available — jerseys, hoodies, and more.",             tag:"New Arrivals", link:"/merch",     highlight:false },
];

export function Programs() {
  const [cards, setCards] = useState<ProgramCard[]>(FALLBACK);

  useEffect(() => {
    fetch("/api/content")
      .then(r => r.json())
      .then((data: SiteContent) => {
        if (data?.home?.programCards?.length) setCards(data.home.programCards);
      })
      .catch(() => {});
  }, []);

  return (
    <section id="programs" className="py-24 relative overflow-hidden">
      {/* Basketball court paint lines in background */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.035]" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice">
        <rect x="60" y="160" width="280" height="280" fill="none" stroke="white" strokeWidth="2.5" />
        <path d="M 340 160 A 120 120 0 0 1 340 440" fill="none" stroke="white" strokeWidth="2.5" />
        <path d="M 60 80 A 450 450 0 0 1 60 520" fill="none" stroke="white" strokeWidth="2.5" />
        <rect x="860" y="160" width="280" height="280" fill="none" stroke="white" strokeWidth="2.5" />
        <path d="M 860 160 A 120 120 0 0 0 860 440" fill="none" stroke="white" strokeWidth="2.5" />
        <path d="M 1140 80 A 450 450 0 0 0 1140 520" fill="none" stroke="white" strokeWidth="2.5" />
        <line x1="0" y1="300" x2="1200" y2="300" stroke="white" strokeWidth="2" />
        <circle cx="600" cy="300" r="100" fill="none" stroke="white" strokeWidth="2" />
      </svg>

      <div className="relative max-w-7xl mx-auto px-4">
        <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.7}} className="text-center mb-16">
          {/* Scoreboard-style header */}
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-8 h-px bg-orange-500/60" />
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-black uppercase tracking-widest">
              🏀 Programs &amp; Resources
            </div>
            <div className="w-8 h-px bg-orange-500/60" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-5">
            Everything You Need<br/>
            <span className="text-gradient">In One Place</span>
          </h2>
          <p className="max-w-xl mx-auto text-gray-400 text-lg">From youth teams to high school prep — Hilhi Youth Basketball has a program for every player.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map((p, i) => (
            <motion.a key={p.id} href={p.link}
              target={p.link.startsWith("http") ? "_blank" : undefined}
              rel={p.link.startsWith("http") ? "noopener noreferrer" : undefined}
              initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.6,delay:i*0.1}}
              className={`card-hover group relative rounded-3xl p-6 flex flex-col gap-4 border transition-all duration-300 ${
                p.highlight
                  ? "bg-gradient-to-br from-orange-500 to-orange-700 border-orange-400/50 shadow-xl shadow-orange-500/25"
                  : "glass border-white/10 hover:border-orange-500/30"
              }`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${p.highlight ? "bg-white/20" : "bg-white/5 group-hover:bg-orange-500/10"} transition-colors`}>
                {p.icon}
              </div>
              <span className={`self-start text-xs font-bold px-2.5 py-1 rounded-full border ${p.highlight ? "bg-white/20 text-white border-white/30" : TAG_COLORS[i % TAG_COLORS.length]}`}>
                {p.tag}
              </span>
              <div>
                <h3 className="font-black text-xl text-white mb-1">{p.title}</h3>
                <p className={`text-sm font-semibold mb-2 ${p.highlight ? "text-orange-100" : "text-orange-400"}`}>{p.subtitle}</p>
                <p className={`text-sm leading-relaxed ${p.highlight ? "text-orange-100" : "text-gray-400"}`}>{p.desc}</p>
              </div>
              <div className={`mt-auto flex items-center gap-1 text-sm font-bold ${p.highlight ? "text-white" : "text-orange-400"}`}>
                Learn More <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
