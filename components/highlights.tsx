"use client";
import { useEffect } from "react";
import Script from "next/script";

const REELS = [
  {
    url: "https://www.instagram.com/reel/DXZjN60BSQa/",
    caption: "Championship Highlights · @hilhibbx",
  },
  {
    url: "https://www.instagram.com/reel/DSRSiiejZnO/",
    caption: "8th Grade Lakeside Tournament · @hilhibbx",
  },
];

export function Highlights() {
  // Re-process any embeds that arrived after the script loaded
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).instgrm) {
      (window as any).instgrm.Embeds.process();
    }
  }, []);

  return (
    <section className="bg-[#060B14] py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-12">
          <div className="h-1 w-10 bg-[#F97316] rounded-full" />
          <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
            Recent Highlights
          </h2>
          <div className="h-1 flex-1 bg-white/10 rounded-full" />
          <a
            href="https://www.instagram.com/hilhibbx/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 font-bold uppercase tracking-wide transition-colors"
          >
            Follow @hilhibbx ↗
          </a>
        </div>

        {/* Instagram reels grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {REELS.map((reel, i) => (
            <div key={i} className="flex flex-col gap-3">
              {/* Caption above embed */}
              <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
                {reel.caption}
              </p>
              {/* Instagram blockquote embed — processed by instagram embed.js */}
              <div className="rounded-xl overflow-hidden border border-white/10 bg-black/30">
                <blockquote
                  className="instagram-media"
                  data-instgrm-captioned
                  data-instgrm-permalink={reel.url}
                  data-instgrm-version="14"
                  style={{
                    background: "#1a1a2e",
                    border: "0",
                    borderRadius: "12px",
                    boxShadow: "none",
                    margin: "0",
                    maxWidth: "100%",
                    minWidth: "280px",
                    padding: "0",
                    width: "100%",
                  }}
                >
                  <div style={{ padding: "16px" }}>
                    <a
                      href={reel.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-400 underline text-sm"
                    >
                      View on Instagram ↗
                    </a>
                  </div>
                </blockquote>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile follow link */}
        <div className="mt-10 sm:hidden text-center">
          <a
            href="https://www.instagram.com/hilhibbx/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 font-bold uppercase tracking-wide transition-colors"
          >
            Follow @hilhibbx on Instagram ↗
          </a>
        </div>
      </div>

      {/* Instagram embed script — loads once, processes all blockquotes */}
      <Script
        src="//www.instagram.com/embed.js"
        strategy="lazyOnload"
        onLoad={() => {
          if ((window as any).instgrm) {
            (window as any).instgrm.Embeds.process();
          }
        }}
      />
    </section>
  );
}
