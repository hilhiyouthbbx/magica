// ── Shared email helpers ───────────────────────────────────────────────────

export function campConfirmationHtml(opts: {
  parentFirstName: string;
  campers: Array<{ name: string; grade: string; gender: string; shirtSize: string }>;
  total: string;
  paymentId?: string;
  orderNumber?: string;
}) {
  const { parentFirstName, campers, total, paymentId, orderNumber } = opts;

  const camperRows = campers.map(c => `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#1e293b">${c.name}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;text-align:center;color:#475569">${c.grade} Grade</td>
      <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;text-align:center;color:#475569">${c.gender}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;text-align:center">
        <span style="background:#fff7ed;color:#c2410c;padding:3px 10px;border-radius:20px;font-weight:700;font-size:13px">${c.shirtSize}</span>
      </td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#1d4ed8 0%,#7c3aed 100%);border-radius:16px 16px 0 0;padding:40px 32px;text-align:center">
        <div style="font-size:48px;margin-bottom:8px">🏀</div>
        <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px">You're In! Registration Confirmed</h1>
        <p style="color:#bfdbfe;margin:12px 0 0;font-size:16px">2026 Hilhi Youth Basketball Camp</p>
      </td></tr>

      <!-- Body -->
      <tr><td style="background:#ffffff;padding:32px">

        <p style="color:#1e293b;font-size:18px;margin:0 0 8px">Hey ${parentFirstName}! 👋</p>
        <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 24px">
          We are <strong style="color:#1d4ed8">SO excited</strong> to have your camper joining us this summer!
          Get ready for an incredible week of basketball, teamwork, and memories that will last a lifetime.
          Your registration is confirmed and payment has been received. 🎉
        </p>

        <!-- Camp Info Box -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:2px solid #bfdbfe;border-radius:12px;margin-bottom:24px">
          <tr><td style="padding:20px 24px">
            <p style="margin:0 0 12px;font-weight:800;color:#1d4ed8;font-size:15px;text-transform:uppercase;letter-spacing:0.5px">📋 Camp Details</p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:4px 0;color:#64748b;font-size:14px;width:120px">📅 Dates</td>
                <td style="padding:4px 0;color:#1e293b;font-weight:600;font-size:14px">June 22–25, 2026</td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:#64748b;font-size:14px">⏰ Time</td>
                <td style="padding:4px 0;color:#1e293b;font-weight:600;font-size:14px">9:00 AM – 3:00 PM (Drop-off 8:45 AM)</td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:#64748b;font-size:14px">📍 Location</td>
                <td style="padding:4px 0;color:#1e293b;font-weight:600;font-size:14px">Hillsboro High School Gymnasium</td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:#64748b;font-size:14px">👟 Bring</td>
                <td style="padding:4px 0;color:#1e293b;font-weight:600;font-size:14px">Basketball shoes, water bottle, snack</td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:#64748b;font-size:14px">👕 Shirt</td>
                <td style="padding:4px 0;color:#1e293b;font-weight:600;font-size:14px">Included — provided at check-in</td>
              </tr>
            </table>
          </td></tr>
        </table>

        <!-- Camper Table -->
        <p style="font-weight:800;color:#1e293b;font-size:15px;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.5px">🏅 Registered Camper${campers.length > 1 ? "s" : ""}</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:24px">
          <tr style="background:#f8fafc">
            <th style="padding:10px 16px;text-align:left;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Camper</th>
            <th style="padding:10px 16px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Grade</th>
            <th style="padding:10px 16px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Gender</th>
            <th style="padding:10px 16px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Shirt</th>
          </tr>
          ${camperRows}
          <tr style="background:#f0fdf4">
            <td colspan="2" style="padding:12px 16px;font-weight:700;color:#15803d">✅ Total Paid</td>
            <td colspan="2" style="padding:12px 16px;text-align:center;font-weight:800;color:#15803d;font-size:18px">$${total}</td>
          </tr>
        </table>

        ${orderNumber ? `<p style="color:#94a3b8;font-size:13px;margin:0 0 4px">Order #: <span style="font-family:monospace">${orderNumber}</span></p>` : ""}
        ${paymentId ? `<p style="color:#94a3b8;font-size:13px;margin:0 0 24px">Payment ID: <span style="font-family:monospace">${paymentId}</span></p>` : ""}

        <!-- Hype message -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fef3c7,#fde68a);border-radius:12px;margin-bottom:24px">
          <tr><td style="padding:20px 24px;text-align:center">
            <p style="margin:0;font-size:20px">🏀 🌟 🏆</p>
            <p style="margin:8px 0 0;color:#92400e;font-weight:700;font-size:15px">
              We can't wait to see you on the court!<br/>
              This is going to be an AMAZING week. Let's get to work! 💪
            </p>
          </td></tr>
        </table>

        <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0">
          Questions? We're here to help!<br/>
          📧 <a href="mailto:info@hilhiyouthbbx.com" style="color:#1d4ed8">info@hilhiyouthbbx.com</a><br/>
          📞 <a href="tel:9715630552" style="color:#1d4ed8">971-563-0552</a>
        </p>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#1e293b;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center">
        <p style="color:#94a3b8;font-size:13px;margin:0">
          Hilhi Youth Basketball · Hillsboro, OR<br/>
          <a href="https://www.hilhiyouthbbx.com" style="color:#60a5fa;text-decoration:none">hilhiyouthbbx.com</a>
        </p>
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
    `<tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${c.name}</td>
     <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${c.grade}</td>
     <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${c.gender}</td>
     <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${c.shirtSize}</td></tr>`
  ).join("");

  return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <h2 style="color:#1d4ed8">✅ New Camp Registration — Payment Received</h2>
  <p><strong>Parent:</strong> ${opts.parentName}<br/>
  <strong>Email:</strong> ${opts.parentEmail}<br/>
  <strong>Phone:</strong> ${opts.parentPhone}<br/>
  ${opts.emergencyContact ? `<strong>Emergency:</strong> ${opts.emergencyContact} (${opts.emergencyPhone})` : ""}
  </p>
  ${opts.orderNumber ? `<p><strong>Order #:</strong> ${opts.orderNumber}</p>` : ""}
  ${opts.paymentId ? `<p><strong>Payment ID:</strong> ${opts.paymentId}</p>` : ""}
  <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;margin:16px 0">
    <tr style="background:#f1f5f9"><th>Camper</th><th>Grade</th><th>Gender</th><th>Shirt</th></tr>
    ${camperRows}
    <tr style="background:#dcfce7"><td colspan="3"><strong>Total Paid</strong></td><td><strong>$${opts.total}</strong></td></tr>
  </table>
</body></html>`;
}
