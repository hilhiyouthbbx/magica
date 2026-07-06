"use client";
import { motion } from "framer-motion";
import { ArrowRight, Volume2, VolumeX } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface HeroContent {
  heroTitle?:    string;
  heroSubtitle?: string;
}

export function Hero({ content }: { content?: HeroContent }) {
  const c        = content ?? {};
  const title    = c.heroTitle    || "Hillsboro's Home for Youth Basketball";
  const subtitle = c.heroSubtitle || "Developing players, building character, and growing a love for the game — from beginner to elite.";

  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Autoplay as soon as the component mounts
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.play().catch(() => {});
  }, []);

  // Toggle mute/unmute
  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* ── Full-screen mixed highlight video background ── */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          src="/hero_bg.mp4"
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/35 to-[#080D1A]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-transparent to-transparent" />
      </div>

      {/* ── Spartan tag — top left ── */}
      <div className="absolute top-24 left-6 sm:left-10 z-10">
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm border border-white/20 rounded-sm px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F97316] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F97316]" />
          </span>
          <span className="text-[10px] text-white/80 font-bold uppercase tracking-widest">
            Hilhi Spartans · 2025–26 Season Highlights
          </span>
        </div>
      </div>

      {/* ── Mute toggle — top right ── */}
      <button
        onClick={toggleMute}
        className="absolute top-24 right-6 sm:right-10 z-10 p-2.5 bg-black/40 hover:bg-black/60 border border-white/20 rounded-full text-white/70 hover:text-white transition-all backdrop-blur-sm"
        title={muted ? "Unmute" : "Mute"}
      >
        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>

      {/* ── Hero text ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pt-44 pb-28">
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
            <a
              href="/join"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#F97316] hover:bg-orange-400 text-white font-black text-lg uppercase tracking-wide rounded-sm transition-all shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50"
            >
              Join HILHI <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="/events"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur text-white font-bold text-lg rounded-sm transition-all border border-white/20"
            >
              View Events
            </a>
          </div>
        </motion.div>
      </div>

      {/* ── Bottom fade into page ── */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#080D1A] to-transparent z-10" />
    </section>
  );
}
