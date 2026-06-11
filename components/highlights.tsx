"use client";
import { useState, useRef } from "react";
import { Play, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const GAMES = [
  {
    id: 0,
    title: "vs St. Helens",
    label: "Game Recap",
    date: "Feb 19, 2026",
    duration: "1:51",
    thumb: "https://va.hudl.com/p-highlights/Team/301514/699cf1733f6009dbc905dad1/4b6ca255_720.jpg?v=ACD6BE313C73DE08",
    videoUrl: "https://va.hudl.com/p-highlights/Team/301514/699cf1733f6009dbc905dad2/55c046f0_720.mp4?v=5D87732B3C73DE08",
    hudlUrl: "https://www.hudl.com/video/2/301514/699cf1733f6009dbc905dad2",
  },
  {
    id: 1,
    title: "at Milwaukie",
    label: "Game Recap",
    date: "Feb 9, 2026",
    duration: "1:51",
    thumb: "https://va.hudl.com/p-highlights/Team/301514/698daa49840b90a7f0770aff/c09c3ee7_720.jpg?v=8774AFFB206ADE08",
    videoUrl: "https://va.hudl.com/p-highlights/Team/301514/698daa4a840b90a7f0770b01/b787395e_720.mp4?v=397330F7206ADE08",
    hudlUrl: "https://www.hudl.com/video/2/301514/698daa4a840b90a7f0770b01",
  },
  {
    id: 2,
    title: "vs Canby",
    label: "Game Recap",
    date: "Jan 27, 2026",
    duration: "1:04",
    thumb: "https://va.hudl.com/p-highlights/Team/301514/697a3fd9ff257d2d3008bedc/ef8bba21_720.jpg?v=713DCB7D8E5EDE08",
    videoUrl: "https://va.hudl.com/p-highlights/Team/301514/697a3fd9ff257d2d3008bede/560f6074_720.mp4?v=071A58798E5EDE08",
    hudlUrl: "https://www.hudl.com/video/2/301514/697a3fd9ff257d2d3008bede",
  },
  {
    id: 3,
    title: "vs Willamette",
    label: "Game Recap",
    date: "Dec 29, 2025",
    duration: "1:38",
    thumb: "https://va.hudl.com/p-highlights/Team/301514/6954d1707c627ed7c39c29eb/9c350502_720.jpg?v=D15033203F48DE08",
    videoUrl: "https://va.hudl.com/p-highlights/Team/301514/6954d1707c627ed7c39c29ec/87115679_720.mp4?v=FEB19D143F48DE08",
    hudlUrl: "https://www.hudl.com/video/2/301514/6954d1707c627ed7c39c29ec",
  },
  {
    id: 4,
    title: "vs Glencoe",
    label: "Game Highlights",
    date: "Dec 16, 2025",
    duration: "1:39",
    thumb: "https://va.hudl.com/p-highlights/Team/301514/6943ac63970b6d0d5658bd99/09c5ba34_720.jpg?v=69A2980A073EDE08",
    videoUrl: "https://va.hudl.com/p-highlights/Team/301514/6943ac63970b6d0d5658bd9a/2aafdcb9_720.mp4?v=86A2CBF6063EDE08",
    hudlUrl: "https://www.hudl.com/video/2/301514/6943ac63970b6d0d5658bd9a",
  },
  {
    id: 5,
    title: "vs Century",
    label: "Game Highlights",
    date: "Dec 11, 2025",
    duration: "1:38",
    thumb: "https://va.hudl.com/p-highlights/Team/301514/693cdfbf7351f179552f0de9/5690d2a6_720.jpg?v=0F4D9D8BF939DE08",
    videoUrl: "https://va.hudl.com/p-highlights/Team/301514/693cdfbf7351f179552f0ded/593dcf47_720.mp4?v=DF0A9580F939DE08",
    hudlUrl: "https://www.hudl.com/video/2/301514/693cdfbf7351f179552f0ded",
  },
];

export function Highlights() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const game = GAMES[active];

  function selectGame(id: number) {
    setActive(id);
    setPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.load();
    }
  }

  function handlePlay() {
    setPlaying(true);
    videoRef.current?.play();
  }

  return (
    <section className="bg-[#060B14] py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-center gap-4 mb-10">
          <div className="h-1 w-10 bg-[#F97316] rounded-full" />
          <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
            Spartan Highlights
          </h2>
          <div className="h-1 flex-1 bg-white/10 rounded-full" />
          <a
            href="https://www.hudl.com/team/301514"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1 text-sm text-orange-400 hover:text-orange-300 font-bold uppercase tracking-wide transition-colors"
          >
            All on Hudl <ChevronRight className="w-4 h-4" />
          </a>
        </div>
        <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold mb-8 -mt-6">
          HilHi Boys Varsity Basketball · 2025–26 Season
        </p>

        {/* ── Main layout: player + sidebar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Featured video player ── */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="relative rounded-xl overflow-hidden bg-black border border-white/10 aspect-video"
              >
                {/* Video element */}
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  src={game.videoUrl}
                  poster={game.thumb}
                  controls={playing}
                  playsInline
                  preload="metadata"
                  onEnded={() => setPlaying(false)}
                />

                {/* Custom play overlay — shown when not playing */}
                {!playing && (
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group bg-black/30 hover:bg-black/20 transition-colors"
                    onClick={handlePlay}
                  >
                    {/* Play button */}
                    <div className="w-20 h-20 rounded-full bg-[#F97316] group-hover:bg-orange-400 flex items-center justify-center shadow-2xl shadow-orange-500/40 transition-all group-hover:scale-110">
                      <Play className="w-8 h-8 text-white fill-white ml-1" />
                    </div>
                    {/* Game label at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/90 to-transparent">
                      <span className="inline-block text-[10px] text-white font-black uppercase tracking-widest bg-[#F97316] px-2.5 py-1 rounded-sm mb-2">
                        {game.label}
                      </span>
                      <p className="text-white font-black text-xl uppercase">
                        Hillsboro {game.title}
                      </p>
                      <p className="text-gray-300 text-sm mt-0.5">{game.date} · {game.duration}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* View on Hudl link */}
            <div className="mt-3 flex items-center justify-between">
              <p className="text-gray-500 text-xs">Source: Hudl · HilHi Boys Varsity Basketball</p>
              <a
                href={game.hudlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-orange-400 hover:text-orange-300 font-bold uppercase tracking-wide transition-colors"
              >
                Open on Hudl ↗
              </a>
            </div>
          </div>

          {/* ── Game list sidebar ── */}
          <div className="flex flex-col gap-2 lg:max-h-[450px] lg:overflow-y-auto pr-1
                          scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {GAMES.map((g) => (
              <button
                key={g.id}
                onClick={() => selectGame(g.id)}
                className={`group flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  active === g.id
                    ? "border-orange-500/60 bg-orange-500/10"
                    : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10"
                }`}
              >
                {/* Thumbnail */}
                <div className="relative w-24 h-14 rounded-lg overflow-hidden flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={g.thumb}
                    alt={`Hillsboro ${g.title}`}
                    className="w-full h-full object-cover"
                  />
                  {active === g.id ? (
                    <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                        <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-5 h-5 text-white fill-white" />
                    </div>
                  )}
                  <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {g.duration}
                  </span>
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className={`font-black text-sm uppercase leading-tight truncate ${
                    active === g.id ? "text-orange-400" : "text-white group-hover:text-orange-300"
                  } transition-colors`}>
                    Hillsboro {g.title}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">{g.date}</p>
                  <span className="text-[10px] text-orange-500 font-bold uppercase tracking-wider">{g.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Hudl link */}
        <div className="mt-8 sm:hidden text-center">
          <a
            href="https://www.hudl.com/team/301514"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-orange-400 hover:text-orange-300 font-bold uppercase tracking-wide"
          >
            View All on Hudl ↗
          </a>
        </div>

      </div>
    </section>
  );
}
