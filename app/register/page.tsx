"use client";

export const dynamic = "force-dynamic";

const CAMP_BASE  = 150;                                           // base price per camper
const CAMP_FEE   = Math.round(CAMP_BASE * 0.03 * 100) / 100;     // 3% service fee
const CAMP_TOTAL = CAMP_BASE + CAMP_FEE;                           // total per camper

import { useState, useRef, useEffect } from "react";
import Script from "next/script";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import {
  ChevronRight, ChevronLeft, Check, Users, User, Heart,
  FileText, CreditCard, Plus, Trash2, Calendar, MapPin, Clock, Shirt,
  AlertCircle, Lock, Loader2, CheckCircle, ArrowLeft,
} from "lucide-react";
import { VoucherInput, type AppliedVoucher } from "@/components/voucher-input";

// ─── Square config ────────────────────────────────────────────────────────────
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

// ─── Types ────────────────────────────────────────────────────────────────────
interface Camper {
  firstName: string; lastName: string; dob: string;
  grade: string; gender: string; school: string; jerseySize: string;
}
interface ParentInfo {
  guardianName: string; relationship: string; phone: string; email: string;
  address: string; city: string; state: string; zip: string;
  emergencyName: string; emergencyPhone: string; emergencyRelationship: string;
}
interface MedicalInfo {
  allergies: string; medications: string; conditions: string;
  doctorName: string; doctorPhone: string;
  photoRelease: boolean; waiverSigned: boolean; waiverName: string;
}

const STEPS = [
  { id: 1, title: "Select Spots", icon: Users },
  { id: 2, title: "Player Info", icon: User },
  { id: 3, title: "Parent / Guardian", icon: Heart },
  { id: 4, title: "Medical & Waiver", icon: FileText },
  { id: 5, title: "Review & Pay", icon: CreditCard },
];

const GRADES = ["1st","2nd","3rd","4th","5th","6th","7th","8th"];
const SIZES  = ["YS (Youth Small)","YM (Youth Medium)","YL (Youth Large)","AS (Adult Small)","AM (Adult Medium)","AL (Adult Large)","AXL (Adult XL)"];

const defaultCamper  = (): Camper     => ({ firstName:"", lastName:"", dob:"", grade:"", gender:"", school:"", jerseySize:"" });
const defaultParent  = (): ParentInfo => ({ guardianName:"", relationship:"", phone:"", email:"", address:"", city:"", state:"OR", zip:"", emergencyName:"", emergencyPhone:"", emergencyRelationship:"" });
const defaultMedical = (): MedicalInfo => ({ allergies:"", medications:"", conditions:"", doctorName:"", doctorPhone:"", photoRelease:false, waiverSigned:false, waiverName:"" });

const inputCls = "w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-white/8 transition-all text-sm";
const labelCls = "block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5";

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className={labelCls}>{label}{required && <span className="text-red-400 ml-1">*</span>}</label>
      {children}
    </div>
  );
}

