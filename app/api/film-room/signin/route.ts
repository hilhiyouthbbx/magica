import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { logVisitor } from "@/lib/filmroom";

export const dynamic = "force-dynamic";

const TEAM_PW_DEFAULT  = "hilhi-team";
const COACH_PW_DEFAULT = "Kem-admin";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name?.trim())     return NextResponse.json({ error: "Please enter your name." },          { status: 400 });
    if (!password?.trim()) return NextResponse.json({ error: "Please enter the team password." }, { status: 400 });

    // Coach/admin password (env var COACH_PASSWORD or default)
    const coachPw = process.env.COACH_PASSWORD || COACH_PW_DEFAULT;
    const isCoach = password.trim() === coachPw;

    // Load both passwords from content (admin-configurable)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    let teamPw    = process.env.TEAM_PASSWORD  || TEAM_PW_DEFAULT;
    let coachPwFinal = coachPw; // already set from env/default
    try {
      const res  = await fetch(`${baseUrl}/api/content`, { cache: "no-store" });
      const data = await res.json();
      if (data?.videoRoom?.password)      teamPw      = data.videoRoom.password;
      if (data?.videoRoom?.coachPassword) coachPwFinal = data.videoRoom.coachPassword;
    } catch { /* use defaults */ }

    // Re-check coach password with content value
    const isCoachFinal = password.trim() === coachPwFinal;
    if (!isCoachFinal && password.trim() !== teamPw) {
      return NextResponse.json({ error: "Incorrect password. Please try again." }, { status: 401 });
    }
    const isCoachResolved = isCoachFinal;

    // Log visitor + update tally
    const { entry, tally } = await logVisitor({
      name:      name.trim(),
      email:     email?.trim() || "",
      enteredAt: new Date().toISOString(),
    });

    // Skip notifications when Coach signs in (it's you — no need to alert yourself)
    if (!isCoachResolved) {
      const time = new Date().toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
        weekday: "short", month: "short", day: "numeric",
        hour: "numeric", minute: "2-digit", hour12: true,
      });

      const visitWord = tally.count === 1 ? "1st visit" : `visit #${tally.count}`;

      try {
        const smtpHost = process.env.SMTP_HOST;
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;

        if (smtpHost && smtpUser && smtpPass) {
          const transporter = nodemailer.createTransport({
            host: smtpHost, port: Number(process.env.SMTP_PORT || 587), secure: false,
            auth: { user: smtpUser, pass: smtpPass },
          });

          // Push notification via ntfy.sh
          try {
            await fetch("https://ntfy.sh/hilhi-filmroom-alerts", {
              method:  "POST",
              headers: { "Title": "Film Room", "Priority": "high", "Tags": "basketball" },
              body: `${name.trim()} just signed in (${visitWord}) - ${time}`,
            });
          } catch (ntfyErr) {
            console.error("ntfy notification failed:", ntfyErr);
          }

          await Promise.allSettled([
            transporter.sendMail({
              from:    `"Hilhi Youth Basketball" <${smtpUser}>`,
              to:      "info@hilhiyouthbbx.com",
              subject: `Film Room: ${name.trim()} signed in (${visitWord})`,
              text:    `Film Room: ${name.trim()} signed in (${visitWord}) - ${time}`,
              html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:20px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto">
  <tr><td style="background:linear-gradient(135deg,#0f172a,#1e3a8a);border-radius:12px 12px 0 0;padding:22px 28px">
    <table cellpadding="0" cellspacing="0"><tr>
      <td style="padding-right:12px;vertical-align:middle">
        <img src="https://www.hilhiyouthbbx.com/logo.png" alt="Hilhi" width="42" height="42" style="display:block;border-radius:8px"/>
      </td>
      <td style="vertical-align:middle">
        <div style="color:#fff;font-size:16px;font-weight:800">🎬 Film Room Entry</div>
        <div style="color:#93c5fd;font-size:12px;margin-top:2px">Someone just signed in</div>
      </td>
    </tr></table>
  </td></tr>

  <tr><td style="background:#fff;padding:24px 28px;border-radius:0 0 12px 12px">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8faff;border:1.5px solid #e2e8f0;border-radius:10px;margin-bottom:16px">
      <tr><td style="padding:18px 22px">
        <div style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">Viewer Details</div>
        <table cellpadding="0" cellspacing="0">
          <tr><td style="color:#64748b;font-size:13px;width:80px;padding:4px 0">Name</td>
              <td style="color:#0f172a;font-weight:700;font-size:15px;padding:4px 0">${name.trim()}</td></tr>
          ${email?.trim() ? `<tr><td style="color:#64748b;font-size:13px;padding:4px 0">Email</td>
              <td style="font-size:13px;padding:4px 0"><a href="mailto:${email.trim()}" style="color:#1d4ed8">${email.trim()}</a></td></tr>` : ""}
          <tr><td style="color:#64748b;font-size:13px;padding:4px 0">Time</td>
              <td style="color:#0f172a;font-weight:600;font-size:13px;padding:4px 0">${time}</td></tr>
        </table>
      </td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:${tally.count === 1 ? "#f0fdf4" : "#eff6ff"};border:1.5px solid ${tally.count === 1 ? "#86efac" : "#bfdbfe"};border-radius:10px;margin-bottom:16px">
      <tr><td style="padding:14px 22px;text-align:center">
        <div style="font-size:32px;font-weight:900;color:${tally.count === 1 ? "#15803d" : "#1d4ed8"}">${tally.count}×</div>
        <div style="font-size:13px;color:${tally.count === 1 ? "#166534" : "#1e40af"};font-weight:600">
          ${tally.count === 1 ? "First time in the Film Room! 🎉" : `Total Film Room visits by ${name.trim()}`}
        </div>
        ${tally.count > 1 ? `<div style="font-size:12px;color:#64748b;margin-top:4px">First visit: ${new Date(tally.firstSeen).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>` : ""}
      </td></tr>
    </table>

    <p style="color:#64748b;font-size:12px;margin:0;text-align:center">
      <a href="https://www.hilhiyouthbbx.com/admin" style="color:#1d4ed8;font-weight:600">Admin Dashboard → Film Room tab</a>
    </p>
  </td></tr>

  <tr><td style="padding:14px 0;text-align:center">
    <p style="color:#94a3b8;font-size:12px;margin:0">Hilhi Youth Basketball · <a href="https://www.hilhiyouthbbx.com" style="color:#60a5fa">hilhiyouthbbx.com</a></p>
  </td></tr>
</table>
</body></html>`,
            }),
          ]);
        }
      } catch (e) {
        console.error("Film room notification failed:", e);
      }
    }

    return NextResponse.json({ ok: true, visitorId: entry.id, visitCount: tally.count, isCoach: isCoachResolved });
  } catch (err) {
    console.error("Film room signin error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
