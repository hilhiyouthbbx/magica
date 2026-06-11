import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { saveContact } from "@/lib/contacts";
import { getTournament } from "@/lib/tournament";

interface RegBody {
  tournamentId: string;
  orgName:      string;
  coachName:    string;
  coachEmail:   string;
  coachPhone:   string;
  division:     string;
  players:      string;
  notes:        string;
}

export async function POST(req: NextRequest) {
  try {
    const body: RegBody = await req.json();
    const { tournamentId, orgName, coachName, coachEmail, coachPhone, division, players, notes } = body;

    if (!tournamentId) return NextResponse.json({ error: "Missing tournamentId." }, { status: 400 });

    const tournament = await getTournament(tournamentId);
    if (!tournament?.enabled)
      return NextResponse.json({ error: "Tournament registration is not open." }, { status: 400 });

    if (!orgName || !coachName || !coachEmail || !division)
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });

    // Save contact
    try {
      await saveContact({
        name:           coachName,
        email:          coachEmail,
        phone:          coachPhone || "",
        source:         "tournament",
        tournamentName: tournament.name,
        teamName:       orgName,
        division,
        notes: `Tournament: ${tournament.name} — Team: ${orgName} — Division: ${division}`,
      });
    } catch (err) { console.error("Contact save error:", err); }

    // ── Email templates ───────────────────────────────────────────────────
    const adminHtml = `
<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:system-ui,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
    <div style="background:#1e3a8a;padding:28px 32px;">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;">🏆 New Tournament Registration</h1>
      <p style="margin:6px 0 0;color:#93c5fd;font-size:14px;">${tournament.name}</p>
    </div>
    <div style="padding:24px 32px;background:#f8fafc;border-bottom:1px solid #e5e7eb;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:5px 0;font-size:14px;color:#6b7280;width:130px;">Organization</td><td style="padding:5px 0;font-size:14px;color:#111;font-weight:700;">${orgName}</td></tr>
        <tr><td style="padding:5px 0;font-size:14px;color:#6b7280;">Division</td><td style="padding:5px 0;font-size:14px;color:#2563eb;font-weight:700;">${division}</td></tr>
        <tr><td style="padding:5px 0;font-size:14px;color:#6b7280;">Head Coach</td><td style="padding:5px 0;font-size:14px;color:#111;font-weight:600;">${coachName}</td></tr>
        <tr><td style="padding:5px 0;font-size:14px;color:#6b7280;">Coach Email</td><td style="padding:5px 0;font-size:14px;"><a href="mailto:${coachEmail}" style="color:#1d4ed8;">${coachEmail}</a></td></tr>
        ${coachPhone ? `<tr><td style="padding:5px 0;font-size:14px;color:#6b7280;">Coach Phone</td><td style="padding:5px 0;font-size:14px;">${coachPhone}</td></tr>` : ""}
        ${players ? `<tr><td style="padding:5px 0;font-size:14px;color:#6b7280;vertical-align:top;">Roster</td><td style="padding:5px 0;font-size:14px;white-space:pre-wrap;">${players}</td></tr>` : ""}
        ${notes ? `<tr><td style="padding:5px 0;font-size:14px;color:#6b7280;vertical-align:top;">Notes</td><td style="padding:5px 0;font-size:14px;">${notes}</td></tr>` : ""}
      </table>
    </div>
    <div style="padding:16px 32px;background:#eff6ff;">
      <p style="margin:0;font-size:13px;color:#1e40af;">Fee: <strong>$${tournament.entryFee}</strong> · Dates: <strong>${tournament.dates}</strong> · Venue: <strong>${tournament.venue}</strong></p>
    </div>
  </div>
</body></html>`;

    const confirmHtml = `
<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:system-ui,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
    <div style="background:#1e3a8a;padding:36px 32px;text-align:center;">
      <div style="font-size:48px;margin-bottom:12px;">🏆</div>
      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;">Registration Received!</h1>
      <p style="margin:8px 0 0;color:#93c5fd;font-size:15px;">${tournament.name}</p>
    </div>
    <div style="padding:32px;">
      <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 20px;">
        Hi ${coachName}, your team <strong>${orgName}</strong> has been registered for the <strong>${division}</strong> division.
        Our staff will review your registration and follow up shortly.
      </p>
      <div style="background:#eff6ff;border-radius:8px;padding:16px 20px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:4px 0;font-size:14px;color:#6b7280;width:120px;">Tournament</td><td style="font-size:14px;color:#1e40af;font-weight:600;">${tournament.name}</td></tr>
          <tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">Dates</td><td style="font-size:14px;color:#1e40af;font-weight:600;">${tournament.dates}</td></tr>
          <tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">Venue</td><td style="font-size:14px;color:#1e40af;font-weight:600;">${tournament.venue}</td></tr>
          <tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">Entry Fee</td><td style="font-size:14px;color:#1e40af;font-weight:600;">$${tournament.entryFee}</td></tr>
          <tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">Division</td><td style="font-size:14px;color:#1e40af;font-weight:600;">${division}</td></tr>
        </table>
      </div>
      <p style="font-size:14px;color:#6b7280;margin-top:20px;">Questions? <a href="mailto:${tournament.contactEmail}" style="color:#2563eb;">${tournament.contactEmail}</a> · ${tournament.contactPhone}</p>
    </div>
  </div>
</body></html>`;

    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await Promise.allSettled([
      transport.sendMail({ from: `"Hilhi Youth Basketball" <${process.env.SMTP_USER}>`, to: "info@hilhiyouthbbx.com", replyTo: coachEmail, subject: `Tournament Registration — ${orgName} (${division})`, html: adminHtml }),
      transport.sendMail({ from: `"Hilhi Youth Basketball" <${process.env.SMTP_USER}>`, to: coachEmail, subject: `Tournament Registration Confirmed — ${tournament.name}`, html: confirmHtml }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Tournament register error:", err);
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
