export const dynamic = "force-dynamic";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { getContent } from "@/lib/content";
import { TryoutClient } from "./tryout-client";
import { DynamicTitle } from "@/components/dynamic-title";

export default async function TryoutPage() {
  const content = await getContent();
  const t = content.tryout;
  return (
    <main className="min-h-screen bg-[#080D1A]">
      <DynamicTitle pageKey="tryout" fallback="Youth Tryout | Hilhi Youth Basketball" />
      <Navbar />
      <TryoutClient tryout={t} contact={content.contact} />
      <Footer />
    </main>
  );
}
