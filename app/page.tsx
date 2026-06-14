export const dynamic = "force-dynamic";

import { Navbar }          from "@/components/navbar";
import { Hero }            from "@/components/hero";
import { UpcomingEvents }  from "@/components/upcoming-events";
import { WeAreHilhi }      from "@/components/we-are-hilhi";
import { Highlights }      from "@/components/highlights";
import { ActionStrip }     from "@/components/action-strip";
import { Programs }        from "@/components/programs";
import { MerchPreview }    from "@/components/merch-preview";
import { SocialFollow }    from "@/components/social-follow";
import { Quote }           from "@/components/quote";
import { Contact }         from "@/components/contact";
import { Footer }          from "@/components/footer";
import { getContent }      from "@/lib/content";
import { DynamicTitle }    from "@/components/dynamic-title";

export default async function Home() {
  const content = await getContent();

  return (
    <main className="min-h-screen bg-[#080D1A]">
      <DynamicTitle pageKey="home" fallback="Hilhi Youth Basketball | Hillsboro, OR" />
      <Navbar />
      <Hero           content={content.home}    />
      <UpcomingEvents />
      <WeAreHilhi />
      <Highlights />
      <ActionStrip />
      <Programs />
      <MerchPreview />
      <SocialFollow content={content.contact} />
      <Quote />
      <Contact        content={content.contact} />
      <Footer />
    </main>
  );
}
