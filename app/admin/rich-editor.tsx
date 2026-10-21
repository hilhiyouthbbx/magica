"use client";

// Small rich-text editor for the Email Blast message. Keeps bold / italic / underline / links /
// bullet lists when you paste from Gmail, Google Docs, Word, etc. (a plain <textarea> throws all
// of that away). The editor's HTML is sanitized again on the server before anything is emailed.

import { useEffect, useRef } from "react";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Plain text -> editor HTML. If the string already looks like HTML it is returned unchanged
 *  (so drafts saved before the rich editor existed still load). */
export function plainToHtml(text: string): string {
  if (!text) return "";
  if (/^\s*<(p|div|ul|ol|strong|b|em|i|u|a|br)\b/i.test(text)) return text;
  return text
    .split(/\n\s*\n/)
    .map(p => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function isHtmlEmpty(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;|\s/g, "") === "";
}

const BLOCKS = new Set(["P", "DIV", "UL", "OL", "LI", "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE", "TABLE", "TR"]);
const SKIP = new Set(["SCRIPT", "STYLE", "META", "TITLE", "LINK", "HEAD", "XML"]);

/** Converts pasted HTML (Docs/Word/Gmail/web) into the small set of tags we keep. */
function cleanPaste(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");

  const walk = (node: Node): string => {
    if (node.nodeType === 3) {
      const t = node.textContent || "";
      if (!t.trim()) {
        const el = node as Text;
        const prev = el.previousSibling as HTMLElement | null;
        const next = el.nextSibling as HTMLElement | null;
        const parent = el.parentElement;
        const pt = parent?.tagName || "BODY";
        if (pt === "BODY" || pt === "UL" || pt === "OL" || (prev && BLOCKS.has(prev.tagName)) || (next && BLOCKS.has(next.tagName)) || (!prev && !next)) return "";
      }
      return esc(t.replace(/[\r\n\t]+/g, " "));
    }
    if (node.nodeType !== 1) return "";
    const el = node as HTMLElement;
    const tag = el.tagName;
    if (SKIP.has(tag)) return "";
    const inner = () => Array.from(el.childNodes).map(walk).join("");
    const fw = (el.style?.fontWeight || "").toLowerCase();
    const weightBold = fw === "bold" || fw === "bolder" || (parseInt(fw, 10) >= 600);
    const weightNormal = fw === "normal" || fw === "lighter" || (fw !== "" && parseInt(fw, 10) < 600);

    if (tag === "BR") return "<br>";
    if (tag === "P" || tag === "DIV" || tag === "BLOCKQUOTE") {
      const c = inner();
      return c.trim() === "" ? "<p><br></p>" : `<p>${c}</p>`;
    }
    if (/^H[1-6]$/.test(tag)) return `<p><strong>${inner()}</strong></p>`;
    if (tag === "UL" || tag === "OL") return `<${tag.toLowerCase()}>${inner()}</${tag.toLowerCase()}>`;
    if (tag === "LI") return `<li>${inner()}</li>`;
    if (tag === "A") {
      const href = (el.getAttribute("href") || "").trim();
      const c = inner();
      return /^(https?:\/\/|mailto:)/i.test(href) ? `<a href="${esc(href).replace(/"/g, "&quot;")}">${c}</a>` : c;
    }

    let c = inner();
    if (c === "") return "";
    const isBold = (tag === "B" || tag === "STRONG") ? !weightNormal : weightBold;
    const isItalic = tag === "I" || tag === "EM" || (el.style?.fontStyle || "") === "italic";
    const isUnder = tag === "U" || ((el.style?.textDecoration || "").includes("underline"));
    if (isUnder) c = `<u>${c}</u>`;
    if (isItalic) c = `<em>${c}</em>`;
    if (isBold) c = `<strong>${c}</strong>`;
    return c;
  };

  return Array.from(doc.body.childNodes).map(walk).join("");
}

function ToolButton({ label, title, onClick, children }: { label: string; title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={title}
      onMouseDown={e => e.preventDefault()} onClick={onClick}
      className="min-w-[32px] h-8 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors">
      {children}
    </button>
  );
}

export function RichEditor({ value, onChange, placeholder }: { value: string; onChange: (html: string) => void; placeholder?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  // Push external changes (initial draft, "Clear draft") into the editor without disturbing the
  // caret while the user is typing (typing already keeps innerHTML === value).
  useEffect(() => {
    const el = ref.current;
    if (el && el.innerHTML !== value) el.innerHTML = value;
  }, [value]);

  function emit() {
    const el = ref.current;
    if (!el) return;
    let html = el.innerHTML;
    if (html === "<br>" || html === "<p><br></p>" || html === "<div><br></div>") { el.innerHTML = ""; html = ""; }
    onChange(html);
  }

  function exec(cmd: string, arg?: string) {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    emit();
  }

  function addLink() {
    const sel = window.getSelection();
    const saved = sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
    const url = window.prompt("Link address (e.g. https://www.hilhiyouthbbx.com/tryout):", "https://");
    if (!url || !/^(https?:\/\/|mailto:)/i.test(url.trim())) return;
    ref.current?.focus();
    if (saved) { sel?.removeAllRanges(); sel?.addRange(saved); }
    document.execCommand("createLink", false, url.trim());
    emit();
  }

  function onPaste(e: React.ClipboardEvent<HTMLDivElement>) {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");
    const clean = html ? cleanPaste(html) : plainToHtml(text);
    document.execCommand("insertHTML", false, clean || esc(text));
    emit();
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        <ToolButton label="Bold" title="Bold (Ctrl+B)" onClick={() => exec("bold")}><span className="font-black">B</span></ToolButton>
        <ToolButton label="Italic" title="Italic (Ctrl+I)" onClick={() => exec("italic")}><span className="italic font-serif">I</span></ToolButton>
        <ToolButton label="Underline" title="Underline (Ctrl+U)" onClick={() => exec("underline")}><span className="underline">U</span></ToolButton>
        <ToolButton label="Bullet list" title="Bulleted list" onClick={() => exec("insertUnorderedList")}>• List</ToolButton>
        <ToolButton label="Numbered list" title="Numbered list" onClick={() => exec("insertOrderedList")}>1. List</ToolButton>
        <ToolButton label="Link" title="Add a link to the selected text" onClick={addLink}>🔗 Link</ToolButton>
        <ToolButton label="Clear formatting" title="Remove formatting from the selected text" onClick={() => exec("removeFormat")}>Clear</ToolButton>
        <ToolButton label="Insert first name" title="Insert {{name}} — replaced with each contact's first name" onClick={() => exec("insertText", "{{name}}")}>+ First name</ToolButton>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Email message"
        data-placeholder={placeholder}
        onInput={emit}
        onBlur={emit}
        onPaste={onPaste}
        onFocus={() => { try { document.execCommand("defaultParagraphSeparator", false, "p"); } catch { /* ignore */ } }}
        className="w-full min-h-[220px] max-h-[420px] overflow-y-auto px-3 py-2.5 rounded-xl bg-white text-gray-800 border border-white/15 text-[15px] leading-relaxed focus:outline-none focus:border-blue-500 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:whitespace-pre-line [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_a]:text-blue-600 [&_a]:underline [&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_u]:underline"
      />
    </div>
  );
}
