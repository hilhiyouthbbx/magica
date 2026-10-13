export const dynamic = "force-dynamic";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { RaffleClient } from "./raffle-client";
import { DynamicTitle } from "@/components/dynamic-title";
import { getRaffleSettings } from "@/lib/raffle-settings";

export default async function RafflePage() {
  const { open } = await getRaffleSettings();
  return (
    <main className="min-h-screen bg-[#080D1A]">
      <DynamicTitle pageKey="raffle" fallback="Raffle | Hilhi Youth Basketball" />
      <Navbar />
      {open ? (
        <RaffleClient />
      ) : (
        <div className="min-h-screen flex items-center justify-center pt-24 px-4">
          <div className="max-w-md text-center">
            <div className="w-20 h-20 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-6 text-4xl">🎟️</div>
            <h1 className="text-3xl font-black text-white mb-3">Raffle Is Closed</h1>
            <p className="text-gray-400 mb-8">Raffle ticket sales are not open right now. Follow us on social media or check back soon for the next fundraiser.</p>
            <a href="/" className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all inline-block">Back to Home</a>
          </div>
        </div>
      )}
      <Footer />
    </main>
  );
}