// ─── Event Summary Sidebar ────────────────────────────────────────────────────
function EventSummary({ quantity, step, appliedVoucher }: { quantity: number; step: number; appliedVoucher: import("@/components/voucher-input").AppliedVoucher | null }) {
  const baseTotal = quantity * CAMP_TOTAL;
  const isFree = appliedVoucher !== null && (appliedVoucher.finalTotal === 0);
  const total = (appliedVoucher?.finalTotal ?? baseTotal).toFixed(2);
  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl overflow-hidden border border-white/10">
        <div className="aspect-square w-full bg-[#111827] flex items-center justify-center"><img
          src="https://galaxy-prod.tlcdn.com/view/user_34cYMUBillHvO8MzqYYaa9tzVg5/7634f012657a4144882b4e25112250e9.jpg"
          alt="Camp" className="w-full h-full object-contain p-4" /></div>
        <div className="p-5 space-y-3">
          <div>
            <div className="font-black text-white">2026 Hilhi Youth Basketball Camp</div>
            <div className="text-blue-400 text-xs font-semibold mt-0.5">Level up your game this summer!</div>
          </div>
          {[
            { icon: Calendar, text: "June 22–25, 2026" },
            { icon: Clock,    text: "9AM–3PM · Drop-off at 8AM" },
            { icon: MapPin,   text: "Hillsboro High School" },
            { icon: Shirt,    text: "Free T-shirt included" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-xs text-gray-400">
              <Icon className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" /> {text}
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-5 border border-white/10 space-y-3">
        <div className="font-bold text-white text-sm">Order Summary</div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Camp Registration × {quantity}</span>
          <span className="text-white">${(CAMP_BASE * quantity).toFixed(2)}</span>
        </div>
        {appliedVoucher === null && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Service fee × {quantity}</span>
          <span className="text-white">${(CAMP_FEE * quantity).toFixed(2)}</span>
        </div>
        )}
        <div className="border-t border-white/10 pt-3 flex justify-between">
          <span className="font-black text-white">Total</span>
          <span className="font-black text-white text-lg">${total}</span>
        </div>
      </div>

      {/* Step progress (compact) */}
      <div className="glass rounded-2xl p-4 border border-white/10 space-y-2">
        {STEPS.map(s => (
          <div key={s.id} className={`flex items-center gap-2 text-xs font-medium transition-colors ${s.id < step ? "text-green-400" : s.id === step ? "text-blue-400" : "text-gray-600"}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${s.id < step ? "bg-green-500/20 border border-green-500/40" : s.id === step ? "bg-blue-500/20 border border-blue-500/40" : "bg-white/5 border border-white/10"}`}>
              {s.id < step ? <Check className="w-2.5 h-2.5" /> : <span className="text-[10px]">{s.id}</span>}
            </div>
            {s.title}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RegisterPage() {
  const [step, setStep]         = useState(1);
  const [quantity, setQty]      = useState(1);
  const [campers, setCampers]   = useState<Camper[]>([defaultCamper()]);
  const [parentInfo, setParent] = useState<ParentInfo>(defaultParent());
  const [medical, setMedical]   = useState<MedicalInfo>(defaultMedical());

  // ── Square state ──────────────────────────────────────────────────────────
  const sqCardRef               = useRef<any>(null);
  const [cardLoading,  setCardLoading]  = useState(false);
  const [squareError,  setSquareError]  = useState("");
  const [paying,       setPaying]       = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [retryCount,   setRetryCount]   = useState(0);
  const [paid,         setPaid]         = useState(false);
  const [paymentId,    setPaymentId]    = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(null);

  // ── Init Square card when Step 5 is active ────────────────────────────────
  useEffect(() => {
    if (step !== 5) return;

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
        while (!document.getElementById("sq-camp-card") && domWait < 3000) {
          await new Promise(r => setTimeout(r, 100));
          domWait += 100;
        }
        if (destroyed) { card.destroy().catch(() => {}); return; }
        const container = document.getElementById("sq-camp-card");
        if (!container) {
          card.destroy().catch(() => {});
          setSquareError("Card form container not found. Please try again.");
          setCardLoading(false);
          return;
        }
        container.innerHTML = "";
        await card.attach("#sq-camp-card");
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
      const el = document.getElementById("sq-camp-card");
      if (el) el.innerHTML = "";
    };
  }, [step, retryCount]);

  // ── Quantity helpers ───────────────────────────────────────────────────────
  const handleQtyChange = (n: number) => {
    if (n < 1 || n > 10) return;
    setQty(n);
    setCampers(prev => {
      if (n > prev.length) return [...prev, ...Array(n - prev.length).fill(null).map(defaultCamper)];
      return prev.slice(0, n);
    });
  };

  const updateCamper = (i: number, field: keyof Camper, value: string) =>
    setCampers(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));

  const canProceed = () => {
    if (step === 1) return quantity >= 1;
    if (step === 2) return campers.every(c => c.firstName && c.lastName && c.dob && c.grade && c.gender && c.jerseySize);
    if (step === 3) return parentInfo.guardianName && parentInfo.phone && parentInfo.email && parentInfo.emergencyName && parentInfo.emergencyPhone;
    if (step === 4) return medical.waiverSigned && medical.waiverName;
    return true;
  };

  // ── Square payment handler ─────────────────────────────────────────────────
  const handlePay = async () => {
    const chargeTotal = appliedVoucher?.finalTotal ?? (CAMP_TOTAL * quantity);
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
      const res = await fetch("/api/camp-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId,
          total:       chargeTotal,
          quantity,
          campers,
          parentInfo,
          medical,
          voucherCode: appliedVoucher?.code ?? null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPaymentId(data.paymentId ?? "");
        setPaid(true);
      } else {
        setPaymentError(data.error || "Payment failed. Please try again.");
      }
    } catch {
      setPaymentError("Network error. Please check your connection and try again.");
    }
    setPaying(false);
  };

  const slide = { initial: { opacity: 0, x: 30 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -30 }, transition: { duration: 0.25 } };
  const total        = CAMP_TOTAL * quantity;
  const isFree       = appliedVoucher !== null && (appliedVoucher.finalTotal ?? Infinity) === 0;
  const displayTotal = appliedVoucher !== null ? (appliedVoucher.finalTotal ?? total) : total;

  // ── Registration Success ───────────────────────────────────────────────────
  if (paid) {
    return (
      <div className="min-h-screen bg-[#080D1A]">
        <Script src={SQ_SCRIPT} strategy="afterInteractive" />
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
            className="glass rounded-3xl border border-green-500/30 p-10 max-w-lg w-full">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-3xl font-black text-white mb-3">Registration Complete!</h2>
            <p className="text-gray-400 mb-2">Your payment of <strong className="text-white">${(appliedVoucher?.finalTotal ?? total).toFixed(2)}</strong> was successful.</p>
            <p className="text-gray-400 mb-6">A confirmation has been sent to <strong className="text-blue-400">{parentInfo.email}</strong>.</p>
            {paymentId && <p className="text-gray-600 text-xs mb-4">Payment ref: {paymentId}</p>}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 text-left space-y-1.5">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">What&apos;s next</p>
              <p className="text-gray-400 text-sm">📧 Receipt sent to your email</p>
              <p className="text-gray-400 text-sm">🏀 Camp: June 22–25 · 9AM–3PM at Hillsboro High School</p>
              <p className="text-gray-400 text-sm">📞 Questions? Call 971-563-0552</p>
            </div>
            <a href="/events"
              className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20">
              ← Back to Events
            </a>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080D1A]">
      {/* Square Web Payments SDK */}
      <Script src={SQ_SCRIPT} strategy="afterInteractive" />

      <Navbar />

      {/* Page Header */}
      <div className="relative pt-28 pb-8 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.15),transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <a href="/" className="hover:text-white transition-colors">Home</a>
            <ChevronRight className="w-4 h-4" />
            <a href="/events" className="hover:text-white transition-colors">Events</a>
            <ChevronRight className="w-4 h-4" />
            <span className="text-blue-400">Register</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-1">Camp Registration</h1>
          <p className="text-gray-400">2026 Hilhi Youth Basketball Camp · June 22–25</p>
        </div>
      </div>

      {/* Step Progress Bar (mobile) */}
      <div className="max-w-7xl mx-auto px-4 mb-6 md:hidden">
        <div className="flex items-center gap-1">
          {STEPS.map((s) => (
            <div key={s.id} className="flex items-center gap-1 flex-1">
              <div className={`h-1.5 flex-1 rounded-full transition-all ${s.id <= step ? "bg-blue-500" : "bg-white/10"}`} />
            </div>
          ))}
        </div>
        <div className="mt-2 text-xs text-gray-400">Step {step} of {STEPS.length}: <span className="text-blue-400 font-semibold">{STEPS[step-1].title}</span></div>
      </div>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Form ── */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">

              {/* STEP 1 — Select Spots */}
              {step === 1 && (
                <motion.div key="s1" {...slide}>
                  <div className="glass rounded-3xl p-6 sm:p-8 border border-white/10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h2 className="font-black text-white text-xl">Select Spots</h2>
                        <p className="text-gray-400 text-sm">How many campers are you registering?</p>
                      </div>
                    </div>

                    <div className="border border-blue-500/30 rounded-2xl p-5 bg-blue-500/5 mb-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-black text-white text-lg">Camp Registration</div>
                          <div className="text-blue-300 text-sm mt-0.5">2026 Hilhi Youth Basketball Camp</div>
                          <div className="text-gray-400 text-xs mt-2">Boys &amp; Girls · Grades 1st–8th · Free T-shirt included</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-black text-white text-xl">${CAMP_BASE}</div>
                          <div className="text-gray-500 text-xs">+3% service fee</div>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center gap-4">
                        <span className="text-sm text-gray-300 font-medium">Quantity:</span>
                        <div className="flex items-center gap-3">
                          <button onClick={() => handleQtyChange(quantity - 1)} disabled={quantity <= 1}
                            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white font-bold text-lg transition-colors">−</button>
                          <span className="w-8 text-center font-black text-white text-xl">{quantity}</span>
                          <button onClick={() => handleQtyChange(quantity + 1)} disabled={quantity >= 10}
                            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white font-bold text-lg transition-colors">+</button>
                        </div>
                        <span className="text-gray-400 text-sm ml-2">= <span className="text-white font-bold">${(CAMP_TOTAL * quantity).toFixed(2)}</span></span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm flex items-start gap-2 mb-6">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>You will fill in each camper&apos;s details in the next steps. Max 10 registrations per order.</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2 — Camper Details */}
              {step === 2 && (
                <motion.div key="s2" {...slide} className="space-y-5">
                  {campers.map((camper, i) => (
                    <div key={i} className="glass rounded-3xl p-6 sm:p-8 border border-white/10">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <h2 className="font-black text-white text-xl">Camper {i + 1} {quantity > 1 && <span className="text-gray-500 font-normal text-sm">of {quantity}</span>}</h2>
                          <p className="text-gray-400 text-sm">Player information</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="First Name" required>
                          <input type="text" value={camper.firstName} onChange={e => updateCamper(i, "firstName", e.target.value)} placeholder="Jane" className={inputCls} />
                        </Field>
                        <Field label="Last Name" required>
                          <input type="text" value={camper.lastName} onChange={e => updateCamper(i, "lastName", e.target.value)} placeholder="Smith" className={inputCls} />
                        </Field>
                        <Field label="Date of Birth" required>
                          <input type="date" value={camper.dob} onChange={e => updateCamper(i, "dob", e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Current Grade" required>
                          <select value={camper.grade} onChange={e => updateCamper(i, "grade", e.target.value)} className={inputCls}>
                            <option value="" disabled>Select grade</option>
                            {GRADES.map(g => <option key={g} value={g}>{g} Grade</option>)}
                          </select>
                        </Field>
                        <Field label="Gender" required>
                          <select value={camper.gender} onChange={e => updateCamper(i, "gender", e.target.value)} className={inputCls}>
                            <option value="" disabled>Select gender</option>
                            <option value="Boys">Boys</option>
                            <option value="Girls">Girls</option>
                            <option value="other">Other / Prefer not to say</option>
                          </select>
                        </Field>
                        <Field label="Jersey / T-Shirt Size" required>
                          <select value={camper.jerseySize} onChange={e => updateCamper(i, "jerseySize", e.target.value)} className={inputCls}>
                            <option value="" disabled>Select size</option>
                            {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </Field>
                        <Field label="Current School">
                          <input type="text" value={camper.school} onChange={e => updateCamper(i, "school", e.target.value)} placeholder="Lincoln Elementary" className={inputCls} />
                        </Field>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* STEP 3 — Parent / Guardian */}
              {step === 3 && (
                <motion.div key="s3" {...slide} className="space-y-5">
                  <div className="glass rounded-3xl p-6 sm:p-8 border border-white/10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                        <Heart className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h2 className="font-black text-white text-xl">Parent / Guardian</h2>
                        <p className="text-gray-400 text-sm">Primary contact information</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <Field label="Parent / Guardian Name" required>
                        <input type="text" value={parentInfo.guardianName} onChange={e => setParent(p => ({ ...p, guardianName: e.target.value }))} placeholder="John Smith" className={inputCls} />
                      </Field>
                      <Field label="Relationship to Camper" required>
                        <select value={parentInfo.relationship} onChange={e => setParent(p => ({ ...p, relationship: e.target.value }))} className={inputCls}>
                          <option value="" disabled>Select</option>
                          {["Parent","Guardian","Grandparent","Other"].map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </Field>
                      <Field label="Phone Number" required>
                        <input type="tel" value={parentInfo.phone} onChange={e => setParent(p => ({ ...p, phone: e.target.value }))} placeholder="(503) 555-0100" className={inputCls} />
                      </Field>
                      <Field label="Email Address" required>
                        <input type="email" value={parentInfo.email} onChange={e => setParent(p => ({ ...p, email: e.target.value }))} placeholder="john@example.com" className={inputCls} />
                      </Field>
                      <div className="sm:col-span-2">
                        <Field label="Street Address">
                          <input type="text" value={parentInfo.address} onChange={e => setParent(p => ({ ...p, address: e.target.value }))} placeholder="123 Main St" className={inputCls} />
                        </Field>
                      </div>
                      <Field label="City">
                        <input type="text" value={parentInfo.city} onChange={e => setParent(p => ({ ...p, city: e.target.value }))} placeholder="Hillsboro" className={inputCls} />
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="State">
                          <input type="text" value={parentInfo.state} onChange={e => setParent(p => ({ ...p, state: e.target.value }))} placeholder="OR" maxLength={2} className={inputCls} />
                        </Field>
                        <Field label="ZIP">
                          <input type="text" value={parentInfo.zip} onChange={e => setParent(p => ({ ...p, zip: e.target.value }))} placeholder="97123" className={inputCls} />
                        </Field>
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-6">
                      <h3 className="font-black text-white text-lg mb-4 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400" /> Emergency Contact
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Emergency Contact Name" required>
                          <input type="text" value={parentInfo.emergencyName} onChange={e => setParent(p => ({ ...p, emergencyName: e.target.value }))} placeholder="Jane Smith" className={inputCls} />
                        </Field>
                        <Field label="Relationship" required>
                          <input type="text" value={parentInfo.emergencyRelationship} onChange={e => setParent(p => ({ ...p, emergencyRelationship: e.target.value }))} placeholder="Mother" className={inputCls} />
                        </Field>
                        <Field label="Emergency Phone" required>
                          <input type="tel" value={parentInfo.emergencyPhone} onChange={e => setParent(p => ({ ...p, emergencyPhone: e.target.value }))} placeholder="(503) 555-0199" className={inputCls} />
                        </Field>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 4 — Medical & Waiver */}
              {step === 4 && (
                <motion.div key="s4" {...slide} className="space-y-5">
                  <div className="glass rounded-3xl p-6 sm:p-8 border border-white/10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                        <Heart className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h2 className="font-black text-white text-xl">Medical Information</h2>
                        <p className="text-gray-400 text-sm">Health details for all registered campers</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Field label="Allergies (food, medications, environmental)">
                        <textarea value={medical.allergies} onChange={e => setMedical(m => ({ ...m, allergies: e.target.value }))}
                          placeholder="List any allergies, or type 'None'" rows={2}
                          className={inputCls + " resize-none"} />
                      </Field>
                      <Field label="Current Medications">
                        <textarea value={medical.medications} onChange={e => setMedical(m => ({ ...m, medications: e.target.value }))}
                          placeholder="List any medications, or type 'None'" rows={2}
                          className={inputCls + " resize-none"} />
                      </Field>
                      <Field label="Medical Conditions or Physical Limitations">
                        <textarea value={medical.conditions} onChange={e => setMedical(m => ({ ...m, conditions: e.target.value }))}
                          placeholder="Asthma, recent injuries, disabilities, etc. — or type 'None'" rows={2}
                          className={inputCls + " resize-none"} />
                      </Field>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Physician / Doctor Name">
                          <input type="text" value={medical.doctorName} onChange={e => setMedical(m => ({ ...m, doctorName: e.target.value }))} placeholder="Dr. Johnson" className={inputCls} />
                        </Field>
                        <Field label="Physician Phone">
                          <input type="tel" value={medical.doctorPhone} onChange={e => setMedical(m => ({ ...m, doctorPhone: e.target.value }))} placeholder="(503) 555-0200" className={inputCls} />
                        </Field>
                      </div>
                    </div>
                  </div>

                  {/* Photo Release */}
                  <div className="glass rounded-2xl p-6 border border-white/10">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${medical.photoRelease ? "bg-blue-600 border-blue-600" : "border-white/30 group-hover:border-blue-500"}`}
                        onClick={() => setMedical(m => ({ ...m, photoRelease: !m.photoRelease }))}>
                        {medical.photoRelease && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <div className="font-semibold text-white text-sm">Photo &amp; Media Release</div>
                        <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                          I grant Hilhi Youth Basketball permission to take and use photographs and video recordings of my child(ren) during camp activities for use in promotional materials, social media, and the website.
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Liability Waiver */}
                  <div className="glass rounded-2xl p-6 border border-white/10">
                    <h3 className="font-black text-white mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" /> Liability Waiver &amp; Release
                      <span className="text-red-400 text-sm ml-1">*</span>
                    </h3>
                    <div className="bg-white/3 border border-white/10 rounded-xl p-4 mb-4 text-xs text-gray-400 leading-relaxed h-36 overflow-y-auto">
                      <p className="mb-2"><strong className="text-white">WAIVER AND RELEASE OF LIABILITY</strong></p>
                      <p className="mb-2">In consideration for my child(ren) being allowed to participate in the 2026 Hilhi Youth Basketball Camp (&quot;Camp&quot;), I, the undersigned parent or legal guardian, agree to the following:</p>
                      <p className="mb-2"><strong className="text-gray-300">1. ASSUMPTION OF RISK:</strong> I acknowledge that participation in basketball activities involves inherent risks of injury, including but not limited to sprains, fractures, and other physical injuries. I voluntarily accept these risks.</p>
                      <p className="mb-2"><strong className="text-gray-300">2. RELEASE OF LIABILITY:</strong> I hereby release Hilhi Youth Basketball, Hillsboro High School, their coaches, staff, volunteers, and affiliates from any and all claims, demands, and causes of action arising from my child&apos;s participation in the Camp.</p>
                      <p className="mb-2"><strong className="text-gray-300">3. MEDICAL AUTHORIZATION:</strong> In case of emergency, I authorize Camp staff to obtain medical treatment for my child if I cannot be reached. I accept financial responsibility for any medical costs incurred.</p>
                      <p className="mb-2"><strong className="text-gray-300">4. CODE OF CONDUCT:</strong> I agree that my child will follow all Camp rules and that disruptive behavior may result in dismissal without refund.</p>
                      <p><strong className="text-gray-300">5. REFUND POLICY:</strong> Cancellations made 7+ days before June 22 receive a full refund. Cancellations within 7 days receive a 50% refund. No refunds after camp begins.</p>
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer group mb-4">
                      <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${medical.waiverSigned ? "bg-blue-600 border-blue-600" : "border-white/30 group-hover:border-blue-500"}`}
                        onClick={() => setMedical(m => ({ ...m, waiverSigned: !m.waiverSigned }))}>
                        {medical.waiverSigned && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <div className="font-semibold text-white text-sm">I have read and agree to the Waiver and Release of Liability above <span className="text-red-400">*</span></div>
                      </div>
                    </label>

                    <Field label="Type your full name to sign *">
                      <input type="text" value={medical.waiverName} onChange={e => setMedical(m => ({ ...m, waiverName: e.target.value }))}
                        placeholder="Full legal name as electronic signature"
                        className={inputCls + (!medical.waiverSigned ? " opacity-40 cursor-not-allowed" : "")}
                        disabled={!medical.waiverSigned} />
                    </Field>
                  </div>
                </motion.div>
              )}

              {/* STEP 5 — Review & Pay (Square) */}
              {step === 5 && (
                <motion.div key="s5" {...slide} className="space-y-5">
                  <div className="glass rounded-3xl p-6 sm:p-8 border border-white/10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h2 className="font-black text-white text-xl">Review &amp; Pay</h2>
                        <p className="text-gray-400 text-sm">Confirm your registration details below</p>
                      </div>
                    </div>

                    {/* Campers summary */}
                    <div className="mb-6">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Registered Campers</div>
                      <div className="space-y-2">
                        {campers.map((c, i) => (
                          <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-black text-white">{i+1}</div>
                            <div className="flex-1">
                              <div className="font-semibold text-white text-sm">{c.firstName} {c.lastName}</div>
                              <div className="text-gray-400 text-xs">{c.grade} Grade · {c.gender === "Boys" ? "Boys" : c.gender === "Girls" ? "Girls" : c.gender || "—"} · {c.jerseySize}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Parent summary */}
                    <div className="mb-6 bg-white/3 border border-white/10 rounded-xl p-4">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Parent / Guardian</div>
                      <div className="text-white font-semibold text-sm">{parentInfo.guardianName}</div>
                      <div className="text-gray-400 text-xs mt-0.5">{parentInfo.email} · {parentInfo.phone}</div>
                      <div className="text-gray-500 text-xs mt-0.5">Emergency: {parentInfo.emergencyName} ({parentInfo.emergencyPhone})</div>
                    </div>

                    {/* Price */}
                    <div className="border border-blue-500/20 bg-blue-500/5 rounded-2xl p-5 mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-300">Camp Registration × {quantity}</span>
                        <span className="text-white">${(CAMP_BASE * quantity).toFixed(2)}</span>
                      </div>
                      {appliedVoucher === null && (
                      <div className="flex justify-between text-sm mb-3">
                        <span className="text-gray-300">Service fee × {quantity}</span>
                        <span className="text-white">${(CAMP_FEE * quantity).toFixed(2)}</span>
                      </div>
                      )}
                      <div className="border-t border-white/10 pt-3 flex justify-between">
                        <span className="font-black text-white text-lg">Total Due Today</span>
                        <span className="font-black text-white text-2xl">${displayTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* ── Voucher / Promo Code ── */}
                    <VoucherInput
                      event="camp"
                      subtotal={CAMP_BASE * quantity}
                      onApply={setAppliedVoucher}
                      applied={appliedVoucher}
                    />

                    {/* ── Square Card Form ── */}
                    {isFree ? (
                      <div className="mb-5 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-4 text-center">
                        <p className="text-green-400 font-semibold text-sm">🎉 No payment required — this registration is free!</p>
                      </div>
                    ) : (
                      <div className="mb-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Lock className="w-4 h-4 text-green-400" />
                          <span className="text-white font-bold text-sm">Secure Card Payment</span>
                        </div>

                        {squareError ? (
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
                                <span className="text-gray-500 text-sm">Loading card form…</span>
                              </div>
                            )}
                            {/* Square injects its iframe card form here */}
                            <div id="sq-camp-card" className="bg-white rounded-xl p-4 min-h-[120px]" />
                          </div>
                        )}
                      </div>
                    )}

                    {paymentError && (
                      <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{paymentError}</span>
                      </div>
                    )}

                    <button onClick={handlePay}
                      disabled={paying || (!isFree && (cardLoading || !!squareError))}
                      className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-black text-lg rounded-2xl transition-all hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {paying ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Processing…</>
                      ) : isFree ? (
                        <>✓ Complete Free Registration</>
                      ) : (
                        <><Lock className="w-5 h-5" /> Pay ${displayTotal.toFixed(2)} Securely</>
                      )}
                    </button>
                    <p className="text-center text-xs text-gray-500 mt-3 flex items-center justify-center gap-1.5">
                      <Lock className="w-3 h-3" /> 256-bit encrypted · Powered by Square
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-6 gap-4">
              {step > 1 ? (
                <button onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-2 px-6 py-3 glass hover:bg-white/10 text-white font-bold rounded-xl transition-all border border-white/20">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              ) : (
                <a href="/events" className="flex items-center gap-2 px-6 py-3 glass hover:bg-white/10 text-white font-bold rounded-xl transition-all border border-white/20">
                  <ChevronLeft className="w-4 h-4" /> Back to Event
                </a>
              )}

              {step < 5 && (
                <button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}
                  className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-40 disabled:cursor-not-allowed">
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <EventSummary quantity={quantity} step={step} appliedVoucher={appliedVoucher} />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
