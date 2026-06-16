"use client";

export const dynamic = "force-dynamic";
import { useState, useEffect, useRef } from "react";
import { Trash2, Download, Upload, LogOut, Shield, Users, Trophy, Plus, Edit2, X, ChevronDown, ChevronUp, ToggleLeft, ToggleRight, Image as ImgIcon, Save, Loader2, CheckCircle, FileText, Star, Copy, Tag, Percent, DollarSign, Calendar, Hash, RotateCcw, Video, Mail as MailIcon, MessageCircle, Lock, Eye, EyeOff, Play } from "lucide-react";

import type { TournamentConfig } from "@/lib/tournament-client";
import { TOURNAMENT_DEFAULTS } from "@/lib/tournament-client";
import type { SiteContent, CampItem, Coach, FeaturedCoach, CoachStat, VideoItem, MerchProduct } from "@/lib/content";

// ─────────────────────────────────────────────────────────────────────────────
// Types & helpers
// ─────────────────────────────────────────────────────────────────────────────
const SOURCE_LABELS: Record<string, string> = {
  "registration": "2026 Youth Summer Camp",
  "merch-order":  "Merch Order",
  "import":       "Import",
  "tournament":   "Tournament",
  "tryout":       "Tryout Registration",
};

interface Contact {
  id: string; name: string; email: string; phone: string;
  source: string; notes?: string;
  tournamentName?: string; teamName?: string; division?: string;
  date: string;
  // Camper info
  camperName?: string; grade?: string; gender?: string;
  shirtSize?: string; emergencyContact?: string; emergencyPhone?: string;
  // Wix order / payment fields
  amountPaid?: string; orderNumber?: string; orderDate?: string;
  ticketType?: string; ticketNum?: string; ticketPrice?: string;
  benefit?: string; coupon?: string; tax?: string;
  wixServiceFee?: string; ticketRevenue?: string;
  paymentStatus?: string; checkedIn?: string; seatInfo?: string;
}

function makeId() { return `${Date.now()}-${Math.random().toString(36).slice(2,6)}`; }

