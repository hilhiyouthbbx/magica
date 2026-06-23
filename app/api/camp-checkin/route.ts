import { NextRequest, NextResponse } from "next/server";
import { getCheckIns, setCheckIn, clearCheckIns } from "@/lib/camp-checkin";
import type { DayKey } from "@/lib/camp-checkin";
import { getContacts } from "@/lib/contacts";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

const adminPw = () => process.env.ADMIN_PASSWORD ?? "hilhi-admin";
const coachPw = () => process.env.COACH_PASSWORD ?? "Kem-admin";
const isAdmin = (key: string | null) => key === adminPw() || key === coachPw();

// GET — return full check-in map
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!isAdmin(key)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const map = await getCheckIns();
  return NextResponse.json({ checkIns: map });
}

// POST — toggle a single check-in OR send absent notifications
export async function POST(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!isAdmin(key)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    action: "toggle" | "send-absent";
    contactId?: string;
    day?: DayKey;
    checked?: boolean;
    dayLabel?: string;
    campName?: string;
  };

  if (body.action === "toggle" && body.contactId && body.day) {
    const map = await setCheckIn(body.contactId, body.day, body.checked ?? true);
    return NextResponse.json({ ok: true, checkIns: map });
  }

  if (body.action === "send-absent" && body.day) {
    const result = await sendAbsentEmails(body.day, body.dayLabel ?? body.day, body.campName ?? "Hilhi Youth Basketball Camp");
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

// DELETE — clear all check-ins
export async function DELETE(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!isAdmin(key)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await clearCheckIns();
  return NextResponse.json({ ok: true });
}

// ── Send absent notifications ────────────────────────────────────────────────
async function sendAbsentEmails(day: DayKey, dayLabel: string, campName: string) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    return { ok: false, error: "Email not configured. Add SMTP_HOST, SMTP_USER, SMTP_PASS to Vercel env vars.", sent: 0, skipped: 0 };
  }

  const [contacts, checkIns] = await Promise.all([getContacts(), getCheckIns()]);

  // Match the same roster rules used by the admin Check-In screen:
  // 1) must have a camper name
  // 2) must be confirmed/paid/free/approved, or blank payment status
  // 3) must have a real grade number so hidden/unknown roster rows are not emailed
  // 4) de-dupe by camper name + parent email so duplicate contact rows do not get random absent emails
  const isConfirmed = (paymentStatus?: string) => {
    const s = (paymentStatus ?? "").trim();
    return s === "" || /paid|free|manual payment approved|approved/i.test(s);
  };

  const gradeNum = (grade?: string) => {
    const m = (grade ?? "").match(/\d+/);
    return m ? Number(m[0]) : 99;
  };

  const norm = (s?: string) => (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  const camperKey = (c: { camperName?: string; email?: string }) => `${norm(c.camperName)}|${norm(c.email)}`;

  const seen = new Set<string>();
  const campers = contacts
    .filter(c => c.camperName?.trim())
    .filter(c => isConfirmed(c.paymentStatus))
    .filter(c => gradeNum(c.grade) !== 99)
    .filter(c => {
      const key = camperKey(c);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  // Treat duplicate rows for the same camper/email as present if ANY matching row was checked in.
  // This prevents checked-in campers from being emailed when duplicate contact records exist.
  const checkedKeys = new Set<string>();
  for (const c of contacts) {
    if (checkIns[c.id]?.[day]) checkedKeys.add(camperKey(c));
  }

  const absent = campers.filter(c => !checkIns[c.id]?.[day] && !checkedKeys.has(camperKey(c)));

  if (absent.length === 0) {
    return { ok: true, sent: 0, skipped: 0, message: "All registered campers are checked in!" };
  }

  const transporter = nodemailer.createTransport({
    host:   smtpHost,
    port:   Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth:   { user: smtpUser, pass: smtpPass },
  });

  let sent = 0, failed = 0;
  const errors: string[] = [];

  for (const camper of absent) {
    const parentEmail = camper.email?.trim();
    if (!parentEmail || !parentEmail.includes("@")) { failed++; continue; }

    const parentFirst = (camper.name ?? "").split(" ")[0] || "Parent";
    const camperName  = camper.camperName ?? "your camper";
    const subject     = `We missed ${camperName} at camp today! 🏀`;

    const html = absentEmailHtml({ parentFirst, camperName, dayLabel, campName });

    try {
      await transporter.sendMail({
        from:    `"${campName}" <${smtpUser}>`,
        to:      parentEmail,
        subject,
        html,
      });
      sent++;
    } catch (e) {
      failed++;
      errors.push(`${parentEmail}: ${String(e)}`);
    }
  }

  return { ok: true, sent, failed, total: absent.length, errors };
}

function absentEmailHtml(opts: {
  parentFirst: string;
  camperName:  string;
  dayLabel:    string;
  campName:    string;
}) {
  const { parentFirst, camperName, dayLabel, campName } = opts;
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#eef2ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2ff;padding:40px 16px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.12)">

  <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1d4ed8 60%,#4f46e5 100%);padding:36px;text-align:center">
    <div style="font-size:48px;margin-bottom:12px">🏀💙</div>
    <h1 style="color:#ffffff;margin:0 0 8px;font-size:28px;font-weight:900;letter-spacing:-0.5px">
      We Missed You Today, ${camperName}!
    </h1>
    <p style="color:#bfdbfe;margin:0;font-size:15px">${campName} · ${dayLabel}</p>
  </td></tr>

  <tr><td style="background:#ffffff;padding:36px">
    <p style="color:#0f172a;font-size:16px;line-height:1.7;margin:0 0 20px">
      Hi ${parentFirst},
    </p>
    <p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 20px">
      We noticed that <strong style="color:#1d4ed8">${camperName}</strong> wasn't with us on <strong>${dayLabel}</strong> of camp. We hope everything is okay!
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#eff6ff,#e0f2fe);border:2px solid #bae6fd;border-radius:14px;margin:0 0 24px">
      <tr><td style="padding:20px 24px;text-align:center">
        <div style="font-size:32px;margin-bottom:8px">🌟</div>
        <p style="margin:0;color:#0369a1;font-size:15px;font-weight:700;line-height:1.5">
          Camp continues — we'd love to see ${camperName} back out there!<br/>
          <span style="font-weight:400;font-size:14px">Every day on the court is a chance to grow.</span>
        </p>
      </td></tr>
    </table>
    <p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 24px">
      If ${camperName} is unable to attend the rest of camp, please let us know so we can plan accordingly. We truly hope to see them back soon — their teammates and coaches miss them!
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8faff;border:1px solid #e2e8f0;border-radius:12px;margin:0 0 28px">
      <tr><td style="padding:18px 22px">
        <div style="font-size:12px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Questions or concerns?</div>
        <p style="margin:0;color:#334155;font-size:14px;line-height:1.7">
          📧 <a href="mailto:info@hilhiyouthbbx.com" style="color:#1d4ed8;font-weight:600">info@hilhiyouthbbx.com</a><br/>
          📞 <a href="tel:9715630552" style="color:#1d4ed8;font-weight:600">971-563-0552</a>
        </p>
      </td></tr>
    </table>
    <p style="color:#334155;font-size:15px;line-height:1.7;margin:0">
      With basketball love,<br/>
      <strong style="color:#0f172a">The Hilhi Youth Basketball Team 🏀</strong>
    </p>
  </td></tr>

  <tr><td style="background:#0f172a;padding:20px 36px;text-align:center">
    <p style="color:#94a3b8;font-size:12px;margin:0">
      Hilhi Youth Basketball · Hillsboro, OR ·
      <a href="https://www.hilhiyouthbbx.com" style="color:#60a5fa;text-decoration:none">hilhiyouthbbx.com</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
