"use client";

export const dynamic = "force-dynamic";
import { motion } from "framer-motion";
import { Users, Mail, Award, Star, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import type { SiteContent, Coach, FeaturedCoach } from "@/lib/content";
import { DynamicTitle } from "@/components/dynamic-title";

// ── Static hero background ────────────────────────────────────────────────────
const HERO_BG = "https://static.wixstatic.com/media/458ec6_410e9b5e45414d0a8bfce9e06a704395~mv2.jpg/v1/fill/w_1920,h_800,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/banner.jpg";

// ── Hardcoded fallbacks (used only when CMS has no data) ──────────────────────
const FALLBACK_FEATURED: FeaturedCoach = {
  name:  "Samedy Kem",
  title: "Boys Varsity Head Coach — Hillsboro High School",
  photo: "https://static.wixstatic.com/media/458ec6_d73e2de98a3e401dadc7a150814ae173~mv2.jpg/v1/fill/w_600,h_600,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/kem.jpg",
  bioParas: [
    "With over three decades of basketball coaching and player development experience, Coach Kem has dedicated his career to teaching the game the right way — through fundamentals, teamwork, and discipline.",
    "Currently in his fifth year as the Head Boys Varsity Basketball Coach at Hillsboro High School, Coach Kem has built a program centered on hard work, accountability, and community. Under his leadership, the Hillsboro Youth Basketball Program has experienced tremendous growth — doubling in size since his first year. His vision emphasizes developing a strong foundation from the youth level up, creating a unified program where younger athletes learn the same values, principles, and playing style as the high school team.",
    "A proud Aloha High School alumnus, Class of 1989, Coach Kem was a member of the only basketball team in Aloha High School history to be inducted into the Aloha High School Hall of Fame. His playing experience fuels his passion for mentorship and his deep understanding of what it takes to build a winning culture that lasts beyond the court.",
    "Before taking over the boys program, Coach Kem spent six years with Hillsboro High School Girls Basketball, serving as both Assistant Varsity Coach and Head Junior Varsity Coach. During that time, his teams consistently competed at a high level, finishing 2nd in league play for two consecutive seasons, and he was instrumental in organizing and running the school's girls youth and summer programs.",
    "From 2014 to 2016, he also led Hillsboro's Girls Youth Program for grades 3–8, coaching teams that emphasized fundamentals, sportsmanship, and teamwork — culminating in a 1st Place finish at the Seaside Youth Tournament. His ability to connect with players and parents alike has built lasting relationships and community trust.",
    "Earlier in his career, from 2011 to 2014, Coach Kem served as the Freshman Boys Head Coach and Assistant Varsity Coach at Aloha High School, where he also directed the youth boys program and organized annual tournaments and camps. His programs were known for their structure, positive culture, and player development focus.",
    "In addition to his basketball career, Coach Kem is a State of Oregon Certified General Contractor with over 30 years of experience in construction and architectural design. His professional background mirrors his coaching philosophy — built on precision, dedication, and excellence in execution.",
    "Today, Coach Kem continues to lead with passion and purpose — developing student-athletes who compete with integrity, play for each other, and carry the values of teamwork, respect, and perseverance both on and off the court.",
  ],
  stats: [
    { value: "30+",          label: "Years Coaching" },
    { value: "5th",          label: "Year as Head Boys Varsity Coach" },
    { value: "1989",         label: "Aloha HS Alum" },
    { value: "Hall of Fame", label: "Aloha High School" },
  ],
};

const FALLBACK_ASSISTANTS: (Coach & { color: string })[] = [
  { id:"fa1", name: "My Lovanh",     title: "Varsity Assistant Coach",   email: "info@hilhiyouthbbx.com",   imageUrl: "https://static.wixstatic.com/media/458ec6_7312b5f634f044dd829cc90251a86775~mv2.jpg/v1/fill/w_600,h_500,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/lovanh.jpg",   color: "from-blue-700 to-blue-900",    bio: "My Lovanh is a dedicated basketball coach with a deep passion for player development and the game of basketball. From 2015 to 2020, he coached competitive youth AAU teams, helping young athletes build strong fundamentals and a love for the game.\n\nIn 2017, My joined Aloha High School in Beaverton, Oregon, where he served as the Head Junior Varsity Coach through 2022. During his tenure, he was instrumental in developing players for the varsity level, emphasizing teamwork, discipline, and high basketball IQ.\n\nIn 2023, My transitioned to Hillsboro High School, where he currently serves as an Assistant Varsity Coach. He continues to bring energy, knowledge, and leadership to the program, striving to inspire student-athletes both on and off the court." },
  { id:"fa2", name: "Xavier Dupree", title: "JV Head Coach",              email: "dupreex@hsd.k12.or.us",    imageUrl: "https://static.wixstatic.com/media/458ec6_95d469bbaeb8429e98135e8439739999~mv2.jpg/v1/fill/w_600,h_500,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/dupree.jpg",   color: "from-red-700 to-red-900",      bio: "Xavier Dupree is a dedicated and passionate leader/coach with over 10 years of experience developing athletes and leading teams to success both on and off the court. Known for a strategic mind, a relentless work ethic, and a commitment to player growth, Coach Xavier Dupree has built a reputation for excellence, discipline, and team unity.\n\nCoach Dupree believes in building a strong foundation based on fundamentals, accountability, and a love for the game, and has mentored and worked with dozens of athletes who have gone on to compete at the collegiate and professional levels.\n\nOff the court, Coach Dupree is equally invested in academic achievement and personal development, often working closely with families and educators to ensure players thrive in all areas of life. A quote he lives by: \"Keeping the main thing the main thing.\"" },
  { id:"fa3", name: "Obed Quintero", title: "Freshman Head Coach",        email: "quintero_ohq@hotmail.com", imageUrl: "https://static.wixstatic.com/media/458ec6_2711d842affb4d1eb20bc9da6b476233~mv2.jpg/v1/fill/w_600,h_500,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/quintero.jpg", color: "from-indigo-600 to-indigo-900", bio: "Obed Quintero is the Hilhi boys head freshman basketball coach. Entering his 2nd year as head coach with 4 years of coaching experience overall, he continues his passion for developing players on and off the court.\n\nObed is a Hillsboro High alumnus, Class of 2012, and a proud dad of 2. When he's not coaching, you'll find him watching and attending sporting events, hiking, paddle boarding, working out, and spending time with family and friends." },
  { id:"fa4", name: "Mychael Samson",title: "Freshman Assistant Coach",   email: "mychael.samson@yahoo.com", imageUrl: "https://static.wixstatic.com/media/458ec6_a8f821bfb39e4436a382516b47a5c906~mv2.jpg/v1/fill/w_600,h_500,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/samson.jpg",  color: "from-emerald-700 to-teal-900", bio: "Mychael Samson is a proud alumnus of Hillsboro High School (Class of 2012), where he was a multi-sport athlete in football, basketball, and track. Now entering his second year on the Hillsboro staff, he is excited to continue contributing to the success of his alma mater." },
];

const GRADIENT_COLORS = [
  "from-blue-700 to-blue-900",
  "from-red-700 to-red-900",
  "from-indigo-600 to-indigo-900",
  "from-emerald-700 to-teal-900",
  "from-cyan-600 to-blue-700",
];

// ── Assistant coach card ──────────────────────────────────────────────────────
function AssistantCard({ coach, color, i }: { coach: Coach; color: string; i: number }) {
  const [expanded, setExpanded] = useState(false);
  const paras   = (coach.bio || "").split("\n\n").filter(Boolean);
  const preview = paras[0] || "";
  const rest    = paras.slice(1);

  return (
    <motion.div
      initial={{ opacity:0, y:40 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
      transition={{ duration:0.55, delay: i * 0.1 }}
      className="glass rounded-3xl border border-white/10 overflow-hidden flex flex-col">
      <div className="relative overflow-hidden aspect-[4/3]">
        {coach.imageUrl
          ? <img src={coach.imageUrl} alt={coach.name} className="w-full h-full object-cover object-top" />
          : <div className={`w-full h-full bg-gradient-to-br ${color} flex items-center justify-center`}><Users className="w-16 h-16 text-white/30" /></div>}
        <div className={`absolute inset-0 bg-gradient-to-t ${color} opacity-60`} />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="font-black text-white text-xl leading-tight drop-shadow-lg">{coach.name}</div>
          <div className="text-white/80 text-xs font-semibold uppercase tracking-widest mt-0.5">{coach.title}</div>
        </div>
      </div>
      <div className="p-6 flex flex-col gap-4 flex-1">
        {coach.email && (
          <a href={`mailto:${coach.email}`} className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-xs font-semibold transition-colors">
            <Mail className="w-3.5 h-3.5" /> {coach.email}
          </a>
        )}
        {preview && (
          <div className="text-gray-400 text-sm leading-relaxed">
            <p>{preview}</p>
            {rest.length > 0 && (
              <>
                {expanded && (
                  <div className="mt-3 space-y-3">
                    {rest.map((p, j) => <p key={j}>{p}</p>)}
                  </div>
                )}
                <button onClick={() => setExpanded(!expanded)}
                  className="mt-3 flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs font-bold transition-colors">
                  {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</> : <><ChevronDown className="w-3.5 h-3.5" /> Read more</>}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HighSchoolCoachesPage() {
  const [kemExpanded,    setKemExpanded]    = useState(false);
  const [intro,          setIntro]          = useState("Meet our experienced high school coaching staff.");
  const [featuredCoach,  setFeaturedCoach]  = useState<FeaturedCoach | null>(null);
  const [assistants,     setAssistants]     = useState<Coach[] | null>(null);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    fetch("/api/content")
      .then(r => r.json())
      .then((data: SiteContent) => {
        if (data?.hsCoaches?.intro) setIntro(data.hsCoaches.intro);

        const fc = data?.hsCoaches?.featuredCoach;
        if (fc?.name) setFeaturedCoach(fc);

        const coaches = data?.hsCoaches?.coaches ?? [];
        setAssistants(coaches.length > 0 ? coaches : null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Resolve which data to display
  const featured   = featuredCoach ?? FALLBACK_FEATURED;
  const staff      = assistants    ?? FALLBACK_ASSISTANTS;
  const bioParas   = featured.bioParas?.length > 0 ? featured.bioParas : FALLBACK_FEATURED.bioParas;
  const stats      = featured.stats?.length   > 0 ? featured.stats     : FALLBACK_FEATURED.stats;

  return (
    <main className="min-h-screen bg-[#080D1A]">
      <DynamicTitle pageKey="hsCoaches" fallback="HS Coaches | Hilhi Youth Basketball" />
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-[55vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_BG} alt="Hillsboro High School Basketball" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#080D1A]/70 via-[#080D1A]/55 to-[#080D1A]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.3),transparent_55%)]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 pt-32 pb-20 text-center w-full">
          <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-widest mb-5">
              <Award className="w-3.5 h-3.5" /> Hillsboro High School
            </div>
            <h1 className="text-5xl sm:text-7xl font-black text-white leading-none mb-4">
              High School <span className="text-gradient">Coaches</span>
            </h1>
            <p className="text-gray-300 text-xl max-w-2xl mx-auto">Dedication. Expertise. Passion.</p>
            <p className="text-gray-500 text-sm max-w-2xl mx-auto mt-3">{intro}</p>
          </motion.div>
        </div>
      </section>

      {/* Featured Coach */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <motion.div initial={{ opacity:0, y:40 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.7 }}
          className="glass rounded-3xl border border-white/10 overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Photo */}
            <div className="relative flex-shrink-0 lg:w-96">
              <div className="relative h-80 lg:h-full min-h-[400px]">
                <img src={featured.photo} alt={`Coach ${featured.name}`} className="w-full h-full object-cover object-top" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080D1A] via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#080D1A]/80" />
              </div>
              <div className="absolute bottom-6 left-6 right-6 lg:bottom-8 lg:left-8">
                <div className="inline-flex items-center gap-2 bg-blue-600/90 backdrop-blur border border-blue-400/30 rounded-2xl px-4 py-2">
                  <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                  <span className="text-white font-black text-sm">Varsity Head Coach</span>
                </div>
              </div>
            </div>
            {/* Bio */}
            <div className="flex-1 p-8 lg:p-12">
              <div className="mb-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-400 text-xs font-semibold uppercase tracking-widest">
                Featured Coach
              </div>
              <h2 className="text-4xl font-black text-white mt-2 mb-1">Coach {featured.name}</h2>
              <div className="text-blue-400 font-semibold text-sm mb-6">{featured.title}</div>
              <div className="space-y-4 text-gray-400 text-sm leading-relaxed">
                {bioParas.slice(0, 2).map((p, i) => <p key={i}>{p}</p>)}
                {kemExpanded && bioParas.slice(2).map((p, i) => <p key={i}>{p}</p>)}
                {bioParas.length > 2 && (
                  <button onClick={() => setKemExpanded(!kemExpanded)}
                    className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-bold text-sm transition-colors mt-2">
                    {kemExpanded
                      ? <><ChevronUp className="w-4 h-4" /> Show less</>
                      : <><ChevronDown className="w-4 h-4" /> Read full bio ({bioParas.length - 2} more sections)</>}
                  </button>
                )}
              </div>
              {stats.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mt-8">
                  {stats.map(({ value, label }) => (
                    <div key={label} className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-center">
                      <div className="text-blue-400 font-black text-lg leading-tight">{value}</div>
                      <div className="text-gray-500 text-[10px] font-medium uppercase tracking-wider mt-1">{label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Meet the Staff */}
      <section className="max-w-7xl mx-auto px-4 pb-24">
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.6 }}
          className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-gray-300 text-xs font-semibold uppercase tracking-widest mb-4">
            <Users className="w-3.5 h-3.5" /> Coaching Staff
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white">Meet the <span className="text-gradient">Team</span></h2>
          <p className="text-gray-500 mt-3 max-w-lg mx-auto">Each coach brings unique experience and an unwavering commitment to developing student-athletes in sport and in life.</p>
        </motion.div>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {staff.map((c, i) => (
              <AssistantCard
                key={c.id}
                coach={c}
                color={"color" in c ? (c as any).color : GRADIENT_COLORS[i % GRADIENT_COLORS.length]}
                i={i}
              />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.1),transparent_65%)]" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
          <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.6 }}>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">Ready to <span className="text-gradient">Join the Program?</span></h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
              Start your journey with Hilhi Youth Basketball and get coached by the same staff that leads Hillsboro High School.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/events" className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all hover:shadow-lg hover:shadow-blue-500/30 text-lg">View Events</a>
              <a href="/register" className="px-8 py-4 glass border border-white/20 hover:bg-white/10 text-white font-black rounded-2xl transition-all text-lg">Register Now</a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
