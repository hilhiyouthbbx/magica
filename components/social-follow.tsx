"use client";
import { motion } from "framer-motion";

interface SocialContent {
  instagram?: string;
  facebook?:  string;
  youtube?:   string;
  tiktok?:    string;
  twitter?:   string;
}

export function SocialFollow({ content }: { content?: SocialContent }) {
  const c = content ?? {};
  const instagramUrl = c.instagram || "https://www.instagram.com/hilhispartansmbb";
  const instagramHandle = "@" + instagramUrl.replace(/\/$/, "").split("/").pop();
  const youtubeUrl   = c.youtube   || "https://www.youtube.com/@hilhiyouthbbx";

  return (
    <section className="py-20 bg-[#060B14]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-orange-500 text-xs font-black uppercase tracking-[0.2em] mb-2">Stay Connected</p>
            <h2 className="text-4xl sm:text-5xl font-black text-white uppercase leading-tight">
              Hilhi on Social
            </h2>
          </div>
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 text-sm font-bold text-orange-400 hover:text-orange-300 transition-colors border-b border-orange-500/40 pb-0.5"
          >
            Follow on Instagram →
          </a>
        </div>

        {/* Social cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Instagram */}
          <motion.a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="group relative overflow-hidden rounded-lg border border-white/10 hover:border-pink-500/40 bg-gradient-to-br from-[#0d1220] to-[#0d0a14] p-8 flex flex-col items-center text-center gap-4 transition-all hover:shadow-xl hover:shadow-pink-500/10"
          >
            <div className="text-5xl">📸</div>
            <div>
              <div className="font-black text-white text-xl mb-1">Instagram</div>
              <div className="text-gray-500 text-sm">{instagramHandle}</div>
            </div>
            <div className="mt-auto inline-flex items-center gap-2 text-pink-400 font-bold text-sm group-hover:text-pink-300 transition-colors">
              Follow Us →
            </div>
          </motion.a>

          {/* Newsletter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-lg border border-orange-500/30 bg-gradient-to-br from-orange-950/40 to-[#0d1220] p-8 flex flex-col items-center text-center gap-4"
          >
            <div className="text-5xl">📬</div>
            <div>
              <div className="font-black text-white text-xl mb-1">Stay in the Loop</div>
              <div className="text-gray-400 text-sm">Get news, camp updates & event announcements straight to your inbox.</div>
            </div>
            <a
              href="/#contact"
              className="mt-auto inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-black uppercase tracking-wide text-sm px-6 py-3 rounded-sm transition-all"
            >
              Get Updates
            </a>
          </motion.div>

          {/* YouTube */}
          <motion.a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="group relative overflow-hidden rounded-lg border border-white/10 hover:border-red-500/40 bg-gradient-to-br from-[#0d1220] to-[#140a0a] p-8 flex flex-col items-center text-center gap-4 transition-all hover:shadow-xl hover:shadow-red-500/10"
          >
            <div className="text-5xl">▶️</div>
            <div>
              <div className="font-black text-white text-xl mb-1">YouTube</div>
              <div className="text-gray-500 text-sm">Highlights & game footage</div>
            </div>
            <div className="mt-auto inline-flex items-center gap-2 text-red-400 font-bold text-sm group-hover:text-red-300 transition-colors">
              Subscribe →
            </div>
          </motion.a>
        </div>
      </div>
    </section>
  );
}
