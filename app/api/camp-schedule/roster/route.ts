import { NextRequest, NextResponse } from "next/server";
import { getContacts } from "@/lib/contacts";

export const dynamic = "force-dynamic";

export interface CamperRosterEntry {
  id:          string;  // contact.id
  fullName:    string;  // camperName or parsed from name
  displayName: string;  // "First L."
  grade:       string;  // raw grade string
  gradeNum:    number;  // 1–8 for sorting (99 = unknown)
}

/** Parse a grade string like "3rd", "4th Grade", "Grade 5", "5" → number */
function parseGradeNum(raw: string | undefined): number {
  if (!raw) return 99;
  const m = raw.match(/\d+/);
  return m ? parseInt(m[0], 10) : 99;
}

/** "John Smith"  → "John S."
 *  "John"        → "John"
 *  ""            → "Unknown" */
function formatDisplay(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "Unknown";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

export async function GET(_req: NextRequest) {
  const contacts = await getContacts();

  // Filter to contacts that look like camp registrations:
  //   - source contains "camp" (case-insensitive)  OR source contains "2026"
  //   - AND have a camperName (or at least a name)
  const campContacts = contacts.filter(c => {
    const src = (c.source ?? "").toLowerCase();
    const isCamp = src.includes("camp") || src.includes("2026");
    const hasPlayer = !!(c.camperName?.trim() || c.name?.trim());
    return isCamp && hasPlayer;
  });

  const campers: CamperRosterEntry[] = campContacts.map(c => {
    const fullName = (c.camperName?.trim() || c.name?.trim()) ?? "Unknown";
    const grade    = c.grade?.trim() ?? "";
    return {
      id:          c.id,
      fullName,
      displayName: formatDisplay(fullName),
      grade,
      gradeNum:    parseGradeNum(grade),
    };
  });

  // Sort by grade number, then alphabetically within each grade
  campers.sort((a, b) => {
    if (a.gradeNum !== b.gradeNum) return a.gradeNum - b.gradeNum;
    return a.fullName.localeCompare(b.fullName);
  });

  return NextResponse.json({ campers });
}
