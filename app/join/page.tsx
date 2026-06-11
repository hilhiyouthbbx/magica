"use client";

export const dynamic = "force-dynamic";
import { useState } from "react";
import { motion } from "framer-motion";
import { Users, CheckCircle, Loader2, Mail, Phone, User, ChevronDown, Star } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const GRADES = [
  "3rd Grade", "4th Grade", "5th Grade",
  "6th Grade", "7th Grade", "8th Grade",
  "9th Grade (HS)", "10th Grade (HS)", "11th Grade (HS)", "12th Grade (HS)",
];

const HOW_HEARD = [
  "Friend or Family",
  "School / Teacher",
  "Social Media",
  "Flyer / Poster",
  "Hilhi High School",
  "Previous Season",
  "Google / Web Search",
  "Other",
];

interface Player {
  firstName: string;
  lastName: string;
  grade: string;
}

export default function JoinPage() {
  const [guardianName, setGuardianName]   = useState("");
  const [email,        setEmail]          = useState("");
  const [phone,        setPhone]          = useState("");
  const [players,      setPlayers]        = useState<Player[]>([{ firstName: "", lastName: "", grade: "" }]);
  const [howHeard,     setHowHeard]       = useState("");
  const [loading,      setLoading]        = useState(false);
  const [success,      setSuccess]        = useState(false);
  const [error,        setError]          = useState("");

  function addPlayer() {
    setPlayers(p => [...p, { firstName: "", lastName: "", grade: "" }]);
  }

  function removePlayer(i: number) {
    setPlayers(p => p.filter((_, idx) => idx !== i));
  }

  function updatePlayer(i: number, field: keyof Player, value: string) {
    setPlayers(p => p.map((pl, idx) => idx === i ? { ...pl, [field]: value } : pl));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validate players
    for (const p of players) {
      if (!p.firstName.trim() || !p.lastName.trim() || !p.grade) {
        setError("Please fill in the name and grade for every player.");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guardianName, email, phone, players, howHeard }),
      });
      if (!res.ok) throw new Error("Failed");
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please email info@hilhiyouthbbx.com directly.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-[#080D1A]">
        <Navbar />
        <section className="flex items-center justify-center min-h-[85vh] px-4">
          <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} transition={{ duration:0.5 }}
            className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 mb-6">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-4xl font-black text-white mb-3">You&apos;re In! 🏀</h1>
            <p className="text-gray-400 text-lg mb-2">
              Welcome to the Hilhi Youth Basketball family!
            </p>
            <p className="text-gray-500 text-sm mb-8">
              A confirmation has been sent to <span className="text-blue-400">{email}</span>. You&apos;ll receive
              updates on upcoming camps, tryouts, and events straight to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all">
                Back to Home
              </a>
              <a href="/events"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-bold rounded-xl transition-all">
                View Events
              </a>
            </div>
          </motion.div>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080D1A]">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.15),transparent_60%)]" />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6 }}>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/20 border border-blue-500/30 mb-6">
              <Users className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight mb-4">
              Join Our <span className="text-gradient">Program</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Sign up to be a member of Hilhi Youth Basketball. Get first access to camp registrations,
              tryout dates, events, and program updates — straight to your inbox.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Benefits strip */}
      <section className="max-w-3xl mx-auto px-4 mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: "📅", title: "Event Updates",     desc: "First to know about camps, tryouts, and game schedules" },
            { icon: "🏀", title: "Program News",      desc: "Team announcements, scores, and program milestones" },
            { icon: "⭐", title: "Early Access",      desc: "Priority registration for camps and special events" },
          ].map(b => (
            <div key={b.title} className="glass rounded-2xl border border-white/10 p-5 text-center">
              <div className="text-3xl mb-3">{b.icon}</div>
              <div className="text-white font-bold text-sm mb-1">{b.title}</div>
              <div className="text-gray-500 text-xs leading-relaxed">{b.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Form */}
      <section className="max-w-2xl mx-auto px-4 pb-24">
        <motion.form onSubmit={handleSubmit} initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.1 }}
          className="glass rounded-3xl border border-white/15 overflow-hidden">

          {/* Parent / Guardian */}
          <div className="px-6 sm:px-8 py-6 border-b border-white/10">
            <h2 className="text-white font-black text-lg mb-1 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" /> Parent / Guardian
            </h2>
            <p className="text-gray-500 text-xs mb-5">Primary contact for program communications.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input required value={guardianName} onChange={e => setGuardianName(e.target.value)}
                    placeholder="Jane Smith"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="jane@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="503-555-0100"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Players */}
          <div className="px-6 sm:px-8 py-6 border-b border-white/10">
            <h2 className="text-white font-black text-lg mb-1 flex items-center gap-2">
              <Star className="w-5 h-5 text-blue-400" /> Player(s)
            </h2>
            <p className="text-gray-500 text-xs mb-5">Add each player in your family joining the program.</p>

            <div className="space-y-4">
              {players.map((p, i) => (
                <div key={i} className="relative bg-white/5 rounded-2xl border border-white/10 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">Player {i + 1}</span>
                    {players.length > 1 && (
                      <button type="button" onClick={() => removePlayer(i)}
                        className="text-gray-500 hover:text-red-400 text-xs transition-colors">
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-gray-500 text-[11px] font-semibold mb-1">First Name <span className="text-red-400">*</span></label>
                      <input required value={p.firstName} onChange={e => updatePlayer(i, "firstName", e.target.value)}
                        placeholder="Michael"
                        className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-gray-500 text-[11px] font-semibold mb-1">Last Name <span className="text-red-400">*</span></label>
                      <input required value={p.lastName} onChange={e => updatePlayer(i, "lastName", e.target.value)}
                        placeholder="Jordan"
                        className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-gray-500 text-[11px] font-semibold mb-1">Grade <span className="text-red-400">*</span></label>
                      <div className="relative">
                        <select value={p.grade} onChange={e => updatePlayer(i, "grade", e.target.value)}
                          className="w-full appearance-none px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors cursor-pointer">
                          <option value="" className="bg-gray-900">Select grade…</option>
                          {GRADES.map(g => <option key={g} value={g} className="bg-gray-900">{g}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button type="button" onClick={addPlayer}
                className="w-full py-3 rounded-xl border border-dashed border-white/20 text-gray-400 hover:text-white hover:border-blue-500/50 text-sm font-semibold transition-all">
                + Add Another Player
              </button>
            </div>
          </div>

          {/* How did you hear */}
          <div className="px-6 sm:px-8 py-6 border-b border-white/10">
            <label className="block text-white font-bold text-sm mb-3">How did you hear about us?</label>
            <div className="flex flex-wrap gap-2">
              {HOW_HEARD.map(h => (
                <button key={h} type="button" onClick={() => setHowHeard(h)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    howHeard === h
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "border-white/15 text-gray-400 hover:border-white/30 hover:text-white"
                  }`}>
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="px-6 sm:px-8 py-6">
            {error && (
              <div className="mb-4 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-base rounded-2xl transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2">
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Registering…</>
                : <><Users className="w-5 h-5" /> Join Hilhi Youth Basketball</>
              }
            </button>
            <p className="text-gray-600 text-xs text-center mt-3 leading-relaxed">
              By registering you agree to receive program updates from Hilhi Youth Basketball.
              We never share your information. Unsubscribe any time by emailing{" "}
              <a href="mailto:info@hilhiyouthbbx.com" className="text-gray-500 hover:text-gray-400 underline">
                info@hilhiyouthbbx.com
              </a>.
            </p>
          </div>
        </motion.form>
      </section>

      <Footer />
    </main>
  );
}
