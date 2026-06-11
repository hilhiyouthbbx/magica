"use client";
import { motion } from "framer-motion";

const photos = [
  {
    src: "https://static.wixstatic.com/media/458ec6_07208ccf6e6e4aa8ac95a7a251f226a3~mv2.jpg/v1/fill/w_900,h_600,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/photo1.jpg",
    alt: "Hilhi Youth Basketball Team",
    caption: "Team Pride",
    span: "lg:col-span-2 lg:row-span-2",
  },
  {
    src: "https://static.wixstatic.com/media/458ec6_a76565cc5647487a85df67d400a9422d~mv2.jpg/v1/fill/w_800,h_450,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/photo3.jpg",
    alt: "Team in Action",
    caption: "Game Day",
    span: "lg:col-span-1",
  },
  {
    src: "https://static.wixstatic.com/media/458ec6_206c387fbcb24627b9f32c25225bd319~mv2.jpg/v1/fill/w_800,h_450,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/5th-1.jpg",
    alt: "Hilhi Youth Basketball Players",
    caption: "Season 2025",
    span: "lg:col-span-1",
  },
];

export function Gallery() {
  return (
    <section className="py-16 relative">
      {/* thin colored stripe above */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-8">
          <div>
            <div className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1">Our Community</div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Hoops &amp; <span className="text-gradient">Highlights</span></h2>
          </div>
          <a href="https://www.instagram.com/hilhiyouthbbx" target="_blank" rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">
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
              {/* gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="text-white font-bold text-sm">{p.caption}</div>
              </div>
              {/* blue tint accent */}
              <div className="absolute inset-0 ring-2 ring-inset ring-blue-500/0 group-hover:ring-blue-500/30 transition-all duration-300 rounded-2xl" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
