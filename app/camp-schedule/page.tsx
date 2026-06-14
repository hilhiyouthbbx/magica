"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Navbar }  from "@/components/navbar";
import { Footer }  from "@/components/footer";
import { Calendar, Clock, Trophy, Users, Megaphone, ChevronDown, ChevronUp } from "lucide-react";
import type { CampScheduleData, CampTeam, Division } from "@/lib/camp-schedule";

// ── Static 4-day schedule ─────────────────────────────────────────────────────
const DAYS = [
  {
    day: 1, label: "Day 1 — Fundamentals + Seeding Round 1", date: "Sunday, June 22, 2025",
    blocks: [
      { section: "Setup & Welcome", items: [
        { time: "7:30 – 8:00",  activity: "Setup – Coaches Meeting" },
        { time: "8:00 – 9:00",  activity: "Registration / Check-In" },
        { time: "9:00 – 9:15",  activity: "Camp Kickoff — Introductions & camp expectations" },
      ]},
      { section: "Morning Skills", items: [
        { time: "9:15 – 9:30",  activity: "Warm-Up — Dynamic stretching, sprints" },
        { time: "9:30 – 9:55",  activity: "Ball Handling — Right/Left hand, 2-ball drills" },
        { time: "9:55 – 10:15", activity: "Passing — Chest pass, push pass, bounce pass" },
        { time: "10:15 – 10:30",activity: "Layups — Right & left-hand layup lines" },
        { time: "10:30 – 10:40",activity: "Break / Water" },
      ]},
      { section: "Skill Stations", items: [
        { time: "10:40 – 11:20",activity: "4 Skill Stations (10 min rotation) — Hedge & Recover, V-cut, Box Out, Close Out" },
        { time: "11:20 – 11:40",activity: "Shooting Fundamentals — Pocket, follow-through, H-E-W" },
        { time: "11:40 – 12:10",activity: "3-on-3 Half Court Games" },
      ]},
      { section: "Lunch & Team Assignment", items: [
        { time: "12:10 – 12:45",activity: "Lunch + Team Assignment — Coaches assign NBA & College teams" },
      ]},
      { section: "Seeding Round 1 of 3", items: [
        { time: "12:45 – 1:00", activity: "Team Practice / Game Prep" },
        { time: "1:00 – 1:40",  activity: "Seeding Game Round 1 — 2 × 12-min halves, all 4 games simultaneously" },
        { time: "1:40 – 1:55",  activity: "Break / Water + Standings Update" },
        { time: "1:55 – 2:20",  activity: "Free Shooting / Skill Work" },
        { time: "2:20 – 2:30",  activity: "Center Court Wrap-Up — Results, tip of the day, preview Day 2" },
      ]},
    ],
  },
  {
    day: 2, label: "Day 2 — Team Naming + Team Play + Seeding Round 2", date: "Monday, June 23, 2025",
    blocks: [
      { section: "Morning Skills", items: [
        { time: "8:00 – 8:30",  activity: "Coaches Meeting / Court Setup — Review Day 1 standings" },
        { time: "8:30 – 8:35",  activity: "Team Naming (5 min) — NBA names (1st–4th) & College names (5th–8th)" },
        { time: "8:35 – 8:50",  activity: "Warm-Up — Dynamic stretch + sprints" },
        { time: "8:50 – 9:15",  activity: "Ball Handling Review — Crossover, In-&-Out, Behind the back" },
        { time: "9:15 – 9:40",  activity: "Shooting Series — Form shots, mid-range, free-throw pairs" },
        { time: "9:40 – 10:00", activity: "Footwork & Moves — Jab step, drive, jump stop" },
        { time: "10:00 – 10:15",activity: "Break / Water" },
      ]},
      { section: "Team Concepts", items: [
        { time: "10:15 – 10:45",activity: "4 Skill Stations — Pick-and-Roll, defensive rotations, 1-on-1, finishing" },
        { time: "10:45 – 11:15",activity: "Team Offense Intro — Motion offense, spacing" },
        { time: "11:15 – 11:45",activity: "5-on-5 Scrimmage (refereed)" },
      ]},
      { section: "Lunch", items: [
        { time: "11:45 – 12:20",activity: "Lunch — Review Round 1 standings, preview today's matchups" },
      ]},
      { section: "Seeding Round 2 of 3", items: [
        { time: "12:20 – 12:35",activity: "Team Practice / Game Prep" },
        { time: "12:35 – 1:15", activity: "Seeding Game Round 2 — New matchups, all 4 games simultaneously" },
        { time: "1:15 – 1:30",  activity: "Break / Water + Standings Update" },
        { time: "1:30 – 2:00",  activity: "Fast Break Drills — 2-on-1, 3-on-2, transition defense" },
        { time: "2:00 – 2:25",  activity: "Play-In / Skill Game" },
        { time: "2:25 – 2:30",  activity: "Center Court Wrap-Up — Round 2 standings, tip of the day" },
      ]},
    ],
  },
  {
    day: 3, label: "Day 3 — Advanced Skills + Seeding Round 3 (Final)", date: "Tuesday, June 24, 2025",
    blocks: [
      { section: "Morning Skills", items: [
        { time: "8:00 – 8:30",  activity: "Coaches Meeting — Review standings, plan final seeding round" },
        { time: "8:30 – 8:45",  activity: "Warm-Up — Dynamic stretch + partner defensive slides" },
        { time: "8:45 – 9:10",  activity: "Advanced Ball Handling — Combo moves, speed dribble, Figure-8" },
        { time: "9:10 – 9:35",  activity: "Shooting — Game-speed reps, catch-and-shoot, pull-up, corner 3s" },
        { time: "9:35 – 10:00", activity: "Post Moves — Drop step, up & under, power layup" },
        { time: "10:00 – 10:15",activity: "Break / Water" },
      ]},
      { section: "Team Defense & Competitions", items: [
        { time: "10:15 – 10:45",activity: "Defensive Concepts — Ball pressure, deny wing, help & recover" },
        { time: "10:45 – 11:15",activity: "Defense Competition — Best stop = 1 point for team" },
        { time: "11:15 – 11:45",activity: "Free Shooting / Team Walkthrough" },
      ]},
      { section: "Lunch", items: [
        { time: "11:45 – 12:20",activity: "Lunch — Players nominate individual event competitors" },
      ]},
      { section: "Seeding Round 3 of 3 (Final)", items: [
        { time: "12:20 – 12:35",activity: "Team Practice / Final Game Prep" },
        { time: "12:35 – 1:15", activity: "Seeding Game Round 3 (Final) — FINAL standings calculated" },
        { time: "1:15 – 1:30",  activity: "Break / Water + Final Standings Calculated" },
        { time: "1:30 – 1:55",  activity: "Championship Bracket Reveal — Seeds 1–4 announced" },
        { time: "1:55 – 2:20",  activity: "Championship Day Prep + Preview" },
        { time: "2:20 – 2:30",  activity: "Center Court Wrap-Up — Bracket announced, tip: compete with heart" },
      ]},
    ],
  },
  {
    day: 4, label: "Day 4 — 🏆 Championship Day", date: "Wednesday, June 25, 2025",
    blocks: [
      { section: "Setup & Warmup", items: [
        { time: "7:30 – 8:00",  activity: "Early Setup — Bracket posted, trophies staged, event stations ready" },
        { time: "8:00 – 8:20",  activity: "All-Camp Championship Warmup — Full camp at center court" },
        { time: "8:20 – 8:30",  activity: "Lineup Cards & Team Huddles" },
      ]},
      { section: "Individual Skill Contests", items: [
        { time: "8:30 – 9:00",  activity: "Free Throw Contest — Best of 10, NBA on Court A, College on Court C" },
        { time: "9:00 – 9:35",  activity: "3-Point Shooting Contest — 5 balls from 3 spots, top scores advance" },
        { time: "9:35 – 10:20", activity: "1-on-1 Challenge — Single-elimination bracket, first to 3 baskets" },
        { time: "10:20 – 10:30",activity: "Break / Water" },
        { time: "10:30 – 11:10",activity: "3-on-3 Tournament — Round-robin, first to 7" },
        { time: "11:10 – 11:30",activity: "3-Point Contest Finals — Top scorers compete for championship" },
      ]},
      { section: "Championship Lunch", items: [
        { time: "11:55 – 12:35",activity: "Lunch + Individual Results Announced — Winners recognized at center court" },
      ]},
      { section: "🏆 Championship Games", items: [
        { time: "12:35 – 12:45",activity: "Championship Game Intro — All campers gather, player walk-outs" },
        { time: "12:45 – 1:25", activity: "Semifinal Games — #1 vs #4 and #2 vs #3 in both divisions simultaneously" },
        { time: "1:25 – 1:35",  activity: "Break + Winners Advance / Bracket Updated" },
        { time: "1:35 – 2:15",  activity: "Championship Game + Consolation Game (simultaneously, both divisions)" },
      ]},
      { section: "Awards Ceremony", items: [
        { time: "2:15 – 2:50",  activity: "Awards & Closing Ceremony — Team trophies, individual awards, MVP" },
        { time: "2:50 – 3:00",  activity: "Camp Closing — Group photo, final words, camp dismissed" },
      ]},
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function standingsByDivision(teams: CampTeam[], div: Division) {
  return [...teams.filter(t => t.division === div)].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    const pdA = a.pointsFor - a.pointsAgainst;
    const pdB = b.pointsFor - b.pointsAgainst;
    return pdB - pdA;
  });
}

function Seed({ n }: { n: number }) {
  const colors = ["bg-yellow-500", "bg-gray-400", "bg-amber-700", "bg-gray-600"];
  return <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black text-white ${colors[n-1] ?? "bg-gray-700"}`}>{n}</span>;
}

export default function CampSchedulePage() {
  const [data,       setData]       = useState<CampScheduleData | null>(null);
  const [openDay,    setOpenDay]    = useState<number | null>(null);
  const [activeTab,  setActiveTab]  = useState<"schedule"|"teams"|"standings"|"bracket">("schedule");

  useEffect(() => {
    fetch("/api/camp-schedule")
      .then(r => r.json())
      .then(d => {
        setData(d);
        if (d.currentDay > 0) setOpenDay(d.currentDay);
        else setOpenDay(1);
      })
      .catch(() => {});
    // Refresh every 60s for live updates
    const iv = setInterval(() => {
      fetch("/api/camp-schedule").then(r => r.json()).then(setData).catch(() => {});
    }, 60000);
    return () => clearInterval(iv);
  }, []);

  if (!data) return (
    <div className="min-h-screen bg-[#080D1A] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data.active) return (
    <main className="min-h-screen bg-[#080D1A] text-white flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-6">🏀</div>
          <h1 className="text-4xl font-black text-white mb-3">Camp Schedule</h1>
          <p className="text-gray-400 text-lg mb-2">Coming Soon</p>
          <p className="text-gray-600 text-sm">The camp schedule will be posted here once the camp begins.</p>
          <a href="/events" className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all text-sm">
            View Camp Events
          </a>
        </div>
      </div>
      <Footer />
    </main>
  );

  const nbaDivision     = standingsByDivision(data.teams, "NBA");
  const collegeDivision = standingsByDivision(data.teams, "College");

  return (
    <main className="min-h-screen bg-[#080D1A] text-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-12 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-black uppercase tracking-widest mb-4">
              🏀 Live Camp Hub
            </span>
            <h1 className="text-4xl sm:text-6xl font-black text-white mb-3">
              {data.campName} <span className="text-orange-400">{data.campYear}</span>
            </h1>
            <p className="text-gray-400 text-lg">June 22–25, 2025 · Follow the action in real time</p>
            {data.currentDay > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 font-bold text-sm">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Day {data.currentDay} is Live!
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Announcement Banner */}
      {data.announcement && (
        <div className="max-w-5xl mx-auto px-4 mb-6">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/30">
            <Megaphone className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-yellow-200 font-semibold text-sm whitespace-pre-wrap">{data.announcement}</p>
          </div>
        </div>
      )}

      {/* Tab Nav */}
      <div className="max-w-5xl mx-auto px-4 mb-6">
        <div className="flex gap-1 p-1 glass rounded-2xl border border-white/10">
          {(["schedule","teams","standings","bracket"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all capitalize ${activeTab === tab ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "text-gray-400 hover:text-white"}`}>
              {tab === "schedule" ? "📅 Schedule" : tab === "teams" ? "👥 Teams" : tab === "standings" ? "📊 Standings" : "🏆 Bracket"}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-24 space-y-4">

        {/* ── SCHEDULE TAB ── */}
        {activeTab === "schedule" && DAYS.map(d => (
          <div key={d.day} className={`glass rounded-2xl border overflow-hidden transition-all ${d.day === data.currentDay ? "border-orange-500/40" : "border-white/10"}`}>
            <button onClick={() => setOpenDay(openDay === d.day ? null : d.day)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3 text-left">
                {d.day === data.currentDay && <span className="w-2.5 h-2.5 bg-orange-400 rounded-full animate-pulse flex-shrink-0" />}
                <div>
                  <div className="text-white font-black text-base">{d.label}</div>
                  <div className="text-gray-500 text-xs mt-0.5 flex items-center gap-1"><Calendar className="w-3 h-3" />{d.date}</div>
                </div>
              </div>
              {openDay === d.day ? <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />}
            </button>

            {openDay === d.day && (
              <div className="border-t border-white/10 px-5 py-4 space-y-5">
                {d.blocks.map(block => (
                  <div key={block.section}>
                    <div className="text-xs font-black text-orange-400 uppercase tracking-widest mb-2">{block.section}</div>
                    <div className="space-y-1">
                      {block.items.map((item, i) => (
                        <div key={i} className="flex gap-4 py-1.5 border-b border-white/5 last:border-0">
                          <div className="flex-shrink-0 w-28 flex items-center gap-1 text-blue-400 text-xs font-bold">
                            <Clock className="w-3 h-3 flex-shrink-0" />{item.time}
                          </div>
                          <div className="text-gray-300 text-sm">{item.activity}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* ── TEAMS TAB ── */}
        {activeTab === "teams" && (
          data.teams.length === 0 ? (
            <div className="glass rounded-2xl border border-white/10 p-12 text-center">
              <Users className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400 font-bold">Teams haven&apos;t been announced yet.</p>
              <p className="text-gray-600 text-sm mt-1">Check back on Day 1 after team assignments!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {(["NBA","College"] as Division[]).map(div => {
                const divTeams = data.teams.filter(t => t.division === div);
                if (!divTeams.length) return null;
                return (
                  <div key={div}>
                    <h3 className="text-white font-black text-lg mb-3 flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${div === "NBA" ? "bg-orange-500/20 text-orange-400" : "bg-blue-500/20 text-blue-400"}`}>{div} Division</span>
                      <span className="text-gray-500 text-sm font-normal">{div === "NBA" ? "1st – 4th Grade" : "5th – 8th Grade"}</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {divTeams.map(team => (
                        <div key={team.id} className="glass rounded-2xl border border-white/10 p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="text-white font-black text-xl">{team.name || "TBA"}</div>
                              {team.coach && <div className="text-gray-500 text-xs mt-0.5">Coach: {team.coach}</div>}
                            </div>
                            <div className="text-right">
                              <div className="text-white font-black text-lg">{team.wins}–{team.losses}</div>
                              <div className="text-gray-500 text-xs">W–L</div>
                            </div>
                          </div>
                          {team.players.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {team.players.map((p, i) => (
                                <span key={i} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-gray-300 text-xs font-medium">{p}</span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-600 text-xs italic">Roster TBA</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ── STANDINGS TAB ── */}
        {activeTab === "standings" && (
          data.teams.length === 0 ? (
            <div className="glass rounded-2xl border border-white/10 p-12 text-center">
              <Trophy className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400 font-bold">Standings will be posted after games begin.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {([["NBA","1st – 4th Grade"], ["College","5th – 8th Grade"]] as [Division, string][]).map(([div, label]) => {
                const sorted = standingsByDivision(data.teams, div);
                if (!sorted.length) return null;
                return (
                  <div key={div} className="glass rounded-2xl border border-white/10 overflow-hidden">
                    <div className={`px-5 py-3 flex items-center gap-2 border-b border-white/10 ${div === "NBA" ? "bg-orange-500/10" : "bg-blue-500/10"}`}>
                      <span className={`font-black text-base ${div === "NBA" ? "text-orange-400" : "text-blue-400"}`}>{div} Division</span>
                      <span className="text-gray-500 text-sm">{label}</span>
                    </div>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/5">
                          <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Seed</th>
                          <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Team</th>
                          <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">W</th>
                          <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">L</th>
                          <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">PF</th>
                          <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">PA</th>
                          <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">PD</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sorted.map((team, i) => (
                          <tr key={team.id} className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                            <td className="px-5 py-3"><Seed n={i+1} /></td>
                            <td className="px-5 py-3 text-white font-bold text-sm">{team.name}</td>
                            <td className="px-3 py-3 text-center text-green-400 font-black text-sm">{team.wins}</td>
                            <td className="px-3 py-3 text-center text-red-400 font-black text-sm">{team.losses}</td>
                            <td className="px-3 py-3 text-center text-gray-400 text-sm">{team.pointsFor}</td>
                            <td className="px-3 py-3 text-center text-gray-400 text-sm">{team.pointsAgainst}</td>
                            <td className={`px-3 py-3 text-center font-bold text-sm ${(team.pointsFor - team.pointsAgainst) >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {team.pointsFor - team.pointsAgainst > 0 ? "+" : ""}{team.pointsFor - team.pointsAgainst}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="px-5 py-2 text-gray-600 text-xs border-t border-white/5">
                      W = Wins · L = Losses · PF = Points For · PA = Points Against · PD = Point Differential
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ── BRACKET TAB ── */}
        {activeTab === "bracket" && (
          data.bracketGames.length === 0 ? (
            <div className="glass rounded-2xl border border-white/10 p-12 text-center">
              <Trophy className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400 font-bold">Championship bracket will be posted after Day 3.</p>
              <p className="text-gray-600 text-sm mt-1">Final seeds are determined after all 3 seeding rounds.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {(["NBA","College"] as Division[]).map(div => {
                const semis  = data.bracketGames.filter(g => g.division === div && g.round === "semi");
                const finals = data.bracketGames.filter(g => g.division === div && g.round === "final");
                const thirds = data.bracketGames.filter(g => g.division === div && g.round === "3rd");
                const getTeam = (id: string) => data.teams.find(t => t.id === id);
                return (
                  <div key={div} className="glass rounded-2xl border border-white/10 overflow-hidden">
                    <div className={`px-5 py-3 border-b border-white/10 ${div === "NBA" ? "bg-orange-500/10" : "bg-blue-500/10"}`}>
                      <span className={`font-black text-base ${div === "NBA" ? "text-orange-400" : "text-blue-400"}`}>{div} Division Championship</span>
                    </div>
                    <div className="p-5 space-y-4">
                      {semis.length > 0 && (
                        <div>
                          <div className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Semifinals</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {semis.map(g => {
                              const t1 = getTeam(g.team1Id);
                              const t2 = getTeam(g.team2Id);
                              return (
                                <div key={g.id} className="bg-white/5 rounded-xl border border-white/10 p-3">
                                  <div className={`text-xs font-bold mb-2 ${g.status === "live" ? "text-green-400" : g.status === "final" ? "text-gray-500" : "text-blue-400"}`}>
                                    {g.status === "live" ? "🔴 LIVE" : g.status === "final" ? "Final" : "Upcoming"} · Court {g.court}
                                  </div>
                                  {[{team: t1, score: g.score1}, {team: t2, score: g.score2}].map(({team, score}, idx) => (
                                    <div key={idx} className="flex items-center justify-between py-1">
                                      <span className="text-white font-bold text-sm">{team?.name ?? "TBA"}</span>
                                      {score !== null && <span className="text-white font-black text-lg">{score}</span>}
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {finals.length > 0 && (
                        <div>
                          <div className="text-xs font-black text-yellow-400 uppercase tracking-widest mb-2">🏆 Championship Game</div>
                          {finals.map(g => {
                            const t1 = getTeam(g.team1Id);
                            const t2 = getTeam(g.team2Id);
                            return (
                              <div key={g.id} className="bg-yellow-500/10 rounded-xl border border-yellow-500/30 p-4">
                                <div className={`text-xs font-bold mb-3 ${g.status === "live" ? "text-green-400" : g.status === "final" ? "text-gray-500" : "text-yellow-400"}`}>
                                  {g.status === "live" ? "🔴 LIVE" : g.status === "final" ? "Final" : "Upcoming"} · Court {g.court}
                                </div>
                                {[{team: t1, score: g.score1}, {team: t2, score: g.score2}].map(({team, score}, idx) => (
                                  <div key={idx} className="flex items-center justify-between py-1.5">
                                    <span className="text-white font-black text-lg">{team?.name ?? "TBA"}</span>
                                    {score !== null && <span className="text-yellow-400 font-black text-2xl">{score}</span>}
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {thirds.length > 0 && (
                        <div>
                          <div className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">3rd Place Game</div>
                          {thirds.map(g => {
                            const t1 = getTeam(g.team1Id);
                            const t2 = getTeam(g.team2Id);
                            return (
                              <div key={g.id} className="bg-white/5 rounded-xl border border-white/10 p-3">
                                {[{team: t1, score: g.score1}, {team: t2, score: g.score2}].map(({team, score}, idx) => (
                                  <div key={idx} className="flex items-center justify-between py-1">
                                    <span className="text-white font-bold text-sm">{team?.name ?? "TBA"}</span>
                                    {score !== null && <span className="text-white font-black text-lg">{score}</span>}
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
      <Footer />
    </main>
  );
}
