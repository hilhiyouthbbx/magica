"use client";
import { useState } from "react";
import { Tag, CheckCircle, XCircle, Loader2, X } from "lucide-react";

export interface AppliedVoucher {
  code:           string;
  description:    string;
  type:           "percent" | "fixed";
  amount:         number;
  discountAmount: number;
  finalTotal:     number;
}

interface Props {
  event:    "camp" | "tournament" | "tryout";
  subtotal: number;
  onApply:  (v: AppliedVoucher | null) => void;
  applied:  AppliedVoucher | null;
}

export function VoucherInput({ event, subtotal, onApply, applied }: Props) {
  const [open,    setOpen]    = useState(false);
  const [code,    setCode]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function applyCode() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { setError("Please enter a promo code."); return; }
    setLoading(true); setError("");
    try {
      const res  = await fetch(`/api/vouchers/validate?code=${encodeURIComponent(trimmed)}&event=${event}&subtotal=${subtotal}`);
      const data = await res.json();
      if (data.valid) {
        onApply({
          code:           trimmed,
          description:    data.voucher.description,
          type:           data.voucher.type,
          amount:         data.voucher.amount,
          discountAmount: data.discountAmount,
          finalTotal:     data.finalTotal,
        });
        setOpen(false);
      } else {
        setError(data.error || "Invalid promo code.");
      }
    } catch {
      setError("Could not validate code. Please try again.");
    }
    setLoading(false);
  }

  function remove() {
    onApply(null);
    setCode("");
    setError("");
  }

  // ── Applied state ──────────────────────────────────────────────────────
  if (applied) {
    return (
      <div className="flex items-center justify-between gap-3 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
          <div>
            <p className="text-green-300 text-sm font-bold">
              Promo code <span className="font-mono">{applied.code}</span> applied!
            </p>
            <p className="text-green-400/70 text-xs">
              {applied.description} —{" "}
              {applied.type === "percent"
                ? `${applied.amount}% off`
                : `$${applied.amount.toFixed(2)} off`}{" "}
              (saving <strong>${applied.discountAmount.toFixed(2)}</strong>)
            </p>
          </div>
        </div>
        <button onClick={remove} className="p-1 text-gray-400 hover:text-white transition-colors" title="Remove code">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // ── Collapsed state ────────────────────────────────────────────────────
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 font-semibold transition-colors"
      >
        <Tag className="w-4 h-4" />
        Have a promo code?
      </button>
    );
  }

  // ── Expanded input ─────────────────────────────────────────────────────
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setError(""); }}
          onKeyDown={e => e.key === "Enter" && applyCode()}
          placeholder="Enter promo code"
          className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-500 text-sm font-mono uppercase tracking-wider focus:outline-none focus:border-orange-500 transition-colors"
          disabled={loading}
          autoFocus
        />
        <button
          type="button"
          onClick={applyCode}
          disabled={loading || !code.trim()}
          className="px-4 py-2.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setCode(""); setError(""); }}
          className="p-2.5 text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-xs">
          <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
