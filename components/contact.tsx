"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, CheckCircle } from "lucide-react";

interface ContactContent {
  email?:     string;
  phone?:     string;
  address?:   string;
  facebook?:  string;
  instagram?: string;
}

const DEFAULTS: ContactContent = {
  email:     "info@hilhiyouthbbx.com",
  phone:     "971-563-0552",
  address:   "3285 SE Rood Bridge Rd.\nHillsboro, OR 97123",
  facebook:  "https://www.facebook.com/hilhiyouthbbx",
  instagram: "https://www.instagram.com/hilhiyouthbbx",
};

const BASE_SOCIALS = [
  { name: "YouTube", href: "https://www.youtube.com/@hilhiyouthbbx",  icon: "▶️", color: "hover:border-red-500/50 hover:bg-red-500/10" },
  { name: "TikTok",  href: "https://www.tiktok.com/@hilhiyouthbbx",   icon: "🎵", color: "hover:border-cyan-500/50 hover:bg-cyan-500/10" },
  { name: "X (Twitter)", href: "https://x.com/hilhiyouthbbx",         icon: "𝕏", color: "hover:border-gray-400/50 hover:bg-gray-500/10" },
];

export function Contact({ content }: { content?: ContactContent }) {
  const [email, setEmail] = useState("");
  const [done,  setDone]  = useState(false);

  const c = { ...DEFAULTS, ...content };

  // Build dynamic socials (Instagram + Facebook from CMS, rest hardcoded)
  const dynamicSocials = [
    c.instagram ? { name: "Instagram", href: c.instagram, icon: "📸", color: "hover:border-pink-500/50 hover:bg-pink-500/10" } : null,
    c.facebook  ? { name: "Facebook",  href: c.facebook,  icon: "👥", color: "hover:border-blue-500/50 hover:bg-blue-500/10"  } : null,
    ...BASE_SOCIALS,
  ].filter(Boolean) as typeof BASE_SOCIALS;

  // Address lines
  const addressLines = (c.address || "").split("\n").filter(Boolean);

  return (
    <section id="contact" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(37,99,235,0.1),transparent_60%)]" />
      <div className="relative max-w-7xl mx-auto px-4">
        <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.7}} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-widest mb-4">Get In Touch</div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-5">Connect With Us</h2>
          <p className="max-w-xl mx-auto text-gray-400 text-lg">Have questions about registration, schedules, or programs? We&apos;d love to hear from you.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left */}
          <motion.div initial={{opacity:0,x:-30}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{duration:0.7}} className="space-y-5">

            <div className="glass rounded-2xl p-6 border border-white/10 flex items-start gap-4 hover:border-blue-500/30 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/30 transition-colors">
                <Mail className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="font-semibold text-white mb-1">Email Us</div>
                <a href={`mailto:${c.email}`} className="text-blue-400 hover:text-blue-300 transition-colors text-sm">{c.email}</a>
                <p className="text-gray-500 text-sm mt-0.5">We typically respond within 24 hours</p>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 border border-white/10 flex items-start gap-4 hover:border-blue-500/30 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/30 transition-colors">
                <Phone className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="font-semibold text-white mb-1">Call / Text Us</div>
                <a href={`tel:${(c.phone||"").replace(/\D/g,"")}`} className="text-blue-400 hover:text-blue-300 transition-colors text-sm">{c.phone}</a>
                <p className="text-gray-500 text-sm mt-0.5">📱 Please text for quick response</p>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 border border-white/10 flex items-start gap-4 hover:border-blue-500/30 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/30 transition-colors">
                <MapPin className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="font-semibold text-white mb-1">Location</div>
                {addressLines.length > 0 ? (
                  addressLines.map((line, i) => (
                    <p key={i} className={`text-sm ${i === 0 ? "text-gray-300 font-medium" : "text-gray-400"}`}>{line}</p>
                  ))
                ) : (
                  <>
                    <p className="text-gray-300 text-sm font-medium">3285 SE Rood Bridge Rd.</p>
                    <p className="text-gray-400 text-sm">Hillsboro, OR 97123</p>
                  </>
                )}
              </div>
            </div>

            <div className="glass rounded-2xl overflow-hidden border border-white/10 h-52">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2789.329!2d-122.9438!3d45.5084!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x549509dae3a9e7f3%3A0x1!2s3285+SE+Rood+Bridge+Rd%2C+Hillsboro%2C+OR+97123!5e0!3m2!1sen!2sus!4v1680000000001"
                width="100%" height="100%"
                style={{border:0, filter:"invert(90%) hue-rotate(180deg)"}}
                allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                title="Hillsboro High School Map" />
            </div>
          </motion.div>

          {/* Right */}
          <motion.div initial={{opacity:0,x:30}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{duration:0.7}} className="space-y-5">
            <div className="glass rounded-2xl p-8 border border-white/10">
              <h3 className="font-black text-white text-2xl mb-2">Stay in the Loop</h3>
              <p className="text-gray-400 text-sm mb-6">Subscribe for updates on games, schedules, registration openings, and program news.</p>
              {done ? (
                <div className="flex items-center gap-3 py-4 px-5 bg-green-500/15 border border-green-500/30 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <div>
                    <div className="text-green-300 font-semibold text-sm">You&apos;re subscribed!</div>
                    <div className="text-gray-500 text-xs">Watch your inbox for Hilhi updates.</div>
                  </div>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); if(email) setDone(true); }} className="space-y-3">
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter your email address" required
                    className="w-full px-4 py-3.5 bg-white/5 border border-white/15 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all text-sm" />
                  <button type="submit" className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/30">
                    Subscribe to Updates
                  </button>
                </form>
              )}
            </div>

            <div className="glass rounded-2xl p-6 border border-white/10">
              <h3 className="font-bold text-white mb-4">Follow Us</h3>
              <div className="grid grid-cols-2 gap-3">
                {dynamicSocials.map(s => (
                  <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer"
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 transition-all duration-200 ${s.color} group`}>
                    <span className="text-lg">{s.icon}</span>
                    <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{s.name}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Quick CTA */}
            <div className="relative rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-indigo-900/80" />
              <div className="relative p-6 flex items-center justify-between gap-4">
                <div>
                  <div className="font-black text-white text-lg">Ready to join?</div>
                  <div className="text-blue-200 text-sm">2026 Camp open for registration</div>
                </div>
                <a href="/events" className="flex-shrink-0 px-5 py-3 bg-white text-blue-900 font-black rounded-xl hover:bg-blue-50 transition-all hover:scale-105 text-sm whitespace-nowrap">
                  Sign Up →
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
