"use client";

export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, Radio, Play, ExternalLink, Calendar, Search } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import type { SiteContent, VideoItem } from "@/lib/content";

// ── Helpers ───────────────────────────────────────────────────────────────────
function getEmbedUrl(url: string): string | null {
  if (!url) return null;

  // YouTube: watch?v=ID or youtu.be/ID or already an embed URL
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;

  // YouTube Live: youtube.com/live/ID
  const ytLive = url.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/);
  if (ytLive) return `https://www.youtube.com/embed/${ytLive[1]}?rel=0`;

  // Vimeo
  const vimMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimMatch) return `https://player.vimeo.com/video/${vimMatch[1]}`;

  // Direct .mp4 or video file — return as-is (we'll use <video> tag)
  if (url.match(/\.(mp4|webm|mov|m3u8)(\?.*)?$/i)) return url;

  // Any other URL — try iframe embed
  return url;
}

function isDirectVideo(url: string) {
  return url.match(/\.(mp4|webm|mov)(\?.*)?$/i) !== null;
}

function VideoPlayer({ item }: { item: VideoItem }) {
  const embed = getEmbedUrl(item.url);
  if (!embed) return <div className="flex items-center justify-center h-full text-gray-500 text-sm">No video URL set.</div>;

  if (isDirectVideo(embed)) {
    return (
      <video controls className="w-full h-full" poster={item.thumbnail || undefined}>
        <source src={embed} />
        Your browser does not support video playback.
      </video>
    );
  }

  return (
    <iframe
      src={embed}
      className="w-full h-full"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      allowFullScreen
    />
  );
}

