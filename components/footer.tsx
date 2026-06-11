"use client";

export function Footer() {
  return (
    <footer className="border-t border-white/10 py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <a href="/" className="flex flex-col leading-none group">
            <span className="font-black text-white text-xl tracking-tight group-hover:text-blue-400 transition-colors">HILHI</span>
            <span className="text-blue-400 text-[9px] font-bold tracking-[0.2em] uppercase">Youth Basketball</span>
          </a>
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            {[
              ["Home","/"],
              ["About","/#about"],
              ["Programs","/#programs"],
              ["Events","/events"],
              ["Youth Coaches","/youth-coaches"],
              ["HS Coaches","/high-school-coaches"],
              ["Merch","/merch"],
              ["Contact","/#contact"],
            ].map(([l,h]) => (
              <a key={l} href={h} className="text-gray-500 hover:text-white text-sm transition-colors whitespace-nowrap">{l}</a>
            ))}
          </nav>
          <div className="text-gray-600 text-sm">&copy; {new Date().getFullYear()} Hilhi Youth Basketball</div>
        </div>
      </div>
    </footer>
  );
}
