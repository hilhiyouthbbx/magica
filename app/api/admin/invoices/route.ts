import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import {
  getInvoices, upsertInvoice, setInvoiceStatus, deleteInvoice, markInvoiceSent,
  invoiceTotal, lineTotal, type Invoice, type InvoiceItem,
} from "@/lib/invoices";

export const dynamic = "force-dynamic";

function checkAuth(req: NextRequest) {
  const key      = req.nextUrl.searchParams.get("key") || "";
  const expected = process.env.ADMIN_PASSWORD || "hilhi-admin";
  return key === expected;
}

function escapeHtml(s: string): string {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

function invoiceHtml(inv: Invoice): string {
  const total = invoiceTotal(inv);
  const rows = inv.items.map(i => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111;text-align:center;">${Number(i.quantity) || 0}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111;">${escapeHtml(i.description)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111;text-align:right;">${money(Number(i.amount) || 0)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111;text-align:right;font-weight:700;">${money(lineTotal(i))}</td>
    </tr>`).join("");

  return `
<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:system-ui,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr>
          <td bgcolor="#1e3a8a" style="background-color:#1e3a8a;padding:24px 32px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="padding-right:16px;vertical-align:middle;">
                <img src="https://www.hilhiyouthbbx.com/spartan-head-white.png" alt="Hilhi Spartans" width="48" height="50" style="display:block;border:0;" />
              </td>
              <td style="vertical-align:middle;">
                <span style="display:inline-block;color:#ffffff !important;font-size:22px;font-weight:800;line-height:1.2;font-family:system-ui,sans-serif;">Hilhi Youth Basketball</span>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
              <tr>
                <td style="font-size:20px;font-weight:800;color:#111;">Invoice ${escapeHtml(inv.invoiceNumber)}</td>
                <td style="text-align:right;font-size:13px;color:#6b7280;">
                  Issued: ${escapeHtml(inv.issueDate)}${inv.dueDate ? `<br/>Due: ${escapeHtml(inv.dueDate)}` : ""}
                </td>
              </tr>
            </table>
            <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Bill to:</p>
            <p style="margin:0 0 20px;font-size:15px;color:#111;font-weight:700;">${escapeHtml(inv.organizationName)}${inv.contactName ? `<br/><span style="font-weight:400;color:#374151;">${escapeHtml(inv.contactName)}</span>` : ""}</p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
              <thead>
                <tr style="background:#f1f5f9;">
                  <th style="padding:10px 12px;text-align:center;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;width:60px;">Qty</th>
                  <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;">Memo</th>
                  <th style="padding:10px 12px;text-align:right;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;">Amount</th>
                  <th style="padding:10px 12px;text-align:right;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;">Total</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="padding:12px;text-align:right;font-size:14px;font-weight:700;color:#111;">Total</td>
                  <td style="padding:12px;text-align:right;font-size:16px;font-weight:800;color:#111;">${money(total)}</td>
                </tr>
              </tfoot>
            </table>

            ${inv.notes ? `<p style="margin:20px 0 0;font-size:13px;color:#6b7280;white-space:pre-line;">${escapeHtml(inv.notes)}</p>` : ""}

            <div style="margin-top:24px;padding:14px 18px;border-radius:8px;background:${inv.status === "paid" ? "#ecfdf5" : "#fffbeb"};border:1px solid ${inv.status === "paid" ? "#a7f3d0" : "#fde68a"};">
              <p style="margin:0;font-size:13px;font-weight:700;color:${inv.status === "paid" ? "#065f46" : "#92400e"};">
                ${inv.status === "paid" ? "✓ PAID" : "PAYMENT DUE"}
              </p>
            </div>
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

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const invoices = await getInvoices();
  return NextResponse.json({ invoices });
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  if (body.action === "save") {
    const { id, invoiceNumber, organizationName, contactName, contactEmail, items, notes, issueDate, dueDate, status } = body as {
      id?: string; invoiceNumber?: string; organizationName: string; contactName?: string; contactEmail: string;
      items: InvoiceItem[]; notes?: string; issueDate?: string; dueDate?: string; status?: "paid" | "unpaid";
    };
    if (!organizationName?.trim() || !contactEmail?.trim() || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Organization name, contact email, and at least one line item are required." }, { status: 400 });
    }
    const invoice = await upsertInvoice({
      id, invoiceNumber, organizationName: organizationName.trim(), contactName, contactEmail: contactEmail.trim(),
      items, notes, issueDate, dueDate, status,
    });
    return NextResponse.json({ ok: true, invoice });
  }

  // Renders the exact same HTML the real email uses, from whatever draft data is currently in
  // the compose form — no save required. Lets the admin see precisely what a recipient will get
  // (including the live PAID/PAYMENT DUE stamp) before ever hitting Send.
  if (body.action === "preview") {
    const draft = body.invoice as Partial<Invoice> & { items?: InvoiceItem[] };
    const previewInvoice: Invoice = {
      id: draft.id || "preview",
      invoiceNumber: draft.invoiceNumber || "INV-DRAFT",
      organizationName: draft.organizationName || "(Organization Name)",
      contactName: draft.contactName || "",
      contactEmail: draft.contactEmail || "",
      items: (draft.items && draft.items.length > 0) ? draft.items : [{ quantity: 1, description: "(line item)", amount: 0 }],
      notes: draft.notes || "",
      issueDate: draft.issueDate || new Date().toISOString().slice(0, 10),
      dueDate: draft.dueDate || "",
      status: draft.status === "paid" ? "paid" : "unpaid",
      createdAt: "", updatedAt: "",
    };
    return NextResponse.json({ ok: true, html: invoiceHtml(previewInvoice) });
  }

  if (body.action === "setStatus" && body.id && (body.status === "paid" || body.status === "unpaid")) {
    const ok = await setInvoiceStatus(body.id, body.status);
    return NextResponse.json({ ok });
  }

  if (body.action === "delete" && body.id) {
    await deleteInvoice(body.id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "send" && body.id) {
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    if (!smtpHost || !smtpUser || !smtpPass) {
      return NextResponse.json({ error: "Email not configured. Please add SMTP_HOST, SMTP_USER, SMTP_PASS to your Vercel environment variables." }, { status: 503 });
    }
    const all = await getInvoices();
    const invoice = all.find(i => i.id === body.id);
    if (!invoice) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });

    const transporter = nodemailer.createTransport({
      host: smtpHost, port: Number(process.env.SMTP_PORT || 587), secure: false,
      auth: { user: smtpUser, pass: smtpPass },
    });

    try {
      await transporter.sendMail({
        from:    `"Hilhi Youth Basketball" <${smtpUser}>`,
        to:      invoice.contactEmail,
        subject: `Invoice ${invoice.invoiceNumber} from Hilhi Youth Basketball — ${money(invoiceTotal(invoice))}`,
        html:    invoiceHtml(invoice),
      });
      await markInvoiceSent(invoice.id);
      return NextResponse.json({ ok: true });
    } catch (e) {
      return NextResponse.json({ error: `Send failed: ${String(e)}` }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
