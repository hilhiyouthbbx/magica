export const dynamic = "force-dynamic";

import { Navbar }       from "@/components/navbar";
import { Hero }         from "@/components/hero";
import { StatsBar }     from "@/components/stats-bar";
import { Gallery }      from "@/components/gallery";
import { About }        from "@/components/about";
import { Programs }     from "@/components/programs";
import { MerchPreview } from "@/components/merch-preview";
import { Quote }        from "@/components/quote";
import { Contact }      from "@/components/contact";
import { Footer }       from "@/components/footer";
import { getContent }   from "@/lib/content";

export default async function Home() {
  const content = await getContent();

  return (
    <main className="min-h-screen bg-[#080D1A]">
      <Navbar />
      <Hero    content={content.home}    />
      <StatsBar />
      <Gallery />
      <About   content={content.home}    />
      <Programs />
      <MerchPreview />
      <Quote />
      <Contact content={content.contact} />
      <Footer />
    </main>
  );
}
