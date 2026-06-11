"use client";

export const dynamic = "force-dynamic";
import { useState, useMemo, useRef, useEffect } from "react";
import Script from "next/script";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, Plus, Minus, Trash2, CreditCard, Loader2, Tag,
  ChevronRight, Lock, CheckCircle, ArrowLeft,
} from "lucide-react";
import { Navbar }  from "@/components/navbar";
import { Footer }  from "@/components/footer";
import type { SiteContent, MerchProduct } from "@/lib/content";

// ── Square config ─────────────────────────────────────────────────────────
const SQ_APP_ID = process.env.NEXT_PUBLIC_SQUARE_APP_ID ?? "";
const SQ_LOC_ID = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID ?? "";
const SQ_SCRIPT = SQ_APP_ID.startsWith("sandbox-")
  ? "https://sandbox.web.squarecdn.com/v1/square.js"
  : "https://web.squarecdn.com/v1/square.js";

// ── Product catalogue (loaded from CMS) ─────────────────────────────────────
const W  = "https://static.wixstatic.com/media/";
const Q  = "/v1/fill/w_400,h_400,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/img.png";
const px = (h: string) => `${W}${h}~mv2.png${Q}`;


const SIZES = ["YS","YM","YL","AS","AM","AL","AXL","AXXL"];
const CATS  = [
  { key:"all",          label:"All Items" },
  { key:"hoodie",       label:"Hoodies" },
  { key:"long-sleeve",  label:"Long Sleeves" },
  { key:"short-sleeve", label:"Short Sleeves" },
];

interface CartItem { productId:string; name:string; price:number; size:string; qty:number; imageUrl:string; }
type Step = "browse" | "contact" | "pay" | "done";

// ── Square card style ─────────────────────────────────────────────────────
const SQ_STYLE = {
  ".input-container":          { borderColor: "#e5e7eb", borderRadius: "10px" },
  ".input-container.is-focus": { borderColor: "#3b82f6" },
  ".input-container.is-error": { borderColor: "#ef4444" },
  "input":                     { color: "#111827", fontFamily: "inherit" },
  "input::placeholder":        { color: "#9ca3af" },
  ".message-text":             { color: "#ef4444" },
  ".message-icon":             { color: "#ef4444" },
};

