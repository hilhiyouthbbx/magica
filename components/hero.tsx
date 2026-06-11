"use client";
import { motion } from "framer-motion";
import { ArrowRight, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";

interface HeroContent {
  heroTitle?:    string;
  heroSubtitle?: string;
}

// YouTube video IDs to cycle — HoopSource intro + Hilhi-tagged content
const VIDEO_ID = "LY2eSoqV_GA"; // HoopSource basketball highlights intro

export function Hero({ content }: { content?: HeroContent }) {
  const c        = content ?? {};
  const title    = c.heroTitle    || "Hillsboro's Home for Youth Basketball";
  const subtitle = c.heroSubtitle || "Developing players, building character, and growing a love for the game — from beginner to elite.";
  const [muted, setMuted]   = useState(true);

  const videoSrc = `https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&mute=${muted ? 1 : 0}&loop=1&playlist=${VIDEO_ID}&controls=0&rel=0&showinfo=0&modestbranding=1&playsinline=1&enablejsapi=1`;

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* ── Full-screen video background ── */}
      <div className="absolute inset-0 z-0">
        <iframe
          key={muted ? "muted" : "unmuted"}
          src={videoSrc}
          title="Hilhi Youth Basketball Highlights"
          allow="autoplay; fullscreen"
          allowFullScreen
          className="absolute top-1/2 left-1/2 w-[177.78vh] min-w-full h-[56.25vw] min-h-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ border: "none" }}
        />
        {/* Dark overlays for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#080D1A]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />
      </div>

      {/* ── SPARTAN badge (top-left, no registration promo) ── */}
      <div className="absolute top-24 left-6 sm:left-10 z-10">
        <span className="inline-flex items-center gap-2 border border-white/30 text-white/80 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 backdrop-blur-sm bg-black/30 rounded-sm">
          ⚡ Hilhi Spartans · Youth Basketball
        </span>
      </div>

      {/* ── Mute / Unmute button ── */}
      <button
        onClick={() => setMuted(m => !m)}
        className="absolute top-24 right-6 sm:right-10 z-10 p-2.5 bg-black/40 hover:bg-black/60 border border-white/20 rounded-full text-white/70 hover:text-white transition-all backdrop-blur-sm"
        title={muted ? "Unmute" : "Mute"}
      >
        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>

      {/* ── Hero text — left-aligned ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pt-40 pb-28">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="max-w-3xl"
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6 uppercase drop-shadow-2xl">
            {title}
          </h1>

          <p className="text-lg sm:text-xl text-gray-200 mb-10 max-w-xl leading-relaxed drop-shadow-lg">
            {subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <a href="/register"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#F97316] hover:bg-orange-400 text-white font-black text-lg uppercase tracking-wide rounded-sm transition-all shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50">
              Register Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="/events"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur text-white font-bold text-lg rounded-sm transition-all border border-white/20">
              View Events
            </a>
          </div>
        </motion.div>
      </div>

      {/* ── Scroll-fade bottom blend ── */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#080D1A] to-transparent z-10" />
    </section>
  );
}
