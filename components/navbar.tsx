"use client";
import { useState, useEffect, useRef } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Default labels — overridden by admin settings when set
const DEFAULTS: Record<string, string> = {
  labelHome:         "Home",
  labelAbout:        "About",
  labelPrograms:     "Programs",
  labelCamps:        "Camps/Clinic",
  labelTournaments:  "Tournaments",
  labelTryout:       "Youth Tryout",
  labelYouthCoaches: "Youth Coaches",
  labelHSCoaches:    "HS Coaches",
  labelMerch:        "Merch",
  labelFilmRoom:     "Film Room",
  labelContact:      "Contact",
};

interface NavConfig {
  showTryouts:       boolean;
  showHome:          boolean;
  showAbout:         boolean;
  showPrograms:      boolean;
  showCamps:         boolean;
  showTournaments:   boolean;
  showYouthCoaches:  boolean;
  showHSCoaches:     boolean;
  showHSSchedule:    boolean;
  showMerch:         boolean;
  showFilmRoom:      boolean;
  showContact:       boolean;
  showRegisterCta:   boolean;
  labelHome:         string;
  labelAbout:        string;
  labelPrograms:     string;
  labelCamps:        string;
  labelTournaments:  string;
  labelTryout:       string;
  labelYouthCoaches: string;
  labelHSCoaches:    string;
  labelMerch:        string;
  labelFilmRoom:     string;
  labelContact:      string;
}

function lbl(cfg: NavConfig, key: keyof NavConfig): string {
  const val = cfg[key] as string;
  return (val && val.trim()) ? val.trim() : (DEFAULTS[key as string] ?? "");
}

