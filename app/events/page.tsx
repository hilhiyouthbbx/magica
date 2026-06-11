"use client";

export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import {
  Calendar, Clock, MapPin, Users, Tag, Shirt,
  ChevronRight, Share2, Facebook, Twitter, ArrowRight, Ticket
} from "lucide-react";
import type { SiteContent, CampItem } from "@/lib/content";

// ── CMS Camp Card ─────────────────────────────────────────────────────────────
function CampCard({ item, index }: { item: CampItem; index: number }) {
  const shareUrl  = encodeURIComponent(typeof window !== "undefined" ? window.location.href : "");
  const shareText = encodeURIComponent(`Check out this event: ${item.title}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="glass rounded-3xl border border-white/10 overflow-hidden">

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
        {/* Image */}
        {item.imageUrl && (
          <div className="lg:col-span-2 aspect-video lg:aspect-auto min-h-[200px] bg-[#111827] overflow-hidden">
            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Content */}
        <div className={`${item.imageUrl ? "lg:col-span-3" : "lg:col-span-5"} p-6 sm:p-8 flex flex-col gap-4`}>
          <div className="flex flex-wrap items-center gap-2">
            {item.date && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border bg-blue-500/20 text-blue-300 border-blue-500/30">
                <Calendar className="w-3 h-3" /> {item.date}
              </span>
            )}
            {item.price && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border bg-green-500/20 text-green-300 border-green-500/30">
                <Ticket className="w-3 h-3" /> {item.price}
              </span>
            )}
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight">{item.title}</h2>
            {item.description && (
              <p className="text-gray-300 leading-relaxed">{item.description}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <a href="/register"
              className="group flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all hover:scale-105 shadow-lg shadow-blue-500/30 text-sm">
              Register Now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${shareText}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600/30 transition-colors text-xs font-medium">
              <Facebook className="w-3.5 h-3.5" /> Share
            </a>
            <button onClick={() => navigator.clipboard?.writeText(window.location.href)}
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-gray-300 hover:bg-white/10 transition-colors text-xs font-medium">
              <Share2 className="w-3.5 h-3.5" /> Copy Link
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function EventsPage() {
  const [camps,   setCamps]   = useState<CampItem[] | null>(null);
  const [title,   setTitle]   = useState("Camps & Clinics");
  const [subtitle, setSubtitle] = useState("Skill development opportunities for all ages and levels.");

  useEffect(() => {
    fetch("/api/content")
      .then(r => r.json())
      .then((data: SiteContent) => {
        const c = data?.camps;
        if (c) {
          if (c.pageTitle)    setTitle(c.pageTitle);
          if (c.pageSubtitle) setSubtitle(c.pageSubtitle);
          setCamps((c.items ?? []).filter(i => i.enabled));
        } else {
          setCamps([]);
        }
      })
      .catch(() => setCamps([]));
  }, []);

  const hasCMSCamps = camps !== null && camps.length > 0;

  return (
    <div className="min-h-screen bg-[#080D1A]">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-28 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.2),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <a href="/" className="hover:text-white transition-colors">Home</a>
            <ChevronRight className="w-4 h-4" />
            <span className="text-blue-400 font-medium">{title}</span>
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-widest mb-4">
              <Calendar className="w-3.5 h-3.5" /> Upcoming Events
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-white mb-3">
              {title} <span className="text-gradient">Schedule</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-xl">{subtitle}</p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-10 pb-24">
        <div className="max-w-7xl mx-auto px-4">

          {/* Loading */}
          {camps === null && (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* CMS camps */}
          {hasCMSCamps && (
            <div className="space-y-8">
              {camps.map((item, i) => (
                <CampCard key={item.id} item={item} index={i} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {camps !== null && !hasCMSCamps && (
            <div className="text-center py-24">
              <div className="text-6xl mb-4">🏀</div>
              <h3 className="text-2xl font-black text-white mb-2">No Events Scheduled</h3>
              <p className="text-gray-500">Check back soon for upcoming camps and clinics.</p>
            </div>
          )}

        </div>
      </section>

      <Footer />
    </div>
  );
}
