"use client";

export const dynamic = "force-dynamic";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, Radio, Play, ExternalLink, Calendar, Search, User, Mail, MessageCircle, Send, X as XIcon, Trash2 } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import type { SiteContent, VideoItem } from "@/lib/content";

// ── Helpers ───────────────────────────────────────────────────────────────────
function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;
  const ytLive = url.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/);
  if (ytLive) return `https://www.youtube.com/embed/${ytLive[1]}?rel=0`;
  const vimMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimMatch) return `https://player.vimeo.com/video/${vimMatch[1]}`;
  if (url.match(/\.(mp4|webm|mov|m3u8)(\?.*)?$/i)) return url;
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
    <iframe src={embed} className="w-full h-full"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      allowFullScreen />
  );
}

function VideoCard({ item, onClick }: { item: VideoItem; onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      onClick={onClick}
      className={`glass rounded-2xl border overflow-hidden cursor-pointer group transition-all hover:scale-[1.02] hover:shadow-xl ${
        item.isLive ? "border-red-500/40 hover:border-red-400/60" : "border-white/10 hover:border-blue-500/40"
      }`}>
      <div className="relative aspect-video bg-[#0d1525] overflow-hidden">
        {item.thumbnail
          ? <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${item.isLive ? "bg-red-600/30" : "bg-blue-600/20"}`}>
                {item.type === "stream" ? <Radio className="w-8 h-8 text-red-400" /> : <Play className="w-8 h-8 text-blue-400" />}
              </div>
            </div>
        }
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-full flex items-center justify-center border border-white/30">
            <Play className="w-6 h-6 text-white fill-white" />
          </div>
        </div>
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
          <div className="aspect-video bg-black">
            <VideoPlayer item={item} />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


// ── Chat Panel ────────────────────────────────────────────────────────────────
interface ChatMsg     { id: string; name: string; text: string; sentAt: string; }
interface ActiveViewer { name: string; lastSeen: string; watching?: string; }

function ChatPanel({ viewerName, onClose }: { viewerName: string; onClose: () => void }) {
  const [messages,  setMessages]  = useState<ChatMsg[]>([]);
  const [viewers,   setViewers]   = useState<ActiveViewer[]>([]);
  const [input,     setInput]     = useState("");
  const [sending,   setSending]   = useState(false);
  const [since,     setSince]     = useState<string | undefined>(undefined);
  const [tab,       setTab]       = useState<"chat"|"who">("chat");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Initial load — messages + fetch current viewers
  useEffect(() => {
    fetch("/api/film-room/chat")
      .then(r => r.json())
      .then((msgs: ChatMsg[]) => {
        setMessages(msgs);
        if (msgs.length > 0) setSince(msgs[msgs.length - 1].sentAt);
      })
      .catch(() => {});

    // Fetch who is currently watching
    fetch("/api/film-room/presence")
      .then(r => r.json()).then(setViewers).catch(() => {});
  }, []);

  // Heartbeat every 30s + poll messages every 2s
  useEffect(() => {
    // Message polling
    const msgInterval = setInterval(() => {
      const url = since ? `/api/film-room/chat?since=${encodeURIComponent(since)}` : "/api/film-room/chat";
      fetch(url)
        .then(r => r.json())
        .then((newMsgs: ChatMsg[]) => {
          if (newMsgs.length > 0) {
            setMessages(prev => {
              const ids = new Set(prev.map(m => m.id));
              const fresh = newMsgs.filter(m => !ids.has(m.id));
              return [...prev, ...fresh];
            });
            setSince(newMsgs[newMsgs.length - 1].sentAt);
          }
        })
        .catch(() => {});
    }, 2000);

    // Refresh viewers list every 10s
    const viewersInterval = setInterval(() => {
      fetch("/api/film-room/presence")
        .then(r => r.json()).then(setViewers).catch(() => {});
    }, 10000);

    return () => {
      clearInterval(msgInterval);
      clearInterval(viewersInterval);
    };
  }, [since, viewerName]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (tab === "chat") bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, tab]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/film-room/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: viewerName, text: input.trim() }),
      });
      const msg: ChatMsg = await res.json();
      if (msg.id) {
        setMessages(prev => [...prev.filter(m => m.id !== msg.id), msg]);
        setSince(msg.sentAt);
        setInput("");
      }
    } catch { /* ignore */ }
    setSending(false);
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  const avatarColor = (name: string) => {
    const colors = ["bg-blue-600","bg-purple-600","bg-green-600","bg-orange-600","bg-pink-600","bg-red-600","bg-teal-600"];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1525] border-l border-white/10">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-blue-400" />
          <span className="text-white font-bold text-sm">Film Room</span>
          <span className="flex items-center gap-1 bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            {viewers.length} watching
          </span>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
          <XIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b border-white/10 flex-shrink-0">
        <button onClick={() => setTab("chat")}
          className={`flex-1 py-2 text-xs font-bold transition-colors ${tab==="chat" ? "text-white border-b-2 border-blue-500" : "text-gray-500 hover:text-gray-300"}`}>
          💬 Chat
        </button>
        <button onClick={() => setTab("who")}
          className={`flex-1 py-2 text-xs font-bold transition-colors ${tab==="who" ? "text-white border-b-2 border-blue-500" : "text-gray-500 hover:text-gray-300"}`}>
          👥 Who&apos;s Watching ({viewers.length})
        </button>
      </div>

      {tab === "who" ? (
        /* ── Who's watching ── */
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0">
          {viewers.length === 0 ? (
            <div className="text-center py-8 text-gray-600 text-xs">No one else is in the room yet.</div>
          ) : (
            viewers.map(v => (
              <div key={v.name} className="flex items-center gap-3 py-2">
                <div className={`w-8 h-8 rounded-full ${avatarColor(v.name)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                  {v.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-semibold truncate">
                    {v.name === viewerName ? "You" : v.name}
                  </div>
                  {v.watching
                    ? <div className="text-green-400 text-xs flex items-center gap-1 mt-0.5 truncate">
                        <Play className="w-2.5 h-2.5 flex-shrink-0" />{v.watching}
                      </div>
                    : <div className="text-gray-600 text-xs mt-0.5">Browsing…</div>
                  }
                </div>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${v.watching ? "bg-green-400 animate-pulse" : "bg-gray-600"}`} />
              </div>
            ))
          )}
        </div>
      ) : (
        /* ── Chat messages ── */
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <MessageCircle className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="text-gray-600 text-xs">No messages yet.<br/>Be the first to say something!</p>
            </div>
          )}
          {messages.map(msg => {
            const isMe = msg.name === viewerName;
            return (
              <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                <div className={`w-7 h-7 rounded-full ${avatarColor(msg.name)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5`}>
                  {msg.name.charAt(0).toUpperCase()}
                </div>
                <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                  {!isMe && <span className="text-gray-500 text-xs mb-1 px-1">{msg.name}</span>}
                  <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                    isMe ? "bg-blue-600 text-white rounded-tr-sm" : "bg-white/8 text-gray-200 rounded-tl-sm"
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-gray-600 text-xs mt-1 px-1">{formatTime(msg.sentAt)}</span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      {tab === "chat" && (
        <form onSubmit={sendMessage} className="flex gap-2 px-3 py-3 border-t border-white/10 flex-shrink-0">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message…"
            maxLength={500}
            className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button type="submit" disabled={!input.trim() || sending}
            className="w-9 h-9 flex-shrink-0 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-xl flex items-center justify-center transition-all">
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function FilmRoomPage() {
  const [authed,     setAuthed]     = useState(false);
  const [viewerName, setViewerName] = useState("");
  const [chatOpen,   setChatOpen]   = useState(false);
  const [name,       setName]       = useState("");
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [pwError,    setPwError]    = useState("");
  const [showPw,     setShowPw]     = useState(false);
  const [signing,    setSigning]    = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [roomData,   setRoomData]   = useState<SiteContent["videoRoom"] | null>(null);
  const [selected,   setSelected]   = useState<VideoItem | null>(null);
  const [search,     setSearch]     = useState("");
  const [filter,     setFilter]     = useState<"all" | "video" | "stream">("all");
  const [viewers,    setViewers]    = useState<ActiveViewer[]>([]);
  const [isCoach,    setIsCoach]    = useState(false);

  // Always require fresh sign-in on every visit
  useEffect(() => {
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

  // Keep presence alive with heartbeat every 30s while in the room
  useEffect(() => {
    if (!authed || !viewerName) return;

    const beat = () => fetch("/api/film-room/presence", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: viewerName }),
    }).catch(() => {});

    const interval = setInterval(beat, 30000);

    // Remove presence when tab closes
    const onLeave = () => navigator.sendBeacon(
      "/api/film-room/presence",
      JSON.stringify({ name: viewerName, action: "leave" })
    );
    window.addEventListener("beforeunload", onLeave);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, [authed, viewerName]);

  // Poll who is watching (every 10s)
  useEffect(() => {
    if (!authed) return;
    const fetchViewers = () =>
      fetch("/api/film-room/presence")
        .then(r => r.json())
        .then((data: ActiveViewer[]) => setViewers(Array.isArray(data) ? data : []))
        .catch(() => {});
    fetchViewers();
    const iv = setInterval(fetchViewers, 10000);
    return () => clearInterval(iv);
  }, [authed]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setPwError("Please enter your name."); return; }
    if (!password.trim()) { setPwError("Please enter the team password."); return; }
    setSigning(true);
    setPwError("");
    try {
      const res  = await fetch("/api/film-room/signin", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: name.trim(), email: email.trim(), password: password.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwError(data.error || "Incorrect password. Please try again.");
      } else {
        setViewerName(name.trim());
        setIsCoach(data.isCoach === true);
        setAuthed(true);
        // Register presence immediately on sign-in
        fetch("/api/film-room/presence", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() }),
        }).catch(() => {});
        // Auto-open chat if there are already messages
        fetch("/api/film-room/chat")
          .then(r => r.json())
          .then((msgs: ChatMsg[]) => { if (msgs.length > 0) setChatOpen(true); })
          .catch(() => {});
      }
    } catch {
      setPwError("Unable to connect. Please try again.");
    } finally {
      setSigning(false);
    }
  }

  const videos  = (roomData?.videos ?? []).filter(v => v.enabled);
  const liveNow = videos.filter(v => v.isLive);
  const filtered = videos.filter(v => {
    if (filter === "video"  && v.type !== "video")  return false;
    if (filter === "stream" && v.type !== "stream") return false;
    if (search && !v.title.toLowerCase().includes(search.toLowerCase()) && !v.description.toLowerCase().includes(search.toLowerCase())) return false;
    return !v.isLive;
  });

  if (loading) return <div className="min-h-screen bg-[#080D1A]" />;

  // ── Sign-in screen ──────────────────────────────────────────────────────────
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
            <p className="text-gray-500 text-sm">Sign in with your name and team password to access videos and live streams.</p>
          </div>

          <div className="glass rounded-2xl border border-white/15 p-8">
            <form onSubmit={handleLogin} className="space-y-4">

              {/* Name */}
              <div>
                <label className="block text-gray-400 text-xs font-semibold mb-1.5">Your Name <span className="text-red-400">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => { setName(e.target.value); setPwError(""); }}
                    autoFocus
                    placeholder="First and last name"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Email (optional) */}
              <div>
                <label className="block text-gray-400 text-xs font-semibold mb-1.5">Email <span className="text-gray-600 font-normal">(optional)</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-gray-400 text-xs font-semibold mb-1.5">Team Password <span className="text-red-400">*</span></label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setPwError(""); }}
                    placeholder="Enter team password"
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pwError && <p className="text-red-400 text-xs mt-1.5">{pwError}</p>}
              </div>

              <button type="submit" disabled={signing}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-60 text-white font-black rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
                {signing ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing In…</>
                ) : (
                  "Enter Film Room 🎬"
                )}
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
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-widest">
                <Lock className="w-3.5 h-3.5" /> Team Only
              </div>
              {viewerName && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-semibold">
                  <User className="w-3.5 h-3.5" /> Signed in as {viewerName}
                </div>
              )}
              {/* Who's Watching strip */}
              {viewers.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap justify-center mt-1">
                  <span className="text-gray-500 text-xs font-semibold uppercase tracking-widest">In the Room:</span>
                  <div className="flex items-center gap-2 flex-wrap justify-center">
                    {viewers.map((v) => (
                      <div key={v.name}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                          v.name === viewerName
                            ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                            : "bg-white/5 border-white/15 text-gray-300"
                        }`}>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${v.name === viewerName ? "bg-blue-400" : "bg-green-400"} animate-pulse`} />
                        <span>{v.name === viewerName ? "You" : v.name}</span>
                        {v.watching && (
                          <span className="flex items-center gap-1 text-green-400 font-semibold">
                            <Play className="w-2.5 h-2.5 flex-shrink-0" />
                            <span className="max-w-[120px] truncate">{v.watching}</span>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
              <VideoCard key={v.id} item={v} onClick={() => { setSelected(v); if (viewerName) fetch("/api/film-room/presence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: viewerName, watching: v.title }) }).catch(() => {}); }} />
            ))}
          </div>
        </section>
      )}

      {/* Library */}
      <section className="max-w-7xl mx-auto px-4 pb-32">
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

        {videos.length === 0 && (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-2xl font-black text-white mb-2">No Videos Yet</h3>
            <p className="text-gray-500">Check back soon — your coach will upload film sessions and stream links here.</p>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(v => (
              <VideoCard key={v.id} item={v} onClick={() => { setSelected(v); if (viewerName) fetch("/api/film-room/presence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: viewerName, watching: v.title }) }).catch(() => {}); }} />
            ))}
          </div>
        )}

        {filtered.length === 0 && videos.length > 0 && (
          <div className="text-center py-16 text-gray-500">No results for your search.</div>
        )}
      </section>

      {selected && <VideoModal item={selected} onClose={() => { setSelected(null); if (viewerName) fetch("/api/film-room/presence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: viewerName, watching: "" }) }).catch(() => {}); }} />}
      <Footer />

      {/* ── Floating chat button ── */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9999 }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-3 rounded-2xl shadow-xl shadow-blue-500/30 transition-all hover:scale-105"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm">Live Chat</span>
        </button>
      )}

      {/* ── Coach Kem: Clear Chat button ── */}
      {isCoach && (
        <button
          onClick={async () => {
            if (!confirm("Clear all chat messages?")) return;
            await fetch("/api/film-room/chat?key=Kem-admin", { method: "DELETE" });
          }}
          style={{ position: "fixed", bottom: "80px", right: "24px", zIndex: 9999 }}
          className="flex items-center gap-2 bg-orange-600/90 hover:bg-orange-500 text-white font-bold px-4 py-2.5 rounded-2xl shadow-lg shadow-orange-500/20 transition-all hover:scale-105 text-sm"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear Chat</span>
        </button>
      )}

      {/* ── Chat drawer (fixed right side) ── */}
      {chatOpen && (
        <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "320px", zIndex: 9999 }}>
          <ChatPanel viewerName={viewerName} onClose={() => setChatOpen(false)} />
        </div>
      )}

    </main>
  );
}