type Tab = "contacts" | "tournaments" | "pages" | "vouchers" | "filmroom" | "camp" | "tourney";

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: image field with upload
// ─────────────────────────────────────────────────────────────────────────────
function ImageField({ label, value, onChange, adminKey }: { label:string; value:string; onChange:(v:string)=>void; adminKey:string; }) {
  const ref        = useRef<HTMLInputElement>(null);
  const [busy,     setBusy]     = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState(false);
  const [dragging, setDragging] = useState(false);

  async function doUpload(file: File) {
    if (!file) return;
    setBusy(true); setError(""); setSuccess(false);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res  = await fetch(`/api/upload?key=${adminKey}`, { method:"POST", body:fd });
      const data = await res.json();
      if (data.url) { onChange(data.url); setSuccess(true); setTimeout(() => setSuccess(false), 3000); }
      else setError(data.error || "Upload failed. On live site, add BLOB_READ_WRITE_TOKEN in Vercel → Storage.");
    } catch { setError("Upload failed. Check your connection and try again."); }
    setBusy(false);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (file) doUpload(file);
    e.target.value = "";          // allow re-selecting same file
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) doUpload(file);
  }

  return (
    <div>
      <label className="block text-gray-400 text-xs font-semibold mb-1">{label}</label>

      {/* URL input + upload button row */}
      <div className="flex gap-2">
        <input value={value} onChange={e => onChange(e.target.value)}
          placeholder="Paste image URL  —or—  drag & drop / click Upload"
          className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
        <button type="button" onClick={() => ref.current?.click()} disabled={busy}
          className="px-3 py-2.5 bg-blue-600/80 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shadow">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {busy ? "Uploading…" : "Upload Photo"}
        </button>
      </div>

      {/* Drag-and-drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => ref.current?.click()}
        className={`mt-2 border-2 border-dashed rounded-xl px-4 py-3 text-center text-xs cursor-pointer transition-all select-none
          ${dragging ? "border-blue-500 bg-blue-500/10 text-blue-300" : "border-white/15 text-gray-600 hover:border-white/30 hover:text-gray-400"}`}
      >
        {busy ? "Uploading, please wait…" : "Drag & drop an image here, or click to browse"}
      </div>

      {/* Status messages */}
      {error   && <p className="text-red-400 text-xs mt-1.5 leading-snug">⚠ {error}</p>}
      {success && <p className="text-green-400 text-xs mt-1.5">✓ Photo uploaded successfully — click Save below to apply.</p>}

      {/* Preview */}
      {value && (
        <div className="mt-2 rounded-xl overflow-hidden bg-white/5 border border-white/10 relative group" style={{height:"110px"}}>
          <img src={value} alt="preview" className="w-full h-full object-cover"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          <button type="button" onClick={() => onChange("")}
            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white/60 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: textarea field
// ─────────────────────────────────────────────────────────────────────────────
function TF({ label, value, onChange, rows=2, ph="" }: { label:string; value:string; onChange:(v:string)=>void; rows?:number; ph?:string; }) {
  return (
    <div>
      <label className="block text-gray-400 text-xs font-semibold mb-1">{label}</label>
      <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={ph}
        className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none" />
    </div>
  );
}

function IF({ label, value, onChange, ph="", type="text", required=false }: { label:string; value:string; onChange:(v:string)=>void; ph?:string; type?:string; required?:boolean; }) {
  return (
    <div>
      <label className="block text-gray-400 text-xs font-semibold mb-1">{label}{required && <span className="text-red-400"> *</span>}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={ph} required={required}
        className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tournament form
// ─────────────────────────────────────────────────────────────────────────────
function TournamentForm({ initial, onSave, onCancel, adminKey }: {
  initial: TournamentConfig; onSave: (t: TournamentConfig) => void; onCancel: () => void; adminKey: string;
}) {
  const [t, setT]               = useState<TournamentConfig>(initial);
  const [newDiv, setNewDiv]      = useState("");
  const [saving, setSaving]      = useState(false);

  const set = (k: keyof TournamentConfig) => (v: unknown) => setT(prev => ({ ...prev, [k]: v }));

  async function handleSave() {
    setSaving(true);
    const method = t.id ? "PUT" : "POST";
    const res = await fetch(`/api/tournament?key=${adminKey}`, {
      method, headers: {"Content-Type":"application/json"}, body: JSON.stringify(t),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) onSave(data.tournament ?? t);
  }

  return (
    <div className="glass rounded-2xl border border-blue-500/30 p-5 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-bold text-sm">{t.id ? "Edit Tournament" : "New Tournament"}</h3>
        <button onClick={onCancel} className="text-gray-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
      </div>

      {/* Enable toggle */}
      <div className="flex items-center gap-3">
        <button onClick={() => set("enabled")(!t.enabled)} className="flex items-center gap-2">
          {t.enabled
            ? <ToggleRight className="w-8 h-8 text-green-400" />
            : <ToggleLeft  className="w-8 h-8 text-gray-500" />}
          <span className={`text-sm font-bold ${t.enabled ? "text-green-400" : "text-gray-500"}`}>{t.enabled ? "LIVE" : "OFF"}</span>
        </button>
        <span className="text-gray-500 text-xs">Toggle on to show this tournament publicly</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <IF label="Tournament Name" value={t.name} onChange={set("name")} ph="Hillsboro Spring Classic" required />
        <IF label="Tagline" value={t.tagline} onChange={set("tagline")} ph="Youth Basketball Tournament" />
        <IF label="Dates" value={t.dates} onChange={set("dates")} ph="Feb 21–22, 2026" />
        <IF label="Day / Time" value={t.dayTime} onChange={set("dayTime")} ph="Saturday 8am – Sunday 6pm" />
        <IF label="Registration Deadline" value={t.registrationDeadline} onChange={set("registrationDeadline")} ph="February 7, 2026" />
        <IF label="Venue" value={t.venue} onChange={set("venue")} ph="Hillsboro High School" />
        <IF label="Address" value={t.address} onChange={set("address")} ph="3285 SE Rood Bridge Rd, Hillsboro, OR" />
        <IF label="Gender" value={t.gender} onChange={set("gender")} ph="Boys & Girls" />
        <IF label="Grades" value={t.grades} onChange={set("grades")} ph="3rd–8th Grade" />
        <IF label="Entry Fee ($)" value={String(t.entryFee)} onChange={v => set("entryFee")(parseFloat(v)||0)} type="number" />
        <IF label="Service Fee ($)" value={String(t.serviceFee)} onChange={v => set("serviceFee")(parseFloat(v)||0)} type="number" />
        <IF label="Format" value={t.format} onChange={set("format")} ph="Double Elimination" />
        <IF label="Games Guaranteed" value={t.gamesGuaranteed} onChange={set("gamesGuaranteed")} ph="3" />
        <IF label="Max Teams" value={t.maxTeams} onChange={set("maxTeams")} ph="16" />
        <IF label="Contact Email" value={t.contactEmail} onChange={set("contactEmail")} type="email" />
        <IF label="Contact Phone" value={t.contactPhone} onChange={set("contactPhone")} />
      </div>

      <ImageField label="Banner Image" value={t.imageUrl} onChange={set("imageUrl") as (v:string)=>void} adminKey={adminKey} />

      <div className="flex items-center gap-3">
        <button onClick={() => set("isStateQualifier")(!t.isStateQualifier)} className="flex items-center gap-2">
          {t.isStateQualifier ? <ToggleRight className="w-7 h-7 text-yellow-400" /> : <ToggleLeft className="w-7 h-7 text-gray-500" />}
          <span className={`text-sm font-semibold ${t.isStateQualifier ? "text-yellow-400" : "text-gray-500"}`}>State Qualifier</span>
        </button>
      </div>

      {t.isStateQualifier && <TF label="State Qualifier Text" value={t.stateQualifierText} onChange={set("stateQualifierText") as (v:string)=>void} rows={3} />}

      <TF label="Description" value={t.description} onChange={set("description") as (v:string)=>void} rows={3} ph="Brief description shown on the event page…" />
      <TF label="Accommodations Note" value={t.accommodationsNote} onChange={set("accommodationsNote") as (v:string)=>void} rows={2} />
      <TF label="Refund Policy" value={t.refundPolicy} onChange={set("refundPolicy") as (v:string)=>void} rows={3} />
      <TF label="Rules" value={t.rules} onChange={set("rules") as (v:string)=>void} rows={3} />
      <TF label="Additional Notes" value={t.notes} onChange={set("notes") as (v:string)=>void} rows={2} />

      {/* Divisions */}
      <div>
        <label className="block text-gray-400 text-xs font-semibold mb-2">Divisions</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {t.divisions.map((d,i) => (
            <span key={i} className="flex items-center gap-1.5 px-3 py-1 bg-blue-600/20 border border-blue-500/30 text-blue-300 rounded-full text-xs font-semibold">
              {d}
              <button onClick={() => set("divisions")(t.divisions.filter((_,j)=>j!==i))} className="text-blue-400 hover:text-red-400 transition-colors"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newDiv} onChange={e => setNewDiv(e.target.value)} onKeyDown={e => { if (e.key==="Enter"&&newDiv.trim()) { set("divisions")([...t.divisions, newDiv.trim()]); setNewDiv(""); e.preventDefault(); }}}
            placeholder="Add division, press Enter" className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-600 text-xs focus:outline-none focus:border-blue-500 transition-colors" />
          <button type="button" onClick={() => { if (newDiv.trim()) { set("divisions")([...t.divisions, newDiv.trim()]); setNewDiv(""); }}} className="px-3 py-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded-xl text-xs transition-colors">Add</button>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-gradient-to-r from-[#006aff] to-[#00aaff] hover:brightness-110 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Tournament</>}
        </button>
        <button onClick={onCancel} className="px-5 py-3 glass border border-white/15 text-gray-400 hover:text-white font-semibold rounded-xl transition-all">Cancel</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pages CMS section
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

// ── FilmRoomTab — View who has accessed the Film Room ──────────────────────
interface FilmVisitor  { id: string; name: string; email: string; enteredAt: string; }
interface FilmTally    { key: string; name: string; email: string; count: number; firstSeen: string; lastSeen: string; }
interface ActiveViewer { name: string; lastSeen: string; watching?: string; }

function FilmRoomTab({ adminKey }: { adminKey: string }) {
  const [visitors,    setVisitors]    = useState<FilmVisitor[]>([]);
  const [tally,       setTally]       = useState<FilmTally[]>([]);
  const [loaded,      setLoaded]      = useState(false);
  const [view,        setView]        = useState<"tally"|"log">("tally");
  const [chatCount,   setChatCount]   = useState<number | null>(null);
  const [liveViewers, setLiveViewers] = useState<ActiveViewer[]>([]);

  // Passwords state
  const [teamPw,      setTeamPw]      = useState("");
  const [coachPw,     setCoachPw]     = useState("");
  const [showTeamPw,  setShowTeamPw]  = useState(false);
  const [showCoachPw, setShowCoachPw] = useState(false);
  const [pwSaving,    setPwSaving]    = useState(false);
  const [pwSaved,     setPwSaved]     = useState(false);

  useEffect(() => {
    fetch(`/api/film-room/visitors?key=${adminKey}`)
      .then(r => r.json())
      .then(d => {
        setVisitors(Array.isArray(d.visitors) ? d.visitors : []);
        setTally(Array.isArray(d.tally) ? d.tally : []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    fetch("/api/film-room/chat")
      .then(r => r.json())
      .then((msgs: unknown[]) => setChatCount(Array.isArray(msgs) ? msgs.length : 0))
      .catch(() => {});
    // Load current passwords
    fetch("/api/content")
      .then(r => r.json())
      .then(d => {
        setTeamPw(d?.videoRoom?.password      || "hilhi-team");
        setCoachPw(d?.videoRoom?.coachPassword || "Kem-admin");
      })
      .catch(() => {});
    // Live viewers (poll every 10s)
    const fetchLive = () =>
      fetch("/api/film-room/presence")
        .then(r => r.json()).then(setLiveViewers).catch(() => {});
    fetchLive();
    const iv = setInterval(fetchLive, 10000);
    return () => clearInterval(iv);
  }, [adminKey]);

  async function savePasswords() {
    if (!teamPw.trim() || !coachPw.trim()) return;
    setPwSaving(true);
    await fetch(`/api/content?key=${adminKey}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoRoom: { password: teamPw.trim(), coachPassword: coachPw.trim() } }),
    });
    setPwSaving(false);
    setPwSaved(true);
    setTimeout(() => setPwSaved(false), 3000);
  }

  async function clearAll() {
    if (!confirm("Clear all film room visitor logs and tallies?")) return;
    await fetch(`/api/film-room/visitors?key=${adminKey}`, { method: "DELETE" });
    setVisitors([]); setTally([]);
  }

  async function clearChat() {
    if (!confirm("Clear all Film Room chat messages? This cannot be undone.")) return;
    await fetch(`/api/film-room/chat?key=${adminKey}`, { method: "DELETE" });
    setChatCount(0);
  }

  async function removeGuest(tallyKey: string, name: string) {
    if (!confirm(`Remove ${name} from the visitor list? This will delete their tally and all log entries.`)) return;
    await fetch(`/api/film-room/visitors?key=${adminKey}&guest=${encodeURIComponent(tallyKey)}`, { method: "DELETE" });
    setTally(prev => prev.filter(t => t.key !== tallyKey));
    setVisitors(prev => prev.filter(v => v.name.toLowerCase() !== name.toLowerCase()));
  }

  async function removeEntry(id: string) {
    await fetch(`/api/film-room/visitors?key=${adminKey}&entryId=${encodeURIComponent(id)}`, { method: "DELETE" });
    setVisitors(prev => prev.filter(v => v.id !== id));
  }

  if (!loaded) return <div className="flex items-center justify-center h-40 text-gray-500 text-sm">Loading…</div>;

  const totalVisits   = tally.reduce((s, t) => s + t.count, 0);
  const uniqueViewers = tally.length;

  return (
    <div className="space-y-6">

      {/* ── Password Settings ── */}
      <div className="glass rounded-2xl border border-white/10 p-5">
        <h3 className="text-white font-black text-base mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-blue-400" /> Film Room Passwords
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Team Password</label>
            <p className="text-gray-500 text-xs mb-2">Given to all players to enter the Film Room</p>
            <div className="relative">
              <input
                type={showTeamPw ? "text" : "password"}
                value={teamPw}
                onChange={e => setTeamPw(e.target.value)}
                className="w-full pr-10 px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button type="button" onClick={() => setShowTeamPw(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showTeamPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Coach Password</label>
            <p className="text-gray-500 text-xs mb-2">Your private password — unlocks Clear Chat in Film Room</p>
            <div className="relative">
              <input
                type={showCoachPw ? "text" : "password"}
                value={coachPw}
                onChange={e => setCoachPw(e.target.value)}
                className="w-full pr-10 px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button type="button" onClick={() => setShowCoachPw(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showCoachPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button onClick={savePasswords} disabled={pwSaving || !teamPw.trim() || !coachPw.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all">
            {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {pwSaving ? "Saving…" : "Save Passwords"}
          </button>
          {pwSaved && <span className="text-green-400 text-sm font-semibold flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Saved!</span>}
        </div>
      </div>

      {/* ── Live Now: who is currently in the Film Room ── */}
      {liveViewers.length > 0 && (
        <div className="glass rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
          <h3 className="text-white font-black text-base mb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
            Live Now — {liveViewers.length} viewer{liveViewers.length !== 1 ? "s" : ""} in the Film Room
          </h3>
          <div className="flex flex-wrap gap-3">
            {liveViewers.map(v => (
              <div key={v.name} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                <div className="w-7 h-7 rounded-full bg-green-600/30 border border-green-500/40 flex items-center justify-center text-green-400 font-bold text-xs flex-shrink-0">
                  {v.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-white text-sm font-bold leading-none">{v.name}</div>
                  {v.watching
                    ? <div className="text-green-400 text-xs mt-0.5 flex items-center gap-1"><Play className="w-3 h-3" />{v.watching}</div>
                    : <div className="text-gray-500 text-xs mt-0.5">Browsing…</div>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-white font-black text-xl">🎬 Film Room Visitors</h2>
          <p className="text-gray-500 text-sm mt-0.5">{uniqueViewers} unique viewer{uniqueViewers !== 1 ? "s" : ""} · {totalVisits} total visit{totalVisits !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex glass border border-white/10 rounded-xl p-1 gap-1">
            <button onClick={() => setView("tally")} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view==="tally" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>Tally</button>
            <button onClick={() => setView("log")}   className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view==="log"   ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>Full Log</button>
          </div>
          {(chatCount ?? 0) > 0 && (
            <button onClick={clearChat} className="flex items-center gap-2 px-4 py-2 glass border border-white/15 hover:border-orange-500/40 text-gray-400 hover:text-orange-400 rounded-xl text-sm font-semibold transition-all">
              <MessageCircle className="w-4 h-4" /> Clear Chat
              <span className="bg-orange-500/20 text-orange-400 text-xs font-bold px-1.5 py-0.5 rounded-full">{chatCount}</span>
            </button>
          )}
          {(visitors.length > 0 || tally.length > 0) && (
            <button onClick={clearAll} className="flex items-center gap-2 px-4 py-2 glass border border-white/15 hover:border-red-500/40 text-gray-400 hover:text-red-400 rounded-xl text-sm font-semibold transition-all">
              <Trash2 className="w-4 h-4" /> Clear Visitors
            </button>
          )}
        </div>
      </div>

      {tally.length === 0 ? (
        <div className="glass rounded-2xl border border-white/10 p-10 text-center">
          <Video className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-semibold">No visitors yet</p>
          <p className="text-gray-600 text-sm mt-1">When someone signs into the Film Room, they will appear here.</p>
        </div>
      ) : view === "tally" ? (
        /* ── Tally view ── */
        <div className="glass rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Viewer</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-5 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Visits</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Last Seen</th>
                <th className="px-3 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {tally.map((t, i) => (
                <tr key={t.key} className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm flex-shrink-0">
                        {t.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white font-semibold text-sm">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {t.email ? <a href={`mailto:${t.email}`} className="text-blue-400 hover:text-blue-300 text-sm">{t.email}</a> : <span className="text-gray-600 text-sm">—</span>}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-black ${t.count >= 5 ? "bg-yellow-500/20 text-yellow-400" : t.count >= 2 ? "bg-blue-500/20 text-blue-400" : "bg-white/10 text-gray-400"}`}>
                      {t.count}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-sm">
                    {new Date(t.lastSeen).toLocaleString("en-US", { month:"short", day:"numeric", hour:"numeric", minute:"2-digit", hour12:true, timeZone:"America/Los_Angeles" })}
                  </td>
                  <td className="px-3 py-3">
                    <button onClick={() => removeGuest(t.key, t.name)}
                      title="Remove guest"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── Full log view ── */
        <div className="glass rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Signed In</th>
                <th className="px-3 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {visitors.map((v, i) => (
                <tr key={v.id} className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm flex-shrink-0">
                        {v.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white font-semibold text-sm">{v.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {v.email ? <a href={`mailto:${v.email}`} className="text-blue-400 text-sm">{v.email}</a> : <span className="text-gray-600 text-sm">—</span>}
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-sm">
                    {new Date(v.enteredAt).toLocaleString("en-US", { month:"short", day:"numeric", year:"numeric", hour:"numeric", minute:"2-digit", hour12:true, timeZone:"America/Los_Angeles" })}
                  </td>
                  <td className="px-3 py-3">
                    <button onClick={() => removeEntry(v.id)}
                      title="Remove this entry"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


import { CampTab } from "./camp-tab";
import { TourneyTab } from "./tourney-tab";

// VouchersTab — Create and manage discount promo codes
// ─────────────────────────────────────────────────────────────────────────────
type VoucherEvent = "camp" | "tournament" | "tryout";
interface Voucher {
  id: string; code: string; description: string;
  type: "percent" | "fixed"; amount: number;
  events: VoucherEvent[]; maxUses: number | null; usedCount: number;
  expiresAt: string | null; minOrderAmount: number;
  enabled: boolean; createdAt: string;
}
const BLANK_VOUCHER: Omit<Voucher,"id"|"usedCount"|"createdAt"> = {
  code:"", description:"", type:"percent", amount:10,
  events:["camp","tournament","tryout"], maxUses:null,
  expiresAt:null, minOrderAmount:0, enabled:true,
};

function VouchersTab({ adminKey }: { adminKey: string }) {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loaded,   setLoaded]   = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState("");
  const [editing,  setEditing]  = useState<Partial<Voucher> | null>(null);

  useEffect(() => {
    fetch(`/api/vouchers?key=${adminKey}`)
      .then(r => r.json()).then(d => { setVouchers(d); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [adminKey]);

  async function save() {
    if (!editing) return;
    if (!editing.code?.trim()) { setMsg("Code is required."); return; }
    if (!editing.amount || editing.amount <= 0) { setMsg("Amount must be > 0."); return; }
    if (!editing.events?.length) { setMsg("Select at least one event."); return; }
    setSaving(true); setMsg("");
    const res = await fetch(`/api/vouchers?key=${adminKey}`, {
      method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(editing)
    });
    const v = await res.json();
    setVouchers(prev => editing.id ? prev.map(x => x.id===v.id ? v : x) : [...prev, v]);
    setEditing(null); setSaving(false); setMsg("Saved!");
    setTimeout(() => setMsg(""), 3000);
  }

  async function remove(id: string) {
    if (!confirm("Delete this voucher?")) return;
    await fetch(`/api/vouchers?key=${adminKey}&id=${id}`, { method:"DELETE" });
    setVouchers(prev => prev.filter(v => v.id !== id));
  }

  async function resetUsage(v: Voucher) {
    if (!confirm(`Reset usage count for "${v.code}" back to 0?`)) return;
    const updated = { ...v, usedCount: 0 };
    await fetch(`/api/vouchers?key=${adminKey}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    setVouchers(prev => prev.map(x => x.id === v.id ? updated : x));
  }

  async function toggle(v: Voucher) {
    const updated = { ...v, enabled: !v.enabled };
    await fetch(`/api/vouchers?key=${adminKey}`, {
      method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(updated)
    });
    setVouchers(prev => prev.map(x => x.id===v.id ? updated : x));
  }

  function voucherStatus(v: Voucher) {
    if (!v.enabled) return { label:"Disabled", cls:"bg-gray-500/20 text-gray-400 border-gray-500/30" };
    if (v.expiresAt && new Date(v.expiresAt) < new Date()) return { label:"Expired", cls:"bg-red-500/20 text-red-400 border-red-500/30" };
    if (v.maxUses !== null && v.usedCount >= v.maxUses) return { label:"Used Up", cls:"bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
    return { label:"Active", cls:"bg-green-500/20 text-green-400 border-green-500/30" };
  }

  if (!loaded) return <div className="flex items-center justify-center h-40 text-gray-500 text-sm">Loading vouchers…</div>;

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-black text-xl">Discount Vouchers</h2>
          <p className="text-gray-500 text-sm mt-0.5">Create promo codes for camp, tournament, and tryout registrations.</p>
        </div>
        <button onClick={() => setEditing({ ...BLANK_VOUCHER })}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-400 text-white rounded-xl text-sm font-bold transition-colors">
          <Plus className="w-4 h-4" /> New Voucher
        </button>
      </div>
      {msg && <p className="text-green-400 text-sm font-semibold">{msg}</p>}

      {/* ── Edit / Create form ── */}
      {editing !== null && (
        <div className="glass rounded-2xl border border-orange-500/30 bg-orange-500/5 p-6 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-white font-bold text-base">{editing.id ? "Edit Voucher" : "Create New Voucher"}</h3>
            <button onClick={() => setEditing(null)}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Code */}
            <div>
              <label className="block text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wider">Promo Code *</label>
              <input value={editing.code ?? ""} onChange={e => setEditing(p => ({...p, code:e.target.value.toUpperCase().replace(/\s/g,"")}))}
                placeholder="e.g. CAMP2026" maxLength={20}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-600 text-sm font-mono uppercase tracking-widest focus:outline-none focus:border-orange-500 transition-colors" />
              <p className="text-gray-600 text-xs mt-1">No spaces. Shown to customers (e.g. CAMP2026, TEAM10)</p>
            </div>
            {/* Description */}
            <div>
              <label className="block text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wider">Label / Description *</label>
              <input value={editing.description ?? ""} onChange={e => setEditing(p => ({...p, description:e.target.value}))}
                placeholder="e.g. Early Bird Camp Discount"
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-orange-500 transition-colors" />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {/* Type */}
            <div>
              <label className="block text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wider">Discount Type</label>
              <div className="flex gap-2">
                {(["percent","fixed"] as const).map(t => (
                  <button key={t} type="button"
                    onClick={() => setEditing(p => ({...p, type:t}))}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${editing.type===t ? "bg-orange-500 border-orange-400 text-white" : "bg-white/5 border-white/15 text-gray-400 hover:text-white"}`}>
                    {t==="percent" ? <Percent className="w-3.5 h-3.5" /> : <DollarSign className="w-3.5 h-3.5" />}
                    {t==="percent" ? "%" : "$"}
                  </button>
                ))}
              </div>
            </div>
            {/* Amount */}
            <div>
              <label className="block text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wider">
                Amount {editing.type==="percent" ? "(% off)" : "($ off)"}
              </label>
              <input type="number" min={1} max={editing.type==="percent" ? 100 : 9999} step={editing.type==="percent" ? 1 : 0.01}
                value={editing.amount ?? ""} onChange={e => setEditing(p => ({...p, amount:parseFloat(e.target.value)||0}))}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors" />
            </div>
            {/* Min order */}
            <div>
              <label className="block text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wider">Min. Order ($)</label>
              <input type="number" min={0} step={1}
                value={editing.minOrderAmount ?? 0} onChange={e => setEditing(p => ({...p, minOrderAmount:parseFloat(e.target.value)||0}))}
                placeholder="0 = none"
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-orange-500 transition-colors" />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {/* Max uses */}
            <div>
              <label className="block text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wider">Max Uses</label>
              <input type="number" min={1}
                value={editing.maxUses ?? ""} onChange={e => setEditing(p => ({...p, maxUses:e.target.value ? parseInt(e.target.value) : null}))}
                placeholder="Leave blank = unlimited"
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-orange-500 transition-colors" />
            </div>
            {/* Expires */}
            <div>
              <label className="block text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wider">Expiry Date</label>
              <input type="date"
                value={editing.expiresAt ? editing.expiresAt.slice(0,10) : ""}
                onChange={e => setEditing(p => ({...p, expiresAt:e.target.value ? new Date(e.target.value+"T23:59:59").toISOString() : null}))}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors" />
            </div>
            {/* Enabled */}
            <div className="flex items-end">
              <label className="flex items-center gap-3 cursor-pointer py-2.5">
                <div onClick={() => setEditing(p => ({...p, enabled:!p?.enabled}))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${editing.enabled ? "bg-orange-500" : "bg-gray-700"}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${editing.enabled ? "translate-x-5" : ""}`} />
                </div>
                <span className="text-gray-300 text-sm font-semibold">Voucher Active</span>
              </label>
            </div>
          </div>

          {/* Applies to */}
          <div>
            <label className="block text-gray-400 text-xs font-semibold mb-2 uppercase tracking-wider">Applies To</label>
            <div className="flex gap-3">
              {(["camp","tournament","tryout"] as VoucherEvent[]).map(ev => {
                const on = (editing.events ?? []).includes(ev);
                return (
                  <button key={ev} type="button"
                    onClick={() => setEditing(p => {
                      const evs = p?.events ?? [];
                      return { ...p, events: on ? evs.filter(e => e!==ev) : [...evs, ev] };
                    })}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize border transition-all ${on ? "bg-orange-500/20 border-orange-500/60 text-orange-300" : "bg-white/5 border-white/15 text-gray-500 hover:text-gray-300"}`}>
                    {ev==="camp" ? "🏕️" : ev==="tournament" ? "🏆" : "📋"} {ev}
                  </button>
                );
              })}
            </div>
            <p className="text-gray-600 text-xs mt-1">Select which registration types this code is valid for.</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-white/10">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving…" : "Save Voucher"}
            </button>
            <button onClick={() => setEditing(null)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-gray-300 rounded-xl text-sm font-semibold transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Voucher list ── */}
      {vouchers.length === 0 ? (
        <div className="glass rounded-2xl border border-white/10 p-10 text-center">
          <Tag className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-semibold">No vouchers yet</p>
          <p className="text-gray-600 text-sm mt-1">Click "New Voucher" to create your first promo code.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vouchers.map(v => {
            const { label, cls } = voucherStatus(v);
            return (
              <div key={v.id} className="glass rounded-2xl border border-white/10 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <span className="font-mono font-black text-white text-lg tracking-widest">{v.code}</span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${cls}`}>{label}</span>
                      <span className="text-xs text-orange-400 font-bold bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 rounded-full">
                        {v.type==="percent" ? `${v.amount}% OFF` : `$${v.amount.toFixed(2)} OFF`}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mb-2">{v.description}</p>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Hash className="w-3 h-3" />
                        {v.usedCount} used{v.maxUses ? ` / ${v.maxUses} max` : " (unlimited)"}
                      </span>
                      {v.expiresAt && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          Expires {new Date(v.expiresAt).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })}
                        </span>
                      )}
                      {v.minOrderAmount > 0 && (
                        <span>Min. order ${v.minOrderAmount.toFixed(2)}</span>
                      )}
                      <span className="flex items-center gap-1">
                        {v.events.map(e => e==="camp" ? "🏕️" : e==="tournament" ? "🏆" : "📋").join(" ")}
                        {" "}{v.events.join(", ")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Reset Usage */}
                    <button onClick={() => resetUsage(v)} title="Reset usage count to 0"
                      className="p-2 glass border border-white/15 hover:border-yellow-500/40 text-gray-400 hover:text-yellow-400 rounded-lg transition-all">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    {/* Toggle */}
                    <button onClick={() => toggle(v)} title={v.enabled ? "Disable" : "Enable"}
                      className="p-2 glass border border-white/15 hover:border-orange-500/40 text-gray-400 hover:text-orange-400 rounded-lg transition-all">
                      {v.enabled ? <ToggleRight className="w-4 h-4 text-green-400" /> : <ToggleLeft className="w-4 h-4" />}
                    </button>
                    {/* Edit */}
                    <button onClick={() => setEditing({...v})}
                      className="p-2 glass border border-white/15 hover:border-blue-500/40 text-gray-400 hover:text-white rounded-lg transition-all">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {/* Delete */}
                    <button onClick={() => remove(v.id)}
                      className="p-2 glass border border-white/15 hover:border-red-500/40 text-gray-400 hover:text-red-400 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// PagesTab — Full CMS for all website pages
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Pages tab sub-components — defined at MODULE LEVEL so React never remounts
// them on keystroke (avoids input focus loss)
// ─────────────────────────────────────────────────────────────────────────────
function SaveBtn({ k, save, saving, saved }: {
  k: string;
  save: (k: string, patch: object) => void;
  saving: string | null;
  saved: string | null;
}) {
  return (
    <button onClick={() => save(k, {})} disabled={saving===k}
      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#006aff] to-[#00aaff] hover:brightness-110 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50">
      {saving===k ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</> : saved===k ? <><CheckCircle className="w-3.5 h-3.5" /> Saved!</> : <><Save className="w-3.5 h-3.5" /> Save</>}
    </button>
  );
}

function Section({ id, title, badge, children, openId, setOpenId }: {
  id: string; title: string; badge?: string; children: React.ReactNode;
  openId: string | null; setOpenId: (id: string | null) => void;
}) {
  return (
    <div className="glass rounded-2xl border border-white/10 overflow-hidden">
      <button onClick={() => setOpenId(openId===id ? null : id)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-3">
          <span className="text-white font-bold text-sm">{title}</span>
          {badge && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold">{badge}</span>}
        </div>
        {openId===id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {openId===id && <div className="px-5 pb-5 space-y-4 border-t border-white/10 pt-4">{children}</div>}
    </div>
  );
}

function Toggle({ label, checked, onChange, desc }: { label:string; checked:boolean; onChange:(v:boolean)=>void; desc?:string }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
      <div>
        <div className="text-white font-semibold text-sm">{label}</div>
        {desc && <div className="text-gray-500 text-xs mt-0.5">{desc}</div>}
      </div>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-white/20"}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

function PagesTab({ adminKey }: { adminKey: string }) {
  const [content,    setContent]   = useState<SiteContent | null>(null);
  const [section,    setSection]   = useState<string | null>("tryout");
  const [saving,     setSaving]    = useState<string | null>(null);
  const [saved,      setSaved]     = useState<string | null>(null);
  const [editCamp,   setEditCamp]  = useState<CampItem | null>(null);
  const [editCoach,     setEditCoach]     = useState<{ type:"youth"|"hs"; coach:Coach|null }>({ type:"youth", coach:null });
  const [editMerchProd, setEditMerchProd] = useState<MerchProduct | null>(null);
  const [editVideo,     setEditVideo]     = useState<VideoItem | null>(null);

  useEffect(() => { fetch(`/api/content`).then(r=>r.json()).then(setContent); }, []);

  async function save(key: string, patch: Partial<SiteContent>) {
    if (!content) return;
    setSaving(key);
    const updated = { ...content, ...patch };
    await fetch(`/api/content?key=${adminKey}`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(updated) });
    setContent(updated);
    setSaving(null); setSaved(key); setTimeout(()=>setSaved(null), 2500);
  }

  if (!content) return <div className="flex items-center justify-center py-24"><div className="w-6 h-6 border-2 border-blue-500/40 border-t-blue-500 rounded-full animate-spin" /></div>;

  // SaveBtn, Section, Toggle are defined at module level to avoid remount on keystroke

  // Shortcut setters
  const setN = (k: keyof SiteContent["navbar"]) => (v: unknown) =>
    setContent(p => p ? { ...p, navbar: { ...p.navbar, [k]: v } } : p);
  const setPT = (k: keyof SiteContent["pageTitles"]) => (v: string) =>
    setContent(p => p ? { ...p, pageTitles: { ...p.pageTitles, [k]: v } } : p);
  const setH = (k: keyof SiteContent["home"]) => (v: unknown) =>
    setContent(p => p ? { ...p, home: { ...p.home, [k]: v } } : p);
  const setC = (k: keyof SiteContent["contact"]) => (v: string) =>
    setContent(p => p ? { ...p, contact: { ...p.contact, [k]: v } } : p);
  const setT = (k: keyof SiteContent["tryout"]) => (v: unknown) =>
    setContent(p => p ? { ...p, tryout: { ...p.tryout, [k]: v } } : p);
  const setM = (k: keyof SiteContent["merch"]) => (v: unknown) =>
    setContent(p => p ? { ...p, merch: { ...p.merch, [k]: v } } : p);

  const h = content.home;
  const c = content.contact;
  const t = content.tryout;
  const n = content.navbar;
  const pt = content.pageTitles;
  const m = content.merch;

  // Camp helpers
  const saveCampItem = (item: CampItem) => {
    const items = content.camps.items.filter(x => x.id !== item.id);
    if (!item.id) item.id = makeId();
    save("camps", { camps: { ...content.camps, items: [...items, item] } });
    setEditCamp(null);
  };
  const deleteCampItem = (id: string) =>
    save("camps", { camps: { ...content.camps, items: content.camps.items.filter(x=>x.id!==id) } });

  // Coach helpers
  const saveCoach = (type:"youth"|"hs", coach: Coach) => {
    const key     = type === "youth" ? "youthCoaches" : "hsCoaches";
    const current = content[key];
    const coaches = current.coaches.filter(cc => cc.id !== coach.id);
    if (!coach.id) coach.id = makeId();
    save(key, { [key]: { ...current, coaches: [...coaches, coach] } } as Partial<SiteContent>);
    setEditCoach({ type:"youth", coach:null });
  };
  const deleteCoach = (type:"youth"|"hs", id:string) => {
    const key     = type === "youth" ? "youthCoaches" : "hsCoaches";
    const current = content[key];
    save(key, { [key]: { ...current, coaches: current.coaches.filter(cc=>cc.id!==id) } } as Partial<SiteContent>);
  };

  // Tryout session helpers
  const setSession = (idx:number, field:"label"|"time", val:string) => {
    const sessions = t.sessions.map((s,i) => i===idx ? {...s,[field]:val} : s);
    setT("sessions")(sessions);
  };
  const addSession = () => setT("sessions")([...t.sessions, { id:makeId(), label:"", time:"" }]);
  const removeSession = (idx:number) => setT("sessions")(t.sessions.filter((_,i)=>i!==idx));

  return (
    <div className="space-y-3">
      <p className="text-gray-500 text-sm">Edit content across every page of your website. All changes go live immediately after saving.</p>

      {/* ── Upload setup notice ── */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 text-sm space-y-1">
        <p className="text-blue-300 font-bold text-xs uppercase tracking-wider mb-1">📸 Photo Upload Setup</p>
        <p className="text-gray-400 text-xs leading-relaxed">
          To upload photos from this admin page on the live site, add a <span className="text-white font-semibold">Vercel Blob</span> store:
        </p>
        <ol className="text-gray-400 text-xs space-y-0.5 list-decimal list-inside leading-relaxed">
          <li>Go to your <span className="text-white">Vercel dashboard → Storage → Create Store → Blob</span></li>
          <li>Connect it to this project — Vercel will auto-add <span className="font-mono text-blue-300">BLOB_READ_WRITE_TOKEN</span></li>
          <li>Redeploy once — uploads will then work on the live site</li>
        </ol>
        <p className="text-gray-600 text-xs mt-1">Until then, paste any public image URL directly into the image field.</p>
      </div>

      {/* ── Tryout Page ──────────────────────────────────────────────────── */}
      <Section openId={section} setOpenId={setSection} id="tryout" title="🏀 Tryout Page" badge={t.enabled ? "Live" : "Hidden"}>
        <Toggle
          label="Show Tryout Page"
          desc="When OFF, visitors see a 'Coming Soon' message instead."
          checked={t.enabled}
          onChange={v => { setT("enabled")(v); save("tryout", { tryout: { ...t, enabled: v } }); }}
        />
        <Toggle
          label="Registration Open"
          desc="When OFF, the payment form is hidden and shows 'Registration Not Yet Open'."
          checked={t.registrationOpen}
          onChange={v => { setT("registrationOpen")(v); save("tryout", { tryout: { ...t, registrationOpen: v } }); }}
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <IF label="Page Title"    value={t.title}       onChange={setT("title") as (v:string)=>void}    ph="2026–2027 Youth Competitive Basketball Tryouts" />
          <IF label="Subtitle"      value={t.subtitle}    onChange={setT("subtitle") as (v:string)=>void} ph="BBX Youth Tryout" />
          <IF label="Gender"        value={t.gender}      onChange={setT("gender") as (v:string)=>void}   ph="Boys / Girls / Boys & Girls" />
          <IF label="Grade Levels"  value={t.gradeLevels} onChange={setT("gradeLevels") as (v:string)=>void} ph="3rd – 8th Grade" />
          <IF label="Location Name" value={t.location}    onChange={setT("location") as (v:string)=>void} ph="Hillsboro High School" />
          <IF label="Address"       value={t.address}     onChange={setT("address") as (v:string)=>void}  ph="3285 SE Rood Bridge Rd, Hillsboro, OR" />
          <IF label="Price ($)"     value={String(t.price)}      onChange={v => setT("price")(parseFloat(v)||0)} type="number" ph="250" />
          <IF label="Service Fee ($)" value={String(t.serviceFee)} onChange={v => setT("serviceFee")(parseFloat(v)||0)} type="number" ph="6.25" />
        </div>
        <ImageField label="Event Image" value={t.imageUrl} onChange={setT("imageUrl") as (v:string)=>void} adminKey={adminKey} />
        <TF label="About / Event Description" value={t.aboutText} onChange={setT("aboutText") as (v:string)=>void} rows={5} ph="Describe the tryout — what to expect, evaluation criteria, etc." />
        <TF label="Financial Assistance Note" value={t.financialNote} onChange={setT("financialNote") as (v:string)=>void} rows={2} ph="If you need financial assistance, please contact us at…" />

        {/* Sessions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-gray-400 text-xs font-semibold">Tryout Sessions / Schedule</label>
            <button type="button" onClick={addSession}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Add Session
            </button>
          </div>
          <div className="space-y-2">
            {t.sessions.map((s, i) => (
              <div key={s.id} className="flex gap-2 items-start">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input value={s.label} onChange={e => setSession(i, "label", e.target.value)}
                    placeholder="e.g. Sunday October 27th"
                    className="px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500" />
                  <input value={s.time} onChange={e => setSession(i, "time", e.target.value)}
                    placeholder="e.g. 4:00 PM – 5:30 PM"
                    className="px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <button type="button" onClick={() => removeSession(i)}
                  className="p-2 text-gray-600 hover:text-red-400 transition-colors mt-0.5">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end"><SaveBtn k="tryout" save={save} saving={saving} saved={saved} /></div>
      </Section>

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <Section openId={section} setOpenId={setSection} id="navbar" title="🔗 Navigation Bar">
        <div className="grid sm:grid-cols-2 gap-3">
          <IF label="Site Name"  value={n.siteName} onChange={setN("siteName") as (v:string)=>void} ph="HILHI" />
          <IF label="Tagline"    value={n.tagline}  onChange={setN("tagline")  as (v:string)=>void} ph="Youth Basketball" />
        </div>

        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Navigation Link Labels <span className="text-gray-600 normal-case font-normal">(leave blank to use defaults)</span></p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <IF label="Home"           value={n.labelHome         ?? ""} onChange={setN("labelHome")         as (v:string)=>void} ph="Home" />
            <IF label="About"          value={n.labelAbout        ?? ""} onChange={setN("labelAbout")        as (v:string)=>void} ph="About" />
            <IF label="Programs"       value={n.labelPrograms     ?? ""} onChange={setN("labelPrograms")     as (v:string)=>void} ph="Programs" />
            <IF label="Camps / Clinic" value={n.labelCamps        ?? ""} onChange={setN("labelCamps")        as (v:string)=>void} ph="Camps/Clinic" />
            <IF label="Tournaments"    value={n.labelTournaments  ?? ""} onChange={setN("labelTournaments")  as (v:string)=>void} ph="Tournaments" />
            <IF label="Youth Tryout"   value={n.labelTryout       ?? ""} onChange={setN("labelTryout")       as (v:string)=>void} ph="Youth Tryout" />
            <IF label="Youth Coaches"  value={n.labelYouthCoaches ?? ""} onChange={setN("labelYouthCoaches") as (v:string)=>void} ph="Youth Coaches" />
            <IF label="HS Coaches"     value={n.labelHSCoaches    ?? ""} onChange={setN("labelHSCoaches")    as (v:string)=>void} ph="HS Coaches" />
            <IF label="Merch"          value={n.labelMerch        ?? ""} onChange={setN("labelMerch")        as (v:string)=>void} ph="Merch" />
            <IF label="Film Room"      value={n.labelFilmRoom     ?? ""} onChange={setN("labelFilmRoom")     as (v:string)=>void} ph="Film Room" />
            <IF label="Contact"        value={n.labelContact      ?? ""} onChange={setN("labelContact")      as (v:string)=>void} ph="Contact" />
          </div>
        </div>

        <Toggle
          label="Show Tryout Link in Navigation"
          desc="Display the Tryouts page link in the top nav and mobile menu."
          checked={n.showTryouts}
          onChange={v => { setN("showTryouts")(v); save("navbar", { navbar: { ...n, showTryouts: v } }); }}
        />
        <div className="flex justify-end"><SaveBtn k="navbar" save={save} saving={saving} saved={saved} /></div>
      </Section>

      {/* ── Home Hero ────────────────────────────────────────────────────── */}

      {/* ── Page Browser Tab Titles ── */}
      <Section openId={section} setOpenId={setSection} id="pageTitles" title="🗂️ Page Browser Tab Titles">
        <p className="text-xs text-gray-500 mb-4">
          Customize what appears in the browser tab for each page. Leave blank to use the default title.
          The site name <span className="text-gray-400 font-semibold">"Hilhi Youth Basketball"</span> is added automatically after your title.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <IF label="🏠 Home"            value={pt.home         ?? ""} onChange={setPT("home")}         ph="Hilhi Youth Basketball | Hillsboro, OR" />
          <IF label="📅 Events"          value={pt.events       ?? ""} onChange={setPT("events")}       ph="Events" />
          <IF label="🏀 Camp Schedule"   value={pt.campSchedule ?? ""} onChange={setPT("campSchedule")} ph="Camp Schedule" />
          <IF label="🏆 Tournaments"     value={pt.tournaments  ?? ""} onChange={setPT("tournaments")}  ph="Tournaments" />
          <IF label="🎯 Youth Tryout"    value={pt.tryout       ?? ""} onChange={setPT("tryout")}       ph="Youth Tryout" />
          <IF label="👟 Youth Coaches"   value={pt.youthCoaches ?? ""} onChange={setPT("youthCoaches")} ph="Youth Coaches" />
          <IF label="🏫 HS Coaches"      value={pt.hsCoaches    ?? ""} onChange={setPT("hsCoaches")}    ph="HS Coaches" />
          <IF label="👕 Merch"           value={pt.merch        ?? ""} onChange={setPT("merch")}        ph="Merch" />
          <IF label="🎬 Film Room"       value={pt.filmRoom     ?? ""} onChange={setPT("filmRoom")}     ph="Film Room" />
          <IF label="📝 Camp Register"   value={pt.register     ?? ""} onChange={setPT("register")}     ph="Camp Registration" />
        </div>
        <div className="flex justify-end mt-2"><SaveBtn k="pageTitles" save={save} saving={saving} saved={saved} /></div>
      </Section>

      <Section openId={section} setOpenId={setSection} id="home" title="🏠 Home Page — Hero & About">
        <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Hero Banner</div>
        <div className="space-y-3">
          <IF label="Badge Text"    value={h.heroBadge}    onChange={setH("heroBadge")    as (v:string)=>void} ph="Hillsboro Youth Basketball" />
          <IF label="Main Title"    value={h.heroTitle}    onChange={setH("heroTitle")     as (v:string)=>void} ph="Building Champions On and Off the Court" />
          <TF label="Subtitle"      value={h.heroSubtitle} onChange={setH("heroSubtitle")  as (v:string)=>void} rows={2} ph="Where Hillsboro's youth develop skills…" />
          <ImageField label="Hero Background Image" value={h.heroImageUrl} onChange={setH("heroImageUrl") as (v:string)=>void} adminKey={adminKey} />
          <div className="grid grid-cols-3 gap-3">
            <IF label="Stat: Players" value={h.statsKids}    onChange={setH("statsKids")    as (v:string)=>void} ph="100+" />
            <IF label="Stat: Years"   value={h.statsYears}   onChange={setH("statsYears")   as (v:string)=>void} ph="5+" />
            <IF label="Stat: Coaches" value={h.statsCoaches} onChange={setH("statsCoaches") as (v:string)=>void} ph="20+" />
          </div>
        </div>

        <div className="border-t border-white/10 pt-4 mt-2">
          <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">About Section</div>
          <div className="space-y-3">
            <IF label="Section Badge"  value={h.aboutBadge}  onChange={setH("aboutBadge")  as (v:string)=>void} ph="Our Mission" />
            <IF label="Section Title"  value={h.aboutTitle}  onChange={setH("aboutTitle")   as (v:string)=>void} ph="About Hilhi Youth Basketball" />
            <TF label="Body Text"      value={h.aboutText}   onChange={setH("aboutText")    as (v:string)=>void} rows={4} ph="Leave blank to use default text." />
            <ImageField label="About Section Image" value={h.aboutImageUrl} onChange={setH("aboutImageUrl") as (v:string)=>void} adminKey={adminKey} />
          </div>
        </div>

        <div className="border-t border-white/10 pt-4 mt-2">
          <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">Quote Section</div>
          <div className="space-y-3">
            <TF label="Quote Text"     value={h.quoteText}   onChange={setH("quoteText")   as (v:string)=>void} rows={3} ph="Don't measure yourself by what you have accomplished…" />
            <div className="grid sm:grid-cols-2 gap-3">
              <IF label="Quote Author" value={h.quoteAuthor} onChange={setH("quoteAuthor") as (v:string)=>void} ph="John Wooden" />
              <IF label="Author Role"  value={h.quoteRole}   onChange={setH("quoteRole")   as (v:string)=>void} ph="10-time NCAA Champion Coach" />
            </div>
            <IF label="Donate Button URL" value={h.donateUrl} onChange={setH("donateUrl") as (v:string)=>void} ph="https://www.paypal.com/donate" />
          </div>
        </div>

        <div className="border-t border-white/10 pt-4 mt-2">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Program Cards</div>
            <span className="text-gray-600 text-xs">Shown on the home page Programs section</span>
          </div>
          {h.programCards.map((card, i) => (
            <div key={card.id} className="glass rounded-xl border border-white/10 p-4 mb-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-gray-400 text-xs font-semibold">Card {i+1}</div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-gray-500 text-xs">Highlighted (blue)</span>
                  <button type="button" onClick={() => setH("programCards")([...h.programCards.slice(0,i), {...card,highlight:!card.highlight}, ...h.programCards.slice(i+1)])}
                    className={`relative w-9 h-5 rounded-full transition-colors ${card.highlight ? "bg-blue-600" : "bg-white/20"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${card.highlight ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                </label>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <IF label="Icon (emoji)" value={card.icon}     onChange={v => setH("programCards")([...h.programCards.slice(0,i), {...card,icon:v},     ...h.programCards.slice(i+1)])} ph="🏀" />
                <IF label="Title"        value={card.title}    onChange={v => setH("programCards")([...h.programCards.slice(0,i), {...card,title:v},    ...h.programCards.slice(i+1)])} />
                <IF label="Subtitle"     value={card.subtitle} onChange={v => setH("programCards")([...h.programCards.slice(0,i), {...card,subtitle:v}, ...h.programCards.slice(i+1)])} ph="All Skill Levels" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <IF label="Tag / Badge"  value={card.tag}      onChange={v => setH("programCards")([...h.programCards.slice(0,i), {...card,tag:v},      ...h.programCards.slice(i+1)])} ph="Ages 5–14" />
                <IF label="Link (href)"  value={card.link}     onChange={v => setH("programCards")([...h.programCards.slice(0,i), {...card,link:v},      ...h.programCards.slice(i+1)])} ph="/events" />
              </div>
              <TF label="Description"    value={card.desc}     onChange={v => setH("programCards")([...h.programCards.slice(0,i), {...card,desc:v},     ...h.programCards.slice(i+1)])} rows={2} />
            </div>
          ))}
        </div>
        <div className="flex justify-end"><SaveBtn k="home" save={save} saving={saving} saved={saved} /></div>
      </Section>

      {/* ── Contact ──────────────────────────────────────────────────────── */}
      <Section openId={section} setOpenId={setSection} id="contact" title="📞 Contact Info & Social Links">
        <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Contact Details</div>
        <div className="grid sm:grid-cols-2 gap-3">
          <IF label="Email"   value={c.email}   onChange={setC("email")}   type="email" ph="info@hilhiyouthbbx.com" />
          <IF label="Phone"   value={c.phone}   onChange={setC("phone")}   ph="971-563-0552" />
        </div>
        <TF label="Address (use new line for each row)" value={c.address} onChange={setC("address")} rows={2} ph={"3285 SE Rood Bridge Rd.\nHillsboro, OR 97123"} />
        <div className="border-t border-white/10 pt-4 mt-1">
          <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Social Media URLs</div>
          <div className="grid sm:grid-cols-2 gap-3">
            <IF label="Instagram URL" value={c.instagram} onChange={setC("instagram")} ph="https://instagram.com/hilhiyouthbbx" />
            <IF label="Facebook URL"  value={c.facebook}  onChange={setC("facebook")}  ph="https://facebook.com/hilhiyouthbbx" />
            <IF label="YouTube URL"   value={c.youtube}   onChange={setC("youtube")}   ph="https://youtube.com/@hilhiyouthbbx" />
            <IF label="TikTok URL"    value={c.tiktok}    onChange={setC("tiktok")}    ph="https://tiktok.com/@hilhiyouthbbx" />
            <IF label="X / Twitter URL" value={c.twitter} onChange={setC("twitter")}  ph="https://x.com/hilhiyouthbbx" />
          </div>
        </div>
        <div className="flex justify-end"><SaveBtn k="contact" save={save} saving={saving} saved={saved} /></div>
      </Section>

      {/* ── Camps & Clinics ──────────────────────────────────────────────── */}
      <Section openId={section} setOpenId={setSection} id="camps" title="⚡ Events & Camps Page">
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <IF label="Page Title"    value={content.camps.pageTitle}    onChange={v => setContent(p => p ? {...p, camps:{...p.camps,pageTitle:v}} : p)} />
          <IF label="Page Subtitle" value={content.camps.pageSubtitle} onChange={v => setContent(p => p ? {...p, camps:{...p.camps,pageSubtitle:v}} : p)} />
        </div>
        <div className="space-y-3 mb-3">
          {content.camps.items.map(item => (
            <div key={item.id} className="glass rounded-xl border border-white/10 p-4 flex items-start gap-3">
              {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-white font-semibold text-sm">{item.title || "Untitled"}</div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${item.enabled ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-500"}`}>
                    {item.enabled ? "Visible" : "Hidden"}
                  </span>
                </div>
                <div className="text-gray-500 text-xs">{item.date} {item.price ? `· ${item.price}` : ""}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditCamp(item)} className="p-2 glass rounded-lg hover:border-blue-500/40 text-gray-400 hover:text-white transition-all border border-white/15"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => deleteCampItem(item.id)} className="p-2 glass rounded-lg hover:border-red-500/40 text-gray-400 hover:text-red-400 transition-all border border-white/15"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
          {content.camps.items.length === 0 && <p className="text-gray-600 text-sm text-center py-4">No camps/clinics added yet.</p>}
        </div>
        <button onClick={() => setEditCamp({ id:"", title:"", date:"", description:"", imageUrl:"", price:"", enabled:true })}
          className="w-full py-2.5 glass border border-dashed border-white/20 hover:border-blue-500/40 text-gray-400 hover:text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Add Camp / Clinic
        </button>
        <div className="flex justify-end mt-2"><SaveBtn k="camps" save={save} saving={saving} saved={saved} /></div>
      </Section>

      {/* ── Merch Page ───────────────────────────────────────────────────── */}
      <Section openId={section} setOpenId={setSection} id="merch" title="👕 Merch Page">
        <div className="grid sm:grid-cols-2 gap-3">
          <IF label="Page Title"    value={m.pageTitle}    onChange={setM("pageTitle")    as (v:string)=>void} ph="Official Merchandise" />
          <IF label="Page Subtitle" value={m.pageSubtitle} onChange={setM("pageSubtitle") as (v:string)=>void} ph="Rep your team with official apparel." />
        </div>
        <Toggle
          label="Show Announcement Banner"
          desc="Display a notice/banner at the top of the merch page."
          checked={m.showAnnouncement}
          onChange={v => setM("showAnnouncement")(v)}
        />
        {m.showAnnouncement && (
          <TF label="Announcement Text" value={m.announcementText} onChange={setM("announcementText") as (v:string)=>void} rows={2} ph="New hoodies just dropped! Order by Dec 1st for holiday delivery." />
        )}

        {/* Products */}
        <div className="border-t border-white/10 pt-4 mt-2">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Products ({m.products.length})</div>
          </div>
          <div className="space-y-2 mb-3">
            {m.products.map((prod, i) => (
              <div key={prod.id} className="glass rounded-xl border border-white/10 p-3 flex items-center gap-3">
                {prod.imageUrl && <img src={prod.imageUrl} alt={prod.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-white/5" />}
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-semibold truncate">{prod.name}</div>
                  <div className="text-gray-500 text-xs">${prod.price} · {prod.cat}</div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setEditMerchProd(prod)} className="p-2 glass rounded-lg hover:border-blue-500/40 text-gray-400 hover:text-white transition-all border border-white/15"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => {
                    const products = m.products.filter((_,j) => j !== i);
                    setContent(p => p ? {...p, merch:{...p.merch, products}} : p);
                  }} className="p-2 glass rounded-lg hover:border-red-500/40 text-gray-400 hover:text-red-400 transition-all border border-white/15"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setEditMerchProd({ id:"", name:"", price:20, cat:"hoodie", imageUrl:"" })}
            className="w-full py-2.5 glass border border-dashed border-white/20 hover:border-blue-500/40 text-gray-400 hover:text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
        <div className="flex justify-end mt-2"><SaveBtn k="merch" save={save} saving={saving} saved={saved} /></div>
      </Section>

      {/* ── Film Room ───────────────────────────────────────────────────── */}
      <Section openId={section} setOpenId={setSection} id="videoRoom" title="🎬 Team Film Room">
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs mb-3">
          Players access this page at <strong>/film-room</strong> using the team password below.
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <IF label="Page Title"    value={content.videoRoom.title}    onChange={v => setContent(p => p ? {...p, videoRoom:{...p.videoRoom,title:v}} : p)} />
          <IF label="Team Password" value={content.videoRoom.password} onChange={v => setContent(p => p ? {...p, videoRoom:{...p.videoRoom,password:v}} : p)} ph="hilhi-team" />
        </div>
        <TF label="Page Subtitle" value={content.videoRoom.subtitle} onChange={v => setContent(p => p ? {...p, videoRoom:{...p.videoRoom,subtitle:v}} : p)} rows={2} />

        {/* Videos list */}
        <div className="border-t border-white/10 pt-4 mt-2">
          <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">Videos &amp; Streams ({content.videoRoom.videos.length})</div>
          <div className="space-y-2 mb-3">
            {content.videoRoom.videos.map((vid, i) => (
              <div key={vid.id} className="glass rounded-xl border border-white/10 p-3 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base ${vid.isLive ? "bg-red-600/20" : "bg-blue-600/20"}`}>
                  {vid.type === "stream" ? "📡" : "🎬"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-semibold truncate">{vid.title}</span>
                    {vid.isLive && <span className="flex-shrink-0 text-xs bg-red-600 text-white font-bold px-1.5 py-0.5 rounded uppercase">LIVE</span>}
                    {!vid.enabled && <span className="flex-shrink-0 text-xs bg-white/10 text-gray-400 font-bold px-1.5 py-0.5 rounded">Hidden</span>}
                  </div>
                  <div className="text-gray-600 text-xs truncate">{vid.url}</div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setEditVideo(vid)} className="p-2 glass rounded-lg hover:border-blue-500/40 text-gray-400 hover:text-white transition-all border border-white/15"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => {
                    const videos = content.videoRoom.videos.filter((_,j) => j !== i);
                    setContent(p => p ? {...p, videoRoom:{...p.videoRoom, videos}} : p);
                  }} className="p-2 glass rounded-lg hover:border-red-500/40 text-gray-400 hover:text-red-400 transition-all border border-white/15"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
          {content.videoRoom.videos.length === 0 && (
            <p className="text-gray-600 text-xs text-center py-3 mb-3">No videos added yet. Click below to add your first video or stream link.</p>
          )}
          <button onClick={() => setEditVideo({ id:"", title:"", description:"", type:"video", url:"", thumbnail:"", date:"", enabled:true, isLive:false })}
            className="w-full py-2.5 glass border border-dashed border-white/20 hover:border-blue-500/40 text-gray-400 hover:text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Add Video / Stream
          </button>
        </div>
        <div className="flex justify-end mt-2"><SaveBtn k="videoRoom" save={save} saving={saving} saved={saved} /></div>
      </Section>

      {/* ── Youth Coaches ────────────────────────────────────────────────── */}
      <Section openId={section} setOpenId={setSection} id="youthCoaches" title="🏀 Youth Coaches Page">
        <TF label="Intro Text" value={content.youthCoaches.intro} onChange={v => setContent(p => p ? {...p, youthCoaches:{...p.youthCoaches,intro:v}} : p)} rows={2} />
        <div className="space-y-3 mb-3">
          {content.youthCoaches.coaches.map(coach => (
            <div key={coach.id} className="glass rounded-xl border border-white/10 p-4 flex items-center gap-3">
              {coach.imageUrl && <img src={coach.imageUrl} alt={coach.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />}
              <div className="flex-1">
                <div className="text-white font-semibold text-sm">{coach.name}</div>
                <div className="text-gray-500 text-xs">{coach.title}{(coach.roster?.length ?? 0) > 0 ? ` · ${coach.roster!.length} players` : ""}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditCoach({ type:"youth", coach })} className="p-2 glass rounded-lg hover:border-blue-500/40 text-gray-400 hover:text-white transition-all border border-white/15"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => deleteCoach("youth", coach.id)} className="p-2 glass rounded-lg hover:border-red-500/40 text-gray-400 hover:text-red-400 transition-all border border-white/15"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => setEditCoach({ type:"youth", coach:{ id:"", name:"", title:"", bio:"", imageUrl:"", email:"", roster:[] } })}
          className="w-full py-2.5 glass border border-dashed border-white/20 hover:border-blue-500/40 text-gray-400 hover:text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Add Youth Coach
        </button>
        <div className="flex justify-end mt-2"><SaveBtn k="youthCoaches" save={save} saving={saving} saved={saved} /></div>
      </Section>

      {/* ── HS Coaches ───────────────────────────────────────────────────── */}
      <Section openId={section} setOpenId={setSection} id="hsCoaches" title="🎓 High School Coaches Page">
        <TF label="Intro Text" value={content.hsCoaches.intro} onChange={v => setContent(p => p ? {...p, hsCoaches:{...p.hsCoaches,intro:v}} : p)} rows={2} />

        {/* ── Featured (Head) Coach ── */}
        <div className="mt-4 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-white font-bold text-sm">Featured / Head Coach Card</span>
            <span className="ml-auto text-gray-500 text-xs">Displayed prominently at top of page</span>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <IF label="Coach Name" value={content.hsCoaches.featuredCoach.name} onChange={v => setContent(p => p ? {...p, hsCoaches:{...p.hsCoaches, featuredCoach:{...p.hsCoaches.featuredCoach, name:v}}} : p)} ph="Samedy Kem" />
              <IF label="Title / Role" value={content.hsCoaches.featuredCoach.title} onChange={v => setContent(p => p ? {...p, hsCoaches:{...p.hsCoaches, featuredCoach:{...p.hsCoaches.featuredCoach, title:v}}} : p)} ph="Boys Varsity Head Coach" />
            </div>
            <ImageField label="Photo" value={content.hsCoaches.featuredCoach.photo} onChange={v => setContent(p => p ? {...p, hsCoaches:{...p.hsCoaches, featuredCoach:{...p.hsCoaches.featuredCoach, photo:v}}} : p)} adminKey={adminKey} />

            {/* Bio paragraphs */}
            <div>
              <label className="block text-gray-400 text-xs font-semibold mb-2">Bio Paragraphs <span className="text-gray-600 font-normal">(each entry = one paragraph)</span></label>
              <div className="space-y-2">
                {(content.hsCoaches.featuredCoach.bioParas ?? []).map((para, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <textarea
                      rows={3} value={para}
                      onChange={e => {
                        const updated = [...content.hsCoaches.featuredCoach.bioParas];
                        updated[idx] = e.target.value;
                        setContent(p => p ? {...p, hsCoaches:{...p.hsCoaches, featuredCoach:{...p.hsCoaches.featuredCoach, bioParas:updated}}} : p);
                      }}
                      className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    />
                    <button onClick={() => {
                      const updated = content.hsCoaches.featuredCoach.bioParas.filter((_,i)=>i!==idx);
                      setContent(p => p ? {...p, hsCoaches:{...p.hsCoaches, featuredCoach:{...p.hsCoaches.featuredCoach, bioParas:updated}}} : p);
                    }} className="mt-1 p-2 glass rounded-lg hover:border-red-500/40 text-gray-400 hover:text-red-400 transition-all border border-white/15 flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={() => {
                const updated = [...(content.hsCoaches.featuredCoach.bioParas ?? []), ""];
                setContent(p => p ? {...p, hsCoaches:{...p.hsCoaches, featuredCoach:{...p.hsCoaches.featuredCoach, bioParas:updated}}} : p);
              }} className="mt-2 w-full py-2 glass border border-dashed border-white/20 hover:border-blue-500/40 text-gray-400 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2">
                <Plus className="w-3.5 h-3.5" /> Add Bio Paragraph
              </button>
            </div>

            {/* Stats grid */}
            <div>
              <label className="block text-gray-400 text-xs font-semibold mb-2">Stats Grid <span className="text-gray-600 font-normal">(shown beneath bio)</span></label>
              <div className="space-y-2">
                {(content.hsCoaches.featuredCoach.stats ?? []).map((stat, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input value={stat.value} placeholder="Value (e.g. 30+)"
                      onChange={e => {
                        const updated = content.hsCoaches.featuredCoach.stats.map((s,i) => i===idx ? {...s, value:e.target.value} : s);
                        setContent(p => p ? {...p, hsCoaches:{...p.hsCoaches, featuredCoach:{...p.hsCoaches.featuredCoach, stats:updated}}} : p);
                      }}
                      className="w-32 px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
                    <input value={stat.label} placeholder="Label (e.g. Years Coaching)"
                      onChange={e => {
                        const updated = content.hsCoaches.featuredCoach.stats.map((s,i) => i===idx ? {...s, label:e.target.value} : s);
                        setContent(p => p ? {...p, hsCoaches:{...p.hsCoaches, featuredCoach:{...p.hsCoaches.featuredCoach, stats:updated}}} : p);
                      }}
                      className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
                    <button onClick={() => {
                      const updated = content.hsCoaches.featuredCoach.stats.filter((_,i)=>i!==idx);
                      setContent(p => p ? {...p, hsCoaches:{...p.hsCoaches, featuredCoach:{...p.hsCoaches.featuredCoach, stats:updated}}} : p);
                    }} className="p-2 glass rounded-lg hover:border-red-500/40 text-gray-400 hover:text-red-400 transition-all border border-white/15 flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={() => {
                const updated = [...(content.hsCoaches.featuredCoach.stats ?? []), { value:"", label:"" }];
                setContent(p => p ? {...p, hsCoaches:{...p.hsCoaches, featuredCoach:{...p.hsCoaches.featuredCoach, stats:updated}}} : p);
              }} className="mt-2 w-full py-2 glass border border-dashed border-white/20 hover:border-blue-500/40 text-gray-400 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2">
                <Plus className="w-3.5 h-3.5" /> Add Stat
              </button>
            </div>
          </div>
        </div>

        {/* ── Assistant coaches list ── */}
        <div className="mt-4">
          <label className="block text-gray-400 text-xs font-semibold mb-2">Assistant / Staff Coaches <span className="text-gray-600 font-normal">(replaces the 4 default assistant coach cards)</span></label>
          <div className="space-y-3 mb-3">
            {content.hsCoaches.coaches.map(coach => (
              <div key={coach.id} className="glass rounded-xl border border-white/10 p-4 flex items-center gap-3">
                {coach.imageUrl && <img src={coach.imageUrl} alt={coach.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />}
                <div className="flex-1">
                  <div className="text-white font-semibold text-sm">{coach.name}</div>
                  <div className="text-gray-500 text-xs">{coach.title}{coach.email ? ` · ${coach.email}` : ""}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditCoach({ type:"hs", coach })} className="p-2 glass rounded-lg hover:border-blue-500/40 text-gray-400 hover:text-white transition-all border border-white/15"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deleteCoach("hs", coach.id)} className="p-2 glass rounded-lg hover:border-red-500/40 text-gray-400 hover:text-red-400 transition-all border border-white/15"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
          {content.hsCoaches.coaches.length === 0 && (
            <p className="text-gray-600 text-xs text-center py-3 mb-3">All coaches shown on the website are listed here. Edit or delete any coach, or add new ones.</p>
          )}
          <button onClick={() => setEditCoach({ type:"hs", coach:{ id:"", name:"", title:"", bio:"", imageUrl:"", email:"" } })}
            className="w-full py-2.5 glass border border-dashed border-white/20 hover:border-blue-500/40 text-gray-400 hover:text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Add Assistant Coach
          </button>
        </div>

        <div className="flex justify-end mt-2"><SaveBtn k="hsCoaches" save={save} saving={saving} saved={saved} /></div>
      </Section>

      {/* ── Modal: Edit Camp ─────────────────────────────────────────────── */}
      {editCamp && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-2xl border border-blue-500/30 p-6 w-full max-w-lg space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-bold">{editCamp.id ? "Edit Camp/Clinic" : "New Camp/Clinic"}</h3>
              <button onClick={() => setEditCamp(null)}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
            </div>
            <Toggle label="Visible on Website" desc="Toggle to show or hide this event from the Events page." checked={editCamp.enabled} onChange={v => setEditCamp(p=>p?{...p,enabled:v}:p)} />
            <IF label="Title *"     value={editCamp.title}       onChange={v => setEditCamp(p=>p?{...p,title:v}:p)} required />
            <IF label="Date"        value={editCamp.date}        onChange={v => setEditCamp(p=>p?{...p,date:v}:p)} ph="July 14–16, 2026" />
            <IF label="Price"       value={editCamp.price}       onChange={v => setEditCamp(p=>p?{...p,price:v}:p)} ph="$150 per camper" />
            <TF label="Description" value={editCamp.description} onChange={v => setEditCamp(p=>p?{...p,description:v}:p)} rows={3} />
            <ImageField label="Image" value={editCamp.imageUrl}  onChange={v => setEditCamp(p=>p?{...p,imageUrl:v}:p)} adminKey={adminKey} />
            <div className="flex gap-3 pt-2">
              <button onClick={() => saveCampItem(editCamp)} className="flex-1 py-3 bg-gradient-to-r from-[#006aff] to-[#00aaff] text-white font-black rounded-xl flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Save</button>
              <button onClick={() => setEditCamp(null)} className="px-5 py-3 glass border border-white/15 text-gray-400 hover:text-white font-semibold rounded-xl">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Edit Video / Stream ──────────────────────────────────── */}
      {editVideo && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-2xl border border-blue-500/30 p-6 w-full max-w-lg space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-bold">{editVideo.id ? "Edit Video" : "New Video / Stream"}</h3>
              <button onClick={() => setEditVideo(null)}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
            </div>

            {/* Visible & Live toggles */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <button type="button" onClick={() => setEditVideo(p => p ? {...p, enabled:!p.enabled} : p)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${editVideo.enabled ? "bg-blue-600" : "bg-white/20"}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${editVideo.enabled ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
                <span className="text-gray-400 text-xs">Visible to players</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <button type="button" onClick={() => setEditVideo(p => p ? {...p, isLive:!p.isLive} : p)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${editVideo.isLive ? "bg-red-600" : "bg-white/20"}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${editVideo.isLive ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
                <span className="text-gray-400 text-xs">🔴 Show LIVE badge</span>
              </label>
            </div>

            {/* Type */}
            <div>
              <label className="block text-gray-400 text-xs font-semibold mb-1">Type</label>
              <div className="flex gap-2">
                {(["video","stream"] as const).map(t => (
                  <button key={t} type="button" onClick={() => setEditVideo(p => p ? {...p, type:t} : p)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${editVideo.type === t ? "bg-blue-600 text-white" : "glass border border-white/15 text-gray-400 hover:text-white"}`}>
                    {t === "video" ? "🎬 Recorded Video" : "📡 Live Stream Link"}
                  </button>
                ))}
              </div>
            </div>

            <IF label="Title *" value={editVideo.title} onChange={v => setEditVideo(p => p ? {...p, title:v} : p)} required ph="Film Session — June 10" />
            <TF label="Description" value={editVideo.description} onChange={v => setEditVideo(p => p ? {...p, description:v} : p)} rows={2} ph="Post-game film review vs. Lincoln..." />
            <div>
              <IF label="Video URL *" value={editVideo.url} onChange={v => setEditVideo(p => p ? {...p, url:v} : p)} required ph="https://youtube.com/watch?v=... or direct .mp4 link" />
              <p className="text-gray-600 text-xs mt-1">Supports: YouTube, YouTube Live, Vimeo, direct .mp4 links, or any embed URL.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ImageField label="Thumbnail (optional)" value={editVideo.thumbnail} onChange={v => setEditVideo(p => p ? {...p, thumbnail:v} : p)} adminKey={adminKey} />
              <IF label="Date" value={editVideo.date} onChange={v => setEditVideo(p => p ? {...p, date:v} : p)} ph="June 10, 2026" />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => {
                if (!editVideo.title || !editVideo.url) return;
                const vid = { ...editVideo, id: editVideo.id || makeId() };
                const videos = [...content.videoRoom.videos.filter(v => v.id !== vid.id), vid];
                save("videoRoom", { videoRoom: { ...content.videoRoom, videos } });
                setEditVideo(null);
              }} className="flex-1 py-3 bg-gradient-to-r from-[#006aff] to-[#00aaff] text-white font-black rounded-xl flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Save</button>
              <button onClick={() => setEditVideo(null)} className="px-5 py-3 glass border border-white/15 text-gray-400 hover:text-white font-semibold rounded-xl">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Edit Merch Product ──────────────────────────────────── */}
      {editMerchProd && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-2xl border border-blue-500/30 p-6 w-full max-w-lg space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-bold">{editMerchProd.id ? "Edit Product" : "New Product"}</h3>
              <button onClick={() => setEditMerchProd(null)}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
            </div>
            <IF label="Product Name *" value={editMerchProd.name} onChange={v => setEditMerchProd(p => p ? {...p, name:v} : p)} required ph="White Head – Royal Blue Hoodie" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 text-xs font-semibold mb-1">Price ($)</label>
                <input type="number" min="0" step="1" value={editMerchProd.price}
                  onChange={e => setEditMerchProd(p => p ? {...p, price:Number(e.target.value)} : p)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-semibold mb-1">Category</label>
                <select value={editMerchProd.cat} onChange={e => setEditMerchProd(p => p ? {...p, cat:e.target.value} : p)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="hoodie">Hoodie</option>
                  <option value="long-sleeve">Long Sleeve</option>
                  <option value="short-sleeve">Short Sleeve</option>
                </select>
              </div>
            </div>
            <ImageField label="Product Image" value={editMerchProd.imageUrl} onChange={v => setEditMerchProd(p => p ? {...p, imageUrl:v} : p)} adminKey={adminKey} />
            <div className="flex gap-3 pt-2">
              <button onClick={() => {
                if (!editMerchProd.name) return;
                const prod = { ...editMerchProd, id: editMerchProd.id || makeId() };
                const products = [...content.merch.products.filter(p => p.id !== prod.id), prod];
                save("merch", { merch: { ...content.merch, products } });
                setEditMerchProd(null);
              }} className="flex-1 py-3 bg-gradient-to-r from-[#006aff] to-[#00aaff] text-white font-black rounded-xl flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Save</button>
              <button onClick={() => setEditMerchProd(null)} className="px-5 py-3 glass border border-white/15 text-gray-400 hover:text-white font-semibold rounded-xl">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Edit Coach ────────────────────────────────────────────── */}
      {editCoach.coach && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-2xl border border-blue-500/30 p-6 w-full max-w-lg space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-bold">{editCoach.coach.id ? "Edit Coach" : "New Coach"}</h3>
              <button onClick={() => setEditCoach({ type:"youth", coach:null })}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
            </div>
            <IF label="Name *"  value={editCoach.coach.name}  onChange={v => setEditCoach(p=>({...p, coach:p.coach?{...p.coach,name:v}:null}))} required />
            <IF label="Title"   value={editCoach.coach.title} onChange={v => setEditCoach(p=>({...p, coach:p.coach?{...p.coach,title:v}:null}))} ph="Head Coach" />
            <IF label="Email"   value={editCoach.coach.email ?? ""} onChange={v => setEditCoach(p=>({...p, coach:p.coach?{...p.coach,email:v}:null}))} ph="coach@example.com" />
            <TF label="Bio (separate paragraphs with a blank line)" value={editCoach.coach.bio} onChange={v => setEditCoach(p=>({...p, coach:p.coach?{...p.coach,bio:v}:null}))} rows={5} />
            <ImageField label="Photo" value={editCoach.coach.imageUrl} onChange={v => setEditCoach(p=>({...p, coach:p.coach?{...p.coach,imageUrl:v}:null}))} adminKey={adminKey} />
            {/* Roster — only shown for youth coaches */}
            {editCoach.type === "youth" && (
              <div>
                <label className="block text-gray-400 text-xs font-semibold mb-2">
                  Roster <span className="text-gray-600 font-normal">(player names — one per line)</span>
                </label>
                <textarea
                  rows={6}
                  value={(editCoach.coach.roster ?? []).join("\n")}
                  onChange={e => {
                    const roster = e.target.value.split("\n").map(s => s.trim()).filter(Boolean);
                    setEditCoach(p=>({...p, coach:p.coach?{...p.coach,roster}:null}));
                  }}
                  placeholder={"Player Name\nAnother Player\n..."}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
                <p className="text-gray-600 text-xs mt-1">{(editCoach.coach.roster?.length ?? 0)} players on roster</p>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={() => editCoach.coach && saveCoach(editCoach.type, editCoach.coach)} className="flex-1 py-3 bg-gradient-to-r from-[#006aff] to-[#00aaff] text-white font-black rounded-xl flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Save</button>
              <button onClick={() => setEditCoach({ type:"youth", coach:null })} className="px-5 py-3 glass border border-white/15 text-gray-400 hover:text-white font-semibold rounded-xl">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main admin page
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [authed,   setAuthed]   = useState(false);
  const [password, setPassword] = useState("");
  const [pwErr,    setPwErr]    = useState("");
  const [tab,      setTab]      = useState<Tab>("contacts");

  // Contacts
  const [contacts,      setContacts]      = useState<Contact[]>([]);
  const [sourceFilter,  setSourceFilter]  = useState("all");
  const [tournFilter,   setTournFilter]   = useState("all");
  const [contactsLoaded,setContactsLoaded]= useState(false);
  const [expandedContact, setExpandedContact] = useState<string|null>(null);
  const [editingContact,  setEditingContact]  = useState<Contact|null>(null);
  const [editPatch,       setEditPatch]       = useState<Partial<Contact>>({});
  const [editSaving,      setEditSaving]      = useState(false);
  const [isNewContact,    setIsNewContact]    = useState(false);

  // Tournaments
  const [tournaments,   setTournaments]   = useState<TournamentConfig[]>([]);
  const [editingTourn,  setEditingTourn]  = useState<TournamentConfig | null>(null);
  const [addingTourn,   setAddingTourn]   = useState(false);
  const [copyTemplate,  setCopyTemplate]  = useState<TournamentConfig | null>(null);
  const [tournLoaded,   setTournLoaded]   = useState(false);

  const adminKey = password || "hilhi-admin";

  function login(e: React.FormEvent) {
    e.preventDefault();
    fetch(`/api/admin/contacts?key=${password}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(() => setAuthed(true))
      .catch(() => setPwErr("Incorrect password."));
  }

  useEffect(() => {
    if (!authed) return;
    if ((tab === "contacts" || tab === "tourney") && !contactsLoaded) {
      fetch(`/api/admin/contacts?key=${adminKey}`).then(r=>r.json()).then(d => { setContacts(Array.isArray(d) ? d : (d.contacts ?? [])); setContactsLoaded(true); });
    }
    if ((tab === "tournaments" || tab === "tourney") && !tournLoaded) {
      fetch(`/api/tournament?key=${adminKey}`).then(r=>r.json()).then(d => { setTournaments(d); setTournLoaded(true); });
    }
  }, [authed, tab]);

  async function saveContactEdit() {
    if (!editingContact) return;
    setEditSaving(true);
    await fetch(`/api/admin/contacts?key=${adminKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", id: editingContact.id, patch: editPatch }),
    });
    setContacts(prev => prev.map(c => c.id === editingContact.id ? { ...c, ...editPatch } : c));
    setEditSaving(false);
    setEditingContact(null);
    setEditPatch({});
  }

  async function saveNewContact() {
    setEditSaving(true);
    const body = { ...editingContact!, ...editPatch };
    // Remove id/date — server assigns them
    const { id: _id, date: _date, ...contactData } = body as Contact & { id: string; date: string };
    void _id; void _date;
    const res = await fetch(`/api/admin/contacts?key=${adminKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", contact: contactData }),
    });
    const data = await res.json();
    if (data.contact) setContacts(prev => [data.contact, ...prev]);
    setEditSaving(false);
    setEditingContact(null);
    setEditPatch({});
    setIsNewContact(false);
  }

  async function deleteContact(id: string) {
    await fetch(`/api/admin/contacts?key=${adminKey}`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"delete", id }) });
    setContacts(prev => prev.filter(c => c.id !== id));
  }

  async function toggleTournament(t: TournamentConfig) {
    const updated = { ...t, enabled: !t.enabled };
    await fetch(`/api/tournament?key=${adminKey}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(updated) });
    setTournaments(prev => prev.map(x => x.id===t.id ? updated : x));
  }

  async function deleteTournamentAdmin(id: string) {
    if (!confirm("Delete this tournament?")) return;
    await fetch(`/api/tournament?key=${adminKey}&id=${id}`, { method:"DELETE" });
    setTournaments(prev => prev.filter(t => t.id !== id));
  }

  function copyTournament(t: TournamentConfig) {
    setCopyTemplate({
      ...t,
      id:      "",
      name:    "Copy of " + t.name,
      enabled: false,
    });
    setAddingTourn(true);
    setEditingTourn(null);
  }

  function handleTournSaved(saved: TournamentConfig) {
    setTournaments(prev => {
      const idx = prev.findIndex(t => t.id === saved.id);
      return idx !== -1 ? prev.map((t,i) => i===idx ? saved : t) : [...prev, saved];
    });
    setEditingTourn(null); setAddingTourn(false);
  }

  // Derived contact data
  const tournamentNames = [...new Set(contacts.filter(c=>c.source==="tournament"&&c.tournamentName).map(c=>c.tournamentName!))];
  const isCampSource = (src: string) =>
    src === "registration" || src.includes("Camp") || src.includes("Summer");

  const filtered = contacts.filter(c => {
    if (sourceFilter !== "all") {
      // "2026 Youth Summer Camp" filter matches all camp-type sources
      if (isCampSource(sourceFilter) ? !isCampSource(c.source) : c.source !== sourceFilter) return false;
    }
    if (tournFilter !== "all" && c.tournamentName !== tournFilter) return false;
    return true;
  });

  const stats = {
    total:      contacts.length,
    reg:        contacts.filter(c=>c.source==="registration"||c.source.includes("Camp")||c.source.includes("Summer")).length,
    tournament: contacts.filter(c=>c.source==="tournament").length,
    merch:      contacts.filter(c=>c.source==="merch-order").length,
  };


  async function importCSV(file: File) {
    const text = await file.text();
    const res = await fetch(`/api/admin/contacts?key=${adminKey}&action=import`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: text,
    });
    const data = await res.json();
    if (data.imported !== undefined) {
      alert(`Successfully imported ${data.imported} contacts!`);
      fetch(`/api/admin/contacts?key=${adminKey}`).then(r=>r.json()).then(d => { setContacts(Array.isArray(d) ? d : (d.contacts ?? [])); setContactsLoaded(true); });
    } else {
      alert(data.error || "Import failed");
    }
  }

    function esc(v: unknown) { return `"${String(v ?? "").replace(/"/g, '""')}"`; }

    function downloadCSV() {
      const today = new Date().toISOString().slice(0,10);
      let headers: string;
      let rows: string[];
      let filename: string;

      if (isCampSource(sourceFilter) && sourceFilter !== "all") {
        // ── Full Wix camp export — every field in its own column ──
        headers = [
          "Order Number","Order Date","Ticket Number","Ticket Type",
          "Camper Name","Grade","Gender","Shirt Size",
          "Parent Name","Email","Phone",
          "Emergency Contact","Emergency Phone",
          "Ticket Price","Total Amount","Tax","Wix Service Fee","Ticket Revenue",
          "Payment Status","Checked In","Seat Info","Benefit","Coupon",
          "Registered Date",
        ].join(",");
        rows = filtered.map(c => [
          c.orderNumber||"", c.orderDate||"", c.ticketNum||"", c.ticketType||"",
          c.camperName||"", c.grade||"", c.gender||"", c.shirtSize||"",
          c.name, c.email, c.phone,
          c.emergencyContact||"", c.emergencyPhone||"",
          c.ticketPrice||"", c.amountPaid||"", c.tax||"", c.wixServiceFee||"", c.ticketRevenue||"",
          c.paymentStatus||"", c.checkedIn||"", c.seatInfo||"", c.benefit||"", c.coupon||"",
          c.date ? new Date(c.date).toLocaleDateString() : "",
        ].map(esc).join(","));
        filename = `2026-youth-summer-camp-${today}.csv`;

      } else if (sourceFilter === "tournament") {
        headers = "Name,Email,Phone,Tournament,Team Name,Division,Notes,Date";
        rows    = filtered.map(c => [c.name,c.email,c.phone,c.tournamentName||"",c.teamName||"",c.division||"",c.notes||"",c.date].map(esc).join(","));
        filename = tournFilter !== "all"
          ? `${tournFilter.toLowerCase().replace(/\s+/g,"-")}-registrations-${today}.csv`
          : `tournament-registrations-${today}.csv`;

      } else if (sourceFilter === "merch-order") {
        headers = "Name,Email,Phone,Notes,Date";
        rows    = filtered.map(c => [c.name,c.email,c.phone,c.notes||"",c.date].map(esc).join(","));
        filename = `merch-orders-${today}.csv`;

      } else {
        // All sources — full columns
        headers = [
          "Source","Order Number","Order Date",
          "Camper Name","Grade","Gender","Shirt Size",
          "Parent Name","Email","Phone",
          "Emergency Contact","Emergency Phone",
          "Total Amount","Payment Status","Checked In",
          "Tournament","Team","Division","Date",
        ].join(",");
        rows    = filtered.map(c => [
          c.source, c.orderNumber||"", c.orderDate||"",
          c.camperName||"", c.grade||"", c.gender||"", c.shirtSize||"",
          c.name, c.email, c.phone,
          c.emergencyContact||"", c.emergencyPhone||"",
          c.amountPaid||"", c.paymentStatus||"", c.checkedIn||"",
          c.tournamentName||"", c.teamName||"", c.division||"",
          c.date ? new Date(c.date).toLocaleDateString() : "",
        ].map(esc).join(","));
        filename = `hilhi-all-contacts-${today}.csv`;
      }

      const csv = [headers, ...rows].join("\n");
      const a   = document.createElement("a");
      a.href     = URL.createObjectURL(new Blob(["\uFEFF"+csv], {type:"text/csv"}));
      a.download = filename; a.click();
    }

  // ── Login screen ─────────────────────────────────────────────────────────
  if (!authed) return (
    <main className="min-h-screen bg-[#080D1A] flex items-center justify-center px-4">
      <div className="w-full max-w-sm glass rounded-2xl border border-white/15 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="text-white font-black text-lg">Admin Dashboard</div>
            <div className="text-gray-500 text-xs">Hilhi Youth Basketball</div>
          </div>
        </div>
        <form onSubmit={login} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-xs font-semibold mb-1">Password</label>
            <input type="password" value={password} onChange={e => { setPassword(e.target.value); setPwErr(""); }} required autoFocus
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors" />
          </div>
          {pwErr && <p className="text-red-400 text-xs">{pwErr}</p>}
          <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all">Sign In</button>
        </form>
      </div>
    </main>
  );

  // ── Dashboard ─────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#080D1A]">
      {/* Header */}
      <div className="border-b border-white/10 px-4 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-blue-400" />
          <span className="text-white font-black text-lg">Admin Dashboard</span>
        </div>
        <button onClick={() => setAuthed(false)} className="flex items-center gap-1.5 text-gray-500 hover:text-white text-sm transition-colors">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 glass rounded-xl border border-white/10 p-1 w-fit">
          {([
            { id:"contacts",    icon:<Users    className="w-4 h-4"/>, label:"Contacts"    },
            { id:"tournaments", icon:<Trophy   className="w-4 h-4"/>, label:"Tournaments" },
            { id:"vouchers",    icon:<Tag      className="w-4 h-4"/>, label:"Vouchers"    },
            { id:"filmroom",    icon:<Video    className="w-4 h-4"/>, label:"Film Room"   },
            { id:"camp",        icon:<Trophy   className="w-4 h-4"/>, label:"Camp Hub"    },
            { id:"tourney",     icon:<Trophy   className="w-4 h-4"/>, label:"Tournament Manager" },
            { id:"pages",       icon:<FileText className="w-4 h-4"/>, label:"Pages"       },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab===t.id ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── CONTACTS TAB ── */}
        {/* ── Edit Contact Modal ── */}
        {editingContact && (() => {
          const isCamp = isCampSource(editingContact.source);
          const isTourn = editingContact.source === "tournament";
          function ef(label: string, key: keyof Contact, ph = "") {
            return (
              <div key={key}>
                <label className="block text-gray-400 text-xs font-semibold mb-1">{label}</label>
                <input
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-gray-600"
                  placeholder={ph}
                  value={(editPatch[key] ?? editingContact![key] ?? "") as string}
                  onChange={e => setEditPatch(p => ({ ...p, [key]: e.target.value }))}
                />
              </div>
            );
          }
          return (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditingContact(null)}>
              <div className="glass rounded-2xl border border-white/15 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-white/10">
                  <div>
                    <h3 className="text-white font-black text-lg">Edit Contact</h3>
                    {isNewContact ? (
                      <select
                        value={editPatch.source ?? editingContact!.source}
                        onChange={e => setEditPatch(p => ({ ...p, source: e.target.value }))}
                        className="mt-1 px-2 py-0.5 rounded-full text-xs font-bold bg-white/10 text-gray-300 border border-white/15 focus:outline-none">
                        <option value="other" className="bg-slate-900">Other</option>
                        <option value="tournament" className="bg-slate-900">Tournament</option>
                        <option value="2026 Youth Summer Camp" className="bg-slate-900">2026 Youth Summer Camp</option>
                        <option value="import" className="bg-slate-900">Import</option>
                        <option value="tryout" className="bg-slate-900">Tryout</option>
                      </select>
                    ) : (
                      <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                        isTourn ? "bg-yellow-500/20 text-yellow-300" :
                        isCamp  ? "bg-blue-500/20 text-blue-300" :
                        "bg-white/10 text-gray-300"
                      }`}>
                        {SOURCE_LABELS[editingContact.source] || editingContact.source}
                      </span>
                    )}
                  </div>
                  <button onClick={() => { setEditingContact(null); setIsNewContact(false); }} className="text-gray-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-5 space-y-5">
                  {/* ── Always visible: contact info ── */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Contact Info</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {ef("Name", "name")}
                      {ef("Email", "email")}
                      {ef("Phone", "phone")}
                    </div>
                  </div>

                  {/* ── Tournament fields ── */}
                  {isTourn && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Tournament Registration</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {ef("Tournament Name", "tournamentName", "e.g. Hilhi Spring Invitational")}
                        {ef("Team Name", "teamName", "e.g. Portland Hawks")}
                        {ef("Division", "division", "e.g. 5th Grade Boys Competitive")}
                      </div>
                    </div>
                  )}

                  {/* ── Camp fields ── */}
                  {isCamp && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Camp Registration</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {ef("Camper Name", "camperName")}
                        {ef("Grade", "grade")}
                        <div>
                          <label className="block text-gray-400 text-xs font-semibold mb-1">Gender</label>
                          <select
                            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                            value={(editPatch.gender ?? editingContact.gender ?? "") as string}
                            onChange={e => setEditPatch(p => ({ ...p, gender: e.target.value }))}
                          >
                            <option value="">Select</option>
                            <option value="Boys">Boys</option>
                            <option value="Girls">Girls</option>
                          </select>
                        </div>
                        {ef("Shirt Size", "shirtSize")}
                        {ef("Emergency Contact", "emergencyContact")}
                        {ef("Emergency Phone", "emergencyPhone")}
                        {ef("Payment Status", "paymentStatus")}
                        {ef("Amount Paid ($)", "amountPaid")}
                      </div>
                    </div>
                  )}

                  {/* ── Merch / other quick fields ── */}
                  {!isTourn && !isCamp && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Details</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {ef("Payment Status", "paymentStatus")}
                        {ef("Amount Paid ($)", "amountPaid")}
                        {ef("Order Number", "orderNumber")}
                      </div>
                    </div>
                  )}

                  {/* ── Notes — always visible ── */}
                  <div>
                    <label className="block text-gray-400 text-xs font-semibold mb-1">Notes</label>
                    <textarea rows={3}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                      value={(editPatch.notes ?? editingContact.notes ?? "") as string}
                      onChange={e => setEditPatch(p => ({ ...p, notes: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex gap-3 p-5 border-t border-white/10">
                  <button onClick={isNewContact ? saveNewContact : saveContactEdit} disabled={editSaving}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                    {editSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> {isNewContact ? "Create Contact" : "Save Changes"}</>}
                  </button>
                  <button onClick={() => { setEditingContact(null); setIsNewContact(false); }}
                    className="px-5 py-2.5 border border-white/20 text-gray-300 hover:text-white hover:border-white/40 font-semibold rounded-xl transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {tab === "contacts" && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label:"Total Contacts",    value:stats.total,      color:"text-white" },
                { label:"2026 Camp",     value:stats.reg,        color:"text-blue-400" },
                { label:"Tournament Teams",  value:stats.tournament, color:"text-yellow-400" },
                { label:"Merch Orders",      value:stats.merch,      color:"text-green-400" },
              ].map(s => (
                <div key={s.label} className="glass rounded-2xl border border-white/10 p-4">
                  <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-gray-500 text-xs mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Filters + Export */}
            <div className="flex flex-wrap gap-3 items-center">
              <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none">
                <option value="all" className="bg-gray-900">All Sources</option>
                <option value="2026 Youth Summer Camp" className="bg-gray-900">2026 Youth Summer Camp</option>
                <option value="tournament"   className="bg-gray-900">Tournament</option>
                <option value="merch-order"  className="bg-gray-900">Merch Orders</option>
                <option value="import"       className="bg-gray-900">Imports</option>
                <option value="tryout"       className="bg-gray-900">Tryout Registrations</option>
              </select>

              {tournamentNames.length > 0 && (
                <select value={tournFilter} onChange={e => setTournFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm focus:outline-none">
                  <option value="all" className="bg-gray-900">All Tournaments</option>
                  {tournamentNames.map(n => <option key={n} value={n} className="bg-gray-900">{n}</option>)}
                </select>
              )}

              <button onClick={downloadCSV} className="flex items-center gap-2 px-4 py-2 glass border border-white/15 hover:border-green-500/40 text-gray-300 hover:text-white text-sm font-semibold rounded-xl transition-all">
                <Download className="w-4 h-4" />
                {sourceFilter === "registration" ? "Export 2026 Camp CSV" :
                 sourceFilter === "tournament"   ? "Export Tournament CSV" :
                 sourceFilter === "merch-order"  ? "Export Merch CSV" :
                 "Export All CSV"}
              </button>
              <>
                <input type="file" accept=".csv" id="csv-import" className="hidden" onChange={e => { if (e.target.files?.[0]) { importCSV(e.target.files[0]); (e.target as HTMLInputElement).value=""; } }} />
                <label htmlFor="csv-import" className="flex items-center gap-2 px-4 py-2 glass border border-white/15 hover:border-blue-500/40 text-gray-300 hover:text-white text-sm font-semibold rounded-xl transition-all cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Import CSV
                </label>
              </>
              <button
                onClick={() => {
                  const blank: Contact = { id: "__new__", date: new Date().toISOString(), name: "", email: "", phone: "", source: sourceFilter !== "all" ? sourceFilter : "other" };
                  setEditingContact(blank);
                  setEditPatch({});
                  setIsNewContact(true);
                }}
                className="flex items-center gap-2 px-4 py-2 glass border border-white/15 hover:border-emerald-500/40 text-gray-300 hover:text-emerald-400 text-sm font-semibold rounded-xl transition-all ml-auto">
                <Plus className="w-4 h-4" />
                Add Contact
              </button>
            </div>

            {/* Table */}
            <div className="glass rounded-2xl border border-white/10 overflow-x-auto">
              {(sourceFilter === "all" ? false : isCampSource(sourceFilter)) ? (
                /* ── Camp Registration Table ── */
                <table className="w-full text-sm min-w-[900px]">
                  <thead className="border-b border-white/10">
                    <tr className="text-gray-500 text-xs uppercase tracking-wider">
                      {["","Parent / Contact","Email","Phone","Camper","Grade","Gender","Shirt","Payment","Order #","Registered",""].map((h, i) => (
                        <th key={i} className="text-left px-3 py-3 font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.length === 0 && (
                      <tr><td colSpan={12} className="px-4 py-8 text-center text-gray-600">No camp registrations found.</td></tr>
                    )}
                    {filtered.map(c => (
                      <>
                        <tr key={c.id} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setExpandedContact(expandedContact === c.id ? null : c.id)}>
                          {/* Expand toggle */}
                          <td className="px-3 py-3 text-gray-500 text-xs w-6">
                            <span className="text-xs">{expandedContact === c.id ? "▲" : "▶"}</span>
                          </td>
                          <td className="px-3 py-3 text-white font-semibold whitespace-nowrap">{c.name}</td>
                          <td className="px-3 py-3 text-gray-400 text-xs">{c.email}</td>
                          <td className="px-3 py-3 text-gray-400 text-xs whitespace-nowrap">{c.phone}</td>
                          <td className="px-3 py-3 text-blue-300 font-semibold whitespace-nowrap">{c.camperName||"—"}</td>
                          <td className="px-3 py-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 whitespace-nowrap">{c.grade||"—"}</span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${c.gender==="Boys" ? "bg-blue-500/20 text-blue-300" : c.gender==="Girls" ? "bg-pink-500/20 text-pink-300" : "bg-white/10 text-gray-400"}`}>{c.gender||"—"}</span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-500/20 text-orange-300">{c.shirtSize||"—"}</span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${c.paymentStatus==="Paid" ? "bg-green-500/20 text-green-400" : c.paymentStatus ? "bg-yellow-500/20 text-yellow-300" : "bg-white/10 text-gray-400"}`}>
                              {c.paymentStatus || (c.amountPaid ? "Paid" : "—")}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-gray-500 text-xs font-mono whitespace-nowrap">{c.orderNumber||"—"}</td>
                          <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">{c.orderDate || new Date(c.date).toLocaleDateString()}</td>
                          <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <button onClick={() => { setEditingContact(c); setEditPatch({}); setIsNewContact(false); }} className="text-gray-600 hover:text-blue-400 transition-colors" title="Edit">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => {
                                const { id: _id, date: _date, ...rest } = c;
                                void _id; void _date;
                                setEditingContact({ ...rest, id: "__new__", date: new Date().toISOString() } as Contact);
                                setEditPatch({});
                                setIsNewContact(true);
                              }} className="text-gray-600 hover:text-purple-400 transition-colors" title="Copy / Duplicate">
                                <Copy className="w-4 h-4" />
                              </button>
                              <button onClick={() => deleteContact(c.id)} className="text-gray-600 hover:text-red-400 transition-colors" title="Delete">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expandedContact === c.id && (
                          <tr key={c.id+"-detail"}>
                            <td colSpan={12} className="bg-white/5 px-6 py-4 border-b border-white/10">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2 text-sm">
                                <div><span className="text-gray-500 text-xs">Ticket Type</span><div className="text-white">{c.ticketType||"—"}</div></div>
                                <div><span className="text-gray-500 text-xs">Ticket #</span><div className="text-white font-mono">{c.ticketNum||"—"}</div></div>
                                <div><span className="text-gray-500 text-xs">Ticket Price</span><div className="text-white">{c.ticketPrice ? `$${c.ticketPrice}` : "—"}</div></div>
                                <div><span className="text-gray-500 text-xs">Total Amount</span><div className="text-green-400 font-bold">{c.amountPaid ? `$${c.amountPaid}` : "—"}</div></div>
                                <div><span className="text-gray-500 text-xs">Tax</span><div className="text-white">{c.tax ? `$${c.tax}` : "—"}</div></div>
                                <div><span className="text-gray-500 text-xs">Wix Service Fee</span><div className="text-white">{c.wixServiceFee ? `$${c.wixServiceFee}` : "—"}</div></div>
                                <div><span className="text-gray-500 text-xs">Ticket Revenue</span><div className="text-white">{c.ticketRevenue ? `$${c.ticketRevenue}` : "—"}</div></div>
                                <div><span className="text-gray-500 text-xs">Benefit / Coupon</span><div className="text-white">{[c.benefit, c.coupon].filter(Boolean).join(", ") || "—"}</div></div>
                                <div><span className="text-gray-500 text-xs">Emergency Contact</span><div className="text-white">{c.emergencyContact||"—"}</div></div>
                                <div><span className="text-gray-500 text-xs">Emergency Phone</span><div className="text-white">{c.emergencyPhone||"—"}</div></div>
                                <div><span className="text-gray-500 text-xs">Checked In</span><div className={c.checkedIn==="Yes" ? "text-green-400 font-bold" : "text-gray-400"}>{c.checkedIn||"No"}</div></div>
                                <div><span className="text-gray-500 text-xs">Seat Info</span><div className="text-white">{c.seatInfo||"—"}</div></div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              ) : (
                /* ── Generic / Tournament / Merch Table ── */
                <table className="w-full text-sm">
                  <thead className="border-b border-white/10">
                    <tr className="text-gray-500 text-xs uppercase tracking-wider">
                      {["Name","Email","Phone","Source","Tournament","Team","Division","Date",""].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.length === 0 && (
                      <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-600">No contacts found.</td></tr>
                    )}
                    {filtered.map(c => (
                      <tr key={c.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-white font-semibold">{c.name}</td>
                        <td className="px-4 py-3 text-gray-400">{c.email}</td>
                        <td className="px-4 py-3 text-gray-400">{c.phone}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            c.source==="tournament"   ? "bg-yellow-500/20 text-yellow-300" :
                            c.source==="merch-order"  ? "bg-green-500/20 text-green-300"  :
                            c.source==="registration" ? "bg-blue-500/20  text-blue-300"   :
                            "bg-white/10 text-gray-300"
                          }`}>{c.source==="tournament"&&c.tournamentName ? c.tournamentName : SOURCE_LABELS[c.source]||c.source}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{c.tournamentName||"—"}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{c.teamName||"—"}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{c.division||"—"}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{new Date(c.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => { setEditingContact(c); setEditPatch({}); setIsNewContact(false); }} className="text-gray-600 hover:text-blue-400 transition-colors" title="Edit">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => {
                              const { id: _id, date: _date, ...rest } = c;
                              void _id; void _date;
                              setEditingContact({ ...rest, id: "__new__", date: new Date().toISOString() } as Contact);
                              setEditPatch({});
                              setIsNewContact(true);
                            }} className="text-gray-600 hover:text-purple-400 transition-colors" title="Copy / Duplicate">
                              <Copy className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteContact(c.id)} className="text-gray-600 hover:text-red-400 transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <p className="text-gray-600 text-xs">
              {sourceFilter === "registration"
                ? "CSV columns: Parent Name, Email, Phone, Camper Name, Grade, Gender, Shirt Size, Emergency Contact, Emergency Phone, Amount Paid, Order #, Date"
                : "CSV columns: Name, Email, Phone, Source, Tournament, Team Name, Division, Notes, Date"}
            </p>
          </div>
        )}

        {/* ── TOURNAMENTS TAB ── */}
        {tab === "tournaments" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-lg">Tournaments</h2>
                <p className="text-gray-500 text-sm">Manage all your tournaments. Toggle on/off to control public visibility.</p>
              </div>
              {!addingTourn && !editingTourn && (
                <button onClick={() => setAddingTourn(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all">
                  <Plus className="w-4 h-4" /> Add Tournament
                </button>
              )}
            </div>

            {/* Add new form */}
            {addingTourn && (
              <TournamentForm
                initial={copyTemplate ? { ...copyTemplate } : { ...TOURNAMENT_DEFAULTS, id:"" }}
                onSave={(saved) => { setCopyTemplate(null); handleTournSaved(saved); }}
                onCancel={() => { setAddingTourn(false); setCopyTemplate(null); }}
                adminKey={adminKey}
              />
            )}

            {/* Tournament list */}
            <div className="space-y-3">
              {tournaments.length === 0 && !addingTourn && (
                <div className="glass rounded-2xl border border-white/10 p-8 text-center text-gray-500">
                  No tournaments yet. Click &quot;Add Tournament&quot; to create one.
                </div>
              )}
              {tournaments.map(t => (
                <div key={t.id}>
                  {editingTourn?.id === t.id ? (
                    <TournamentForm initial={editingTourn} onSave={handleTournSaved} onCancel={() => setEditingTourn(null)} adminKey={adminKey} />
                  ) : (
                    <div className="glass rounded-2xl border border-white/10 p-4 flex items-start gap-4">
                      {/* Banner thumb */}
                      <div className="w-20 h-14 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                        {t.imageUrl
                          ? <img src={t.imageUrl} alt={t.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Trophy className="w-6 h-6 text-gray-600" /></div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 flex-wrap">
                          <h3 className="text-white font-bold text-base leading-tight">{t.name}</h3>
                          {t.isStateQualifier && <span className="px-2 py-0.5 bg-yellow-400/20 text-yellow-400 rounded-full text-xs font-bold">⭐ State Qualifier</span>}
                        </div>
                        <div className="text-gray-500 text-xs mt-1">{t.dates} · {t.venue}</div>
                        <div className="text-gray-500 text-xs">{t.gender} · {t.grades} · ${t.entryFee} entry</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => toggleTournament(t)} className="flex items-center gap-1.5" title="Toggle live/off">
                          {t.enabled
                            ? <><ToggleRight className="w-7 h-7 text-green-400" /><span className="text-green-400 text-xs font-bold">LIVE</span></>
                            : <><ToggleLeft  className="w-7 h-7 text-gray-500" /><span className="text-gray-500 text-xs font-bold">OFF</span></>
                          }
                        </button>
                        <button onClick={() => setEditingTourn(t)} title="Edit" className="p-2 glass border border-white/15 hover:border-blue-500/40 text-gray-400 hover:text-white rounded-lg transition-all">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => copyTournament(t)} title="Copy / Duplicate" className="p-2 glass border border-white/15 hover:border-purple-500/40 text-gray-400 hover:text-purple-400 rounded-lg transition-all">
                          <Copy className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteTournamentAdmin(t.id)} title="Delete" className="p-2 glass border border-white/15 hover:border-red-500/40 text-gray-400 hover:text-red-400 rounded-lg transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PAGES TAB ── */}
        {tab === "vouchers"  && <VouchersTab  adminKey={adminKey} />}
        {tab === "filmroom"  && <FilmRoomTab  adminKey={adminKey} />}
        {tab === "camp"      && <CampTab      adminKey={adminKey} />}
        {tab === "tourney"   && <TourneyTab contacts={contacts} tournaments={tournaments} />}
        {tab === "pages"     && <PagesTab     adminKey={adminKey} />}
      </div>
    </main>
  );
}
