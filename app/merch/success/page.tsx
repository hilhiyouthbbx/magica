export const dynamic = "force-dynamic";

import { CheckCircle, ArrowLeft, ShoppingBag } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function MerchSuccessPage() {
  return (
    <main className="min-h-screen bg-[#080D1A]">
      <Navbar />
      <section className="flex items-center justify-center min-h-[80vh] px-4">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-4xl font-black text-white mb-3">Order Complete!</h1>
          <p className="text-gray-400 text-lg mb-2">
            Thank you for your purchase! 🏀
          </p>
          <p className="text-gray-500 text-sm mb-8">
            You'll receive a confirmation email from Stripe. Our team at{" "}
            <span className="text-blue-400">info@hilhiyouthbbx.com</span> will follow up with
            details on pickup or delivery.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/merch"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all">
              <ShoppingBag className="w-4 h-4" />
              Shop More Gear
            </a>
            <a href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-bold rounded-xl transition-all">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </a>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
