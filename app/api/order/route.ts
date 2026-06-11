import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { saveContact } from "@/lib/contacts";

interface OrderItem {
  name:  string;
  size:  string;
  qty:   number;
  price: number;
}

interface OrderBody {
  name:   string;
  email:  string;
  phone?: string;
  notes?: string;
  items:  OrderItem[];
  total:  string;
}

export async function POST(req: NextRequest) {
  try {
    const body: OrderBody = await req.json();
    const { name, email, phone, notes, items, total } = body;

    if (!name || !email || !items?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ── Save customer contact ────────────────────────────────────────────
    try {
      const itemSummary = items.map(i => `${i.name} (${i.size}×${i.qty})`).join(", ");
      await saveContact({
        name,
        email,
        phone:  phone || "",
        source: "merch-order",
        notes:  `Order: ${itemSummary} — $${total}`,
      });
    } catch (err) {
      console.error("Contact save error:", err);
    }

    // ── Build email HTML ─────────────────────────────────────────────────
    const rows = items.map(i => `
      <tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:10px 12px;font-size:14px;color:#111;">${i.name}</td>
        <td style="padding:10px 12px;font-size:14px;color:#374151;text-align:center;font-weight:600;">${i.size}</td>
        <td style="padding:10px 12px;font-size:14px;color:#374151;text-align:center;">${i.qty}</td>
        <td style="padding:10px 12px;font-size:14px;color:#1d4ed8;font-weight:700;text-align:right;">$${(i.price * i.qty).toFixed(2)}</td>
      </tr>`).join("");

    const html = `
<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:system-ui,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
    <div style="background:#1e3a8a;padding:28px 32px;">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;">🏀 New Merchandise Order</h1>
      <p style="margin:6px 0 0;color:#93c5fd;font-size:14px;">Hilhi Youth Basketball — Order Request</p>
    </div>
    <div style="padding:24px 32px;background:#f8fafc;border-bottom:1px solid #e5e7eb;">
      <h2 style="margin:0 0 12px;font-size:15px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.05em;">Customer</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:4px 0;font-size:14px;color:#6b7280;width:80px;">Name</td><td style="padding:4px 0;font-size:14px;color:#111;font-weight:600;">${name}</td></tr>
        <tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">Email</td><td style="padding:4px 0;font-size:14px;"><a href="mailto:${email}" style="color:#1d4ed8;">${email}</a></td></tr>
        ${phone ? `<tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">Phone</td><td style="padding:4px 0;font-size:14px;color:#111;">${phone}</td></tr>` : ""}
      </table>
    </div>
    <div style="padding:24px 32px;">
      <h2 style="margin:0 0 12px;font-size:15px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.05em;">Order Items</h2>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <thead><tr style="background:#f1f5f9;">
          <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;">Item</th>
          <th style="padding:10px 12px;text-align:center;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;">Size</th>
          <th style="padding:10px 12px;text-align:center;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;">Qty</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;">Price</th>
        </tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr style="background:#eff6ff;">
          <td colspan="3" style="padding:12px;font-size:15px;font-weight:700;color:#1e3a8a;">Estimated Total</td>
          <td style="padding:12px;font-size:18px;font-weight:900;color:#1d4ed8;text-align:right;">$${total}</td>
        </tr></tfoot>
      </table>
    </div>
    ${notes ? `<div style="padding:0 32px 24px;"><p style="margin:0;font-size:14px;color:#374151;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px;">${notes}</p></div>` : ""}
    <div style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:13px;color:#6b7280;">Reply to this email to confirm and arrange payment with <strong>${name}</strong>.</p>
    </div>
  </div>
</body></html>`;

    const transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST || "smtp.gmail.com",
      port:   Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from:    `"Hilhi Youth BBX Store" <${process.env.SMTP_USER}>`,
      to:      "info@hilhiyouthbbx.com",
      replyTo: email,
      subject: `New Merch Order – ${name} ($${total})`,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Order email error:", err);
    return NextResponse.json({ error: "Failed to send order" }, { status: 500 });
  }
}
