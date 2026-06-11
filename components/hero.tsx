"use client";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Volume2, VolumeX, ChevronRight } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

// All 6 Hudl game clips — cycle as background reel
const CLIPS = [
  {
    src: "https://va.hudl.com/p-highlights/Team/301514/699cf1733f6009dbc905dad2/55c046f0_720.mp4?v=5D87732B3C73DE08",
    label: "vs St. Helens",
    date: "Feb 19, 2026",
  },
  {
    src: "https://va.hudl.com/p-highlights/Team/301514/698daa4a840b90a7f0770b01/b787395e_720.mp4?v=397330F7206ADE08",
    label: "at Milwaukie",
    date: "Feb 9, 2026",
  },
  {
    src: "https://va.hudl.com/p-highlights/Team/301514/697a3fd9ff257d2d3008bede/560f6074_720.mp4?v=071A58798E5EDE08",
    label: "vs Canby",
    date: "Jan 27, 2026",
  },
  {
    src: "https://va.hudl.com/p-highlights/Team/301514/6954d1707c627ed7c39c29ec/87115679_720.mp4?v=FEB19D143F48DE08",
    label: "vs Willamette",
    date: "Dec 29, 2025",
  },
  {
    src: "https://va.hudl.com/p-highlights/Team/301514/6943ac63970b6d0d5658bd9a/2aafdcb9_720.mp4?v=86A2CBF6063EDE08",
    label: "vs Glencoe",
    date: "Dec 16, 2025",
  },
  {
    src: "https://va.hudl.com/p-highlights/Team/301514/693cdfbf7351f179552f0ded/593dcf47_720.mp4?v=DF0A9580F939DE08",
    label: "vs Century",
    date: "Dec 11, 2025",
  },
];

interface HeroContent {
  heroTitle?:    string;
  heroSubtitle?: string;
}

export function Hero({ content }: { content?: HeroContent }) {
  const c       = content ?? {};
  const title   = c.heroTitle    || "Hillsboro's Home for Youth Basketball";
  const subtitle = c.heroSubtitle || "Developing players, building character, and growing a love for the game — from beginner to elite.";

  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(0);   // lags by one frame for cross-fade
  const [muted, setMuted]     = useState(true);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Advance to next clip
  const advance = useCallback(() => {
    setCurrent(prev => {
      const next = (prev + 1) % CLIPS.length;
      // start loading next
      const nextVid = videoRefs.current[next];
      if (nextVid) {
        nextVid.currentTime = 0;
        nextVid.play().catch(() => {});
      }
      return next;
    });
  }, []);

  // When current changes, update visible after a short delay (cross-fade window)
  useEffect(() => {
    const t = setTimeout(() => setVisible(current), 100);
    return () => clearTimeout(t);
  }, [current]);

  // Boot: play first clip
  useEffect(() => {
    const v = videoRefs.current[0];
    if (v) v.play().catch(() => {});
  }, []);

  // Sync mute state to all videos
  useEffect(() => {
    videoRefs.current.forEach(v => { if (v) v.muted = muted; });
  }, [muted]);

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* ── Video stack — all 6 layered, only active one is opaque ── */}
      <div className="absolute inset-0 z-0">
        {CLIPS.map((clip, i) => (
          <video
            key={i}
            ref={el => { videoRefs.current[i] = el; }}
            src={clip.src}
            muted={muted}
            playsInline
            preload={i === 0 ? "auto" : "none"}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
            style={{ opacity: visible === i ? 1 : 0 }}
            onEnded={advance}
          />
        ))}

        {/* Gradient overlays for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/35 to-[#080D1A]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-transparent to-transparent" />
      </div>

      {/* ── Now playing badge — top left ── */}
      <div className="absolute top-24 left-6 sm:left-10 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2 bg-black/50 backdrop-blur-sm border border-white/20 rounded-sm px-3 py-1.5"
          >
            {/* Live pulse dot */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F97316] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F97316]" />
            </span>
            <span className="text-[10px] text-white/80 font-bold uppercase tracking-widest">
              Hilhi {CLIPS[current].label} · {CLIPS[current].date}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Clip progress dots ── */}
      <div className="absolute top-[6.5rem] right-6 sm:right-10 z-10 flex items-center gap-2">
        {CLIPS.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              const v = videoRefs.current[i];
              if (v) { v.currentTime = 0; v.play().catch(() => {}); }
              setCurrent(i);
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? "w-6 bg-[#F97316]" : "w-1.5 bg-white/30 hover:bg-white/60"
            }`}
            title={CLIPS[i].label}
          />
        ))}

        {/* Mute button */}
        <button
          onClick={() => setMuted(m => !m)}
          className="ml-2 p-2 bg-black/40 hover:bg-black/60 border border-white/20 rounded-full text-white/70 hover:text-white transition-all backdrop-blur-sm"
          title={muted ? "Unmute" : "Mute"}
        >
          {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* ── Hero text — left-aligned ── */}
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
              href="/register"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#F97316] hover:bg-orange-400 text-white font-black text-lg uppercase tracking-wide rounded-sm transition-all shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50"
            >
              Register Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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

      {/* ── Next clip hint — bottom right ── */}
      <button
        onClick={advance}
        className="absolute bottom-12 right-6 sm:right-10 z-10 flex items-center gap-1.5 text-[11px] text-white/50 hover:text-white/90 uppercase tracking-widest font-semibold transition-colors"
      >
        Next clip <ChevronRight className="w-3.5 h-3.5" />
      </button>

      {/* ── Bottom gradient blend ── */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#080D1A] to-transparent z-10" />
    </section>
  );
}
