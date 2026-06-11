"use client";
import { motion } from "framer-motion";

export function Quote() {
  return (
    <section className="py-24 relative overflow-hidden bg-[#060B17]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.07),transparent_70%)]" />
      <div className="absolute top-8 left-8 text-[180px] font-black text-white/[0.03] leading-none select-none">&ldquo;</div>
      <div className="relative max-w-5xl mx-auto px-4 text-center">
        <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.8}}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold uppercase tracking-widest mb-10">Words to Live By</div>
          <blockquote className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight mb-8">
            &ldquo;Don&apos;t measure yourself by what you have accomplished, but by what you should have accomplished{" "}
            <span className="text-gradient">with your ability.</span>&rdquo;
          </blockquote>
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-red-500" />
            <div>
              <div className="font-black text-white text-lg">John Wooden</div>
              <div className="text-gray-500 text-sm">10-time NCAA Champion Coach</div>
            </div>
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-red-500" />
          </div>
        </motion.div>

        <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.7,delay:0.3}}
          className="mt-16 glass rounded-3xl p-8 sm:p-12 border border-white/10">
          <div className="text-2xl sm:text-3xl font-black text-white mb-3">Support the Program</div>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">Your donation helps provide equipment, coaching, and opportunities for youth players in the Hillsboro community.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://www.paypal.com/donate" target="_blank" rel="noopener noreferrer"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-2xl transition-all hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105">
              💛 Donate with PayPal
            </a>
            <a href="#contact" className="px-8 py-4 glass hover:bg-white/10 text-white font-bold rounded-2xl transition-all border border-white/20">
              Get in Touch
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
