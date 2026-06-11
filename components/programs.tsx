"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { SiteContent, ProgramCard } from "@/lib/content";

const TAG_COLORS = [
  "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "bg-green-500/20 text-green-300 border-green-500/30",
  "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "bg-orange-500/20 text-orange-300 border-orange-500/30",
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
    <section id="programs" className="py-24">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.7}} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold uppercase tracking-widest mb-4">Programs &amp; Resources</div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-5">Everything You Need<br/><span className="text-gradient">In One Place</span></h2>
          <p className="max-w-xl mx-auto text-gray-400 text-lg">From youth teams to high school prep — Hilhi Youth Basketball has a program for every player.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map((p, i) => (
            <motion.a key={p.id} href={p.link}
              target={p.link.startsWith("http") ? "_blank" : undefined}
              rel={p.link.startsWith("http") ? "noopener noreferrer" : undefined}
              initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.6,delay:i*0.1}}
              className={`card-hover group relative rounded-3xl p-6 flex flex-col gap-4 border transition-all duration-300 ${p.highlight ? "bg-gradient-to-br from-blue-600 to-blue-800 border-blue-500/50 shadow-xl shadow-blue-500/20" : "glass border-white/10 hover:border-white/20"}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${p.highlight ? "bg-white/20" : "bg-white/5 group-hover:bg-white/10"} transition-colors`}>
                {p.icon}
              </div>
              <span className={`self-start text-xs font-semibold px-2.5 py-1 rounded-full border ${p.highlight ? "bg-white/20 text-white border-white/30" : TAG_COLORS[i % TAG_COLORS.length]}`}>{p.tag}</span>
              <div>
                <h3 className="font-black text-xl text-white mb-1">{p.title}</h3>
                <p className={`text-sm font-medium mb-2 ${p.highlight ? "text-blue-200" : "text-blue-400"}`}>{p.subtitle}</p>
                <p className={`text-sm leading-relaxed ${p.highlight ? "text-blue-100" : "text-gray-400"}`}>{p.desc}</p>
              </div>
              <div className={`mt-auto flex items-center gap-1 text-sm font-semibold ${p.highlight ? "text-white" : "text-blue-400"}`}>
                Learn More <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
