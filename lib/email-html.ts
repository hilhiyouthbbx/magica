// Turns the rich-text HTML typed/pasted into the admin Email Blast editor into safe, email-client
// friendly HTML. Only a small allow-list of formatting tags survives (bold, italic, underline,
// links, bullet/numbered lists, line breaks, paragraphs); every attribute is dropped except a
// validated http(s)/mailto link on <a>. Scripts/styles/everything else are removed.

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const P_STYLE  = "margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;";
const UL_STYLE = "margin:0 0 16px;padding-left:24px;font-size:15px;line-height:1.6;color:#374151;";
const LI_STYLE = "margin:0 0 6px;";
const A_STYLE  = "color:#2563eb;text-decoration:underline;";

type Entry = { src: string; open: string; close: string };

function weightIsBold(style: string): boolean | null {
  const m = /font-weight\s*:\s*([a-z0-9]+)/i.exec(style);
  if (!m) return null;
  const v = m[1].toLowerCase();
  if (v === "bold" || v === "bolder") return true;
  if (v === "normal" || v === "lighter") return false;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n >= 600 : null;
}

function cleanHref(attrs: string): string | null {
  const m = /href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs);
  const raw = (m?.[1] ?? m?.[2] ?? m?.[3] ?? "").trim().replace(/&amp;/gi, "&");
  if (!/^(https?:\/\/|mailto:)/i.test(raw)) return null;
  return raw.replace(/"/g, "%22").replace(/</g, "%3C").replace(/>/g, "%3E").replace(/&/g, "&amp;");
}

