import { NextRequest, NextResponse } from "next/server";
import { getContacts, Contact } from "@/lib/contacts";

function auth(req: NextRequest) {
  const key      = req.nextUrl.searchParams.get("key") || "";
  const expected = process.env.ADMIN_PASSWORD || "hilhi-admin";
  return key === expected;
}

function esc(v: unknown) {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

function fmtShirt(s?: string): string {
  if (!s) return "";
  const parenMatch = s.trim().match(/^([A-Za-z]+)\s*\(/);
  if (parenMatch) return fmtShirt(parenMatch[1]);
  const k = s.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const map: Record<string, string> = {
    youthsmall:"YS", youthmedium:"YM", youthlarge:"YL", youthxlarge:"YXL", youthxl:"YXL",
    ys:"YS", ym:"YM", yl:"YL", yxl:"YXL",
    adultsmall:"AS", adultmedium:"AM", adultlarge:"AL", adultxlarge:"AXL", adultxl:"AXL",
    as:"AS", am:"AM", al:"AL", axl:"AXL",
    s:"AS", m:"AM", l:"AL", xl:"AXL",
  };
  return map[k] ?? s.trim();
}

function shirtSizeOrder(s?: string): number {
  const order = ["YS","YM","YL","YXL","AS","AM","AL","AXL"];
  const i = order.indexOf(fmtShirt(s));
  return i === -1 ? 99 : i;
}

function gradeNum(g?: string): number {
  if (!g) return 99;
  const n = parseInt(g);
  if (!isNaN(n)) return n;
  const low = g.toLowerCase();
  if (low.includes("k")) return 0;
  if (low.includes("pre")) return -1;
  return 99;
}

// Must match the admin page: only camp registrations count as "camp". (This used to treat EVERY
// source other than tournament/merch as camp, so picking Tryout/Raffle/etc. exported everything.)
function isCampSource(src: string) {
  return src === "registration" || src.includes("Camp") || src.includes("Summer");
}

const SOURCE_LABELS: Record<string, string> = { "registration": "2026 Youth Summer Camp", "merch-order": "Merch Order", "import": "Import", "tournament": "Tournament", "tryout": "2026-2027 Youth Tryout", "membership-signup": "Membership Sign-Up", "raffle": "Fundraiser Raffle" };

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "contacts";
}

export async function GET(req: NextRequest) {
  if (!auth(req)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const p           = req.nextUrl.searchParams;
  const sourceFilter = p.get("source")  || "all";
  const tournFilter  = p.get("tourn")   || "all";
  const gradeFilter  = p.get("grade")   || "all";
  const genderFilter = p.get("gender")  || "all";
  const searchQ      = (p.get("q")      || "").toLowerCase();
  const sortField    = p.get("sort")    || "date";
  const sortDir      = (p.get("dir")    || "desc") as "asc" | "desc";
  const sourcesParam = (p.get("sources") || "").split(",").map(x => x.trim()).filter(Boolean);

  let contacts: Contact[] = await getContacts();

  // ── Filter — same logic as admin page.tsx ────────────────────────────────
  contacts = contacts.filter(c => {
    if (sourcesParam.length > 0) return sourcesParam.includes(c.source);
    if (sourceFilter !== "all") {
      if (isCampSource(sourceFilter) ? !isCampSource(c.source) : c.source !== sourceFilter) return false;
    }
    if (tournFilter !== "all" && c.tournamentName !== tournFilter) return false;
    if (gradeFilter !== "all" && (c.grade || "").trim() !== gradeFilter) return false;
    if (genderFilter !== "all" && (c.gender || "").trim() !== genderFilter) return false;
    if (searchQ) {
      const hay = [c.name, c.email, c.phone, c.camperName, c.teamName, c.grade].join(" ").toLowerCase();
      if (!hay.includes(searchQ)) return false;
    }
    return true;
  });

  // ── Sort ──────────────────────────────────────────────────────────────────
  contacts.sort((a, b) => {
    let va: unknown, vb: unknown;
    switch (sortField) {
      case "grade":     va = gradeNum(a.grade);  vb = gradeNum(b.grade);  break;
      case "name":      va = a.name;              vb = b.name;             break;
      case "camperName":va = a.camperName;        vb = b.camperName;       break;
      case "email":     va = a.email;             vb = b.email;            break;
      case "gender":    va = a.gender;            vb = b.gender;           break;
      case "shirtSize": va = shirtSizeOrder(a.shirtSize); vb = shirtSizeOrder(b.shirtSize); break;
      default:          va = a.date;              vb = b.date;             break;
    }
    const dir = sortDir === "asc" ? 1 : -1;
    if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
    return String(va ?? "").localeCompare(String(vb ?? "")) * dir;
  });

  // ── Build CSV ─────────────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  let headers: string;
  let rows: string[];
  let filename: string;

  if (sourcesParam.length > 0) {
    const LABELS = SOURCE_LABELS;
    headers = ["Source","Order Number","Order Date","Camper Name","Grade","Gender","Shirt Size","Parent Name","Email","Phone","Emergency Contact","Emergency Phone","Total Amount","Payment Status","Checked In","Tournament","Team","Division","Notes","Date"].join(",");
    rows = contacts.map(c => [
      LABELS[c.source] || c.source, c.orderNumber||"", c.orderDate||"",
      c.camperName||"", c.grade||"", c.gender||"", fmtShirt(c.shirtSize)||"",
      c.name, c.email, c.phone,
      c.emergencyContact||"", c.emergencyPhone||"",
      c.amountPaid||"", c.paymentStatus||"", c.checkedIn||"",
      c.tournamentName||"", c.teamName||"", c.division||"",
      c.notes||"", c.date ? new Date(c.date).toLocaleDateString() : "",
    ].map(esc).join(","));
    filename = `hilhi-contacts-${sourcesParam.length}-sources-${today}.csv`;
  }
  else
  if (isCampSource(sourceFilter) && sourceFilter !== "all") {
    headers = [
      "Ticket Type",
      "Camper Name","Grade","Gender","Shirt Size",
      "Parent Name","Email","Phone",
      "Emergency Contact","Emergency Phone",
      "Ticket Price","Total Amount","Payment Status","Voucher Code",
      "Service Charge","Ticket Revenue",
      "Checked In","Registered Date",
    ].join(",");
    rows = contacts.map(c => [
      c.source||"",
      c.camperName||"", c.grade||"", c.gender||"", fmtShirt(c.shirtSize)||"",
      c.name, c.email, c.phone,
      c.emergencyContact||"", c.emergencyPhone||"",
      c.ticketPrice||"", c.amountPaid||"",
      (() => { const f = c.paymentStatus==="Free"||parseFloat(c.amountPaid||"1")===0; return f?"Free":(c.paymentStatus||""); })(),
      c.coupon||"", c.wixServiceFee||"", c.ticketRevenue||"",
      (()=>{ const _v=(c.checkedIn||"").trim().toLowerCase(); return (_v===""||_v==="no"||_v==="false") ? "" : (c.checkedIn||""); })(),
      c.date ? new Date(c.date).toLocaleDateString() : "",
    ].map(esc).join(","));
    filename = `${slug(SOURCE_LABELS[sourceFilter] || sourceFilter)}-${today}.csv`;

  } else if (sourceFilter === "tournament") {
    headers = "Name,Email,Phone,Tournament,Team Name,Division,Notes,Date";
    rows = contacts.map(c => [c.name,c.email,c.phone,c.tournamentName||"",c.teamName||"",c.division||"",c.notes||"",c.date].map(esc).join(","));
    filename = tournFilter !== "all"
      ? `${tournFilter.toLowerCase().replace(/\s+/g,"-")}-registrations-${today}.csv`
      : `tournament-registrations-${today}.csv`;

  } else if (sourceFilter === "merch-order") {
    headers = "Name,Email,Phone,Notes,Date";
    rows = contacts.map(c => [c.name,c.email,c.phone,c.notes||"",c.date].map(esc).join(","));
    filename = `merch-orders-${today}.csv`;

  } else if (sourceFilter !== "all") {
    // Any other specific source (tryout, raffle, import, membership sign-up, custom imports):
    // export just that source, with Notes (promo code, amount due, etc.) included.
    headers = ["Source","Order Number","Order Date","Camper Name","Grade","Gender","Shirt Size","Parent Name","Email","Phone","Emergency Contact","Emergency Phone","Total Amount","Payment Status","Checked In","Notes","Date"].join(",");
    rows = contacts.map(c => [
      SOURCE_LABELS[c.source] || c.source, c.orderNumber||"", c.orderDate||"",
      c.camperName||"", c.grade||"", c.gender||"", fmtShirt(c.shirtSize)||"",
      c.name, c.email, c.phone,
      c.emergencyContact||"", c.emergencyPhone||"",
      c.amountPaid||"", c.paymentStatus||"",
      (c.tryoutCheckedIn && c.tryoutCheckedIn2) ? "Day 1 & Day 2" : c.tryoutCheckedIn ? "Day 1" : c.tryoutCheckedIn2 ? "Day 2" : ((() => { const _v=(c.checkedIn||"").trim().toLowerCase(); return (_v===""||_v==="no"||_v==="false") ? "" : (c.checkedIn||""); })()),
      c.notes||"", c.date ? new Date(c.date).toLocaleDateString() : "",
    ].map(esc).join(","));
    filename = `${slug(SOURCE_LABELS[sourceFilter] || sourceFilter)}-${today}.csv`;

  } else {
    headers = [
      "Source","Order Number","Order Date",
      "Camper Name","Grade","Gender","Shirt Size",
      "Parent Name","Email","Phone",
      "Emergency Contact","Emergency Phone",
      "Total Amount","Payment Status","Checked In",
      "Tournament","Team","Division","Date",
    ].join(",");
    rows = contacts.map(c => [
      c.source, c.orderNumber||"", c.orderDate||"",
      c.camperName||"", c.grade||"", c.gender||"", fmtShirt(c.shirtSize)||"",
      c.name, c.email, c.phone,
      c.emergencyContact||"", c.emergencyPhone||"",
      c.amountPaid||"", c.paymentStatus||"", (()=>{ const _v=(c.checkedIn||"").trim().toLowerCase(); return (_v===""||_v==="no"||_v==="false") ? "" : (c.checkedIn||""); })(),
      c.tournamentName||"", c.teamName||"", c.division||"",
      c.date ? new Date(c.date).toLocaleDateString() : "",
    ].map(esc).join(","));
    filename = `hilhi-all-contacts-${today}.csv`;
  }

  const csv = "﻿" + [headers, ...rows].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
