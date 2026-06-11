// ── Shared email helpers ───────────────────────────────────────────────────

export function campConfirmationHtml(opts: {
  parentFirstName: string;
  campers: Array<{ name: string; grade: string; gender: string; shirtSize: string }>;
  total: string;
  paymentId?: string;
  orderNumber?: string;
}) {
  const { parentFirstName, campers, total, paymentId, orderNumber } = opts;
  const isFree = parseFloat(total) === 0;

  const camperRows = campers.map((c, i) => `
    <tr style="background:${i % 2 === 0 ? "#ffffff" : "#f8faff"}">
      <td style="padding:14px 20px;border-bottom:1px solid #e8edf5">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#1d4ed8,#7c3aed);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:14px;flex-shrink:0">${c.name.charAt(0)}</div>
          <span style="font-weight:700;color:#0f172a;font-size:15px">${c.name}</span>
        </div>
      </td>
      <td style="padding:14px 20px;border-bottom:1px solid #e8edf5;text-align:center;color:#475569;font-size:14px">${c.grade}</td>
      <td style="padding:14px 20px;border-bottom:1px solid #e8edf5;text-align:center">
        <span style="background:${c.gender === "Girls" ? "#fdf2f8" : "#eff6ff"};color:${c.gender === "Girls" ? "#be185d" : "#1d4ed8"};padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600">${c.gender}</span>
      </td>
      <td style="padding:14px 20px;border-bottom:1px solid #e8edf5;text-align:center">
        <span style="background:#fff7ed;color:#c2410c;padding:4px 12px;border-radius:20px;font-weight:700;font-size:13px">${c.shirtSize}</span>
      </td>
    </tr>`).join("");

  const refLine = orderNumber
    ? `<span style="font-family:monospace;background:#f1f5f9;padding:2px 8px;border-radius:4px;font-size:13px;color:#475569">Order #${orderNumber}</span>`
    : paymentId
    ? `<span style="font-family:monospace;background:#f1f5f9;padding:2px 8px;border-radius:4px;font-size:13px;color:#475569">${paymentId.substring(0, 20)}…</span>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Camp Registration Confirmed</title>
</head>
<body style="margin:0;padding:0;background:#eef2ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2ff;padding:40px 16px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.12)">

  <!-- ── TOP BANNER ── -->
  <tr><td style="background:linear-gradient(90deg,#fbbf24,#f59e0b,#fbbf24);padding:16px 24px;text-align:center">
    <div style="font-size:13px;font-weight:900;color:#1c1917;letter-spacing:2px;text-transform:uppercase;line-height:1.5">
      🏀 NEW CAMPER REGISTRATION 🏀<br/>
      <span style="font-size:15px;letter-spacing:1px;color:#7c2d12">CONGRATULATIONS — WE ARE EXCITED TO SEE YOU AT CAMP!</span>
    </div>
  </td></tr>

  <!-- ── HEADER ── -->
  <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1d4ed8 60%,#4f46e5 100%);padding:0;position:relative">
    <!-- Top bar -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:30px 36px 0">
        <!-- Logo + Brand -->
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:middle;padding-right:16px">
              <img src="https://www.hilhiyouthbbx.com/logo.png" alt="Hilhi Logo" width="64" height="64"
                style="display:block;border-radius:12px;border:3px solid rgba(255,255,255,0.3)" />
            </td>
            <td style="vertical-align:middle">
              <div style="color:#ffffff;font-size:22px;font-weight:900;letter-spacing:-0.5px;line-height:1.1">HILHI YOUTH</div>
              <div style="color:#93c5fd;font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase">Basketball · Hillsboro, OR</div>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- Hero text -->
      <tr><td style="padding:28px 36px 0;text-align:center">
        <div style="display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:30px;padding:6px 18px;margin-bottom:16px">
          <span style="color:#bfdbfe;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">✅ Registration Confirmed</span>
        </div>
        <h1 style="color:#ffffff;margin:0 0 10px;font-size:32px;font-weight:900;letter-spacing:-1px;line-height:1.1">
          You're All Set,<br/>${parentFirstName}! 🎉
        </h1>
        <p style="color:#bfdbfe;margin:0;font-size:16px;line-height:1.5">
          Welcome to the <strong style="color:#ffffff">2026 Hilhi Youth Basketball Camp</strong>.<br/>
          We can't wait to see you on the court!
        </p>
      </td></tr>

      <!-- Basketball court graphic strip -->
      <tr><td style="padding:28px 0 0;text-align:center">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.25);border-top:2px solid rgba(255,255,255,0.1)">
          <tr>
            <td width="33%" style="padding:16px;text-align:center;border-right:1px solid rgba(255,255,255,0.1)">
              <div style="color:#fbbf24;font-size:22px">📅</div>
              <div style="color:#ffffff;font-size:13px;font-weight:700;margin-top:4px">June 22–25</div>
              <div style="color:#93c5fd;font-size:11px">2026</div>
            </td>
            <td width="33%" style="padding:16px;text-align:center;border-right:1px solid rgba(255,255,255,0.1)">
              <div style="color:#fbbf24;font-size:22px">⏰</div>
              <div style="color:#ffffff;font-size:13px;font-weight:700;margin-top:4px">9 AM – 3 PM</div>
              <div style="color:#93c5fd;font-size:11px">Drop-off 8:45 AM</div>
            </td>
            <td width="33%" style="padding:16px;text-align:center">
              <div style="color:#fbbf24;font-size:22px">📍</div>
              <div style="color:#ffffff;font-size:13px;font-weight:700;margin-top:4px">Hillsboro HS</div>
              <div style="color:#93c5fd;font-size:11px">Main Gymnasium</div>
            </td>
          </tr>
        </table>
      </td></tr>

    </table>
  </td></tr>

  <!-- ── BODY ── -->
  <tr><td style="background:#ffffff;padding:36px">

    <!-- Camper(s) heading -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px">
      <tr>
        <td><span style="font-size:13px;font-weight:800;color:#0f172a;text-transform:uppercase;letter-spacing:1px">🏅 Registered Camper${campers.length > 1 ? "s" : ""}</span></td>
        <td align="right"><span style="background:#dcfce7;color:#15803d;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px">${campers.length} Camper${campers.length > 1 ? "s" : ""}</span></td>
      </tr>
    </table>

    <!-- Camper table -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;margin-bottom:28px">
      <tr style="background:#f8faff">
        <th style="padding:10px 20px;text-align:left;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Name</th>
        <th style="padding:10px 20px;text-align:center;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Grade</th>
        <th style="padding:10px 20px;text-align:center;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Gender</th>
        <th style="padding:10px 20px;text-align:center;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Shirt</th>
      </tr>
      ${camperRows}
    </table>

    <!-- Payment receipt box -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:2px solid #86efac;border-radius:14px;margin-bottom:28px">
      <tr><td style="padding:20px 24px">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <div style="font-size:12px;color:#166534;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">💳 Payment Receipt</div>
              ${refLine ? `<div style="margin-top:4px">${refLine}</div>` : ""}
            </td>
            <td align="right">
              <div style="font-size:13px;color:#166534;font-weight:600">${isFree ? "Registration Fee" : "Amount Paid"}</div>
              <div style="font-size:28px;font-weight:900;color:#15803d;letter-spacing:-1px">${isFree ? "FREE" : `$${total}`}</div>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>

    <!-- What to bring -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:14px;margin-bottom:28px">
      <tr><td style="padding:20px 24px">
        <div style="font-size:12px;color:#92400e;font-weight:800;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px">🎒 What to Bring</div>
        <table cellpadding="0" cellspacing="0">
          <tr><td style="padding:4px 0;color:#78350f;font-size:14px">👟</td><td style="padding:4px 0 4px 10px;color:#1e293b;font-size:14px;font-weight:600">Basketball shoes &amp; athletic clothing</td></tr>
          <tr><td style="padding:4px 0;color:#78350f;font-size:14px">💧</td><td style="padding:4px 0 4px 10px;color:#1e293b;font-size:14px;font-weight:600">Water bottle (labeled with your name)</td></tr>
          <tr><td style="padding:4px 0;color:#78350f;font-size:14px">🍎</td><td style="padding:4px 0 4px 10px;color:#1e293b;font-size:14px;font-weight:600">Morning snack</td></tr>
          <tr><td style="padding:4px 0;color:#78350f;font-size:14px">👕</td><td style="padding:4px 0 4px 10px;color:#1e293b;font-size:14px;font-weight:600">Camp T-shirt provided at check-in</td></tr>
        </table>
      </td></tr>
    </table>

    <!-- Hype banner -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1d4ed8,#7c3aed);border-radius:14px;margin-bottom:28px">
      <tr><td style="padding:24px;text-align:center">
        <div style="font-size:28px;margin-bottom:8px">🏀 🌟 🏆</div>
        <p style="margin:0;color:#ffffff;font-size:17px;font-weight:800;line-height:1.4">
          We are SO excited to have your camper with us!<br/>
          <span style="color:#bfdbfe;font-weight:600;font-size:15px">This is going to be an amazing week. Let's get to work! 💪</span>
        </p>
      </td></tr>
    </table>

    <!-- Contact -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="text-align:center">
        <p style="color:#64748b;font-size:14px;line-height:1.8;margin:0">
          Questions? We're here to help!<br/>
          📧 <a href="mailto:info@hilhiyouthbbx.com" style="color:#1d4ed8;font-weight:600;text-decoration:none">info@hilhiyouthbbx.com</a>
          &nbsp;&nbsp;·&nbsp;&nbsp;
          📞 <a href="tel:9715630552" style="color:#1d4ed8;font-weight:600;text-decoration:none">971-563-0552</a>
        </p>
      </td></tr>
    </table>

  </td></tr>

  <!-- ── FOOTER ── -->
  <tr><td style="background:#0f172a;padding:24px 36px">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <img src="https://www.hilhiyouthbbx.com/logo.png" alt="Hilhi" width="36" height="36"
            style="display:block;border-radius:8px;opacity:0.8" />
        </td>
        <td style="text-align:right">
          <div style="color:#94a3b8;font-size:12px;line-height:1.8">
            Hilhi Youth Basketball · Hillsboro, OR<br/>
            <a href="https://www.hilhiyouthbbx.com" style="color:#60a5fa;text-decoration:none;font-weight:600">hilhiyouthbbx.com</a>
          </div>
        </td>
      </tr>
    </table>
  </td></tr>

</table>
</td></tr>
</table>

</body>
</html>`;
}

