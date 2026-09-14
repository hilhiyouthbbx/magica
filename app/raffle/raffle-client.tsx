"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy, Gift, Tv, Headphones, Calendar, Ticket, ChevronRight,
  CheckCircle, Loader2, AlertCircle,
} from "lucide-react";

// Card/Square not used here — PayPal and Venmo only, same as tryout registration.
const PAYPAL_LINK   = "https://www.paypal.com/ncp/payment/4TKZ7WGKJFMG8";
const VENMO_HANDLE   = "@hilhiyouthbbx";
const TICKET_PRICE   = 20;
const DRAWING_DATE    = "December 21, 2026";

const GRADES = ["Pre-K","Kindergarten","1st Grade","2nd Grade","3rd Grade","4th Grade","5th Grade","6th Grade","7th Grade","8th Grade","9th Grade","10th Grade","11th Grade","12th Grade","N/A"];

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

export function RaffleClient() {
  const [step,        setStep]       = useState<"info" | "pay" | "done">("info");
  const [buyerName,   setBuyerName]  = useState("");
  const [email,       setEmail]      = useState("");
  const [phone,       setPhone]      = useState("");
  const [athleteFirstName, setAthleteFirstName] = useState("");
  const [athleteGrade,     setAthleteGrade]     = useState("");
  const [qty,          setQty]        = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<"paypal" | "venmo">("paypal");
  const [altPaymentConfirmed, setAltPaymentConfirmed] = useState(false);
  const [payError,    setPayError]   = useState("");
  const [loading,     setLoading]    = useState(false);
  const [ticketNumbers, setTicketNumbers] = useState<string[]>([]);

  const total = TICKET_PRICE * qty;

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setPayError(""); setLoading(true);
    try {
      const sourceId = paymentMethod === "paypal" ? "PAYPAL_PENDING" : "VENMO_PENDING";
      const res = await fetch("/api/raffle-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId, quantity: qty, paymentMethod,
          buyerName, email, phone,
          athleteFirstName, athleteGrade,
        }),
      });
      const data = await res.json();
      if (data.success) { setTicketNumbers(data.ticketNumbers || []); setStep("done"); }
      else setPayError(data.error || "Something went wrong. Please try again.");
    } catch {
      setPayError("Network error. Please try again.");
    }
    setLoading(false);
  }

  if (step === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full glass rounded-3xl p-10 border border-white/10 text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">You&apos;re In the Raffle!</h1>
          <p className="text-gray-400 mb-6">
            Thanks for supporting <strong className="text-white">{athleteFirstName || "Hilhi Youth Basketball"}</strong>.
            A confirmation with your ticket number{ticketNumbers.length > 1 ? "s" : ""} was sent to <span className="text-blue-400">{email}</span>.
          </p>
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-4 mb-6 space-y-2">
            <div className="text-xs text-gray-500 mb-1">Your Ticket Number{ticketNumbers.length > 1 ? "s" : ""}</div>
            {ticketNumbers.map(n => (
              <div key={n} className="font-mono text-lg text-white font-black tracking-wider">{n}</div>
            ))}
          </div>
          <div className="text-sm text-gray-400 mb-8">
            🎟️ Drawing held {DRAWING_DATE} · Winners notified by phone/email
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
      {/* Hero */}
      <section className="relative pt-24 pb-0 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#080D1A] via-[#0d1730] to-[#080D1A]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.35),transparent_55%)]" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 py-16 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-widest mb-5">
              🎟️ Fundraiser Raffle
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight mb-4">Hilhi Youth Basketball Raffle</h1>
            <p className="text-gray-300 max-w-2xl mx-auto mb-5">Buy raffle tickets to support your athlete — proceeds benefit Hilhi Youth Basketball.</p>
            <img src="https://g.tlcdn.com/view/2940a42489fa49268a178999d040f6c1.png" alt="Kem Hoops Sports Academy" className="h-16 sm:h-20 mx-auto opacity-90" />
          </motion.div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-24 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Left column — prizes */}
          <div className="lg:col-span-3 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="glass rounded-3xl p-7 border-2 border-yellow-500/30 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 text-yellow-500/10"><Trophy className="w-32 h-32" /></div>
              <div className="relative">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-xs font-black uppercase tracking-widest">
                    <Trophy className="w-3.5 h-3.5" /> Grand Prize
                  </div>
                  <img src="https://g.tlcdn.com/view/03fde12403b344e5b5da2042de0d7f5e.jpg" alt="Hotel Eastlund" className="h-10 rounded-md" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2">2 Night Stay @ the Eastlund Hotel</h2>
                <ul className="text-gray-300 text-sm space-y-1.5">
                  <li>📅 January 8 &amp; 9, 2027</li>
                  <li>🍽️ Roof Top Dinner for 2 <span className="text-gray-500">($150 allowance)</span></li>
                  <li>🏀 AND 2 Blazer Tickets <span className="text-gray-500">(Jan 9th Game — Blazers vs Charlotte)</span></li>
                </ul>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass rounded-2xl p-5 border border-white/10">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">2nd Prize</div>
                <Gift className="w-6 h-6 text-orange-400 mb-2" />
                <div className="text-white font-bold text-sm">Traeger Grill &amp; Smoker</div>
              </div>
              <div className="glass rounded-2xl p-5 border border-white/10">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">3rd Prize</div>
                <Tv className="w-6 h-6 text-blue-400 mb-2" />
                <div className="text-white font-bold text-sm">65&quot; LED Smart TV</div>
              </div>
              <div className="glass rounded-2xl p-5 border border-white/10">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">4th Prize</div>
                <Headphones className="w-6 h-6 text-purple-400 mb-2" />
                <div className="text-white font-bold text-sm">Beats Studio³ Headphones</div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="glass rounded-2xl p-5 border border-white/10 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <div className="text-gray-300 text-sm">
                Drawing held <strong className="text-white">{DRAWING_DATE}</strong>. Proceeds benefit Hilhi Youth Basketball.
              </div>
            </motion.div>
          </div>

          {/* Right column — purchase */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="lg:col-span-2">
            <div className="glass rounded-3xl border border-white/10 overflow-hidden sticky top-24">
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-5">
                <div className="text-white font-black text-lg flex items-center gap-2"><Ticket className="w-5 h-5" /> Buy Raffle Tickets</div>
                <div className="text-blue-200 text-sm mt-0.5">${TICKET_PRICE} per ticket</div>
              </div>

              {step === "info" ? (
                <form onSubmit={(e) => { e.preventDefault(); setStep("pay"); }} className="p-6 space-y-4">
                  <IF label="Your Name"          value={buyerName} onChange={setBuyerName} ph="Full name" req />
                  <IF label="Email Address"      value={email}     onChange={setEmail}     ph="you@email.com" type="email" req />
                  <IF label="Phone Number"       value={phone}     onChange={setPhone}     ph="(503) 555-0000" type="tel" req />

                  <div className="pt-2 border-t border-white/10">
                    <div className="text-gray-300 text-sm font-semibold mb-3">Who are you supporting?</div>
                    <div className="grid grid-cols-2 gap-3">
                      <IF label="Athlete First Name" value={athleteFirstName} onChange={setAthleteFirstName} ph="e.g. Jordan" req />
                      <SF label="Grade" value={athleteGrade} onChange={setAthleteGrade} options={GRADES} req />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm font-semibold mb-1.5">Number of Tickets</label>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))}
                        className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors flex items-center justify-center">−</button>
                      <span className="text-white font-bold text-lg w-8 text-center">{qty}</span>
                      <button type="button" onClick={() => setQty(q => q + 1)}
                        className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors flex items-center justify-center">+</button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                    <div className="text-gray-400 font-semibold">Total</div>
                    <div className="text-white font-black text-2xl">${total.toFixed(2)}</div>
                  </div>

                  <button type="submit"
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-lg">
                    Continue to Payment <ChevronRight className="w-5 h-5" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handlePay} className="p-6 space-y-5">
                  <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl px-4 py-3 flex justify-between items-center">
                    <span className="text-blue-300 text-sm font-semibold">{qty} ticket{qty > 1 ? "s" : ""} × ${TICKET_PRICE}</span>
                    <span className="text-white font-black text-lg">${total.toFixed(2)}</span>
                  </div>

                  <div className="flex gap-2">
                    {([["paypal","🅿️ PayPal"],["venmo","💸 Venmo"]] as const).map(([val, label]) => (
                      <button key={val} type="button"
                        onClick={() => { setPaymentMethod(val); setAltPaymentConfirmed(false); setPayError(""); }}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                          paymentMethod === val
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "bg-white/5 border-white/15 text-gray-400 hover:border-white/30"
                        }`}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {paymentMethod === "paypal" && (
                    <div className="space-y-3">
                      <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-4 space-y-3">
                        <p className="text-gray-300 text-sm">
                          Click below to pay <strong className="text-white">${total.toFixed(2)}</strong> via PayPal, then come back here and check the box to finish.
                        </p>
                        <a href={PAYPAL_LINK} target="_blank" rel="noopener noreferrer"
                          className="block w-full text-center py-3 bg-[#ffc439] hover:brightness-95 text-[#003087] font-black rounded-xl transition-all">
                          Pay with PayPal ↗
                        </a>
                      </div>
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input type="checkbox" checked={altPaymentConfirmed} onChange={e => setAltPaymentConfirmed(e.target.checked)}
                          className="w-4 h-4 mt-0.5 rounded accent-blue-600" />
                        <span className="text-gray-300 text-sm">I&apos;ve sent <strong className="text-white">${total.toFixed(2)}</strong> via PayPal.</span>
                      </label>
                    </div>
                  )}

                  {paymentMethod === "venmo" && (
                    <div className="space-y-3">
                      <div className="bg-[#3D95CE]/10 border border-[#3D95CE]/30 rounded-xl p-4 space-y-2">
                        <p className="text-gray-300 text-sm">Send <strong className="text-white">${total.toFixed(2)}</strong> via Venmo to:</p>
                        <p className="text-2xl font-black text-[#3D95CE]">{VENMO_HANDLE}</p>
                        <p className="text-gray-500 text-xs">Please include &quot;Raffle&quot; and the athlete&apos;s name in the payment note.</p>
                      </div>
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input type="checkbox" checked={altPaymentConfirmed} onChange={e => setAltPaymentConfirmed(e.target.checked)}
                          className="w-4 h-4 mt-0.5 rounded accent-blue-600" />
                        <span className="text-gray-300 text-sm">I&apos;ve sent <strong className="text-white">${total.toFixed(2)}</strong> via Venmo to {VENMO_HANDLE}.</span>
                      </label>
                    </div>
                  )}

                  {payError && (
                    <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{payError}</span>
                    </div>
                  )}

                  <button type="submit" disabled={loading || !altPaymentConfirmed}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-lg">
                    {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing…</> : <><Ticket className="w-5 h-5" /> Get My Ticket{qty > 1 ? "s" : ""}</>}
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
