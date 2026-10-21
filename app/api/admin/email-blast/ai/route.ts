import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { sanitizeEmailHtml } from "@/lib/email-html";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function checkAuth(req: NextRequest) {
  const key      = req.nextUrl.searchParams.get("key") || "";
  const expected = process.env.ADMIN_PASSWORD || "hilhi-admin";
  return key === expected;
}

const SYSTEM = `You write email drafts for Coach Kem, who runs Hilhi Youth Basketball (youth camps, tryouts, tournaments and fundraisers for kids in Hillsboro, Oregon). The emails go to parents and guardians.

Voice: warm, upbeat, clear and brief — a coach talking to parents, not a corporation. Short paragraphs. Plain words. No hype, no filler, no emojis unless the coach asks for them.

Rules:
- Use ONLY the facts the coach gives you (dates, times, prices, places, links, deadlines). Never invent or guess any of them. If an important detail is missing, put it in square brackets like [time] or [location] so the coach can fill it in.
- Start with "Hi {{name}}," unless the coach says otherwise. {{name}} is replaced by each parent's first name when sent — keep it exactly as written.
- Put the key details a parent must not miss (dates, times, deadlines, prices, links) in bold.
- Use a short bulleted list only when listing 3 or more parallel details.
- End with a friendly sign-off, then "Coach Kem" and "Hilhi Youth Basketball" on separate lines (use <br> between them), unless the coach says otherwise.
- If the coach pastes an existing draft to improve: keep their meaning, facts, links and their bold text; fix clarity, tone, spelling and flow. Do not add new facts.

Output format — exactly this, nothing before or after:
SUBJECT: <a short, specific subject line, no quotes>
<blank line>
<the email body as simple HTML>

The HTML body may only use: <p>, <strong>, <em>, <u>, <br>, <ul>, <ol>, <li>, and <a href="https://...">. No other tags, no styles, no markdown.`;

interface Body {
  prompt?: string;
  current?: string;   // the existing message (HTML) for "improve" mode
  currentSubject?: string;
  mode?: "write" | "improve";
  tone?: string;
}

function htmlToText(html: string): string {
  return html
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      error: "AI writing isn't turned on yet. Add an ANTHROPIC_API_KEY in your Vercel project settings (Settings → Environment Variables), then redeploy.",
      code: "no_key",
    }, { status: 503 });
  }

  const body = (await req.json()) as Body;
  const prompt = (body.prompt || "").trim();
  const mode = body.mode === "improve" ? "improve" : "write";
  const current = body.current ? htmlToText(body.current) : "";

  if (mode === "write" && !prompt) {
    return NextResponse.json({ error: "Tell me what the email should say first." }, { status: 400 });
  }
  if (mode === "improve" && !current) {
    return NextResponse.json({ error: "Write or paste a draft in the Message box first, then I can improve it." }, { status: 400 });
  }
  if (prompt.length > 6000 || current.length > 20000) {
    return NextResponse.json({ error: "That's too long — please shorten it." }, { status: 400 });
  }

  const tone = (body.tone || "").trim().slice(0, 40);
  const parts: string[] = [];
  if (mode === "write") {
    parts.push(`Write a new email.\n\nWhat the coach wants to say:\n${prompt}`);
    if (current) parts.push(`(For reference, the coach's current draft — replace it unless the request says to build on it:\n${current})`);
  } else {
    parts.push(`Improve this draft.${prompt ? `\n\nSpecific instructions from the coach:\n${prompt}` : ""}\n\nCurrent subject: ${(body.currentSubject || "").trim() || "(none yet)"}\n\nCurrent draft:\n${current}`);
  }
  if (tone) parts.push(`Tone: ${tone}.`);

  const client = new Anthropic();
  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 8000,
      betas: ["server-side-fallback-2026-06-01"],
      fallbacks: [{ model: "claude-opus-4-8" }],
      output_config: { effort: "low" },
      system: SYSTEM,
      messages: [{ role: "user", content: parts.join("\n\n") }],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({ error: "The AI couldn't write that one. Try rewording what you want to say." }, { status: 422 });
    }
    const text = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map(b => b.text)
      .join("")
      .trim();
    if (!text) return NextResponse.json({ error: "The AI returned an empty draft. Please try again." }, { status: 502 });

    let subject = "";
    let bodyHtml = text;
    const m = /^\s*SUBJECT:\s*(.+?)\s*(?:\r?\n|$)/i.exec(text);
    if (m) {
      subject = m[1].replace(/^["']|["']$/g, "").trim();
      bodyHtml = text.slice(m[0].length).trim();
    }
    // Same allow-list sanitizer the sender uses, then drop the email-only inline styles so the
    // editor shows it with its own (matching) formatting.
    const html = sanitizeEmailHtml(bodyHtml).replace(/ style="[^"]*"/g, "");
    return NextResponse.json({ ok: true, subject, html });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: "The AI key was rejected. Check the ANTHROPIC_API_KEY value in Vercel.", code: "bad_key" }, { status: 502 });
    }
    if (e instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "The AI is busy right now — please try again in a minute." }, { status: 429 });
    }
    if (e instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `AI service error (${e.status}). Please try again.` }, { status: 502 });
    }
    return NextResponse.json({ error: "Something went wrong writing the draft. Please try again." }, { status: 500 });
  }
}
