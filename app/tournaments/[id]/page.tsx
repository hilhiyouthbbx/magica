"use client";

export const dynamic = "force-dynamic";
import { useState, useEffect, useRef, use } from "react";
import Script from "next/script";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, ChevronDown, ChevronUp, Share2, Loader2, CheckCircle, Trophy, Users, Clock, Star, Lock, AlertCircle, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import type { TournamentConfig } from "@/lib/tournament";
import { VoucherInput, type AppliedVoucher } from "@/components/voucher-input";

// ─── Square config ─────────────────────────────────────────────────────
const SQ_APP_ID = process.env.NEXT_PUBLIC_SQUARE_APP_ID ?? "";
const SQ_LOC_ID = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID ?? "";
const SQ_SCRIPT = SQ_APP_ID.startsWith("sandbox-")
  ? "https://sandbox.web.squarecdn.com/v1/square.js"
  : "https://web.squarecdn.com/v1/square.js";

const SQ_STYLE = {
  ".input-container":          { borderColor: "#334155", borderRadius: "10px" },
  ".input-container.is-focus": { borderColor: "#3b82f6" },
  ".input-container.is-error": { borderColor: "#ef4444" },
  "input":                     { color: "#111827", fontFamily: "inherit" },
  "input::placeholder":        { color: "#9ca3af" },
  ".message-text":             { color: "#ef4444" },
  ".message-icon":             { color: "#ef4444" },
};

// Division names may already be stored with a trailing team-type qualifier
// (e.g. "7th Grade Boys Competitive"). Strip it so the Grade & Gender dropdown
// only shows the base combos, with Team Type picked separately.
const TEAM_TYPES = ["Competitive", "Development", "AAU"];
function stripTeamType(d: string): string {
  for (const t of TEAM_TYPES) {
    if (d.toLowerCase().endsWith(t.toLowerCase())) return d.slice(0, d.length - t.length).trim();
  }
  return d;
}

interface Params { params: Promise<{ id: string }>; }

