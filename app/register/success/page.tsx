"use client";

export const dynamic = "force-dynamic";
import { motion } from "framer-motion";
import { CheckCircle, Calendar, MapPin, Clock, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-[#080D1A]">
      <Navbar />
      <section className="relative min-h-screen flex items-center justify-center py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.12),transparent_60%)]" />
        <div className="relative max-w-2xl mx-auto px-4 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.6 }}
            className="w-24 h-24 rounded-full bg-green-500/20 border-2 border-green-500/50 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-500/20">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">You&apos;re Registered! 🏀</h1>
            <p className="text-gray-400 text-lg mb-10 leading-relaxed">
              Payment confirmed! Check your email for a receipt and camp details. We can&apos;t wait to see you on the court.
            </p>

            <div className="glass rounded-3xl p-6 border border-white/10 text-left space-y-4 mb-8">
              <h3 className="font-black text-white text-lg mb-2">2026 Hilhi Youth Basketball Camp</h3>
              {[
                { icon: Calendar, text: "June 22–25, 2026" },
                { icon: Clock, text: "9:00 AM – 3:00 PM daily (Drop-off from 8:00 AM)" },
                { icon: MapPin, text: "3285 SE Rood Bridge Rd, Hillsboro, OR 97123" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-gray-300 text-sm">{text}</span>
                </div>
              ))}
            </div>

            <div className="glass rounded-2xl p-5 border border-green-500/20 bg-green-500/5 mb-8 text-left">
              <p className="text-green-300 text-sm font-medium">✅ A confirmation email has been sent to you.</p>
              <p className="text-gray-400 text-sm mt-1">Questions? Text us at <a href="tel:9715630552" className="text-blue-400">971-563-0552</a> or email <a href="mailto:info@hilhiyouthbbx.com" className="text-blue-400">info@hilhiyouthbbx.com</a></p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/" className="group flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all">
                Back to Home <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="/events" className="flex items-center justify-center gap-2 px-6 py-3 glass hover:bg-white/10 text-white font-bold rounded-xl transition-all border border-white/20">
                View All Events
              </a>
            </div>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
