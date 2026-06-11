import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getContacts } from "@/lib/contacts";
import { campConfirmationHtml } from "@/lib/email";

export const dynamic = "force-dynamic";

function checkAuth(req: NextRequest) {
  const key      = req.nextUrl.searchParams.get("key") || "";
  const expected = process.env.ADMIN_PASSWORD || "hilhi-admin";
  return key === expected;
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    return NextResponse.json({
      error: "Email not configured. Please add SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_PORT to your Vercel environment variables.",
    }, { status: 503 });
  }

  const body = await req.json() as { contactIds?: string[]; sendToAll?: boolean };

  // Load contacts
  const allContacts = await getContacts();
  const isCamp = (src: string) =>
    src === "registration" || src.includes("Camp") || src.includes("Summer");

  let targets = allContacts.filter(c => isCamp(c.source) && c.email && !c.email.includes("noemail"));

  if (!body.sendToAll && Array.isArray(body.contactIds) && body.contactIds.length > 0) {
    const idSet = new Set(body.contactIds);
    targets = targets.filter(c => idSet.has(c.id));
  }

  if (targets.length === 0) {
    return NextResponse.json({ error: "No valid camp contacts with email addresses found." }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    host:   smtpHost,
    port:   Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth:   { user: smtpUser, pass: smtpPass },
  });

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const contact of targets) {
    try {
      const parentFirstName = contact.name.split(" ")[0];

      // Build camper list from stored fields
      const camperNames  = (contact.camperName || contact.name).split(",").map(s => s.trim());
      const grades       = (contact.grade || "").split(",").map(s => s.trim());
      const genders      = (contact.gender || "").split(",").map(s => s.trim());
      const shirtSizes   = (contact.shirtSize || "").split(",").map(s => s.trim());

      const campers = camperNames.map((name, i) => ({
        name,
        grade:     grades[i]     || "",
        gender:    genders[i]    || "",
        shirtSize: shirtSizes[i] || "",
      }));

      const html = campConfirmationHtml({
        parentFirstName,
        campers,
        total:       contact.amountPaid || contact.ticketPrice || "0.00",
        orderNumber: contact.orderNumber,
      });

      await transporter.sendMail({
        from:    smtpUser,
        to:      contact.email,
        subject: "🏀 Your Camp Registration is Confirmed — Hilhi Youth Basketball",
        html,
      });

      sent++;
    } catch (e) {
      failed++;
      errors.push(`${contact.email}: ${String(e)}`);
    }
  }

  return NextResponse.json({ ok: true, sent, failed, errors: errors.slice(0, 5) });
}