export default function TournamentDetailPage({ params }: Params) {
  const { id } = use(params);

  const [t,          setT]          = useState<TournamentConfig | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [notFound,   setNotFound]   = useState(false);
  const [showMore,   setShowMore]   = useState(false);
  const [showForm,   setShowForm]   = useState(false);
  const [qty,        setQty]        = useState(1);
  const [submitted,  setSubmitted]  = useState(false);

  // Form fields
  const [orgName,    setOrgName]    = useState("");
  const [coachName,  setCoachName]  = useState("");
  const [coachEmail, setCoachEmail] = useState("");
  const [coachPhone, setCoachPhone] = useState("");
  const [gradeGender, setGradeGender] = useState("");
  const [teamType,    setTeamType]    = useState("");
  const division = [gradeGender, teamType].filter(Boolean).join(" ");
  const [players,    setPlayers]    = useState("");
  const [scheduleConstraint, setScheduleConstraint] = useState(""); // "" | "before" | "after" | "both" | "same_team"
  const [noPlayBefore, setNoPlayBefore] = useState("");
  const [noPlayAfter,  setNoPlayAfter]  = useState("");
  const [noOverlapWithTeam, setNoOverlapWithTeam] = useState("");
  const [schedulingRequests, setSchedulingRequests] = useState("");
  const [regNotes,   setRegNotes]   = useState("");

  // Multi-step: "form" | "pay"
  const [regStep, setRegStep] = useState<"form" | "pay">("form");

  // ── Square state ─────────────────────────────────────────────────────
  const sqCardRef                  = useRef<any>(null);
  const [cardLoading,  setCardLoading]  = useState(false);
  const [squareError,  setSquareError]  = useState("");
  const [paying,       setPaying]       = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [retryCount,   setRetryCount]   = useState(0);
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(null);

  useEffect(() => {
    fetch(`/api/tournament?id=${id}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => { setT(data); setLoading(false); })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [id]);

  // ── Init Square card when payment step is active ─────────────────────────────────
  useEffect(() => {
    if (regStep !== "pay" || !showForm) return;
    if ((appliedVoucher?.finalTotal ?? Infinity) === 0) return; // free — no card needed

    let destroyed = false;
    setCardLoading(true);
    setSquareError("");
    setPaymentError("");

    const init = async () => {
      let waited = 0;
      while (!(window as any).Square && waited < 8000) {
        await new Promise(r => setTimeout(r, 150));
        waited += 150;
      }
      if (destroyed) return;

      if (!(window as any).Square) {
        setSquareError("Payment system unavailable. Please refresh the page and try again.");
        setCardLoading(false);
        return;
      }
      if (!SQ_APP_ID || !SQ_LOC_ID) {
        setSquareError("Payment configuration error — please contact info@hilhiyouthbbx.com.");
        setCardLoading(false);
        return;
      }

      try {
        const payments = (window as any).Square.payments(SQ_APP_ID, SQ_LOC_ID);
        const card     = await payments.card({ style: SQ_STYLE });
        if (destroyed) { card.destroy().catch(() => {}); return; }

        // Wait for the DOM element to exist (may be delayed by animation)
        let domWait = 0;
        while (!document.getElementById("sq-tournament-card") && domWait < 3000) {
          await new Promise(r => setTimeout(r, 100));
          domWait += 100;
        }
        if (destroyed) { card.destroy().catch(() => {}); return; }
        const container = document.getElementById("sq-tournament-card");
        if (!container) {
          card.destroy().catch(() => {});
          setSquareError("Card form container not found. Please try again.");
          setCardLoading(false);
          return;
        }
        container.innerHTML = "";
        await card.attach("#sq-tournament-card");
        if (!destroyed) {
          sqCardRef.current = card;
          setCardLoading(false);
        } else {
          card.destroy().catch(() => {});
        }
      } catch (err: any) {
        if (!destroyed) {
          setSquareError(err?.message ? `Card form error: ${err.message}` : "Failed to load the card form. Please refresh and try again.");
          setCardLoading(false);
        }
      }
    };

    init();

    return () => {
      destroyed = true;
      setCardLoading(false);
      if (sqCardRef.current) {
        sqCardRef.current.destroy().catch(() => {});
        sqCardRef.current = null;
      }
      const el = document.getElementById("sq-tournament-card");
      if (el) el.innerHTML = "";
    };
  }, [regStep, showForm, retryCount, appliedVoucher]);

  // ── Advance to payment step ──────────────────────────────────────────
  function handleFormNext(e: React.FormEvent) {
    e.preventDefault();
    setPaymentError("");
    setSquareError("");
    setRegStep("pay");
  }

  // ── Square payment + registration ──────────────────────────────────────────────
  async function handlePay() {
    if (!t) return;
    const isFreeReg = chargeTotal === 0;
    if (!isFreeReg && !sqCardRef.current) { setPaymentError("Card form not ready — please wait a moment."); return; }
    setPaying(true);
    setPaymentError("");
    try {
      let sourceId = "FREE";
      if (!isFreeReg) {
        const result = await sqCardRef.current.tokenize();
        if (result.status !== "OK") {
          setPaymentError(result.errors?.map((e: any) => e.message).join(" ") || "Card validation failed. Please check your details.");
          setPaying(false);
          return;
        }
        sourceId = result.token;
      }
      const res = await fetch("/api/tournament-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId,
          total:          chargeTotal,
          basePrice:      entryFee * qty,
          quantity:       qty,
          tournamentId:   t.id,
          tournamentName: t.name,
          orgName,
          coachName,
          coachEmail,
          coachPhone,
          division,
          players,
          noPlayBefore: (scheduleConstraint === "before" || scheduleConstraint === "both") ? noPlayBefore : "",
          noPlayAfter:  (scheduleConstraint === "after"  || scheduleConstraint === "both") ? noPlayAfter  : "",
          noOverlapWithTeam: scheduleConstraint === "same_team" ? noOverlapWithTeam : "",
          schedulingRequests,
          notes: regNotes,
          voucherCode:    appliedVoucher?.code ?? null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setPaymentError(data.error || "Payment failed. Please try again.");
      }
    } catch {
      setPaymentError("Network error. Please check your connection and try again.");
    }
    setPaying(false);
  }

  const url = typeof window !== "undefined" ? window.location.href : "";

  if (loading) return (
    <main className="min-h-screen bg-[#080D1A] flex items-center justify-center">
      <Script src={SQ_SCRIPT} strategy="afterInteractive" />
      <div className="w-8 h-8 border-2 border-blue-500/40 border-t-blue-500 rounded-full animate-spin" />
    </main>
  );

  if (notFound || !t) return (
    <main className="min-h-screen bg-[#080D1A]">
      <Script src={SQ_SCRIPT} strategy="afterInteractive" />
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Trophy className="w-16 h-16 text-gray-600 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Tournament Not Found</h1>
        <p className="text-gray-400 mb-6">This tournament may have ended or been removed.</p>
        <a href="/tournaments" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all">← All Tournaments</a>
      </div>
      <Footer />
    </main>
  );

  const entryFee = t.entryFee;
  const serviceFee = Math.round(entryFee * 0.03 * 100) / 100;
  const total       = (entryFee + serviceFee) * qty;
  const isFree      = entryFee === 0;
  const voucherFree = appliedVoucher !== null && (appliedVoucher.finalTotal ?? total) === 0;
  const chargeTotal = appliedVoucher?.finalTotal ?? total;
  const inputCls = "w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 transition-colors";

  return (
    <main className="min-h-screen bg-[#080D1A]">
      {/* Square Web Payments SDK */}
      <Script src={SQ_SCRIPT} strategy="afterInteractive" />

      <Navbar />

      {/* Banner */}
      <div className="relative w-full h-72 sm:h-96 overflow-hidden mt-16">
        {t.imageUrl ? (
          <img src={t.imageUrl} alt={t.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-900/80 to-gray-900 flex items-center justify-center">
            <Trophy className="w-24 h-24 text-blue-500/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080D1A] via-[#080D1A]/40 to-transparent" />
        <div className="absolute bottom-6 left-0 right-0 max-w-7xl mx-auto px-4">
          {t.isStateQualifier && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 text-yellow-900 rounded-full text-xs font-black mb-3">
              <Star className="w-3.5 h-3.5 fill-current" /> Official State Qualifier
            </div>
          )}
          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">{t.name}</h1>
          <p className="text-blue-300 text-sm font-semibold mt-1">{t.tagline} · {t.gender} · {t.grades}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-24 pt-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Left: details */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Time & Location */}
            <div className="glass rounded-2xl border border-white/10 p-6">
              <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" /> Time &amp; Location
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-white font-semibold">{t.dates}</div>
                    {t.dayTime && <div className="text-gray-400 text-sm">{t.dayTime}</div>}
                    {t.registrationDeadline && <div className="text-yellow-400 text-sm mt-1">Registration deadline: {t.registrationDeadline}</div>}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-white font-semibold">{t.venue}</div>
                    {t.address && (
                      <a href={`https://maps.google.com/?q=${encodeURIComponent(t.address)}`} target="_blank" rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm transition-colors">{t.address} ↗</a>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-gray-300 text-sm">{t.gender} · {t.grades} · {t.format} · {t.gamesGuaranteed} games guaranteed · Max {t.maxTeams} teams</div>
                </div>
              </div>
            </div>

            {/* Divisions */}
            {t.divisions.length > 0 && (
              <div className="glass rounded-2xl border border-white/10 p-6">
                <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-blue-400" /> Divisions
                </h2>
                <div className="flex flex-wrap gap-2">
                  {t.divisions.map(d => (
                    <span key={d} className="px-3 py-1.5 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-300 text-sm font-semibold">{d}</span>
                  ))}
                </div>
              </div>
            )}

            {/* About the Event */}
            <div className="glass rounded-2xl border border-white/10 p-6">
              <h2 className="text-white font-bold text-lg mb-4">About the Event</h2>
              {t.description && <p className="text-gray-300 leading-relaxed mb-4">{t.description}</p>}

              <AnimatePresence>
                {showMore && (
                  <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }} className="overflow-hidden">
                    <div className="space-y-4 pt-2">
                      {t.isStateQualifier && t.stateQualifierText && (
                        <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-4">
                          <div className="text-yellow-400 font-bold text-sm mb-1 flex items-center gap-1.5"><Star className="w-3.5 h-3.5 fill-current" /> State Qualifier Info</div>
                          <p className="text-gray-300 text-sm leading-relaxed">{t.stateQualifierText}</p>
                        </div>
                      )}
                      {t.accommodationsNote && (
                        <div>
                          <div className="text-white font-semibold text-sm mb-1">Accommodations</div>
                          <p className="text-gray-400 text-sm leading-relaxed">{t.accommodationsNote}</p>
                        </div>
                      )}
                      {t.refundPolicy && (
                        <div>
                          <div className="text-white font-semibold text-sm mb-1">Refund Policy</div>
                          <p className="text-gray-400 text-sm leading-relaxed">{t.refundPolicy}</p>
                        </div>
                      )}
                      {t.rules && (
                        <div>
                          <div className="text-white font-semibold text-sm mb-1">Rules</div>
                          <p className="text-gray-400 text-sm leading-relaxed">{t.rules}</p>
                        </div>
                      )}
                      {t.notes && (
                        <div>
                          <div className="text-white font-semibold text-sm mb-1">Additional Notes</div>
                          <p className="text-gray-400 text-sm leading-relaxed">{t.notes}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button onClick={() => setShowMore(v => !v)}
                className="mt-4 flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-sm font-semibold transition-colors">
                {showMore ? <><ChevronUp className="w-4 h-4" /> Show Less</> : <><ChevronDown className="w-4 h-4" /> Show More</>}
              </button>
            </div>

            {/* Share */}
            <div className="glass rounded-2xl border border-white/10 p-5">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-gray-400 text-sm font-semibold flex items-center gap-1.5"><Share2 className="w-4 h-4" /> Share:</span>
                {[
                  { label:"Facebook", href:`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, color:"bg-[#1877f2]" },
                  { label:"X / Twitter", href:`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(t.name)}`, color:"bg-black border border-white/20" },
                  { label:"LinkedIn", href:`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, color:"bg-[#0a66c2]" },
                ].map(s => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                    className={`px-4 py-2 ${s.color} text-white font-semibold text-xs rounded-lg hover:opacity-90 transition-opacity`}>{s.label}</a>
                ))}
              </div>
            </div>

            <a href="/tournaments" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm transition-colors">
              ← All Tournaments
            </a>
          </div>

          {/* Right: Registration panel */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="lg:sticky lg:top-24">
              {/* ── Success ── */}
              {submitted ? (
                <div className="glass rounded-2xl border border-green-500/30 p-6 text-center">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <h3 className="text-white font-black text-lg mb-2">Registration Complete!</h3>
                  <p className="text-gray-400 text-sm mb-1">Payment received. Confirmation sent to:</p>
                  <p className="text-blue-400 font-bold text-sm mb-3">{coachEmail}</p>
                  <p className="text-gray-500 text-xs">We&apos;ll be in touch with additional details shortly.</p>
                </div>
              ) : (
                <div className="glass rounded-2xl border border-white/15 overflow-hidden">
                  {/* Price header */}
                  <div className="p-5 border-b border-white/10">
                    <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Entry Fee</div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-white font-black text-3xl">${t.entryFee}</span>
                      {!isFree && appliedVoucher === null && <span className="text-gray-500 text-sm">+ ${serviceFee.toFixed(2)} service fee (3%)</span>}
                    </div>
                    {t.registrationDeadline && (
                      <div className="flex items-center gap-1.5 text-yellow-400 text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5" /> Deadline: {t.registrationDeadline}
                      </div>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                    <span className="text-white text-sm font-semibold">Teams</span>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setQty(q => Math.max(1, q-1))} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-colors">−</button>
                      <span className="text-white font-black text-lg w-4 text-center">{qty}</span>
                      <button onClick={() => setQty(q => q+1)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-colors">+</button>
                    </div>
                  </div>
                  <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between bg-white/5">
                    <span className="text-gray-400 text-sm">Total</span>
                    <span className="text-white font-black text-xl">${total.toFixed(2)}</span>
                  </div>

                  {/* ── Register Now button (before form) ── */}
                  {!showForm ? (
                    <div className="p-5">
                      <button onClick={() => { setShowForm(true); setRegStep("form"); }}
                        className="w-full py-3.5 bg-gradient-to-r from-[#006aff] to-[#00aaff] hover:brightness-110 text-white font-black rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
                        Register Now <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <AnimatePresence mode="wait">

                      {/* ── STEP 1: Team Info Form ── */}
                      {regStep === "form" && (
                        <motion.form key="form" initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
                          onSubmit={handleFormNext} className="p-5 space-y-3">

                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-black text-white flex-shrink-0">1</div>
                            <span className="text-white text-xs font-bold">Team Information</span>
                          </div>

                          {[
                            { label:"Organization / Team Name", value:orgName,    set:setOrgName,    ph:"Hillsboro Hawks",  required:true  },
                            { label:"Head Coach Name",          value:coachName,  set:setCoachName,  ph:"Coach Smith",     required:true  },
                            { label:"Coach Email",              value:coachEmail, set:setCoachEmail, ph:"coach@email.com", required:true, type:"email" },
                            { label:"Coach Phone",              value:coachPhone, set:setCoachPhone, ph:"503-555-0100",    required:true  },
                          ].map(f => (
                            <div key={f.label}>
                              <label className="block text-gray-400 text-xs font-semibold mb-1">{f.label}{f.required && <span className="text-red-400"> *</span>}</label>
                              <input required={f.required} type={f.type || "text"} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                                className={inputCls} />
                            </div>
                          ))}

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-gray-400 text-xs font-semibold mb-1">Grade &amp; Gender <span className="text-red-400">*</span></label>
                              <select required value={gradeGender} onChange={e => setGradeGender(e.target.value)} className={inputCls}>
                                <option value="" className="bg-gray-900">Select…</option>
                                {[...new Set(t.divisions.map(stripTeamType))].map(d => <option key={d} value={d} className="bg-gray-900">{d}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-gray-400 text-xs font-semibold mb-1">Team Type <span className="text-red-400">*</span></label>
                              <select required value={teamType} onChange={e => setTeamType(e.target.value)} className={inputCls}>
                                <option value="" className="bg-gray-900">Select…</option>
                                {TEAM_TYPES.map(ty => <option key={ty} value={ty} className="bg-gray-900">{ty}</option>)}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-gray-400 text-xs font-semibold mb-1">Roster (optional)</label>
                            <textarea rows={3} value={players} onChange={e => setPlayers(e.target.value)} placeholder="Player names, numbers…"
                              className={inputCls + " resize-none"} />
                          </div>
                          <div>
                            <label className="block text-gray-400 text-xs font-semibold mb-1">Scheduling Constraint (optional)</label>
                            <select value={scheduleConstraint} onChange={e => setScheduleConstraint(e.target.value)} className={inputCls}>
                              <option value="" className="bg-gray-900">No constraint</option>
                              <option value="before" className="bg-gray-900">Can't play before a certain time</option>
                              <option value="after" className="bg-gray-900">Can't play after a certain time</option>
                              <option value="both" className="bg-gray-900">Can't play before AND after certain times</option>
                              <option value="same_team" className="bg-gray-900">Can't play at the same time as another team</option>
                            </select>
                            {(scheduleConstraint === "before" || scheduleConstraint === "both") && (
                              <div className="mt-2">
                                <label className="block text-gray-500 text-xs mb-1">Earliest we can play</label>
                                <input type="time" required value={noPlayBefore} onChange={e => setNoPlayBefore(e.target.value)} className={inputCls} />
                              </div>
                            )}
                            {(scheduleConstraint === "after" || scheduleConstraint === "both") && (
                              <div className="mt-2">
                                <label className="block text-gray-500 text-xs mb-1">Latest we can play</label>
                                <input type="time" required value={noPlayAfter} onChange={e => setNoPlayAfter(e.target.value)} className={inputCls} />
                              </div>
                            )}
                            {scheduleConstraint === "same_team" && (
                              <div className="mt-2">
                                <label className="block text-gray-500 text-xs mb-1">Team name we can't play at the same time as</label>
                                <input type="text" required value={noOverlapWithTeam} onChange={e => setNoOverlapWithTeam(e.target.value)} placeholder="Enter the other team's name"
                                  className={inputCls} />
                              </div>
                            )}
                            <p className="text-gray-600 text-[11px] mt-1">If your coach is also coaching another team in this tournament, we automatically avoid scheduling both teams at the same time — no need to request that separately.</p>
                          </div>
                          <div>
                            <label className="block text-gray-400 text-xs font-semibold mb-1">Anything Else? (optional)</label>
                            <textarea rows={2} value={schedulingRequests} onChange={e => setSchedulingRequests(e.target.value)} placeholder="Any other scheduling note we should know about…"
                              className={inputCls + " resize-none"} />
                            <p className="text-gray-600 text-[11px] mt-1">We'll do our best to honor scheduling requests, but they can't always be guaranteed.</p>
                          </div>
                          <div>
                            <label className="block text-gray-400 text-xs font-semibold mb-1">Notes</label>
                            <textarea rows={2} value={regNotes} onChange={e => setRegNotes(e.target.value)} placeholder="Questions, accommodations…"
                              className={inputCls + " resize-none"} />
                          </div>

                          <button type="submit"
                            className="w-full py-3.5 bg-gradient-to-r from-[#006aff] to-[#00aaff] hover:brightness-110 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2">
                            Continue to Payment →
                          </button>
                          <button type="button" onClick={() => setShowForm(false)}
                            className="w-full text-gray-500 hover:text-gray-300 text-xs transition-colors">Cancel</button>
                        </motion.form>
                      )}

                      {/* ── STEP 2: Square Payment ── */}
                      {regStep === "pay" && (
                        <motion.div key="pay" initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
                          className="p-5 space-y-4">

                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center text-[10px] font-black text-white flex-shrink-0">2</div>
                            <span className="text-white text-xs font-bold">Secure Payment</span>
                          </div>

                          {/* Order summary mini */}
                          <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl px-4 py-3 space-y-1">
                            <div className="flex justify-between text-xs text-gray-400">
                              <span>{orgName} — {division}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">{qty} team{qty > 1 ? "s" : ""} × ${(isFree || appliedVoucher !== null ? entryFee : entryFee + serviceFee).toFixed(2)}</span>
                              <span className="text-white font-black">${chargeTotal.toFixed(2)}</span>
                            </div>
                          </div>

                          {/* Voucher / Promo Code */}
                          <VoucherInput
                            event="tournament"
                            subtotal={total}
                            onApply={setAppliedVoucher}
                            applied={appliedVoucher}
                          />

                          {/* Card form */}
                          {chargeTotal === 0 ? (
                            <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-center">
                              <p className="text-green-400 font-semibold text-sm">🎉 No payment required — this registration is free!</p>
                            </div>
                          ) : squareError ? (
                            <div className="space-y-3">
                              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                                <p className="text-red-400 text-sm">{squareError}</p>
                              </div>
                              <button onClick={() => { setSquareError(""); setRetryCount(c => c + 1); }}
                                className="w-full py-2.5 border border-white/20 text-gray-300 hover:text-white hover:border-white/40 text-sm font-semibold rounded-xl transition-all">
                                ↻ Retry Payment Form
                              </button>
                            </div>
                          ) : (
                            <div className="relative rounded-xl overflow-hidden">
                              {cardLoading && (
                                <div className="absolute inset-0 bg-white flex items-center justify-center rounded-xl z-10 min-h-[120px]">
                                  <Loader2 className="w-5 h-5 animate-spin text-blue-500 mr-2" />
                                  <span className="text-gray-500 text-sm">Loading…</span>
                                </div>
                              )}
                              {/* Square injects card form here */}
                              <div id="sq-tournament-card" className="bg-white rounded-xl p-4 min-h-[120px]" />
                            </div>
                          )}

                          {paymentError && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                              <p className="text-red-400 text-sm">{paymentError}</p>
                            </div>
                          )}

                          <button onClick={handlePay}
                            disabled={paying || (chargeTotal > 0 && (cardLoading || !!squareError))}
                            className="w-full py-3.5 bg-gradient-to-r from-[#006aff] to-[#00aaff] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl transition-all flex items-center justify-center gap-2">
                            {paying
                              ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                              : chargeTotal === 0
                                ? <>✓ Complete Free Registration</>
                                : <><Lock className="w-4 h-4" /> Pay ${chargeTotal.toFixed(2)} Securely</>
                            }
                          </button>

                          <p className="text-gray-600 text-[11px] text-center flex items-center justify-center gap-1">
                            <Lock className="w-3 h-3" /> 256-bit encrypted · Powered by Square
                          </p>

                          <button type="button" onClick={() => setRegStep("form")}
                            className="w-full text-gray-500 hover:text-gray-300 text-xs transition-colors flex items-center justify-center gap-1">
                            <ArrowLeft className="w-3 h-3" /> Back to team info
                          </button>
                        </motion.div>
                      )}

                    </AnimatePresence>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