/** Sanitize + style rich HTML. Returns inner HTML (paragraphs/lists) ready to drop into the email body. */
export function sanitizeEmailHtml(input: string): string {
  const html = input
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|head|title|xml)\b[\s\S]*?<\/\1\s*>/gi, "");

  const out: string[] = [];
  let inP = false;          // an open <p>
  let listDepth = 0;
  let stack: Entry[] = [];  // open inline formatting

  const closeInline = () => {
    for (let i = stack.length - 1; i >= 0; i--) out.push(stack[i].close);
  };
  const openP = () => {
    if (inP) return;
    out.push(`<p style="${P_STYLE}">`);
    inP = true;
    for (const e of stack) out.push(e.open);   // formatting still open in the source carries on
  };
  const closeP = () => {
    if (!inP) return;
    for (let i = stack.length - 1; i >= 0; i--) out.push(stack[i].close);
    out.push("</p>");
    inP = false;
    // inline formatting that is still "open" in the source continues in the next paragraph
  };
  const ensureContainer = () => { if (listDepth === 0) openP(); };

  const pushInline = (src: string, tag: string | null, openTag?: string) => {
    if (tag === null) { stack.push({ src, open: "", close: "" }); return; }
    ensureContainer();
    const open = openTag ?? `<${tag}>`;
    stack.push({ src, open, close: `</${tag}>` });
    out.push(open);
  };
  const popInline = (src: string) => {
    let idx = -1;
    for (let i = stack.length - 1; i >= 0; i--) if (stack[i].src === src) { idx = i; break; }
    if (idx < 0) return;
    // close everything above and including the match, then re-open the ones above it
    for (let i = stack.length - 1; i >= idx; i--) out.push(stack[i].close);
    const above = stack.slice(idx + 1);
    stack = stack.slice(0, idx);
    for (const e of above) { stack.push(e); out.push(e.open); }
  };

  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>|([^<]+)|</g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    if (m[4] !== undefined || (!m[2] && m[0] === "<")) {
      let text = m[4] !== undefined ? m[4] : "&lt;";
      text = text.replace(/>/g, "&gt;").replace(/[\r\n\t]+/g, " ");
      if (!text) continue;
      // whitespace between block tags (not inside a paragraph) is just source formatting — ignore
      if (!text.trim() && (listDepth > 0 || !inP)) continue;
      ensureContainer();
      out.push(text);
      continue;
    }
    const closing = m[1] === "/";
    const tag = m[2].toLowerCase();
    const attrs = m[3] || "";

    switch (tag) {
      case "p": case "div": case "section": case "article": case "blockquote": case "tr": {
        if (listDepth > 0) break;
        if (closing) { closeP(); }
        else { closeP(); openP(); }
        break;
      }
      case "h1": case "h2": case "h3": case "h4": case "h5": case "h6": {
        if (listDepth > 0) break;
        if (closing) { popInline(tag); closeP(); }
        else { closeP(); openP(); pushInline(tag, "strong"); }
        break;
      }
      case "br": {
        if (closing) break;
        ensureContainer();
        out.push("<br/>");
        break;
      }
      case "ul": case "ol": {
        if (closing) {
          if (listDepth > 0) { closeInline(); stack = []; out.push(`</${tag}>`); listDepth--; }
        } else {
          closeP();
          out.push(`<${tag} style="${UL_STYLE}">`);
          listDepth++;
        }
        break;
      }
      case "li": {
        if (listDepth === 0) break;
        if (closing) { closeInline(); stack = []; out.push("</li>"); }
        else out.push(`<li style="${LI_STYLE}">`);
        break;
      }
      case "b": case "strong": {
        if (closing) { popInline(tag); break; }
        const w = weightIsBold(attrs);
        pushInline(tag, w === false ? null : "strong");
        break;
      }
      case "i": case "em": {
        if (closing) { popInline(tag); break; }
        pushInline(tag, "em");
        break;
      }
      case "u": {
        if (closing) { popInline(tag); break; }
        pushInline(tag, "u");
        break;
      }
      case "a": {
        if (closing) { popInline(tag); break; }
        const href = cleanHref(attrs);
        if (href) pushInline(tag, "a", `<a href="${href}" style="${A_STYLE}">`);
        else pushInline(tag, null);
        break;
      }
      case "span": case "font": {
        if (closing) { popInline(tag); break; }
        // Google Docs / Word / Gmail express bold & italic as inline styles on <span>.
        const style = /style\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrs);
        const st = (style?.[1] ?? style?.[2] ?? "");
        const bold = weightIsBold(st) === true;
        const ital = /font-style\s*:\s*italic/i.test(st);
        const und  = /text-decoration[^;]*underline/i.test(st);
        // represent a span as up to three nested real tags under one stack entry
        const opens = (bold ? "<strong>" : "") + (ital ? "<em>" : "") + (und ? "<u>" : "");
        const closes = (und ? "</u>" : "") + (ital ? "</em>" : "") + (bold ? "</strong>" : "");
        if (opens) {
          ensureContainer();
          stack.push({ src: tag, open: opens, close: closes });
          out.push(opens);
        } else pushInline(tag, null);
        break;
      }
      default:
        // unknown tag: drop the tag itself, keep its text content
        break;
    }
  }
  closeP();
  while (listDepth > 0) { out.push("</ul>"); listDepth--; }

  // trim empty leading/trailing paragraphs, keep interior ones as visible spacing
  const emptyP = new RegExp(`<p style="${P_STYLE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}">(?:\\s|<br/>|&nbsp;)*</p>`, "g");
  let result = out.join("");
  result = result.replace(emptyP, `<p style="${P_STYLE}">&nbsp;</p>`);
  const spacer = `<p style="${P_STYLE}">&nbsp;</p>`;
  while (result.startsWith(spacer)) result = result.slice(spacer.length);
  while (result.endsWith(spacer)) result = result.slice(0, -spacer.length);
  return result;
}

/** Plain text (blank line = new paragraph) -> the same styled HTML. Used for legacy `message` payloads. */
export function plainToEmailHtml(message: string): string {
  return message
    .split(/\n\s*\n/)
    .map(p => `<p style="${P_STYLE}">${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

/** True if the HTML has no visible text. */
export function htmlIsEmpty(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;|\s/g, "") === "";
}
