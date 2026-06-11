"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

/* Animated counter */
function Counter({ target, suffix = "+" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1800;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current = Math.min(current + increment, target);
            setCount(Math.floor(current));
            if (current >= target) clearInterval(timer);
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref} className="text-5xl sm:text-6xl font-black text-white tabular-nums">
      {count}{suffix}
    </div>
  );
}

const STATS = [
  { target: 100, suffix: "+", label: "Youth Players" },
  { target: 10,  suffix: "+", label: "Active Teams"  },
  { target: 5,   suffix: "+", label: "Years Strong"  },
  { target: 35,  suffix: "+", label: "Annual Events" },
];

export function WeAreHilhi() {
  return (
    <section className="py-24 bg-[#060B14] relative overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.06),transparent_65%)]" />

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">

          {/* Left — mission text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-orange-500 text-xs font-black uppercase tracking-[0.2em] mb-3">Who We Are</p>
            <h2 className="text-4xl sm:text-5xl font-black text-white uppercase leading-tight mb-6">
              We Are<br />
              <span className="text-orange-400">Hilhi Youth</span><br />
              Basketball
            </h2>
            <p className="text-gray-300 text-lg leading-relaxed mb-5">
              Hilhi Youth Basketball is Hillsboro's hometown basketball program — built on a culture of leadership,
              hard work, and an authentic love of the game. We shape champions on and off the court.
            </p>
            <p className="text-gray-500 leading-relaxed mb-8">
              Discipline, teamwork, sportsmanship, and a positive attitude are the hallmarks instilled at every youth level.
              From beginners finding the game for the first time to competitive players pushing toward the next level — there's
              a place here for every kid in our community.
            </p>
            <a href="/join"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-black uppercase tracking-wide px-7 py-3.5 rounded-sm transition-all text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40">
              Join the Program →
            </a>
          </motion.div>

          {/* Right — stacked photos */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="rounded-lg overflow-hidden border border-white/10 shadow-2xl">
              <img
                src="https://static.wixstatic.com/media/458ec6_b4485ee7904d414c9d5e981965dbc744~mv2.jpg/v1/fill/w_1200,h_700,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/basketball.jpg"
                alt="Hilhi Youth Basketball"
                className="w-full object-cover"
                style={{ height: "380px" }}
              />
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-5 -left-5 bg-orange-500 text-white rounded-lg px-5 py-4 shadow-2xl shadow-orange-500/40">
              <div className="text-3xl font-black leading-none">5+</div>
              <div className="text-orange-100 text-xs font-bold mt-0.5 uppercase tracking-wider">Years Strong</div>
            </div>
            <div className="absolute -top-4 -right-4 bg-[#080D1A] border border-orange-500/30 text-white rounded-lg px-4 py-3 shadow-xl">
              <div className="text-2xl font-black text-orange-400">100+</div>
              <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Youth Players</div>
            </div>
          </motion.div>
        </div>

        {/* Stats counter row — HoopSource style */}
        <div className="border-t border-white/10 pt-16">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Counter target={s.target} suffix={s.suffix} />
                <div className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
