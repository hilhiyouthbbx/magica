"use client";

import { useState, useCallback } from "react";
import type { Tournament, Division, Pool, PoolGame, BracketGame, Team } from "@/lib/tourney-types";
import { getAllTournaments, saveTournament, deleteTournament as deleteT } from "@/lib/tourney-storage";
import { generateDivisionSchedule } from "@/lib/tourney-scheduler";
import { calculateStandings } from "@/lib/tourney-standings";
import { generateBracket, advanceBracketWinner } from "@/lib/tourney-bracket";
import { Plus, Trash2, ArrowLeft, Trophy, Calendar, MapPin, Users, Clock } from "lucide-react";

// ── Helpers ─────────────────────────────────────────────────────────────────

function Btn({ children, onClick, className = "", disabled = false, type: t = "button" }: {
  children: React.ReactNode; onClick?: () => void; className?: string;
  disabled?: boolean; type?: "button" | "submit";
}) {
  return (
    <button type={t} onClick={onClick} disabled={disabled}
      className={`px-3 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${className}`}>
      {children}
    </button>
  );
}

function IF({ label, value, onChange, placeholder = "", type = "text" }: {
  label: string; value: string | number; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500/60 placeholder:text-gray-600" />
    </div>
  );
}

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2,5)}`;

const S_COLOR: Record<Tournament["status"], string> = {
  pool_play: "bg-blue-500/20 text-blue-300",
  bracket:   "bg-orange-500/20 text-orange-300",
  complete:  "bg-green-500/20 text-green-300",
};
const S_LABEL: Record<Tournament["status"], string> = {
  pool_play: "Pool Play", bracket: "Bracket", complete: "Complete",
};

function getTeamName(tournament: Tournament, teamId: string | null | undefined): string {
  if (!teamId) return "TBD";
  return tournament.divisions.flatMap(d => d.teams).find(t => t.id === teamId)?.name ?? "TBD";
}

// ── CREATE WIZARD ─────────────────────────────────────────────────────────

type WizDiv = { name: string; pools: number; teams: string[] };
interface WizState {
  name: string; date: string; venue: string;
  courts: number; gameDuration: number; breakBetweenGames: number; startTime: string;
  divisions: WizDiv[];
}

function snakePools(teams: string[], poolCount: number): string[][] {
  const filled = teams.filter(t => t.trim());
  const pools: string[][] = Array.from({ length: poolCount }, () => []);
  filled.forEach((team, i) => {
    const row = Math.floor(i / poolCount);
    const col = i % poolCount;
    pools[row % 2 === 0 ? col : poolCount - 1 - col].push(team);
  });
  return pools;
}

function CreateWizard({ onCreated, onClose }: { onCreated: (t: Tournament) => void; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [w, setW] = useState<WizState>({
    name: "", date: "", venue: "", courts: 2,
    gameDuration: 24, breakBetweenGames: 6, startTime: "08:00",
    divisions: [{ name: "", pools: 2, teams: ["","","","","","","",""] }],
  });

  function generate() {
    const tid = makeId();
    const now = new Date().toISOString();
    const divisions: Division[] = w.divisions.map(d => {
      const divId = makeId();
      const poolTeamNames = snakePools(d.teams, d.pools);
      const allTeams: Team[] = poolTeamNames.flatMap((names, pi) =>
        names.map((name, ti) => ({ id: makeId(), name, coachName: "" }))
      );
      // re-map so each pool knows its teamIds
      let teamIdx = 0;
      const pools: Pool[] = poolTeamNames.map((names, pi) => {
        const poolId = makeId();
        const teamIds = names.map(() => allTeams[teamIdx++].id);
        return { id: poolId, name: `Pool ${String.fromCharCode(65+pi)}`, teamIds };
      });
      const games: PoolGame[] = generateDivisionSchedule(
        pools, divId, w.courts, w.gameDuration, w.breakBetweenGames, w.startTime
      );
      return { id: divId, name: d.name, teams: allTeams, pools, games, bracket: [], bracketGenerated: false };
    });

    const t: Tournament = {
      id: tid, name: w.name, date: w.date, venue: w.venue,
      courts: w.courts, gameDuration: w.gameDuration, breakBetweenGames: w.breakBetweenGames, startTime: w.startTime,
      status: "pool_play", divisions, createdAt: now, updatedAt: now,
    };
    saveTournament(t);
    onCreated(t);
  }

  const canNext1 = w.name.trim().length > 0;
  const canNext2 = w.divisions.every(d => d.name.trim() && d.teams.filter(t => t.trim()).length >= 2);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="glass border border-white/10 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h2 className="text-white font-bold text-lg">New Tournament</h2>
            <p className="text-gray-500 text-xs mt-0.5">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none px-1">✕</button>
        </div>

        <div className="p-5 space-y-4">
          {step === 1 && (
            <>
              <IF label="Tournament Name *" value={w.name} onChange={v => setW(p => ({...p, name:v}))} placeholder="Hilhi Spring Invitational" />
              <IF label="Date" value={w.date} onChange={v => setW(p => ({...p, date:v}))} placeholder="June 22–25, 2026" />
              <IF label="Venue" value={w.venue} onChange={v => setW(p => ({...p, venue:v}))} placeholder="Hillsboro High School" />
              <div className="grid grid-cols-2 gap-3">
                <IF label="Courts" type="number" value={w.courts} onChange={v => setW(p => ({...p, courts:+v}))} />
                <IF label="Game Duration (min)" type="number" value={w.gameDuration} onChange={v => setW(p => ({...p, gameDuration:+v}))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <IF label="Break Between Games (min)" type="number" value={w.breakBetweenGames} onChange={v => setW(p => ({...p, breakBetweenGames:+v}))} />
                <IF label="Start Time" type="time" value={w.startTime} onChange={v => setW(p => ({...p, startTime:v}))} />
              </div>
            </>
          )}

          {step === 2 && (
            <div className="space-y-5">
              {w.divisions.map((div, di) => (
                <div key={di} className="border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <IF label="Division Name *" value={div.name} onChange={v => setW(p => {
                        const d = [...p.divisions]; d[di] = {...d[di], name:v}; return {...p, divisions:d};
                      })} placeholder="5th Grade Boys" />
                    </div>
                    <div className="w-28">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Pools</label>
                      <select value={div.pools} onChange={e => setW(p => {
                        const d = [...p.divisions]; d[di] = {...d[di], pools:+e.target.value}; return {...p, divisions:d};
                      })} className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none">
                        {[1,2,3,4].map(n => <option key={n} value={n} className="bg-slate-900">{n} Pool{n>1?"s":""}</option>)}
                      </select>
                    </div>
                    {w.divisions.length > 1 && (
                      <button onClick={() => setW(p => ({...p, divisions:p.divisions.filter((_,i)=>i!==di)}))} className="mt-4 text-gray-600 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Team Names</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {div.teams.map((tm, ti) => (
                        <input key={ti} value={tm} placeholder={`Team ${ti+1}`}
                          onChange={e => setW(p => {
                            const d = [...p.divisions]; const teams = [...d[di].teams];
                            teams[ti] = e.target.value;
                            if (ti === teams.length - 1 && e.target.value.trim()) teams.push("");
                            d[di] = {...d[di], teams}; return {...p, divisions:d};
                          })}
                          className="bg-white/5 border border-white/10 text-white text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-blue-500/60 placeholder:text-gray-700" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => setW(p => ({...p, divisions:[...p.divisions,{name:"",pools:2,teams:["","","","","","","",""]}]}))}
                className="w-full py-2.5 border border-dashed border-white/20 hover:border-blue-500/40 text-gray-500 hover:text-blue-400 rounded-xl text-sm font-bold transition-colors">
                + Add Division
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3 text-sm">
              <div className="glass border border-white/10 rounded-xl p-4 space-y-2">
                <p className="text-white font-bold text-base">{w.name || "—"}</p>
                {w.date  && <p className="text-gray-400 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/>{w.date}</p>}
                {w.venue && <p className="text-gray-400 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/>{w.venue}</p>}
                <p className="text-gray-400">{w.courts} courts · {w.gameDuration}min games · starts {w.startTime}</p>
              </div>
              {w.divisions.map((d, di) => {
                const filled = d.teams.filter(t => t.trim());
                return (
                  <div key={di} className="glass border border-white/10 rounded-xl p-4">
                    <p className="text-white font-bold">{d.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{filled.length} teams · {d.pools} pool{d.pools>1?"s":""}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {filled.map((tm,ti) => <span key={ti} className="bg-white/5 border border-white/10 text-gray-300 text-xs px-2 py-0.5 rounded-md">{tm}</span>)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-5 border-t border-white/10">
          <Btn onClick={() => step > 1 ? setStep(s=>s-1) : onClose()} className="bg-white/5 hover:bg-white/10 text-gray-400">
            {step > 1 ? "← Back" : "Cancel"}
          </Btn>
          <div className="flex gap-1.5">
            {[1,2,3].map(n => <div key={n} className={`w-2 h-2 rounded-full ${step===n?"bg-blue-500":"bg-white/15"}`} />)}
          </div>
          {step < 3
            ? <Btn onClick={() => setStep(s=>s+1)} disabled={step===1?!canNext1:!canNext2} className="bg-blue-600 hover:bg-blue-500 text-white">Next →</Btn>
            : <Btn onClick={generate} className="bg-green-600 hover:bg-green-500 text-white">🚀 Generate Schedule</Btn>
          }
        </div>
      </div>
    </div>
  );
}

// ── SCORE DIALOG ─────────────────────────────────────────────────────────────

function ScoreDialog({ game, teamA, teamB, onSave, onClose }: {
  game: PoolGame | BracketGame; teamA: string; teamB: string;
  onSave: (s1: number, s2: number) => void; onClose: () => void;
}) {
  const [s1, setS1] = useState(String(game.score1 ?? ""));
  const [s2, setS2] = useState(String(game.score2 ?? ""));
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="glass border border-white/10 rounded-2xl p-6 w-full max-w-sm">
        <h3 className="text-white font-bold mb-4 text-center">Enter Score</h3>
        <div className="grid grid-cols-3 items-center gap-3 mb-6">
          <div className="text-center">
            <div className="text-gray-300 text-xs mb-2 font-bold truncate">{teamA}</div>
            <input type="number" min="0" value={s1} onChange={e=>setS1(e.target.value)}
              className="w-full bg-white/5 border border-white/20 text-white text-center text-2xl font-black py-3 rounded-xl focus:outline-none focus:border-blue-500/60" />
          </div>
          <div className="text-center text-gray-600 font-bold">vs</div>
          <div className="text-center">
            <div className="text-gray-300 text-xs mb-2 font-bold truncate">{teamB}</div>
            <input type="number" min="0" value={s2} onChange={e=>setS2(e.target.value)}
              className="w-full bg-white/5 border border-white/20 text-white text-center text-2xl font-black py-3 rounded-xl focus:outline-none focus:border-blue-500/60" />
          </div>
        </div>
        <div className="flex gap-3">
          <Btn onClick={onClose} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400">Cancel</Btn>
          <Btn onClick={() => onSave(parseInt(s1)||0, parseInt(s2)||0)}
            disabled={s1===""||s2===""} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white">
            Save Score
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ── SCHEDULE VIEW ────────────────────────────────────────────────────────────

function ScheduleView({ tournament, onUpdate }: { tournament: Tournament; onUpdate: (t: Tournament) => void }) {
  const [scoring, setScoring] = useState<{ divIdx: number; gameIdx: number } | null>(null);

  const allGames = tournament.divisions.flatMap((d, di) =>
    d.games.map((g, gi) => ({ game: g, divIdx: di, gameIdx: gi, divName: d.name }))
  );
  const slots = [...new Set(allGames.map(g => g.game.time))].sort();

  function poolName(tournament: Tournament, divIdx: number, poolId: string) {
    return tournament.divisions[divIdx].pools.find(p => p.id === poolId)?.name ?? "";
  }

  function handleScore(s1: number, s2: number) {
    if (!scoring) return;
    const t = JSON.parse(JSON.stringify(tournament)) as Tournament;
    const game = t.divisions[scoring.divIdx].games[scoring.gameIdx];
    game.score1 = s1; game.score2 = s2; game.status = "completed";
    t.updatedAt = new Date().toISOString();
    onUpdate(t); setScoring(null);
  }

  if (allGames.length === 0) return <div className="text-center py-12 text-gray-500">No games scheduled.</div>;

  return (
    <div className="space-y-6">
      {slots.map(slot => (
        <div key={slot}>
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-4 h-4 text-gray-600" />
            <span className="text-gray-400 font-bold text-sm">{slot}</span>
            <div className="flex-1 border-t border-white/5" />
          </div>
          <div className="grid gap-2">
            {allGames.filter(g => g.game.time === slot).map(({ game, divIdx, gameIdx, divName }) => {
              const t1 = getTeamName(tournament, game.team1Id);
              const t2 = getTeamName(tournament, game.team2Id);
              const done = game.status === "completed";
              const pn = poolName(tournament, divIdx, game.poolId);
              return (
                <div key={game.id} className="glass border border-white/10 hover:border-white/20 rounded-xl p-3.5 flex items-center gap-4 transition-colors">
                  <div className="text-xs text-gray-600 font-bold w-12 shrink-0 text-center">Ct {game.court}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                      <span>{divName}</span>{pn && <><span>·</span><span>{pn}</span></>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm truncate ${done && game.score1! > game.score2! ? "text-white" : "text-gray-300"}`}>{t1}</span>
                      {done
                        ? <span className="text-gray-500 font-black text-xs bg-white/5 px-2 py-0.5 rounded-md shrink-0">{game.score1} – {game.score2}</span>
                        : <span className="text-gray-700 text-xs shrink-0">vs</span>
                      }
                      <span className={`font-bold text-sm truncate ${done && game.score2! > game.score1! ? "text-white" : "text-gray-300"}`}>{t2}</span>
                    </div>
                  </div>
                  <button onClick={() => setScoring({ divIdx, gameIdx })}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all shrink-0 ${done ? "bg-white/5 text-gray-500 hover:text-blue-400" : "bg-blue-600/20 text-blue-400 hover:bg-blue-600/30"}`}>
                    {done ? "Edit" : "Score →"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {scoring && (() => {
        const g = tournament.divisions[scoring.divIdx].games[scoring.gameIdx];
        return <ScoreDialog game={g} teamA={getTeamName(tournament, g.team1Id)} teamB={getTeamName(tournament, g.team2Id)}
          onSave={handleScore} onClose={() => setScoring(null)} />;
      })()}
    </div>
  );
}

// ── STANDINGS VIEW ────────────────────────────────────────────────────────────

function StandingsView({ tournament }: { tournament: Tournament }) {
  return (
    <div className="space-y-6">
      {tournament.divisions.map(div => (
        <div key={div.id}>
          <h3 className="text-white font-bold mb-3">{div.name}</h3>
          <div className="space-y-4">
            {div.pools.map(pool => {
              const standings = calculateStandings(
                pool.teamIds, div.teams, div.games.filter(g => g.poolId === pool.id)
              );
              return (
                <div key={pool.id} className="glass border border-white/10 rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-white/3 border-b border-white/10">
                    <span className="text-gray-400 font-bold text-sm">{pool.name}</span>
                    <span className="text-gray-600 text-xs ml-2">· {pool.teamIds.length} teams</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="text-gray-600 text-xs">
                        <th className="text-left px-4 py-2 font-bold">Team</th>
                        <th className="px-3 py-2 text-center font-bold">W</th>
                        <th className="px-3 py-2 text-center font-bold">L</th>
                        <th className="px-3 py-2 text-center font-bold">PF</th>
                        <th className="px-3 py-2 text-center font-bold">PA</th>
                        <th className="px-3 py-2 text-center font-bold">+/-</th>
                      </tr></thead>
                      <tbody>
                        {standings.map((s, idx) => (
                          <tr key={s.teamId} className={`border-t border-white/5 ${idx===0?"bg-yellow-500/5":""}`}>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600 text-xs w-4 font-bold">{idx+1}</span>
                                <span className={`font-bold ${idx===0?"text-yellow-300":"text-white"}`}>{s.teamName}</span>
                                {idx===0 && <Trophy className="w-3 h-3 text-yellow-500" />}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-center text-green-400 font-bold">{s.wins}</td>
                            <td className="px-3 py-2.5 text-center text-red-400 font-bold">{s.losses}</td>
                            <td className="px-3 py-2.5 text-center text-gray-400">{s.pf}</td>
                            <td className="px-3 py-2.5 text-center text-gray-400">{s.pa}</td>
                            <td className={`px-3 py-2.5 text-center font-bold ${s.pd>=0?"text-green-400":"text-red-400"}`}>
                              {s.pd>0?"+":""}{s.pd}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── BRACKET VIEW ─────────────────────────────────────────────────────────────

function BracketView({ tournament, onUpdate }: { tournament: Tournament; onUpdate: (t: Tournament) => void }) {
  const [scoring, setScoring] = useState<{ divIdx: number; gameIdx: number } | null>(null);

  function poolPlayDone(div: Division) {
    return div.games.length > 0 && div.games.every(g => g.status === "completed");
  }

  function handleGenerateBracket(divIdx: number) {
    const t = JSON.parse(JSON.stringify(tournament)) as Tournament;
    t.divisions[divIdx].bracket = generateBracket(t.divisions[divIdx]);
    t.divisions[divIdx].bracketGenerated = true;
    t.status = "bracket"; t.updatedAt = new Date().toISOString();
    onUpdate(t);
  }

  function handleScore(s1: number, s2: number) {
    if (!scoring) return;
    const t = JSON.parse(JSON.stringify(tournament)) as Tournament;
    const game = t.divisions[scoring.divIdx].bracket[scoring.gameIdx];
    t.divisions[scoring.divIdx].bracket = advanceBracketWinner(t.divisions[scoring.divIdx].bracket, game, s1, s2);
    const allDone = t.divisions.every(d => d.bracket.length > 0 && d.bracket.every(g => !!g.winnerId));
    if (allDone) t.status = "complete";
    t.updatedAt = new Date().toISOString();
    onUpdate(t); setScoring(null);
  }

  return (
    <div className="space-y-8">
      {tournament.divisions.map((div, divIdx) => {
        if (!div.bracketGenerated || div.bracket.length === 0) {
          return (
            <div key={div.id} className="glass border border-white/10 rounded-2xl p-6 text-center">
              <Trophy className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <h3 className="text-white font-bold mb-1">{div.name} Bracket</h3>
              {poolPlayDone(div)
                ? <><p className="text-gray-500 text-sm mb-4">Pool play complete — ready to generate the bracket!</p>
                    <Btn onClick={() => handleGenerateBracket(divIdx)} className="bg-orange-600 hover:bg-orange-500 text-white">🏆 Generate Bracket</Btn></>
                : <p className="text-gray-600 text-sm">Complete all pool play games first.</p>
              }
            </div>
          );
        }

        const rounds = [...new Set(div.bracket.map(g => g.round))].sort((a,b)=>a-b);
        const maxRound = Math.max(...rounds);
        const champion = div.bracket.find(g => g.round === maxRound && g.winnerId);

        return (
          <div key={div.id}>
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" /> {div.name} Bracket
              {champion && <span className="text-yellow-300 text-sm ml-2">🏆 {getTeamName(tournament, champion.winnerId!)}</span>}
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {rounds.map(round => (
                <div key={round} className="flex-shrink-0 w-52">
                  <div className="text-gray-600 text-xs font-bold uppercase tracking-wider mb-3 text-center">
                    {round === maxRound ? "🏆 Final" : round === maxRound - 1 ? "Semifinal" : `Round ${round}`}
                  </div>
                  <div className="space-y-3">
                    {div.bracket.filter(g => g.round === round).map(game => {
                      const done = game.status === "completed";
                      const canScore = !!game.team1Id && !!game.team2Id;
                      const gameIdx = div.bracket.indexOf(game);
                      return (
                        <div key={game.id} className={`glass border ${done?"border-green-500/20":"border-white/10"} rounded-xl overflow-hidden`}>
                          {[{id: game.team1Id, score: game.score1},{id: game.team2Id, score: game.score2}].map((side, si) => (
                            <div key={si} className={`flex items-center justify-between px-3 py-2 ${si===0?"border-b border-white/5":""} ${done && game.winnerId===side.id?"bg-yellow-500/10":""}`}>
                              <span className={`text-sm font-bold truncate ${!side.id?"text-gray-700":done&&game.winnerId===side.id?"text-yellow-300":"text-gray-200"}`}>
                                {getTeamName(tournament, side.id)}
                              </span>
                              {done && <span className={`text-sm font-black ml-2 ${game.winnerId===side.id?"text-yellow-300":"text-gray-600"}`}>{side.score}</span>}
                            </div>
                          ))}
                          {canScore && (
                            <button onClick={() => setScoring({ divIdx, gameIdx })}
                              className={`w-full py-1.5 text-xs font-bold transition-colors ${done?"text-gray-600 hover:text-blue-400":"text-blue-400 hover:text-blue-300"}`}>
                              {done ? "Edit Score" : "Enter Score →"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {scoring && (() => {
        const g = tournament.divisions[scoring.divIdx].bracket[scoring.gameIdx];
        return <ScoreDialog game={g} teamA={getTeamName(tournament, g.team1Id ?? null)}
          teamB={getTeamName(tournament, g.team2Id ?? null)} onSave={handleScore} onClose={() => setScoring(null)} />;
      })()}
    </div>
  );
}

// ── TOURNAMENT DETAIL ────────────────────────────────────────────────────────

type DetailTab = "schedule" | "standings" | "bracket";

function TournamentDetail({ tournament: init, onBack, onUpdate }: {
  tournament: Tournament; onBack: () => void; onUpdate: (t: Tournament) => void;
}) {
  const [tournament, setTournament] = useState(init);
  const [tab, setTab] = useState<DetailTab>("schedule");

  const handleUpdate = useCallback((updated: Tournament) => {
    saveTournament(updated);
    setTournament({...updated});
    onUpdate(updated);
  }, [onUpdate]);

  const total = tournament.divisions.reduce((s,d) => s + d.games.length, 0);
  const done  = tournament.divisions.reduce((s,d) => s + d.games.filter(g => g.status==="completed").length, 0);
  const teams = tournament.divisions.reduce((s,d) => s + d.teams.length, 0);

  return (
    <div>
      <div className="flex items-start gap-3 mb-5">
        <button onClick={onBack} className="mt-1 text-gray-500 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-white font-bold text-lg">{tournament.name}</h2>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${S_COLOR[tournament.status]}`}>{S_LABEL[tournament.status]}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 text-xs text-gray-500 mt-1">
            {tournament.date  && <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/>{tournament.date}</span>}
            {tournament.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/>{tournament.venue}</span>}
            <span className="flex items-center gap-1"><Users className="w-3 h-3"/>{teams} teams · {tournament.courts} courts</span>
            {total > 0 && <span>{done}/{total} scored</span>}
          </div>
        </div>
      </div>

      {total > 0 && (
        <div className="mb-5">
          <div className="bg-white/5 rounded-full h-1.5">
            <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{width:`${Math.round((done/total)*100)}%`}} />
          </div>
          <div className="text-xs text-gray-600 mt-1 text-right">{Math.round((done/total)*100)}% complete</div>
        </div>
      )}

      <div className="flex border-b border-white/10 mb-5">
        {(["schedule","standings","bracket"] as DetailTab[]).map(k => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors capitalize ${tab===k?"border-blue-500 text-blue-400":"border-transparent text-gray-500 hover:text-gray-300"}`}>
            {k==="schedule"?"📅 Schedule":k==="standings"?"📊 Standings":"🏆 Bracket"}
          </button>
        ))}
      </div>

      {tab === "schedule"  && <ScheduleView  tournament={tournament} onUpdate={handleUpdate} />}
      {tab === "standings" && <StandingsView tournament={tournament} />}
      {tab === "bracket"   && <BracketView   tournament={tournament} onUpdate={handleUpdate} />}
    </div>
  );
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────

export function TourneyTab() {
  const [list, setList] = useState<Tournament[]>(() =>
    getAllTournaments().sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  );
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Tournament | null>(null);

  function handleCreated(t: Tournament) { setList(p => [t,...p]); setCreating(false); setSelected(t); }
  function handleDelete(id: string) {
    if (!confirm("Delete this tournament? Cannot be undone.")) return;
    deleteT(id); setList(p => p.filter(t => t.id !== id));
    if (selected?.id === id) setSelected(null);
  }
  function handleUpdate(updated: Tournament) {
    setList(p => p.map(t => t.id===updated.id ? updated : t));
  }

  if (selected) {
    return <TournamentDetail tournament={selected} onBack={() => setSelected(null)}
      onUpdate={u => { setSelected(u); handleUpdate(u); }} />;
  }

  const totalGames = (t: Tournament) => t.divisions.reduce((s,d) => s + d.games.length, 0);
  const doneGames  = (t: Tournament) => t.divisions.reduce((s,d) => s + d.games.filter(g => g.status==="completed").length, 0);
  const totalTeams = (t: Tournament) => t.divisions.reduce((s,d) => s + d.teams.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-base">Tournament Calculator</h2>
          <p className="text-gray-500 text-sm mt-0.5">Auto-generate schedules, run brackets, and track scores.</p>
        </div>
        <Btn onClick={() => setCreating(true)} className="bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5">
          <Plus className="w-4 h-4 inline" /> New
        </Btn>
      </div>

      {list.length === 0
        ? (
          <div className="glass border border-white/10 rounded-2xl p-10 text-center">
            <div className="text-5xl mb-4">🏆</div>
            <p className="text-white font-bold mb-1">No tournaments yet</p>
            <p className="text-gray-500 text-sm mb-5">Create one to auto-generate a full schedule with brackets and standings.</p>
            <Btn onClick={() => setCreating(true)} className="bg-blue-600 hover:bg-blue-500 text-white">+ Create First Tournament</Btn>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map(t => {
              const done = doneGames(t), total = totalGames(t);
              const pct = total > 0 ? Math.round((done/total)*100) : 0;
              return (
                <div key={t.id} className="glass border border-white/10 hover:border-white/20 rounded-2xl p-4 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-white font-bold truncate">{t.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${S_COLOR[t.status]}`}>{S_LABEL[t.status]}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 text-xs text-gray-500 mb-2">
                        {t.date && <span>{t.date}</span>}
                        {t.venue && <span>{t.venue}</span>}
                        <span>{totalTeams(t)} teams · {t.divisions.length} div{t.divisions.length!==1?"s":""} · {t.courts} courts</span>
                      </div>
                      {total > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-white/5 rounded-full h-1 max-w-[100px]">
                            <div className="bg-blue-500 h-1 rounded-full" style={{width:`${pct}%`}} />
                          </div>
                          <span className="text-xs text-gray-600">{done}/{total}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Btn onClick={() => setSelected(t)} className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400">Open →</Btn>
                      <button onClick={() => handleDelete(t.id)} className="p-2 text-gray-600 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      }
      {creating && <CreateWizard onCreated={handleCreated} onClose={() => setCreating(false)} />}
    </div>
  );
}
