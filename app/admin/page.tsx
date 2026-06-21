"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Home, Building, CheckCircle, Users, BarChart3, Settings,
  LogOut, Plus, Trash, Edit, Save, X, Eye, ExternalLink,
  Phone, Globe, Mail, Calendar, ChevronRight, AlertCircle,
  Loader2, ArrowLeft, Rocket, GitBranch, Clock, RefreshCw,
  Shield, Star
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface TrackRecord {
  totalHomes: number; totalVolume: string; avgDaysOnMarket: number;
  rating: string; licensedSince: number;
  headline1: string; headline2: string; headline3: string; closingQuote: string;
}
interface ActiveListing {
  id: number; mls: string; address: string; city: string; neighborhood: string;
  price: string; beds: number; baths: number; sqft: string; lotSqft: string;
  yearBuilt: string; status: string; photos: string[]; description: string;
  highlights: string[]; features: { icon: string; label: string }[];
  link: string; zillowLink: string; redfin: string;
}
interface SoldListing {
  id: number; address: string; city: string; neighborhood: string;
  price: string; beds: number; baths: number; sqft: string;
  soldDate: string; daysOnMarket: string; highlight: string;
  photos: string[]; link: string;
}
interface Lender {
  id: number; initials: string; name: string; title: string; company: string;
  nmls: string; location: string; phone: string; phoneHref: string;
  email: string; website: string; websiteHref: string; bookHref: string; bookLabel: string;
}
interface SiteContent {
  trackRecord: TrackRecord; activeListings: ActiveListing[];
  soldListings: SoldListing[]; lenders: Lender[];
}
interface DeployStatus {
  state: "idle" | "saving" | "publishing" | "success" | "error";
  message: string; commitUrl?: string; countdown?: number; deployedAt?: string;
}
type Section = "dashboard" | "active" | "sold" | "trackrecord" | "lenders" | "settings";

