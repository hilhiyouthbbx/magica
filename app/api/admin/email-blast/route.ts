import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getContacts, type Contact } from "@/lib/contacts";

export const dynamic = "force-dynamic";

function checkAuth(req: NextRequest) {
  const key      = req.nextUrl.searchParams.get("key") || "";
  const expected = process.env.ADMIN_PASSWORD || "hilhi-admin";
  return key === expected;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Turns plain-text (blank line = new paragraph, single line break = line break within a
 *  paragraph — e.g. a "Coach Kem / Hilhi Youth Basketball" signature) into a simple, branded
 *  HTML email. Line breaks are converted to explicit <br/> tags rather than relying on CSS
 *  white-space, since several email clients (Outlook especially) don't reliably honor that. */
function blastHtml(subject: string, message: string, firstName?: string): string {
  const greeted = firstName ? message.replace(/\{\{name\}\}/gi, firstName) : message.replace(/\{\{name\}\}/gi, "there");
  const paragraphs = greeted
    .split(/\n\s*\n/)
    .map(p => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("");

  return `
<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="color-scheme" content="light"/><meta name="supported-color-schemes" content="light"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:system-ui,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr>
          <td bgcolor="#1e3a8a" style="background-color:#1e3a8a;padding:24px 32px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="padding-right:16px;vertical-align:middle;">
                <img src="https://www.hilhiyouthbbx.com/spartan-head-white.png" alt="Hilhi Spartans" width="60" height="63" style="display:block;border:0;" />
              </td>
              <td style="vertical-align:middle;">
                <span style="display:inline-block;color:#ffffff !important;font-size:28px;font-weight:800;line-height:1.2;font-family:system-ui,sans-serif;">Hilhi Youth Basketball</span>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            ${paragraphs}
          </td>
        </tr>
        <tr>
          <td bgcolor="#f8fafc" style="background-color:#f8fafc;padding:20px 32px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              Hilhi Youth Basketball · Hillsboro, Oregon<br/>
              Questions? Email us at <a href="mailto:info@hilhiyouthbbx.com" style="color:#2563eb;">info@hilhiyouthbbx.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

interface BlastBody {
  subject: string;
  message: string;
  /** "" / omitted = all sources. Otherwise an exact source string (e.g. "2025-2026 Youth Registration"). */
  source?: string;
  /** Case-insensitive substring match against name/email — applied on top of `source`. */
  search?: string;
  /** Explicit contact IDs to send to — if provided, overrides source/search filtering entirely. */
  contactIds?: string[];
  /** If true, sends only ONE email — to testEmail — using the same template, no real contacts touched. */
  testEmail?: string;
}

function matchingContacts(all: Contact[], body: BlastBody): Contact[] {
  let list = all.filter(c => c.email && c.email.includes("@") && !c.email.includes("noemail"));

  if (Array.isArray(body.contactIds) && body.contactIds.length > 0) {
    const idSet = new Set(body.contactIds);
    return list.filter(c => idSet.has(c.id));
  }

  if (body.source && body.source.trim()) {
    const src = body.source.trim().toLowerCase();
    list = list.filter(c => c.source.trim().toLowerCase() === src);
  }
  if (body.search && body.search.trim()) {
    const q = body.search.trim().toLowerCase();
    list = list.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }

  // De-dupe by email — the same person can appear multiple times across camp/tryout/tournament rows.
  const seen = new Set<string>();
  return list.filter(c => {
    const e = c.email.toLowerCase();
    if (seen.has(e)) return false;
    seen.add(e);
    return true;
  });
}

// GET — preview how many contacts match a given source/search, without sending anything.
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const source = req.nextUrl.searchParams.get("source") || "";
  const search = req.nextUrl.searchParams.get("search") || "";
  const all = await getContacts();
  const matches = matchingContacts(all, { subject: "", message: "", source, search });
  return NextResponse.json({ count: matches.length });
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpHost || !smtpUser || !smtpPass) {
    return NextResponse.json({
      error: "Email not configured. Please add SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_PORT to your Vercel environment variables.",
    }, { status: 503 });
  }

  const body = await req.json() as BlastBody;
  if (!body.subject?.trim() || !body.message?.trim()) {
    return NextResponse.json({ error: "Subject and message are required." }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    host:   smtpHost,
    port:   Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth:   { user: smtpUser, pass: smtpPass },
  });

  // ── Test send — sends its OWN individual email to each address, exactly like the real
  //   bulk send does — never touches real contacts. Accepts multiple addresses separated by
  //   commas/semicolons/whitespace so you can test how it looks for more than one person at once,
  //   without them ending up in the same "To:" line seeing each other.
  if (body.testEmail?.trim()) {
    const testAddrs = [...new Set(
      body.testEmail.split(/[,;\s]+/).map(s => s.trim()).filter(s => s.includes("@"))
    )];
    if (testAddrs.length === 0) {
      return NextResponse.json({ error: "Enter at least one valid email address." }, { status: 400 });
    }
    try {
      await Promise.all(testAddrs.map(addr =>
        transporter.sendMail({
          from:    `"Hilhi Youth Basketball" <${smtpUser}>`,
          to:      addr,
          subject: `[TEST] ${body.subject}`,
          html:    blastHtml(body.subject, body.message, "Coach"),
        })
      ));
      return NextResponse.json({ ok: true, sent: testAddrs.length, test: true });
    } catch (e) {
      return NextResponse.json({ error: `Test send failed: ${String(e)}` }, { status: 500 });
    }
  }

  // ── Real bulk send ──────────────────────
  const allContacts = await getContacts();
  const targets = matchingContacts(allContacts, body);
  if (targets.length === 0) {
    return NextResponse.json({ error: "No matching contacts with valid email addresses found." }, { status: 400 });
  }

  let sent = 0, failed = 0;
  const errors: string[] = [];

  // Send in small batches so one slow/failed send doesn't block everything, and so we don't
  // hammer the SMTP server with hundreds of simultaneous connections.
  const BATCH = 10;
  for (let i = 0; i < targets.length; i += BATCH) {
    const batch = targets.slice(i, i + BATCH);
    await Promise.all(batch.map(async (contact) => {
      try {
        const firstName = (contact.name || "").split(" ")[0] || undefined;
        await transporter.sendMail({
          from:    `"Hilhi Youth Basketball" <${smtpUser}>`,
          to:      contact.email,
          subject: body.subject,
          html:    blastHtml(body.subject, body.message, firstName),
        });
        sent++;
      } catch (e) {
        failed++;
        errors.push(`${contact.email}: ${String(e)}`);
      }
    }));
  }

  return NextResponse.json({ ok: true, sent, failed, total: targets.length, errors: errors.slice(0, 5) });
}