// ── Video card ────────────────────────────────────────────────────────────────
function VideoCard({ item, onClick }: { item: VideoItem; onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      onClick={onClick}
      className={`glass rounded-2xl border overflow-hidden cursor-pointer group transition-all hover:scale-[1.02] hover:shadow-xl ${
        item.isLive ? "border-red-500/40 hover:border-red-400/60" : "border-white/10 hover:border-blue-500/40"
      }`}>
      {/* Thumbnail */}
      <div className="relative aspect-video bg-[#0d1525] overflow-hidden">
        {item.thumbnail
          ? <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${item.isLive ? "bg-red-600/30" : "bg-blue-600/20"}`}>
                {item.type === "stream" ? <Radio className="w-8 h-8 text-red-400" /> : <Play className="w-8 h-8 text-blue-400" />}
              </div>
            </div>
        }
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-full flex items-center justify-center border border-white/30">
            <Play className="w-6 h-6 text-white fill-white" />
          </div>
        </div>
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {item.isLive && (
            <span className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
            </span>
          )}
          {item.type === "stream" && !item.isLive && (
            <span className="flex items-center gap-1.5 bg-blue-600/80 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              <Radio className="w-3 h-3" /> Stream
            </span>
          )}
        </div>
      </div>
      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-white text-sm leading-snug mb-1 line-clamp-2">{item.title}</h3>
        {item.description && <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{item.description}</p>}
        {item.date && (
          <div className="flex items-center gap-1 mt-2 text-gray-600 text-xs">
            <Calendar className="w-3 h-3" /> {item.date}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Video modal ───────────────────────────────────────────────────────────────
function VideoModal({ item, onClose }: { item: VideoItem; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
        onClick={onClose}>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-4xl rounded-2xl overflow-hidden bg-[#0d1525] border border-white/10 shadow-2xl"
          onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-start justify-between p-4 border-b border-white/10">
            <div className="flex-1 mr-4">
              <div className="flex items-center gap-2 mb-1">
                {item.isLive && (
                  <span className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded-full uppercase">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                  </span>
                )}
                {item.date && <span className="text-gray-500 text-xs">{item.date}</span>}
              </div>
              <h2 className="text-white font-black text-lg leading-tight">{item.title}</h2>
              {item.description && <p className="text-gray-400 text-sm mt-1">{item.description}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <a href={item.url} target="_blank" rel="noopener noreferrer"
                className="p-2 glass rounded-lg border border-white/15 text-gray-400 hover:text-white transition-colors">
                <ExternalLink className="w-4 h-4" />
              </a>
              <button onClick={onClose} className="p-2 glass rounded-lg border border-white/15 text-gray-400 hover:text-white transition-colors text-xl leading-none font-bold">×</button>
            </div>
          </div>
          {/* Player */}
          <div className="aspect-video bg-black">
            <VideoPlayer item={item} />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const SESSION_KEY = "hilhi-filmroom-authed";

export default function FilmRoomPage() {
  const [authed,   setAuthed]   = useState(false);
  const [password, setPassword] = useState("");
  const [pwError,  setPwError]  = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [roomData, setRoomData] = useState<SiteContent["videoRoom"] | null>(null);
  const [selected, setSelected] = useState<VideoItem | null>(null);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState<"all" | "video" | "stream">("all");

  // Check session on load
  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored === "1") setAuthed(true);
    setLoading(false);
  }, []);

  // Load room content once authed
  useEffect(() => {
    if (!authed) return;
    fetch("/api/content")
      .then(r => r.json())
      .then((data: SiteContent) => setRoomData(data.videoRoom ?? null))
      .catch(() => {});
  }, [authed]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!roomData && !authed) {
      // Need to fetch to check password — do a quick fetch first
      fetch("/api/content")
        .then(r => r.json())
        .then((data: SiteContent) => {
          setRoomData(data.videoRoom ?? null);
          const correctPw = data?.videoRoom?.password || "hilhi-team";
          if (password === correctPw) {
            sessionStorage.setItem(SESSION_KEY, "1");
            setAuthed(true);
            setPwError("");
          } else {
            setPwError("Incorrect password. Please try again.");
          }
        })
        .catch(() => setPwError("Unable to verify. Please try again."));
      return;
    }
    const correctPw = roomData?.password || "hilhi-team";
    if (password === correctPw) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setAuthed(true);
      setPwError("");
    } else {
      setPwError("Incorrect password. Please try again.");
    }
  }

  const videos = (roomData?.videos ?? []).filter(v => v.enabled);
  const liveNow = videos.filter(v => v.isLive);
  const filtered = videos.filter(v => {
    if (filter === "video" && v.type !== "video") return false;
    if (filter === "stream" && v.type !== "stream") return false;
    if (search && !v.title.toLowerCase().includes(search.toLowerCase()) && !v.description.toLowerCase().includes(search.toLowerCase())) return false;
    return !v.isLive; // live items shown separately
  });

  // ── Login screen ────────────────────────────────────────────────────────────
  if (loading) return <div className="min-h-screen bg-[#080D1A]" />;

  if (!authed) {
    return (
      <main className="min-h-screen bg-[#080D1A] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-3xl font-black text-white mb-2">Team Film Room</h1>
            <p className="text-gray-500 text-sm">Enter your team password to access videos and live streams.</p>
          </div>
          <div className="glass rounded-2xl border border-white/15 p-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-xs font-semibold mb-1.5">Team Password</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setPwError(""); }}
                    autoFocus
                    placeholder="Enter password"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 transition-colors pr-11"
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pwError && <p className="text-red-400 text-xs mt-1.5">{pwError}</p>}
              </div>
              <button type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black rounded-xl transition-all shadow-lg shadow-blue-500/20">
                Enter Film Room
              </button>
            </form>
          </div>
        </motion.div>
      </main>
    );
  }

  // ── Film Room ────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#080D1A]">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(37,99,235,0.15),transparent_55%)]" />
        <div className="relative max-w-7xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-widest mb-4">
              <Lock className="w-3.5 h-3.5" /> Team Only
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-white mb-3">
              {roomData?.title ?? "Team Film Room"}
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl">{roomData?.subtitle}</p>
          </motion.div>
        </div>
      </section>

      {/* Live Now */}
      {liveNow.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> Live Now
            </span>
          </div>
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {liveNow.map(v => (
              <VideoCard key={v.id} item={v} onClick={() => setSelected(v)} />
            ))}
          </div>
        </section>
      )}

      {/* Library */}
      <section className="max-w-7xl mx-auto px-4 pb-24">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search videos..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
          </div>
          <div className="flex gap-2">
            {(["all","video","stream"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all capitalize ${filter === f ? "bg-blue-600 text-white" : "glass border border-white/15 text-gray-400 hover:text-white"}`}>
                {f === "all" ? "All" : f === "video" ? "📹 Videos" : "📡 Streams"}
              </button>
            ))}
          </div>
        </div>

        {/* No content */}
        {videos.length === 0 && (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-2xl font-black text-white mb-2">No Videos Yet</h3>
            <p className="text-gray-500">Check back soon — your coach will upload film sessions and stream links here.</p>
          </div>
        )}

        {/* Grid */}
        {filtered.length > 0 && (
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(v => (
              <VideoCard key={v.id} item={v} onClick={() => setSelected(v)} />
            ))}
          </div>
        )}

        {filtered.length === 0 && videos.length > 0 && (
          <div className="text-center py-16 text-gray-500">No results for your search.</div>
        )}
      </section>

      {/* Modal */}
      {selected && <VideoModal item={selected} onClose={() => setSelected(null)} />}

      <Footer />
    </main>
  );
}