// ── Small UI helpers ──────────────────────────────────────────────────────────
function Field({ label, value, onChange, type = "text", placeholder = "" }: {
  label: string; value: string | number; onChange: (v: string) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#C9A84C] transition-colors placeholder:text-slate-500" />
    </div>
  );
}
function FieldArea({ label, value, onChange, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows}
        className="bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#C9A84C] transition-colors resize-none" />
    </div>
  );
}
function PhotoEditor({ photos, onChange }: { photos: string[]; onChange: (p: string[]) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Photos (Image URLs)</label>
      {photos.map((url, i) => (
        <div key={i} className="flex gap-2 items-center">
          {url && <img src={url} alt="" className="w-12 h-9 object-cover rounded border border-slate-600 shrink-0"
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />}
          <input type="url" value={url} placeholder="https://..." onChange={e => { const n = [...photos]; n[i] = e.target.value; onChange(n); }}
            className="flex-1 bg-slate-800 border border-slate-700 text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-[#C9A84C] transition-colors placeholder:text-slate-500" />
          <button onClick={() => onChange(photos.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 p-1 shrink-0"><X className="w-4 h-4" /></button>
        </div>
      ))}
      <button onClick={() => onChange([...photos, ""])} className="flex items-center gap-1.5 text-[#C9A84C] hover:text-[#e8c96a] text-xs font-semibold mt-1">
        <Plus className="w-3.5 h-3.5" /> Add Photo URL
      </button>
    </div>
  );
}

// ── Deploy Bar ────────────────────────────────────────────────────────────────
function DeployBar({ deploy, githubConfigured, onSave, onPublish }: {
  deploy: DeployStatus; githubConfigured: boolean;
  onSave: () => void; onPublish: () => void;
}) {
  const busy = deploy.state === "saving" || deploy.state === "publishing";
  return (
    <div className="fixed bottom-0 left-64 right-0 bg-slate-950 border-t border-slate-800 px-8 py-4 flex items-center justify-between z-50 gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {deploy.state === "idle" && <span className="text-slate-500 text-sm">Unsaved changes</span>}
        {deploy.state === "saving" && <span className="flex items-center gap-2 text-slate-300 text-sm"><Loader2 className="w-4 h-4 animate-spin text-[#C9A84C]" /> Saving…</span>}
        {deploy.state === "publishing" && (
          <span className="flex items-center gap-2 text-slate-300 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-[#C9A84C]" />
            Publishing to GitHub… Vercel will deploy in ~60s
          </span>
        )}
        {deploy.state === "success" && (
          <span className="flex items-center gap-2 text-green-400 text-sm">
            <CheckCircle className="w-4 h-4" /> {deploy.message}
            {deploy.commitUrl && (
              <a href={deploy.commitUrl} target="_blank" rel="noopener noreferrer"
                className="text-[#C9A84C] hover:underline text-xs flex items-center gap-1 ml-1">
                View commit <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </span>
        )}
        {deploy.state === "error" && <span className="flex items-center gap-2 text-red-400 text-sm"><AlertCircle className="w-4 h-4" /> {deploy.message}</span>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button onClick={onSave} disabled={busy}
          className="flex items-center gap-2 border border-slate-600 hover:border-slate-400 disabled:opacity-50 text-slate-300 hover:text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
          <Save className="w-4 h-4" /> Save Draft
        </button>
        <button onClick={onPublish} disabled={busy || !githubConfigured}
          title={!githubConfigured ? "Configure GitHub in Settings first" : "Publish to live site via GitHub"}
          className={`flex items-center gap-2 text-sm font-bold px-5 py-2 rounded-lg transition-all ${
            githubConfigured
              ? "bg-[#C9A84C] hover:bg-[#e8c96a] text-black disabled:opacity-60"
              : "bg-slate-700 text-slate-400 cursor-not-allowed"
          }`}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
          {githubConfigured ? "🚀 Publish Live" : "🔒 GitHub Not Set Up"}
        </button>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ content, githubConfigured, onSection }: {
  content: SiteContent; githubConfigured: boolean; onSection: (s: Section) => void;
}) {
  const cards = [
    { label: "Active Listings", value: content.activeListings.length, icon: Home, section: "active" as Section, color: "text-green-400" },
    { label: "Sold Listings", value: content.soldListings.length, icon: Building, section: "sold" as Section, color: "text-[#C9A84C]" },
    { label: "Lenders", value: content.lenders.length, icon: Users, section: "lenders" as Section, color: "text-blue-400" },
    { label: "Avg Days on Market", value: content.trackRecord.avgDaysOnMarket, icon: BarChart3, section: "trackrecord" as Section, color: "text-purple-400" },
  ];
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
      <p className="text-slate-400 text-sm mb-8">Welcome back. Edit content, then hit <strong className="text-[#C9A84C]">🚀 Publish Live</strong> to push changes to the website.</p>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, section, color }) => (
          <button key={label} onClick={() => onSection(section)}
            className="bg-slate-800 border border-slate-700 hover:border-[#C9A84C]/50 rounded-xl p-5 text-left transition-all group">
            <Icon className={`w-5 h-5 ${color} mb-3`} />
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-slate-400 text-xs mt-1">{label}</div>
            <div className="flex items-center gap-1 text-[#C9A84C] text-xs mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              Manage <ChevronRight className="w-3 h-3" />
            </div>
          </button>
        ))}
      </div>

      {/* GitHub status card */}
      {!githubConfigured ? (
        <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-amber-300 font-semibold mb-1">GitHub not connected yet</p>
              <p className="text-amber-400/70 text-sm mb-4">Connect GitHub so your changes publish directly to the live website. Takes about 5 minutes.</p>
              <button onClick={() => onSection("settings")}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm px-4 py-2 rounded-lg transition-colors">
                <GitBranch className="w-4 h-4" /> Set Up GitHub →
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-green-950/30 border border-green-500/20 rounded-xl p-5 mb-6 flex items-center gap-4">
          <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
          <div>
            <p className="text-green-300 font-semibold text-sm">GitHub connected</p>
            <p className="text-green-400/60 text-xs mt-0.5">Publish button is active — changes go live in ~60 seconds.</p>
          </div>
          <a href="/" target="_blank" rel="noopener noreferrer"
            className="ml-auto flex items-center gap-2 bg-[#C9A84C] hover:bg-[#e8c96a] text-black font-bold text-xs px-4 py-2 rounded-lg transition-colors">
            View Live Site <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><Star className="w-4 h-4 text-[#C9A84C]" /> Track Record Snapshot</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[["Homes Sold", content.trackRecord.totalHomes], ["Volume", content.trackRecord.totalVolume],
            ["Zillow", content.trackRecord.rating + "★"], ["Since", content.trackRecord.licensedSince]].map(([k, v]) => (
            <div key={String(k)} className="bg-slate-900 rounded-lg p-4">
              <div className="text-[#C9A84C] font-bold text-xl">{v}</div>
              <div className="text-slate-400 text-xs mt-1">{k}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Active Listings ───────────────────────────────────────────────────────────
function ActiveListingsSection({ listings, onChange }: { listings: ActiveListing[]; onChange: (l: ActiveListing[]) => void }) {
  const [editing, setEditing] = useState<ActiveListing | null>(null);
  const save = () => { if (!editing) return; onChange(listings.map(l => l.id === editing.id ? editing : l)); setEditing(null); };
  if (editing) return (
    <div className="pb-24">
      <button onClick={() => setEditing(null)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6"><ArrowLeft className="w-4 h-4" /> Back</button>
      <h1 className="text-2xl font-bold text-white mb-6">Edit: {editing.address}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Field label="Address" value={editing.address} onChange={v => setEditing({ ...editing, address: v })} />
        <Field label="City, State ZIP" value={editing.city} onChange={v => setEditing({ ...editing, city: v })} />
        <Field label="Neighborhood" value={editing.neighborhood} onChange={v => setEditing({ ...editing, neighborhood: v })} />
        <Field label="List Price" value={editing.price} onChange={v => setEditing({ ...editing, price: v })} placeholder="$650,000" />
        <Field label="Beds" type="number" value={editing.beds} onChange={v => setEditing({ ...editing, beds: Number(v) })} />
        <Field label="Baths" type="number" value={editing.baths} onChange={v => setEditing({ ...editing, baths: Number(v) })} />
        <Field label="Sqft" value={editing.sqft} onChange={v => setEditing({ ...editing, sqft: v })} />
        <Field label="Year Built" value={editing.yearBuilt} onChange={v => setEditing({ ...editing, yearBuilt: v })} />
        <Field label="MLS #" value={editing.mls} onChange={v => setEditing({ ...editing, mls: v })} />
        <Field label="PPG Link" value={editing.link} onChange={v => setEditing({ ...editing, link: v })} />
        <Field label="Zillow Link" value={editing.zillowLink} onChange={v => setEditing({ ...editing, zillowLink: v })} />
      </div>
      <div className="mb-5"><FieldArea label="Description" value={editing.description} onChange={v => setEditing({ ...editing, description: v })} rows={4} /></div>
      <div className="mb-5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Highlights (one per line)</label>
        <textarea value={editing.highlights.join("\n")} rows={4}
          onChange={e => setEditing({ ...editing, highlights: e.target.value.split("\n").filter(Boolean) })}
          className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#C9A84C] resize-none" />
      </div>
      <PhotoEditor photos={editing.photos} onChange={p => setEditing({ ...editing, photos: p })} />
      <div className="mt-6 flex gap-3">
        <button onClick={save} className="flex items-center gap-2 bg-[#C9A84C] hover:bg-[#e8c96a] text-black font-bold px-6 py-2.5 rounded-lg text-sm"><Save className="w-4 h-4" /> Save</button>
        <button onClick={() => setEditing(null)} className="border border-slate-600 text-slate-300 hover:text-white px-6 py-2.5 rounded-lg text-sm">Cancel</button>
      </div>
    </div>
  );
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Active Listings</h1>
      <p className="text-slate-400 text-sm mb-6">Christine's current homes for sale.</p>
      <div className="space-y-4">
        {listings.map(l => (
          <div key={l.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex items-center gap-5">
            {l.photos[0] && <img src={l.photos[0]} alt="" className="w-20 h-14 object-cover rounded-lg shrink-0 border border-slate-600"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1"><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /><span className="text-xs font-bold text-green-400 uppercase tracking-wider">Active</span></div>
              <p className="text-white font-semibold">{l.address}</p>
              <p className="text-slate-400 text-sm">{l.city} · {l.beds}bd / {l.baths}ba / {l.sqft} sqft</p>
            </div>
            <div className="text-right shrink-0"><p className="text-[#C9A84C] font-bold text-lg">{l.price}</p><p className="text-slate-500 text-xs">{l.mls}</p></div>
            <button onClick={() => setEditing(l)} className="flex items-center gap-2 border border-slate-600 hover:border-[#C9A84C] text-slate-300 hover:text-[#C9A84C] text-sm px-4 py-2 rounded-lg transition-colors shrink-0">
              <Edit className="w-3.5 h-3.5" /> Edit
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sold Listings ─────────────────────────────────────────────────────────────
function SoldListingsSection({ listings, onChange }: { listings: SoldListing[]; onChange: (l: SoldListing[]) => void }) {
  const [editing, setEditing] = useState<SoldListing | null>(null);
  const [isNew, setIsNew] = useState(false);
  const newListing = (): SoldListing => ({ id: Date.now(), address: "", city: "", neighborhood: "", price: "", beds: 3, baths: 2, sqft: "", soldDate: "", daysOnMarket: "—", highlight: "", photos: [""], link: "" });
  const save = () => {
    if (!editing) return;
    if (isNew) onChange([...listings, editing]); else onChange(listings.map(l => l.id === editing.id ? editing : l));
    setEditing(null); setIsNew(false);
  };
  if (editing) return (
    <div className="pb-24">
      <button onClick={() => { setEditing(null); setIsNew(false); }} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6"><ArrowLeft className="w-4 h-4" /> Back</button>
      <h1 className="text-2xl font-bold text-white mb-6">{isNew ? "Add Sold Listing" : `Edit: ${editing.address}`}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Field label="Address" value={editing.address} onChange={v => setEditing({ ...editing, address: v })} placeholder="123 Main St" />
        <Field label="City, State ZIP" value={editing.city} onChange={v => setEditing({ ...editing, city: v })} placeholder="Portland, OR 97201" />
        <Field label="Neighborhood" value={editing.neighborhood} onChange={v => setEditing({ ...editing, neighborhood: v })} />
        <Field label="Sale Price" value={editing.price} onChange={v => setEditing({ ...editing, price: v })} placeholder="$450,000" />
        <Field label="Sold Date" value={editing.soldDate} onChange={v => setEditing({ ...editing, soldDate: v })} placeholder="Jan 15, 2025" />
        <Field label="Days on Market" value={editing.daysOnMarket} onChange={v => setEditing({ ...editing, daysOnMarket: v })} placeholder="14  (or — if unknown)" />
        <Field label="Beds" type="number" value={editing.beds} onChange={v => setEditing({ ...editing, beds: Number(v) })} />
        <Field label="Baths" type="number" value={editing.baths} onChange={v => setEditing({ ...editing, baths: Number(v) })} />
        <Field label="Sqft" value={editing.sqft} onChange={v => setEditing({ ...editing, sqft: v })} placeholder="1,800" />
        <Field label="PPG Link" value={editing.link} onChange={v => setEditing({ ...editing, link: v })} />
      </div>
      <div className="mb-5"><Field label="Highlight / Tagline" value={editing.highlight} onChange={v => setEditing({ ...editing, highlight: v })} placeholder="Sold in 10 days with multiple offers" /></div>
      <PhotoEditor photos={editing.photos} onChange={p => setEditing({ ...editing, photos: p })} />
      <div className="mt-6 flex gap-3">
        <button onClick={save} className="flex items-center gap-2 bg-[#C9A84C] hover:bg-[#e8c96a] text-black font-bold px-6 py-2.5 rounded-lg text-sm"><Save className="w-4 h-4" /> {isNew ? "Add Listing" : "Save"}</button>
        <button onClick={() => { setEditing(null); setIsNew(false); }} className="border border-slate-600 text-slate-300 hover:text-white px-6 py-2.5 rounded-lg text-sm">Cancel</button>
      </div>
    </div>
  );
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-white mb-1">Sold Listings</h1><p className="text-slate-400 text-sm">{listings.length} properties in Christine's sold history.</p></div>
        <button onClick={() => { setEditing(newListing()); setIsNew(true); }} className="flex items-center gap-2 bg-[#C9A84C] hover:bg-[#e8c96a] text-black font-bold text-sm px-5 py-2.5 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Add Sold Listing
        </button>
      </div>
      <div className="space-y-3">
        {listings.map(l => (
          <div key={l.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-4">
            {l.photos[0] && <img src={l.photos[0]} alt="" className="w-16 h-12 object-cover rounded-lg shrink-0 border border-slate-600 opacity-80"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5"><span className="text-[10px] font-bold text-[#C9A84C] bg-[#C9A84C]/10 px-2 py-0.5 rounded">SOLD</span><span className="text-slate-500 text-xs">{l.soldDate}</span></div>
              <p className="text-white font-semibold text-sm truncate">{l.address}</p>
              <p className="text-slate-400 text-xs">{l.city} · {l.beds}bd/{l.baths}ba</p>
            </div>
            <div className="text-right shrink-0 mr-2"><p className="text-[#C9A84C] font-bold">{l.price}</p><p className="text-slate-500 text-xs">{l.daysOnMarket !== "—" ? `${l.daysOnMarket} days` : "DOM unknown"}</p></div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setEditing(l)} className="border border-slate-600 hover:border-[#C9A84C] text-slate-400 hover:text-[#C9A84C] p-2 rounded-lg transition-colors"><Edit className="w-3.5 h-3.5" /></button>
              <button onClick={() => { if (confirm("Remove this sold listing?")) onChange(listings.filter(x => x.id !== l.id)); }} className="border border-slate-600 hover:border-red-500 text-slate-400 hover:text-red-400 p-2 rounded-lg transition-colors"><Trash className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Track Record ──────────────────────────────────────────────────────────────
function TrackRecordSection({ data, onChange }: { data: TrackRecord; onChange: (d: TrackRecord) => void }) {
  return (
    <div className="pb-24">
      <h1 className="text-2xl font-bold text-white mb-2">Track Record Stats</h1>
      <p className="text-slate-400 text-sm mb-8">Update these numbers each time you close a sale.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-5 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#C9A84C]" /> Numbers</h3>
          <div className="space-y-4">
            <Field label="Total Homes Sold" type="number" value={data.totalHomes} onChange={v => onChange({ ...data, totalHomes: Number(v) })} />
            <Field label="Total Volume (e.g. $7.1M+)" value={data.totalVolume} onChange={v => onChange({ ...data, totalVolume: v })} />
            <Field label="Avg Days on Market" type="number" value={data.avgDaysOnMarket} onChange={v => onChange({ ...data, avgDaysOnMarket: Number(v) })} />
            <Field label="Zillow Rating (e.g. 5.0)" value={data.rating} onChange={v => onChange({ ...data, rating: v })} />
            <Field label="Licensed Since (year)" type="number" value={data.licensedSince} onChange={v => onChange({ ...data, licensedSince: Number(v) })} />
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-5 flex items-center gap-2"><Edit className="w-4 h-4 text-[#C9A84C]" /> Section Headline</h3>
          <div className="space-y-4">
            <Field label="Line 1" value={data.headline1} onChange={v => onChange({ ...data, headline1: v })} placeholder="18 Homes Sold." />
            <Field label="Line 2 (gold)" value={data.headline2} onChange={v => onChange({ ...data, headline2: v })} placeholder="$7.1M+ Closed." />
            <Field label="Line 3 (dim)" value={data.headline3} onChange={v => onChange({ ...data, headline3: v })} placeholder="One Agent." />
            <FieldArea label="Closing Quote" value={data.closingQuote} onChange={v => onChange({ ...data, closingQuote: v })} rows={3} />
          </div>
        </div>
      </div>
      <div className="mt-6 bg-slate-800/50 border border-[#C9A84C]/20 rounded-xl p-5">
        <p className="text-[#C9A84C] text-sm font-semibold mb-1">💡 Tip — After every closing</p>
        <p className="text-slate-400 text-sm">Add the property to Sold Listings, then bump Total Homes +1 and update Total Volume. Hit Publish and the live site updates automatically.</p>
      </div>
    </div>
  );
}

// ── Lenders ───────────────────────────────────────────────────────────────────
function LendersSection({ lenders, onChange }: { lenders: Lender[]; onChange: (l: Lender[]) => void }) {
  const [editing, setEditing] = useState<Lender | null>(null);
  const [isNew, setIsNew] = useState(false);
  const newLender = (): Lender => ({ id: Date.now(), initials: "", name: "", title: "Mortgage Loan Officer", company: "", nmls: "", location: "", phone: "", phoneHref: "", email: "", website: "", websiteHref: "", bookHref: "", bookLabel: "" });
  const save = () => {
    if (!editing) return;
    const updated = { ...editing, phoneHref: `tel:${editing.phone.replace(/\D/g, "")}` };
    if (isNew) onChange([...lenders, updated]); else onChange(lenders.map(l => l.id === editing.id ? updated : l));
    setEditing(null); setIsNew(false);
  };
  if (editing) return (
    <div className="pb-24">
      <button onClick={() => { setEditing(null); setIsNew(false); }} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6"><ArrowLeft className="w-4 h-4" /> Back</button>
      <h1 className="text-2xl font-bold text-white mb-6">{isNew ? "Add Lender" : `Edit: ${editing.name}`}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Field label="Full Name" value={editing.name} onChange={v => setEditing({ ...editing, name: v })} />
        <Field label="Initials (2 letters)" value={editing.initials} onChange={v => setEditing({ ...editing, initials: v.slice(0, 2).toUpperCase() })} />
        <Field label="Title" value={editing.title} onChange={v => setEditing({ ...editing, title: v })} />
        <Field label="Company" value={editing.company} onChange={v => setEditing({ ...editing, company: v })} />
        <Field label="NMLS #" value={editing.nmls} onChange={v => setEditing({ ...editing, nmls: v })} />
        <Field label="Location" value={editing.location} onChange={v => setEditing({ ...editing, location: v })} />
        <Field label="Phone" value={editing.phone} onChange={v => setEditing({ ...editing, phone: v })} placeholder="(503) 555-1234" />
        <Field label="Email" value={editing.email} onChange={v => setEditing({ ...editing, email: v })} />
        <Field label="Website Display" value={editing.website} onChange={v => setEditing({ ...editing, website: v })} placeholder="canopymortgage.com/..." />
        <Field label="Website Full URL" value={editing.websiteHref} onChange={v => setEditing({ ...editing, websiteHref: v })} placeholder="https://..." />
        <Field label="Book a Call URL" value={editing.bookHref} onChange={v => setEditing({ ...editing, bookHref: v })} />
        <Field label="Book Button Label" value={editing.bookLabel} onChange={v => setEditing({ ...editing, bookLabel: v })} placeholder="Book a Call with Jeff" />
      </div>
      <div className="mt-6 flex gap-3">
        <button onClick={save} className="flex items-center gap-2 bg-[#C9A84C] hover:bg-[#e8c96a] text-black font-bold px-6 py-2.5 rounded-lg text-sm"><Save className="w-4 h-4" /> {isNew ? "Add Lender" : "Save"}</button>
        <button onClick={() => { setEditing(null); setIsNew(false); }} className="border border-slate-600 text-slate-300 hover:text-white px-6 py-2.5 rounded-lg text-sm">Cancel</button>
      </div>
    </div>
  );
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-white mb-1">Preferred Lenders</h1><p className="text-slate-400 text-sm">Manage the lender cards on the website.</p></div>
        <button onClick={() => { setEditing(newLender()); setIsNew(true); }} className="flex items-center gap-2 bg-[#C9A84C] hover:bg-[#e8c96a] text-black font-bold text-sm px-5 py-2.5 rounded-lg">
          <Plus className="w-4 h-4" /> Add Lender
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {lenders.map(l => (
          <div key={l.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-[#C9A84C] rounded-lg flex items-center justify-center shrink-0"><span className="text-black font-bold text-lg">{l.initials}</span></div>
              <div><p className="text-white font-semibold">{l.name}</p><p className="text-[#C9A84C] text-xs">{l.company}</p><p className="text-slate-400 text-xs">{l.title}</p></div>
            </div>
            <div className="space-y-1 text-sm text-slate-400 mb-5">
              {l.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-[#C9A84C]" />{l.phone}</div>}
              {l.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-[#C9A84C]" />{l.email}</div>}
              {l.website && <div className="flex items-center gap-2"><Globe className="w-3.5 h-3.5 text-[#C9A84C]" />{l.website}</div>}
              {l.nmls && <div className="text-slate-500 text-xs pl-5">{l.nmls}</div>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(l)} className="flex-1 flex items-center justify-center gap-2 border border-slate-600 hover:border-[#C9A84C] text-slate-300 hover:text-[#C9A84C] text-xs font-semibold py-2 rounded-lg transition-colors"><Edit className="w-3.5 h-3.5" /> Edit</button>
              <button onClick={() => { if (confirm("Remove this lender?")) onChange(lenders.filter(x => x.id !== l.id)); }} className="border border-slate-600 hover:border-red-500 text-slate-400 hover:text-red-400 p-2 rounded-lg transition-colors"><Trash className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Settings / GitHub Setup ───────────────────────────────────────────────────
function SettingsSection({ githubConfigured, onLogout }: { githubConfigured: boolean; onLogout: () => void }) {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-2">Settings & Setup</h1>
      <p className="text-slate-400 text-sm mb-8">Connect GitHub to enable one-click publishing to your live website.</p>

      {/* GitHub Setup Guide */}
      <div className={`border rounded-xl p-6 mb-6 ${githubConfigured ? "bg-green-950/20 border-green-500/20" : "bg-slate-800 border-slate-700"}`}>
        <div className="flex items-center gap-3 mb-4">
          <GitBranch className={`w-5 h-5 ${githubConfigured ? "text-green-400" : "text-[#C9A84C]"}`} />
          <h3 className="text-white font-semibold">GitHub Connection</h3>
          {githubConfigured && <span className="ml-auto text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Connected</span>}
        </div>

        {!githubConfigured && (
          <div className="space-y-5">
            <p className="text-slate-300 text-sm">Follow these steps to connect GitHub so your admin changes publish live automatically:</p>
            {[
              { n: 1, title: "Create a free GitHub account", body: <>Go to <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-[#C9A84C] hover:underline">github.com</a> and sign up (free).</> },
              { n: 2, title: "Create a new repository", body: <>Click <strong className="text-white">New repository</strong>. Name it <code className="bg-slate-700 px-1.5 rounded text-xs text-[#C9A84C]">christine-kem-website</code>. Set it to <strong className="text-white">Private</strong>. Click Create.</> },
              { n: 3, title: "Upload your site files", body: <>I'll give you a ZIP file of your entire site. In your new GitHub repo, click <strong className="text-white">uploading an existing file</strong> and drag the ZIP contents in.</> },
              { n: 4, title: "Create a Personal Access Token", body: <><a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener noreferrer" className="text-[#C9A84C] hover:underline">Go here → GitHub Token page</a>. Set Note to <em>Christine Kem Admin</em>. Set Expiration to <em>No expiration</em>. Check <strong className="text-white">repo</strong> scope. Click Generate. <strong className="text-white">Copy the token — you won't see it again.</strong></> },
              { n: 5, title: "Connect to Vercel (free hosting)", body: <><a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-[#C9A84C] hover:underline">vercel.com</a> → Sign up with GitHub → Import your repository → Deploy. Takes 2 minutes.</> },
              { n: 6, title: "Add environment variables in Vercel", body: <>In Vercel: <strong className="text-white">Project → Settings → Environment Variables</strong>. Add these 3 variables:<br />
                <code className="block bg-slate-900 rounded-lg p-3 text-xs text-[#C9A84C] mt-2 space-y-1">
                  GITHUB_TOKEN = your-token-here<br />
                  GITHUB_OWNER = your-github-username<br />
                  GITHUB_REPO = christine-kem-website<br />
                  ADMIN_PASSWORD = Christine2024
                </code>
              </> },
            ].map(({ n, title, body }) => (
              <div key={n} className="flex gap-4">
                <div className="w-7 h-7 bg-[#C9A84C] text-black rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{n}</div>
                <div><p className="text-white font-semibold text-sm mb-1">{title}</p><p className="text-slate-400 text-sm leading-relaxed">{body}</p></div>
              </div>
            ))}
            <div className="bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-lg p-4 mt-2">
              <p className="text-[#C9A84C] text-sm font-semibold mb-1">Once set up:</p>
              <p className="text-slate-300 text-sm">Every time you click <strong>🚀 Publish Live</strong>, changes commit to GitHub and Vercel deploys your site in ~60 seconds — no coding ever needed.</p>
            </div>
          </div>
        )}

        {githubConfigured && (
          <p className="text-green-300/70 text-sm">GitHub is connected. The 🚀 Publish Live button is active on all edit screens.</p>
        )}
      </div>

      {/* Admin Password */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-3"><Shield className="w-4 h-4 text-[#C9A84C]" /><h3 className="text-white font-semibold">Admin Password</h3></div>
        <p className="text-slate-400 text-sm mb-3">Set <code className="bg-slate-700 px-1.5 rounded text-xs text-[#C9A84C]">ADMIN_PASSWORD</code> in your Vercel environment variables to change the password.</p>
        <div className="bg-slate-900 rounded-lg p-3 text-xs font-mono text-slate-400">Default: <span className="text-[#C9A84C]">Christine2024</span></div>
      </div>

      {/* Sign Out */}
      <div className="bg-slate-800 border border-red-500/20 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-2">Sign Out</h3>
        <button onClick={onLogout} className="flex items-center gap-2 border border-red-500/40 hover:border-red-400 text-red-400 hover:text-red-300 text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [content, setContent] = useState<SiteContent | null>(null);
  const [section, setSection] = useState<Section>("dashboard");
  const [loading, setLoading] = useState(true);
  const [githubConfigured, setGithubConfigured] = useState(false);
  const [deploy, setDeploy] = useState<DeployStatus>({ state: "idle", message: "" });

  const fetchContent = useCallback(async () => {
    const [contentRes, ghRes] = await Promise.all([
      fetch("/api/admin/content"),
      fetch("/api/admin/publish"),
    ]);
    const data = await contentRes.json();
    const gh = await ghRes.json();
    setContent(data);
    setGithubConfigured(gh.configured ?? false);
  }, []);

  useEffect(() => {
    if (localStorage.getItem("ck_admin_auth") === "true") {
      setAuthenticated(true);
      fetchContent().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchContent]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true); setLoginError("");
    try {
      const res = await fetch("/api/admin/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      if (res.ok) {
        localStorage.setItem("ck_admin_auth", "true");
        setAuthenticated(true);
        await fetchContent();
        setLoading(false);
      } else { setLoginError("Incorrect password. Try again."); }
    } catch { setLoginError("Connection error. Please try again."); }
    setLoginLoading(false);
  };

  const handleSave = async () => {
    if (!content) return;
    setDeploy({ state: "saving", message: "" });
    try {
      await fetch("/api/admin/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(content) });
      setDeploy({ state: "success", message: "Saved locally — click Publish Live to update the website." });
      setTimeout(() => setDeploy({ state: "idle", message: "" }), 5000);
    } catch { setDeploy({ state: "error", message: "Save failed. Try again." }); }
  };

  const handlePublish = async () => {
    if (!content) return;
    setDeploy({ state: "publishing", message: "" });
    try {
      // Save locally first
      await fetch("/api/admin/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(content) });
      // Then commit to GitHub
      const res = await fetch("/api/admin/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) });
      const result = await res.json();
      if (result.success) {
        setDeploy({ state: "success", message: "Published! Your live site will update in ~60 seconds.", commitUrl: result.commitUrl, deployedAt: result.deployedAt });
        setTimeout(() => setDeploy({ state: "idle", message: "" }), 12000);
      } else {
        setDeploy({ state: "error", message: result.error || "Publish failed." });
      }
    } catch { setDeploy({ state: "error", message: "Network error. Try again." }); }
  };

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin" /></div>;

  if (!authenticated) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#C9A84C] rounded-xl flex items-center justify-center mx-auto mb-4"><span className="font-serif text-black text-2xl font-bold italic">CK</span></div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-slate-400 text-sm mt-1">Christine Kem · Premiere Property Group</p>
        </div>
        <form onSubmit={handleLogin} className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
          <div className="mb-5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoFocus placeholder="Enter admin password"
              className="w-full bg-slate-900 border border-slate-600 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#C9A84C] transition-colors placeholder:text-slate-500 text-sm" />
          </div>
          {loginError && <div className="flex items-center gap-2 text-red-400 text-sm mb-4 bg-red-500/10 rounded-lg px-4 py-3"><AlertCircle className="w-4 h-4 shrink-0" /> {loginError}</div>}
          <button type="submit" disabled={loginLoading || !password} className="w-full bg-[#C9A84C] hover:bg-[#e8c96a] disabled:opacity-60 text-black font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
            {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}{loginLoading ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <p className="text-center text-slate-600 text-xs mt-6">Default password: <span className="text-slate-400">Christine2024</span></p>
      </div>
    </div>
  );

  if (!content) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin" /></div>;

  const navItems: { id: Section; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "active", label: "Active Listings", icon: Building, badge: content.activeListings.length },
    { id: "sold", label: "Sold Listings", icon: CheckCircle, badge: content.soldListings.length },
    { id: "trackrecord", label: "Track Record", icon: BarChart3 },
    { id: "lenders", label: "Lenders", icon: Users, badge: content.lenders.length },
    { id: "settings", label: "Settings & Setup", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 fixed h-screen z-40">
        <div className="px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#C9A84C] rounded-lg flex items-center justify-center shrink-0"><span className="font-serif text-black text-sm font-bold italic">CK</span></div>
            <div><p className="text-white text-sm font-semibold leading-tight">Admin Panel</p><p className="text-slate-500 text-[10px]">Christine Kem · PPG</p></div>
          </div>
        </div>

        {/* GitHub status pill */}
        <div className={`mx-3 mt-3 px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-semibold ${githubConfigured ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"}`}>
          <GitBranch className="w-3.5 h-3.5 shrink-0" />
          {githubConfigured ? "GitHub connected" : "GitHub not set up"}
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ id, label, icon: Icon, badge }) => (
            <button key={id} onClick={() => setSection(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${section === id ? "bg-[#C9A84C]/15 text-[#C9A84C] font-semibold" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              {badge !== undefined && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${section === id ? "bg-[#C9A84C] text-black" : "bg-slate-700 text-slate-300"}`}>{badge}</span>}
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-slate-800">
          <a href="/" target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <Eye className="w-4 h-4" /> View Live Site
          </a>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="max-w-5xl mx-auto px-8 py-10 pb-28">
          {section === "dashboard" && <Dashboard content={content} githubConfigured={githubConfigured} onSection={setSection} />}
          {section === "active" && <ActiveListingsSection listings={content.activeListings} onChange={l => setContent({ ...content, activeListings: l })} />}
          {section === "sold" && <SoldListingsSection listings={content.soldListings} onChange={l => setContent({ ...content, soldListings: l })} />}
          {section === "trackrecord" && <TrackRecordSection data={content.trackRecord} onChange={d => setContent({ ...content, trackRecord: d })} />}
          {section === "lenders" && <LendersSection lenders={content.lenders} onChange={l => setContent({ ...content, lenders: l })} />}
          {section === "settings" && <SettingsSection githubConfigured={githubConfigured} onLogout={() => { localStorage.removeItem("ck_admin_auth"); setAuthenticated(false); setContent(null); setPassword(""); }} />}
        </div>
        {section !== "dashboard" && section !== "settings" && (
          <DeployBar deploy={deploy} githubConfigured={githubConfigured} onSave={handleSave} onPublish={handlePublish} />
        )}
      </main>
    </div>
  );
}
