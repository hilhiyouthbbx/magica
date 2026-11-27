// Seasonal looks for the Email Blast. Pure data (no server code) so the admin picker and the
// email template share one list. "standard" is the plain blue Hilhi email, unchanged.

export interface EmailTheme {
  id:        string;
  label:     string;
  icon:      string;   // shown on the picker button and at the start of the subject line
  headerBg:  string;   // club-name bar at the top
  stripe:    string;   // thin color bar above the header
  bannerBg:  string;   // greeting banner under the header
  bannerFg:  string;
  banner:    string;   // greeting text
  strip:     string;   // row of decorations under the greeting
  pageBg:    string;   // color around the email card
  accent:    string;   // closing line color
  closing:   string;   // short sign-off above the footer
  footerBg:  string;
}

export const EMAIL_THEMES: EmailTheme[] = [
  { id: "standard", label: "Classic", icon: "\u{1F3C0}", headerBg: "#1e3a8a", stripe: "#1e3a8a", bannerBg: "", bannerFg: "", banner: "", strip: "", pageBg: "#f9fafb", accent: "#1e3a8a", closing: "", footerBg: "#f8fafc" },
  { id: "christmas", label: "Holiday / Christmas", icon: "\u{1F384}", headerBg: "#991b1b", stripe: "#15803d", bannerBg: "#166534", bannerFg: "#ffffff",
    banner: "\u{1F384} Happy Holidays from Hilhi Youth Basketball! \u{1F384}", strip: "\u2744\uFE0F \u{1F381} \u26C4 \u{1F381} \u2744\uFE0F \u{1F381} \u26C4 \u{1F381} \u2744\uFE0F",
    pageBg: "#fef2f2", accent: "#991b1b", closing: "Wishing you and your family a joyful, healthy holiday season! \u{1F384}", footerBg: "#f0fdf4" },
  { id: "thanksgiving", label: "Thanksgiving", icon: "\u{1F983}", headerBg: "#7c2d12", stripe: "#ea580c", bannerBg: "#c2410c", bannerFg: "#ffffff",
    banner: "\u{1F983} Happy Thanksgiving! \u{1F342}", strip: "\u{1F341} \u{1F342} \u{1F383} \u{1F342} \u{1F341} \u{1F342} \u{1F383} \u{1F342} \u{1F341}",
    pageBg: "#fff7ed", accent: "#9a3412", closing: "We are thankful for every player and family in our Spartan community! \u{1F342}", footerBg: "#fffbeb" },
  { id: "newyear", label: "New Year", icon: "\u{1F386}", headerBg: "#0f172a", stripe: "#eab308", bannerBg: "#1e3a8a", bannerFg: "#fde047",
    banner: "\u{1F386} Happy New Year! \u{1F3C0}", strip: "\u2B50 \u{1F389} \u2B50 \u{1F386} \u2B50 \u{1F389} \u2B50 \u{1F386} \u2B50",
    pageBg: "#f1f5f9", accent: "#1e3a8a", closing: "Here is to a great new year on and off the court! \u{1F389}", footerBg: "#f8fafc" },
  { id: "valentines", label: "Valentine's Day", icon: "\u2764\uFE0F", headerBg: "#9d174d", stripe: "#e11d48", bannerBg: "#be185d", bannerFg: "#ffffff",
    banner: "\u{1F49D} Happy Valentine's Day! \u{1F49D}", strip: "\u2764\uFE0F \u{1F498} \u{1F495} \u{1F498} \u2764\uFE0F \u{1F498} \u{1F495} \u{1F498} \u2764\uFE0F",
    pageBg: "#fdf2f8", accent: "#be185d", closing: "We love our Hilhi basketball family! \u2764\uFE0F", footerBg: "#fff1f2" },
  { id: "spring", label: "Spring / Easter", icon: "\u{1F337}", headerBg: "#047857", stripe: "#f472b6", bannerBg: "#be185d", bannerFg: "#ffffff",
    banner: "\u{1F337} Happy Spring! \u{1F423}", strip: "\u{1F337} \u{1F423} \u{1F33C} \u{1F430} \u{1F337} \u{1F423} \u{1F33C} \u{1F430} \u{1F337}",
    pageBg: "#f0fdf4", accent: "#047857", closing: "Wishing you a bright, beautiful spring! \u{1F33C}", footerBg: "#fdf2f8" },
  { id: "summer", label: "Summer", icon: "\u2600\uFE0F", headerBg: "#0369a1", stripe: "#facc15", bannerBg: "#f59e0b", bannerFg: "#1f2937",
    banner: "\u2600\uFE0F Hello Summer! \u{1F334}", strip: "\u{1F334} \u2600\uFE0F \u{1F3C0} \u{1F30A} \u{1F334} \u2600\uFE0F \u{1F3C0} \u{1F30A} \u{1F334}",
    pageBg: "#f0f9ff", accent: "#0369a1", closing: "Have a fun, safe summer! \u{1F30A}", footerBg: "#fefce8" },
  { id: "fall", label: "Fall", icon: "\u{1F341}", headerBg: "#78350f", stripe: "#d97706", bannerBg: "#b45309", bannerFg: "#ffffff",
    banner: "\u{1F341} Hello Fall! \u{1F342}", strip: "\u{1F341} \u{1F342} \u{1F3C0} \u{1F342} \u{1F341} \u{1F342} \u{1F3C0} \u{1F342} \u{1F341}",
    pageBg: "#fffbeb", accent: "#92400e", closing: "Fall means basketball season is coming! \u{1F3C0}", footerBg: "#fff7ed" },
  { id: "halloween", label: "Halloween", icon: "\u{1F383}", headerBg: "#111827", stripe: "#f97316", bannerBg: "#ea580c", bannerFg: "#ffffff",
    banner: "\u{1F383} Happy Halloween! \u{1F47B}", strip: "\u{1F383} \u{1F987} \u{1F47B} \u{1F987} \u{1F383} \u{1F987} \u{1F47B} \u{1F987} \u{1F383}",
    pageBg: "#fff7ed", accent: "#c2410c", closing: "Have a spooktacular night! \u{1F47B}", footerBg: "#f3f4f6" },
  { id: "gameday", label: "Game Day / Hype", icon: "\u{1F3C6}", headerBg: "#1e3a8a", stripe: "#ef4444", bannerBg: "#dc2626", bannerFg: "#ffffff",
    banner: "\u{1F3C0} GAME DAY \u2013 GO SPARTANS! \u{1F3C0}", strip: "\u{1F3C0} \u{1F525} \u{1F3C6} \u{1F525} \u{1F3C0} \u{1F525} \u{1F3C6} \u{1F525} \u{1F3C0}",
    pageBg: "#eff6ff", accent: "#dc2626", closing: "Let's go, Spartans! \u{1F525}", footerBg: "#f8fafc" },
];

export function getEmailTheme(id?: string | null): EmailTheme {
  return EMAIL_THEMES.find(t => t.id === id) ?? EMAIL_THEMES[0];
}
