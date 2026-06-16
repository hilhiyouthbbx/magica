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

function gradeNum(g?: string): number {
  if (!g) return 99;
  const n = parseInt(g);
  if (!isNaN(n)) return n;
  const low = g.toLowerCase();
  if (low.includes("k")) return 0;
  if (low.includes("pre")) return -1;
  return 99;
}

function isCampSource(src: string) {
  return src !== "all" && src !== "tournament" && src !== "merch-order";
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

  let contacts: Contact[] = await getContacts();

  // ── Filter — same logic as admin page.tsx ────────────────────────────────
  contacts = contacts.filter(c => {
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
      case "shirtSize": va = fmtShirt(a.shirtSize); vb = fmtShirt(b.shirtSize); break;
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

  if (isCampSource(sourceFilter) && sourceFilter !== "all") {
    headers = [
      "Order Number","Order Date","Ticket Number","Ticket Type",
      "Camper Name","Grade","Gender","Shirt Size",
      "Parent Name","Email","Phone",
      "Emergency Contact","Emergency Phone",
      "Ticket Price","Total Amount","Payment Status","Voucher Code",
      "Tax","Wix Service Fee","Ticket Revenue",
      "Checked In","Seat Info","Benefit","Registered Date",
    ].join(",");
    rows = contacts.map(c => [
      c.orderNumber||"", c.orderDate||"", c.ticketNum||"", c.ticketType||"",
      c.camperName||"", c.grade||"", c.gender||"", fmtShirt(c.shirtSize)||"",
      c.name, c.email, c.phone,
      c.emergencyContact||"", c.emergencyPhone||"",
      c.ticketPrice||"", c.amountPaid||"",
      (() => { const f = c.paymentStatus==="Free"||parseFloat(c.amountPaid||"1")===0; return f?"Free":(c.paymentStatus||""); })(),
      c.coupon||"", c.tax||"", c.wixServiceFee||"", c.ticketRevenue||"",
      c.checkedIn||"", c.seatInfo||"", c.benefit||"",
      c.date ? new Date(c.date).toLocaleDateString() : "",
    ].map(esc).join(","));
    filename = `2026-youth-summer-camp-${today}.csv`;

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
      c.amountPaid||"", c.paymentStatus||"", c.checkedIn||"",
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
