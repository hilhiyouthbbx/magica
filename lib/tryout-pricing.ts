// Tryout pricing - single source of truth for the page, the server and the emails.
//   Full price (no promo code):  price + $10 fee per player
//   Any other amount (promo code / payment plan):  that amount + 3.5%
//   Free ($0): no fee
export const TRYOUT_FLAT_FEE    = 10;
export const PARTIAL_FEE_RATE   = 0.035;

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** discountedBase = price x qty after a promo code, or null when no promo code was used. */
export function tryoutAmountDue(price: number, qty: number, discountedBase: number | null): number {
  const full = price * qty;
  if (full <= 0) return 0;
  if (discountedBase === null || discountedBase >= full) return r2(full + TRYOUT_FLAT_FEE * qty);
  if (discountedBase <= 0) return 0;
  return r2(discountedBase * (1 + PARTIAL_FEE_RATE));
}
