export const dynamic = "force-dynamic";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { RaffleClient } from "./raffle-client";
import { DynamicTitle } from "@/components/dynamic-title";

export default function RafflePage() {
  return (
    <main className="min-h-screen bg-[#080D1A]">
      <DynamicTitle pageKey="raffle" fallback="Raffle | Hilhi Youth Basketball" />
      <Navbar />
      <RaffleClient />
      <Footer />
    </main>
  );
}
