"use client";
import { motion } from "framer-motion";

const photos = [
  {
    src: "https://static.wixstatic.com/media/458ec6_07208ccf6e6e4aa8ac95a7a251f226a3~mv2.jpg/v1/fill/w_900,h_600,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/photo1.jpg",
    alt: "Hilhi Youth Basketball Team",
    caption: "Team Pride",
    label: "SQUAD",
    span: "lg:col-span-2 lg:row-span-2",
  },
  {
    src: "https://static.wixstatic.com/media/458ec6_a76565cc5647487a85df67d400a9422d~mv2.jpg/v1/fill/w_800,h_450,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/photo3.jpg",
    alt: "Team in Action",
    caption: "Game Day",
    label: "GAME DAY",
    span: "lg:col-span-1",
  },
  {
    src: "https://static.wixstatic.com/media/458ec6_206c387fbcb24627b9f32c25225bd319~mv2.jpg/v1/fill/w_800,h_450,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/5th-1.jpg",
    alt: "Hilhi Youth Basketball Players",
    caption: "Season 2025",
    label: "2025 SEASON",
    span: "lg:col-span-1",
  },
];

export function Gallery() {
  return (
    <section className="py-16 relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-xs font-black text-orange-400 uppercase tracking-widest">Courtside · Our Community</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Hoops &amp; <span className="text-gradient">Highlights</span></h2>
          </div>
          <a href="https://www.instagram.com/hilhiyouthbbx" target="_blank" rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 text-sm font-bold text-orange-400 hover:text-orange-300 transition-colors border border-orange-500/30 px-4 py-2 rounded-xl hover:bg-orange-500/10">
            Follow @hilhiyouthbbx →
          </a>
        </motion.div>

        {/* Asymmetric photo grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:grid-rows-2" style={{ gridAutoRows: "240px" }}>
          {photos.map((p, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.1 }}
              className={`relative overflow-hidden rounded-2xl group cursor-pointer ${p.span}`}>
              <img src={p.src} alt={p.alt} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              {/* gradient overlay always on */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              {/* Sport label badge top-left */}
              <div className="absolute top-3 left-3">
                <span className="inline-block bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg">
                  {p.label}
                </span>
              </div>
              {/* Caption bottom */}
              <div className="absolute bottom-4 left-4">
                <div className="text-white font-black text-base drop-shadow">{p.caption}</div>
              </div>
              {/* Orange border glow on hover */}
              <div className="absolute inset-0 ring-2 ring-inset ring-orange-500/0 group-hover:ring-orange-500/40 transition-all duration-300 rounded-2xl" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
