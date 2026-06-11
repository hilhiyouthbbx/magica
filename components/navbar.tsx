"use client";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { label: "Home",          href: "/" },
  { label: "About",         href: "/#about" },
  { label: "Programs",      href: "/#programs" },
  { label: "Camps/Clinic",  href: "/events" },
  { label: "Tournaments",   href: "/tournaments" },
  { label: "Tryouts",        href: "/tryout" },
  { label: "Youth Coaches", href: "/youth-coaches" },
  { label: "HS Coaches",    href: "/high-school-coaches" },
  { label: "Merch",         href: "/merch" },
  { label: "Film Room",     href: "/film-room" },
  { label: "Contact",       href: "/#contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header className={cn("fixed top-0 left-0 right-0 z-50 transition-all duration-300", scrolled ? "glass-dark py-3" : "py-5 bg-transparent")}>
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
        <a href="/" className="flex flex-col leading-none group">
          <span className="font-black text-white text-xl tracking-tight group-hover:text-blue-400 transition-colors">HILHI</span>
          <span className="text-blue-400 text-[9px] font-bold tracking-[0.2em] uppercase">Youth Basketball</span>
        </a>

        <nav className="hidden md:flex items-center gap-0.5">
          {links.map(l => (
            l.label === "Film Room"
              ? <a key={l.label} href={l.href} className="px-2.5 py-2 text-sm font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all whitespace-nowrap flex items-center gap-1">
                  🎬 {l.label}
                </a>
              : <a key={l.label} href={l.href} className="px-2.5 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all whitespace-nowrap">{l.label}</a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a href="/join" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/30 whitespace-nowrap">
            Register Now
          </a>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden glass-dark border-t border-white/10 mt-2 px-4 pb-4 pt-2 space-y-1">
          {links.map(l => (
            l.label === "Film Room"
              ? <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="block px-4 py-3 text-sm font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all">🎬 {l.label}</a>
              : <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="block px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all">{l.label}</a>
          ))}
          <a href="/join" onClick={() => setOpen(false)} className="block text-center px-4 py-3 bg-blue-600 text-white font-bold text-sm rounded-xl mt-2">
            Register Now
          </a>
        </div>
      )}
    </header>
  );
}