export default function MerchPage() {
  const [products, setProducts] = useState<MerchProduct[]>([]);
  const [cat,   setCat]   = useState("all");
  const [sizes, setSizes] = useState<Record<string,string>>({});
  const [cart,  setCart]  = useState<CartItem[]>([]);

  const [name,  setName]  = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [step,         setStep]         = useState<Step>("browse");
  const [cardLoading,  setCardLoading]  = useState(false);
  const [squareError,  setSquareError]  = useState("");
  const [paying,       setPaying]       = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentId,    setPaymentId]    = useState("");
  const [retryCount,   setRetryCount]   = useState(0);

  // Load products from CMS
  useEffect(() => {
    fetch("/api/content")
      .then(r => r.json())
      .then((data: SiteContent) => {
        if (data?.merch?.products?.length) setProducts(data.merch.products);
      })
      .catch(() => {});
  }, []);

  const cardRef = useRef<any>(null);

  const filtered  = useMemo(() => cat === "all" ? products : products.filter(p => p.cat === cat), [cat, products]);
  const subtotal  = cart.reduce((s,i) => s + i.price * i.qty, 0);
  const fee       = Math.round(subtotal * 0.03 * 100) / 100;
  const total     = subtotal + fee;
  const cartCount = cart.reduce((s,i) => s + i.qty, 0);

  // ── Init Square card whenever step becomes "pay" ───────────────────────
  useEffect(() => {
    if (step !== "pay") return;

    let destroyed = false;
    setCardLoading(true);
    setSquareError("");

    const init = async () => {
      // Poll until window.Square is available (max 8 s)
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

        await card.attach("#sq-card-container");
        if (!destroyed) {
          cardRef.current = card;
          setCardLoading(false);
        } else {
          card.destroy().catch(() => {});
        }
      } catch (err: any) {
        console.error("[Square] card init failed:", err);
        if (!destroyed) {
          setSquareError(
            err?.message
              ? `Card form error: ${err.message}`
              : "Failed to load the card form. Please refresh and try again."
          );
          setCardLoading(false);
        }
      }
    };

    init();

    return () => {
      destroyed = true;
      setCardLoading(false);
      if (cardRef.current) {
        cardRef.current.destroy().catch(() => {});
        cardRef.current = null;
      }
      // Hard-clear container so Square can re-mount cleanly next time
      const el = document.getElementById("sq-card-container");
      if (el) el.innerHTML = "";
    };
  }, [step, retryCount]); // retryCount lets the retry button re-trigger the effect

  // ── Cart helpers ──────────────────────────────────────────────────────
  function addToCart(p: MerchProduct) {
    const size = sizes[p.id];
    if (!size) { setSizes(s => ({ ...s, [p.id]: "__REQUIRED__" })); return; }
    setCart(prev => {
      const ex = prev.find(i => i.productId === p.id && i.size === size);
      if (ex) return prev.map(i => i.productId===p.id && i.size===size ? {...i, qty:i.qty+1} : i);
      return [...prev, { productId:p.id, name:p.name, price:p.price, size, qty:1, imageUrl:p.imageUrl }];
    });
  }

  function updateQty(productId:string, size:string, delta:number) {
    setCart(prev => prev.map(i => i.productId===productId && i.size===size ? {...i, qty:i.qty+delta} : i).filter(i=>i.qty>0));
  }

  function handleContactNext(e: React.FormEvent) {
    e.preventDefault();
    setPaymentError(""); setSquareError("");
    setStep("pay");
  }

  async function handlePay() {
    if (!cardRef.current) { setPaymentError("Card form not ready — please wait a moment."); return; }
    setPaying(true); setPaymentError("");
    try {
      const result = await cardRef.current.tokenize();
      if (result.status !== "OK") {
        setPaymentError(result.errors?.map((e:any) => e.message).join(" ") || "Card validation failed. Please check your details.");
        setPaying(false); return;
      }
      const res  = await fetch("/api/square-payment", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          sourceId: result.token, total,
          cart: cart.map(i => ({ name:i.name, size:i.size, qty:i.qty, price:i.price })),
          contact: { name, email, phone, notes },
        }),
      });
      const data = await res.json();
      if (data.success) { setPaymentId(data.paymentId ?? ""); setStep("done"); }
      else setPaymentError(data.error || "Payment failed. Please try again.");
    } catch { setPaymentError("Network error. Please check your connection and try again."); }
    setPaying(false);
  }

  function resetAll() {
    setCart([]); setSizes({}); setName(""); setEmail(""); setPhone(""); setNotes("");
    setStep("browse"); setPaymentError(""); setSquareError(""); setPaymentId("");
  }

  // ──────────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#080D1A]">

      {/* Square Web Payments SDK — load as early as possible */}
      <Script src={SQ_SCRIPT} strategy="afterInteractive" />

      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(220,38,38,0.12),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(37,99,235,0.1),transparent_55%)]" />
        <div className="relative max-w-7xl mx-auto px-4">
          <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:0.6}}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold uppercase tracking-widest mb-4">
              <Tag className="w-3.5 h-3.5" /> Official Hilhi Gear
            </div>
            <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight mb-3">
              Rep Your <span className="text-gradient-red">Team</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-xl">
              Pick your items and sizes, then pay securely with your card — all right here.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-24">

        {/* ── ORDER COMPLETE ── */}
        {step === "done" ? (
          <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}}
            className="max-w-lg mx-auto glass rounded-3xl border border-green-500/30 text-center p-10">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-3xl font-black text-white mb-3">Payment Successful!</h2>
            <p className="text-gray-400 mb-2">Your order is confirmed. A receipt has been sent to:</p>
            <p className="text-blue-400 font-bold text-lg mb-6">{email}</p>
            {paymentId && <p className="text-gray-600 text-xs mb-6">Reference: {paymentId}</p>}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 text-left">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">What&apos;s next</p>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>📧 Receipt emailed to you</li>
                <li>🏀 Admin notified — your gear will be ready for pickup</li>
                <li>📞 Questions? Call 971-563-0552</li>
              </ul>
            </div>
            <button onClick={resetAll}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20">
              Shop More Gear
            </button>
          </motion.div>
        ) : (

          <div className="flex flex-col lg:flex-row gap-8">

            {/* ── Product grid ── */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-8">
                {CATS.map(c => (
                  <button key={c.key} onClick={() => setCat(c.key)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      cat === c.key
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                        : "glass border border-white/15 text-gray-400 hover:text-white hover:border-white/30"
                    }`}>
                    {c.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {filtered.map((p, i) => {
                    const sel = sizes[p.id];
                    const req = sel === "__REQUIRED__";
                    return (
                      <motion.div key={p.id} layout
                        initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}}
                        transition={{duration:0.3, delay:i*0.04}}
                        className="glass rounded-2xl overflow-hidden border border-white/10 hover:border-blue-500/40 transition-all duration-300 flex flex-col">
                        <div className="bg-white/95 aspect-square p-3 flex items-center justify-center">
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="p-3 flex flex-col gap-2 flex-1">
                          <div className="text-white font-bold text-xs leading-snug line-clamp-2">{p.name}</div>
                          <div className="text-blue-400 font-black text-base">${p.price}</div>
                          <div>
                            <div className={`text-[10px] font-semibold mb-1.5 ${req ? "text-red-400" : "text-gray-500 uppercase tracking-wider"}`}>
                              {req ? "⚠ Please select a size" : "Size"}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {SIZES.map(sz => (
                                <button key={sz} onClick={() => setSizes(s => ({...s,[p.id]:sz}))}
                                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border transition-all ${
                                    sel === sz && sz !== "__REQUIRED__"
                                      ? "bg-blue-600 border-blue-500 text-white"
                                      : "border-white/20 text-gray-400 hover:border-blue-400 hover:text-white"
                                  }`}>{sz}</button>
                              ))}
                            </div>
                          </div>
                          <button onClick={() => addToCart(p)}
                            className="mt-auto w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-1.5">
                            <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* ── Right sidebar ── */}
            <div className="lg:w-96 flex-shrink-0">
              <div className="lg:sticky lg:top-24 space-y-4">

                {/* Cart */}
                <div className="glass rounded-2xl border border-white/15 overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-blue-400" />
                      <span className="font-bold text-white text-sm">Your Cart</span>
                    </div>
                    {cartCount > 0 && <span className="bg-blue-600 text-white text-xs font-black px-2 py-0.5 rounded-full">{cartCount}</span>}
                  </div>
                  {cart.length === 0 ? (
                    <div className="px-5 py-8 text-center text-gray-500 text-sm">No items yet — add gear from the left!</div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {cart.map(item => (
                        <div key={`${item.productId}__${item.size}`} className="px-4 py-3 flex items-start gap-3">
                          <div className="w-12 h-12 rounded-lg bg-white/90 flex-shrink-0 overflow-hidden">
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain p-1" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-xs font-semibold leading-tight line-clamp-2">{item.name}</div>
                            <div className="text-gray-500 text-[10px] mt-0.5">Size: <span className="text-blue-400 font-bold">{item.size}</span></div>
                            <div className="flex items-center gap-2 mt-1.5">
                              <button onClick={() => updateQty(item.productId,item.size,-1)}
                                className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                                {item.qty===1 ? <Trash2 className="w-3 h-3 text-red-400"/> : <Minus className="w-3 h-3 text-gray-400"/>}
                              </button>
                              <span className="text-white font-bold text-sm w-4 text-center">{item.qty}</span>
                              <button onClick={() => updateQty(item.productId,item.size,1)}
                                className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                                <Plus className="w-3 h-3 text-gray-400"/>
                              </button>
                            </div>
                          </div>
                          <div className="text-blue-400 font-black text-sm flex-shrink-0">${(item.price*item.qty).toFixed(2)}</div>
                        </div>
                      ))}
                      <div className="px-5 pt-3 pb-1 flex items-center justify-between">
                        <span className="text-gray-500 text-xs font-semibold">Subtotal</span>
                        <span className="text-gray-400 text-xs">${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="px-5 pb-3 flex items-center justify-between">
                        <span className="text-gray-500 text-xs font-semibold">Service fee (3%)</span>
                        <span className="text-gray-400 text-xs">${fee.toFixed(2)}</span>
                      </div>
                      <div className="px-5 py-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
                        <span className="text-gray-400 text-sm font-semibold">Order Total</span>
                        <span className="text-white font-black text-2xl">${total.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Checkout panels */}
                {cart.length > 0 && (
                  <AnimatePresence mode="wait">

                    {step === "browse" && (
                      <motion.button key="go" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
                        onClick={() => setStep("contact")}
                        className="w-full py-4 bg-gradient-to-r from-[#006aff] to-[#00aaff] hover:brightness-110 text-white font-black rounded-2xl transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 text-base">
                        <CreditCard className="w-5 h-5" /> Proceed to Checkout <ChevronRight className="w-5 h-5" />
                      </motion.button>
                    )}

                    {step === "contact" && (
                      <motion.form key="contact" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
                        onSubmit={handleContactNext}
                        className="glass rounded-2xl border border-white/15 overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/10">
                          <h3 className="text-white font-bold text-sm flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-blue-400" /> Your Contact Info
                          </h3>
                          <p className="text-gray-500 text-xs mt-0.5">Step 1 of 2 — for your receipt.</p>
                        </div>
                        <div className="px-5 py-4 space-y-3">
                          {[
                            { label:"Full Name", value:name, set:setName, type:"text",  required:true,  ph:"Jane Smith" },
                            { label:"Email",     value:email,set:setEmail,type:"email", required:true,  ph:"jane@example.com" },
                            { label:"Phone",     value:phone,set:setPhone,type:"tel",   required:false, ph:"503-555-0100" },
                          ].map(f => (
                            <div key={f.label}>
                              <label className="block text-gray-400 text-xs font-semibold mb-1">
                                {f.label}{f.required && <span className="text-red-400"> *</span>}
                              </label>
                              <input required={f.required} type={f.type} value={f.value}
                                onChange={e => f.set(e.target.value)} placeholder={f.ph}
                                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
                            </div>
                          ))}
                          <div>
                            <label className="block text-gray-400 text-xs font-semibold mb-1">Notes</label>
                            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                              placeholder="Questions, pickup preference…"
                              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none" />
                          </div>
                          <button type="submit"
                            className="w-full py-3.5 bg-gradient-to-r from-[#006aff] to-[#00aaff] hover:brightness-110 text-white font-black rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
                            Continue to Payment <ChevronRight className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => setStep("browse")}
                            className="w-full text-gray-500 hover:text-gray-300 text-xs transition-colors flex items-center justify-center gap-1">
                            <ArrowLeft className="w-3 h-3" /> Back to cart
                          </button>
                        </div>
                      </motion.form>
                    )}

                    {step === "pay" && (
                      <motion.div key="pay" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
                        className="glass rounded-2xl border border-white/15 overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/10">
                          <h3 className="text-white font-bold text-sm flex items-center gap-2">
                            <Lock className="w-4 h-4 text-green-400" /> Secure Card Payment
                          </h3>
                          <p className="text-gray-500 text-xs mt-0.5">Step 2 of 2 — card details are encrypted by Square.</p>
                        </div>
                        <div className="px-5 py-4 space-y-4">

                          {/* Amount */}
                          <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl px-4 py-3 space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-blue-300/70">Subtotal</span>
                              <span className="text-gray-300">${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-blue-300/70">Service fee (3%)</span>
                              <span className="text-gray-300">${fee.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-blue-500/20">
                              <span className="text-blue-300 text-sm font-semibold">Total due</span>
                              <span className="text-white font-black text-2xl">${total.toFixed(2)}</span>
                            </div>
                          </div>

                          {/* Card form */}
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
                              {/* Square injects its iframe card form into this div */}
                              <div id="sq-card-container" className="bg-white rounded-xl p-4 min-h-[120px]" />
                            </div>
                          )}

                          {paymentError && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                              <p className="text-red-400 text-sm">{paymentError}</p>
                            </div>
                          )}

                          <button onClick={handlePay}
                            disabled={paying || cardLoading || !!squareError}
                            className="w-full py-3.5 bg-gradient-to-r from-[#006aff] to-[#00aaff] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
                            {paying
                              ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                              : <><Lock className="w-4 h-4" /> Pay ${total.toFixed(2)} Securely</>
                            }
                          </button>

                          <p className="text-gray-600 text-[11px] text-center flex items-center justify-center gap-1">
                            <Lock className="w-3 h-3" /> 256-bit encrypted · Powered by Square
                          </p>

                          <button type="button" onClick={() => setStep("contact")}
                            className="w-full text-gray-500 hover:text-gray-300 text-xs transition-colors flex items-center justify-center gap-1">
                            <ArrowLeft className="w-3 h-3" /> Back
                          </button>
                        </div>
                      </motion.div>
                    )}

                  </AnimatePresence>
                )}

                {/* Trust badges */}
                {(step === "browse" || step === "contact") && cart.length > 0 && (
                  <div className="glass rounded-2xl border border-white/10 px-5 py-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      {[
                        { icon:"🔒", label:"Encrypted",  sub:"Card secured" },
                        { icon:"📧", label:"Receipt",    sub:"Emailed to you" },
                        { icon:"🏀", label:"Official",   sub:"Hilhi gear" },
                      ].map(b => (
                        <div key={b.label}>
                          <div className="text-2xl mb-1">{b.icon}</div>
                          <div className="text-white text-xs font-bold">{b.label}</div>
                          <div className="text-gray-500 text-[10px]">{b.sub}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