export function Navbar() {
  const [open,      setOpen]      = useState(false);
  const [scrolled,  setScrolled]  = useState(false);
  const [campOpen,  setCampOpen]  = useState(false);
  const [navConfig, setNavConfig] = useState<NavConfig>({
    showTryouts:  true,
    showHome: true, showAbout: true, showPrograms: true, showCamps: true,
    showTournaments: true, showYouthCoaches: true, showHSCoaches: true,
    showHSSchedule: true, showMerch: true, showFilmRoom: true, showContact: true,
    showRegisterCta: true,
    labelHome: "", labelAbout: "", labelPrograms: "", labelCamps: "",
    labelTournaments: "", labelTryout: "", labelYouthCoaches: "",
    labelHSCoaches: "", labelMerch: "", labelFilmRoom: "", labelContact: "",
  });
  const campRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (campRef.current && !campRef.current.contains(e.target as Node)) {
        setCampOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch nav visibility settings from content API
  useEffect(() => {
    fetch("/api/content")
      .then(r => r.json())
      .then(d => {
        const nb = d?.navbar;
        if (nb) {
          setNavConfig({
            showTryouts:       nb.showTryouts       !== false,
            showHome:          nb.showHome          !== false,
            showAbout:         nb.showAbout         !== false,
            showPrograms:      nb.showPrograms      !== false,
            showCamps:         nb.showCamps         !== false,
            showTournaments:   nb.showTournaments   !== false,
            showYouthCoaches:  nb.showYouthCoaches  !== false,
            showHSCoaches:     nb.showHSCoaches     !== false,
            showHSSchedule:    nb.showHSSchedule    !== false,
            showMerch:         nb.showMerch         !== false,
            showFilmRoom:      nb.showFilmRoom      !== false,
            showContact:       nb.showContact       !== false,
            showRegisterCta:   nb.showRegisterCta   !== false,
            labelHome:         nb.labelHome         ?? "",
            labelAbout:        nb.labelAbout        ?? "",
            labelPrograms:     nb.labelPrograms     ?? "",
            labelCamps:        nb.labelCamps        ?? "",
            labelTournaments:  nb.labelTournaments  ?? "",
            labelTryout:       nb.labelTryout       ?? "",
            labelYouthCoaches: nb.labelYouthCoaches ?? "",
            labelHSCoaches:    nb.labelHSCoaches    ?? "",
            labelMerch:        nb.labelMerch        ?? "",
            labelFilmRoom:     nb.labelFilmRoom     ?? "",
            labelContact:      nb.labelContact      ?? "",
          });
        }
      })
      .catch(() => {}); // silently keep defaults on error
  }, []);

  // Build links dynamically from navConfig labels, filtering out hidden ones
  const links = [
    ...(navConfig.showHome         ? [{ label: lbl(navConfig, "labelHome"),        href: "/" }] : []),
    ...(navConfig.showAbout        ? [{ label: lbl(navConfig, "labelAbout"),       href: "/#about" }] : []),
    ...(navConfig.showPrograms     ? [{ label: lbl(navConfig, "labelPrograms"),    href: "/#programs" }] : []),
    ...(navConfig.showCamps        ? [{
      label: lbl(navConfig, "labelCamps"),        href: "/events",
      dropdown: [
        { label: "📅 Camp Events",   href: "/events" },
        { label: "🏀 Camp Schedule", href: "/camp-schedule" },
      ],
    }] : []),
    ...(navConfig.showTournaments  ? [{ label: lbl(navConfig, "labelTournaments"), href: "/tournaments" }] : []),
    ...(navConfig.showTryouts      ? [{ label: lbl(navConfig, "labelTryout"),      href: "/tryout" }] : []),
    ...(navConfig.showYouthCoaches ? [{ label: lbl(navConfig, "labelYouthCoaches"), href: "/youth-coaches" }] : []),
    ...(navConfig.showHSCoaches    ? [{ label: lbl(navConfig, "labelHSCoaches"),    href: "/high-school-coaches" }] : []),
    ...(navConfig.showHSSchedule   ? [{ label: "HS Schedule",                       href: "https://www.osaa.org/teams/69010" }] : []),
    ...(navConfig.showMerch        ? [{ label: lbl(navConfig, "labelMerch"),        href: "/merch" }] : []),
    ...(navConfig.showFilmRoom     ? [{ label: lbl(navConfig, "labelFilmRoom"),     href: "/film-room" }] : []),
    ...(navConfig.showContact      ? [{ label: lbl(navConfig, "labelContact"),      href: "/#contact" }] : []),
  ];

  return (
    <header className={cn("fixed top-0 left-0 right-0 z-50 transition-all duration-300", scrolled ? "glass-dark py-3" : "py-5 bg-transparent")}>
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
        <a href="/" className="flex flex-col leading-none group">
          <span className="font-black text-white text-xl tracking-tight group-hover:text-blue-400 transition-colors">HILHI</span>
          <span className="text-blue-400 text-[9px] font-bold tracking-[0.2em] uppercase">Youth Basketball</span>
        </a>

        <nav className="hidden md:flex items-center gap-0.5">
          {links.map(l => {
            if (l.href === "/film-room") {
              return (
                <a key={l.label} href={l.href} className="px-2.5 py-2 text-sm font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all whitespace-nowrap flex items-center gap-1">
                  🎬 {l.label}
                </a>
              );
            }
            if (l.dropdown) {
              return (
                <div key={l.label} ref={campRef} className="relative">
                  <button
                    onClick={() => setCampOpen(p => !p)}
                    className="flex items-center gap-1 px-2.5 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all whitespace-nowrap"
                  >
                    {l.label}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${campOpen ? "rotate-180" : ""}`} />
                  </button>
                  {campOpen && (
                    <div className="absolute top-full left-0 mt-1 w-48 glass-dark rounded-xl border border-white/15 shadow-xl overflow-hidden z-50">
                      {l.dropdown.map(item => (
                        <a key={item.href} href={item.href}
                          onClick={() => setCampOpen(false)}
                          className="block px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all">
                          {item.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <a
                key={l.label}
                href={l.href}
                target={l.href.startsWith("http") ? "_blank" : undefined}
                rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="px-2.5 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all whitespace-nowrap"
              >
                {l.label}
              </a>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {navConfig.showRegisterCta && (
            <a href="/join" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/30 whitespace-nowrap">
              Join HILHI
            </a>
          )}
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden glass-dark border-t border-white/10 mt-2 px-4 pb-4 pt-2 space-y-1">
          {links.map(l => {
            if (l.dropdown) {
              return (
                <div key={l.label}>
                  <div className="px-4 py-2 text-xs font-black text-gray-500 uppercase tracking-wider">{l.label}</div>
                  {l.dropdown.map(item => (
                    <a key={item.href} href={item.href} onClick={() => setOpen(false)}
                      className="block px-6 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                      {item.label}
                    </a>
                  ))}
                </div>
              );
            }
            if (l.href === "/film-room") {
              return <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="block px-4 py-3 text-sm font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all">🎬 {l.label}</a>;
            }
            return <a
              key={l.label}
              href={l.href}
              target={l.href.startsWith("http") ? "_blank" : undefined}
              rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >{l.label}</a>;
          })}
          {navConfig.showRegisterCta && (
            <a href="/join" onClick={() => setOpen(false)} className="block text-center px-4 py-3 bg-blue-600 text-white font-bold text-sm rounded-xl mt-2">
              Join HILHI
            </a>
          )}
        </div>
      )}
    </header>
  );
}
