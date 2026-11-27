// Merch sale: percent off every item until a last day. Shared by the merch page (what customers see)
// and the payment route (what is actually charged), so both always agree.

export interface SaleSettings {
  saleOn?:      boolean;
  salePercent?: number;
  saleEnds?:    string; // YYYY-MM-DD, the last day the sale runs (Pacific time). Empty = no end date.
}

/** Today's date (YYYY-MM-DD) in Pacific time, where the club is. */
export function todayPacific(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** True while the sale switch is on, the percent is sensible and the last day has not passed. */
export function saleActive(s: SaleSettings, now: Date = new Date()): boolean {
  const pct = Number(s.salePercent);
  if (!s.saleOn || !(pct >= 1 && pct <= 90)) return false;
  if (s.saleEnds && todayPacific(now) > s.saleEnds) return false;
  return true;
}

/** Price after the sale, rounded to the cent. */
export function salePrice(price: number, percent: number): number {
  return Math.round(price * (100 - percent)) / 100;
}
