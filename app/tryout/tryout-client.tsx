"use client";

export const dynamic = "force-dynamic";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin, Clock, Calendar, Users, ChevronRight,
  CheckCircle, Loader2, Share2, Facebook, Twitter, Linkedin,
  AlertCircle, Lock, Check, FileText, Download,
} from "lucide-react";
import type { SiteContent } from "@/lib/content";
import { VoucherInput, type AppliedVoucher } from "@/components/voucher-input";

type TryoutData  = SiteContent["tryout"];
type ContactData = SiteContent["contact"];

// Card/Square payment removed from this form — PayPal and Venmo only.
const PAYPAL_LINK    = "https://www.paypal.com/ncp/payment/4TKZ7WGKJFMG8";
const VENMO_HANDLE    = "@hilhiyouthbbx";

// ────────────────────────────────────────────────────────
// Field helpers
// ────────────────────────────────────────────────────────
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

const UNIFORM_SIZES = ["YS (Youth Small)","YM (Youth Medium)","YL (Youth Large)","AS (Adult Small)","AM (Adult Medium)","AL (Adult Large)","AXL (Adult XL)"];

// ────────────────────────────────────────────────────────
// Main client component
// ────────────────────────────────────────────────────────
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
  const [nextSeasonSchool, setNextSeasonSchool] = useState("");
  const [address,     setAddress]    = useState("");
  const [uniformSize, setUniformSize] = useState("");
  const [qty,         setQty]        = useState(1);

  // ── Waiver — 2026-2027 Winter Season ──────────────────────────────────
  const [waiverSigned, setWaiverSigned] = useState(false);
  const [waiverName,   setWaiverName]   = useState("");

  // ── Attendance-boundary check ─────────────────────────────────────────
  const [boundaryChecking, setBoundaryChecking] = useState(false);
  const [boundaryResult, setBoundaryResult] = useState<{ schoolName: string | null; inHillsboro: boolean; message: string; formattedAddress: string } | null>(null);
  const [boundaryError, setBoundaryError] = useState("");

  async function checkBoundary() {
    if (!address.trim()) { setBoundaryError("Enter your home address first."); return; }
    setBoundaryChecking(true);
    setBoundaryError("");
    setBoundaryResult(null);
    try {
      const res = await fetch("/api/check-boundary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = await res.json();
      if (data.ok) {
        setBoundaryResult({ schoolName: data.schoolName, inHillsboro: data.inHillsboro, message: data.message, formattedAddress: data.formattedAddress });
      } else {
        setBoundaryError(data.error || "Couldn't check that address. Please try again.");
      }
    } catch {
      setBoundaryError("Network error checking that address. Please try again.");
    }
    setBoundaryChecking(false);
  }
  const [payError,    setPayError]   = useState("");
  const [loading,     setLoading]    = useState(false);
  const [paymentId,   setPaymentId]  = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"paypal" | "venmo">("paypal"); // Card/Square removed from this form
  const [altPaymentConfirmed, setAltPaymentConfirmed] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(null);

  const grades = ["3rd Grade","4th Grade","5th Grade","6th Grade","7th Grade","8th Grade"];

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setPayError(""); setLoading(true);
    try {
      const chargeTotal = appliedVoucher?.finalTotal ?? (total * qty);

      // No card option on this form anymore — PayPal/Venmo happen off-site and get confirmed
      // manually later, so we just need to know which method was used (and "FREE" if $0).
      const sourceId = chargeTotal > 0 ? (paymentMethod === "paypal" ? "PAYPAL_PENDING" : "VENMO_PENDING") : "FREE";

      const res = await fetch("/api/tryout-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId,
          total:       chargeTotal,
          basePrice:   t.price * qty,
          quantity:    qty,
          paymentMethod,
          parentName, email, phone,
          playerName, grade,
          nextSeasonSchool, address, uniformSize,
          waiverSigned, waiverName,
          boundarySchool: boundaryResult?.schoolName ?? "",
          inHillsboroBoundary: boundaryResult ? (boundaryResult.inHillsboro ? "yes" : "no") : "unknown",
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

  // ── Page disabled ──────────────────────────────────
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

  // ── Thank you ─────────────────────────────────────────
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
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!waiverSigned || !waiverName.trim()) { alert("Please read and agree to the Liability Waiver, then type your name to sign it before continuing."); return; }
                  setStep("pay");
                }} className="p-6 space-y-4">
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
                  <IF label="School Attending Next Season" value={nextSeasonSchool} onChange={setNextSeasonSchool} ph="e.g. Hillsboro High School" req />
                  <SF label="Jersey / Uniform Size" value={uniformSize} onChange={setUniformSize} options={UNIFORM_SIZES} req />

                  {/* Home address + Hillsboro HS attendance-boundary check */}
                  <div>
                    <label className="block text-gray-300 text-sm font-semibold mb-1.5">
                      Home Address<span className="text-red-400"> *</span>
                    </label>
                    <div className="flex gap-2">
                      <input type="text" required value={address}
                        onChange={e => { setAddress(e.target.value); setBoundaryResult(null); setBoundaryError(""); }}
                        placeholder="123 SE Example St, Hillsboro, OR 97123"
                        className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
                      <button type="button" onClick={checkBoundary} disabled={boundaryChecking}
                        className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5">
                        {boundaryChecking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        Check Boundary
                      </button>
                    </div>
                    <p className="text-gray-600 text-[11px] mt-1">We'll check if your address is inside the Hillsboro HS attendance boundary using the school district's own map data.</p>
                    {boundaryError && (
                      <div className="mt-2 flex items-start gap-2 p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-xs">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /><span>{boundaryError}</span>
                      </div>
                    )}
                    {boundaryResult && (
                      <div className={`mt-2 p-2.5 rounded-lg border text-xs ${boundaryResult.inHillsboro ? "bg-green-500/10 border-green-500/30 text-green-300" : "bg-yellow-500/10 border-yellow-500/30 text-yellow-200"}`}>
                        {boundaryResult.message}
                      </div>
                    )}
                  </div>

                  {/* Liability Waiver — 2026-2027 Winter Season Tryouts */}
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <h3 className="font-black text-white mb-3 flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-blue-400" /> Liability Waiver &amp; Release
                      <span className="text-red-400 text-sm ml-1">*</span>
                    </h3>
                    <div className="bg-black/20 border border-white/10 rounded-xl p-3 mb-4 text-xs text-gray-400 leading-relaxed h-32 overflow-y-auto">
                      <p className="mb-2"><strong className="text-white">WAIVER AND RELEASE OF LIABILITY</strong></p>
                      <p className="mb-2">In consideration for my child being allowed to try out for the Hilhi Youth Basketball <strong className="text-gray-300">2026-2027 Winter Season</strong>, I, the undersigned parent or legal guardian, agree to the following:</p>
                      <p className="mb-2"><strong className="text-gray-300">1. ASSUMPTION OF RISK:</strong> I acknowledge that participation in basketball tryouts and the 2026-2027 Winter Season involves inherent risks of injury, including but not limited to sprains, fractures, and other physical injuries. I voluntarily accept these risks.</p>
                      <p className="mb-2"><strong className="text-gray-300">2. RELEASE OF LIABILITY:</strong> I hereby release Hilhi Youth Basketball, Hillsboro High School, their coaches, staff, volunteers, and affiliates from any and all claims, demands, and causes of action arising from my child&apos;s participation in tryouts and the 2026-2027 Winter Season.</p>
                      <p className="mb-2"><strong className="text-gray-300">3. MEDICAL AUTHORIZATION:</strong> In case of emergency, I authorize staff to obtain medical treatment for my child if I cannot be reached. I accept financial responsibility for any medical costs incurred.</p>
                      <p><strong className="text-gray-300">4. CODE OF CONDUCT:</strong> I agree that my child will follow all program rules and that disruptive behavior may result in dismissal from tryouts or the season without refund.</p>
                    </div>

                    <a href="https://galaxy-prod.tlcdn.com/view/user_34cYMUBillHvO8MzqYYaa9tzVg5/12d5f89055d8493aae89976ca36404d8.pdf"
                      target="_blank" rel="noopener noreferrer" download="Hilhi-Parents-Players-Code-of-Conduct.pdf"
                      className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-xs font-semibold mb-4 transition-colors">
                      <Download className="w-3.5 h-3.5" /> Download Parents &amp; Players Code of Conduct (PDF)
                    </a>

                    <label className="flex items-start gap-3 cursor-pointer group mb-4">
                      <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${waiverSigned ? "bg-blue-600 border-blue-600" : "border-white/30 group-hover:border-blue-500"}`}
                        onClick={() => setWaiverSigned(v => !v)}>
                        {waiverSigned && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="font-semibold text-white text-sm">
                        I have read and agree to the Waiver and Release of Liability above for the 2026-2027 Winter Season <span className="text-red-400">*</span>
                      </div>
                    </label>

                    <IF label="Type your full name to sign" value={waiverName} onChange={setWaiverName} ph="Full legal name as electronic signature" req={waiverSigned} />
                  </div>

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

                  {/* Payment method picker — hidden when free (Card/Square removed — PayPal/Venmo only) */}
                  {(appliedVoucher?.finalTotal ?? (total * qty)) > 0 && (
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
                  )}

                  {/* PayPal — off-site payment, confirmed manually by the admin afterward */}
                  {(appliedVoucher?.finalTotal ?? (total * qty)) > 0 && paymentMethod === "paypal" && (
                    <div className="space-y-3">
                      <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-4 space-y-3">
                        <p className="text-gray-300 text-sm">
                          Click below to pay <strong className="text-white">${(appliedVoucher?.finalTotal ?? (total * qty)).toFixed(2)}</strong> via PayPal, then come back here and check the box to finish registering.
                        </p>
                        <a href={PAYPAL_LINK} target="_blank" rel="noopener noreferrer"
                          className="block w-full text-center py-3 bg-[#ffc439] hover:brightness-95 text-[#003087] font-black rounded-xl transition-all">
                          Pay with PayPal ↗
                        </a>
                      </div>
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input type="checkbox" checked={altPaymentConfirmed} onChange={e => setAltPaymentConfirmed(e.target.checked)}
                          className="w-4 h-4 mt-0.5 rounded accent-blue-600" />
                        <span className="text-gray-300 text-sm">I've sent <strong className="text-white">${(appliedVoucher?.finalTotal ?? (total * qty)).toFixed(2)}</strong> via PayPal.</span>
                      </label>
                    </div>
                  )}

                  {/* Venmo — off-site payment, confirmed manually by the admin afterward */}
                  {(appliedVoucher?.finalTotal ?? (total * qty)) > 0 && paymentMethod === "venmo" && (
                    <div className="space-y-3">
                      <div className="bg-[#3D95CE]/10 border border-[#3D95CE]/30 rounded-xl p-4 space-y-2">
                        <p className="text-gray-300 text-sm">
                          Send <strong className="text-white">${(appliedVoucher?.finalTotal ?? (total * qty)).toFixed(2)}</strong> via Venmo to:
                        </p>
                        <p className="text-2xl font-black text-[#3D95CE]">{VENMO_HANDLE}</p>
                        <p className="text-gray-500 text-xs">Please include the player's name ({playerName || "your player"}) in the payment note so we can match it up.</p>
                      </div>
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input type="checkbox" checked={altPaymentConfirmed} onChange={e => setAltPaymentConfirmed(e.target.checked)}
                          className="w-4 h-4 mt-0.5 rounded accent-blue-600" />
                        <span className="text-gray-300 text-sm">I've sent <strong className="text-white">${(appliedVoucher?.finalTotal ?? (total * qty)).toFixed(2)}</strong> via Venmo to {VENMO_HANDLE}.</span>
                      </label>
                    </div>
                  )}

                  {payError && (
                    <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{payError}</span>
                    </div>
                  )}

                  <button type="submit"
                    disabled={
                      loading ||
                      (((appliedVoucher?.finalTotal ?? (total * qty)) > 0) && !altPaymentConfirmed)
                    }
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-lg">
                    {loading
                      ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing…</>
                      : (appliedVoucher?.finalTotal ?? (total * qty)) === 0
                        ? <><CheckCircle className="w-5 h-5" /> Complete Free Registration</>
                        : <><CheckCircle className="w-5 h-5" /> Finish Registration</>
                    }
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
