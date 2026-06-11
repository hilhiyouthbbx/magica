"use client";
import { motion } from "framer-motion";

/* Horizontal scrolling photo strip — like HoopSource's media wall */
const PHOTOS = [
  { src: "https://static.wixstatic.com/media/458ec6_07208ccf6e6e4aa8ac95a7a251f226a3~mv2.jpg/v1/fill/w_600,h_400,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/photo1.jpg", alt: "Team" },
  { src: "https://static.wixstatic.com/media/458ec6_a76565cc5647487a85df67d400a9422d~mv2.jpg/v1/fill/w_600,h_400,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/photo3.jpg", alt: "Game Day" },
  { src: "https://static.wixstatic.com/media/458ec6_206c387fbcb24627b9f32c25225bd319~mv2.jpg/v1/fill/w_600,h_400,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/5th-1.jpg", alt: "Players" },
  { src: "https://static.wixstatic.com/media/458ec6_b4485ee7904d414c9d5e981965dbc744~mv2.jpg/v1/fill/w_600,h_400,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/basketball.jpg", alt: "Court" },
  { src: "https://static.wixstatic.com/media/458ec6_07208ccf6e6e4aa8ac95a7a251f226a3~mv2.jpg/v1/fill/w_600,h_400,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/photo1.jpg", alt: "Team 2" },
  { src: "https://static.wixstatic.com/media/458ec6_a76565cc5647487a85df67d400a9422d~mv2.jpg/v1/fill/w_600,h_400,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/photo3.jpg", alt: "Game 2" },
];

export function ActionStrip() {
  return (
    <section className="py-16 bg-[#080D1A] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-orange-500 text-xs font-black uppercase tracking-[0.2em] mb-1">On The Court</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white uppercase">Photo Gallery</h2>
          </div>
          <a
            href="https://www.instagram.com/hilhiyouthbbx"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 text-sm font-bold text-orange-400 hover:text-orange-300 transition-colors border-b border-orange-500/40 hover:border-orange-400 pb-0.5"
          >
            Follow @hilhiyouthbbx →
          </a>
        </div>
      </div>

      {/* Auto-scrolling strip */}
      <div className="relative">
        <motion.div
          className="flex gap-4"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          style={{ width: "max-content" }}
        >
          {[...PHOTOS, ...PHOTOS].map((p, i) => (
            <div
              key={i}
              className="w-72 h-48 sm:w-80 sm:h-56 flex-shrink-0 rounded-lg overflow-hidden group cursor-pointer relative"
            >
              <img
                src={p.src}
                alt={p.alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 ring-2 ring-inset ring-orange-500/0 group-hover:ring-orange-500/50 transition-all rounded-lg" />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
