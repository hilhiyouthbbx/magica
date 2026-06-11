import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { saveContact } from "@/lib/contacts";

interface Player {
  firstName: string;
  lastName: string;
  grade: string;
}

interface JoinBody {
  guardianName: string;
  email: string;
  phone?: string;
  players: Player[];
  howHeard?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: JoinBody = await req.json();
    const { guardianName, email, phone, players, howHeard } = body;

    if (!guardianName || !email || !players?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ── Save to contacts DB ──────────────────────────────────────────────────
    const playerSummary = players
      .map((p) => `${p.firstName} ${p.lastName} (${p.grade})`)
      .join(", ");

    try {
      await saveContact({
        name:   guardianName,
        email,
        phone:  phone || "",
        source: "registration",
        notes:  `Membership signup — Player(s): ${playerSummary}${howHeard ? ` — Heard via: ${howHeard}` : ""}`,
      });
    } catch (err) {
      console.error("Contact save error:", err);
    }

    // ── Build player rows for email ──────────────────────────────────────────
    const playerRows = players
      .map(
        (p) => `
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:10px 12px;font-size:14px;color:#111;">${p.firstName} ${p.lastName}</td>
          <td style="padding:10px 12px;font-size:14px;color:#374151;text-align:center;">${p.grade}</td>
        </tr>`
      )
      .join("");

    // ── Admin notification email ─────────────────────────────────────────────
    const adminHtml = `
<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:system-ui,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
    <div style="background:#1e3a8a;padding:28px 32px;">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;">🏀 New Member Registration</h1>
      <p style="margin:6px 0 0;color:#93c5fd;font-size:14px;">Hilhi Youth Basketball — Membership Sign-Up</p>
    </div>
    <div style="padding:24px 32px;background:#f8fafc;border-bottom:1px solid #e5e7eb;">
      <h2 style="margin:0 0 12px;font-size:15px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.05em;">Parent / Guardian</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:4px 0;font-size:14px;color:#6b7280;width:80px;">Name</td><td style="padding:4px 0;font-size:14px;color:#111;font-weight:600;">${guardianName}</td></tr>
        <tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">Email</td><td style="padding:4px 0;font-size:14px;"><a href="mailto:${email}" style="color:#1d4ed8;">${email}</a></td></tr>
        ${phone ? `<tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">Phone</td><td style="padding:4px 0;font-size:14px;color:#111;">${phone}</td></tr>` : ""}
        ${howHeard ? `<tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">Found us</td><td style="padding:4px 0;font-size:14px;color:#374151;">${howHeard}</td></tr>` : ""}
      </table>
    </div>
    <div style="padding:24px 32px;">
      <h2 style="margin:0 0 12px;font-size:15px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.05em;">Player(s)</h2>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <thead><tr style="background:#f1f5f9;">
          <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;">Name</th>
          <th style="padding:10px 12px;text-align:center;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;">Grade</th>
        </tr></thead>
        <tbody>${playerRows}</tbody>
      </table>
    </div>
    <div style="padding:20px 32px;background:#eff6ff;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:13px;color:#1e40af;">This family has been added to your contacts list and will receive all future program updates.</p>
    </div>
  </div>
</body></html>`;

    // ── Welcome email to registrant ──────────────────────────────────────────
    const welcomeHtml = `
<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:system-ui,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
    <div style="background:#1e3a8a;padding:36px 32px;text-align:center;">
      <div style="font-size:48px;margin-bottom:12px;">🏀</div>
      <h1 style="margin:0;color:#fff;font-size:26px;font-weight:800;">Welcome to Hilhi Youth Basketball!</h1>
      <p style="margin:8px 0 0;color:#93c5fd;font-size:15px;">You're officially part of the family, ${guardianName.split(" ")[0]}.</p>
    </div>
    <div style="padding:32px;">
      <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 20px;">
        Thank you for registering with <strong>Hilhi Youth Basketball</strong>! You're now on our list to receive
        updates on upcoming camps, tryouts, game schedules, and special events.
      </p>
      <div style="background:#eff6ff;border-left:4px solid #2563eb;border-radius:4px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;color:#1e40af;font-weight:600;">What to expect:</p>
        <ul style="margin:8px 0 0;padding-left:20px;color:#1e40af;font-size:14px;line-height:2;">
          <li>Camp and tryout registration announcements</li>
          <li>Season schedules and game results</li>
          <li>Program news and team updates</li>
        </ul>
      </div>
      <p style="font-size:14px;color:#6b7280;margin:0 0 24px;">
        In the meantime, visit our website to check out upcoming events and learn more about the program.
      </p>
      <div style="text-align:center;">
        <a href="https://www.hilhiyouthbbx.com/events" style="display:inline-block;padding:14px 32px;background:#2563eb;color:#fff;font-weight:700;font-size:15px;border-radius:10px;text-decoration:none;">
          View Upcoming Events
        </a>
      </div>
    </div>
    <div style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">
        Questions? Email us at <a href="mailto:info@hilhiyouthbbx.com" style="color:#2563eb;">info@hilhiyouthbbx.com</a><br/>
        Hilhi Youth Basketball · Hillsboro, Oregon
      </p>
    </div>
  </div>
</body></html>`;

    const transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST || "smtp.gmail.com",
      port:   Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    // Send both emails in parallel
    await Promise.allSettled([
      transporter.sendMail({
        from:    `"Hilhi Youth Basketball" <${process.env.SMTP_USER}>`,
        to:      "info@hilhiyouthbbx.com",
        replyTo: email,
        subject: `New Member Sign-Up — ${guardianName} (${players.length} player${players.length > 1 ? "s" : ""})`,
        html:    adminHtml,
      }),
      transporter.sendMail({
        from:    `"Hilhi Youth Basketball" <${process.env.SMTP_USER}>`,
        to:      email,
        subject: "Welcome to Hilhi Youth Basketball! 🏀",
        html:    welcomeHtml,
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Join error:", err);
    return NextResponse.json({ error: "Failed to process registration" }, { status: 500 });
  }
}
