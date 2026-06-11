"use client";

export const dynamic = "force-dynamic";
import { useState, useEffect, useRef } from "react";
import { Trash2, Download, Upload, LogOut, Shield, Users, Trophy, Plus, Edit2, X, ChevronDown, ChevronUp, ToggleLeft, ToggleRight, Image as ImgIcon, Save, Loader2, CheckCircle, FileText, Star, Copy } from "lucide-react";

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

type Tab = "contacts" | "tournaments" | "pages";

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: image field with upload
// ─────────────────────────────────────────────────────────────────────────────
function ImageField({ label, value, onChange, adminKey }: { label:string; value:string; onChange:(v:string)=>void; adminKey:string; }) {
  const ref     = useRef<HTMLInputElement>(null);
  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setBusy(true); setError("");
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch(`/api/upload?key=${adminKey}`, { method:"POST", body:fd });
      const data = await res.json();
      if (data.url) onChange(data.url); else setError(data.error || "Upload failed.");
    } catch { setError("Upload failed."); }
    setBusy(false);
  }

  return (
    <div>
      <label className="block text-gray-400 text-xs font-semibold mb-1">{label}</label>
      <div className="flex gap-2">
        <input value={value} onChange={e => onChange(e.target.value)} placeholder="https://... or upload →"
          className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
        <button type="button" onClick={() => ref.current?.click()} disabled={busy}
          className="px-3 py-2.5 bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Upload
        </button>
      </div>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      {value && (
        <div className="mt-2 rounded-lg overflow-hidden h-24 bg-white/5 border border-white/10">
          <img src={value} alt="preview" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = "none")} />
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
// PagesTab — Full CMS for all website pages
// ─────────────────────────────────────────────────────────────────────────────
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

  const SaveBtn = ({ k }: { k:string }) => (
    <button onClick={() => save(k, {})} disabled={saving===k}
      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#006aff] to-[#00aaff] hover:brightness-110 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50">
      {saving===k ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</> : saved===k ? <><CheckCircle className="w-3.5 h-3.5" /> Saved!</> : <><Save className="w-3.5 h-3.5" /> Save</>}
    </button>
  );

  const Section = ({ id, title, badge, children }: { id:string; title:string; badge?:string; children:React.ReactNode }) => (
    <div className="glass rounded-2xl border border-white/10 overflow-hidden">
      <button onClick={() => setSection(s => s===id ? null : id)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-3">
          <span className="text-white font-bold text-sm">{title}</span>
          {badge && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold">{badge}</span>}
        </div>
        {section===id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {section===id && <div className="px-5 pb-5 space-y-4 border-t border-white/10 pt-4">{children}</div>}
    </div>
  );

  const Toggle = ({ label, checked, onChange, desc }: { label:string; checked:boolean; onChange:(v:boolean)=>void; desc?:string }) => (
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

  // Shortcut setters
  const setN = (k: keyof SiteContent["navbar"]) => (v: unknown) =>
    setContent(p => p ? { ...p, navbar: { ...p.navbar, [k]: v } } : p);
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

      {/* ── Tryout Page ──────────────────────────────────────────────────── */}
      <Section id="tryout" title="🏀 Tryout Page" badge={t.enabled ? "Live" : "Hidden"}>
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
        <div className="flex justify-end"><SaveBtn k="tryout" /></div>
      </Section>

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <Section id="navbar" title="🔗 Navigation Bar">
        <div className="grid sm:grid-cols-2 gap-3">
          <IF label="Site Name"  value={n.siteName} onChange={setN("siteName") as (v:string)=>void} ph="HILHI" />
          <IF label="Tagline"    value={n.tagline}  onChange={setN("tagline")  as (v:string)=>void} ph="Youth Basketball" />
        </div>
        <Toggle
          label="Show 'Tryouts' Link in Navigation"
          desc="Display the Tryouts page link in the top nav and mobile menu."
          checked={n.showTryouts}
          onChange={v => { setN("showTryouts")(v); save("navbar", { navbar: { ...n, showTryouts: v } }); }}
        />
        <div className="flex justify-end"><SaveBtn k="navbar" /></div>
      </Section>

      {/* ── Home Hero ────────────────────────────────────────────────────── */}
      <Section id="home" title="🏠 Home Page — Hero & About">
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
        <div className="flex justify-end"><SaveBtn k="home" /></div>
      </Section>

      {/* ── Contact ──────────────────────────────────────────────────────── */}
      <Section id="contact" title="📞 Contact Info & Social Links">
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
        <div className="flex justify-end"><SaveBtn k="contact" /></div>
      </Section>

      {/* ── Camps & Clinics ──────────────────────────────────────────────── */}
      <Section id="camps" title="⚡ Events & Camps Page">
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
        <div className="flex justify-end mt-2"><SaveBtn k="camps" /></div>
      </Section>

      {/* ── Merch Page ───────────────────────────────────────────────────── */}
      <Section id="merch" title="👕 Merch Page">
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
        <div className="flex justify-end mt-2"><SaveBtn k="merch" /></div>
      </Section>

      {/* ── Film Room ───────────────────────────────────────────────────── */}
      <Section id="videoRoom" title="🎬 Team Film Room">
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
        <div className="flex justify-end mt-2"><SaveBtn k="videoRoom" /></div>
      </Section>

      {/* ── Youth Coaches ────────────────────────────────────────────────── */}
      <Section id="youthCoaches" title="🏀 Youth Coaches Page">
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
        <div className="flex justify-end mt-2"><SaveBtn k="youthCoaches" /></div>
      </Section>

      {/* ── HS Coaches ───────────────────────────────────────────────────── */}
      <Section id="hsCoaches" title="🎓 High School Coaches Page">
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

        <div className="flex justify-end mt-2"><SaveBtn k="hsCoaches" /></div>
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
    if (tab === "contacts" && !contactsLoaded) {
      fetch(`/api/admin/contacts?key=${adminKey}`).then(r=>r.json()).then(d => { setContacts(Array.isArray(d) ? d : (d.contacts ?? [])); setContactsLoaded(true); });
    }
    if (tab === "tournaments" && !tournLoaded) {
      fetch(`/api/tournament?key=${adminKey}`).then(r=>r.json()).then(d => { setTournaments(d); setTournLoaded(true); });
    }
  }, [authed, tab]);

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
            { id:"contacts",    icon:<Users   className="w-4 h-4"/>, label:"Contacts"    },
            { id:"tournaments", icon:<Trophy  className="w-4 h-4"/>, label:"Tournaments" },
            { id:"pages",       icon:<FileText className="w-4 h-4"/>,label:"Pages"       },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab===t.id ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── CONTACTS TAB ── */}
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
                            <button onClick={() => deleteContact(c.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
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
                          <button onClick={() => deleteContact(c.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
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
        {tab === "pages" && <PagesTab adminKey={adminKey} />}
      </div>
    </main>
  );
}
