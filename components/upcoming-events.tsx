"use client";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Calendar, Users } from "lucide-react";

const EVENTS = [
  {
    tag:      "🏕️ Summer Camp",
    tagColor: "bg-orange-500",
    title:    "2026 Hilhi Youth Basketball Camp",
    date:     "June 22–25, 2026 · Registration Closed",
    location: "Hillsboro High School",
    grades:   "Grades K–8 · All Skill Levels",
    image:    "https://static.wixstatic.com/media/458ec6_206c387fbcb24627b9f32c25225bd319~mv2.jpg/v1/fill/w_800,h_500,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/5th-1.jpg",
    link:     "/camp-schedule",
    featured: true,
    cta:      "View Live Schedule",
  },
  {
    tag:      "🏆 Tournament",
    tagColor: "bg-blue-600",
    title:    "Hilhi Youth Basketball Tournament",
    date:     "Season Dates TBA",
    location: "Hillsboro, Oregon",
    grades:   "Boys & Girls · Multiple Divisions",
    image:    "https://static.wixstatic.com/media/458ec6_a76565cc5647487a85df67d400a9422d~mv2.jpg/v1/fill/w_800,h_500,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/photo3.jpg",
    link:     "/tournaments",
    featured: false,
    cta:      "View Tournaments",
  },
  {
    tag:      "📋 Tryouts",
    tagColor: "bg-purple-600",
    title:    "Youth Team Tryouts",
    date:     "Dates Posted Soon",
    location: "Hillsboro High School",
    grades:   "All Youth Levels",
    image:    "https://static.wixstatic.com/media/458ec6_07208ccf6e6e4aa8ac95a7a251f226a3~mv2.jpg/v1/fill/w_800,h_500,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/photo1.jpg",
    link:     "/tryout",
    featured: false,
    cta:      "Learn More",
  },
];

export function UpcomingEvents() {
  return (
    <section className="py-20 bg-[#080D1A]">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header row — HoopSource style */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-orange-500 text-xs font-black uppercase tracking-[0.2em] mb-2">What's Coming Up</p>
            <h2 className="text-4xl sm:text-5xl font-black text-white uppercase leading-tight">
              Upcoming Events
            </h2>
          </div>
          <a href="/events"
            className="hidden sm:flex items-center gap-2 text-sm font-bold text-orange-400 hover:text-orange-300 transition-colors border-b border-orange-500/40 hover:border-orange-400 pb-0.5 whitespace-nowrap">
            See All Events <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Event cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {EVENTS.map((ev, i) => (
            <motion.a
              key={ev.title}
              href={ev.link}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`group relative flex flex-col overflow-hidden rounded-lg border transition-all duration-300 ${
                ev.featured
                  ? "border-orange-500/50 shadow-xl shadow-orange-500/10 md:col-span-1"
                  : "border-white/10 hover:border-white/25"
              }`}
            >
              {/* Image */}
              <div className="relative h-52 overflow-hidden">
                <img
                  src={ev.image}
                  alt={ev.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                {/* Season tag */}
                <div className="absolute top-3 left-3">
                  <span className={`inline-block ${ev.tagColor} text-white text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-sm`}>
                    {ev.tag}
                  </span>
                </div>
                {ev.featured && (
                  <div className="absolute top-3 right-3">
                    <span className="inline-block bg-white text-orange-600 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-sm">
                      ⭐ Featured
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className={`flex flex-col flex-1 p-5 ${ev.featured ? "bg-gradient-to-br from-orange-950/60 to-[#0d1220]" : "bg-[#0d1220]"}`}>
                <h3 className="font-black text-white text-lg leading-snug mb-3">{ev.title}</h3>

                <div className="space-y-2 mb-4 flex-1">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Calendar className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                    <span>{ev.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <MapPin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                    <span>{ev.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Users className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                    <span>{ev.grades}</span>
                  </div>
                </div>

                <div className={`mt-auto inline-flex items-center gap-2 font-bold text-sm ${ev.featured ? "text-orange-400" : "text-white/60 group-hover:text-white"} transition-colors`}>
                  {ev.cta} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.a>
          ))}
        </div>

        {/* Mobile "See All" link */}
        <div className="mt-8 text-center sm:hidden">
          <a href="/events" className="inline-flex items-center gap-2 text-orange-400 font-bold text-sm">
            See All Events <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
