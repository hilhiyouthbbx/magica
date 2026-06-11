"use client";

export const dynamic = "force-dynamic";
import { useState, useEffect, useRef } from "react";
import Script from "next/script";
import { motion } from "framer-motion";
import {
  MapPin, Clock, Calendar, Users, ChevronRight,
  CheckCircle, Loader2, Share2, Facebook, Twitter, Linkedin,
  AlertCircle, Lock,
} from "lucide-react";
import type { SiteContent } from "@/lib/content";
import { VoucherInput, type AppliedVoucher } from "@/components/voucher-input";

type TryoutData  = SiteContent["tryout"];
type ContactData = SiteContent["contact"];

const SQ_APP_ID = process.env.NEXT_PUBLIC_SQUARE_APP_ID ?? "";
const SQ_LOC_ID = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID ?? "";
const SQ_SCRIPT = SQ_APP_ID.startsWith("sandbox-")
  ? "https://sandbox.web.squarecdn.com/v1/square.js"
  : "https://web.squarecdn.com/v1/square.js";

// ─────────────────────────────────────────────────────────────────
// Field helpers
// ─────────────────────────────────────────────────────────────────
function IF({ label, value, onChange, ph = "", type = "text", req = false }: {
  label: string; value: string; onChange: (v: string) => void;
  ph?: string; type?: string; req?: boolean;
}) {
  return (
    <div>
      <label className="block text-gray-300 text-sm font-semibold mb-1.5">
        {label}{req && <span className="text-red-400"> *</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={ph} required={req}
        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
    </div>
  );
}

function SF({ label, value, onChange, options, req = false }: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; req?: boolean;
}) {
  return (
    <div>
      <label className="block text-gray-300 text-sm font-semibold mb-1.5">
        {label}{req && <span className="text-red-400"> *</span>}
      </label>
      <select value={value} onChange={e => onChange(e.target.value)} required={req}
        className="w-full px-4 py-3 rounded-xl bg-[#0D1525] border border-white/15 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors appearance-none">
        <option value="">Select…</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main client component
// ─────────────────────────────────────────────────────────────────
export function TryoutClient({ tryout: t, contact: c }: { tryout: TryoutData; contact: ContactData }) {
  const isFree     = t.price === 0;
  const fee        = isFree ? 0 : Math.round(t.price * 0.03 * 100) / 100;
  const total      = t.price + fee;
  // treat as free when voucher covers everything
  const effectiveTotal = (v: typeof appliedVoucher) => v?.finalTotal ?? (total * qty);
  const voucherFree = (v: typeof appliedVoucher) => v !== null && effectiveTotal(v) === 0;
  const pageUrl    = typeof window !== "undefined" ? window.location.href : "https://www.hilhiyouthbbx.com";
  const shareText  = encodeURIComponent(`Check out this event. Hope to see you there!`);
  const shareUrl   = encodeURIComponent(pageUrl);

  // Registration form state
  const [step,        setStep]       = useState<"info" | "pay" | "done">("info");
  const [parentName,  setParentName] = useState("");
  const [email,       setEmail]      = useState("");
  const [phone,       setPhone]      = useState("");
  const [playerName,  setPlayerName] = useState("");
  const [grade,       setGrade]      = useState("");
  const [session,     setSession]    = useState("");
  const [qty,         setQty]        = useState(1);
  const [payError,    setPayError]   = useState("");
  const [loading,     setLoading]    = useState(false);
  const [paymentId,   setPaymentId]  = useState("");
  const [sqReady,     setSqReady]    = useState(false);
  const [retryCount,  setRetryCount] = useState(0);
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(null);
  const sqCardRef = useRef<any>(null);
  const sqRef     = useRef<any>(null);

  const grades = ["3rd Grade","4th Grade","5th Grade","6th Grade","7th Grade","8th Grade"];
  const sessionLabels = t.sessions.map(s => `${s.label} · ${s.time}`);

  // Init Square when on pay step
  useEffect(() => {
    if (step !== "pay") return;
    let cancelled = false;
    let card: any = null;

    async function init() {
      const w = window as any;
      let attempts = 0;
      while (!w.Square && attempts < 40) {
        await new Promise(r => setTimeout(r, 200));
        attempts++;
      }
      if (cancelled || !w.Square) { setPayError("Payment system failed to load. Please refresh."); return; }
      try {
        const payments = w.Square.payments(SQ_APP_ID, SQ_LOC_ID);
        card = await payments.card({
          style: {
            ".input-container": { borderColor: "rgba(255,255,255,0.15)", borderRadius: "12px" },
            ".input-container.is-focus": { borderColor: "#3b82f6" },
            ".message-text": { color: "#f87171" },
            input: { color: "#ffffff", backgroundColor: "rgba(255,255,255,0.05)" },
            "input::placeholder": { color: "#4b5563" },
          }
        });
        const container = document.getElementById("sq-tryout-card");
        if (!container || cancelled) return;
        container.innerHTML = "";
        await card.attach("#sq-tryout-card");
        sqCardRef.current = card;
        sqRef.current     = payments;
        if (!cancelled) setSqReady(true);
      } catch (err: any) {
        if (!cancelled) setPayError(err?.message || "Card setup failed.");
      }
    }
    init();
    return () => {
      cancelled = true;
      sqCardRef.current?.destroy?.().catch(() => {});
      sqCardRef.current = null;
      sqRef.current     = null;
      setSqReady(false);
      const el = document.getElementById("sq-tryout-card");
      if (el) el.innerHTML = "";
    };
  }, [step, retryCount]);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setPayError(""); setLoading(true);
    try {
      const chargeTotal = appliedVoucher?.finalTotal ?? (total * qty);
      // Free registration — skip Square tokenization
      const sourceId = chargeTotal === 0 ? "FREE" : await (async () => {
        const result = await sqCardRef.current.tokenize();
        if (result.status !== "OK") {
          setPayError(result.errors?.[0]?.message || "Card tokenization failed.");
          setLoading(false); return null;
        }
        return result.token;
      })();
      if (!sourceId) return;
      const res = await fetch("/api/tryout-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId,
          total:       chargeTotal,
          basePrice:   t.price * qty,
          quantity:    qty,
          parentName, email, phone,
          playerName, grade, session,
          voucherCode: appliedVoucher?.code ?? null,
        }),
      });
      const data = await res.json();
      if (data.success) { setPaymentId(data.paymentId); setStep("done"); }
      else setPayError(data.error || "Payment failed. Please try again.");
    } catch {
      setPayError("Payment error. Please try again.");
    }
    setLoading(false);
  }

  // ── Page disabled ────────────────────────────────────────────
  if (!t.enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-9 h-9 text-blue-400" />
          </div>
          <h1 className="text-3xl font-black text-white mb-3">Tryout Info Coming Soon</h1>
          <p className="text-gray-400 mb-8">Details for the upcoming tryout season will be posted here. Check back soon or follow us on social media for updates.</p>
          <a href="/" className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all">
            Back to Home
          </a>
        </motion.div>
      </div>
    );
  }

  // ── Thank you ────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full glass rounded-3xl p-10 border border-white/10 text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">You&apos;re Registered!</h1>
          <p className="text-gray-400 mb-6">
            Registration confirmed for <strong className="text-white">{playerName}</strong>.<br />
            A confirmation email will be sent to <span className="text-blue-400">{email}</span>.
          </p>
          {paymentId && (
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-6">
              <div className="text-xs text-gray-500 mb-1">Confirmation #</div>
              <div className="font-mono text-sm text-white">{paymentId}</div>
            </div>
          )}
          <div className="text-sm text-gray-400 mb-8">
            📍 {t.location} · {t.address}
          </div>
          <a href="/" className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all inline-block">
            Back to Home
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Script src={SQ_SCRIPT} strategy="afterInteractive" />

      {/* ── Hero ── */}
      <section className="relative pt-24 pb-0 overflow-hidden">
        <div className="absolute inset-0">
          {t.imageUrl && <img src={t.imageUrl} alt={t.title} className="w-full h-full object-cover opacity-25" />}
          <div className="absolute inset-0 bg-gradient-to-b from-[#080D1A]/70 via-[#080D1A]/80 to-[#080D1A]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.3),transparent_55%)]" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 py-16 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-widest mb-5">
              🏀 {t.subtitle}
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight mb-4">{t.title}</h1>
            <div className="flex flex-wrap items-center justify-center gap-4 text-gray-300">
              <span className="flex items-center gap-1.5 text-sm"><MapPin className="w-4 h-4 text-blue-400" /> {t.location}</span>
              <span className="text-gray-600">·</span>
              <span className="flex items-center gap-1.5 text-sm"><Users className="w-4 h-4 text-blue-400" /> {t.gradeLevels} · {t.gender}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Main content ── */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Left column */}
          <div className="lg:col-span-3 space-y-8">

            {/* Time & Location */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="glass rounded-3xl p-7 border border-white/10">
              <h2 className="text-xl font-black text-white mb-5 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" /> Time &amp; Location
              </h2>
              <div className="space-y-4 mb-5">
                {t.sessions.map((s) => (
                  <div key={s.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                    <Calendar className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-white text-sm">{s.label}</div>
                      <div className="text-gray-400 text-sm">{s.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                <MapPin className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-white text-sm">{t.location}</div>
                  <div className="text-gray-400 text-sm">{t.address}</div>
                </div>
              </div>
            </motion.div>

            {/* About */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="glass rounded-3xl p-7 border border-white/10">
              <h2 className="text-xl font-black text-white mb-4">About the Event</h2>
              {t.aboutText.split("\n\n").map((para, i) => (
                <p key={i} className="text-gray-300 leading-relaxed mb-4 last:mb-0">{para}</p>
              ))}
              {t.financialNote && (
                <div className="mt-5 flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-yellow-200 text-sm">{t.financialNote}</p>
                </div>
              )}
            </motion.div>

            {/* Share */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="glass rounded-3xl p-7 border border-white/10">
              <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-400" /> Share this Event
              </h2>
              <div className="flex gap-3">
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${shareText}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 transition-all text-sm font-semibold">
                  <Facebook className="w-4 h-4" /> Facebook
                </a>
                <a href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-gray-300 hover:bg-white/10 transition-all text-sm font-semibold">
                  <Twitter className="w-4 h-4" /> X / Twitter
                </a>
                <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${shareUrl}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700/20 border border-blue-600/30 text-blue-300 hover:bg-blue-700/30 transition-all text-sm font-semibold">
                  <Linkedin className="w-4 h-4" /> LinkedIn
                </a>
              </div>
            </motion.div>
          </div>

          {/* Right column — registration */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="lg:col-span-2">
            <div className="glass rounded-3xl border border-white/10 overflow-hidden sticky top-24">

              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-5">
                <div className="text-white font-black text-lg">Registration</div>
                <div className="text-blue-200 text-sm mt-0.5">{t.gradeLevels} · {t.gender}</div>
              </div>

              {!t.registrationOpen ? (
                /* Registration coming soon */
                <div className="p-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-7 h-7 text-blue-400" />
                  </div>
                  <div className="font-bold text-white mb-2">Registration Not Yet Open</div>
                  <p className="text-gray-400 text-sm">Check back soon or follow us on social media for the announcement.</p>
                </div>
              ) : step === "info" ? (
                /* Info form */
                <form onSubmit={(e) => { e.preventDefault(); setStep("pay"); }} className="p-6 space-y-4">
                  {/* Price */}
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 mb-2 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <div className="text-white font-bold text-sm">{t.title.split(" ").slice(0,3).join(" ")} Reg.</div>
                      <div className="text-white font-black">${t.price.toFixed(2)}</div>
                    </div>
                    {!isFree && appliedVoucher === null && (
                    <div className="flex justify-between items-center">
                      <div className="text-gray-500 text-xs">Service fee (3%)</div>
                      <div className="text-gray-400 text-xs">${fee.toFixed(2)}</div>
                    </div>
                    )}
                  </div>

                  <IF label="Parent / Guardian Name" value={parentName} onChange={setParentName} ph="Full name" req />
                  <IF label="Email Address"          value={email}      onChange={setEmail}      ph="you@email.com" type="email" req />
                  <IF label="Phone Number"           value={phone}      onChange={setPhone}      ph="(503) 555-0000" type="tel" req />
                  <IF label="Player Full Name"       value={playerName} onChange={setPlayerName} ph="Player's name" req />
                  <SF label="Grade (2026-27 Season)" value={grade}      onChange={setGrade}      options={grades} req />
                  <SF label="Preferred Tryout Session" value={session}  onChange={setSession}    options={sessionLabels} req />

                  {/* Quantity */}
                  <div>
                    <label className="block text-gray-300 text-sm font-semibold mb-1.5">Quantity</label>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))}
                        className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors flex items-center justify-center">−</button>
                      <span className="text-white font-bold text-lg w-8 text-center">{qty}</span>
                      <button type="button" onClick={() => setQty(q => q + 1)}
                        className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors flex items-center justify-center">+</button>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="pt-2 border-t border-white/10 space-y-1">
                    {qty > 1 && (
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{qty} × ${total.toFixed(2)}</span>
                        <span>${(total * qty).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <div className="text-gray-400 font-semibold">Total</div>
                      <div className="text-white font-black text-2xl">${(total * qty).toFixed(2)}</div>
                    </div>
                  </div>

                  <button type="submit"
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-lg">
                    Continue to Payment <ChevronRight className="w-5 h-5" />
                  </button>
                </form>
              ) : (
                /* Payment form */
                <form onSubmit={handlePay} className="p-6 space-y-5">
                  <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl px-4 py-3 space-y-1.5 mb-1">
                    <div className="flex justify-between text-xs text-blue-300/70">
                      <span>Base price × {qty}</span>
                      <span>${(t.price * qty).toFixed(2)}</span>
                    </div>
                    {!isFree && appliedVoucher === null && (
                    <div className="flex justify-between text-xs text-blue-300/70">
                      <span>Service fee (3%)</span>
                      <span>${(fee * qty).toFixed(2)}</span>
                    </div>
                    )}
                    <div className="flex justify-between items-center pt-1 border-t border-blue-500/20">
                      <span className="text-blue-300 text-sm font-semibold">Total due</span>
                      <span className="text-white font-black text-lg">${(total * qty).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Voucher / Promo Code */}
                  <VoucherInput
                    event="tryout"
                    subtotal={t.price * qty}
                    onApply={setAppliedVoucher}
                    applied={appliedVoucher}
                  />

                  {/* Square card — hidden when free */}
                  {(appliedVoucher?.finalTotal ?? (total * qty)) > 0 && (
                  <div>
                    <label className="block text-gray-300 text-sm font-semibold mb-2">Card Details</label>
                    <div id="sq-tryout-card" className="min-h-[120px] bg-white/5 rounded-xl border border-white/15 p-4" />
                    {!sqReady && !payError && (
                      <div className="flex items-center gap-2 mt-2 text-gray-500 text-xs">
                        <Loader2 className="w-3 h-3 animate-spin" /> Loading payment form…
                      </div>
                    )}
                  </div>
                  )}

                  {payError && (
                    <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{payError}</span>
                    </div>
                  )}

                  <button type="submit" disabled={loading || (((appliedVoucher?.finalTotal ?? (total * qty)) > 0) && !sqReady)}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-lg">
                    {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing…</> : (appliedVoucher?.finalTotal ?? (total * qty)) === 0 ? <><CheckCircle className="w-5 h-5" /> Complete Free Registration</> : <><Lock className="w-5 h-5" /> Pay ${(appliedVoucher?.finalTotal ?? (total * qty)).toFixed(2)}</>}
                  </button>

                  <button type="button" onClick={() => { setStep("info"); setPayError(""); }}
                    className="w-full text-center text-gray-500 hover:text-gray-300 text-sm transition-colors">
                    ← Back to info
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
