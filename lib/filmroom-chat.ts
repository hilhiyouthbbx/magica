import fs   from "fs";
import path from "path";

const CHAT_FILE = path.join(process.cwd(), "data", "filmroom-chat.json");
const KV_KEY    = "hilhi_filmroom_chat";

const getRedisUrl   = () => process.env.KV_REST_API_URL   || process.env.UPSTASH_REDIS_REST_URL   || "";
const getRedisToken = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const hasKV         = () => !!(getRedisUrl() && getRedisToken());

async function getRedis() {
  const { Redis } = await import("@upstash/redis");
  return new Redis({ url: getRedisUrl(), token: getRedisToken() });
}

export interface ChatMessage {
  id:     string;
  name:   string;
  text:   string;
  sentAt: string; // ISO
}

async function readMessages(): Promise<ChatMessage[]> {
  if (hasKV()) {
    try { const r = await getRedis(); return (await r.get<ChatMessage[]>(KV_KEY)) ?? []; } catch { return []; }
  }
  if (!fs.existsSync(CHAT_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(CHAT_FILE, "utf8")); } catch { return []; }
}

async function writeMessages(msgs: ChatMessage[]): Promise<void> {
  if (hasKV()) { const r = await getRedis(); await r.set(KV_KEY, msgs); return; }
  const dir = path.dirname(CHAT_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CHAT_FILE, JSON.stringify(msgs, null, 2));
}

export async function getMessages(since?: string): Promise<ChatMessage[]> {
  const all = await readMessages();
  if (!since) return all.slice(-100);
  return all.filter(m => m.sentAt > since);
}

export async function addMessage(name: string, text: string): Promise<ChatMessage> {
  const all = await readMessages();
  const msg: ChatMessage = {
    id:     `cm-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    name:   name.trim(),
    text:   text.trim(),
    sentAt: new Date().toISOString(),
  };
  all.push(msg);
  // Keep last 200 messages
  await writeMessages(all.slice(-200));
  return msg;
}

export async function clearChat(): Promise<void> {
  await writeMessages([]);
}