export function campAdminNotificationHtml(opts: {
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  campers: Array<{ name: string; grade: string; gender: string; shirtSize: string }>;
  total: string;
  paymentId?: string;
  orderNumber?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}) {
  const camperRows = opts.campers.map(c =>
    `<tr>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#0f172a">${c.name}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:center;color:#475569">${c.grade}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:center;color:#475569">${c.gender}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:700;color:#c2410c">${c.shirtSize}</td>
    </tr>`
  ).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:20px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto">

  <!-- Top Banner -->
  <tr><td style="background:linear-gradient(90deg,#fbbf24,#f59e0b,#fbbf24);padding:14px 24px;text-align:center;border-radius:12px 12px 0 0">
    <div style="font-size:13px;font-weight:900;color:#1c1917;letter-spacing:2px;text-transform:uppercase;line-height:1.6">
      🏀 NEW CAMPER REGISTRATION 🏀<br/>
      <span style="font-size:14px;letter-spacing:1px;color:#7c2d12">CONGRATULATIONS — WE ARE EXCITED TO SEE YOU AT CAMP!</span>
    </div>
  </td></tr>

  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#0f172a,#1d4ed8);padding:24px 28px">
    <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-right:14px;vertical-align:middle">
          <img src="https://www.hilhiyouthbbx.com/logo.png" alt="Hilhi" width="48" height="48" style="display:block;border-radius:8px"/>
        </td>
        <td style="vertical-align:middle">
          <div style="color:#ffffff;font-size:18px;font-weight:800">✅ New Camp Registration</div>
          <div style="color:#93c5fd;font-size:13px;margin-top:2px">Payment Received — Admin Notification</div>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Body -->
  <tr><td style="background:#ffffff;padding:28px;border-radius:0 0 12px 12px">

    <!-- Parent info -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8faff;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:20px">
      <tr><td style="padding:16px 20px">
        <div style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">Parent / Guardian</div>
        <table cellpadding="0" cellspacing="0">
          <tr><td style="color:#64748b;font-size:13px;width:130px;padding:3px 0">Name</td><td style="color:#0f172a;font-weight:600;font-size:13px;padding:3px 0">${opts.parentName}</td></tr>
          <tr><td style="color:#64748b;font-size:13px;padding:3px 0">Email</td><td style="font-size:13px;padding:3px 0"><a href="mailto:${opts.parentEmail}" style="color:#1d4ed8">${opts.parentEmail}</a></td></tr>
          <tr><td style="color:#64748b;font-size:13px;padding:3px 0">Phone</td><td style="color:#0f172a;font-weight:600;font-size:13px;padding:3px 0">${opts.parentPhone}</td></tr>
          ${opts.emergencyContact ? `<tr><td style="color:#64748b;font-size:13px;padding:3px 0">Emergency</td><td style="color:#0f172a;font-weight:600;font-size:13px;padding:3px 0">${opts.emergencyContact} · ${opts.emergencyPhone}</td></tr>` : ""}
        </table>
      </td></tr>
    </table>

    <!-- Campers table -->
    <div style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Registered Campers</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:20px">
      <tr style="background:#f1f5f9">
        <th style="padding:8px 14px;text-align:left;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.5px">Camper</th>
        <th style="padding:8px 14px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.5px">Grade</th>
        <th style="padding:8px 14px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.5px">Gender</th>
        <th style="padding:8px 14px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.5px">Shirt</th>
      </tr>
      ${camperRows}
      <tr style="background:#dcfce7">
        <td colspan="3" style="padding:12px 14px;font-weight:700;color:#15803d">Total Paid</td>
        <td style="padding:12px 14px;font-weight:800;color:#15803d;font-size:16px;text-align:center">$${opts.total}</td>
      </tr>
    </table>

    <!-- IDs -->
    ${opts.orderNumber ? `<p style="color:#94a3b8;font-size:12px;margin:0 0 4px">Order #: <span style="font-family:monospace;color:#475569">${opts.orderNumber}</span></p>` : ""}
    ${opts.paymentId ? `<p style="color:#94a3b8;font-size:12px;margin:0">Payment ID: <span style="font-family:monospace;color:#475569">${opts.paymentId}</span></p>` : ""}

  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:16px 0;text-align:center">
    <p style="color:#94a3b8;font-size:12px;margin:0">
      Hilhi Youth Basketball · <a href="https://www.hilhiyouthbbx.com" style="color:#60a5fa">hilhiyouthbbx.com</a>
    </p>
  </td></tr>

</table>
</body>
</html>`;
}
